import {AudioLoader, OrthographicCamera, PerspectiveCamera, WebGLRenderer} from "three/src/Three";
import {AudioAnalyser} from "../SonicVisualizer/AudioAnalyzer";

export function getDefaultRenderer() {
  let renderer = new WebGLRenderer({antialias: true});
  renderer.setClearColor(0x222222);
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

export function getPerspectiveCamera() {
  let camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 10, 0);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  return camera
}

/**
 * Load an audio file into a context and attach a new analyzer
 *
 * @param audioFile - audio file path
 * @param audioContext {BaseAudioContext}
 * @param fftSize {number}
 * @returns {Promise<{analyzer: AudioAnalyser, context: BaseAudioContext, source: *}>}
 */
export function loadAudio(audioFile, audioContext = new AudioContext(), fftSize = 1024) {
  const loader = new AudioLoader();
  const analyser = new AudioAnalyser(audioContext, fftSize);
  return new Promise(resolve => loader.load(audioFile, resolve))
    .then(buffer => {
      const source = audioContext.createBufferSource();
      const duration = buffer.duration;
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.connect(analyser.analyser);
      // source.start(0);  Maybe hold off on this?
      return {
        'source': source,
        'context': audioContext,
        'analyzer': analyser,
        'duration': duration,
      };
    });
}
