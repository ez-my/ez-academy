export function pcmWave(channels: Float32Array[], start: number, length: number, sampleRate = 16000): Uint8Array {
  const bytes = new Uint8Array(44 + length * 2);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, length * 2, true);
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, channels.reduce((sum, channel) => sum + (channel[start + i] || 0), 0) / channels.length));
    view.setInt16(44 + i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
  }
  return bytes;
}

// Decode and segment on the learner's device. The app server forwards each
// small chunk to transcription in memory; it never stores an audio file.
export async function transcribeLocalAudio(base64: string, transcribe: (data: string, mimeType: string) => Promise<string>): Promise<string> {
  if (base64.length > Math.ceil(25 * 1024 * 1024 / 3) * 4) throw new Error('Please use an audio file smaller than 25 MB.');
  const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  const decoder = new OfflineAudioContext(1, 1, 16000);
  const audio = await decoder.decodeAudioData(bytes.buffer);
  const channels = Array.from({ length: audio.numberOfChannels }, (_, i) => audio.getChannelData(i));
  const chunkSamples = audio.sampleRate * 60;
  const transcripts: string[] = [];
  for (let start = 0; start < audio.length; start += chunkSamples) {
    const wave = pcmWave(channels, start, Math.min(chunkSamples, audio.length - start), audio.sampleRate);
    // Skip wholly silent tails, which otherwise encourage transcription hallucinations.
    if (!channels.some(channel => channel.subarray(start, Math.min(start + chunkSamples, audio.length)).some(sample => Math.abs(sample) > 0.001))) continue;
    let binary = '';
    for (let offset = 0; offset < wave.length; offset += 32768) binary += String.fromCharCode(...wave.subarray(offset, offset + 32768));
    transcripts.push(await transcribe(btoa(binary), 'audio/wav'));
  }
  const transcript = transcripts.join('\n').trim();
  if (!transcript) throw new Error('No speech was detected in this recording.');
  return transcript;
}
