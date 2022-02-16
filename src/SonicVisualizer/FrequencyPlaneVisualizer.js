/**
 * This is a rolling heatmap of the frequency domain
 *
 * This uses clipping masks and cone geometry to make it appear as if the top radius of
 * a tapered cylinder changes over time
 *
 * Buffer Geometry index info:
 * Based on https://github.com/mrdoob/three.js/blob/master/examples/webgl_buffergeometry_indexed.html
 * The indexes attribute defines which vertexes connect to each other (as triangles) to define a surface
 * The indexes of vertexes in the window use the following variables
 * | b | a |
 * | c | d |
 * Triangle 1 has vertexes (b,a,d) and Triangle 2 has vertexes (b,d,c)
 * Switch the second and third vertex in both triangles to face the other direction
 **/
import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute, LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Scene,
  StaticReadUsage,
  StreamDrawUsage,
} from "three/src/Three";

import {color as d3color} from "d3-color";
import {scaleSequential} from "d3-scale";
import {interpolateTurbo} from "d3-scale-chromatic";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {getDefaultRenderer, getPerspectiveCamera, loadAudio} from "../utils/helpers";

export class FrequencyPlaneVisualizer {
  fftSize = 128;

  /**
   * @param params.fftSize
   * @param params.colorMap
   */
  constructor(params) {
    this.fftSize = params.fftSize || this.fftSize;
    if (!params.colorMap) {
      this.colorMap = new scaleSequential(interpolateTurbo).domain([0, 255]);
    } else {
      this.colorMap = params.colorMap;
    }
    this.gridSize = this.fftSize / 2;

    // Create base geometry
    this.positionAttr = new Float32BufferAttribute(new Float32Array(this.gridSize * this.gridSize * 3), 3);
    this.positionAttr.setUsage(StaticReadUsage);
    for (let i = 0; i <= this.gridSize; i++) {
      for (let j = 0; j <= this.gridSize; j++) {
        this.positionAttr.setXYZ((this.gridSize * i) + j, j * 2.0, i * 2.0, 0);
      }
    }
    this.positionAttr.needsUpdate = true;

    this.colorAttr = new BufferAttribute(new Uint8Array(this.gridSize * this.gridSize * 3), 3, true);
    this.colorAttr.setUsage(StreamDrawUsage);
    let indices = [];
    for (let i = 0; i < this.gridSize - 1; i++) {
      for (let j = 0; j < this.gridSize - 1; j++) {
        const a = i * this.gridSize + (j + 1);
        const b = i * this.gridSize + j;
        const c = (i + 1) * this.gridSize + j;
        const d = (i + 1) * this.gridSize + (j + 1);
        indices.push(b, a, d);
        indices.push(b, d, c);
      }
    }

    this.geometry = new BufferGeometry();
    this.geometry.setIndex(indices)
        .setAttribute('position', this.positionAttr)
        .setAttribute('color', this.colorAttr);
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingBox();
    this.geometry.computeBoundingSphere();

    this.mesh = new Mesh(this.geometry, new MeshBasicMaterial({side: DoubleSide, vertexColors: true}));
    this.boundingBox = this.geometry.boundingBox;
  }

  update(data) {

    // move rows back by shifting them this.gridSize elements later and clipping the overflow
    this.colorAttr.array.set(
      this.colorAttr.array.slice(0, this.colorAttr.array.length - (this.gridSize * 3)),
      this.gridSize * 3,
    );

    // update the first row
    for (let i = 0; i < this.gridSize; i++) {
      if (data.length) {
        let targetColor = d3color(this.colorMap(data[i]));
        this.colorAttr.setXYZ(i, targetColor.r, targetColor.g, targetColor.b);
      }
    }
    this.colorAttr.needsUpdate = true;
  }
}
