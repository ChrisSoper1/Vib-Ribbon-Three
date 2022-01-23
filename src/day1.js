/**
 * Started here:  https://threejs.org/docs/index.html#manual/en/introduction/Installation
 */
import {
  BoxGeometry,
  MeshBasicMaterial,
  Scene,
  Mesh,
  PerspectiveCamera,
  OrthographicCamera,
  WebGLRenderer
} from 'three';


let scene, camera;
const renderer = new WebGLRenderer();

function setStage() {
  scene = new Scene();
  const cameraWidth = 200, cameraHeight = 200;

  // const camera = new OrthographicCamera(
  //   cameraWidth / -2,
  //   cameraWidth / 2,
  //   cameraHeight / 2,
  //   cameraHeight / -2,
  //   1,
  //   1000
  // );
  camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

export default function main() {
  setStage();
  camera.position.z = 5;
  scene.add(generateCube());
  animate();
}

function generateCube() {
  return new Mesh(
    new BoxGeometry(),
    new MeshBasicMaterial({color: 0x00ff00})
  );
}


function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
