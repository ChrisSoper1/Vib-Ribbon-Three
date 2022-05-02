import {
  Group,
  SphereGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Mesh,
} from "three/src/Three";

export class SphericalHelper {
  constructor(vibriModel) {
    this.object = new Group();
    this.sphere = new Mesh(
      new SphereGeometry(15, 32, 16),
      // new MeshBasicMaterial({color: 0xffff00}),
      new MeshStandardMaterial({color: 0xffff00, wireframe: true}),
    );

    this.object.add(this.sphere);

    /** @type {THREE.Object3D} */
    this.targetObject = vibriModel;
    this.update();
  }

  update() {
    this.sphere.position.copy(this.targetObject.position);
  }
}