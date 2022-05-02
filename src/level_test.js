import {
  AmbientLight,
  Clock,
  sRGBEncoding,
  Scene,
  Vector3,
  WebGLRenderer,
  AudioLoader,
  MathUtils,
} from "three/src/Three";

import Stats from 'three/examples/jsm/libs/stats.module';
import {sharedDebugPanel} from "./utils/debug_panel";
import {VibRibbonControls} from "./controls";
import {loadLevel} from './levels';
import {Player} from "./player";
import {RailsCamera} from "./camera";
import {Pane} from "tweakpane";

/**
 * A basic application for testing level rendering
 */
export class LevelTestApp {

  // global settings registry - this should be passed into each component
  settings = {
    controls: {
      // these are KeyboardEvent.codes https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
      BLOCK: 'ArrowUp',
      PIT: 'ArrowDown',
      LOOP: 'ArrowLeft',
      WAVE: 'ArrowRight',
      PAUSE: 'Escape',
    },
    defaultSpeed: 20,
    cameraPos: {
      zoom: 1,
      phi:45,
      theta: 45,
    },
  };

  _telemetry = {
    timePositionLag: 0,
    songPosition: 0,
    songDuration: 0,
  };

  /** @type {Feature} */
  featureBuffer;

  constructor() {

    // region boilerplate
    this.renderer = new WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth * 0.99, window.innerHeight * 0.95);
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    this.stats = Stats();
    document.body.appendChild(this.stats.dom);

    // endregion

    // region controls
    this.paused = false;
    this.controls = new VibRibbonControls(this.settings);
    this.controls.enable();
    this.controls.addEventListener('pause', () => this.pause());
    this.controls.addEventListener('input', (event) => this.handleInput(event));
    // endregion

    // Set the stage
    this.scene = new Scene();
    this.clock = new Clock();
    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));

    // vibri
    this.vibri = new Player(this.settings.defaultSpeed);
    this.vibri.loaded.then(playerModel => this.scene.add(playerModel));

    // camera
    this.camera = new RailsCamera();

    // level
    this.level = loadLevel(this.settings.defaultSpeed);
    this.scene.add(this.level.generateMesh());

    // audio
    this.audioContext = new AudioContext();
    this._songLoader = loadSong(this.level.song, this.audioContext);
    this._songLoader.then(source => this.song = source);

    // telemetry and debugging
    this._position_debug_vector = new Vector3();
    sharedDebugPanel.addLoggerCallback(() => this._debug(), 20);
    sharedDebugPanel.addLoggerCallback(() => this.controls._debug(), 10);
    sharedDebugPanel.enable();
    this._init_pane();

  }

  start() {
    // Wait for the song and vibri to load (potentially also level in the future)
    Promise.all([
      this.vibri.loaded,
      this._songLoader,
    ]).then(() => {
      this._telemetry.songDuration = this.song.buffer.duration;
      // Move vibri to the start of the level
      this.vibri.playerModel.position.setX(
        this.audioContext.getOutputTimestamp().contextTime * this.settings.defaultSpeed,
      );
      this.song.start();
      this.animate();
    });
  }

  pause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.clock.stop();
      this.audioContext.suspend();
    } else {
      let songPos = this.audioContext.getOutputTimestamp().contextTime * this.settings.defaultSpeed;
      this.vibri.playerModel.position.setX(songPos);
      this.clock.start();
      this.audioContext.resume();
    }
  }

  handleInput(event) {
    if (!this.paused) {
      let inputs = event.target;
      if (inputs.BLOCK) {
        this.vibri.changeAnimation("RUN");
      } else if (inputs.PIT) {
        this.vibri.changeAnimation("IDLE");
        this.vibri.speed = 0;
      } else if (inputs.LOOP) {
        this.vibri.changeAnimation("WALK");
        this.vibri.speed = this.settings.defaultSpeed;
        this.vibri.playerModel.setRotationFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
      } else if (inputs.WAVE) {
        this.vibri.changeAnimation("WALK");
        this.vibri.speed = this.settings.defaultSpeed;
        this.vibri.playerModel.setRotationFromAxisAngle(new Vector3(0, 1, 0), (3 * Math.PI) / 2);
      }
    }
  }

  /**
   * Checks if the next feature has changed, then updates the buffer and triggers followup events.
   * TODO: consider finding a better name for this fn
   */
  checkFeatureBuffer() {

  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.render();
    this.stats.update();
  }

  render() {
    if (!this.paused) {
      // Get the time elapsed since the last frame, used for mixer update
      let timeDelta = this.clock.getDelta();

      // update vibri
      this.vibri.update(timeDelta);

      // update camera
      this.camera.update(this.vibri);
    }

    // update debug info even if paused
    sharedDebugPanel.update();

    // render even if paused (if eventually we have a pause screen)
    this.renderer.render(this.scene, this.camera);
  }

  _debug() {
    let songPos = this.audioContext.getOutputTimestamp().contextTime * this.settings.defaultSpeed;
    this._position_debug_vector.copy(this.vibri.playerModel.position);
    this._position_debug_vector.setX(songPos);
    this._telemetry.songPosition = this.audioContext.getOutputTimestamp().contextTime;
    this._telemetry.timePositionLag = this._position_debug_vector.distanceTo(this.vibri.playerModel.position);

    return `<table>
    <tr><th>Paused</th><td>${this.paused}</td></tr>
    <tr><td colspan="2"></td></tr>
    <tr><th>Song Duration</th><td>${this._telemetry.songDuration.toFixed(1)}</td></tr>
    <tr><th>Song Position</th><td>${this._telemetry.songPosition.toFixed(1)}</td></tr>
    <tr><th>Song Pos * Speed</th><td>${(this._telemetry.songPosition * this.settings.defaultSpeed).toFixed(3)}</td></tr>
    <tr><th>Vibri Pos</th><td>${this.vibri.worldPos.x.toFixed((3))}</td></tr>
    <tr><th>Vibri Pos Delta</th><td>${this._telemetry.timePositionLag.toFixed(3)}</td></tr>
    </table>
    `;
  }

  _init_pane() {
    this.pane = new Pane();

    this.pane.addInput(
      this.settings.cameraPos,
      'zoom',
      {min: 0, max: 10, step: 0.1},
    ).on('change', ev => {
      this.camera.zoom = ev.value;
      this.camera.updateProjectionMatrix();
    });

    this.pane.addInput(
      this.settings.cameraPos,
      'phi',
      {min: 1, max: 90, step: 1},
    ).on('change', ev => this.camera.spherical.phi = MathUtils.degToRad(ev.value));

    this.pane.addInput(
      this.settings.cameraPos,
      'theta',
      {min: 0, max: 359, step: 1},
    ).on('change', ev => this.camera.spherical.theta = MathUtils.degToRad(ev.value));

  }
}

function loadSong(audioFile, audioContext) {
  const loader = new AudioLoader();
  return new Promise(resolve => loader.load(audioFile, resolve))
    .then(buffer => {
      // noinspection JSCheckFunctionSignatures
      const source = new AudioBufferSourceNode(audioContext, {buffer: buffer});
      source.connect(audioContext.destination);
      return source;
    });
}

