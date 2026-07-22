/**
 * Synthesizes a crisp, pleasant chime using Web Audio API
 * Avoids external audio asset dependencies or CORS audio playback issues
 */
export function playSuccessChime() {
  if (typeof window === "undefined") return;

  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // Play a 2-tone melodic chime (C5 -> G5)
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playNote(523.25, now, 0.25); // C5
    playNote(783.99, now + 0.12, 0.4); // G5
  } catch (err) {
    console.warn("Could not play audio chime:", err);
  }
}
