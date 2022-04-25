import {Vector3} from "three/src/Three";

export const featureWidth = 10;
export const featureHeight = 30;

export function calcBlockVertexes(startPosition) {
  return [
    new Vector3(startPosition, 0, 0),
    new Vector3(startPosition, featureHeight, 0),
    new Vector3(startPosition + featureWidth, featureHeight, 0),
    new Vector3(startPosition + featureWidth, 0, 0),
  ];
}

export function calcPitVertexes(startPosition) {
  return [
    new Vector3(startPosition, 0, 0),
    new Vector3(startPosition + (featureWidth / 2), featureHeight * -1, 0),
    new Vector3(startPosition + featureWidth, 0, 0),
  ];
}


