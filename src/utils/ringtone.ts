let audioCtx: AudioContext | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;

function beep(ctx: AudioContext, freq: number, duration: number, startTime: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

export function startRingtone() {
    if (intervalId) return;
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playPattern = () => {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        beep(audioCtx, 480, 0.4, now);
        beep(audioCtx, 620, 0.4, now + 0.5);
    };

    playPattern();
    intervalId = setInterval(playPattern, 2000);
}

export function stopRingtone() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }
}