/**
 * This is a container for everything moving along level on-rails, including:
 *  - vibri
 *  - the camera and orbit
 *  - the border
 *  - the score tokens and orbit
 */
import {
  AxesHelper,
  CubicBezierCurve3,
  Group,
  MathUtils,
  Object3D,
  OrthographicCamera,
  Spherical,
  Vector3,
} from "three/src/Three";
import {Player} from "./player";
import {GameBorder} from "./border";

const d2r = MathUtils.degToRad;
const vecFromSpherical = ([r, phi, theta]) => new Vector3().setFromSphericalCoords(r, d2r(phi), d2r(theta));
const makeCurve = (...points) => new CubicBezierCurve3(...points.map(vecFromSpherical));
const cameraTransitions = [
  makeCurve([10, 90, 0], [10, 90, 60], [10, 90, 90], [10, 90, 180]),
  makeCurve([10, 75, 45], [10, 75, 105], [10, 75, 165], [10, 75, 225]),
];

export class Dolly extends Group {
  border;
  vibri;
  camera;
  cameraSpherical;
  cameraTransition;
  speed;
  dummy;

  constructor(settings) {
    super();

    this.speed = settings.defaultSpeed;
    this.cameraSpherical = new Spherical(10, d2r(75), d2r(30));

    this.dummy = new Object3D();
    this.dummy.position.set(0, 0, 0);
    this.add(this.dummy);

    const axesHelper = new AxesHelper(5);
    axesHelper.position.set(-2, -2, -2);
    this.add(axesHelper);

    this.vibri = new Player(this.speed);
    this.vibri.loaded.then(playerModel => this.add(playerModel));

    this.camera = this.initCamera();
    this.add(this.camera);
    this.updateCameraLocation();

    this.border = new GameBorder(this.camera);
    this.add(this.border);
    this.border.position.copy(this.camera.position);
    this.border.lookAt(this.vibri.center);
  }

  /** Return an object representing the state of this instance */
  get_telemetry() {
    return {
      speed: this.speed,
      vibri: this.vibri.get_telemetry(),
      camera: {},
      border: this.border.get_telemetry(),
    };
  }

  _debug() {
    // this is definitely not right, but a step
    const t = this.get_telemetry();
    return `
    <table>
    ${formatter(['Vibri', t.vibri])}
    ${formatter(['Camera', t.camera])}
    ${formatter(['Border', t.border])}
    </table>
    `;
  }

  /**
   * Update the positions of all objects tracked by this group
   *
   * @param {number} timeDelta - time since last frame was rendered
   * @param {number} elapsedTime - Total elapsed time (progress) in the level
   */
  update(timeDelta, elapsedTime) {
    this.translateX(timeDelta * this.speed);
    if (this.cameraTransition) {
      this.updateCameraLocation();
    }
    this.vibri.update(timeDelta);
    this.border.update(elapsedTime);
  }

  initCamera() {
    const frustumSize = 150;
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      -1000,
      1000,
    );
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    return camera;
  }

  triggerCameraTransition(transition_ix, duration = 50) {
    this.cameraTransition = cameraTransitions[transition_ix].getSpacedPoints(duration);
  }

  updateCameraLocation() {
    // TODO: This should consider timeDelta to avoid skipping during transitions
    if (this.cameraTransition !== undefined) {
      let next_point = this.cameraTransition.shift();
      if (next_point === undefined) {
        this.cameraTransition = undefined;
      } else {
        this.cameraSpherical.setFromVector3(next_point);
      }
    }

    this.cameraSpherical.makeSafe();
    this.camera.position.setFromSpherical(this.cameraSpherical);
    this.camera.lookAt(this.vibri.center);
    this.camera.updateProjectionMatrix();
  }
}

/* region telemetry helpers */
const rowMapper = ([key, val]) => `<tr><th>${key}</th><td>${val}</td></tr>`;

const formatter = ([title, data]) => {
  return [`<tr><th colspan="2" class="section">${title}</th></tr>`]
    .concat(Object.entries(data).map(rowMapper))
    .join('');
};
/* endregion */