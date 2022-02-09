import {OrthographicCamera, WebGLRenderer} from "three/src/Three";

export function getDefaultRenderer() {
  let renderer = new WebGLRenderer({antialias: true});
  renderer.setClearColor(0x000000);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth * 0.99, window.innerHeight * 0.95);
  return renderer;
}

export function getDefaultCamera() {
  let camera = new OrthographicCamera(0, 512, 100, 0, -1000, 1000);
  camera.position.set(0, 0, 5);
  camera.zoom = 0.2;
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);
  return camera;
}