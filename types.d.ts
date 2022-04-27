import {Vector3, AnimationClip, Object3D} from "three/src/Three";

// Type definitions for Vib-Ribbon-Three

/**
 * A feature describes a pass/fail event which requires player input at the correct time to complete.
 */
export class Feature {
    geometry_type: string;
    inputs_required: Map<string, Boolean>;
    time: number;
    animation: AnimationClip | null;
    vertices: Array<Vector3>;
}

export class Level {
    song: AudioContext;
    features: Array<Feature>;
    _index: Array<number>;
    _speed: number;
    _vertices: Array<Vector3>;
    generateMesh(): Object3D;
}
