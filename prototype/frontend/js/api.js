/* API client: JWT kept in sessionStorage, 401 -> logout */
window.Api = (function () {
  const S = sessionStorage;
  const a = { token: S.getItem('fg_token'), user: JSON.parse(S.getItem('fg_user') || 'null'), exp: +S.getItem('fg_exp') || 0, onAuthLost: () => {} };
  a.save = (r) => { a.token = r.token; a.user = r.user; a.exp = Date.now() + r.expiresIn * 1000; S.setItem('fg_token', a.token); S.setItem('fg_user', JSON.stringify(a.user)); S.setItem('fg_exp', a.exp); };
  a.clear = () => { a.token = a.user = null; a.exp = 0; S.clear(); };
  a.call = async (method, path, body) => {
    let res;
    try {
      res = await fetch(path, { method, headers: { 'Content-Type': 'application/json', ...(a.token && { Authorization: 'Bearer ' + a.token }) }, body: body ? JSON.stringify(body) : undefined });
    } catch { throw Object.assign(new Error('Cannot reach the server. Check your connection.'), { status: 0 }); }
    const j = await res.json().catch(() => ({}));
    if (res.status === 401 && a.token && !path.includes('/auth/login')) a.onAuthLost();
    if (!res.ok) throw Object.assign(new Error(j.error || 'Request failed'), { status: res.status, errors: j.errors });
    return j;
  };
  return a;
})();
