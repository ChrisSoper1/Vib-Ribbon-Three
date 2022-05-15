import {Color, BufferGeometry, LineSegments, Vector3, LineBasicMaterial} from "three/src/Three";

export class GameBorder extends LineSegments {
  flashStart = 0;
  flashEnd = 0;
  _FLASHING = false;
  _COLORS = {
    RED: new Color(0xFF0000),
    WHITE: new Color(0xFFFFFF),
    GREY: new Color(0x222222),
  };

  constructor(camera, audioContext, margin = 10, window = 200) {
    const material = new LineBasicMaterial({color: 0xFFFFFF, linewidth: 40});
    const geometry = new BufferGeometry().setFromPoints([
      new Vector3(camera.left + margin, camera.top - margin, 0),
      new Vector3(camera.right - margin, camera.top - margin, 0),
      new Vector3(camera.right - margin, camera.top - margin, 0),
      new Vector3(camera.right - margin, camera.bottom + margin, 0),
      new Vector3(camera.right - margin, camera.bottom + margin, 0),
      new Vector3(camera.left + margin, camera.bottom + margin, 0),
      new Vector3(camera.left + margin, camera.bottom + margin, 0),
      new Vector3(camera.left + margin, camera.top - margin, 0),
    ]);
    super(geometry, material);
    this._geometry = geometry;
    this._material = material;
    this._material.color = this._COLORS.GREY;

    this.timingWindow = window;
    this.audioContext = audioContext;
    this.nextColor = this._COLORS.WHITE;
  }

  /**
   * The next flash will be red
   */
  flashFail() {
    this.nextColor = this._COLORS.RED;
  }

  /**
   * Start the flash animation
   *
   * @private
   */
  _flash() {
    if (!this._FLASHING) {
      this._FLASHING = true;
      this._material.color = this.nextColor;
    }
  }

  /**
   * Stop the flash animation
   *
   * @private
   */
  _unflash() {
    if (this._FLASHING) {
      this._FLASHING = false;
      this._material.color = this._COLORS.GREY;
    }
  }

  /**
   * Schedule a flash
   * @param time
   */
  scheduleFlash(time) {
    this.flashStart = time;
    this.flashEnd = time + this.timingWindow;
    this.nextColor = this._COLORS.WHITE;
  }

  /**
   * Update on each frame
   */
  update() {
    const elapsedTime = this.audioContext.getOutputTimestamp().performanceTime;
    if (elapsedTime >= this.flashStart && elapsedTime <= this.flashEnd) {
      this._flash();
    } else if (this._FLASHING) {
      this._unflash();
    }
  }

  _debug() {
    return `<table>
    <tr><th colspan="2" style="text-align: center; text-decoration: underline">Border</th></tr>
    <tr><th>flashStart</th><td>${this.flashStart}</td></tr>
    <tr><th>flashEnd</th><td>${this.flashEnd}</td></tr>
    <tr><th>flashing</th><td>${this._FLASHING}</td></tr>
    </table>`;
  }
}