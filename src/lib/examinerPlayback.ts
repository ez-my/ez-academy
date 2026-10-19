// Unlock the SAME media element during the user's click, before microphone/API awaits.
// Unlocking speechSynthesis does not unlock HTMLAudioElement playback on mobile browsers.
export const SILENT_AUDIO = 'data:audio/wav;base64,UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAACA';
export function primeExaminerAudio(audio: HTMLAudioElement) {
  audio.src = SILENT_AUDIO;
  audio.load();
  // Do not pause asynchronously: a later question may already be using this element.
  void audio.play().catch(() => {});
}
