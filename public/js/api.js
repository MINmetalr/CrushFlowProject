/* ============================================================
   CrushFlow V2 — API Client
   Handles auth tokens, auto-refresh, CRUD helpers
   ============================================================ */
const API = (() => {
  const BASE = '/api';
  let _token = null;

  function save(data) {
    _token = data.accessToken;
    localStorage.setItem('cf_access',  data.accessToken);
    localStorage.setItem('cf_refresh', data.refreshToken);
    if (data.user) localStorage.setItem('cf_user', JSON.stringify(data.user));
  }

  function clear() {
    _token = null;
    ['cf_access','cf_refresh','cf_user'].forEach(k => localStorage.removeItem(k));
  }

  function getUser()    { try { return JSON.parse(localStorage.getItem('cf_user')||'null'); } catch { return null; } }
  function getToken()   { return _token || localStorage.getItem('cf_access'); }
  function getRefresh() { return localStorage.getItem('cf_refresh'); }

  function hasPerm(perm) {
    const u = getUser();
    if (!u) return false;
    const p = u.permisos || [];
    if (p.includes('*')) return true;
    const [mod, act] = perm.split('.');
    return p.includes(perm) || p.includes(`${mod}.*`);
  }

  async function _fetch(url, opts = {}, retry = true) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(BASE + url, { ...opts, headers });

    // Auto-refresh on 401
    if (res.status === 401 && retry) {
      const refresh = getRefresh();
      if (!refresh) { clear(); window.location.reload(); return; }
      try {
        const r = await fetch(BASE + '/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        if (!r.ok) throw new Error();
        const d = await r.json();
        save(d.data);
        return _fetch(url, opts, false); // retry once
      } catch {
        clear(); window.location.reload(); return;
      }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || `Error ${res.status}`;
      throw Object.assign(new Error(msg), { status: res.status, errors: data?.errors });
    }
    return data;
  }

  // Public methods
  const get    = (url, q)        => _fetch(url + (q ? '?'+new URLSearchParams(q) : ''));
  const post   = (url, body)     => _fetch(url, { method:'POST',   body: JSON.stringify(body) });
  const put    = (url, body)     => _fetch(url, { method:'PUT',    body: JSON.stringify(body) });
  const patch  = (url, body)     => _fetch(url, { method:'PATCH',  body: JSON.stringify(body) });
  const del    = (url)           => _fetch(url, { method:'DELETE' });

  async function login(email, password) {
    const data = await post('/auth/login', { email, password });
    save(data.data);
    return data.data;
  }

  async function logout() {
    try { await post('/auth/logout', {}); } catch {}
    clear();
  }

  // Catalogue helpers (for dropdowns)
  const _cache = {};
  async function catalogue(name) {
    if (!_cache[name]) {
      const r = await get(`/${name}`, { limit: 200 });
      _cache[name] = r.data;
    }
    return _cache[name];
  }
  function clearCache(name) { if (name) delete _cache[name]; else Object.keys(_cache).forEach(k => delete _cache[k]); }

  return { get, post, put, patch, del, login, logout, save, clear, getUser, getToken, hasPerm, catalogue, clearCache };
})();
