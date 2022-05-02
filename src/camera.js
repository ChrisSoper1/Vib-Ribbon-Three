import {
  MathUtils,
  OrthographicCamera,
  Spherical,
  Vector3,
} from "three/src/Three";

export class RailsCamera extends OrthographicCamera {
  /**
   * This is the main game camera, which is on rails and follows vibri as she moves
   *
   */

  frustumSize = 150;

  constructor(radius = 10, phi = 45, theta = 45) {
    super();

    this.spherical = new Spherical(
      radius,
      MathUtils.degToRad(phi),
      MathUtils.degToRad(theta),
    );
    this.directionVector = new Vector3();

    const aspect = window.innerWidth / window.innerHeight;

    this.left = this.frustumSize * aspect / -2;
    this.right = this.frustumSize * aspect / 2;
    this.top = this.frustumSize / 2;
    this.bottom = this.frustumSize / -2;
    this.near = -1000;
    this.far = 1000;
    this.lookAt(0, 0, 0);
    this.updateProjectionMatrix();
  }

  /** update the position of the camera */
  update(vibri) {
    this.directionVector.setFromSpherical(this.spherical);
    this.position.copy(vibri.center);
    this.position.add(this.directionVector);
    this.lookAt(vibri.center);
    this.updateProjectionMatrix();
  }
}