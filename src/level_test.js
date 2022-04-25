import {
  AmbientLight,
  AnimationMixer,
  Clock,
  OrthographicCamera,
  sRGBEncoding,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three/src/Three";

import Stats from 'three/examples/jsm/libs/stats.module';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import MODEL_FILE from './assets/Soldier.glb';
import {sharedDebugPanel} from "./utils/debug_panel";
import {VibRibbonControls} from "./controls";
import {loadLevel} from './levels';


export class LevelTestApp {
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
    this.controls = new VibRibbonControls();
    this.controls.enable();
    this.controls.addEventListener('pause', () => this.pause());
    this.controls.addEventListener('input', (event) => this.handleInput(event));
    // endregion

    // Variables which should be reused each animation cycle
    this.playerWorldPos = new Vector3();
    this.speed = 20;
    this.animation = null;

    // Configure dev info
    sharedDebugPanel.addLoggerCallback(() => this._debug(), 20);
    sharedDebugPanel.addLoggerCallback(() => this.controls._debug(), 10);
    sharedDebugPanel.enable();

    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));

    this.modelLoaded = this.generatePlayerModel();
    this.level = loadLevel(this.scene);
    // this.scene.add(this.level._meshes['BLOCK']);
    // this.generateExampleLevel();
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
        this._change_animation(this.runAction);
        this.speed = 40;
      } else if (inputs.PIT) {
        this._change_animation(this.idleAction);
        this.speed = 0;
      } else if (inputs.LOOP) {
        this._change_animation(this.walkAction);
        this.speed = 20;
        this.playerModel.setRotationFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
      } else if (inputs.WAVE) {
        this._change_animation(this.walkAction);
        this.speed = 20;
        this.playerModel.setRotationFromAxisAngle(new Vector3(0, 1, 0), (3 * Math.PI) / 2);
      }
    }
  }

  /**
   * I wanted to avoid making this method, please refactor it out ASAP, it does not belong here
   *
   * This mutates vibri's state, and should be a part of wherever that ends up.
   *
   * This is heavily influenced/inspired by
   * https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_blending.html
   **/
  _change_animation(newAction) {
    if (this.animation !== newAction) {
      newAction.enabled = true;
      newAction.setEffectiveTimeScale(1);
      newAction.setEffectiveWeight(1);
      newAction.play();
      this.animation.crossFadeTo(newAction, 1, true);
      this.animation = newAction;
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
      // console.log(timeDelta)

      // Update the animation mixer
      this.mixer.update(timeDelta);

      // update position
      this.playerModel.translateOnAxis(new Vector3(0, 0, -1), timeDelta * this.speed);

      // Update camera
      this.playerModel.getWorldPosition(this.playerWorldPos);
      this.camera.left = this.playerWorldPos.x;
      this.camera.right = this.camera.left + 50;
      this.camera.updateProjectionMatrix();
    }

    // update debug info even if paused
    sharedDebugPanel.update();

    // render even if paused (if eventually we have a pause screen)
    this.renderer.render(this.scene, this.camera);

  }

  generatePlayerModel() {
    const loader = new GLTFLoader();
    // convert callback to async by allowing promise to generate callback functions
    let result = new Promise(resolve => loader.load(MODEL_FILE, resolve));

    // Add a .then to the handling chain, and then set result to the new chain
    result = result.then(gltf => {
      this.playerModel = gltf.scene;
      this.playerModel.scale.set(10, 10, 10);
      this.playerModel.position.set(0, 0, 0);
      this.playerModel.lookAt(-1, 0, 0);
      this.scene.add(this.playerModel);

      this.playerModel.traverse(function (object) {
        if (object.isMesh) object.castShadow = true;
      });

      this.mixer = new AnimationMixer(this.playerModel);
      this.mixer.timeScale = 1;

      this.idleAction = this.mixer.clipAction(gltf.animations[0]);
      this.walkAction = this.mixer.clipAction(gltf.animations[3]);
      this.runAction = this.mixer.clipAction(gltf.animations[1]);

      // this.walkAction.play();
      this.animation = this.walkAction;
      this.animation.play();

      console.log("Model Loaded!");
    });

    // Return the promise for further processing
    return result;
  }

  _debug() {
    return `<table>
    <tr><th>Paused</th><td>${this.paused}</td></tr>
    </table>`;
  }

}
