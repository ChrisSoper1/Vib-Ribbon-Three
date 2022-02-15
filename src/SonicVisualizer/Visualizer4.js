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
  BoxHelper,
  CameraHelper,
} from "three/src/Three";

import {color as d3color} from "d3-color";
import {scaleSequential} from "d3-scale";
import {interpolateTurbo} from "d3-scale-chromatic";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

import {sharedDebugPanel} from "../utils/debug_panel";
import {getDefaultCamera, getDefaultRenderer, getPerspectiveCamera, loadAudio} from "../utils/helpers";

const UINT8_MAXVALUE = 255;

export class SonicVisualizer4 {

  constructor(fftSize = 128) {
    this.fftSize = 128;
    this.timeSteps = 500;

    this.renderer = getDefaultRenderer();

    // this.camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.001, 1000);
    this.camera = getDefaultCamera();

    this.scene = new Scene();
    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.camera.position.set(this.fftSize / 2, 100, 10);
    this.controls.target.set(this.fftSize / 2, 100, 0); // camera direction
    this.controls.update();

    this.audioContext = new AudioContext();
    this.analyser = null;

    this.positionAttrArray = [];
    this.colorAttrArray = [];
    this.geometryArray = [];
    this.object = new Group();

    let colorMap = new scaleSequential(interpolateTurbo).domain([0, this.timeSteps]);
    let _material = new LineBasicMaterial({side: DoubleSide, vertexColors: true});
    for (let i = 0; i < this.timeSteps; i++) {
      let posAttr = new BufferAttribute(new Float32Array(this.fftSize * 3), 3);
      posAttr.setUsage(StreamDrawUsage);
      this.positionAttrArray.push(posAttr);

      let colAttr = new BufferAttribute(new Uint8Array(this.fftSize * 3), 3, true);
      colAttr.setUsage(StaticReadUsage);

      let targetColor = d3color(colorMap(i));
      for (let i = 0; i < colAttr.count; i++) {
        colAttr.setXYZ(i, targetColor.r, targetColor.g, targetColor.b);
      }
      colAttr.needsUpdate = true;
      this.colorAttrArray.push(colAttr);

      let geometry = new BufferGeometry();
      geometry.setAttribute('position', posAttr);
      geometry.setAttribute('color', colAttr);
      geometry.lookAt(this.camera.position);
      this.geometryArray.push(geometry);

      let mesh = new Line(geometry, _material);
      // mesh.position.set(0, -10, i * -1);
      mesh.position.set(0, 0, i * -1);
      this.object.add(mesh);
    }

    this.scene.add(this.object);
    this.camera.lookAt(this.object.position)
    // helpers

    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
    document.body.appendChild(this.renderer.domElement);
    window.addEventListener('resize', () => this.renderer.setSize(window.innerWidth, window.innerHeight));
  }

  start(audioFile, fftSize = this.fftSize) {
    loadAudio(audioFile, this.audioContext, fftSize)
      .then(({source, _, analyzer}) => {
        this.analyser = analyzer;
        source.start(0);
      })
      .then(() => this.animate());
  }

  animate() {
    try {
      this.update(this.analyser.getTimeDomainData());
      this.controls.update();
      sharedDebugPanel.update();
      this.renderer.render(this.scene, this.camera);
      this.stats.update();
      requestAnimationFrame(() => this.animate());
    } catch (error) {
      console.log(error);
      console.log("Broke");
    }
  }

  update(data) {
    // reverse is a mutating method, slice() creates a copy
    let posAttrArrayReverse = this.positionAttrArray.slice().reverse();
    let geomArrayReverse = this.geometryArray.slice().reverse();

    // move rows back
    for (let i = 0; i < posAttrArrayReverse.length - 1; i++) {
      posAttrArrayReverse[i].copy(posAttrArrayReverse[i + 1]);
      posAttrArrayReverse[i].needsUpdate = true;
      geomArrayReverse[i].computeBoundingBox();
      geomArrayReverse[i].computeBoundingSphere();
    }
    // update the first row
    let firstRowPos = this.positionAttrArray[0];
    for (let i = 0; i < data.length; i++) {
      firstRowPos.setXYZ(i, i, data[i], 0);
      firstRowPos.needsUpdate = true;
    }
  }
}
