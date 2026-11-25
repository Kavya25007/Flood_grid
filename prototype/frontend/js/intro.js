/* Cinematic intro: black -> storm clouds -> flood wave -> HELP -> title -> water-wipe into the app. Also exposes Wipe for smooth page transitions. */
window.Wipe = (function () {
  const el = document.getElementById('wipe'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); let busy = false;
  async function run(mid, quick) {            // water rises over the screen, swap the view, water drains away
    if (!el || reduce || busy) { mid && mid(); return; }
    busy = true; const d = quick ? 650 : 1100; el.style.setProperty('--d', d + 'ms');
    if (window.Sound && Sound.whoosh) Sound.whoosh(quick);
    el.className = 'cover'; await wait(d + 80);
    try { await (mid && mid()); } catch (e) { console.warn(e); }
    await wait(140); el.className = 'drain'; await wait(d + 80); el.className = ''; busy = false;
  }
  return { run };
})();

(function () {
  const $ = (id) => document.getElementById(id);
  const intro = $('intro'); let done = false, started = false, timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  // light 2D rain (also the fallback if WebGL is unavailable)
  const r = $('rain2d'); for (let i = 0; i < 70; i++) { const d = document.createElement('i'); d.style.left = Math.random() * 100 + 'vw'; d.style.animationDuration = (.6 + Math.random() * .7) + 's'; d.style.animationDelay = -Math.random() * 2 + 's'; d.style.opacity = .3 + Math.random() * .6; r.appendChild(d); }

  function buildTitle() {
    const t = $('title'); t.textContent = '';
    'FLOODGRID'.split('').forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch; if (i >= 5) s.className = 'g'; s.style.animationDelay = i * 110 + 'ms,' + (i * 110 + 1100) + 'ms'; t.appendChild(s); });
  }
  function caption(text, ms, cls) {           // cinematic subtitle that fades in/out
    const c = $('cap'); c.textContent = text; c.className = 'cap on ' + (cls || '');
    at(ms, () => { c.className = 'cap ' + (cls || ''); });
  }
  function finish() {
    if (done) return; done = true; timers.forEach(clearTimeout); $('cap').className = 'cap';
    FG3D.dive(true);                           // camera plunges toward the water while the wave wipes the screen
    Wipe.run(() => {
      intro.classList.add('hide'); document.body.classList.remove('booting'); document.body.classList.add('in');
      FG3D.dive(false); window.App && App.start();
    }, false);
  }
  function begin() {
    if (started) return; started = true; timers.forEach(clearTimeout);
    Sound.init(); FG3D.begin();
    $('black').classList.add('gone'); $('skip').hidden = false; $('titleblock').hidden = false;
    at(900, () => FG3D.strike(false)); caption('It began with rain.', 3200);
    at(2400, () => FG3D.strike(false));
    at(3600, () => { FG3D.strike(true); Sound.surge(); });                    // the river breaks
    at(3900, () => caption('Then the river broke.', 6200, 'warn'));
    at(6600, () => FG3D.strike(false)); at(6600, () => caption('Whole neighbourhoods went under.', 9400));
    at(9900, () => caption('People are waiting on rooftops. Calling for help.', 12400, 'red'));
    at(10200, () => FG3D.strike(false));
    at(12600, () => {                          // big strike reveals the title
      FG3D.strike(true); buildTitle(); $('kicker').classList.add('on');
      document.querySelectorAll('#title span').forEach((s) => s.classList.add('on'));
    });
    at(14200, () => { $('tag').classList.add('on'); FG3D.strike(false); $('title').classList.add('zap'); });
    at(15400, () => { $('enter').hidden = false; $('enter').focus({ preventScroll: true }); $('skip').hidden = true; });
  }
  $('begin').addEventListener('click', begin);
  at(7000, () => { if (!started) begin(); });       // auto-start (silent) if nobody taps
  $('enter').addEventListener('click', finish);
  $('skip').addEventListener('click', () => { FG3D.skipIntro(); finish(); });
  addEventListener('keydown', (e) => { if (e.key === 'Enter' && !done) { started ? ($('enter').hidden ? null : finish()) : begin(); } if (e.key === 'Escape' && started && !done) { FG3D.skipIntro(); finish(); } });
})();
