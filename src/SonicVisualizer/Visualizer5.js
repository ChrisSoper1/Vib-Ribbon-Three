/**
 * This is a rolling heatmap of the frequency domain
 *
 * This uses clipping masks and cone geometry to make it appear as if the top radius of
 * a tapered cylinder changes over time
 */
import {
  AmbientLight,
  AxesHelper,
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  Scene,
  StaticReadUsage,
  StreamCopyUsage,
  StreamDrawUsage,
  WireframeGeometry,
} from "three/src/Three";

import {Lut} from "three/examples/jsm/math/Lut";
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
    // this.camera = getDefaultCamera();
    this.camera = getPerspectiveCamera();
    this.camera.position.z = 128;
    this.camera.updateProjectionMatrix();

    this.camera.lookAt(this.gridSize, this.gridSize, 0);
    this.scene = new Scene();
    const axesHelper = new AxesHelper(5);
    this.scene.add(axesHelper);
    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.colorMap = new Lut('rainbow', UINT8_MAXVALUE);

    this.audioContext = new AudioContext();
    this.analyser = null;

    this.colorAttr = null; // Set below
    this.geometry = null; // Set below
    this.generateGrid(this.gridSize);

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

  generateGrid(gridSize) {
    // let _material = new MeshBasicMaterial({
    let _material = new MeshLambertMaterial({
      // side: DoubleSide,
      color: 0xffffff,
      vertexColors: true,
    });

    let _positionAttr = new Float32BufferAttribute(new Float32Array(gridSize * gridSize * 3), 3);
    _positionAttr.setUsage(StaticReadUsage);

    let colorAttr = new Float32BufferAttribute(new Float32Array(gridSize * gridSize * 3), 3);
    colorAttr.setUsage(StreamDrawUsage);

    let rowStartIx;
    for (let i = 0; i <= gridSize; i++) {
      rowStartIx = gridSize * i;
      for (let j = 0; j <= gridSize; j++) {
        _positionAttr.setXYZ(
          rowStartIx + j,
          j * 2.0,
          i * 2.0,
          0,
        );
      }
    }
    _positionAttr.needsUpdate = true;

    /*
     * Based entirely on https://github.com/mrdoob/three.js/blob/master/examples/webgl_buffergeometry_indexed.html
     * This defines what vertexes connect to each other to make a
     * triangle pattern which defines a mesh surface.
     *
     * The indexes of vertexes in the window use the following variables
     * | b | a |
     * | c | d |
     * Triangle 1 is vertexes (b,a,d)
     * Triangle 2 is vertexes (b,d,c)
     * change switch the second and third vertex in both triangles to face the other direction
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
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const wireframe = new WireframeGeometry(geometry);
    const line = new LineSegments(
      wireframe,
      new LineBasicMaterial({
        depthTest: false,
        opacity: 0.25,
        transparent: true,
      }),
    );
    this.scene.add(line);

    let mesh = new Mesh(geometry, _material);
    this.scene.add(mesh);

    this.geometry = geometry;
    this.colorAttr = colorAttr;
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

    // move rows back by shifting them this.gridSize elements later and clipping the overflow
    colorAttr.array.set(
      colorAttr.array.slice(0, colorAttr.array.length - (this.gridSize * 3)),
      this.gridSize * 3,
    );

    // update the first row
    let data = this.analyser.getFrequencyData();
    for (let i = 0; i < this.gridSize; i++) {
      if (data.length) {
        let targetColor = this.colorMap.getColor(data[i]);
        colorAttr.setXYZ(i, targetColor.r, targetColor.g, targetColor.b);
      }
    }
    colorAttr.needsUpdate = true;
  }
}
