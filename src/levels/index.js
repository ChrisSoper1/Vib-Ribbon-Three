export * from './geometry';
import {calcBlockVertexes, calcPitVertexes, featureWidth} from "./geometry";
import {BufferGeometry, LineBasicMaterial, Vector3, Line} from "three/src/Three";

const L_BLOCK1000 = require('./level_block1000.json');
const L_PIT500 = require('./level_pit500.json');
const L_BLOCKPIT500 = require('./level_blockpit500.json');

const _geom_method_map = {BLOCK: calcBlockVertexes, PIT: calcPitVertexes};

export class Feature {
  geometry_type = 'LINE';
  inputs_required = null;
  time = null;
  animation = null;
  vertexes = [];
}

/**
 * This would make a lot of sense if it was implemented as an iterable or FIFO queue,
 * which features could be pushed and popped.
 */
export class Level {
  song = null;
  /** @type {Feature[]} */
  features = [];
  _index = [];
  _geometryCount = {'BLOCK': 0, 'PIT': 0, 'WAVE': 0, 'LOOP': 0};

  constructor(features, scene, speed) {
    this.features = Array.from(features);
    this._index = this.features.map(x => x.time);
    this._speed = speed;
    this._vertexes = [];
    this._generateMeshes(scene);
  }

  timestampToPosition(timestamp) {
    return timestamp * this._speed;
  }

  positionToTimestamp(position) {
    return position / this._speed;
  }

  _generateMeshes(scene) {
    this._geometryCount = this.features.reduce((output, curr) => {
      output[curr.geometry_type] += 1;
      return output;
    }, this._geometryCount);

    let distanceGenerated = 0;
    this.features.forEach((feature, index) => {
      const featureStartPos = this.positionToTimestamp(feature.time);

      // generate line from previous feature
      if (distanceGenerated !== 0) {
        this._vertexes.push(...[new Vector3(distanceGenerated, 0, 0), new Vector3(featureStartPos, 0, 0)]);
      }

      feature.vertexes = _geom_method_map[feature.geometry_type](featureStartPos);
      this._vertexes.push(...feature.vertexes);
      distanceGenerated = featureStartPos + featureWidth;
    });

    let mesh = new Line(
      new BufferGeometry().setFromPoints(this._vertexes),
      new LineBasicMaterial({color: 0xFFFFFF}),
    );
    scene.add(mesh);
  }
}

export function loadLevel(scene, speed = 20, features = null) {
  features = L_BLOCK1000;
  // features = L_PIT500;
  // features = L_BLOCKPIT500;
  return new Level(features, scene, speed);
}