/**
 * this is a visualization of amplitude over time
 */
import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  Line,
  Scene,
  StaticReadUsage,
  StreamDrawUsage,
  Vector3,
  WireframeGeometry,
  PerspectiveCamera,
  CameraHelper, Box3,
} from "three/src/Three";

import {color as d3color} from "d3-color";
import {scaleSequential} from "d3-scale";
import {interpolateTurbo, interpolateYlOrBr} from "d3-scale-chromatic";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

import {sharedDebugPanel} from "../utils/debug_panel";
import {getDefaultCamera, getDefaultRenderer, getPerspectiveCamera, loadAudio} from "../utils/helpers";
import {scaleLinear} from "d3";
import {VisualizerBase} from "./VisualizerBase";

const DEFAULT_PARAMS = {
  fftSize: 128,
  timeSteps: 128,
  material: new LineBasicMaterial({side: DoubleSide, vertexColors: true}),
  colorMap: new scaleSequential(interpolateYlOrBr),
};

export class SimpleAmplitudeVisualizer extends VisualizerBase {

  /**
   * @param params.fftSize
   * @param params.timeSteps
   * @param params.material
   * @param params.colorMap
   */
  constructor(params) {
    params = {...DEFAULT_PARAMS, ...params};
    super(params);
    this.fftSize = params.fftSize;
    this.timeSteps = params.timeSteps;
    this.material = params.material;
    this.colorMap = params.colorMap.domain([0, this.timeSteps]);

    this.scaleAmpToWidth = scaleLinear()
      .domain([0, 255])
      .range([0, this.timeSteps]);

    this.scaleZ = scaleLinear()
      .domain([0, 255])
      .range([0, this.timeSteps]);

    this.positionAttrArray = [];
    this.geometryArray = [];
    this.mesh = new Group();

    for (let i = 0; i < this.timeSteps; i++) {
      const targetColor = d3color(this.colorMap(i));
      const posAttr = new BufferAttribute(new Float32Array(this.fftSize * 3), 3);
      const colAttr = new BufferAttribute(new Uint8Array(this.fftSize * 3), 3, true);
      posAttr.setUsage(StreamDrawUsage);
      colAttr.setUsage(StaticReadUsage);
      this.positionAttrArray.push(posAttr);

      for (let j = 0; j < colAttr.count; j++) colAttr.setXYZ(j, targetColor.r, targetColor.g, targetColor.b);
      colAttr.needsUpdate = true;

      const geometry = new BufferGeometry();
      geometry.setAttribute('position', posAttr)
              .setAttribute('color', colAttr);
      this.geometryArray.push(geometry);

      const line = new Line(geometry, this.material);
      line.position.set(0, 0, Math.floor(this.timeSteps / 2) - i);
      this.mesh.add(line);
    }
    this.boundingBox = new Box3(
      new Vector3(0, 0, -this.timeSteps),
      new Vector3(this.fftSize, this.scaleAmpToWidth(255), 0),
    );
    this.update(new Uint8Array(this.fftSize));
  }

  update(data) {
    // reverse is a mutating method, slice() creates a copy
    let posAttrArrayReverse = this.positionAttrArray.slice().reverse();
    let geomArrayReverse = this.geometryArray.slice().reverse();

    // move rows back
    for (let i = 0; i < posAttrArrayReverse.length - 1; i++) {
      posAttrArrayReverse[i].copy(posAttrArrayReverse[i + 1]);
      posAttrArrayReverse[i].needsUpdate = true;
    }

    // update the first row
    let firstRowPos = this.positionAttrArray[0];
    for (let i = 0; i < data.length; i++) {
      firstRowPos.setXYZ(i, i, this.scaleAmpToWidth(data[i]), 0);
      firstRowPos.needsUpdate = true;
    }
    this.geometryArray[0].computeBoundingBox();
    this.geometryArray[0].center();
    this.boundingBox.setFromObject(this.mesh);
  }
}
