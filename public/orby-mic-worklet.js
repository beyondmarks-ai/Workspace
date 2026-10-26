class OrbyMicrophone extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = new Int16Array(1600);
    this.used = this.weight = this.sum = 0;
    this.stopped = false;
    this.port.onmessage = ({ data }) => {
      if (data === 'stop') { this.stopped = true; this.flush(); this.port.postMessage('stopped'); }
    };
  }
  flush() {
    if (!this.used) return;
    const bytes = this.samples.slice(0, this.used).buffer;
    this.port.postMessage(bytes, [bytes]);
    this.used = 0;
  }
  process(inputs) {
    if (this.stopped) return false;
    const ratio = sampleRate / 16000;
    for (const sample of inputs[0]?.[0] || []) {
      let remaining = 1;
      while (remaining > 1e-8) {
        const portion = Math.min(remaining, ratio - this.weight);
        this.sum += sample * portion;
        this.weight += portion;
        remaining -= portion;
        if (this.weight >= ratio - 1e-8) {
          const value = Math.max(-1, Math.min(1, this.sum / ratio));
          this.samples[this.used++] = Math.round(value * (value < 0 ? 32768 : 32767));
          this.sum = this.weight = 0;
          if (this.used === this.samples.length) this.flush();
        }
      }
    }
    return true;
  }
}
registerProcessor('orby-microphone', OrbyMicrophone);
