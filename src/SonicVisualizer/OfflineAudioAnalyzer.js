import {sharedDebugPanel} from "../utils/debug_panel";

export class OfflineAudioAnalyser {
  constructor(context, fftSize = 2048) {
    this.audioContext = context;
    this.fft = this.audioContext.createAnalyser();
    this.fft.fftSize = fftSize;
    this.tData = new Uint8Array(this.fft.fftSize);
    this.fData = new Uint8Array(this.fft.frequencyBinCount);
    this.fDataPrevious = new Uint8Array(this.fft.frequencyBinCount);

    this.spectralFluxSamples = [];

    // PPM Window Size of 20 approx is 10 secs on MBP
    this.ppmWindowSize = 20;
    this.thresholdWindowSize = 30;
    this.indexToProcess = this.thresholdWindowSize / 2;
    this.thresholdMultiplier = 1.2;

    // For feature analysis
    this.featureBinSize = Math.floor(this.fData.length / 4);
    this.prevFeatureBin = new Uint8Array(this.featureBinSize);
    this.currentFeatureBin = new Uint8Array(this.featureBinSize);
    // sharedDebugPanel.addLoggerCallback(() => this.logSpectralFluxSamples());
    sharedDebugPanel.enable();
  }

  /**
   * Update this.fData with the frequency-domain data for the current frame
   *
   * @returns {Uint8Array}
   */
  getFrequencyData() {
    this.fft.getByteFrequencyData(this.fData);
    this.fData.copyWithin(this.fDatPrevious, 0);
    return this.fData;
  }

  /**
   * Update this.tData with the time-domain data for the current frame
   *
   * @returns {Uint8Array}
   */
  getTimeDomainData() {
    this.fft.getByteTimeDomainData(this.tData);
    return this.tData;
  }

  /**
   * Return relative (rectified) spectralFlux between the current frame and the previous
   *
   * @param inputArray
   * @param previousInputArray
   * @returns {number}
   */
  getRectifiedSpectralFlux(inputArray, previousInputArray) {
    let sumf = 0;
    for (let i = 0; i < inputArray.length; i++) {
      sumf += Math.max(0, inputArray[i] - previousInputArray[i]);
    }
    return sumf;
  }

  /**
   * Primary update method
   */
  updateSpectralFluxSamples() {
    this.getFrequencyData();
    this.getTimeDomainData();
    let spectrumData = {
      "time": this.audioContext.currentTime,
      "ppmEstimate": null,
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

  /**
   * Return a dynamic thresholding value for the spectralFlux for a frame
   *
   * @param spectralFluxIndex
   * @returns {number}
   */
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

  /**
   * Return the threshold-clipped spectralFlux for a frame.
   *
   * @param spectralFluxIndex
   * @returns {number}
   */
  getPrunedSpectralFlux(spectralFluxIndex) {
    return Math.max(
      0,
      this.spectralFluxSamples[spectralFluxIndex].spectralFlux - this.spectralFluxSamples[spectralFluxIndex].threshold,
    );
  }

  /**
   * Calculate if a frame is a "peak"
   *
   * @param spectralFluxIndex
   * @returns {boolean}
   */
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
   *
   * @param spectralFluxIndex
   * @returns {number}
   */
  estimatePPM(spectralFluxIndex) {
    let estimationWindow = this.spectralFluxSamples.slice(
      Math.max(0, spectralFluxIndex - this.ppmWindowSize * this.thresholdWindowSize),
      spectralFluxIndex,
    );

    // Get the time span of the window
    let time_window = estimationWindow[estimationWindow.length - 1].time - estimationWindow[0].time;
    let multiplier = 60 / time_window;

    let numPeaks = estimationWindow
      .map(value => value.isPeak)
      .reduce((previous, value) => value ? previous + 1 : previous, 0);

    let ppm = numPeaks * multiplier;

    return ppm;
  }

  /**
   * Calculate rectifiedSpectralFlux for discrete bins in fData
   *
   * @returns {Number[][]}
   */
  getfDataBinned() {
    let outputBins = [];

    for (let i = 0; i < 4; i++) {
      // Clobber tempfeaturebin

      this.currentFeatureBin = this.fData.slice(
        this.featureBinSize * i,
        this.featureBinSize * (i + 1),
      );
      this.prevFeatureBin = this.fDataPrevious.slice(
        this.featureBinSize * i,
        this.featureBinSize * (i + 1),
      );

      outputBins.push(this.getRectifiedSpectralFlux(this.currentFeatureBin, this.prevFeatureBin));
    }
    return outputBins;
  }
}