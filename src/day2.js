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

import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {MapControls} from "three/examples/jsm/controls/OrbitControls";

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
    this.renderer = new WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth * 0.99, window.innerHeight * 0.95);
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    this.clock = new Clock();
    this.scene = new Scene();
    // this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera = new OrthographicCamera(0, 50, 20, -10, -1000, 1000);

    this.camera.position.set(0, 0, 5);
    this.cameraOffset = new Vector3(0, 0, 5);
    this.camera.zoom = 0.2;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(0, 0, 0);
    this.playerVelocity = new Vector3(1, 0, 0).multiplyScalar(7);

    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls = new MapControls(this.camera, this.renderer.domElement);

    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));

    this.modelLoaded = false;
    this.generatePlayerModel();
    this.tempo = 100;  // set inside level generation?
    this.generateExampleLevel();
  }

  start() {
    if (!this.modelLoaded) {
      console.log("model not loaded yet, trying again in 1 second...");
      window.setTimeout(() => this.start(), 1000);
    } else {
      this.animate();
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    // Get the time elapsed since the last frame, used for mixer update
    let timeDelta = this.clock.getDelta();

    // Update the animation mixer
    this.mixer.update(timeDelta);

    // update position
    this.playerModel.translateOnAxis(new Vector3(0, 0, -1), timeDelta * 20);

    // Allow the controls to update the camera
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
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
    loader.load('./Soldier.glb', (gltf) => {
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

      this.modelLoaded = true;
      console.log("Model Loaded!");
    });
  }

  /**
   * This was copied in from the example, and may not be important
   */
  setAnimationWeight(action, weight) {
    action.enabled = true;
    action.paused = false;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
  }

}