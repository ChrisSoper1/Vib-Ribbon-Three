import {sharedDebugPanel} from "../utils/debug_panel";

export class AudioAnalyser {
  constructor(context, fftSize = 2048) {
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.tData = new Uint8Array(this.analyser.fftSize);
    this.fData = new Uint8Array(this.analyser.frequencyBinCount);
    this.fDataPrevious = new Uint8Array(this.analyser.frequencyBinCount);
    this.spectralFluxSamples = [];
    this.thresholdWindowSize = 30;
    this.indexToProcess = this.thresholdWindowSize / 2;
    this.thresholdMultiplier = 1.5;
    //this.rollingFData = [];
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

  getRectifiedSpectralFlux() {
    let sumf = 0;
    // can break this into multiple frequency ranges
    for(let i = 0; i < this.fData.length; i++){
        sumf += Math.max(0, this.fData[i] - this.fDataPrevious[i]);
    }
    return sumf;
  }

  updateSpectralFluxSamples(){
    this.getFrequencyData();
    let spectrumData = {
        "time": null,
        "spectralFlux": null,
        "threshold": null,
        "prunedSpectralFlux": null,
        "isPeak": null
    };
    this.spectralFluxSamples.push(spectrumData);
    spectrumData.spectralFlux = this.getRectifiedSpectralFlux(this.indexToProcess);

    if (this.spectralFluxSamples.length >= this.thresholdWindowSize){
        this.spectralFluxSamples[this.indexToProcess].threshold = this.getFluxThreshold(this.indexToProcess);
        this.spectralFluxSamples[this.indexToProcess].prunedSpectralFlux = this.getPrunedSpectralFlux(this.indexToProcess);
        let indexToDetectPeak = this.indexToProcess- 1;
        this.spectralFluxSamples[indexToDetectPeak].isPeak = this.isPeak(indexToDetectPeak);
        this.indexToProcess++;
    }
  }

  getFluxThreshold(spectralFluxIndex){
    let windowStartIndex = Math.max(0, spectralFluxIndex - this.thresholdWindowSize /2);
    let windowEndIndex = Math.min(this.spectralFluxSamples.length -1, spectralFluxIndex + this.thresholdWindow/2)

    let spectralFluxSum = 0;
    for(let i = windowStartIndex; i < windowEndIndex; i++){
        spectralFluxSum += this.spectralFluxSamples[i];
    }
    let avg = spectralFluxSum / (windowEndIndex - windowStartIndex);
    return avg * this.thresholdMultiplier;
  }

  getPrunedSpectralFlux(spectralFluxIndex) {
		return Math.max (
		    0,
		    this.spectralFluxSamples[spectralFluxIndex].spectralFlux - this.spectralFluxSamples[spectralFluxIndex].threshold
		);
  }

   isPeak(spectralFluxIndex){
		return(
		    this.spectralFluxSamples[spectralFluxIndex].prunedSpectralFlux > this.spectralFluxSamples[spectralFluxIndex + 1].prunedSpectralFlux &&
			this.spectralFluxSamples[spectralFluxIndex].prunedSpectralFlux > this.spectralFluxSamples[spectralFluxIndex - 1].prunedSpectralFlux
			)
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
    return Math.max(...data)
    for (let i = 0; i < data.length; i++) {
      value += data[i];
    }
    return value / data.length;
  }

    logSpectralFluxSamples() {
    try{
    return `<table>
    <tr><th colspan="2">SpectralFluxSamples</th></tr>
    <tr><th>isPeak</th><td>${this.spectralFluxSamples[50].isPeak}</td></tr>
    <tr><th>prunedSpectralFlux</th><td>${this.spectralFluxSamples[50].prunedSpectralFlux}</td></tr>
    <tr><th>spectralFlux</th><td>${this.spectralFluxSamples[50].spectralFlux}</td></tr>
    <tr><th>threshold</th><td>${this.spectralFluxSamples[50].threshold}</td></tr>
    <tr><th>sampleLength</th><td>${this.spectralFluxSamples.length}</td></tr>
    </table>`;
    }
    catch {
        return `<table>
        <tr><th colspan="2">SpectralFluxSamples</th></tr>
        </table>`;
    }
  }
}