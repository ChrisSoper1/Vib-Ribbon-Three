/** @module debug_panel */

export class DebugPanel {
  constructor() {
    this.__loggers = [];
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    this.div.style.bottom = '0';
    this.div.style.right = '0';
    this.div.style.backgroundColor = '#CCCCCC'
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
      content += '<div>';
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
