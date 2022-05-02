import {OrthographicCamera} from "three/src/Three";

export class RailsCamera extends OrthographicCamera {
  /**
   * This is the main game camera, which is on rails and follows vibri as she moves
   *
   */

  frustumSize = 50;

  constructor() {
    super();

    const aspect = window.innerWidth / window.innerHeight;

    this.left = this.frustumSize * aspect / -2;
    this.right = this.frustumSize * aspect / 2;
    this.top = this.frustumSize / 2;
    this.bottom = this.frustumSize / -2;
    this.near = -1000;
    this.far = 1000;
    this.zoom = 0.2;
    this.lookAt(0, 0, 0);
    this.updateProjectionMatrix();
  }

  /** update the position of the camera */
  update(vibri) {
    this.left = vibri.worldPos.x;
    this.right = this.left + this.frustumSize;
    this.updateProjectionMatrix();
  }
}