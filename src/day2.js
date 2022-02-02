import {
  AmbientLight,
  AnimationMixer,
  Clock,
  PerspectiveCamera,
  OrthographicCamera,
  sRGBEncoding,
  Scene,
  SkeletonHelper,
  Vector3,
  WebGLRenderer,
} from "three/src/Three";

import Stats from 'three/examples/jsm/libs/stats.module';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {MapControls} from "three/examples/jsm/controls/OrbitControls";
import {sharedDebugPanel} from "./utils/debug_panel";

const solder_model = require('./assets/Soldier.glb');

import {
  BLOCK,
  BLOCKPIT,
  LINE,
  LOOP,
  PIT,
  WAVE,
  featureWidth,
} from './levels';

export class VibRibbonApplication {
  constructor() {

    // Variables which should be reused each animation cycle
    this.playerWorldPos = new Vector3();

    this.renderer = new WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth * 0.99, window.innerHeight * 0.95);
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    this.stats = Stats();
    document.body.appendChild(this.stats.dom);

    this.inputKeyCodes = {
      BLOCK: 'ArrowUp',
      PIT: 'ArrowDown',
      LOOP: 'ArrowLeft',
      WAVE: 'ArrowRight',
    };

    this.keysPressed = {
      BLOCK: false,
      PIT: false,
      LOOP: false,
      WAVE: false,
    };

    // controls
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => this.onKeyUp(event));

    this.clock = new Clock();
    this.scene = new Scene();
    this.camera = new OrthographicCamera(0, 50, 20, -10, -10000, 10000);

    this.camera.position.set(0, 0, 5);
    this.camera.zoom = 0.2;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));

    this.modelLoaded = this.generatePlayerModel();
    this.generateExampleLevel();
    sharedDebugPanel.addLoggerCallback(() => this.logControls());
    sharedDebugPanel.enable();
  }

  start() {
    this.modelLoaded.then(() => {
      this.animate();
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    // Get the time elapsed since the last frame, used for mixer update
    let timeDelta = this.clock.getDelta();

    // Update the animation mixer
    this.mixer.update(timeDelta);

    // update position
    this.playerModel.translateOnAxis(new Vector3(0, 0, -1), timeDelta * 20);

    // Update camera
    this.playerModel.getWorldPosition(this.playerWorldPos);
    this.camera.left = this.playerWorldPos.x;
    this.camera.right = this.camera.left + 50;
    this.camera.updateProjectionMatrix();

    sharedDebugPanel.update();
    this.renderer.render(this.scene, this.camera);
    this.stats.update();
  }

  onKeyDown(event) {
    let needsUpdate = false;
    switch (event.code) {
      case this.inputKeyCodes.BLOCK:
        this.keysPressed.BLOCK = true;
        needsUpdate = true;
        break;
      case this.inputKeyCodes.PIT:
        this.keysPressed.PIT = true;
        needsUpdate = true;
        break;
      case this.inputKeyCodes.LOOP:
        this.keysPressed.LOOP = true;
        needsUpdate = true;
        break;
      case this.inputKeyCodes.WAVE:
        this.keysPressed.WAVE = true;
        needsUpdate = true;
        break;
    }
    if (needsUpdate) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case this.inputKeyCodes.BLOCK:
        this.keysPressed.BLOCK = false;
        break;
      case this.inputKeyCodes.PIT:
        this.keysPressed.PIT = false;
        break;
      case this.inputKeyCodes.LOOP:
        this.keysPressed.LOOP = false;
        break;
      case this.inputKeyCodes.WAVE:
        this.keysPressed.WAVE = false;
        break;
    }
  }

  generateExampleLevel() {
    this.tempo = 100;
    for (let i = 0; i < 30; i++) {
      let obj;
      if (i === 11) {
        obj = BLOCK.clone();
      } else if (i === 13) {
        obj = PIT.clone();
      } else if (i === 15) {
        obj = LOOP.clone();
      } else if (i === 17) {
        obj = WAVE.clone();
      } else if (i === 19) {
        obj = BLOCKPIT.clone();
      } else {
        obj = LINE.clone();
      }
      this.scene.add(obj);
      obj.position.set((i * featureWidth), 0, 0);
    }
  }

  generatePlayerModel() {
    const loader = new GLTFLoader();
    // convert callback to async by allowing promise to generate callback functions
    let result = new Promise(resolve => loader.load('./Soldier.glb', resolve));

    // Add a .then to the handling chain, and then set result to the new chain
    result = result.then(gltf => {
      this.playerModel = gltf.scene;
      this.playerModel.scale.set(10, 10, 10);
      this.playerModel.position.set(0, 0, 0);
      this.playerModel.lookAt(-1, 0, 0);
      this.animations = gltf.animations;
      this.scene.add(this.playerModel);

      this.playerModel.traverse(function (object) {
        if (object.isMesh) object.castShadow = true;
      });

      this.mixer = new AnimationMixer(this.playerModel);
      this.mixer.timeScale = 1;

      this.idleAction = this.mixer.clipAction(this.animations[0]);
      this.walkAction = this.mixer.clipAction(this.animations[3]);
      this.runAction = this.mixer.clipAction(this.animations[1]);

      this.walkAction.play();
      // this.runAction.play();

      console.log("Model Loaded!");
    });

    // Return the promise for further processing
    return result;
  }

  logControls() {
    return `<table>
    <tr><th colspan="2">Controls</th></tr>
    <tr><th>BLOCK</th><td>${this.keysPressed.BLOCK}</td></tr>
    <tr><th>PIT</th><td>${this.keysPressed.PIT}</td></tr>
    <tr><th>LOOP</th><td>${this.keysPressed.LOOP}</td></tr>
    <tr><th>WAVE</th><td>${this.keysPressed.WAVE}</td></tr>
    </table>`;
  }
}