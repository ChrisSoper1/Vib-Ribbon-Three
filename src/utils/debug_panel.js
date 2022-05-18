/** @module debug_panel */

// language=css
const __CSS_STYLES = `
    .debug-panel {
        position: absolute;
        bottom: 0;
        right: 0;
        background-color: #CCCCCC;
        font-size: 0.7rem;
    }
    .debug-panel .section {
        text-align: center;
        text-decoration: underline;
    }
`;

/* this uses a promise to load the CSS once, then immediately resolve every time after */
const stylePromise = new Promise(resolve => {
  const style = document.createElement('style');
  style.innerHTML = __CSS_STYLES;
  document.getElementsByTagName('head')[0].appendChild(style);
  resolve(style);
});

export class DebugPanel {
  constructor() {
    this.__loggers = [];

    // Load the css if it has not already
    stylePromise.then();
    this.div = document.createElement('div');
    this.div.classList.add('debug-panel');
  }

  enable() {
    document.body.append(this.div);
  }

  disable() {
    this.div.remove();
  }

  update() {
    let content = '';
    this.__loggers.forEach(callback => {
      content += '<div class="logger">';
      content += callback();
      content += '</div>';
    });
    this.div.innerHTML = content;
  }

  addLoggerCallback(callback, position) {
    if (position === undefined) {
      this.__loggers.splice(0, 0, callback);
    } else {
      this.__loggers[position] = callback;
    }
  }

  addContent(content) {
    this.div.innerHTML = content;
  }
}

export const sharedDebugPanel = new DebugPanel();
