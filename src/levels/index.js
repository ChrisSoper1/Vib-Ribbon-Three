import {
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Vector3,
} from "three/src/Three";
import {MeshBasicMaterial} from "three";


export const featureWidth = 10;
export const featureHeight = 20;

export const LINE = new Line(
  new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0),
    new Vector3(featureWidth, 0, 0),
  ]),
  new LineBasicMaterial({color: 0xFFFFFF}),
);

export const BLOCK = new Line(
  new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0),
    new Vector3(0, featureHeight, 0),
    new Vector3(featureWidth, featureHeight, 0),
    new Vector3(featureWidth, 0, 0),
  ]),
  new LineBasicMaterial({color: 0xFFFFFF}),
);

export const PIT = new Line(
  new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0),
    new Vector3(featureWidth / 2, featureHeight * -1, 0),
    new Vector3(featureWidth, 0, 0),
  ]),
  new LineBasicMaterial({color: 0xFFFFFF}),
);

const LOOP = [];

let waveStep = featureWidth / 7;
export const WAVE = new Line(
  new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0),
    new Vector3(waveStep * 1, featureHeight / 3, 0),
    new Vector3(waveStep * 2, featureHeight / -3, 0),
    new Vector3(waveStep * 3, featureHeight / 3, 0),
    new Vector3(waveStep * 4, featureHeight / -3, 0),
    new Vector3(waveStep * 5, featureHeight / 3, 0),
    new Vector3(waveStep * 6, featureHeight / -3, 0),
    new Vector3(waveStep * 7, featureHeight / 3, 0),
    new Vector3(featureWidth, 0, 0),
  ]),
  new LineBasicMaterial({color: 0xFFFFFF}),
);

export const BLOCKPIT = new Line(
  new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0),
    new Vector3(0, featureHeight, 0),
    new Vector3(featureWidth / 2, featureHeight / 2, 0),
    new Vector3(featureWidth, featureHeight, 0),
    new Vector3(featureWidth, 0, 0),
  ]),
  new LineBasicMaterial({color: 0xFFFFFF}),
);

const BLOCKLOOP = [];
const BLOCKWAVE = [];

const PITLOOP = [];
const PITWAVE = [];

const LOOPWAVE = [];
