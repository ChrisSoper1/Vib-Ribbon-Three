import {
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Vector3,
} from "three/src/Three";

export const featureWidth = 15;
export const featureHeight = 20;
let waveWidthStep = featureWidth / 8;
let widthStep = featureWidth / 8;
let heightStep = featureHeight / 8;

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

/** This is incomplete **/
export const LOOP = new Line(
  new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0),
    new Vector3(widthStep * 6, heightStep * 1, 0),
    new Vector3(widthStep * 7, heightStep * 2, 0),
    new Vector3(widthStep * 7, heightStep * 3, 0),
    new Vector3(widthStep * 6, heightStep * 4.2, 0),
    new Vector3(widthStep * 5, heightStep * 4.4, 0),
    new Vector3(widthStep * 4, heightStep * 4.6, 0),
    new Vector3(widthStep * 3, heightStep * 4.4, 0),
    new Vector3(widthStep * 2, heightStep * 4.2, 0),
    new Vector3(widthStep * 1, heightStep * 3, 0),
    new Vector3(widthStep * 1, heightStep * 2, 0),
    new Vector3(widthStep * 2, heightStep * 1, 0),
    new Vector3(featureWidth, 0, 0),
  ]),
  new LineBasicMaterial({color: 0xFFFFFF}),
);

export const WAVE = new Line(
  new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0),
    new Vector3(waveWidthStep * 1, featureHeight / 3, 0),
    new Vector3(waveWidthStep * 2, featureHeight / -3, 0),
    new Vector3(waveWidthStep * 3, featureHeight / 3, 0),
    new Vector3(waveWidthStep * 4, featureHeight / -3, 0),
    new Vector3(waveWidthStep * 5, featureHeight / 3, 0),
    new Vector3(waveWidthStep * 6, featureHeight / -3, 0),
    new Vector3(waveWidthStep * 7, featureHeight / 3, 0),
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
