/**
 * NOTE: I like this class based pattern for applications, it may be worth considering typescript to formalize it
 **/
import {
  AmbientLight,
  AnimationMixer,
  Audio as ThreeAudio,
  AudioLoader,
  AudioListener,
  LuminanceFormat,
  RedFormat,
  DataTexture,
  BufferAttribute,
  ShaderMaterial,
  PlaneGeometry,
  Mesh,
  Clock,
  OrthographicCamera,
  Scene,
  Points,
  BufferGeometry,
  PointsMaterial,
  Line,
  LineBasicMaterial,
  Vector3,
  WebGLRenderer,
} from "three/src/Three";

import {AudioAnalyser} from './AudioAnalyzer';

import {sharedDebugPanel} from "../utils/debug_panel";

const fftSize = 1024;
// const audioFile = './Sam_and_Dave-Hold_on_Im_coming.mp3';
const audioFile = './A History of Bad Men.mp3';

export class SonicVisualizer2 {
  constructor() {
    this.renderer = new WebGLRenderer({antialias: true});
    this.renderer.setClearColor(0x000000);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth * 0.99, window.innerHeight * 0.95);
    document.body.appendChild(this.renderer.domElement);

    this.scene = new Scene();

    this.camera = new OrthographicCamera(0, 512, 100, 0, -1000, 1000);
    this.camera.position.set(0, 0, 5);
    this.camera.zoom = 0.2;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));

    this.audioLoaded = this.loadAudio();


    this.geometry = new BufferGeometry();
    this.positionArray = new Uint8Array(fftSize / 2);
    this.positionAttribute = new BufferAttribute(this.positionArray, 3);
    this.geometry.setAttribute('position', this.positionAttribute);
    this.mesh = new Points(this.geometry, new PointsMaterial({"color": 0xFFFFFF, size: 5}));
    this.mesh.scale.set(4, 1, 1);
    this.scene.add(this.mesh);

    this.geometryT = new BufferGeometry();
    this.positionArrayT = new Uint8Array(fftSize);
    this.positionAttributeT = new BufferAttribute(this.positionArrayT, 3);
    this.geometryT.setAttribute('position', this.positionAttributeT);
    this.meshT = new Line(this.geometryT, new LineBasicMaterial({"color": 0xFFFF00}));
    // this.meshT = new Points(this.geometryT, new PointsMaterial({"color": 0xFFFF00}));
    this.meshT.scale.set(4, 1, 1);
    this.scene.add(this.meshT);

    window.addEventListener('resize', () => this.renderer.setSize(window.innerWidth, window.innerHeight));
  }

  start() {
    this.audioLoaded.then(() => this.animate());
  }

  loadAudio() {
    this.listener = new AudioListener();
    this.audio = new ThreeAudio(this.listener);
    this.audioContext = new AudioContext();

    this.audioFile = audioFile;
    this.loader = new AudioLoader();
    this.analyser = new AudioAnalyser(this.audioContext, fftSize);

    let result = new Promise(resolve => this.loader.load(this.audioFile, resolve))
      .then(buffer => {
        let source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.connect(this.analyser.analyser);
        source.start(0);
      });

    return result;
  }

  animate() {
    try {
      this.analyser.getTimeDomainData();
      this.analyser.getFrequencyData();
      this.analyser.updateSpectralFluxSamples();
      this.drawPoints();
      this.drawPointsT();
      sharedDebugPanel.update();
      //console.log(this.analyser.getAverageAmplitude());
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(() => this.animate());
    } catch (error){
      console.log(error);
      console.log("Broke");
    }
  }

  drawPoints() {
    this.positionArray = [];
    for (let i = 0; i < this.analyser.fData.length; i++) {
      this.positionArray.push(i);  // X
      this.positionArray.push(this.analyser.fData[i]);  // Y
      this.positionArray.push(0); // Z
    }
    let positionAttr = new BufferAttribute(new Uint8Array(this.positionArray), 3);
    this.geometry.setAttribute(
      'position',
      positionAttr,
    );
    this.geometry.computeBoundingSphere();
    this.geometry.computeBoundingBox();
    this.geometry.computeVertexNormals();
  }

  drawPointsT() {
    this.positionArrayT = [];
    for (let i = 0; i < this.analyser.tData.length; i++) {
      this.positionArrayT.push(i);  // X
      this.positionArrayT.push(this.analyser.tData[i]);  // Y
      this.positionArrayT.push(0); // Z
    }
    let positionAttr = new BufferAttribute(new Uint8Array(this.positionArrayT), 3);
    this.geometryT.setAttribute(
      'position',
      positionAttr,
    );
    this.geometryT.computeBoundingSphere();
    this.geometryT.computeBoundingBox();
    this.geometryT.computeVertexNormals();
  }
}
