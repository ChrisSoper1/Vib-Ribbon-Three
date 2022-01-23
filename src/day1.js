/**
 * Started here:  https://threejs.org/docs/index.html#manual/en/introduction/Installation
 */
import {
  BufferAttribute,
  LineBasicMaterial,
  Vector3,
  AmbientLight,
  BoxGeometry,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Scene,
  Mesh,
  PerspectiveCamera,
  OrthographicCamera,
  Line,
  BufferGeometry,
  WebGLRenderer
} from 'three/src/Three';

import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

let scene, camera, controls;
const renderer = new WebGLRenderer();
let playerDamage = 2;

let oddEvenToggler = false;

function setStage() {
  scene = new Scene();
  const cameraWidth = 200, cameraHeight = 200;

  // camera = new OrthographicCamera(cameraWidth / -2, cameraWidth / 2, cameraHeight / 2, cameraHeight / -2, 1, 1000);
  camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);


  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);

}

export default function main() {
  setStage();
  camera.position.z = 5;
  // scene.add(generateCube());
  const course = [
    new AmbientLight(0xFFFFFF, 0.8), // soft white light
    generateBlock(),
  ];
  course.forEach(x => scene.add(x));
  animate();
}

function generateCube() {
  return new Mesh(
    new BoxGeometry(),
    new MeshPhongMaterial({color: 0xCCCCCC}),
  );
}

function generateBlock() {
  const lineMaterial = new LineBasicMaterial({color: 0xCCCCCC});
  const points = [
    new Vector3(0, 0, 0),
    new Vector3(0, 10, 0),
    new Vector3(10, 10, 0),
    new Vector3(10, 0, 0),
  ];

  const geometry = new BufferGeometry().setFromPoints(points);
  return new Line(geometry, lineMaterial);
}

function animate() {
  requestAnimationFrame(animate);
  let frameNo = renderer.info.render.frame;
  if (frameNo % 10 == 0) {
    damageCourse();
  }
  controls.update();
  renderer.render(scene, camera);
}

function damageCourse() {
  oddEvenToggler = !oddEvenToggler;
  scene.children.forEach(obj => {
    if (obj.geometry) {

      let positions = obj.geometry.getAttribute('position');
      let size = positions.count;
      let alteredPointArray = [];

      for (let i = 0; i < size; i++) {
        let x = positions.array[i * 3];
        let y = positions.array[i * 3 + 1];
        let z = positions.array[i * 3 + 2];
        switch (i * 3 % 4) {
          case 0:
            alteredPointArray.push(x);
            // alteredPointArray.push(x + playerDamage + (oddEvenToggler ? -1 : 1));
            alteredPointArray.push(y);
            alteredPointArray.push(z);
            break;
          case 1:
            alteredPointArray.push(x);
            // alteredPointArray.push(y + playerDamage + (oddEvenToggler ? -1 : 1));
            alteredPointArray.push(y);
            alteredPointArray.push(z);
            break;
          case 2:
            alteredPointArray.push(x);
            // alteredPointArray.push(-1 * x + playerDamage + (oddEvenToggler ? -1 : 1));
            alteredPointArray.push(y);
            alteredPointArray.push(z);
            break;
          default:
            alteredPointArray.push(x);
            alteredPointArray.push(y);
            // alteredPointArray.push(-1 * y + playerDamage + (oddEvenToggler ? -1 : 1));
            alteredPointArray.push(z);
            break;
        }
      }

      obj.geometry.setAttribute(
        'position',
        new BufferAttribute(new Float32Array(alteredPointArray), 3)
      );
      obj.geometry.computeBoundingSphere();
      obj.geometry.computeBoundingBox();
      obj.geometry.computeVertexNormals();
    }
  });

}
