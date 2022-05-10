import {
  AmbientLight,
  Color,
  PerspectiveCamera,
  LineBasicMaterial,
  OrthographicCamera,
  WebGLRenderer,
  Scene,
  Vector3,
  Clock,
  BufferGeometry,
  Group,
  Object3D,
  Line,
  ArrowHelper, LineSegments,
} from "three/src/Three";
import Stats from "three/examples/jsm/libs/stats.module";
import {Pane} from "tweakpane";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {CSS2DRenderer, CSS2DObject} from "three/examples/jsm/renderers/CSS2DRenderer";

document.body.style.margin = '0px';
const renderer = new WebGLRenderer();
const labelRenderer = new CSS2DRenderer();

let scene, camera, stats, controls, gui;
let arrow, border, movementGroup;
let gridIndexes;

const clock = new Clock();
const rulerMaterial = new LineBasicMaterial({color: 0xFFFFFF});
const borderMaterial = new LineBasicMaterial({color: 0xFFFFFF, linewidth: 5});

const PARAMS = {
  xPos: 0,
  yPos: 0,
  zPos: 0,
  aspect: window.innerWidth / window.innerHeight,
  cameraDistance: 5,
  speed: 2,
  nextTick: 0,
  nextTickStart: 0,
  nextTickEnd: 0,
  frustumSize: 25, //100
  elapsedTime: 0,
  indexPos: 0,
  timeDelta: 0,
};

export function main() {
  makeGui();
  init();
  animate();
}

function init() {
  scene = new Scene();
  movementGroup = new Group();
  scene.add(movementGroup);

  camera = new OrthographicCamera(
    PARAMS.frustumSize * PARAMS.aspect / -2, PARAMS.frustumSize * PARAMS.aspect / 2,
    PARAMS.frustumSize / 2, PARAMS.frustumSize / -2,
    0, 1000,
  );

  // camera = new PerspectiveCamera(75, PARAMS.aspect, 0.1, 1000);
  camera.position.z = PARAMS.cameraDistance;
  camera.lookAt(0, 0, 0);
  movementGroup.add(camera);

  controls = new OrbitControls(camera, renderer.domElement);

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  document.body.appendChild(labelRenderer.domElement);

  stats = Stats();
  document.body.appendChild(stats.dom);

  arrow = new ArrowHelper(new Vector3(1, 0, 0), new Vector3(-10, 0, 0), 10, 0xFFFF00, 5, 10);
  movementGroup.add(arrow);

  border = makeBorder();
  movementGroup.add(border);

  scene.add(new AmbientLight(0xffffff, 0.8));
  gridIndexes = makeGrid();

  window.addEventListener('resize', onWindowResize);

}

let borderFlashing = true;

function animate() {
  requestAnimationFrame(animate);
  updateFrame(clock.getDelta());
  updateBorder();

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  stats.update();
}

/**
 * Update positions and telemetry
 *
 * @param timeDelta
 */
function updateFrame(timeDelta) {
  movementGroup.translateX(timeDelta * PARAMS.speed);
  PARAMS.elapsedTime = clock.getElapsedTime() * PARAMS.speed;
  PARAMS.xPos = movementGroup.position.x;
  PARAMS.yPos = movementGroup.position.y;
  PARAMS.zPos = movementGroup.position.z;
  PARAMS.timeDelta = timeDelta;
  PARAMS.nextTick = gridIndexes[PARAMS.indexPos] * PARAMS.speed;
  PARAMS.nextTickStart = PARAMS.nextTick;
  PARAMS.nextTickEnd = PARAMS.nextTick + 0.2;
  gui.refresh();
}

/**
 * Update timing border state
 *
 * MUST be run after updateFrame!
 */
function updateBorder() {
  if (PARAMS.elapsedTime >= PARAMS.nextTickStart && PARAMS.elapsedTime <= PARAMS.nextTickEnd) {
    borderMaterial.color = new Color(0xFF0000);
    borderFlashing = true;
  } else {
    if (borderFlashing) {
      PARAMS.indexPos = PARAMS.indexPos + 1;
      borderFlashing = false;
      borderMaterial.color = new Color(0xFFFFFF);
    }
  }
}

/**
 * Debug GUI initialization
 */
function makeGui() {
  let _paneElem = document.createElement('div');
  _paneElem.style.zIndex = '1000';
  _paneElem.style.position = 'absolute';
  _paneElem.style.top = '0';
  _paneElem.style.right = '0';
  document.body.appendChild(_paneElem);

  gui = new Pane({container: _paneElem});
  gui.addMonitor(PARAMS, 'elapsedTime', {interval: 500});
  gui.addMonitor(PARAMS, 'xPos', {interval: 500});
  gui.addMonitor(PARAMS, 'timeDelta');
  gui.addInput(PARAMS, 'speed', {
    min: 0,
    max: 50,
  });
  gui.addMonitor(PARAMS, 'indexPos', {interval: 500});
  gui.addMonitor(PARAMS, 'nextTick', {interval: 500});
  gui.addMonitor(PARAMS, 'nextTickStart', {interval: 500});
  gui.addMonitor(PARAMS, 'nextTickEnd', {interval: 500});

}

/**
 * Background ruler initialization
 *
 * later - instancing: https://codeburst.io/infinite-scene-with-threejs-and-instancedmesh-adc74b8efcf4
 * @returns {*[]}
 */
function makeGrid() {
  let bufferGeom = new BufferGeometry().setFromPoints([
    new Vector3(0, -100, 0),
    new Vector3(0, 100, 0),
  ]);
  let mesh = new Line(bufferGeom, rulerMaterial);
  let index = [];
  for (let i = 0; i < 100; i++) {
    const m = mesh.clone();
    const distance = i * PARAMS.speed;
    index.push(i);
    m.position.set(distance, 0, 0);
    scene.add(m);
    addLabel(m.position.x.toString(), m);
  }
  // return index
  return index;
}

/**
 * Initialize the flashing timing border
 *
 * @returns {LineSegments}
 */
function makeBorder() {
  const margin = 1;
  let borderG = new BufferGeometry().setFromPoints([
    new Vector3(camera.left + margin, camera.top - margin, 0),
    new Vector3(camera.right - margin, camera.top - margin, 0),
    new Vector3(camera.right - margin, camera.top - margin, 0),
    new Vector3(camera.right - margin, camera.bottom + margin, 0),
    new Vector3(camera.right - margin, camera.bottom + margin, 0),
    new Vector3(camera.left + margin, camera.bottom + margin, 0),
    new Vector3(camera.left + margin, camera.bottom + margin, 0),
    new Vector3(camera.left + margin, camera.top - margin, 0),
  ]);
  return new LineSegments(borderG, borderMaterial);
}

/**
 * Add a label ot an object
 *
 * @param {string} labelText
 * @param {THREE.Object3D} object - object to attach label to (or scene)
 */
function addLabel(labelText, object) {
  const div = document.createElement('div');
  div.className = 'label';
  div.textContent = labelText.toString();
  div.style.marginTop = '-1em';
  div.style.color = '#FFF';
  div.style.fontFamily = 'sans-serif';
  div.style.fontSize = '36px';
  div.style.padding = '2px';
  div.style.background = 'rgba(0, 0, 0, 0.2 )';

  const label = new CSS2DObject(div);
  label.position.set(0, 0, 0);
  object.add(label);
  return label;
}

/**
 * Window resize handler
 */
function onWindowResize() {
  if (camera.isPerspectiveCamera) {
    PARAMS.aspect = window.innerWidth / window.innerHeight;
    camera.aspect = PARAMS.aspect;
    camera.updateProjectionMatrix();
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
}