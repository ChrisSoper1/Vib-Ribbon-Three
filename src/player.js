/**
 * This is a generic stage for playing music and attaching visualizers
 */
import {getDefaultCamera, getDefaultRenderer, getPerspectiveCamera, loadAudio} from "./utils/helpers";
import {AmbientLight, Box3, Box3Helper, BoxHelper, OrthographicCamera, Scene, Vector3} from "three/src/Three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import {FrequencyPlaneVisualizer} from "./SonicVisualizer/FrequencyPlaneVisualizer";
import {SimpleAmplitudeVisualizer} from "./SonicVisualizer/SimpleAmplitudeVisualizer";
import {Pane} from "tweakpane";
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';

const DEFAULT_PARAMS = {
  audioState: 'closed',
  audioProgress: '0%',
  audioTime: 0,
  duration: 0,
  scale: 4,
  directions: {
    amplitude: 4,
    frequency: 4,
  },
  rotations: {
    amplitude: {x: 0, y: 0, z: 0},
    frequency: {x: 0, y: 0, z: 0},
  },
};

const ROTATE_VECTORS = [
  new Vector3(10, 0, -10),
  new Vector3(0, -10, 0),
  new Vector3(-10, 0, -10),
  new Vector3(10, 0, 0),
  new Vector3(0, 0, 10),
  new Vector3(-10, 0, 0),
  new Vector3(0, 10, -10),
  new Vector3(0, 10, 0),
  new Vector3(0, -10, -10),
];

export class BasicPlayer {
  fftSize = 128;

  constructor(params) {
    this.params = {...DEFAULT_PARAMS, ...params};
    this.buildControls();

    // Basics
    this.renderer = getDefaultRenderer();
    this.camera = getPerspectiveCamera();
    // this.camera = new OrthographicCamera(-128, 128, 128, -128, -10000, 10000);
    this.scene = new Scene();
    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.stats = new Stats();
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(this.stats.dom);
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Visualization-specific
    // positions - todo: set initial positions dynamically
    this.camera.position.set(64, 64, 64);
    this.controls.target.set(64, 64, 0); // camera direction
    this.controls.update();

    // globals
    this.audioContext = new AudioContext();

    const amplitudeVisualizer = this.amplitudeVisualizer = new SimpleAmplitudeVisualizer({});
    const frequencyVisualizer = this.frequencyVisualizer = new FrequencyPlaneVisualizer({});
    frequencyVisualizer.geometry.lookAt(this.scene.up);

    // Objects
    this.objects = [amplitudeVisualizer, frequencyVisualizer];
    this.objects.forEach(item => this.scene.add(item.mesh));
  }

  buildControls() {
    const pane = new Pane({title: 'Toolbox', expanded: true});
    pane.registerPlugin(EssentialsPlugin);

    const monitors = pane.addFolder({title: 'Telemetry', expanded: true});
    monitors.addMonitor(this.params, 'audioState', {label: 'Audio State'});
    monitors.addMonitor(this.params, 'audioProgress', {label: 'Progress'});
    monitors.addMonitor(this.params, 'audioTime', {label: 'Timestamp'});
    monitors.addMonitor(this.params, 'duration', {label: 'Song Length'});

    const controls = pane.addFolder({title: 'Controls', expanded: true});
    const controlTabGroup = controls.addTab({pages: [{title: 'basic'}, {title: 'advanced'}]});
    const basicTab = controlTabGroup.pages[0];
    const advancedTab = controlTabGroup.pages[1];

    basicTab.addInput(this.params.directions, 'amplitude', {
      view: 'radiogrid',
      groupName: 'amplitude',
      size: [3, 3],
      cells: (x, y) => ({
        title: [['NW', 'N', 'NE'], ['W', '*', 'E'], ['SW', 'S', 'SE']][y][x],
        value: [[0, 1, 2], [3, 4, 5], [6, 7, 8]][y][x],
      }),
    }).on('change', (ev) => {
      console.log(ROTATE_VECTORS[ev.value]);
      ROTATE_VECTORS[ev.value]
      this.amplitudeVisualizer.rotateByVector3(ROTATE_VECTORS[ev.value]);
    });

    basicTab.addSeparator();

    basicTab.addInput(this.params.directions, 'frequency', {
      view: 'radiogrid',
      groupName: 'frequency',
      size: [3, 3],
      cells: (x, y) => ({
        title: [['NW', 'N', 'NE'], ['W', '*', 'E'], ['SW', 'S', 'SE']][y][x],
        value: [[0, 1, 2], [3, 4, 5], [6, 7, 8]][y][x],
      }),
    }).on('change', (ev) => {
      console.log(ROTATE_VECTORS[ev.value]);
      ROTATE_VECTORS[ev.value]
      this.frequencyVisualizer.rotateByVector3(ROTATE_VECTORS[ev.value]);
    });

    advancedTab.addInput(this.params.rotations, 'amplitude', {
      label: 'Amplitude Plot Angle',
      x: {min: -1, max: 1, step: 0.5, inverted: true},
      y: {min: -1, max: 1, step: 0.5},
      z: {min: -1, max: 1, step: 0.5},
    }).on('change', ev => this.amplitudeVisualizer.rotate(ev.value.x, ev.value.y, ev.value.z));

    advancedTab.addInput(this.params.rotations, 'frequency', {
      label: 'Frequency Plot Angle',
      x: {min: -1, max: 1, step: 0.5, inverted: true},
      y: {min: -1, max: 1, step: 0.5},
      z: {min: -1, max: 1, step: 0.5},
    }).on('change', ev => this.frequencyVisualizer.rotate(ev.value.x, ev.value.y, ev.value.z));
  }

  animate() {
    try {
      this.controls.update();
      this.updateParams();
      this.update();
      this.renderer.render(this.scene, this.camera);
      this.stats.update();
      requestAnimationFrame(() => this.animate());
    } catch (error) {
      console.log(error);
      console.log("Broke");
    }
  }

  updateParams() {
    const timestamp = this.audioContext.getOutputTimestamp().contextTime;
    this.params.audioState = this.audioContext.state;
    this.params.audioTime = timestamp;
    this.params.audioProgress = `${((timestamp / this.params.duration) * 100).toFixed(2)}%`;
  }

  start(audioFile) {
    loadAudio(audioFile, this.audioContext, this.fftSize)
      .then(({source, _, analyzer, duration}) => {
        this.params.duration = duration;
        this.analyser = analyzer;
        this.source = source;
        this.source.start(0);
      })
      .then(() => this.animate());
  }

  update() {
    let fData = this.analyser.getFrequencyData();
    let tData = this.analyser.getTimeDomainData();
    this.objects.forEach(obj => obj.updateBase());
    this.objects[0].update(tData);
    this.objects[1].update(fData);
  }
}