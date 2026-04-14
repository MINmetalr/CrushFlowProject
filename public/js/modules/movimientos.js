/* ── Movimientos ───────────────────────────────────────────────────────── */
const Module_movimientos = (() => {
  let _page = 1, _total = 0, _filter = {};

  async function load(container) {
    const today = new Date().toISOString().slice(0,10);
    const monthStart = today.slice(0,7) + '-01';
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Movimientos de Inventario</div></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <input type="date" class="filter-select" id="mov-desde" value="${monthStart}" onchange="Module_movimientos.applyFilter()">
            <input type="date" class="filter-select" id="mov-hasta" value="${today}" onchange="Module_movimientos.applyFilter()">
            <select class="filter-select" id="mov-tipo" onchange="Module_movimientos.applyFilter()">
              <option value="">Todos los tipos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
              <option value="traslado">Traslados</option>
              <option value="ajuste">Ajustes</option>
            </select>
            ${API.hasPerm('movimientos.create') ? `<button class="btn btn-primary" onclick="Module_movimientos.openNew()"><i class="fas fa-plus"></i> Registrar</button>` : ''}
          </div>
        </div>
        <div class="table-wrap">
          <table><thead><tr>
            <th>Fecha</th><th>Tipo</th><th>Material</th><th>Cantidad</th><th>Conductor</th><th>Cliente/Prov.</th><th>Valor Total</th><th>Guía</th>
          </tr></thead><tbody id="mov-tbody"></tbody></table>
        </div>
        <div id="mov-pagination" class="pagination"></div>
      </div>
      <!-- Modal -->
      <div class="modal-backdrop" id="modal-movimiento">
        <div class="modal">
          <div class="modal-header"><span class="modal-title">Registrar Movimiento</span><button class="modal-close" onclick="App.closeModal('modal-movimiento')">×</button></div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group"><label>Tipo *</label>
                <select id="mov-new-tipo" onchange="Module_movimientos.onTipoChange()">
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="traslado">Traslado</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>
              <div class="form-group"><label>Fecha</label><input type="datetime-local" id="mov-new-fecha"></div>
              <div class="form-group"><label>Material *</label><select id="mov-new-material"><option value="">— Seleccione —</option></select></div>
              <div class="form-group"><label>Cantidad *</label><input type="number" id="mov-new-cantidad" min="0.01" step="0.01" placeholder="0.00"></div>
              <div class="form-group" id="mov-grp-conductor"><label>Conductor</label><select id="mov-new-conductor"><option value="">— Sin conductor —</option></select></div>
              <div class="form-group" id="mov-grp-cliente"><label>Cliente</label><select id="mov-new-cliente"><option value="">— Sin cliente —</option></select></div>
              <div class="form-group" id="mov-grp-proveedor"><label>Proveedor</label><select id="mov-new-proveedor"><option value="">— Sin proveedor —</option></select></div>
              <div class="form-group"><label>Precio Unitario</label><input type="number" id="mov-new-precio" min="0" step="0.01" placeholder="0.00"></div>
              <div class="form-group"><label>Placa Vehículo</label><input id="mov-new-placa" placeholder="ABC-123"></div>
              <div class="form-group"><label>Guía de Despacho</label><input id="mov-new-guia" placeholder="GD-001"></div>
              <div class="form-group full"><label>Observaciones</label><textarea id="mov-new-obs" rows="2"></textarea></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="App.closeModal('modal-movimiento')">Cancelar</button>
            <button class="btn btn-primary" onclick="Module_movimientos.save()"><i class="fas fa-save"></i> Registrar</button>
          </div>
        </div>
      </div>`;

    applyFilter();
  }

  async function applyFilter() {
    _page = 1;
    _filter = {
      tipo:    document.getElementById('mov-tipo')?.value || undefined,
      desde:   document.getElementById('mov-desde')?.value || undefined,
      hasta:   document.getElementById('mov-hasta')?.value || undefined,
    };
    await loadPage();
  }

  async function loadPage() {
    App.setLoading('mov-tbody', 8);
    try {
      const r = await API.get('/movimientos', { ..._filter, page:_page, limit:20 });
      _total = r.meta?.total || 0;
      renderTable(r.data);
      renderPagination(r.meta);
    } catch(e) { App.toast(e.message,'error'); }
  }

  function renderTable(rows) {
    const tbody = document.getElementById('mov-tbody');
    if (!tbody || !rows?.length) { App.setEmpty('mov-tbody', 8); return; }
    tbody.innerHTML = rows.map(r => `<tr>
      <td style="white-space:nowrap">${App.fmt(r.fecha,'dt')}</td>
      <td>${App.statusBadge(r.tipo)}</td>
      <td><strong>${r.material_nombre}</strong><br><span style="font-size:11px;color:var(--gray)">${r.unidad}</span></td>
      <td><strong>${App.fmt(r.cantidad,'num')}</strong></td>
      <td>${r.conductor_nombre||'—'}</td>
      <td>${r.cliente_nombre || r.proveedor_nombre || '—'}</td>
      <td>${r.total ? App.fmt(r.total,'money') : '—'}</td>
      <td><code style="font-size:11px">${r.guia_despacho||'—'}</code></td>
    </tr>`).join('');
  }

  function renderPagination(meta) {
    const el = document.getElementById('mov-pagination');
    if (!el || !meta) return;
    el.innerHTML = `
      <button class="page-btn" onclick="Module_movimientos.goPage(${_page-1})" ${_page<=1?'disabled':''}>‹</button>
      <span class="page-info">Página ${meta.page} de ${meta.pages} · ${meta.total} registros</span>
      <button class="page-btn" onclick="Module_movimientos.goPage(${_page+1})" ${!meta.hasNext?'disabled':''}>›</button>`;
  }

  function goPage(p) { _page = p; loadPage(); }

  async function openNew() {
    const now = new Date(); now.setSeconds(0,0);
    document.getElementById('mov-new-fecha').value = now.toISOString().slice(0,16);
    document.getElementById('mov-new-cantidad').value = '';
    document.getElementById('mov-new-precio').value = '';
    document.getElementById('mov-new-placa').value = '';
    document.getElementById('mov-new-guia').value = '';
    document.getElementById('mov-new-obs').value = '';
    await Promise.all([
      App.populateSelect('mov-new-material', 'materiales'),
      App.populateSelect('mov-new-conductor', 'conductores'),
      App.populateSelect('mov-new-cliente', 'clientes'),
      App.populateSelect('mov-new-proveedor', 'proveedores'),
    ]);
    onTipoChange();
    App.openModal('modal-movimiento');
  }

  function onTipoChange() {
    const tipo = document.getElementById('mov-new-tipo')?.value;
    const show = (id, v) => { const el = document.getElementById(id); if(el) el.style.display = v ? '' : 'none'; };
    show('mov-grp-conductor', true);
    show('mov-grp-cliente',   tipo === 'salida');
    show('mov-grp-proveedor', tipo === 'entrada');
  }

  async function save() {
    const material_id = parseInt(document.getElementById('mov-new-material').value);
    const cantidad    = parseFloat(document.getElementById('mov-new-cantidad').value);
    if (!material_id) return App.toast('Seleccione un material','warning');
    if (!cantidad || cantidad <= 0) return App.toast('Ingrese una cantidad válida','warning');

    const body = {
      tipo:           document.getElementById('mov-new-tipo').value,
      fecha:          new Date(document.getElementById('mov-new-fecha').value).toISOString(),
      material_id, cantidad,
      conductor_id:   parseInt(document.getElementById('mov-new-conductor')?.value)||undefined,
      cliente_id:     parseInt(document.getElementById('mov-new-cliente')?.value)||undefined,
      proveedor_id:   parseInt(document.getElementById('mov-new-proveedor')?.value)||undefined,
      precio_unitario:parseFloat(document.getElementById('mov-new-precio').value)||undefined,
      placa_vehiculo: document.getElementById('mov-new-placa').value.trim()||undefined,
      guia_despacho:  document.getElementById('mov-new-guia').value.trim()||undefined,
      observaciones:  document.getElementById('mov-new-obs').value.trim()||undefined,
    };
    try {
      await API.post('/movimientos', body);
      App.closeModal('modal-movimiento');
      App.toast('Movimiento registrado', 'success');
      await loadPage();
    } catch(e) { App.toast(e.message,'error'); }
  }

  // Called from inventario module
  function _filtrarMaterial(id, nombre) {
    App.navigate('movimientos');
    setTimeout(() => {
      const el = document.getElementById('mov-tipo');
      if (el) { _filter.material_id = id; loadPage(); }
    }, 300);
  }

  return { load, applyFilter, goPage, openNew, onTipoChange, save, _filtrarMaterial };
})();
