/* ── Inventario ────────────────────────────────────────────────────────── */
const Module_inventario = (() => {
  async function load(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Stock Actual</div><div class="card-subtitle">Inventario en tiempo real</div></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <input class="search-input" id="inv-search" placeholder="Buscar material..." oninput="Module_inventario.filter()">
            <select class="filter-select" id="inv-estado" onchange="Module_inventario.filter()">
              <option value="">Todos los estados</option>
              <option value="ok">Stock OK</option>
              <option value="bajo">Stock bajo</option>
              <option value="critico">Stock crítico</option>
            </select>
            ${API.hasPerm('catalogos.write') ? `<button class="btn btn-primary" onclick="Module_inventario.openNew()"><i class="fas fa-plus"></i> Nuevo material</button>` : ''}
          </div>
        </div>
        <div class="table-wrap">
          <table><thead><tr>
            <th>Código</th><th>Material</th><th>Categoría</th><th>Unidad</th>
            <th>Stock</th><th>Stock Mín.</th><th>Estado</th>
            ${API.hasPerm('catalogos.write') ? '<th>Acciones</th>' : ''}
          </tr></thead>
          <tbody id="inv-tbody"></tbody></table>
        </div>
      </div>
      <!-- Modal material -->
      <div class="modal-backdrop" id="modal-material">
        <div class="modal">
          <div class="modal-header"><span class="modal-title" id="mat-modal-title">Nuevo Material</span><button class="modal-close" onclick="App.closeModal('modal-material')">×</button></div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group"><label>Código</label><input id="mat-codigo" placeholder="MAT001"></div>
              <div class="form-group"><label>Nombre *</label><input id="mat-nombre" required placeholder="Arena gruesa"></div>
              <div class="form-group"><label>Unidad *</label>
                <select id="mat-unidad"><option value="m3">m³</option><option value="toneladas">Toneladas</option><option value="kg">Kg</option><option value="unidades">Unidades</option><option value="litros">Litros</option><option value="metros">Metros</option></select>
              </div>
              <div class="form-group"><label>Categoría</label><input id="mat-categoria" placeholder="Áridos"></div>
              <div class="form-group"><label>Precio Referencia</label><input id="mat-precio" type="number" min="0" placeholder="0"></div>
              <div class="form-group"><label>Stock Mínimo</label><input id="mat-stockmin" type="number" min="0" placeholder="0"></div>
              <div class="form-group full"><label>Descripción</label><textarea id="mat-desc" rows="2"></textarea></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="App.closeModal('modal-material')">Cancelar</button>
            <button class="btn btn-primary" onclick="Module_inventario.save()"><i class="fas fa-save"></i> Guardar</button>
          </div>
        </div>
      </div>`;
    await refresh();
  }

  let _all = [];
  let _editId = null;

  async function refresh() {
    App.setLoading('inv-tbody', 8);
    try {
      const r = await API.get('/inventario/stock');
      _all = r.data || [];
      filter();
    } catch(e) { App.toast(e.message, 'error'); }
  }

  function filter() {
    const q = (document.getElementById('inv-search')?.value||'').toLowerCase();
    const est = document.getElementById('inv-estado')?.value||'';
    let rows = _all.filter(r =>
      (!q || r.nombre.toLowerCase().includes(q) || (r.codigo||'').toLowerCase().includes(q)) &&
      (!est || r.estado_stock === est)
    );
    renderTable(rows);
  }

  function renderTable(rows) {
    const tbody = document.getElementById('inv-tbody');
    if (!tbody) return;
    if (!rows.length) { App.setEmpty('inv-tbody', 8); return; }
    const canEdit = API.hasPerm('catalogos.write');
    tbody.innerHTML = rows.map(r => `<tr>
      <td><code style="font-size:12px">${r.codigo||'—'}</code></td>
      <td><strong>${r.nombre}</strong></td>
      <td>${r.categoria||'—'}</td>
      <td>${r.unidad}</td>
      <td><strong class="stock-${r.estado_stock}">${App.fmt(r.stock_disponible,'num')}</strong></td>
      <td>${App.fmt(r.stock_min,'num')}</td>
      <td>${App.statusBadge(r.estado_stock,{ok:'badge-green',bajo:'badge-orange',critico:'badge-red'})}</td>
      ${canEdit ? `<td class="td-actions">
        <button class="btn btn-icon btn-ghost btn-sm" title="Editar" onclick="Module_inventario.edit(${r.id})"><i class="fas fa-pen"></i></button>
        <button class="btn btn-icon btn-ghost btn-sm" title="Ver movimientos" onclick="Module_movimientos._filtrarMaterial(${r.id},'${r.nombre}')"><i class="fas fa-exchange-alt"></i></button>
      </td>` : ''}
    </tr>`).join('');
  }

  function openNew() {
    _editId = null;
    document.getElementById('mat-modal-title').textContent = 'Nuevo Material';
    ['mat-codigo','mat-nombre','mat-categoria','mat-precio','mat-stockmin','mat-desc'].forEach(id => {
      const el = document.getElementById(id); if(el) el.value='';
    });
    document.getElementById('mat-unidad').value = 'm3';
    App.openModal('modal-material');
  }

  async function edit(id) {
    try {
      const r = await API.get(`/materiales/${id}`);
      const m = r.data;
      _editId = id;
      document.getElementById('mat-modal-title').textContent = 'Editar Material';
      document.getElementById('mat-codigo').value    = m.codigo||'';
      document.getElementById('mat-nombre').value    = m.nombre;
      document.getElementById('mat-unidad').value    = m.unidad;
      document.getElementById('mat-categoria').value = m.categoria||'';
      document.getElementById('mat-precio').value    = m.precio_ref||0;
      document.getElementById('mat-stockmin').value  = m.stock_min||0;
      document.getElementById('mat-desc').value      = m.descripcion||'';
      App.openModal('modal-material');
    } catch(e) { App.toast(e.message,'error'); }
  }

  async function save() {
    const nombre = document.getElementById('mat-nombre').value.trim();
    if (!nombre) return App.toast('El nombre es requerido','warning');
    const body = {
      nombre,
      codigo:     document.getElementById('mat-codigo').value.trim()||undefined,
      unidad:     document.getElementById('mat-unidad').value,
      categoria:  document.getElementById('mat-categoria').value.trim()||undefined,
      precio_ref: parseFloat(document.getElementById('mat-precio').value)||0,
      stock_min:  parseFloat(document.getElementById('mat-stockmin').value)||0,
      descripcion:document.getElementById('mat-desc').value.trim()||undefined,
    };
    try {
      if (_editId) await API.put(`/materiales/${_editId}`, body);
      else         await API.post('/materiales', body);
      App.closeModal('modal-material');
      App.toast(_editId ? 'Material actualizado' : 'Material creado', 'success');
      API.clearCache('materiales');
      await refresh();
    } catch(e) { App.toast(e.message,'error'); }
  }

  return { load, refresh, filter, edit, openNew, save };
})();
