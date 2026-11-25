/* FloodGrid app: Citizen, Volunteer, Admin dashboards, live updates (SSE), settings & emergency tools. */
window.App = (function () {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const EM = { food: '🍲', medical: '💊', rescue: '🛟', shelter: '🏠' }, cap = (s) => s[0].toUpperCase() + s.slice(1);
  const st = {
    tab: 'in', filter: 'all', vType: 'all', vSearch: '',
    mine: [], open: [], acc: [], stats: null, audit: [], afilter: '',
    msg: null, fresh: new Set(), busy: false, activeModal: null
  };
  let es = null, timer = null;

  // Initialize saved accessibility preference
  if (localStorage.getItem('fg_high_contrast') === 'true') {
    document.body.classList.add('high-contrast');
  }

  const ago = (iso) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.floor(m / 60) + ' h ago' : Math.floor(m / 1440) + ' d ago';
  };
  const clock = (iso) => new Date(iso).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  function toast(m, bad) {
    const e = $('#toast'); if (!e) return;
    e.textContent = m; e.className = 'toast' + (bad ? ' bad' : ''); e.hidden = false;
    clearTimeout(toast.h); toast.h = setTimeout(() => (e.hidden = true), 4200);
  }

  function play() {
    const a = $('#app'); if (!a) return;
    a.classList.add('anim'); clearTimeout(play.h); play.h = setTimeout(() => a.classList.remove('anim'), 1800);
  }

  const kv = {};
  function countUp() {
    document.querySelectorAll('.kpi b[data-n]').forEach((b, i) => {
      const to = +b.dataset.n, from = kv[i] ?? 0; kv[i] = to; if (from === to) return;
      const t0 = performance.now();
      (function f(now) {
        const p = Math.min(1, (now - t0) / 800);
        b.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(f);
      })(t0);
    });
  }

  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn,.fbtn'); if (!b || b.disabled) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, s = document.createElement('span'); s.className = 'rp';
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 700);
  });

  const footer = '<div class="foot">🔒 HTTPS · JWT (2 h expiry) · hashed passwords · role-based access · input validation · full audit log</div>';

  /* ---------- Modals (Settings, Helplines, Rescue Pass) ---------- */
  function showModal(html) {
    const root = $('#modal-root'); if (!root) return;
    root.innerHTML = `<div class="modal-overlay" data-a="modal-outside"><div class="modal-box" role="dialog" aria-modal="true">${html}</div></div>`;
    st.activeModal = true;
  }
  function closeModal() {
    const root = $('#modal-root'); if (!root) return;
    root.innerHTML = ''; st.activeModal = false;
  }

  function openSettingsModal() {
    const currentMode = FG3D.getMode ? FG3D.getMode() : 'dashboard-off';
    const isHighContrast = document.body.classList.contains('high-contrast');
    const volPct = Math.round((Sound.volume || 0.8) * 100);

    const html = `
      <div class="modal-head">
        <h2>⚙️ Platform Preferences & Audio</h2>
        <button class="modal-close" data-a="close-modal" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">
        <section class="setting-sec">
          <h4>🎬 3D Storm Animation</h4>
          <p class="mut" style="font-size:13px;margin:0">Choose whether the heavy 3D storm renders behind the dashboard or pauses to save battery and boost performance.</p>
          <div class="radio-group">
            <label class="radio-card ${currentMode === 'dashboard-off' ? 'active' : ''}">
              <input type="radio" name="animMode" value="dashboard-off" ${currentMode === 'dashboard-off' ? 'checked' : ''}>
              <strong>⏸️ Auto-Pause</strong>
              <small>Pauses in dashboard (Fast & cool laptop)</small>
            </label>
            <label class="radio-card ${currentMode === 'always' ? 'active' : ''}">
              <input type="radio" name="animMode" value="always" ${currentMode === 'always' ? 'checked' : ''}>
              <strong>🌊 Always On</strong>
              <small>Cinematic 3D continues in background</small>
            </label>
            <label class="radio-card ${currentMode === 'off' ? 'active' : ''}">
              <input type="radio" name="animMode" value="off" ${currentMode === 'off' ? 'checked' : ''}>
              <strong>🚫 Disabled</strong>
              <small>Turn off 3D completely</small>
            </label>
          </div>
        </section>

        <section class="setting-sec">
          <h4>🔊 Sound & Atmosphere</h4>
          <div class="setting-row">
            <div class="setting-info">
              <span>Master Audio</span>
              <small>Toggle all sound effects and storm ambient audio</small>
            </div>
            <label class="switch">
              <input type="checkbox" id="set-audio" ${Sound.on ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span>Volume</span>
              <small id="vol-lbl">${volPct}%</small>
            </div>
            <div class="vol-box" style="max-width:180px">
              <input type="range" id="set-vol" min="0" max="100" value="${volPct}" ${Sound.on ? '' : 'disabled'}>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span>Ambient Storm & Rain</span>
              <small>Continuous howling wind and rainfall sound bed</small>
            </div>
            <label class="switch">
              <input type="checkbox" id="set-ambient" ${Sound.ambient ? 'checked' : ''} ${Sound.on ? '' : 'disabled'}>
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span>Alerts & UI Effects</span>
              <small>Beeps on request updates, lightning strikes, clicks</small>
            </div>
            <label class="switch">
              <input type="checkbox" id="set-sfx" ${Sound.sfx ? 'checked' : ''} ${Sound.on ? '' : 'disabled'}>
              <span class="slider"></span>
            </label>
          </div>
        </section>

        <section class="setting-sec">
          <h4>👁️ Accessibility</h4>
          <div class="setting-row">
            <div class="setting-info">
              <span>High-Contrast Emergency Mode</span>
              <small>Sharp outlines and bright text for high-glare field use</small>
            </div>
            <label class="switch">
              <input type="checkbox" id="set-contrast" ${isHighContrast ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
        </section>
      </div>
      <div class="modal-foot">
        <button class="btn sm ghost" data-a="reset-settings">Reset to defaults</button>
        <button class="btn sm" data-a="close-modal">Done</button>
      </div>
    `;
    showModal(html);
  }

  function openHelplinesModal() {
    const html = `
      <div class="modal-head">
        <h2>🆘 Emergency Disaster Helplines</h2>
        <button class="modal-close" data-a="close-modal" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">
        <p class="mut" style="font-size:14px;margin:0">Verified 24x7 disaster response toll-free emergency numbers. Click to dial directly.</p>
        <div class="help-grid">
          <div class="help-item">
            <b>NDRF Headquarters</b>
            <small>National Disaster Response Force</small>
            <a href="tel:1078" class="btn sm ok call-btn">📞 Dial 1078</a>
          </div>
          <div class="help-item">
            <b>Disaster Control Room</b>
            <small>State & District Relief Center</small>
            <a href="tel:1070" class="btn sm call-btn">📞 Dial 1070</a>
          </div>
          <div class="help-item">
            <b>Emergency Ambulance</b>
            <small>Critical medical transport</small>
            <a href="tel:108" class="btn sm ok call-btn">📞 Dial 108</a>
          </div>
          <div class="help-item">
            <b>Police / Emergency</b>
            <small>Immediate local rescue response</small>
            <a href="tel:112" class="btn sm call-btn">📞 Dial 112</a>
          </div>
          <div class="help-item">
            <b>Flood Control Room</b>
            <small>Central Water Commission</small>
            <a href="tel:01126106523" class="btn sm ghost call-btn">📞 011-26106523</a>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn sm" data-a="close-modal">Close</button>
      </div>
    `;
    showModal(html);
  }

  function openRescuePassModal(id) {
    const all = [...st.mine, ...st.open, ...st.acc];
    const r = all.find((x) => x.id === +id);
    if (!r) return toast('Request details not found', true);

    const token = `FG-${r.id}-${r.type.toUpperCase()}-${Math.abs(r.createdAt.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)).toString(36).toUpperCase()}`;
    const html = `
      <div class="modal-head">
        <h2>🎫 Emergency Relief SOS Pass</h2>
        <button class="modal-close" data-a="close-modal" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">
        <div class="rescue-pass">
          <div class="pass-title">
            <div>
              <span class="pass-id">TOKEN #${r.id}</span>
              <div style="font-size:13px;color:var(--body);margin-top:2px">FloodGrid Disaster Relief Coordination Platform</div>
            </div>
            <span class="chip ${r.urgency}">${r.urgency}</span>
          </div>

          <div class="pass-fields">
            <div class="pass-field"><small>Citizen Name</small><div>${esc(r.citizen || Api.user.name)}</div></div>
            <div class="pass-field"><small>Category</small><div>${EM[r.type]} ${cap(r.type)}</div></div>
            <div class="pass-field"><small>Contact Phone</small><div>${r.phone ? esc(r.phone) : 'Not provided'}</div></div>
            <div class="pass-field"><small>Current Status</small><div><span class="chip ${r.status.toLowerCase()}">${r.status}</span></div></div>
            <div class="pass-field" style="grid-column:1/-1"><small>Location Coordinates / Landmark</small><div>📍 ${esc(r.location)}</div></div>
            ${r.description ? `<div class="pass-field" style="grid-column:1/-1"><small>Needs</small><div>${esc(r.description)}</div></div>` : ''}
            <div class="pass-field"><small>Assigned Volunteer</small><div>${r.volunteer ? esc(r.volunteer) : 'Awaiting assignment'}</div></div>
            <div class="pass-field"><small>Timestamp</small><div>${clock(r.createdAt)}</div></div>
          </div>

          <div class="pass-qr-mock">
            VERIFIED SECURITY TOKEN: ${token}
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn sm ghost" onclick="window.print()">🖨️ Print Pass / Slip</button>
        <button class="btn sm" data-a="close-modal">Close</button>
      </div>
    `;
    showModal(html);
  }

  /* ---------- shared pieces ---------- */
  const tl = (r) => `<div class="tl" aria-label="Progress">Open<i class="d"></i>Accepted<i class="${r.status !== 'OPEN' ? 'd' : ''}"></i>Delivered<i class="${r.status === 'DELIVERED' ? 'k' : ''}"></i></div>`;

  function card(r, mode) {
    const cls = mode === 'open' ? r.urgency : r.status === 'DELIVERED' ? 'delivered' : mode === 'mine' ? r.urgency : r.urgency;
    const cleanPh = r.phone ? String(r.phone).replace(/[^0-9+]/g, '') : null;
    const waPh = cleanPh ? cleanPh.replace(/^\+/, '') : null;
    const waText = encodeURIComponent(`Hello ${r.citizen || 'Citizen'}, I am responding to your FloodGrid emergency request #${r.id} (${r.type}). Are you safe?`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.location)}`;

    let h = `<article class="pn rq ${cls} ${st.fresh.has(r.id) ? 'fresh' : ''}">
      <div class="row">
        <h3>${EM[r.type]} #${r.id} · ${cap(r.type)}</h3>
        <span><span class="chip ${r.urgency}">${r.urgency}</span> <span class="chip ${r.status.toLowerCase()}">${r.status}</span></span>
      </div>
      <span class="mut">📍 ${esc(r.location)} · ${ago(r.createdAt)}</span>
      ${r.phone ? `<span class="phone-badge">📞 <a href="tel:${cleanPh}">${esc(r.phone)}</a></span>` : ''}
      ${r.description ? `<span>${esc(r.description)}</span>` : ''}`;

    if (mode === 'mine') {
      h += tl(r) + `<span class="mut">${r.volunteer ? 'Volunteer: <b class="ink">' + esc(r.volunteer) + '</b>' : 'Waiting for a volunteer…'}</span>`;
      h += `<div class="quick-actions"><button class="btn sm ghost" data-a="pass" data-id="${r.id}">🎫 Rescue Token / Slip</button></div>`;
    }

    if (mode === 'open') {
      h += `<span class="mut">Requested by <b class="ink">${esc(r.citizen)}</b></span>`;
      h += `<div class="quick-actions">
        ${cleanPh ? `<a class="btn sm ghost" href="tel:${cleanPh}">📞 Call</a>` : ''}
        ${waPh ? `<a class="btn sm ghost" target="_blank" rel="noopener" href="https://wa.me/${waPh}?text=${waText}">💬 WhatsApp</a>` : ''}
        <a class="btn sm ghost" target="_blank" rel="noopener" href="${mapsUrl}">🗺️ Directions</a>
        <button class="btn sm" data-a="accept" data-id="${r.id}">Accept request</button>
      </div>`;
    }

    if (mode === 'acc') {
      h += tl(r);
      h += `<span class="mut">Requested by <b class="ink">${esc(r.citizen)}</b></span>`;
      h += `<div class="quick-actions">
        ${cleanPh ? `<a class="btn sm ghost" href="tel:${cleanPh}">📞 Call</a>` : ''}
        ${waPh ? `<a class="btn sm ghost" target="_blank" rel="noopener" href="https://wa.me/${waPh}?text=${waText}">💬 WhatsApp</a>` : ''}
        <a class="btn sm ghost" target="_blank" rel="noopener" href="${mapsUrl}">🗺️ Directions</a>
        ${r.status === 'ACCEPTED' ? `<button class="btn sm ok" data-a="deliver" data-id="${r.id}">Mark delivered</button>` : ''}
      </div>`;
    }
    return h + '</article>';
  }

  const head = (t, s) => `<div class="row head"><div><h1>${t}</h1><p>${s}</p></div><span class="live"><i></i>Live · real-time</span></div>`;

  /* ---------- login / register ---------- */
  function viewLogin() {
    const reg = st.tab === 'reg';
    $('#app').innerHTML = `<div class="login"><div class="hero"><div class="logo"><b>🌊</b><span>Flood<span>Grid</span></span></div>
      <span class="pill" style="margin-top:18px">Secure disaster relief coordination</span>
      <h2>Coordinate relief at <span>the speed of the flood.</span></h2>
      <p style="font-size:18px;max-width:520px">Citizens ask. Volunteers respond. Admins see everything, with a tamper-evident audit trail.</p>
      <div class="pills"><span class="pill">🔒 Hashed passwords + JWT</span><span class="pill">⚡ Transaction-safe accept</span><span class="pill">🧾 Full audit log</span><span class="pill">📡 Live updates</span></div></div>
      <div class="pn"><div class="tabs"><button class="fbtn ${reg ? '' : 'on'}" data-a="tab" data-t="in">Sign in</button><button class="fbtn ${reg ? 'on' : ''}" data-a="tab" data-t="reg">Create account</button></div>
      ${reg ? `<div><label for="rn">Full name</label><input id="rn" autocomplete="name"><div class="fe" data-e="name"></div></div>` : ''}
      <div><label for="em">Email</label><input id="em" type="email" autocomplete="email"><div class="fe" data-e="email"></div></div>
      <div><label for="pw">Password</label><input id="pw" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}"><div class="fe" data-e="password"></div></div>
      ${reg ? `<div><label for="rr">I am a</label><select id="rr"><option value="citizen">Citizen (need help)</option><option value="volunteer">Volunteer (give help)</option></select></div>` : ''}
      <p class="err" id="err" role="alert"></p>
      <button class="btn" data-a="${reg ? 'register' : 'login'}">${reg ? 'Create account' : 'Login'}</button>
      ${reg ? '' : `<div class="mut" style="font-size:14px">Demo accounts (dummy data, password <b class="ink">Test@1234</b>):</div><div class="demo">${['citizen', 'volunteer', 'admin'].map((r) => `<button data-a="demo" data-r="${r}">${cap(r)}</button>`).join('')}</div>`}
      <div style="display:flex;justify-content:center;gap:12px;margin-top:10px">
        <button class="btn sm ghost" data-a="settings">⚙️ Settings</button>
        <button class="btn sm ghost" data-a="helplines">🆘 Helplines</button>
      </div>
      </div></div>${footer}`;
    play(); const em = $('#em'); if (em) em.focus({ preventScroll: true });
    $('#app').querySelectorAll('input').forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('[data-a=login],[data-a=register]').click(); }));
  }

  async function doAuth(path, body) {
    const err = $('#err'); if (err) err.textContent = '';
    document.querySelectorAll('.fe').forEach((e) => (e.textContent = ''));
    try {
      Api.save(await Api.call('POST', path, body));
      Sound.blip(740);
      Wipe.run(enter, true);
    } catch (e) {
      if (err) err.textContent = e.message;
      if (e.errors) for (const k in e.errors) { const f = document.querySelector(`[data-e=${k}]`); if (f) f.textContent = e.errors[k]; }
    }
  }

  /* ---------- shell ---------- */
  function shell(inner) {
    const u = Api.user;
    $('#app').innerHTML = `<header class="nav">
      <div class="logo"><b>🌊</b><span>Flood<span>Grid</span></span></div>
      <span class="sess" title="JWT expires after 2 hours">🔒 Session <b id="ss">--:--:--</b></span>
      <div class="who"><b>${esc(u.name)}</b><small>${u.role}</small></div>
      <button class="btn ghost sm" data-a="sound" title="Toggle sound">${Sound.on ? '🔊' : '🔇'}</button>
      <button class="btn ghost sm" data-a="settings" title="Preferences & Audio">⚙️ Settings</button>
      <button class="btn ghost sm" data-a="helplines" title="Emergency Disaster Helplines">🆘 Helplines</button>
      <button class="btn ghost sm" data-a="logout">Logout</button>
    </header>
    <main class="wrap">${inner}</main>${footer}`;
    tick(); play();
  }

  function tick() {
    const e = $('#ss'); if (!e) return;
    const l = Math.max(0, Math.floor((Api.exp - Date.now()) / 1000));
    e.textContent = `${Math.floor(l / 3600)}:${String(Math.floor(l % 3600 / 60)).padStart(2, '0')}:${String(l % 60).padStart(2, '0')}`;
    if (!l) logout('Session expired. Please log in again.');
  }

  /* ---------- citizen ---------- */
  async function viewCitizen() {
    shell(`${head('Request help', 'Tell us what you need. A volunteer is matched by urgency.')}
      <div class="g g2">
        <div class="pn" style="align-self:start">
          <h3>New help request</h3>
          <div><label for="t">Type</label><select id="t"><option value="food">🍲 Food</option><option value="medical">💊 Medical</option><option value="rescue">🛟 Rescue</option><option value="shelter">🏠 Shelter</option></select></div>
          <div><label for="u">Urgency</label><select id="u"><option value="low">Low</option><option value="medium">Medium</option><option value="high" selected>High</option><option value="critical">Critical</option></select></div>
          <div>
            <label for="l">Location</label>
            <div class="loc-row">
              <input id="l" maxlength="200" placeholder="Area, ward or landmark (e.g. Aliganj, Ward 12)">
              <button type="button" class="gps-btn" data-a="gps" title="Auto-detect current GPS coordinates">📍 Detect GPS</button>
            </div>
            <div class="fe" data-e="location"></div>
          </div>
          <div>
            <label for="ph">Contact Phone / WhatsApp <span class="mut" style="font-weight:400">(Recommended)</span></label>
            <input id="ph" type="tel" maxlength="25" placeholder="e.g. +91 98765 43210 (Mobile / WhatsApp)">
            <div class="fe" data-e="phone"></div>
            <small class="mut" style="font-size:12.5px">Volunteers will use this to call or WhatsApp you during rescue.</small>
          </div>
          <div>
            <label for="d">Description</label>
            <textarea id="d" maxlength="500" placeholder="What do you need? (Family members count, medical conditions, etc.)"></textarea>
            <div class="count" id="dc">0 / 500</div>
          </div>
          <p class="err" id="err" role="alert"></p>
          <button class="btn" data-a="submit">Submit request</button>
        </div>
        <div class="g" style="align-content:start">
          <div class="row"><h3 style="font-size:22px">My requests</h3></div>
          <div class="g" id="list"></div>
        </div>
      </div>`);

    $('#d').addEventListener('input', (e) => ($('#dc').textContent = e.target.value.length + ' / 500'));
    await loadMine();
  }

  async function loadMine() {
    try { st.mine = (await Api.call('GET', '/api/requests/mine')).requests; } catch (e) { toast(e.message, true); }
    const l = $('#list'); if (!l) return;
    l.innerHTML = st.mine.length ? st.mine.map((r) => card(r, 'mine')).join('') : '<div class="empty">No requests yet. Raise your first one on the left.</div>';
    syncScene(st.mine);
  }

  async function submit(btn) {
    const loc = $('#l').value.trim(), err = $('#err');
    const phone = $('#ph').value.trim();
    document.querySelector('[data-e=location]').textContent = '';
    const pe = document.querySelector('[data-e=phone]'); if (pe) pe.textContent = '';
    if (err) err.textContent = '';
    if (loc.length < 3) { document.querySelector('[data-e=location]').textContent = 'Location must be at least 3 characters.'; $('#l').focus(); return; }

    btn.disabled = true;
    try {
      const { request } = await Api.call('POST', '/api/requests', {
        type: $('#t').value,
        urgency: $('#u').value,
        location: loc,
        phone: phone || undefined,
        description: $('#d').value
      });
      st.fresh.add(request.id);
      $('#l').value = ''; $('#ph').value = ''; $('#d').value = ''; $('#dc').textContent = '0 / 500';
      toast(`Request #${request.id} sent. Volunteers can see it now.`);
      Sound.blip(880); FG3D.strike(false);
      await loadMine();
    } catch (e) {
      if (err) err.textContent = e.message;
      if (e.errors?.location) document.querySelector('[data-e=location]').textContent = e.errors.location;
      if (e.errors?.phone && pe) pe.textContent = e.errors.phone;
    }
    btn.disabled = false;
  }

  function detectGPS(btn) {
    if (!navigator.geolocation) return toast('Geolocation is not supported by your browser', true);
    btn.disabled = true; btn.textContent = '📍 Locating...';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const lat = latitude.toFixed(4), lon = longitude.toFixed(4);
        const lInput = $('#l');
        const tag = `GPS: ${lat}, ${lon} (±${Math.round(accuracy)}m)`;
        lInput.value = lInput.value ? `${lInput.value} [${tag}]` : tag;
        btn.disabled = false; btn.textContent = '📍 Added ✓';
        toast('Current GPS location captured');
        Sound.blip(880);
      },
      (err) => {
        btn.disabled = false; btn.textContent = '📍 Detect GPS';
        toast('Could not detect location: ' + err.message, true);
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  }

  /* ---------- volunteer ---------- */
  async function viewVolunteer() {
    if (!$('#vwrap')) shell(`<div id="vwrap"></div>`);
    try {
      [st.open, st.acc] = (await Promise.all([Api.call('GET', '/api/requests'), Api.call('GET', '/api/requests/accepted')])).map((x) => x.requests);
    } catch (e) { return toast(e.message, true); }

    const q = st.vSearch.trim().toLowerCase();
    const list = st.open.filter((r) => {
      const matchUrgency = st.filter === 'all' || r.urgency === st.filter;
      const matchType = st.vType === 'all' || r.type === st.vType;
      const matchSearch = !q || r.location.toLowerCase().includes(q) || (r.citizen && r.citizen.toLowerCase().includes(q)) || (r.description && r.description.toLowerCase().includes(q)) || String(r.id) === q;
      return matchUrgency && matchType && matchSearch;
    });

    $('#vwrap').innerHTML = `<div class="g" style="gap:22px">
      ${head('Response queue', 'Most urgent first. Accepting is transaction-safe: only one volunteer can win a request.')}
      ${st.msg ? `<div class="banner ${st.msg.bad ? 'bad' : ''}" role="status">${esc(st.msg.t)}</div>` : ''}
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input id="vsearch" type="search" placeholder="Search area, ward, citizen name, or keyword..." value="${esc(st.vSearch)}">
      </div>
      <div class="g gv">
        <section class="g" style="align-content:start">
          <div class="row">
            <h3 style="font-size:22px">Open requests · ${list.length}${list.length !== st.open.length ? ` (of ${st.open.length})` : ''}</h3>
          </div>
          <div class="filters" role="group" aria-label="Filter by urgency">
            ${['all', 'critical', 'high', 'medium', 'low'].map((f) => `<button class="fbtn ${st.filter === f ? 'on' : ''}" data-a="filter" data-f="${f}">${cap(f)}</button>`).join('')}
          </div>
          <div class="filters" role="group" aria-label="Filter by category" style="margin-top:-6px">
            <button class="fbtn ${st.vType === 'all' ? 'on' : ''}" data-a="typefilter" data-t="all">All Types</button>
            <button class="fbtn ${st.vType === 'food' ? 'on' : ''}" data-a="typefilter" data-t="food">🍲 Food</button>
            <button class="fbtn ${st.vType === 'medical' ? 'on' : ''}" data-a="typefilter" data-t="medical">💊 Medical</button>
            <button class="fbtn ${st.vType === 'rescue' ? 'on' : ''}" data-a="typefilter" data-t="rescue">🛟 Rescue</button>
            <button class="fbtn ${st.vType === 'shelter' ? 'on' : ''}" data-a="typefilter" data-t="shelter">🏠 Shelter</button>
          </div>
          ${list.length ? list.map((r) => card(r, 'open')).join('') : '<div class="empty">No matching open requests. Stay ready ⛈️</div>'}
        </section>
        <section class="g" style="align-content:start">
          <h3 style="font-size:22px">My accepted requests · ${st.acc.length}</h3>
          ${st.acc.length ? st.acc.map((r) => card(r, 'acc')).join('') : '<div class="empty">Nothing accepted yet.</div>'}
        </section>
      </div>
    </div>`;

    const vSearchInput = $('#vsearch');
    if (vSearchInput) {
      vSearchInput.addEventListener('input', (e) => {
        st.vSearch = e.target.value;
        clearTimeout(vSearchInput.h);
        vSearchInput.h = setTimeout(viewVolunteer, 300);
      });
    }

    syncScene([...st.open, ...st.acc]); st.fresh.clear();
  }

  async function act(kind, id, btn) {
    btn.disabled = true;
    try {
      const r = await Api.call('PUT', `/api/requests/${id}/${kind}`);
      st.msg = { t: r.message };
      Sound.blip(kind === 'accept' ? 660 : 990);
    } catch (e) {
      st.msg = { t: e.message, bad: true };
    }
    await viewVolunteer(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- admin ---------- */
  async function viewAdmin() {
    if (!$('#awrap')) shell(`<div id="awrap"></div>`);
    try {
      [st.stats, st.audit] = [await Api.call('GET', '/api/admin/stats'), (await Api.call('GET', '/api/admin/audit?limit=60' + (st.afilter ? '&action=' + st.afilter : ''))).audit];
    } catch (e) { return toast(e.message, true); }

    const s = st.stats, mx = Math.max(1, ...Object.values(s.byType)), C = 2 * Math.PI * 38; let off = 0;
    const donut = [['open', s.open, '#F5A524'], ['accepted', s.accepted, '#4F8CFF'], ['delivered', s.delivered, '#2DD4A0']].map(([, v, c]) => {
      const f = s.total ? v / s.total * C : 0, x = `<circle r="38" cx="50" cy="50" fill="none" stroke="${c}" stroke-width="12" stroke-dasharray="${f} ${C - f}" stroke-dashoffset="${-off}" transform="rotate(-90 50 50)"/>`;
      off += f; return x;
    }).join('');
    const acts = ['', 'LOGIN', 'LOGIN_FAILED', 'REQUEST_CREATED', 'REQUEST_ACCEPTED', 'REQUEST_DELIVERED', 'STATUS_CHANGE', 'USER_REGISTERED'];

    $('#awrap').innerHTML = `<div class="g" style="gap:22px">
      ${head('Command center', 'Every action is recorded. Numbers update live as volunteers work.')}
      <div class="g g4">
        <div class="pn kpi open"><small>Open</small><b data-n="${s.open}">${s.open}</b></div>
        <div class="pn kpi acc"><small>Accepted</small><b data-n="${s.accepted}">${s.accepted}</b></div>
        <div class="pn kpi del"><small>Delivered</small><b data-n="${s.delivered}">${s.delivered}</b></div>
        <div class="pn kpi"><small>Avg response time</small><b>${s.avgResponseMinutes == null ? '–' : s.avgResponseMinutes}<span style="font-size:18px"> min</span></b></div>
      </div>
      <div class="g ga">
        <div class="g" style="align-content:start">
          <div class="pn">
            <h3>Requests by type</h3>
            <div class="bars">${Object.entries(s.byType).map(([k, v]) => `<div class="bar"><span>${EM[k]} ${cap(k)}</span><div><i style="width:${v / mx * 100}%"></i></div><b class="ink">${v}</b></div>`).join('')}</div>
          </div>
        </div>
        <div class="pn">
          <h3>Status overview</h3>
          <div class="row" style="flex-wrap:nowrap">
            <svg viewBox="0 0 100 100" style="width:130px;flex:none" role="img" aria-label="Status donut"><circle r="38" cx="50" cy="50" fill="none" stroke="#1b2a4a" stroke-width="12"/>${donut}<text x="50" y="57" text-anchor="middle" fill="#EAF0FF" font-size="22" font-weight="700">${s.total}</text></svg>
            <div style="display:grid;gap:6px">
              <span>🟠 Open ${s.open}</span><span>🔵 Accepted ${s.accepted}</span><span>🟢 Delivered ${s.delivered}</span>
              <span class="mut">Delivery rate <b class="ink">${s.deliveryRate}%</b></span>
              <span class="mut">Volunteers <b class="ink">${s.volunteers}</b> · Critical open <b class="ink">${s.criticalOpen}</b></span>
            </div>
          </div>
        </div>
      </div>
      <div class="pn" style="align-self:start">
        <div class="row">
          <h3>Audit log</h3>
          <span style="display:flex;gap:8px">
            <select data-a="afilter" aria-label="Filter audit log" style="width:auto">
              ${acts.map((a) => `<option value="${a}" ${a === st.afilter ? 'selected' : ''}>${a || 'All actions'}</option>`).join('')}
            </select>
            <button class="btn ghost sm" data-a="csv">⬇ CSV</button>
          </span>
        </div>
        <div class="tbl">
          <table>
            <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>${st.audit.map((x) => `<tr><td>${clock(x.at)}</td><td>${esc(x.user)}</td><td><code>${x.action}</code></td><td>${esc(x.details)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>`;
    FG3D.sync(s.open, s.accepted, s.delivered); countUp();
  }

  function syncScene(list) {
    const c = (s) => list.filter((r) => r.status === s).length;
    FG3D.sync(c('OPEN') || 3, c('ACCEPTED'), c('DELIVERED'));
  }

  /* ---------- flow ---------- */
  const views = { citizen: viewCitizen, volunteer: viewVolunteer, admin: viewAdmin };

  function enter() {
    st.msg = null;
    // Auto-pause 3D storm animation if mode is dashboard-off (default) or off
    const mode = FG3D.getMode ? FG3D.getMode() : 'dashboard-off';
    if (mode === 'dashboard-off' || mode === 'off') {
      FG3D.pause(true);
    } else {
      FG3D.resume();
    }
    connect();
    views[Api.user.role]();
    clearInterval(timer);
    timer = setInterval(tick, 1000);
    window.scrollTo(0, 0);
  }

  function logout(msg) {
    if (es) es.close(); es = null;
    clearInterval(timer); Api.clear(); st.tab = 'in';
    // Resume 3D background on login page unless user turned it off permanently
    if (FG3D.getMode && FG3D.getMode() !== 'off') {
      FG3D.resume();
    }
    Wipe.run(viewLogin, true);
    if (msg) toast(msg, true);
    FG3D.sync(3, 1, 1);
  }

  Api.onAuthLost = () => logout('Session expired. Please log in again.');

  function connect() {
    if (es) es.close();
    es = new EventSource('/api/stream?token=' + encodeURIComponent(Api.token));
    es.addEventListener('request', (ev) => {
      const d = JSON.parse(ev.data), role = Api.user && Api.user.role;
      if (role === 'volunteer' && d.status === 'OPEN') {
        st.fresh.add(d.id);
        toast(`New ${d.urgency} request just arrived`);
        Sound.blip(520);
        if (d.urgency === 'critical') FG3D.strike(true);
      }
      if (role === 'citizen' && d.status !== 'OPEN') toast(`Request #${d.id} is now ${d.status}`);
      if (role === 'citizen') loadMine();
      else if (role) views[role]();
    });
  }

  async function start() {
    $('#app').hidden = false;
    if (Api.token) {
      try {
        const r = await Api.call('GET', '/api/auth/me');
        Api.user = r.user;
        return enter();
      } catch {
        Api.clear();
      }
    }
    viewLogin();
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b || b.tagName === 'SELECT') return;
    const a = b.dataset.a;
    if (a === 'tab') { st.tab = b.dataset.t; viewLogin(); }
    else if (a === 'login') doAuth('/api/auth/login', { email: $('#em').value, password: $('#pw').value });
    else if (a === 'register') doAuth('/api/auth/register', { name: $('#rn').value, email: $('#em').value, password: $('#pw').value, role: $('#rr').value });
    else if (a === 'demo') doAuth('/api/auth/login', { email: b.dataset.r + '@test.com', password: 'Test@1234' });
    else if (a === 'logout') logout();
    else if (a === 'sound') {
      Sound.init();
      Sound.set(!Sound.on);
      b.textContent = Sound.on ? '🔊' : '🔇';
      toast(Sound.on ? 'Audio unmuted' : 'Audio muted');
    }
    else if (a === 'settings') openSettingsModal();
    else if (a === 'helplines') openHelplinesModal();
    else if (a === 'close-modal' || a === 'modal-outside') {
      if (a === 'modal-outside' && e.target !== b) return;
      closeModal();
    }
    else if (a === 'pass') openRescuePassModal(b.dataset.id);
    else if (a === 'gps') detectGPS(b);
    else if (a === 'submit') submit(b);
    else if (a === 'accept' || a === 'deliver') act(a, b.dataset.id, b);
    else if (a === 'filter') { st.filter = b.dataset.f; viewVolunteer(); }
    else if (a === 'typefilter') { st.vType = b.dataset.t; viewVolunteer(); }
    else if (a === 'csv') downloadCsv();
    else if (a === 'reset-settings') {
      localStorage.removeItem('fg_anim_mode');
      localStorage.removeItem('fg_sound_opts');
      localStorage.removeItem('fg_high_contrast');
      document.body.classList.remove('high-contrast');
      if (FG3D.setMode) FG3D.setMode('dashboard-off');
      Sound.setVolume(0.8);
      Sound.setAmbient(true);
      Sound.setSfx(true);
      toast('Settings reset to defaults');
      closeModal();
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.a === 'afilter') { st.afilter = t.value; viewAdmin(); }
    if (t.name === 'animMode') {
      document.querySelectorAll('.radio-card').forEach((c) => c.classList.remove('active'));
      t.closest('.radio-card')?.classList.add('active');
      if (FG3D.setMode) FG3D.setMode(t.value);
      toast(`3D Animation set to: ${t.value}`);
    }
    if (t.id === 'set-audio') {
      Sound.init();
      Sound.set(t.checked);
      const v = $('#set-vol'), amb = $('#set-ambient'), sfx = $('#set-sfx');
      if (v) v.disabled = !t.checked;
      if (amb) amb.disabled = !t.checked;
      if (sfx) sfx.disabled = !t.checked;
      document.querySelectorAll('[data-a=sound]').forEach((b) => (b.textContent = t.checked ? '🔊' : '🔇'));
    }
    if (t.id === 'set-vol') {
      Sound.setVolume(+t.value / 100);
      const l = $('#vol-lbl'); if (l) l.textContent = t.value + '%';
    }
    if (t.id === 'set-ambient') Sound.setAmbient(t.checked);
    if (t.id === 'set-sfx') Sound.setSfx(t.checked);
    if (t.id === 'set-contrast') {
      document.body.classList.toggle('high-contrast', t.checked);
      localStorage.setItem('fg_high_contrast', String(t.checked));
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'set-vol') {
      Sound.setVolume(+e.target.value / 100);
      const l = $('#vol-lbl'); if (l) l.textContent = e.target.value + '%';
    }
  });

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && st.activeModal) closeModal();
  });

  async function downloadCsv() {
    try {
      const r = await fetch('/api/admin/audit.csv', { headers: { Authorization: 'Bearer ' + Api.token } });
      const u = URL.createObjectURL(await r.blob());
      const a = document.createElement('a'); a.href = u; a.download = 'floodgrid-audit.csv'; a.click(); URL.revokeObjectURL(u);
    } catch { toast('Download failed', true); }
  }

  return { start };
})();
