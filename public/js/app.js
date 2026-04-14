/* ============================================================
   CrushFlow V2 — App Shell
   ============================================================ */
const App = (() => {
  // ── Navigation map ────────────────────────────────────────
  const PAGES = [
    { id:'dashboard',   label:'Dashboard',     icon:'fa-chart-pie',    perm:null,               section:'General' },
    { id:'inventario',  label:'Inventario',    icon:'fa-boxes',        perm:'inventario.read',  section:'Operaciones' },
    { id:'movimientos', label:'Movimientos',   icon:'fa-exchange-alt', perm:'movimientos.create',section:'Operaciones' },
    { id:'compras',     label:'Compras',       icon:'fa-shopping-cart',perm:'compras.read',     section:'Compras' },
    { id:'ventas',      label:'Ventas',        icon:'fa-tag',          perm:'ventas.read',      section:'Ventas' },
    { id:'rrhh',        label:'Gestión Humana',icon:'fa-users',        perm:'rrhh.read',        section:'RRHH' },
    { id:'finanzas',    label:'Finanzas',      icon:'fa-coins',        perm:'finanzas.read',    section:'Finanzas' },
    { id:'reportes',    label:'Reportes',      icon:'fa-chart-bar',    perm:'reportes.*',       section:'Análisis' },
    { id:'usuarios',    label:'Usuarios',      icon:'fa-user-shield',  perm:'usuarios.read',    section:'Admin' },
    { id:'config',      label:'Configuración', icon:'fa-cog',          perm:'config.read',      section:'Admin' },
  ];

  let _current = null;

  // ── Toast ─────────────────────────────────────────────────
  function toast(msg, type = 'info', duration = 3500) {
    const icons = { info:'fa-info-circle', success:'fa-check-circle', error:'fa-times-circle', warning:'fa-exclamation-triangle' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fas ${icons[type]||icons.info}"></i><span class="toast-msg">${msg}</span>`;
    document.getElementById('toast-container').prepend(el);
    setTimeout(() => el.remove(), duration);
  }

  // ── Modal helpers ─────────────────────────────────────────
  function modal(id) { return document.getElementById(id); }

  function openModal(id) {
    const m = modal(id);
    if (m) m.classList.add('open');
  }
  function closeModal(id) {
    const m = modal(id);
    if (m) m.classList.remove('open');
  }
  function closeAllModals() {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
  }

  // Close modal on backdrop click
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-backdrop')) closeAllModals();
  });

  // ── Loading state helpers ─────────────────────────────────
  function setLoading(tbodyId, cols) {
    const el = document.getElementById(tbodyId);
    if (!el) return;
    el.innerHTML = `<tr class="loading-row"><td colspan="${cols}"><span class="spinner"></span> Cargando...</td></tr>`;
  }
  function setEmpty(tbodyId, cols, msg = 'Sin registros') {
    const el = document.getElementById(tbodyId);
    if (!el) return;
    el.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;padding:40px;color:var(--gray)">${msg}</td></tr>`;
  }

  // ── Navigate ──────────────────────────────────────────────
  function navigate(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const page = document.getElementById(`page-${pageId}`);
    if (!page) return;
    page.classList.add('active');
    _current = pageId;

    const navItem = document.querySelector(`[data-page="${pageId}"]`);
    if (navItem) navItem.classList.add('active');

    const entry = PAGES.find(p => p.id === pageId);
    document.getElementById('page-title').textContent = entry?.label || '';

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');

    // Call module loader
    const mod = window[`Module_${pageId}`];
    if (mod?.load) mod.load(page);
  }

  // ── Build sidebar ─────────────────────────────────────────
  function buildSidebar() {
    const nav  = document.getElementById('sidebar-nav');
    let lastSection = null;
    let html = '';
    PAGES.forEach(p => {
      if (p.perm && !API.hasPerm(p.perm)) return;
      if (p.section !== lastSection) {
        html += `<div class="nav-section">${p.section}</div>`;
        lastSection = p.section;
      }
      html += `<div class="nav-item" data-page="${p.id}" onclick="App.navigate('${p.id}')">
                 <i class="fas ${p.icon}"></i>${p.label}</div>`;
    });
    nav.innerHTML = html;
  }

  // ── Init ──────────────────────────────────────────────────
  async function init() {
    const token = API.getToken();
    const user  = API.getUser();

    if (!token || !user) {
      showLogin();
      return;
    }

    showApp(user);
  }

  function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';

    document.getElementById('login-form').onsubmit = async (e) => {
      e.preventDefault();
      const btn  = document.getElementById('login-btn');
      const errEl = document.getElementById('login-error');
      btn.disabled = true;
      document.getElementById('login-btn-text').innerHTML = '<span class="spinner sm"></span>';
      errEl.style.display = 'none';

      try {
        const user = await API.login(
          document.getElementById('login-email').value,
          document.getElementById('login-password').value
        );
        showApp(user);
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      } finally {
        btn.disabled = false;
        document.getElementById('login-btn-text').textContent = 'Iniciar sesión';
      }
    };
  }

  function showApp(user) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('sb-user-name').textContent = user.nombre;
    document.getElementById('sb-user-role').textContent = user.rol;
    buildSidebar();
    navigate('dashboard');

    // Check stock alerts after a short delay
    setTimeout(checkStockAlerts, 1500);
  }

  async function checkStockAlerts() {
    try {
      const data = await API.get('/inventario/stock');
      const critico = data.data?.filter(s => s.estado_stock !== 'ok').length || 0;
      const dot = document.getElementById('stock-alert');
      if (dot) dot.style.display = critico > 0 ? 'block' : 'none';
    } catch {}
  }

  async function logout() {
    await API.logout();
    window.location.reload();
  }

  // ── Format helpers (global use) ───────────────────────────
  function fmt(val, type = 'text') {
    if (val === null || val === undefined) return '—';
    if (type === 'money')  return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(val);
    if (type === 'num')    return new Intl.NumberFormat('es-CO',{maximumFractionDigits:2}).format(val);
    if (type === 'date')   return val ? new Date(val).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'}) : '—';
    if (type === 'dt')     return val ? new Date(val).toLocaleString('es-CO',{dateStyle:'short',timeStyle:'short'}) : '—';
    return String(val);
  }

  function statusBadge(estado, map) {
    const m = map || {
      borrador:'badge-gray',confirmada:'badge-blue',en_proceso:'badge-blue',
      despachada:'badge-orange',facturada:'badge-green',recibida:'badge-green',
      parcial:'badge-orange',enviada:'badge-blue',cancelada:'badge-red',
      activo:'badge-green',vacaciones:'badge-blue',licencia:'badge-orange',retirado:'badge-red',
      pendiente:'badge-orange',pagada:'badge-green',vencida:'badge-red',anulada:'badge-gray',
      entrada:'badge-green',salida:'badge-red',traslado:'badge-blue',ajuste:'badge-orange',
    };
    const cls = m[estado] || 'badge-gray';
    return `<span class="badge ${cls}">${estado}</span>`;
  }

  // ── Sidebar toggle ────────────────────────────────────────
  document.getElementById('menu-toggle').onclick = () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
  };
  document.getElementById('sidebar-overlay').onclick = () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
  };

  // ── Generic table builder ─────────────────────────────────
  function buildTable(tbodyId, rows, cols) {
    const el = document.getElementById(tbodyId);
    if (!el) return;
    if (!rows?.length) { setEmpty(tbodyId, cols.length); return; }
    el.innerHTML = rows.map(row =>
      `<tr>${cols.map(c => `<td>${typeof c.render === 'function' ? c.render(row) : (row[c.key] ?? '—')}</td>`).join('')}</tr>`
    ).join('');
  }

  // ── Select helper for modals ──────────────────────────────
  async function populateSelect(selectId, endpoint, labelKey = 'nombre', valueKey = 'id') {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">— Seleccione —</option>';
    try {
      const items = await API.catalogue(endpoint);
      items.forEach(item => {
        if (item.activo === false) return;
        sel.innerHTML += `<option value="${item[valueKey]}">${item[labelKey]}</option>`;
      });
    } catch {}
  }

  // ── Start ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  return { navigate, toast, openModal, closeModal, fmt, statusBadge, setLoading, setEmpty, buildTable, populateSelect, logout };
})();
