/* FloodGrid 3D (three.js r128): descend through storm clouds -> flood surge smashes the town -> stranded people + HELP signs -> slow orbit behind the app. */
window.FG3D = (function () {
  const api = { flash: 0, sync() {}, begin() {}, skipIntro() {}, strike() {}, dive() {}, pause() {}, resume() {}, setMode() {}, getMode() { return 'dashboard-off'; }, isPaused() { return false; }, ready: false };
  const flashEl = () => document.getElementById('flash');
  let flash = 0;
  function setFlash(v) { flash = v; const e = flashEl(); if (e) e.style.opacity = Math.min(.7, v); }
  function decay() { if (flash > .01) setFlash(flash * .9); else if (flash) setFlash(0); }

  const T = window.THREE, cv = document.getElementById('bg');
  if (!T || !cv) { // fallback: CSS rain + flashes only
    api.strike = (big) => { setFlash(big ? .65 : .35); Sound.thunder(.5, big ? 1 : .6); const t = setInterval(() => { decay(); if (!flash) clearInterval(t); }, 40); };
    setInterval(() => api.strike(false), 9000); return api;
  }
  try {
    const mobile = innerWidth < 700, rnd = Math.random, PI = Math.PI;
    const R = new T.WebGLRenderer({ canvas: cv, antialias: !mobile });
    R.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2)); R.setSize(innerWidth, innerHeight, false);
    const sm = (x, a, b) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
    const ease = (x) => x * x * x * (x * (x * 6 - 15) + 10);          // smootherstep: gentle start AND stop
    const SKY = new T.Color(0x050914), SKYF = new T.Color(0x6f8fd8);
    const sc = new T.Scene(); sc.background = SKY.clone(); sc.fog = new T.FogExp2(0x050914, .02);
    const cam = new T.PerspectiveCamera(58, innerWidth / innerHeight, .1, 320);
    const amb = new T.AmbientLight(0x4b66a8, .6); sc.add(amb);
    const moon = new T.DirectionalLight(0x9fb8ff, .55); moon.position.set(-10, 18, 8); sc.add(moon);
    const flashLight = new T.PointLight(0xcfe0ff, 0, 200); flashLight.position.set(0, 30, -10); sc.add(flashLight);

    /* ---- timeline (seconds): 0-4 clouds, 4.2-10 flood surge, 10-14 aftermath + title ---- */
    const INTRO = 14, S0 = 4.2, V = 12, ZA = -72;
    const front = (ti) => (ti < S0 ? ZA - 40 : ZA + V * (ti - S0));       // z of the flood wave front
    const level = (ti) => Math.min(.55, Math.max(0, (ti - 6) * .06));     // water keeps rising a little
    let foam = 0;
    function surf(x, z, ti, t) {
      const d = front(ti) - z, wet = sm(d, -1, 4);
      const crest = Math.exp(-((d - .8) * (d - .8)) / 7) * 3.4 * Math.min(1, Math.max(0, (90 - front(ti)) / 30)) * (1 + .3 * Math.sin(x * .9 + t * 6));
      const wave = Math.sin(x * .35 + t) * .3 + Math.cos(z * .4 + t * 1.3) * .26 + Math.sin((x + z) * .15 + t * .6) * .2;
      foam = Math.min(1, crest * .4);
      return -2.4 + (2.4 + level(ti)) * wet + crest + wave * wet;
    }

    /* ---- ground + water ---- */
    const ground = new T.Mesh(new T.PlaneGeometry(320, 320).rotateX(-PI / 2), new T.MeshLambertMaterial({ color: 0x1a2230 })); ground.position.y = -.62; sc.add(ground);
    const SEG = mobile ? 60 : 90, geo = new T.PlaneGeometry(150, 150, SEG, SEG); geo.rotateX(-PI / 2);
    const P = geo.attributes.position, N = P.count, X = new Float32Array(N), Z = new Float32Array(N), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { X[i] = P.getX(i); Z[i] = P.getZ(i); }
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    const water = new T.Mesh(geo, new T.MeshPhongMaterial({ color: 0xffffff, vertexColors: true, emissive: 0x081a4d, transparent: true, opacity: .9, shininess: 110, flatShading: true }));
    sc.add(water);

    /* ---- storm clouds (soft sprites) ---- */
    const cc = document.createElement('canvas'); cc.width = cc.height = 128; const cx = cc.getContext('2d'), gr = cx.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
    const cloudTex = new T.CanvasTexture(cc), CB = new T.Color(0x1c2744), CL = new T.Color(0x9bb2ee), clouds = [];
    for (let i = 0; i < (mobile ? 22 : 36); i++) {
      const s = new T.Sprite(new T.SpriteMaterial({ map: cloudTex, color: 0x1c2744, transparent: true, opacity: .55, depthWrite: false, fog: false }));
      s.scale.set(36 + rnd() * 34, 15 + rnd() * 11, 1); s.position.set((rnd() - .5) * 170, 30 + rnd() * 15, 10 - rnd() * 100); s.userData.v = .5 + rnd(); clouds.push(s); sc.add(s);
    }

    /* ---- text helpers (HELP signs) ---- */
    function mkTex(txt, fill, stroke, glow, size) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
      x.font = '800 ' + size + 'px "Space Grotesk",Arial Black,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
      x.shadowColor = glow; x.shadowBlur = 30; x.lineWidth = 16; x.strokeStyle = stroke; x.strokeText(txt, 256, 134); x.fillStyle = fill; x.fillText(txt, 256, 134);
      return new T.CanvasTexture(c);
    }

    /* ---- people (low-poly, stylised) ---- */
    const FIG = [0xff7a2f, 0xffd23f, 0x2dd4a0, 0xff5c6c, 0x4f8cff], skin = new T.MeshLambertMaterial({ color: 0xe0b08a }), pants = new T.MeshLambertMaterial({ color: 0x222a40 });
    function person(swim, c) {
      const g = new T.Group(), cl = new T.MeshLambertMaterial({ color: c }); g.userData.arms = [];
      if (!swim) { const tr = new T.Mesh(new T.CylinderGeometry(.2, .24, .7, 8), cl); tr.position.y = .6; const lg = new T.Mesh(new T.BoxGeometry(.32, .4, .22), pants); lg.position.y = .2; g.add(tr, lg); }
      const hd = new T.Mesh(new T.SphereGeometry(.17, 10, 10), skin); hd.position.y = swim ? 0 : 1.12; g.add(hd);
      [-1, 1].forEach((s) => { const pv = new T.Group(); pv.position.set(s * .26, swim ? -.12 : .85, 0); const a = new T.Mesh(new T.CylinderGeometry(.06, .06, .62, 6), cl); a.position.y = .31; pv.add(a); pv.userData.s = s; g.add(pv); g.userData.arms.push(pv); });
      return g;
    }
    const people = [];

    /* ---- houses: doors burst open when the flood hits; some are swept away ---- */
    const wallM = [0x1b2a4a, 0x22335a, 0x172542].map((c) => new T.MeshLambertMaterial({ color: c }));
    const roofM = new T.MeshLambertMaterial({ color: 0x33487a }), winM = new T.MeshBasicMaterial({ color: 0xffc857 }), doorM = new T.MeshLambertMaterial({ color: 0x4a3320 }), darkM = new T.MeshBasicMaterial({ color: 0x05070d });
    const houses = [], heroes = [], HP = [[-3, -8], [5, -15], [-10, -19], [10, -10], [1, -26]];
    function mkHouse(w, h, flat, x, z) {
      const g = new T.Group(), b = new T.Mesh(new T.BoxGeometry(w, h, w), wallM[houses.length % 3]); b.position.y = h / 2 - .6; g.add(b);
      if (flat) { const s = new T.Mesh(new T.BoxGeometry(w + .3, .2, w + .3), roofM); s.position.y = h - .5; g.add(s); }
      else { const r = new T.Mesh(new T.ConeGeometry(w * .85, 1.1, 4), roofM); r.rotation.y = PI / 4; r.position.y = h - .6 + .55; g.add(r); }
      for (let k = 0; k < 2; k++) if (rnd() > .3) { const wn = new T.Mesh(new T.BoxGeometry(.34, .34, .05), winM); wn.position.set(k ? .6 : -.6, h * .6 - .6, w / 2 + .03); g.add(wn); }
      const hole = new T.Mesh(new T.BoxGeometry(.5, .8, .04), darkM); hole.position.set(0, -.2, w / 2 + .02); g.add(hole);
      const pv = new T.Group(); pv.position.set(-.25, -.2, w / 2 + .05); const dr = new T.Mesh(new T.BoxGeometry(.5, .8, .06), doorM); dr.position.x = .25; pv.add(dr); g.add(pv);
      g.userData = { x0: x, z0: z, p: rnd() * 6, door: pv, hit: null, sweep: !flat && rnd() < .4, dir: rnd() > .5 ? 1 : -1 };
      g.position.set(x, 0, z); g.rotation.y = flat ? 0 : rnd() * 3; houses.push(g); sc.add(g); return g;
    }
    for (let i = 0; i < (mobile ? 22 : 34); i++) {
      let x, z, tries = 0;
      do { const a = rnd() * 6.28, rad = 8 + rnd() * 34; x = Math.cos(a) * rad; z = Math.sin(a) * rad * .75 - 18; tries++; } while (tries < 20 && HP.some((p) => Math.hypot(p[0] - x, p[1] - z) < 5));
      mkHouse(1.6 + rnd() * 1.4, 1.4 + rnd() * 2.4, false, x, z);
    }
    const signTex = ['HELP!', 'SOS', 'HELP US', 'SOS', 'HELP!'];
    HP.forEach((p, i) => {
      const w = 3.2 + rnd() * .5, h = 2.6 + rnd() * .6, g = mkHouse(w, h, true, p[0], p[1]), top = h - .38;
      const n = i === 0 || i === 4 ? 3 : 2;
      for (let k = 0; k < n; k++) { const pr = person(false, FIG[(i + k) % 5]); pr.position.set((k - (n - 1) / 2) * .7, top, (k % 2) * .5 - .2); pr.userData.p = rnd() * 6; g.add(pr); people.push(pr); }
      if (i === 0 || i === 2) { const m = new T.Mesh(new T.PlaneGeometry(2.8, 1.4).rotateX(-PI / 2), new T.MeshBasicMaterial({ map: mkTex(i ? 'SOS' : 'HELP', '#ff2d44', '#ffffff', '#000000', 170), transparent: true })); m.position.set(0, top + .03, 1.1); g.add(m); }
      const sp = new T.Sprite(new T.SpriteMaterial({ map: mkTex(signTex[i], '#ffffff', '#ff2d44', '#ff2d44', 150), transparent: true, fog: false })); sp.scale.set(6.5, 3.25, 1); sp.position.set(p[0], h + 3.4, p[1]); sc.add(sp);
      const fl = new T.PointLight(0xff3b4d, 0, 16); fl.position.set(p[0], h + 1.2, p[1]); sc.add(fl); heroes.push({ sp, fl, i });
    });

    /* ---- people drowning in the water: heads + frantic arms, dipping under ---- */
    const swimmers = [], ringM = new T.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: .5, side: T.DoubleSide, depthWrite: false });
    for (let i = 0; i < (mobile ? 6 : 10); i++) {
      const g = person(true, FIG[i % 5]), ring = new T.Mesh(new T.RingGeometry(.3, .4, 24).rotateX(-PI / 2), ringM.clone());
      sc.add(g, ring); swimmers.push({ g, ring, x: (rnd() - .5) * 32, z: -rnd() * 26 + 2, p: rnd() * 10 });
    }
    /* floating debris */
    const deb = []; for (let i = 0; i < 16; i++) { const m = new T.Mesh(new T.BoxGeometry(.5 + rnd() * .6, .12, .4), new T.MeshLambertMaterial({ color: 0x5b4a33 })); m.userData = { x0: (rnd() - .5) * 44, z0: -rnd() * 34 + 6, p: rnd() * 9 }; deb.push(m); sc.add(m); }

    /* ---- request beacons: red open / blue accepted / green delivered ---- */
    const BP = [[-7, -6], [5, -11], [-13, -16], [11, -5], [0, -20], [-4, -1], [16, -17], [8, -24], [-18, -8], [2, -30], [-9, -26], [14, -12]], CLR = [0xff5c6c, 0x4f8cff, 0x2dd4a0], bc = [];
    BP.forEach((p, k) => {
      const g = new T.Group(), m = new T.MeshBasicMaterial({ color: 0xff5c6c, transparent: true, opacity: .95 });
      const s = new T.Mesh(new T.SphereGeometry(.4, 16, 16), m); s.position.y = 2.4;
      const rm = m.clone(); rm.side = T.DoubleSide; const ring = new T.Mesh(new T.RingGeometry(.6, .75, 40).rotateX(-PI / 2), rm); ring.position.y = .7;
      const bm = m.clone(); bm.opacity = .35; const beam = new T.Mesh(new T.CylinderGeometry(.04, .04, 8, 8), bm); beam.position.y = 4.2;
      g.add(s, ring, beam); g.position.set(p[0], 0, p[1]); g.visible = false; sc.add(g); bc.push({ g, s, ring, beam, k });
    });
    api.sync = (o, a, d) => {
      const L = []; [o, a, d].forEach((c, k) => { for (let j = 0; j < c; j++) L.push(CLR[k]); });
      bc.forEach((b, j) => { b.g.visible = j < L.length; if (j < L.length) [b.s, b.ring, b.beam].forEach((x) => x.material.color.setHex(L[j])); });
    };

    /* ---- rescue boat (arrives late in the intro) ---- */
    const boat = new T.Group();
    boat.add(new T.Mesh(new T.BoxGeometry(2.4, .45, 1), new T.MeshLambertMaterial({ color: 0xf5a524 })));
    const cab = new T.Mesh(new T.BoxGeometry(.8, .6, .7), new T.MeshLambertMaterial({ color: 0xeaf0ff })); cab.position.set(-.3, .5, 0); boat.add(cab);
    const bl = new T.PointLight(0xffc857, 1.8, 16); bl.position.y = 1.2; boat.add(bl); sc.add(boat);

    /* ---- rain ---- */
    const RN = mobile ? 1800 : 3600, rp = new Float32Array(RN * 6), rv = new Float32Array(RN);
    for (let i = 0; i < RN; i++) { const x = (rnd() - .5) * 120, y = rnd() * 56, z = (rnd() - .5) * 120; rv[i] = .9 + rnd() * .6; rp.set([x, y, z, x - .12, y + 1.1, z], i * 6); }
    const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.BufferAttribute(rp, 3));
    const rain = new T.LineSegments(rg, new T.LineBasicMaterial({ color: 0x9ec1ff, transparent: true, opacity: .4 })); rain.frustumCulled = false; sc.add(rain);

    /* ---- lightning (main bolt + branches) ---- */
    let bolt = null, boltMat = null, boltLife = 0;
    function strike(big) {
      if (bolt) { sc.remove(bolt); bolt.children.forEach((l) => l.geometry.dispose()); }
      const grp = new T.Group(), x0 = (rnd() - .5) * 60, z0 = -rnd() * 40 - 8, pts = []; let x = x0, z = z0;
      for (let y = 52; y > -.5; y -= 2.4) { pts.push(new T.Vector3(x, y, z)); x += (rnd() - .5) * 3.8; z += (rnd() - .5) * 2; }
      boltMat = new T.LineBasicMaterial({ color: 0xeaf2ff, transparent: true });
      grp.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), boltMat));
      for (let b = 0; b < (big ? 3 : 1); b++) {
        const s = pts[3 + Math.floor(rnd() * (pts.length - 8))], bp = [s.clone()], dir = rnd() > .5 ? 1 : -1; let bx = s.x, by = s.y, bz = s.z;
        for (let k = 0; k < 5; k++) { bx += dir * (1 + rnd() * 2); by -= 2.2; bz += (rnd() - .5) * 2; bp.push(new T.Vector3(bx, by, bz)); }
        grp.add(new T.Line(new T.BufferGeometry().setFromPoints(bp), boltMat));
      }
      bolt = grp; sc.add(bolt); boltLife = 1; flashLight.position.set(x0, 26, z0); setFlash(big ? .6 : .34); api.flash = big ? 1 : .6;
      Sound.thunder(.25 + rnd() * .8, big ? 1 : .65);
    }
    api.strike = strike;

    /* ---- camera rails: smooth Catmull-Rom path through the whole story ---- */
    const V3 = (a) => new T.Vector3(a[0], a[1], a[2]);
    const camC = new T.CatmullRomCurve3([[0, 66, 98], [3, 44, 76], [-4, 22, 52], [-8, 8, 34], [-5, 6.8, 16], [-1, 8, 22], [0, 9, 28]].map(V3), false, 'catmullrom', .5);
    const lookC = new T.CatmullRomCurve3([[0, 34, -30], [0, 24, -24], [0, 9, -16], [-2, 4, -14], [-3, 3.6, -10], [-1, 2.4, -9], [0, 1.5, -8]].map(V3), false, 'catmullrom', .5);
    const cp = new T.Vector3(), lp = new T.Vector3();

    let t0 = null, mx = 0, my = 0, mxs = 0, mys = 0, dv = 0, dvT = 0, nextAuto = 0, introDone = false, last = performance.now();
    let paused = false, animMode = localStorage.getItem('fg_anim_mode') || 'dashboard-off';

    api.begin = () => { t0 = performance.now(); };
    api.skipIntro = () => { t0 = -1e9; };
    api.dive = (on) => { dvT = on ? 1 : 0; };
    api.pause = (hide) => {
      paused = true;
      if (cv) cv.style.transition = 'opacity .4s';
      if (cv && hide) cv.style.opacity = '0.06';
    };
    api.resume = () => {
      const was = paused;
      paused = false;
      if (cv) cv.style.opacity = '1';
      if (was && !reduce) {
        last = performance.now();
        requestAnimationFrame(frame);
      }
    };
    api.isPaused = () => paused;
    api.setMode = (m) => {
      animMode = m;
      try { localStorage.setItem('fg_anim_mode', m); } catch (_) {}
      if (m === 'off') api.pause(true);
      else if (m === 'always') api.resume();
      else if (m === 'dashboard-off') {
        const inDashboard = document.body.classList.contains('in') && !document.getElementById('app').querySelector('.login');
        if (inDashboard) api.pause(true); else api.resume();
      }
    };
    api.getMode = () => animMode;

    addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; });
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tmp = new T.Color();

    function frame(now) {
      if (paused) return; // Completely freeze render loop when paused
      if (!reduce) requestAnimationFrame(frame);
      if (document.hidden) { last = now; return; }
      const t = now / 1000, dt = Math.min((now - last) / 1000, .05); last = now;
      const ti = t0 === null ? 0 : (now - t0) / 1000;
      if (ti >= INTRO && !introDone) { introDone = true; nextAuto = t + 4; }

      // water surface + foam on the crest
      for (let j = 0; j < N; j++) { P.setY(j, surf(X[j], Z[j], ti, t)); const f = foam, k = j * 3; col[k] = .1 + .8 * f; col[k + 1] = .31 + .64 * f; col[k + 2] = .77 + .23 * f; }
      P.needsUpdate = true; geo.attributes.color.needsUpdate = true;

      // houses: doors burst open, some get swept & tilt
      const fr = front(ti);
      houses.forEach((g) => {
        const u = g.userData; if (u.hit == null && fr > u.z0) u.hit = ti;
        const k = u.hit == null ? 0 : ti - u.hit, lag = Math.max(0, k - .4);
        let y = u.hit == null ? 0 : Math.sin(t * .9 + u.p) * .08, z = u.z0, rz = 0;
        if (u.sweep && k > 0) { z += (1 - Math.exp(-lag * .45)) * 9; rz = u.dir * Math.min(.75, lag * .2); y -= Math.min(1.5, lag * .25); }
        g.position.set(u.x0, y, z); g.rotation.z = rz; u.door.rotation.y = -Math.min(1.9, k * 1.5);
      });
      // stranded people wave for help
      people.forEach((pr) => { const p = pr.userData.p; pr.userData.arms.forEach((a, i) => { a.rotation.z = -a.userData.s * (.4 + Math.sin(t * 5 + p + i) * .4); }); });
      // drowning people: bob, dip under, flail
      swimmers.forEach((s) => {
        const x = s.x + Math.sin(t * .4 + s.p) * 1.4, z = s.z + Math.cos(t * .3 + s.p) * 1, y = surf(x, z, ti, t), sink = Math.pow(Math.max(0, Math.sin(t * .55 + s.p * 2.1)), 2) * .55;
        s.g.position.set(x, y + .1 - sink, z); s.ring.position.set(x, y + .06, z); s.g.visible = s.ring.visible = y > -.5;
        const f = (t * 1.1 + s.p) % 1; s.ring.scale.setScalar(1 + f * 2.2); s.ring.material.opacity = .5 * (1 - f);
        s.g.userData.arms.forEach((a, i) => { a.rotation.z = -a.userData.s * (.5 + Math.sin(t * 9 + s.p + i * 2) * .5); });
      });
      deb.forEach((m) => { const u = m.userData, x = u.x0 + Math.sin(t * .3 + u.p) * 2, z = u.z0 + Math.cos(t * .25 + u.p) * 1.5; m.position.set(x, surf(x, z, ti, t) + .05, z); m.rotation.y = t * .2 + u.p; });
      // HELP signs + flares blink
      heroes.forEach((h) => { const b = .55 + .45 * Math.abs(Math.sin(t * 3.2 + h.i)); h.sp.material.opacity = b; h.fl.intensity = (introDone || ti > 8 ? 2.6 : 0) * b + flash * 4; h.sp.position.y += Math.sin(t * 1.5 + h.i) * .004; });
      bc.forEach((b) => { const f = (t * .8 + b.k * .3) % 1; b.ring.scale.setScalar(1 + f * 2.4); b.ring.material.opacity = .8 * (1 - f); b.s.position.y = 2.4 + Math.sin(t * 2 + b.k) * .2; });
      // boat joins the scene near the end
      const bx = Math.cos(t * .25) * 14, bz = -8 + Math.sin(t * .25) * 8; boat.visible = ti > 9; boat.scale.setScalar(.01 + sm(ti, 9.5, 11.5));
      boat.position.set(bx, surf(bx, bz, ti, t) + .15, bz); boat.rotation.y = -t * .25 + PI; boat.rotation.z = Math.sin(t * 1.6) * .06;
      // rain
      rain.material.opacity = .12 + .38 * sm(ti, 0, 4);
      for (let j = 0; j < RN; j++) { const k = j * 6; rp[k + 1] -= rv[j] * 60 * dt; rp[k + 4] -= rv[j] * 60 * dt; if (rp[k + 1] < -.8) { rp[k + 1] += 56; rp[k + 4] += 56; } }
      rg.attributes.position.needsUpdate = true;
      // clouds drift & light up
      const lf = Math.min(1, flash * 1.2); clouds.forEach((s) => { s.position.x += s.userData.v * dt; if (s.position.x > 95) s.position.x = -95; s.material.color.copy(CB).lerp(CL, lf); });
      // lightning decay, sky flash, auto strikes
      if (bolt) { boltLife *= .86; boltMat.opacity = Math.min(1, boltLife * 1.6); if (boltLife < .03) { sc.remove(bolt); bolt = null; } }
      flashLight.intensity = flash * 9; amb.intensity = .6 + flash * 1.3; sc.background.copy(SKY).lerp(SKYF, Math.min(flash * .35, .35)); sc.fog.color.copy(sc.background); decay();
      if (introDone && t > nextAuto) { strike(rnd() > .75); nextAuto = t + 5 + rnd() * 8; }

      // camera: rail during intro, then a slow orbit that starts exactly where the rail ends
      const u = ease(Math.min(1, ti / INTRO));
      if (ti < INTRO) camC.getPoint(u, cp); else { const k = ti - INTRO, a = Math.sin(k * sm(k, 0, 3) * .12) * .45; cp.set(Math.sin(a) * 22, 9, Math.cos(a) * 22 + 6); }
      lookC.getPoint(u, lp);
      const w = sm(ti, INTRO - 2, INTRO + 1), k2 = 1 - Math.exp(-dt * 3);
      mxs += (mx - mxs) * k2; mys += (my - mys) * k2; dv += (dvT - dv) * (1 - Math.exp(-dt * 3.2));
      const surge = sm(ti, S0, S0 + .8) * (1 - sm(ti, S0 + 4, S0 + 7)), shake = surge * .1 + flash * .12;
      cam.position.set(cp.x + mxs * 3 * w + (rnd() - .5) * shake, cp.y - mys * 1.5 * w + (rnd() - .5) * shake - dv * (cp.y - 1.8), cp.z - dv * 14 + (rnd() - .5) * shake);
      cam.lookAt(lp.x, lp.y - dv, lp.z - dv * 10); cam.rotation.z += Math.sin(t * .3) * .004 * (1 - u) + surge * Math.sin(t * 1.7) * .02;
      cam.fov = 58 + dv * 26; cam.updateProjectionMatrix();
      R.render(sc, cam);
    }
    addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); R.setSize(innerWidth, innerHeight, false); });
    api.ready = true;
    if (reduce) { t0 = -1e9; frame(performance.now()); } else requestAnimationFrame(frame);
  } catch (e) { console.warn('3D disabled:', e); }
  return api;
})();
