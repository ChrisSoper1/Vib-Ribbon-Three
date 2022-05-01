import {
  AmbientLight,
  DirectionalLight,
  OrthographicCamera,
  Mesh,
  WebGLRenderer,
  Scene,
  SphereGeometry, MeshBasicMaterial, Vector3, ArrowHelper, PerspectiveCamera, Spherical,
  MathUtils, BoxGeometry, MeshPhongMaterial,
} from "three/src/Three";
import Stats from "three/examples/jsm/libs/stats.module";
import {Pane} from "tweakpane";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

const renderer = new WebGLRenderer();
let scene, camera, stats, controls;
let globe, arrow;
let pane;

const sphereRadius = 25;
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 100;

const spherical = new Spherical(sphereRadius, 0, 0);

const arrowDirection = new Vector3();
arrowDirection.setFromSpherical(spherical)

const PARAMS = {
  zPos: 0,
  phi: MathUtils.radToDeg(spherical.phi),
  theta: MathUtils.radToDeg(spherical.theta),
};

export function main() {
  console.log("starting!");
  pane = new Pane();

  pane.addInput(PARAMS, 'zPos', {min: -50, max: 50}).on('change', ev => {
    globe.position.setZ(ev.value);
  });

  pane.addInput(PARAMS, 'phi', {min: 0, max: 360, step: 1}).on('change', ev => {
    console.log("ev", ev);
    spherical.phi = MathUtils.degToRad(ev.value);
    arrowDirection.setFromSpherical(spherical);
    arrow.position.copy(arrowDirection);
    arrow.lookAt(globe.position);
  });

  pane.addInput(PARAMS, 'theta', {min: 0, max: 360, step: 1}).on('change', ev => {
    console.log("ev", ev);
    spherical.theta = MathUtils.degToRad(ev.value);
    arrowDirection.setFromSpherical(spherical);
    arrow.position.copy(arrowDirection);
    arrow.lookAt(globe.position);
  });

  // camera = new OrthographicCamera(
  //   frustumSize * aspect / -2, frustumSize * aspect / 2,
  //   frustumSize / 2, frustumSize / -2,
  //   0, 1000,
  // );

  camera = new PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.z = -1 * sphereRadius;
  camera.lookAt(0, 0, 0);

  controls = new OrbitControls(camera, renderer.domElement);

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  stats = Stats();
  document.body.appendChild(stats.dom);

  scene = new Scene();
  scene.add(new AmbientLight(0xFFFFFF, 0.2))

  globe = new Mesh(
    new SphereGeometry(sphereRadius, 16, 16),
    new MeshPhongMaterial({color: 0xFFFF00, wireframe: false, opacity: 0.5}),
  );
  globe.position.set(0, 0, 0);
  scene.add(globe);

  let light = new DirectionalLight(0xFFFFFF);
  light.position.set(25, 25, 0);
  light.lookAt(globe.position);
  scene.add(light);

  arrow = new Mesh(
    new BoxGeometry(5, 5, 10),
    new MeshBasicMaterial({color: 0xFF0000, wireframe: true}),
  );

  arrow.position.copy(arrowDirection);
  scene.add(arrow);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  stats.update();
}
