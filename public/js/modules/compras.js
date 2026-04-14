/* ── Compras ────────────────────────────────────────────────────────────── */
const Module_compras = (() => {
  let _page = 1;

  async function load(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Órdenes de Compra</div></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <select class="filter-select" id="oc-estado" onchange="Module_compras.loadPage()">
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option><option value="enviada">Enviada</option>
              <option value="confirmada">Confirmada</option><option value="recibida">Recibida</option>
              <option value="cancelada">Cancelada</option>
            </select>
            ${API.hasPerm('compras.write') ? `<button class="btn btn-primary" onclick="Module_compras.openNew()"><i class="fas fa-plus"></i> Nueva OC</button>` : ''}
          </div>
        </div>
        <div class="table-wrap">
          <table><thead><tr><th>Número</th><th>Proveedor</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody id="oc-tbody"></tbody></table>
        </div>
        <div id="oc-pagination" class="pagination"></div>
      </div>
      <!-- Detail modal -->
      <div class="modal-backdrop" id="modal-oc-detail">
        <div class="modal modal-lg">
          <div class="modal-header"><span class="modal-title" id="oc-detail-title">Orden de Compra</span><button class="modal-close" onclick="App.closeModal('modal-oc-detail')">×</button></div>
          <div class="modal-body" id="oc-detail-body"></div>
          <div class="modal-footer" id="oc-detail-footer">
            <button class="btn btn-ghost" onclick="App.closeModal('modal-oc-detail')">Cerrar</button>
          </div>
        </div>
      </div>
      <!-- New OC modal -->
      <div class="modal-backdrop" id="modal-oc-new">
        <div class="modal modal-lg">
          <div class="modal-header"><span class="modal-title">Nueva Orden de Compra</span><button class="modal-close" onclick="App.closeModal('modal-oc-new')">×</button></div>
          <div class="modal-body">
            <div class="form-grid" style="margin-bottom:16px">
              <div class="form-group"><label>Proveedor *</label><select id="oc-prov"><option value="">— Seleccione —</option></select></div>
              <div class="form-group"><label>Fecha Orden *</label><input type="date" id="oc-fecha" value="${new Date().toISOString().slice(0,10)}"></div>
              <div class="form-group"><label>Fecha Entrega</label><input type="date" id="oc-entrega"></div>
              <div class="form-group full"><label>Notas</label><textarea id="oc-notas" rows="2"></textarea></div>
            </div>
            <div style="font-weight:700;margin-bottom:8px;color:var(--navy)">Artículos</div>
            <div id="oc-items"></div>
            <button class="btn btn-ghost btn-sm" onclick="Module_compras.addItem()"><i class="fas fa-plus"></i> Agregar artículo</button>
            <div style="margin-top:16px;text-align:right;font-size:16px;font-weight:700;color:var(--navy)" id="oc-total-display">Total: $ 0</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="App.closeModal('modal-oc-new')">Cancelar</button>
            <button class="btn btn-primary" onclick="Module_compras.save()"><i class="fas fa-save"></i> Crear OC</button>
          </div>
        </div>
      </div>`;
    await loadPage();
  }

  async function loadPage() {
    _page = 1; App.setLoading('oc-tbody', 6);
    const estado = document.getElementById('oc-estado')?.value||'';
    try {
      const r = await API.get('/compras/ordenes', { estado: estado||undefined, page:_page, limit:20 });
      renderTable(r.data); renderPagination(r.meta);
    } catch(e) { App.toast(e.message,'error'); }
  }

  function renderTable(rows) {
    const tbody = document.getElementById('oc-tbody');
    if (!tbody || !rows?.length) { App.setEmpty('oc-tbody', 6); return; }
    tbody.innerHTML = rows.map(r => `<tr>
      <td><code>${r.numero}</code></td>
      <td>${r.proveedor_nombre}</td>
      <td>${App.fmt(r.fecha_orden,'date')}</td>
      <td>${App.fmt(r.total,'money')}</td>
      <td>${App.statusBadge(r.estado)}</td>
      <td class="td-actions">
        <button class="btn btn-sm btn-ghost" onclick="Module_compras.viewDetail(${r.id})"><i class="fas fa-eye"></i></button>
        ${r.estado==='borrador'&&API.hasPerm('compras.write') ? `<button class="btn btn-sm btn-outline" onclick="Module_compras.changeEstado(${r.id},'enviada')">Enviar</button>` : ''}
        ${r.estado==='enviada'&&API.hasPerm('compras.write') ? `<button class="btn btn-sm btn-success" onclick="Module_compras.changeEstado(${r.id},'confirmada')">Confirmar</button>` : ''}
        ${r.estado==='confirmada'&&API.hasPerm('compras.write') ? `<button class="btn btn-sm btn-success" onclick="Module_compras.changeEstado(${r.id},'recibida')">Recibida</button>` : ''}
      </td>
    </tr>`).join('');
  }

  function renderPagination(meta) {
    const el = document.getElementById('oc-pagination');
    if (!el || !meta) return;
    el.innerHTML = `<span class="page-info">${meta.total} registros</span>`;
  }

  async function viewDetail(id) {
    try {
      const r = await API.get(`/compras/ordenes/${id}`);
      const o = r.data;
      document.getElementById('oc-detail-title').textContent = `OC: ${o.numero}`;
      document.getElementById('oc-detail-body').innerHTML = `
        <div class="form-grid" style="margin-bottom:16px">
          <div><span style="font-size:11px;color:var(--gray);text-transform:uppercase">Proveedor</span><div style="font-weight:600">${o.proveedor_nombre}</div></div>
          <div><span style="font-size:11px;color:var(--gray);text-transform:uppercase">Fecha</span><div>${App.fmt(o.fecha_orden,'date')}</div></div>
          <div><span style="font-size:11px;color:var(--gray);text-transform:uppercase">Estado</span><div>${App.statusBadge(o.estado)}</div></div>
          <div><span style="font-size:11px;color:var(--gray);text-transform:uppercase">Total</span><div style="font-weight:700;font-size:18px">${App.fmt(o.total,'money')}</div></div>
        </div>
        <div class="table-wrap">
          <table><thead><tr><th>Material</th><th>Cantidad</th><th>Precio Unit.</th><th>Subtotal</th></tr></thead>
          <tbody>${(o.detalles||[]).map(d=>`<tr>
            <td>${d.material_nombre}</td><td>${App.fmt(d.cantidad,'num')} ${d.unidad}</td>
            <td>${App.fmt(d.precio_unitario,'money')}</td><td>${App.fmt(d.subtotal,'money')}</td>
          </tr>`).join('')}</tbody></table>
        </div>
        ${o.notas ? `<div style="margin-top:12px;padding:10px;background:var(--lgray);border-radius:7px;font-size:13px"><strong>Notas:</strong> ${o.notas}</div>` : ''}`;
      App.openModal('modal-oc-detail');
    } catch(e) { App.toast(e.message,'error'); }
  }

  let _itemCount = 0;
  async function openNew() {
    _itemCount = 0;
    document.getElementById('oc-items').innerHTML = '';
    document.getElementById('oc-notas').value = '';
    document.getElementById('oc-total-display').textContent = 'Total: $ 0';
    await App.populateSelect('oc-prov', 'proveedores');
    addItem();
    App.openModal('modal-oc-new');
  }

  async function addItem() {
    _itemCount++;
    const i = _itemCount;
    const div = document.createElement('div');
    div.className = 'detail-line-item'; div.id = `oc-item-${i}`;
    div.innerHTML = `
      <select class="filter-select" id="oc-item-mat-${i}" style="flex:2;min-width:120px"><option value="">— Material —</option></select>
      <input type="number" id="oc-item-qty-${i}" placeholder="Cantidad" min="0.01" step="0.01" style="width:100px" oninput="Module_compras.recalc()">
      <input type="number" id="oc-item-price-${i}" placeholder="Precio unit." min="0" step="100" style="width:120px" oninput="Module_compras.recalc()">
      <span id="oc-item-sub-${i}" style="font-size:12px;color:var(--gray);white-space:nowrap;min-width:80px">$ 0</span>
      <button class="btn btn-icon btn-danger btn-sm" onclick="document.getElementById('oc-item-${i}').remove();Module_compras.recalc()"><i class="fas fa-times"></i></button>`;
    document.getElementById('oc-items').appendChild(div);
    const mats = await API.catalogue('materiales');
    const sel = document.getElementById(`oc-item-mat-${i}`);
    mats.forEach(m => sel.innerHTML += `<option value="${m.id}" data-precio="${m.precio_ref||0}">${m.nombre} (${m.unidad})</option>`);
    sel.onchange = () => {
      const opt = sel.selectedOptions[0];
      if (opt?.dataset.precio) { document.getElementById(`oc-item-price-${i}`).value = opt.dataset.precio; recalc(); }
    };
  }

  function recalc() {
    let total = 0;
    document.querySelectorAll('[id^="oc-item-qty-"]').forEach(el => {
      const n = el.id.split('-').pop();
      const q = parseFloat(el.value)||0, p = parseFloat(document.getElementById(`oc-item-price-${n}`)?.value)||0;
      const sub = q*p; total += sub;
      const subEl = document.getElementById(`oc-item-sub-${n}`);
      if (subEl) subEl.textContent = App.fmt(sub,'money');
    });
    const el = document.getElementById('oc-total-display');
    if (el) el.textContent = `Total (+ IVA 19%): ${App.fmt(total*1.19,'money')}`;
  }

  async function save() {
    const proveedor_id = parseInt(document.getElementById('oc-prov').value);
    const fecha_orden  = document.getElementById('oc-fecha').value;
    if (!proveedor_id) return App.toast('Seleccione un proveedor','warning');
    if (!fecha_orden)  return App.toast('Ingrese la fecha','warning');
    const detalles = [];
    document.querySelectorAll('[id^="oc-item-qty-"]').forEach(el => {
      const n = el.id.split('-').pop();
      const material_id = parseInt(document.getElementById(`oc-item-mat-${n}`)?.value)||0;
      const cantidad = parseFloat(el.value)||0;
      const precio_unitario = parseFloat(document.getElementById(`oc-item-price-${n}`)?.value)||0;
      if (material_id && cantidad > 0 && precio_unitario > 0) detalles.push({ material_id, cantidad, precio_unitario });
    });
    if (!detalles.length) return App.toast('Agregue al menos un artículo válido','warning');
    try {
      await API.post('/compras/ordenes', {
        proveedor_id, fecha_orden,
        fecha_entrega: document.getElementById('oc-entrega').value||undefined,
        notas: document.getElementById('oc-notas').value||undefined,
        detalles
      });
      App.closeModal('modal-oc-new');
      App.toast('Orden de compra creada', 'success');
      await loadPage();
    } catch(e) { App.toast(e.message,'error'); }
  }

  async function changeEstado(id, estado) {
    try {
      await API.patch(`/compras/ordenes/${id}/estado`, { estado });
      App.toast(`Orden actualizada a: ${estado}`,'success');
      await loadPage();
    } catch(e) { App.toast(e.message,'error'); }
  }

  return { load, loadPage, viewDetail, openNew, addItem, recalc, save, changeEstado };
})();
