/**
 * Started here:  https://threejs.org/docs/index.html#manual/en/introduction/Installation
 */
import {
  Scene,
  PerspectiveCamera,
  OrthographicCamera,
  WebGLRenderer
} from 'three';


export default function main() {
  const scene = new Scene();

  let cameraWidth = 200;
  let cameraHeight = 200;

  const camera = new OrthographicCamera(
    cameraWidth / -2,
    cameraWidth / 2,
    cameraHeight / 2,
    cameraHeight / -2,
    1,
    1000
  );

  const renderer = new WebGLRenderer();
  let rendererMargin = 50;
  renderer.setSize(
    window.innerWidth - rendererMargin,
    window.innerHeight - rendererMargin
  );

  document.body.appendChild(renderer.domElement);
}

