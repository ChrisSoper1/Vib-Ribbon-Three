export * from './geometry';

export class Feature {
  geometry_type = null;
  inputs_required = null;
  time = null;
  animation = null;
  input_window_length = 100;
}

/**
 * This would make a lot of sense if it was implemented as an iterable, which features could be pushed and popped.
 */
export class Level {
  song = null;
  /** @type {Feature[]} */
  features = [];
  _index = [];
  geometry = [];

  constructor(features) {
    this.features = features;
    this._index = Array.from(this.features).map(x => x.time);
  }
}