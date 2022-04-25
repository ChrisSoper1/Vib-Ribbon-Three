import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import MODEL_FILE from "./assets/Soldier.glb";
import {AnimationMixer, Vector3} from "three/src/Three";

export class Player{
  playerModel = null;
  mixer = null;
  worldPos = null;
  animationMap = {};
  constructor(speed) {
    this.speed = speed
    this.worldPos = new Vector3()
  }
  generatePlayerModel(scene) {
    const loader = new GLTFLoader();
    // convert callback to async by allowing promise to generate callback functions
    let result = new Promise(resolve => loader.load(MODEL_FILE, resolve));

    // Add a .then to the handling chain, and then set result to the new chain
    result = result.then(gltf => {
      this.playerModel = gltf.scene;
      this.playerModel.scale.set(12, 12, 12);
      this.playerModel.position.set(0, 0, 0);
      this.playerModel.lookAt(-1, 0, 0);
      scene.add(this.playerModel);

      this.playerModel.traverse(function (object) {
        if (object.isMesh) object.castShadow = true;
      });

      this.mixer = new AnimationMixer(this.playerModel);
      this.mixer.timeScale = 1;

      this.animationMap = {
        "IDLE": this.mixer.clipAction(gltf.animations[0]),
        "WALK": this.mixer.clipAction(gltf.animations[3]),
        "RUN": this.mixer.clipAction(gltf.animations[1]),
      }

      // this.walkAction.play();
      this.animation = this.animationMap["WALK"];
      this.animation.play();

      console.log("Model Loaded!");
    });

    // Return the promise for further processing
    return result;
  }

  /**
   * This is heavily influenced/inspired by
   * https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_blending.html
   **/
  change_animation(newAction) {
    newAction = this.animationMap[newAction]
    if (this.animation !== newAction) {
      newAction.enabled = true;
      newAction.setEffectiveTimeScale(1);
      newAction.setEffectiveWeight(1);
      newAction.play();
      this.animation.crossFadeTo(newAction, 1, true);
      this.animation = newAction;
    }
  }

  update(timeDelta){
    // Update the animation mixer
    this.mixer.update(timeDelta);

    //update position
    this.playerModel.translateOnAxis(new Vector3(0, 0, -1), timeDelta * this.speed);

    this.playerModel.getWorldPosition(this.worldPos);

  }
}