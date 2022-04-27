import {
  AmbientLight,
  Clock,
  OrthographicCamera,
  sRGBEncoding,
  Scene,
  Vector3,
  WebGLRenderer,
  AudioLoader,
} from "three/src/Three";

import Stats from 'three/examples/jsm/libs/stats.module';
import {sharedDebugPanel} from "./utils/debug_panel";
import {VibRibbonControls} from "./controls";
import {loadLevel} from './levels';
import {Player} from "./player";

/**
 * A basic application for testing level rendering
 */
export class LevelTestApp {
  constructor() {

    // global settings registry - this should be passed into each component
    this.settings = {
      controls: {
        // these are KeyboardEvent.codes https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
        BLOCK: 'ArrowUp',
        PIT: 'ArrowDown',
        LOOP: 'ArrowLeft',
        WAVE: 'ArrowRight',
        PAUSE: 'Escape',
      },
      defaultSpeed: 10,
    };

    /** @type {Feature|null} */
    this.featureBuffer = null;

    // region boilerplate
    this.renderer = new WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth * 0.99, window.innerHeight * 0.95);
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    this.stats = Stats();
    document.body.appendChild(this.stats.dom);

    this.scene = new Scene();
    this.clock = new Clock();

    this.camera = new OrthographicCamera(0, 50, 20, -10, -10000, 10000);
    this.camera.position.set(0, 0, 5);
    this.camera.zoom = 0.2;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    // endregion

    // region controls
    this.paused = false;
    this.controls = new VibRibbonControls(this.settings);
    this.controls.enable();
    this.controls.addEventListener('pause', () => this.pause());
    this.controls.addEventListener('input', (event) => this.handleInput(event));
    // endregion

    // Set the stage
    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));

    this.vibri = new Player(this.settings.defaultSpeed);
    this.vibri.loaded.then(playerModel => this.scene.add(playerModel));

    this.level = loadLevel(this.settings.defaultSpeed);
    this.scene.add(this.level.generateMesh());
    this.audioContext = new AudioContext();
    this._songLoader = loadSong(this.level.song, this.audioContext);
    this._songLoader.then(source => this.song = source);
    this._audio_telemetry = {
      songPosition: 0,
      songDuration: 0,
    };

    // Configure dev info
    sharedDebugPanel.addLoggerCallback(() => this._debug(), 20);
    sharedDebugPanel.addLoggerCallback(() => this.controls._debug(), 10);
    sharedDebugPanel.enable();

  }

  start() {
    Promise.all([
      this.vibri.loaded,
      this._songLoader,
    ]).then(() => {
      this._audio_telemetry.songDuration = this.song.buffer.duration;
      this.song.start();
      this.animate();
    });
  }

  pause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.clock.stop();
    } else {
      this.clock.start();
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
        this.vibri.speed = 20;
        this.vibri.playerModel.setRotationFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
      } else if (inputs.WAVE) {
        this.vibri.changeAnimation("WALK");
        this.vibri.speed = 20;
        this.vibri.playerModel.setRotationFromAxisAngle(new Vector3(0, 1, 0), (3 * Math.PI) / 2);
      }
    }
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

      // Update camera
      this.camera.left = this.vibri.worldPos.x;
      this.camera.right = this.camera.left + 50;
      this.camera.updateProjectionMatrix();
    }

    // update debug info even if paused
    this._audio_telemetry.songPosition = this.audioContext.getOutputTimestamp().contextTime;
    sharedDebugPanel.update();

    // render even if paused (if eventually we have a pause screen)
    this.renderer.render(this.scene, this.camera);
  }

  _debug() {
    return `<table>
    <tr><th>Paused</th><td>${this.paused}</td></tr>
    <tr><td colspan="2"></td></tr>
    <tr><th>Vibri Posision</th><td>${this.vibri.worldPos.x.toFixed((3))}</td></tr>
    <tr><th>Song Position</th><td>${this._audio_telemetry.songPosition.toFixed(4)*10}</td></tr>
    <tr><th>Song Duration</th><td>${this._audio_telemetry.songDuration.toFixed(1)}</td></tr>
    </table>
    `;
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

