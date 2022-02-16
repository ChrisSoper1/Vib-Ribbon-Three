/**
 * This is a generic stage for playing music and attaching visualizers
 */
import {getDefaultCamera, getDefaultRenderer, getPerspectiveCamera, loadAudio} from "./utils/helpers";
import {AmbientLight, Box3, Box3Helper, BoxHelper, OrthographicCamera, Scene, Vector3} from "three/src/Three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {scaleSequential} from "d3-scale";
import {interpolateTurbo} from "d3-scale-chromatic";
import Stats from "three/examples/jsm/libs/stats.module";
import {FrequencyPlaneVisualizer} from "./SonicVisualizer/FrequencyPlaneVisualizer";
import {SimpleAmplitudeVisualizer} from "./SonicVisualizer/SimpleAmplitudeVisualizer";

export class BasicPlayer {
  fftSize = 128;

  constructor(params) {
    // Basics
    this.renderer = getDefaultRenderer();
    // this.camera = getDefaultCamera()
    // this.camera = getPerspectiveCamera();
    this.camera = new OrthographicCamera(-128, 128, 128, -128, -10000, 10000);
    this.scene = new Scene();
    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.stats = new Stats();
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(this.stats.dom);
    window.addEventListener('resize', () => this.renderer.setSize(window.innerWidth, window.innerHeight));

    // Visualization-specific
    // positions - todo: set initial positions dynamically
    this.camera.position.set(64, 64, 64);
    this.controls.target.set(64, 64, 0); // camera direction
    this.controls.update();

    // globals
    this.colorMap = new scaleSequential(interpolateTurbo).domain([-1, 256]);
    this.audioContext = new AudioContext();

    const amplitudeVisualizer = new SimpleAmplitudeVisualizer({});
    const frequencyVisualizer = new FrequencyPlaneVisualizer({});
    frequencyVisualizer.geometry.lookAt(this.scene.up);
    const bbox = new Box3().copy(amplitudeVisualizer.boundingBox);
    bbox.expandByObject(frequencyVisualizer.mesh);
    const globalCenter = new Vector3();
    bbox.getCenter(globalCenter);
    // this.camera.position.copy(globalCenter)
    console.log(globalCenter);

    // Objects
    this.objects = [amplitudeVisualizer, frequencyVisualizer];
    this.objects.forEach(item => this.scene.add(item.mesh));
  }

  animate() {
    try {
      this.controls.update();
      this.update();
      this.renderer.render(this.scene, this.camera);
      this.stats.update();
      requestAnimationFrame(() => this.animate());
    } catch (error) {
      console.log(error);
      console.log("Broke");
    }
  }

  start(audioFile) {
    loadAudio(audioFile, this.audioContext, this.fftSize)
      .then(({source, _, analyzer}) => {
        this.analyser = analyzer;
        this.source = source;
        this.source.start(0);
      })
      .then(() => this.animate());
  }

  update() {
    let fData = this.analyser.getFrequencyData();
    let tData = this.analyser.getTimeDomainData();
    this.objects[0].update(tData);
    this.objects[1].update(fData);
  }
}