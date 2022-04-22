export * from './geometry';
import {BLOCK, PIT} from "./geometry";
import {BufferGeometry, InstancedMesh, DynamicDrawUsage, LineBasicMaterial, Vector3, Object3D} from "three/src/Three";

const L_BLOCK1000 = require('./level_block1000.json');
const L_PIT500 = require('./level_pit500.json');
const L_BLOCKPIT500 = require('./level_blockpit500.json');

const _geom_map = {BLOCK, PIT};

export class Feature {
  geometry_type = 'LINE';
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
  _geometryCount = {'BLOCK': 0, 'PIT': 0, 'WAVE': 0, 'LOOP': 0};

  /**
   * LoadLevel
   *
   */
  constructor(features, scene) {
    this.features = Array.from(features);
    this._index = this.features.map(x => x.time);
    this._generateMeshes(scene);
  }

  _generateMeshes(scene) {
    const dummy = new Object3D();
    this._geometryCount = this.features.reduce((output, curr) => {
      output[curr.geometry_type] += 1;
      return output;
    }, this._geometryCount);

    /* I hope to use an instanced geometry at some point */
    /* see https://github.com/mrdoob/three.js/blob/master/examples/webgl_instancing_dynamic.html */
    // this._meshes['BLOCK'] = new InstancedMesh(BLOCK, MATERIAL, this._geometryCount['BLOCK']);
    // this._meshes['BLOCK'].instanceMatrix.setUsage(DynamicDrawUsage);

    this.features.forEach((feature, index) => {
      const obj = _geom_map[feature.geometry_type].clone();
      scene.add(obj);
      obj.position.set((feature.time / 10), 0, 0);

      /* see https://github.com/mrdoob/three.js/blob/master/examples/webgl_instancing_dynamic.html*/
      // dummy.position.set(1, 0, 0);
      // dummy.rotation.x = 0;
      // dummy.rotation.y = 0;
      // dummy.rotation.z = 0;
      // dummy.updateMatrix();
      // this._meshes['BLOCK'].setMatrixAt(index, dummy.matrix);
    });
    // this._meshes['BLOCK'].instanceMatrix.needsUpdate = true;
  }
}

export function loadLevel(scene, features = null) {
  // features = features || L_BLOCK1000;
  // features = features || L_PIT500;
  features = features || L_BLOCKPIT500;
  return new Level(features, scene);
}