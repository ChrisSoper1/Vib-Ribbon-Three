/**
 * This is a rolling heatmap of the frequency domain
 *
 * This uses clipping masks and cone geometry to make it appear as if the top radius of
 * a tapered cylinder changes over time
 */
import {
  AxesHelper,
  AmbientLight,
  BoxGeometry,
  MeshBasicMaterial,
  BufferAttribute,
  PlaneGeometry,
  Mesh,
  ConeGeometry,
  Group,
  OrthographicCamera,
  ShaderMaterial,
  Scene,
  Points,
  BufferGeometry,
  PointsMaterial,
  MeshPhongMaterial,
} from "three/src/Three";

import {Lut} from "three/examples/jsm/math/Lut";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

import {AudioAnalyser} from './AudioAnalyzer';

import {sharedDebugPanel} from "../utils/debug_panel";
import {getDefaultCamera, getDefaultRenderer, getPerspectiveCamera, loadAudio} from "../utils/helpers";

const UINT8_MAXVALUE = 255;

export class SonicVisualizer5 {

  constructor(fftSize = 128) {
    this.fftSize = 128;
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
    this.renderer = getDefaultRenderer();
    // this.camera = getDefaultCamera();
    // this.camera = getPerspectiveCamera();
    this.camera = new OrthographicCamera(
      -25,
      this.fftSize / 1.5,
      this.fftSize / 1.5,
      -25,
      this.fftSize * -1,
      this.fftSize,
    );
    this.camera.position.set(0, 0, -100);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(100, fftSize / 4, 0);
    this.scene = new Scene();
    const axesHelper = new AxesHelper(5);
    this.scene.add(axesHelper);
    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.colorMap = new Lut('rainbow', UINT8_MAXVALUE);

    this.audioContext = new AudioContext();
    this.analyser = null;

    this.grid, this.colorAttrGrid = null; // Set below
    this.generateGrid(this.fftSize / 2);

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
    const outputGrid = [];
    const colorAttrGrid = [];
    // let _material = new MeshBasicMaterial({
    let _material = new MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
    });
    // let _proto_geom = new PlaneGeometry(1, 1);
    // let _proto_geom = new BoxGeometry(1, 1, 1);
    let _proto_geom = new ConeGeometry(1, 7, 32);
    let _vertexes = _proto_geom.attributes.position.count;
    _proto_geom.setAttribute('color', new BufferAttribute(new Float32Array(_vertexes * 3), 3));

    for (let rowIx = 0; rowIx < gridSize; rowIx++) {

      let rowGroup = [];
      let colorGroup = [];

      for (let colIx = 0; colIx < gridSize; colIx++) {
        let geometry = _proto_geom.clone();
        colorGroup.push(geometry.attributes.color);

        let mesh = new Mesh(geometry, _material);
        rowGroup.push(mesh);

        this.scene.add(mesh);
        mesh.position.set(colIx * 5, 0, rowIx * 5);
        // mesh.lookAt(this.camera.position);
      }
      outputGrid.push(rowGroup);
      colorAttrGrid.push(colorGroup);
    }
    this.grid = outputGrid;
    this.colorAttrGrid = colorAttrGrid;
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
    //console.log(this.analyser.getAverageAmplitude());
    this.renderer.render(this.scene, this.camera);
  }

  updateColors() {
    // move rows back
    for (let i = 1; i < this.colorAttrGrid.length; i++) {
      // update the colors
      for (let j = 0; j < this.colorAttrGrid[i].length; j++) {
        let destinationAttr = this.colorAttrGrid[i][j];
        let sourceAttr = this.colorAttrGrid[i - 1][j];

        destinationAttr.copy(sourceAttr);
        destinationAttr.needsUpdate = true;
      }
    }
    // update first row
    let mostRecent = this.colorAttrGrid[0];
    let data = this.analyser.getFrequencyData();

    for (let j = 0; j < mostRecent.length; j++) {
      if (data.length) {
        let attr = mostRecent[j];
        let targetColor = this.colorMap.getColor(data[j]);
        for (let vertexIx = 0; vertexIx < attr.count; vertexIx++) {
          attr.setXYZ(vertexIx, targetColor.r, targetColor.g, targetColor.b);
        }
        attr.needsUpdate = true;
      }
    }
  }
}
