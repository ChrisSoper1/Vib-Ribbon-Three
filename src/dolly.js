/**
 * This is a container for everything moving along level on-rails, including:
 *  - vibri
 *  - the camera and orbit
 *  - the border
 *  - the score tokens and orbit
 */
import {Group} from "three/src/Three";
import {Player} from "./player";
import {RailsCamera} from "./camera";
import {GameBorder} from "./border";

export class Dolly extends Group {
  border;
  vibri;
  camera;
  speed;

  constructor(settings) {
    super();
    this.speed = settings.defaultSpeed;
    this.vibri = new Player(this.speed);
    this.vibri.loaded.then(playerModel => this.add(playerModel));

    this.camera = new RailsCamera();
    this.add(this.camera);

    this.border = new GameBorder(this.camera);
    this.add(this.border);
  }

  /** Return an object representing the state of this instance */
  get_telemetry() {
    return {
      speed: this.speed,
      vibri: this.vibri.get_telemetry(),
      camera: this.camera.get_telemetry(),
      border: this.border.get_telemetry(),
    };
  }

  _debug() {
    // this is definitely not right, but a step
    const t = this.get_telemetry();
    return `
    <table>
    ${this.vibri._debug()}
    ${this.camera._debug()}
    ${this.border._debug()}
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
    // TODO: See timing sandbox for another way to move the dolly
    this.vibri.update(timeDelta);
    this.camera.update(this.vibri);
    this.border.update(elapsedTime);
    this.border.position.copy(this.camera.position);
    this.border.lookAt(this.vibri.center);
  }
}