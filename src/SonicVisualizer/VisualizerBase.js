import {Matrix4, Quaternion, Clock, Box3, Mesh, Spherical, Vector3} from "three/src/Three";
import {degToRad} from "three/src/math/MathUtils";

export class VisualizerBase {
  constructor(props) {
    this.animationSpeed = 2;
    this.rotationClock = new Clock();
    this.directionVector = new Vector3();
    this.rotationMatrix = new Matrix4();
    this.spherical = new Spherical();
    this.targetQuaternion = new Quaternion();

    /** @type Box3 */
    this.boundingBox = null;

    /** @type Mesh */
    this.mesh = null;
  }

  /**
   * Called every time data changes
   *
   * @abstract
   * @param data
   */
  update(data) {}

  /**
   * Called during the animation loop
   */
  updateBase() {
    const delta = this.rotationClock.getDelta();
    if (!this.mesh.quaternion.equals(this.targetQuaternion)) {
      const step = this.animationSpeed * delta;
      this.mesh.quaternion.rotateTowards(this.targetQuaternion, step);
    }
  }

  rotateByVector3(vec, speed = 2) {
    this.rotate(vec.x, vec.y, vec.z, speed);
  }

  /**
   * Rotate this object.
   */
  rotate(x, y, z, speed = 2) {
    this.animationSpeed = speed;
    console.log({x, y, z});
    this.directionVector.set(x, y, z);

    // compute target rotation
    this.rotationMatrix.lookAt(this.directionVector, this.mesh.position, this.mesh.up);
    this.targetQuaternion.setFromRotationMatrix(this.rotationMatrix);
  }
}