import {sharedDebugPanel} from "../utils/debug_panel";

export class AudioAnalyser {
  constructor(context, fftSize = 2048) {
    this.audioContext = context;
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.tData = new Uint8Array(this.analyser.fftSize);
    this.fData = new Uint8Array(this.analyser.frequencyBinCount);
    this.fDataPrevious = new Uint8Array(this.analyser.frequencyBinCount);

    this.spectralFluxSamples = [];
    // PPM Window Size of 20 approx is 10 secs on MBP
    this.ppmWindowSize = 20;
    this.thresholdWindowSize = 30;
    this.indexToProcess = this.thresholdWindowSize / 2;
    this.thresholdMultiplier = 1.2;
    //this.rollingFData = [];

    // For feature analysis
    this.featureBinSize = Math.floor(this.fData.length / 4);
    this.prevFeatureBin = new Uint8Array(this.featureBinSize);
    this.currentFeatureBin = new Uint8Array(this.featureBinSize);
    sharedDebugPanel.addLoggerCallback(() => this.logSpectralFluxSamples());
    sharedDebugPanel.enable();
  }

  getFrequencyData() {
    this.analyser.getByteFrequencyData(this.fData);
    this.fData.copyWithin(this.fDataPrevious, 0);
    return this.fData;
  }

  getTimeDomainData() {
    this.analyser.getByteTimeDomainData(this.tData);
    return this.tData;
  }

  getRectifiedSpectralFlux(inputArray, previousInputArray) {
    let sumf = 0;
    // can break this into multiple frequency ranges
    for (let i = 0; i < inputArray.length; i++) {
      sumf += Math.max(0, inputArray[i] - previousInputArray[i]);
    }
    return sumf;
  }

  updateSpectralFluxSamples() {
    this.getFrequencyData();
    let spectrumData = {
      "time": this.audioContext.getOutputTimestamp().contextTime,
      "ppmEstimate": null,
      ppmEstimationWindow: null,
      "spectralFlux": null,
      "spectralBinData": [{}, {}, {}, {}],
      "threshold": null,
      "prunedSpectralFlux": null,
      "isPeak": null,
    };

    // First order metrics (Spectral Flux, Spectral Bin Data)
    this.spectralFluxSamples.push(spectrumData);
    spectrumData.spectralFlux = this.getRectifiedSpectralFlux(this.fData, this.fDataPrevious);
    spectrumData.spectralBinData = this.getfDataBinned();

    // second order metrics (isPeak)
    if (this.spectralFluxSamples.length >= this.thresholdWindowSize) {
      this.spectralFluxSamples[this.indexToProcess].threshold = this.getFluxThreshold(this.indexToProcess);
      this.spectralFluxSamples[this.indexToProcess].prunedSpectralFlux = this.getPrunedSpectralFlux(this.indexToProcess);
      let indexToDetectPeak = this.indexToProcess - 1;
      this.spectralFluxSamples[indexToDetectPeak].isPeak = this.isPeak(indexToDetectPeak);

      // third order metrics (Peaks Per Minute)
      if (this.spectralFluxSamples.length >= this.thresholdWindowSize * this.ppmWindowSize) {
        this.spectralFluxSamples[this.indexToProcess].ppmEstimate = this.estimatePPM(this.indexToProcess);
      }

      this.indexToProcess++;
    }
  }

  getFluxThreshold(spectralFluxIndex) {
    let windowStartIndex = Math.max(0, spectralFluxIndex - this.thresholdWindowSize / 2);
    let windowEndIndex = Math.min(
      this.spectralFluxSamples.length - 1,
      spectralFluxIndex + this.thresholdWindowSize / 2,
    );

    let spectralFluxSum = 0;
    for (let i = windowStartIndex; i < windowEndIndex; i++) {
      spectralFluxSum += this.spectralFluxSamples[i].spectralFlux;
    }
    let avgf = spectralFluxSum / (windowEndIndex - windowStartIndex);
    return avgf * this.thresholdMultiplier;
  }

  getPrunedSpectralFlux(spectralFluxIndex) {
    return Math.max(
      0,
      this.spectralFluxSamples[spectralFluxIndex].spectralFlux - this.spectralFluxSamples[spectralFluxIndex].threshold,
    );
  }

  isPeak(spectralFluxIndex) {
    return (
      this.spectralFluxSamples[spectralFluxIndex].prunedSpectralFlux >
      this.spectralFluxSamples[spectralFluxIndex + 1].prunedSpectralFlux &&
      this.spectralFluxSamples[spectralFluxIndex].prunedSpectralFlux >
      this.spectralFluxSamples[spectralFluxIndex - 1].prunedSpectralFlux
    );
  }

  /**
   * Calculate an estimated current PPM (peaks per minute)
   */
  estimatePPM(spectralFluxIndex) {
    let estimationWindow = this.spectralFluxSamples.slice(
      Math.max(0, spectralFluxIndex - this.ppmWindowSize * this.thresholdWindowSize),
      spectralFluxIndex,
    );

    // Get the time span of the window
    let time_window = estimationWindow[estimationWindow.length - 1].time - estimationWindow[0].time;
    let multiplier = 60 / time_window;

    // TODO: This BAD
    // Add debug info to the flux sample directly
    this.spectralFluxSamples[spectralFluxIndex].ppmEstimationWindow = time_window;

    let numPeaks = estimationWindow
      .map(value => value.isPeak)
      .reduce((previous, value) => value ? previous + 1 : previous, 0);

    let ppm = numPeaks * multiplier;

    return ppm;
  }

  getfDataBinned() {
    let outputBins = [];

    for (let i = 0; i < 4; i++) {
      // Clobber tempfeaturebin

      this.currentFeatureBin = this.fData.slice(
        this.featureBinSize * i,
        this.featureBinSize * (i+1),
      );
      this.prevFeatureBin = this.fDataPrevious.slice(
        this.featureBinSize * i,
        this.featureBinSize * (i+1),
      );

      // this.fDataPrevious.copyWithin(
      //   this.prevFeatureBin,
      //   this.featureBinSize * i,
      //   this.featureBinSize * (i + 1),
      // );

      // console.log(this.getRectifiedSpectralFlux(this.currentFeatureBin, this.prevFeatureBin));
      outputBins.push(this.getRectifiedSpectralFlux(this.currentFeatureBin, this.prevFeatureBin));
    }
    return outputBins;
  }

  getAverageFrequency() {
    let value = 0;
    const data = this.getFrequencyData();
    for (let i = 0; i < data.length; i++) {
      value += data[i];
    }
    return value / data.length;
  }

  getAverageAmplitude() {
    let value = 0;
    const data = this.getTimeDomainData();
    return Math.max(...data);
    for (let i = 0; i < data.length; i++) {
      value += data[i];
    }
    return value / data.length;
  }

  logSpectralFluxSamples() {
    let __ = (str) => parseFloat(str).toFixed(3);
    let indexDisplayed = this.indexToProcess - 2;
    try {
      return `<table>
      <tr><th colspan="2">SpectralFluxSamples</th></tr>
      <tr><th><strong>index</strong></th><td>${indexDisplayed}</td></tr>
      <tr><th>Time (s)</th><td>${__(this.spectralFluxSamples[indexDisplayed].time)}</td></tr>
      <tr><th>PPM Estimation Window</th><td>${__(this.spectralFluxSamples[indexDisplayed].ppmEstimationWindow)}</td></tr>
      <tr><th>PPM Estimate</th><td>${__(this.spectralFluxSamples[indexDisplayed].ppmEstimate)}</td></tr>
      <tr><th>isPeak</th><td>${this.spectralFluxSamples[indexDisplayed - 5].isPeak}</td></tr>
      <tr><th>isPeak</th><td>${this.spectralFluxSamples[indexDisplayed - 4].isPeak}</td></tr>
      <tr><th>isPeak</th><td>${this.spectralFluxSamples[indexDisplayed - 3].isPeak}</td></tr>
      <tr><th>isPeak</th><td>${this.spectralFluxSamples[indexDisplayed].isPeak}</td></tr>
      <tr><th>prunedSpectralFlux</th><td>${__(this.spectralFluxSamples[indexDisplayed].prunedSpectralFlux)}</td></tr>
      <tr><th>spectralFlux</th><td>${this.spectralFluxSamples[indexDisplayed].spectralFlux}</td></tr>
      <tr><th>threshold</th><td>${__(this.spectralFluxSamples[indexDisplayed].threshold)}</td></tr>
      <tr><th>sampleLength</th><td>${this.spectralFluxSamples.length}</td></tr>
      <tr>
        <th>Spectral Bin 1</th>
        <td>${this.spectralFluxSamples[indexDisplayed].spectralBinData[0]}</td>
      </tr>
      <tr>
        <th>Spectral Bin 2</th>
        <td>${this.spectralFluxSamples[indexDisplayed].spectralBinData[1]}</td>
      </tr>
      <tr>
        <th>Spectral Bin 3</th>
        <td>${this.spectralFluxSamples[indexDisplayed].spectralBinData[2]}</td>
      </tr>
      <tr>
        <th>Spectral Bin 4</th>
        <td>${this.spectralFluxSamples[indexDisplayed].spectralBinData[3]}</td>
      </tr>
    </table>`;
    } catch {
      return `<table>
        <tr><th colspan="2">SpectralFluxSamples</th></tr>
        </table>`;
    }
  }
}