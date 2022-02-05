export class AudioAnalyser {
  constructor(context, fftSize = 2048) {
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.tData = new Uint8Array(this.analyser.fftSize);
    this.fData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  getFrequencyData() {
    this.analyser.getByteFrequencyData(this.fData);
    return this.fData;
  }

  getTimeDomainData() {
    this.analyser.getByteTimeDomainData(this.tData);
    return this.tData;
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
}