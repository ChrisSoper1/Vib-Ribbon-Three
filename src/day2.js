import {
  AmbientLight,
  PerspectiveCamera,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
} from "three/src/Three";

import {MapControls} from "three/examples/jsm/controls/OrbitControls";

import {
  BLOCK,
  BLOCKPIT,
  LINE,
  LOOP,
  PIT,
  WAVE,
  featureWidth,
} from './levels';

export class VibRibbonApplication {
  constructor() {
    this.renderer = new WebGLRenderer();
    this.renderer.setSize(window.innerWidth * 0.99, window.innerHeight * 0.95);
    document.body.appendChild(this.renderer.domElement);

    this.scene = new Scene();
    // this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera = new OrthographicCamera(0, 50, 20, -10, -1000, 1000);

    this.camera.position.set(0, 0, 5);
    this.camera.zoom = 0.2;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(0, 0, 0);

    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls = new MapControls(this.camera, this.renderer.domElement);

    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));

    this.generateExampleLevel();
  }

  start() {
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  generateExampleLevel() {
    for (let i = 0; i < 30; i++) {
      let obj;
      if (i === 1) {
        obj = BLOCK.clone();
      } else if (i === 3) {
        obj = PIT.clone();
      } else if (i === 5) {
        obj = LOOP.clone();
      } else if (i === 7) {
        obj = WAVE.clone();
      } else if (i === 9) {
        obj = BLOCKPIT.clone();
      } else {
        obj = LINE.clone();
      }
      this.scene.add(obj);
      obj.position.set((i * featureWidth), 0, 0);
    }
  }
}