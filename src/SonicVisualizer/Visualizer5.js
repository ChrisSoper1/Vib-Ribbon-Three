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
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Scene,
  StaticReadUsage,
  StreamDrawUsage,
  Vector3,
  WireframeGeometry,
} from "three/src/Three";

import {color as d3color} from "d3-color";
import {scaleSequential} from "d3-scale";
import {interpolateTurbo} from "d3-scale-chromatic";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

import {sharedDebugPanel} from "../utils/debug_panel";
import {getDefaultRenderer, getPerspectiveCamera, loadAudio} from "../utils/helpers";

const UINT8_MAXVALUE = 255;

export class SonicVisualizer5 {

  constructor(fftSize = 128) {
    this.fftSize = fftSize;
    this.gridSize = this.fftSize / 2;

    this.renderer = getDefaultRenderer();
    this.camera = getPerspectiveCamera();

    this.scene = new Scene();
    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(64, 64, 64);
    this.controls.target.set(64, 64, 0); // camera direction
    this.controls.update();

    this.colorMap = new scaleSequential(interpolateTurbo).domain([-1, 256]);

    this.audioContext = new AudioContext();
    this.analyser = null;

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
        .setAttribute('color', this.colorAttr)
        .computeVertexNormals();

    this.mesh = new Mesh(this.geometry, new MeshBasicMaterial({side: DoubleSide, vertexColors: true}));
    this.scene.add(this.mesh);

    this.stats = new Stats();
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(this.stats.dom);
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

  generateGrid() {
  }

  animate() {
    try {
      this.render();
      this.stats.update();
      requestAnimationFrame(() => this.animate());
    } catch (error) {
      console.log(error);
      console.log("Broke");
    }
  }

  render() {
    this.updateColors();
    this.controls.update();

    // create new row
    this.analyser.updateSpectralFluxSamples();

    sharedDebugPanel.update();
    this.renderer.render(this.scene, this.camera);
  }

  updateColors() {
    let gridSize = this.gridSize;
    let colorMap = this.colorMap;
    this.analyser.getFrequencyData();
    let data = this.analyser.fData;

    // move rows back by shifting them this.gridSize elements later and clipping the overflow
    this.colorAttr.array.set(
      this.colorAttr.array.slice(0, this.colorAttr.array.length - (gridSize * 3)),
      gridSize * 3,
    );

    // update the first row
    for (let i = 0; i < gridSize; i++) {
      if (data.length) {
        let targetColor = d3color(this.colorMap(data[i]));
        this.colorAttr.setXYZ(i, targetColor.r, targetColor.g, targetColor.b);
      }
    }
    this.colorAttr.needsUpdate = true;
  }
}
