/**
 * NOTE: I like this class based pattern for applications, it may be worth considering typescript to formalize it
 **/
import {
  AmbientLight,
  AnimationMixer,
  Audio as ThreeAudio,
  AudioLoader,
  AudioListener,
  AudioAnalyser,
  LuminanceFormat,
  RedFormat,
  DataTexture,
  ShaderMaterial,
  PlaneGeometry,
  Mesh,
  Clock,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three/src/Three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

const fftSize = 128;
const audioFile = './The Yabba.mp3';

// NOTE: Install the "GLSL Support" IDEA plugin for syntax highlighting
// language=GLSL
const vertex_shader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

// language=GLSL
const fragment_shader = `
    uniform sampler2D tAudioData;
    varying vec2 vUv;
    void main() {
        vec3 backgroundColor = vec3(0.125, 0.125, 0.125);
        vec3 color = vec3(1.0, 1.0, 0.0);
        float f = texture2D(tAudioData, vec2(vUv.x, 0.0)).r;
        float i = step(vUv.y, f) * step(f - 0.0125, vUv.y);
        gl_FragColor = vec4(mix(backgroundColor, color, i), 1.0);
    }
`;

export class SonicVisualizer {
  constructor() {
    this.renderer = new WebGLRenderer({antialias: true});
    this.renderer.setClearColor(0x000000);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth * 0.99, window.innerHeight * 0.95);
    document.body.appendChild(this.renderer.domElement);

    this.clock = new Clock();
    this.scene = new Scene();

    this.camera = new OrthographicCamera(0, 50, 20, -10, -1000, 1000);
    this.camera.position.set(0, 0, 5);
    this.camera.zoom = 0.2;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));

    this.audioLoaded = this.loadAudio();
  }

  start() {
    this.audioLoaded.then(() => this.animate());
  }

  loadAudio() {
    this.listener = new AudioListener();
    this.audio = new ThreeAudio(this.listener);
    this.audioFile = audioFile; // todo: make this an argument
    this.loader = new AudioLoader();

    let result = new Promise(resolve => this.loader.load(this.audioFile, resolve));

    result = result.then(buffer => {
      this.audio.setBuffer(buffer);
      this.audio.setLoop(true);
      this.audio.setVolume(0.5);
      this.audio.play();
    });

    this.analyser = new AudioAnalyser(this.audio, fftSize);
    const format = (this.renderer.capabilities.isWebGL2) ? RedFormat : LuminanceFormat;
    this.uniforms = {
      tAudioData: {value: new DataTexture(this.analyser.data, fftSize / 2, 1, format)},
    };

    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertex_shader,
      fragmentShader: fragment_shader,
    });

    this.geometry = new PlaneGeometry(1, 1);
    this.mesh = new Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    window.addEventListener('resize', () => this.renderer.setSize(window.innerWidth, window.innerHeight));
    return result;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Allow the controls to update the camera
    this.controls.update();

    // This looks like it updates the value by in this.uniforms by reference...
    this.analyser.getFrequencyData();
    this.uniforms.tAudioData.value.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }

}
