/**
 * This is a rolling heatmap of the frequency domain
 *
 * This uses clipping masks and cone geometry to make it appear as if the top radius of
 * a tapered cylinder changes over time
 */
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
    this.fftSize = 128;
    this.gridSize = this.fftSize / 2;

    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
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

    this._material = new MeshBasicMaterial({
      side: DoubleSide,
      vertexColors: true,
    });
    this._positionAttr = new Float32BufferAttribute(new Float32Array(this.gridSize * this.gridSize * 3), 3);
    this._positionAttr.setUsage(StaticReadUsage);
    this.colorAttr = new BufferAttribute(new Uint8Array(this.gridSize * this.gridSize * 3), 3, true);
    this.colorAttr.setUsage(StreamDrawUsage);

    this.mesh = this.generateGrid();
    this.scene.add(this.mesh);

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

  generateGrid() {
    let _positionAttr = this._positionAttr;
    let colorAttr = this.colorAttr;
    let gridSize = this.gridSize;
    let _material = this._material;

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        _positionAttr.setXYZ((gridSize * i) + j, j * 2.0, i * 2.0, 0);
      }
    }
    _positionAttr.needsUpdate = true;

    /*
     * Based on https://github.com/mrdoob/three.js/blob/master/examples/webgl_buffergeometry_indexed.html
     * This defines what vertexes connect to each other (as triangles) to define a face for the geometry
     *
     * The indexes of vertexes in the window use the following variables
     * | b | a |
     * | c | d |
     * Triangle 1 has vertexes (b,a,d) and Triangle 2 has vertexes (b,d,c)
     * Switch the second and third vertex in both triangles to face the other direction
     */
    let indices = [];
    for (let i = 0; i < gridSize - 1; i++) {
      for (let j = 0; j < gridSize - 1; j++) {
        const a = i * gridSize + (j + 1);
        const b = i * gridSize + j;
        const c = (i + 1) * gridSize + j;
        const d = (i + 1) * gridSize + (j + 1);
        indices.push(b, a, d); // triangle one
        indices.push(b, d, c); // triangle two
      }
    }

    let geometry = new BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', _positionAttr);
    geometry.setAttribute('color', colorAttr);
    geometry.computeVertexNormals();

    return new Mesh(geometry, _material);
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
    let colorAttr = this.colorAttr;
    let gridSize = this.gridSize;
    let colorMap = this.colorMap;
    this.analyser.getFrequencyData();
    let data = this.analyser.fData;

    // move rows back by shifting them this.gridSize elements later and clipping the overflow
    colorAttr.array.set(
      colorAttr.array.slice(0, colorAttr.array.length - (gridSize * 3)),
      gridSize * 3,
    );

    // update the first row
    for (let i = 0; i < gridSize; i++) {
      if (data.length) {
        let targetColor = d3color(colorMap(data[i]));
        colorAttr.setXYZ(i, targetColor.r, targetColor.g, targetColor.b);
      }
    }
    colorAttr.needsUpdate = true;
  }
}
