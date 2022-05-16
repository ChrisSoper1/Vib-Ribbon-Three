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

  constructor(settings) {
    super();
    this.vibri = new Player(settings.defaultSpeed);
    this.vibri.loaded.then(playerModel => this.add(playerModel));
    this.speed = settings.defaultSpeed;

    this.camera = new RailsCamera();
    this.add(this.camera);

    this.border = new GameBorder(this.camera);
    this.add(this.border);

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