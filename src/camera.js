import {
  CubicBezierCurve3,
  MathUtils,
  OrthographicCamera,
  Spherical,
  Vector3,
} from "three/src/Three";

const d2r = MathUtils.degToRad;

export class RailsCamera extends OrthographicCamera {
  /**
   * This is the main game camera, which is on rails and follows vibri as she moves
   *
   */
  TRANSITIONS = [
    new CubicBezierCurve3( // LTR CURVE
      new Vector3().setFromSphericalCoords(10, d2r(90), d2r(0)),
      new Vector3().setFromSphericalCoords(10, d2r(90), d2r(60)),
      new Vector3().setFromSphericalCoords(10, d2r(90), d2r(90)),
      new Vector3().setFromSphericalCoords(10, d2r(90), d2r(180)),
    ),
    new CubicBezierCurve3( // ISO LEFT TO ISO RIGHT CURVE
      new Vector3().setFromSphericalCoords(10, d2r(75), d2r(45)),
      new Vector3().setFromSphericalCoords(10, d2r(75), d2r(105)),
      new Vector3().setFromSphericalCoords(10, d2r(75), d2r(165)),
      new Vector3().setFromSphericalCoords(10, d2r(75), d2r(225)),
    ),
  ];

  ACTIVE_TRANSITION = null;

  frustumSize = 150;

  constructor(radius = 10, phi = 75, theta = 30) {
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

  triggerTransition(transition_ix) {
    this.ACTIVE_TRANSITION = this.TRANSITIONS[transition_ix].getSpacedPoints(50);
  }

  /** update the position of the camera */
  update(vibri) {
    // TODO: This should consider timeDelta to avoid skipping during transitions
    if (this.ACTIVE_TRANSITION !== null) {
      let next_point = this.ACTIVE_TRANSITION.shift();
      if (next_point === undefined) {
        this.ACTIVE_TRANSITION = null;
      } else {
        this.spherical.setFromVector3(next_point);
      }
    }
    this.spherical.makeSafe();
    this.directionVector.setFromSpherical(this.spherical);
    this.position.copy(vibri.center);
    this.position.add(this.directionVector);
    this.lookAt(vibri.center);
    this.updateProjectionMatrix();
  }
}