/* Procedural storm audio (Web Audio): rain bed + thunder + UI sound effects with fine-grained settings. */
window.Sound = (function () {
  let ctx, master, rainGain, windGain, on = false, started = false;
  let ambientOn = true, sfxOn = true, masterVol = 0.8;

  try {
    const s = JSON.parse(localStorage.getItem('fg_sound_opts') || '{}');
    if (s.ambient !== undefined) ambientOn = !!s.ambient;
    if (s.sfx !== undefined) sfxOn = !!s.sfx;
    if (s.volume !== undefined) masterVol = Math.max(0, Math.min(1, +s.volume));
  } catch (_) {}

  function save() {
    try {
      localStorage.setItem('fg_sound_opts', JSON.stringify({ ambient: ambientOn, sfx: sfxOn, volume: masterVol }));
    } catch (_) {}
  }

  function noiseBuf(sec) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function updateAmbient() {
    if (!ctx) return;
    const targetRain = (on && ambientOn) ? 0.22 : 0;
    const targetWind = (on && ambientOn) ? 0.08 : 0;
    if (rainGain) {
      rainGain.gain.cancelScheduledValues(ctx.currentTime);
      rainGain.gain.linearRampToValueAtTime(targetRain, ctx.currentTime + 0.3);
    }
    if (windGain) {
      windGain.gain.cancelScheduledValues(ctx.currentTime);
      windGain.gain.linearRampToValueAtTime(targetWind, ctx.currentTime + 0.3);
    }
  }

  function init() {
    if (started) return; started = true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      const src = ctx.createBufferSource(); src.buffer = noiseBuf(3); src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = .5;
      rainGain = ctx.createGain(); rainGain.gain.setValueAtTime(0, ctx.currentTime);
      src.connect(bp); bp.connect(rainGain); rainGain.connect(master); src.start();
      // slow howling wind
      const w = ctx.createBufferSource(); w.buffer = noiseBuf(3); w.loop = true;
      const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = .8;
      windGain = ctx.createGain(); const lfo = ctx.createOscillator(), lg = ctx.createGain();
      windGain.gain.value = 0; lfo.frequency.value = .13; lg.gain.value = .07;
      lfo.connect(lg); lg.connect(windGain.gain); w.connect(wf); wf.connect(windGain); windGain.connect(master); w.start(); lfo.start();
      set(true);
    } catch (e) { ctx = null; }
  }

  function set(v) {
    on = v; if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(v ? (masterVol * 0.95) : 0, ctx.currentTime + .3);
    updateAmbient();
  }

  function setVolume(v) {
    masterVol = Math.max(0, Math.min(1, v));
    save();
    if (!ctx || !on) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(masterVol * 0.95, ctx.currentTime + .1);
  }

  function setAmbient(v) {
    ambientOn = !!v;
    save();
    updateAmbient();
  }

  function setSfx(v) {
    sfxOn = !!v;
    save();
  }

  function thunder(delay = .3, power = 1) {
    if (!ctx || !on || !sfxOn) return;
    const t = ctx.currentTime + delay;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf(4);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(70, t + 3);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(1.1 * power, t + .06);
    g.gain.exponentialRampToValueAtTime(.35 * power, t + .9);
    g.gain.exponentialRampToValueAtTime(.001, t + 3.6);
    s.connect(lp); lp.connect(g); g.connect(master); s.start(t); s.stop(t + 4);
  }

  function blip(f = 660) {
    if (!ctx || !on || !sfxOn) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .25);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + .3);
  }

  function sweep(sec, f0, f1, peak, type) {
    if (!ctx || !on || !ambientOn) return;
    const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = noiseBuf(Math.ceil(sec) + 1);
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + sec * .75); f.frequency.exponentialRampToValueAtTime(f0 * 1.3, t + sec);
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + sec * .75); g.gain.exponentialRampToValueAtTime(.001, t + sec);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + sec + .1);
  }

  const surge = () => { sweep(6, 150, 1400, 1, 'lowpass'); thunder(.1, .9); };
  const whoosh = (quick) => sweep(quick ? .7 : 1.2, 300, 2600, .5, 'bandpass');

  return {
    init, set, setVolume, setAmbient, setSfx, thunder, blip, surge, whoosh,
    get on() { return on; },
    get ambient() { return ambientOn; },
    get sfx() { return sfxOn; },
    get volume() { return masterVol; }
  };
})();
