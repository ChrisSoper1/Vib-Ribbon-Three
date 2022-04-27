import {
  AmbientLight,
  Clock,
  OrthographicCamera,
  sRGBEncoding,
  Scene,
  Vector3,
  WebGLRenderer,
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
      defaultSpeed: 20,
    };

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

    // Variables which should be reused each animation cycle
    this.speed = 20;
    this.animation = null;

    // Configure dev info
    sharedDebugPanel.addLoggerCallback(() => this._debug(), 20);
    sharedDebugPanel.addLoggerCallback(() => this.controls._debug(), 10);
    sharedDebugPanel.enable();

    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));

    this.vibri = new Player(this.speed);

    this.modelLoaded = this.vibri.generatePlayerModel()
                           .then(playerModel => this.scene.add(playerModel));
    this.level = loadLevel();
    this.scene.add(this.level.generateMesh());
  }

  start() {
    this.modelLoaded.then(() => this.animate());
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
        // this.speed = 40; // fixing speed for now
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
    sharedDebugPanel.update();

    // render even if paused (if eventually we have a pause screen)
    this.renderer.render(this.scene, this.camera);
  }

  _debug() {
    return `<table>
    <tr><th>Paused</th><td>${this.paused}</td></tr>
    </table>`;
  }
}
