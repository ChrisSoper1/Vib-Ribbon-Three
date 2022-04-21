import {EventDispatcher} from "three/src/Three";

export class VibRibbonControls extends EventDispatcher {
  BLOCK = false;
  PIT = false;
  LOOP = false;
  WAVE = false;

  settings = {
    // these are KeyboardEvent.codes https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
    inputKeyCodes: {
      BLOCK: 'ArrowUp',
      PIT: 'ArrowDown',
      LOOP: 'ArrowLeft',
      WAVE: 'ArrowRight',
      PAUSE: 'Escape',
    },
  };

  constructor() {
    super();
    // This is some nonsense having to do with how "this" works in javascript.  There is almost definitely
    // a better way to handle it, but "this code" should still work for now
    // https://stackoverflow.com/questions/43727516/how-adding-event-handler-inside-a-class-with-a-class-method-as-the-callback

    this.onKeyDown = this._onKeyDown.bind(this);
    this.onKeyUp = this._onKeyUp.bind(this);
  }

  enable() {
    // These cannot be anonymous event handlers because we need to be able to remove them later
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  disable() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keydown', this.onKeyUp);
  }

  _onKeyDown(event) {
    let needsUpdate = false;
    switch (event.code) {
      case this.settings.inputKeyCodes.BLOCK:
        this.BLOCK = true;
        needsUpdate = true;
        break;
      case this.settings.inputKeyCodes.PIT:
        this.PIT = true;
        needsUpdate = true;
        break;
      case this.settings.inputKeyCodes.LOOP:
        this.LOOP = true;
        needsUpdate = true;
        break;
      case this.settings.inputKeyCodes.WAVE:
        this.WAVE = true;
        needsUpdate = true;
        break;
      case this.settings.inputKeyCodes.PAUSE:
        this.dispatchEvent({'type': 'pause'});
        break;
    }
    if (needsUpdate) {
      event.preventDefault();
      event.stopPropagation();
      this.dispatchEvent({'type': 'input', 'target': this});
    }
  }

  _onKeyUp(event) {
    switch (event.code) {
      case this.settings.inputKeyCodes.BLOCK:
        this.BLOCK = false;
        break;
      case this.settings.inputKeyCodes.PIT:
        this.PIT = false;
        break;
      case this.settings.inputKeyCodes.LOOP:
        this.LOOP = false;
        break;
      case this.settings.inputKeyCodes.WAVE:
        this.WAVE = false;
        break;
    }
  }

  _debug() {
    return `<table>
    <tr><th colspan="2">Controls</th></tr>
    <tr><th>BLOCK</th><td>${this.BLOCK}</td></tr>
    <tr><th>PIT</th><td>${this.PIT}</td></tr>
    <tr><th>LOOP</th><td>${this.LOOP}</td></tr>
    <tr><th>WAVE</th><td>${this.WAVE}</td></tr>
    </table>`;
  }
}