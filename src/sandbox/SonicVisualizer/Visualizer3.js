/**
 * note: this does not work in firefox due to a lack of support of OfflineAudioContext.suspend()
 *  and OfflineAudioContext.resume(), which are required for pre-processing audio using the WebAudio API
 *
 *  TODO: https://github.com/chrisguttandin/standardized-audio-context appears to fix the above issue, may be worth
 *   considering
 *
 * Using SonicVisualizer3
 *
 * Place this code in the entrypoint index.js
 *
 *     import {BasicPlayer} from './sandbox/SonicVisualizer';
 *     const audioFile = './song.mp3';
 *     const app = new SonicVisualizer3(audioFile);
 *     app.start()
 */
import {
  AmbientLight,
  AnimationMixer,
  Audio as ThreeAudio,
  AudioLoader,
  AudioListener,
  LuminanceFormat,
  RedFormat,
  DataTexture,
  BufferAttribute,
  ShaderMaterial,
  PlaneGeometry,
  Mesh,
  Clock,
  OrthographicCamera,
  Scene,
  Points,
  BufferGeometry,
  PointsMaterial,
  Line,
  LineBasicMaterial,
  Vector3,
  WebGLRenderer,
} from "three/src/Three";

import {OfflineAudioAnalyser} from './OfflineAudioAnalyzer';

import {sharedDebugPanel} from "../../utils/debug_panel";
import {getDefaultCamera, getDefaultRenderer} from "./helpers";

const fftSize = 1024;
const sampleRate = 44100;
const bufferSize = 40;

export class SonicVisualizer3 {
  constructor(audioFile) {
    this.audioFile = audioFile;

    this.renderer = getDefaultRenderer();
    this.scene = new Scene();
    this.camera = getDefaultCamera();

    // load audio
    this.audio = new ThreeAudio(new AudioListener());
    this.loader = new AudioLoader();
    this.audioContext = new AudioContext();
    this.songLive = this.audioContext.createBufferSource();

    this.audioLoaded = new Promise(resolve => this.loader.load(this.audioFile, resolve))
      .then(decodedAudioData => {
        console.log('Audio file loaded successfully, populating context');

        this.audioContextOffline = new OfflineAudioContext(
          1,
          // decodedAudioData.numberOfChannels,
          decodedAudioData.length,
          decodedAudioData.sampleRate,
        );

        this.analyser = new OfflineAudioAnalyser(this.audioContextOffline, fftSize);

        this.songOffline = this.audioContextOffline.createBufferSource();
        this.songOffline.buffer = decodedAudioData;
        this.songOffline.connect(this.audioContextOffline.destination);
        this.songOffline.connect(this.analyser.fft);
        this.songOffline.start();

        console.log("About to configure interrupts");
        // let outArray = new Float32Array(analyserNode.frequencyBinCount);

        for (let k = fftSize; k < decodedAudioData.length; k += fftSize) {
          this.audioContextOffline.suspend(k / decodedAudioData.sampleRate)
            .then(() => {
              this.analyser.updateSpectralFluxSamples();
            })
            .then(() => this.audioContextOffline.resume());
        }
        console.log("Done!");

        let output = this.audioContextOffline.startRendering().then(() => {
          console.log('Peaks', this.analyser.spectralFluxSamples.filter(x => x.isPeak).map(x => ({
            time: x.time,
            bins: x.spectralBinData,
          })));
        });

        console.log('AudioContext source populated successfully');

        return output;
      });


    this.scene.add(new AmbientLight(0xFFFFFF, 0.8));

    this.geometry = new BufferGeometry();
    this.positionArray = new Uint8Array(fftSize / 2);
    this.positionAttribute = new BufferAttribute(this.positionArray, 3);
    this.geometry.setAttribute('position', this.positionAttribute);
    this.mesh = new Points(this.geometry, new PointsMaterial({"color": 0xFFFFFF, size: 5}));
    this.mesh.scale.set(4, 1, 1);
    this.scene.add(this.mesh);

    this.geometryT = new BufferGeometry();
    this.positionArrayT = new Uint8Array(fftSize);
    this.positionAttributeT = new BufferAttribute(this.positionArrayT, 3);
    this.geometryT.setAttribute('position', this.positionAttributeT);
    // this.meshT = new Line(this.geometryT, new LineBasicMaterial({"color": 0xFFFF00}));
    this.meshT = new Points(this.geometryT, new PointsMaterial({"color": 0xFFFF00}));
    this.meshT.scale.set(4, 1, 1);
    this.scene.add(this.meshT);

    document.body.appendChild(this.renderer.domElement);
    window.addEventListener('resize', () => this.renderer.setSize(window.innerWidth, window.innerHeight));
  }

  start() {
    this.audioLoaded.then((source) => {
      this.animate();
    });
  }

  animate() {
    try {
      // this.analyser.updateSpectralFluxSamples();
      this.drawPoints(this.analyser.fData, this.positionArray, this.geometry);
      this.drawPoints(this.analyser.tData, this.positionArrayT, this.geometryT);

      sharedDebugPanel.update();

      this.renderer.render(this.scene, this.camera);

      requestAnimationFrame(() => this.animate());
    } catch (error) {
      console.log(error);
      console.log("Broke");
    }
  }

  drawPoints(dataArray, positionArray, geometry) {
    positionArray = [];
    for (let i = 0; i < dataArray.length; i++) {
      positionArray.push(i);  // X
      positionArray.push(dataArray[i]);  // Y
      positionArray.push(0); // Z
    }
    let positionAttr = new BufferAttribute(new Uint8Array(positionArray), 3);
    geometry.setAttribute('position', positionAttr);
  }
}
