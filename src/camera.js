import {
  CubicBezierCurve3, Group,
  MathUtils,
  OrthographicCamera,
  Spherical,
  Vector3,
} from "three/src/Three";

const d2r = MathUtils.degToRad;
const vecFromSpherical = (...[r, phi, theta]) => new Vector3().setFromSphericalCoords(r, d2r(phi), d2r(theta));
const makeCurve = (...points) => new CubicBezierCurve3(...points.map(vecFromSpherical));

export class RailsCamera extends OrthographicCamera {
  /**
   * This is the main game camera, which is on rails and follows vibri as she moves
   *
   */
  TRANSITIONS = [
    makeCurve([10, 90, 0], [10, 90, 60], [10, 90, 90], [10, 90, 180]),
    makeCurve([10, 75, 45], [10, 75, 105], [10, 75, 165], [10, 75, 225]),
  ];
  frustumSize = 150;
  activeTransition;
  left;
  right;
  top;
  bottom;
  near;
  far;

  /** @type {THREE.Spherical} */
  spherical;
  /** @type {THREE.Vector3} */
  directionVector;

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

  /** Return an object representing the state of this instance */
  get_telemetry() {
    return {
      left: this.left,
      right: this.right,
      top: this.top,
      bottom: this.bottom,
      near: this.near,
      far: this.far,
      position: this.position,
      directionVector: this.directionVector,
      spherical: this.spherical,
    };
  }

  _debug() {
    // todo: finish this telemetry mess
    const t = this.get_telemetry();
    return `
    <tr><th colspan="2" class="section">Camera</th></tr>
    <tr><th>Position</th><td>
    Phi: ${MathUtils.radToDeg(t.spherical.phi).toFixed(0)} |
    Theta: ${MathUtils.radToDeg(t.spherical.theta).toFixed(0)}
    </td></tr>
    `;
  }

  triggerTransition(transition_ix) {
    this.activeTransition = this.TRANSITIONS[transition_ix].getSpacedPoints(50);
  }

  /** update the position of the camera rig and attached objects */
  update(vibri) {
    // TODO: This should consider timeDelta to avoid skipping during transitions
    if (this.activeTransition !== undefined) {
      let next_point = this.activeTransition.shift();
      if (next_point === undefined) {
        this.activeTransition = undefined;
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