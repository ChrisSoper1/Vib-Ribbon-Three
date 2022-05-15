import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import MODEL_FILE from "./assets/Soldier.glb";
import {AnimationMixer, Box3, Vector3} from "three/src/Three";

/**
 * Component for managing and modifying the player character's model, health, animation, state, etc.
 */
export class Player {
  /** @type {THREE.Object3D} */
  playerModel = null;

  /** @type {THREE.AnimationMixer} */
  mixer = null;

  /** @type {THREE.Vector3} */
  worldPos = null;

  score = 0;
  health = 8;
  combo = 0;
  animationMap = {};

  constructor(speed) {
    this.speed = speed;
    this.worldPos = new Vector3();
    this.loaded = this.generatePlayerModel();
    // bounding box
    this.bbox = new Box3();
    this.center = new Vector3();
  }

  /**
   * Asynchronously generate the Vibri ThreeJS object
   *
   * @returns {Promise<THREE.Object3D>}
   */
  generatePlayerModel() {
    const loader = new GLTFLoader();
    // convert callback to async by allowing promise to generate callback functions
    let result = new Promise(resolve => loader.load(MODEL_FILE, resolve));

    // Add a .then to the handling chain, and then set result to the new chain
    result = result.then(gltf => {
      this.playerModel = gltf.scene;
      this.playerModel.scale.set(12, 12, 12);
      this.playerModel.position.set(0, 0, 0);
      this.playerModel.lookAt(-1, 0, 0);

      this.playerModel.traverse(object => object.castShadow = object.isMesh);

      this.mixer = new AnimationMixer(this.playerModel);
      this.mixer.timeScale = 1;

      this.animationMap = {
        "IDLE": this.mixer.clipAction(gltf.animations[0]),
        "WALK": this.mixer.clipAction(gltf.animations[3]),
        "RUN": this.mixer.clipAction(gltf.animations[1]),
      };

      this.activeAnimation = this.animationMap["WALK"];
      this.activeAnimation.play();

      return this.playerModel;
    });

    // Return the promise for further processing
    return result;
  }

  /**
   * Transition to a new action
   *
   * This is heavily influenced/inspired by
   * https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_blending.html
   *
   * @param {string} newAction - The action to perform
   **/
  changeAnimation(newAction) {
    const newAnimation = this.animationMap[newAction];
    if (this.activeAnimation !== newAnimation) {
      newAnimation.enabled = true;
      newAnimation.setEffectiveTimeScale(1);
      newAnimation.setEffectiveWeight(1);
      newAnimation.play();
      this.activeAnimation.crossFadeTo(newAnimation, 1, true);
      this.activeAnimation = newAnimation;
    }
  }

  /**
   * Updates the state of the player character.
   * This should be called every frame.
   *
   * @param {number} timeDelta - time passed since last frame
   */
  update(timeDelta) {
    // Update the animation mixer
    this.mixer.update(timeDelta);

    //update position
    this.playerModel.translateZ(timeDelta * this.speed * -1);

    // update bounding box for height calculations
    this.bbox.setFromObject(this.playerModel);
    this.bbox.getCenter(this.center);

    this.playerModel.getWorldPosition(this.worldPos);
  }

  handleStumble() {
    this.combo = 0;
    this.health = this.health - 1;
  }

  handleScore(type) {
    if (type === 'dance') {
      this.score = this.score + 1;
    } else if (type === 'feature') {
      this.combo = this.combo + 1;
      this.score = this.score + this.combo;
    }
  }
}