/* ── Ventas ─────────────────────────────────────────────────────────────── */
const Module_ventas = (() => {
  async function load(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Órdenes de Venta</div></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <select class="filter-select" id="ov-estado" onchange="Module_ventas.loadPage()">
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option><option value="confirmada">Confirmada</option>
              <option value="en_proceso">En proceso</option><option value="despachada">Despachada</option>
              <option value="facturada">Facturada</option><option value="cancelada">Cancelada</option>
            </select>
            ${API.hasPerm('ventas.write') ? `<button class="btn btn-primary" onclick="Module_ventas.openNew()"><i class="fas fa-plus"></i> Nueva OV</button>` : ''}
          </div>
        </div>
        <div class="table-wrap">
          <table><thead><tr><th>Número</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody id="ov-tbody"></tbody></table>
        </div>
        <div id="ov-pagination" class="pagination"></div>
      </div>
      <div class="modal-backdrop" id="modal-ov-detail">
        <div class="modal modal-lg">
          <div class="modal-header"><span class="modal-title" id="ov-detail-title">Orden de Venta</span><button class="modal-close" onclick="App.closeModal('modal-ov-detail')">×</button></div>
          <div class="modal-body" id="ov-detail-body"></div>
          <div class="modal-footer"><button class="btn btn-ghost" onclick="App.closeModal('modal-ov-detail')">Cerrar</button></div>
        </div>
      </div>
      <div class="modal-backdrop" id="modal-ov-new">
        <div class="modal modal-lg">
          <div class="modal-header"><span class="modal-title">Nueva Orden de Venta</span><button class="modal-close" onclick="App.closeModal('modal-ov-new')">×</button></div>
          <div class="modal-body">
            <div class="form-grid" style="margin-bottom:16px">
              <div class="form-group"><label>Cliente *</label><select id="ov-cli"><option value="">— Seleccione —</option></select></div>
              <div class="form-group"><label>Fecha Orden *</label><input type="date" id="ov-fecha" value="${new Date().toISOString().slice(0,10)}"></div>
              <div class="form-group"><label>Conductor</label><select id="ov-conductor"><option value="">— Sin conductor —</option></select></div>
              <div class="form-group"><label>Fecha Entrega</label><input type="date" id="ov-entrega"></div>
              <div class="form-group full"><label>Notas</label><textarea id="ov-notas" rows="2"></textarea></div>
            </div>
            <div style="font-weight:700;margin-bottom:8px;color:var(--navy)">Artículos</div>
            <div id="ov-items"></div>
            <button class="btn btn-ghost btn-sm" onclick="Module_ventas.addItem()"><i class="fas fa-plus"></i> Agregar artículo</button>
            <div style="margin-top:16px;text-align:right;font-size:16px;font-weight:700;color:var(--navy)" id="ov-total-display">Total: $ 0</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="App.closeModal('modal-ov-new')">Cancelar</button>
            <button class="btn btn-primary" onclick="Module_ventas.save()"><i class="fas fa-save"></i> Crear OV</button>
          </div>
        </div>
      </div>`;
    await loadPage();
  }

  let _itemCount = 0;

  async function loadPage() {
    App.setLoading('ov-tbody', 6);
    const estado = document.getElementById('ov-estado')?.value||'';
    try {
      const r = await API.get('/ventas/ordenes', { estado: estado||undefined, limit:20 });
      renderTable(r.data);
      const el = document.getElementById('ov-pagination');
      if (el) el.innerHTML = `<span class="page-info">${r.meta?.total||0} registros</span>`;
    } catch(e) { App.toast(e.message,'error'); }
  }

  function renderTable(rows) {
    const tbody = document.getElementById('ov-tbody');
    if (!tbody || !rows?.length) { App.setEmpty('ov-tbody', 6); return; }
    tbody.innerHTML = rows.map(r => `<tr>
      <td><code>${r.numero}</code></td>
      <td>${r.cliente_nombre}</td>
      <td>${App.fmt(r.fecha_orden,'date')}</td>
      <td>${App.fmt(r.total,'money')}</td>
      <td>${App.statusBadge(r.estado)}</td>
      <td class="td-actions">
        <button class="btn btn-sm btn-ghost" onclick="Module_ventas.viewDetail(${r.id})"><i class="fas fa-eye"></i></button>
        ${r.estado==='borrador'&&API.hasPerm('ventas.write')?`<button class="btn btn-sm btn-outline" onclick="Module_ventas.changeEstado(${r.id},'confirmada')">Confirmar</button>`:''}
        ${r.estado==='confirmada'&&API.hasPerm('ventas.write')?`<button class="btn btn-sm btn-outline" onclick="Module_ventas.changeEstado(${r.id},'en_proceso')">Procesar</button>`:''}
        ${r.estado==='en_proceso'&&API.hasPerm('ventas.write')?`<button class="btn btn-sm btn-success" onclick="Module_ventas.changeEstado(${r.id},'despachada')">Despachar</button>`:''}
      </td>
    </tr>`).join('');
  }

  async function viewDetail(id) {
    const r = await API.get(`/ventas/ordenes/${id}`);
    const o = r.data;
    document.getElementById('ov-detail-title').textContent = `OV: ${o.numero}`;
    document.getElementById('ov-detail-body').innerHTML = `
      <div class="form-grid" style="margin-bottom:16px">
        <div><span style="font-size:11px;color:var(--gray);text-transform:uppercase">Cliente</span><div style="font-weight:600">${o.cliente_nombre}</div></div>
        <div><span style="font-size:11px;color:var(--gray);text-transform:uppercase">Estado</span><div>${App.statusBadge(o.estado)}</div></div>
        <div><span style="font-size:11px;color:var(--gray);text-transform:uppercase">Conductor</span><div>${o.conductor_nombre||'—'}</div></div>
        <div><span style="font-size:11px;color:var(--gray);text-transform:uppercase">Total</span><div style="font-weight:700;font-size:18px">${App.fmt(o.total,'money')}</div></div>
      </div>
      <div class="table-wrap">
        <table><thead><tr><th>Material</th><th>Cantidad</th><th>Precio Unit.</th><th>Descuento</th><th>Subtotal</th></tr></thead>
        <tbody>${(o.detalles||[]).map(d=>`<tr>
          <td>${d.material_nombre}</td><td>${App.fmt(d.cantidad,'num')} ${d.unidad}</td>
          <td>${App.fmt(d.precio_unitario,'money')}</td>
          <td>${d.descuento_pct||0}%</td><td>${App.fmt(d.subtotal,'money')}</td>
        </tr>`).join('')}</tbody></table>
      </div>`;
    App.openModal('modal-ov-detail');
  }

  async function openNew() {
    _itemCount = 0;
    document.getElementById('ov-items').innerHTML = '';
    document.getElementById('ov-total-display').textContent = 'Total: $ 0';
    await Promise.all([
      App.populateSelect('ov-cli', 'clientes'),
      App.populateSelect('ov-conductor', 'conductores'),
    ]);
    addItem();
    App.openModal('modal-ov-new');
  }

  async function addItem() {
    _itemCount++;
    const i = _itemCount;
    const div = document.createElement('div');
    div.className = 'detail-line-item'; div.id = `ov-item-${i}`;
    div.innerHTML = `
      <select class="filter-select" id="ov-item-mat-${i}" style="flex:2;min-width:120px"><option value="">— Material —</option></select>
      <input type="number" id="ov-item-qty-${i}" placeholder="Cantidad" min="0.01" step="0.01" style="width:90px" oninput="Module_ventas.recalc()">
      <input type="number" id="ov-item-price-${i}" placeholder="Precio" min="0" step="100" style="width:110px" oninput="Module_ventas.recalc()">
      <input type="number" id="ov-item-desc-${i}" placeholder="Desc%" min="0" max="100" step="1" style="width:70px" value="0" oninput="Module_ventas.recalc()">
      <span id="ov-item-sub-${i}" style="font-size:12px;color:var(--gray);white-space:nowrap;min-width:80px">$ 0</span>
      <button class="btn btn-icon btn-danger btn-sm" onclick="document.getElementById('ov-item-${i}').remove();Module_ventas.recalc()"><i class="fas fa-times"></i></button>`;
    document.getElementById('ov-items').appendChild(div);
    const mats = await API.catalogue('materiales');
    const sel = document.getElementById(`ov-item-mat-${i}`);
    mats.forEach(m => sel.innerHTML += `<option value="${m.id}" data-precio="${m.precio_ref||0}">${m.nombre} (${m.unidad})</option>`);
    sel.onchange = () => { const opt = sel.selectedOptions[0]; if(opt?.dataset.precio) { document.getElementById(`ov-item-price-${i}`).value=opt.dataset.precio; recalc(); } };
  }

  function recalc() {
    let total = 0;
    document.querySelectorAll('[id^="ov-item-qty-"]').forEach(el => {
      const n = el.id.split('-').pop();
      const q=parseFloat(el.value)||0, p=parseFloat(document.getElementById(`ov-item-price-${n}`)?.value)||0;
      const d=parseFloat(document.getElementById(`ov-item-desc-${n}`)?.value)||0;
      const sub=q*p*(1-d/100); total+=sub;
      const subEl=document.getElementById(`ov-item-sub-${n}`); if(subEl) subEl.textContent=App.fmt(sub,'money');
    });
    const el=document.getElementById('ov-total-display'); if(el) el.textContent=`Total (+IVA 19%): ${App.fmt(total*1.19,'money')}`;
  }

  async function save() {
    const cliente_id = parseInt(document.getElementById('ov-cli').value);
    const fecha_orden = document.getElementById('ov-fecha').value;
    if (!cliente_id) return App.toast('Seleccione un cliente','warning');
    const detalles = [];
    document.querySelectorAll('[id^="ov-item-qty-"]').forEach(el => {
      const n=el.id.split('-').pop();
      const material_id=parseInt(document.getElementById(`ov-item-mat-${n}`)?.value)||0;
      const cantidad=parseFloat(el.value)||0, precio_unitario=parseFloat(document.getElementById(`ov-item-price-${n}`)?.value)||0;
      const descuento_pct=parseFloat(document.getElementById(`ov-item-desc-${n}`)?.value)||0;
      if(material_id && cantidad>0 && precio_unitario>0) detalles.push({material_id,cantidad,precio_unitario,descuento_pct});
    });
    if (!detalles.length) return App.toast('Agregue al menos un artículo','warning');
    try {
      await API.post('/ventas/ordenes', {
        cliente_id, fecha_orden,
        conductor_id: parseInt(document.getElementById('ov-conductor')?.value)||undefined,
        fecha_entrega: document.getElementById('ov-entrega')?.value||undefined,
        notas: document.getElementById('ov-notas')?.value||undefined,
        detalles
      });
      App.closeModal('modal-ov-new'); App.toast('Orden de venta creada','success'); await loadPage();
    } catch(e) { App.toast(e.message,'error'); }
  }

  async function changeEstado(id, estado) {
    try { await API.patch(`/ventas/ordenes/${id}/estado`,{estado}); App.toast(`Actualizado a: ${estado}`,'success'); await loadPage(); }
    catch(e) { App.toast(e.message,'error'); }
  }

  return { load, loadPage, viewDetail, openNew, addItem, recalc, save, changeEstado };
})();

/* ── RRHH ───────────────────────────────────────────────────────────────── */
const Module_rrhh = (() => {
  let _tab = 'empleados';

  async function load(container) {
    container.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button class="btn ${_tab==='empleados'?'btn-primary':'btn-ghost'}" onclick="Module_rrhh.setTab('empleados')"><i class="fas fa-users"></i> Empleados</button>
        <button class="btn ${_tab==='nomina'?'btn-primary':'btn-ghost'}" onclick="Module_rrhh.setTab('nomina')"><i class="fas fa-money-bill"></i> Nómina</button>
      </div>
      <div id="rrhh-content"></div>`;
    loadTab();
  }

  function setTab(t) { _tab = t; Module_rrhh.load(document.getElementById('page-rrhh')); }

  async function loadTab() {
    const container = document.getElementById('rrhh-content');
    if (_tab === 'empleados') loadEmpleados(container);
    else loadNomina(container);
  }

  async function loadEmpleados(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">Empleados</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <input class="search-input" id="emp-search" placeholder="Buscar..." oninput="Module_rrhh.searchEmp()">
            ${API.hasPerm('rrhh.write')?`<button class="btn btn-primary" onclick="Module_rrhh.openNewEmp()"><i class="fas fa-plus"></i> Nuevo</button>`:''}
          </div>
        </div>
        <div class="table-wrap">
          <table><thead><tr><th>Código</th><th>Nombre</th><th>Cargo</th><th>Departamento</th><th>Tipo Contrato</th><th>Salario</th><th>Estado</th></tr></thead>
          <tbody id="emp-tbody"></tbody></table>
        </div>
      </div>
      <div class="modal-backdrop" id="modal-emp">
        <div class="modal modal-lg">
          <div class="modal-header"><span class="modal-title">Nuevo Empleado</span><button class="modal-close" onclick="App.closeModal('modal-emp')">×</button></div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group"><label>Nombre *</label><input id="emp-nombre" required></div>
              <div class="form-group"><label>Apellido *</label><input id="emp-apellido" required></div>
              <div class="form-group"><label>Tipo Documento</label>
                <select id="emp-tdoc"><option value="CC">Cédula</option><option value="CE">C. Extranjería</option><option value="PA">Pasaporte</option></select>
              </div>
              <div class="form-group"><label>Número Documento *</label><input id="emp-doc" required></div>
              <div class="form-group"><label>Email</label><input type="email" id="emp-email"></div>
              <div class="form-group"><label>Celular</label><input id="emp-celular"></div>
              <div class="form-group"><label>Cargo</label><select id="emp-cargo"><option value="">— Seleccione —</option></select></div>
              <div class="form-group"><label>Departamento</label><select id="emp-depto"><option value="">— Seleccione —</option></select></div>
              <div class="form-group"><label>Fecha Ingreso *</label><input type="date" id="emp-ingreso" value="${new Date().toISOString().slice(0,10)}"></div>
              <div class="form-group"><label>Tipo Contrato</label>
                <select id="emp-contrato"><option value="indefinido">Indefinido</option><option value="fijo">Fijo</option><option value="obra">Obra</option><option value="prestacion">Prestación</option></select>
              </div>
              <div class="form-group"><label>Salario *</label><input type="number" id="emp-salario" min="0" required></div>
              <div class="form-group"><label>Banco</label><input id="emp-banco"></div>
              <div class="form-group"><label>Cuenta Bancaria</label><input id="emp-cuenta"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="App.closeModal('modal-emp')">Cancelar</button>
            <button class="btn btn-primary" onclick="Module_rrhh.saveEmp()">Guardar</button>
          </div>
        </div>
      </div>`;
    App.setLoading('emp-tbody', 7);
    try {
      const r = await API.get('/rrhh/empleados', { limit: 50 });
      renderEmpleados(r.data);
    } catch(e) { App.toast(e.message,'error'); }
  }

  function renderEmpleados(rows) {
    const tbody = document.getElementById('emp-tbody');
    if (!tbody || !rows?.length) { App.setEmpty('emp-tbody', 7); return; }
    tbody.innerHTML = rows.map(r=>`<tr>
      <td><code>${r.codigo||'—'}</code></td>
      <td><strong>${r.nombre} ${r.apellido}</strong><br><span style="font-size:11px;color:var(--gray)">${r.documento}</span></td>
      <td>${r.cargo_nombre||'—'}</td><td>${r.departamento_nombre||'—'}</td>
      <td>${r.tipo_contrato}</td><td>${App.fmt(r.salario,'money')}</td>
      <td>${App.statusBadge(r.estado)}</td>
    </tr>`).join('');
  }

  async function searchEmp() {
    const q = document.getElementById('emp-search')?.value || '';
    App.setLoading('emp-tbody', 7);
    const r = await API.get('/rrhh/empleados', { search: q, limit:50 });
    renderEmpleados(r.data);
  }

  async function openNewEmp() {
    await Promise.all([App.populateSelect('emp-cargo','cargos'), App.populateSelect('emp-depto','departamentos')]);
    App.openModal('modal-emp');
  }

  async function saveEmp() {
    const body = {
      nombre:       document.getElementById('emp-nombre').value.trim(),
      apellido:     document.getElementById('emp-apellido').value.trim(),
      documento:    document.getElementById('emp-doc').value.trim(),
      tipo_documento: document.getElementById('emp-tdoc').value,
      email:        document.getElementById('emp-email').value||undefined,
      celular:      document.getElementById('emp-celular').value||undefined,
      cargo_id:     parseInt(document.getElementById('emp-cargo').value)||undefined,
      departamento_id: parseInt(document.getElementById('emp-depto').value)||undefined,
      fecha_ingreso: document.getElementById('emp-ingreso').value,
      tipo_contrato: document.getElementById('emp-contrato').value,
      salario:      parseFloat(document.getElementById('emp-salario').value),
      banco:        document.getElementById('emp-banco').value||undefined,
      cuenta_bancaria: document.getElementById('emp-cuenta').value||undefined,
    };
    if (!body.nombre||!body.apellido||!body.documento||!body.salario) return App.toast('Complete los campos requeridos','warning');
    try {
      await API.post('/rrhh/empleados', body);
      App.closeModal('modal-emp'); App.toast('Empleado creado','success'); loadTab();
    } catch(e) { App.toast(e.message,'error'); }
  }

  async function loadNomina(container) {
    const periodo = new Date().toISOString().slice(0,7);
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">Nómina</div>
          <div style="display:flex;gap:8px">
            <input type="month" class="filter-select" id="nom-periodo" value="${periodo}" onchange="Module_rrhh.loadNominaData()">
          </div>
        </div>
        <div class="table-wrap">
          <table><thead><tr><th>Empleado</th><th>Cargo</th><th>Salario Base</th><th>Bonif.</th><th>Deducc.</th><th>Total a Pagar</th><th>Estado</th></tr></thead>
          <tbody id="nom-tbody"></tbody></table>
        </div>
      </div>`;
    await loadNominaData();
  }

  async function loadNominaData() {
    const periodo = document.getElementById('nom-periodo')?.value || new Date().toISOString().slice(0,7);
    App.setLoading('nom-tbody', 7);
    try {
      const r = await API.get('/rrhh/nomina', { periodo, limit: 100 });
      const rows = r.data;
      const tbody = document.getElementById('nom-tbody');
      if (!tbody || !rows?.length) { App.setEmpty('nom-tbody', 7, 'Sin registros de nómina para este período'); return; }
      tbody.innerHTML = rows.map(r=>`<tr>
        <td><strong>${r.empleado_nombre} ${r.empleado_apellido}</strong></td>
        <td>${r.cargo_nombre||'—'}</td><td>${App.fmt(r.salario_base,'money')}</td>
        <td>${App.fmt(r.bonificaciones,'money')}</td><td>${App.fmt(r.deducciones,'money')}</td>
        <td><strong>${App.fmt(r.total_pagar,'money')}</strong></td>
        <td>${App.statusBadge(r.estado)}</td>
      </tr>`).join('');
    } catch(e) { App.toast(e.message,'error'); }
  }

  return { load, setTab, searchEmp, openNewEmp, saveEmp, loadNominaData };
})();

/* ── Finanzas ───────────────────────────────────────────────────────────── */
const Module_finanzas = (() => {
  async function load(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Transacciones</div></div>
          <div style="display:flex;gap:8px">
            ${API.hasPerm('finanzas.write')?`<button class="btn btn-primary" onclick="Module_finanzas.openNew()"><i class="fas fa-plus"></i> Nueva Transacción</button>`:''}
          </div>
        </div>
        <div class="table-wrap">
          <table><thead><tr><th>Número</th><th>Tipo</th><th>Cuenta</th><th>Fecha</th><th>Descripción</th><th>Monto</th><th>Estado</th></tr></thead>
          <tbody id="fin-tbody"></tbody></table>
        </div>
      </div>
      <div class="modal-backdrop" id="modal-fin">
        <div class="modal">
          <div class="modal-header"><span class="modal-title">Nueva Transacción</span><button class="modal-close" onclick="App.closeModal('modal-fin')">×</button></div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group"><label>Tipo *</label>
                <select id="fin-tipo"><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option><option value="traslado">Traslado</option></select>
              </div>
              <div class="form-group"><label>Cuenta *</label><select id="fin-cuenta"><option value="">— Seleccione —</option></select></div>
              <div class="form-group"><label>Fecha *</label><input type="date" id="fin-fecha" value="${new Date().toISOString().slice(0,10)}"></div>
              <div class="form-group"><label>Monto *</label><input type="number" id="fin-monto" min="0.01" step="0.01"></div>
              <div class="form-group full"><label>Descripción *</label><input id="fin-desc" placeholder="Descripción de la transacción"></div>
              <div class="form-group"><label>Referencia</label><input id="fin-ref" placeholder="Factura, OC..."></div>
              <div class="form-group"><label>Entidad</label><input id="fin-entidad" placeholder="Cliente, proveedor..."></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="App.closeModal('modal-fin')">Cancelar</button>
            <button class="btn btn-primary" onclick="Module_finanzas.save()">Guardar</button>
          </div>
        </div>
      </div>`;
    App.setLoading('fin-tbody', 7);
    try {
      const r = await API.get('/finanzas/transacciones', { limit:50 });
      const tbody = document.getElementById('fin-tbody');
      if (!r.data?.length) { App.setEmpty('fin-tbody', 7); return; }
      tbody.innerHTML = r.data.map(t=>`<tr>
        <td><code>${t.numero}</code></td><td>${App.statusBadge(t.tipo,{ingreso:'badge-green',egreso:'badge-red',traslado:'badge-blue'})}</td>
        <td>${t.cuenta_nombre}</td><td>${App.fmt(t.fecha,'date')}</td>
        <td>${t.descripcion}</td><td><strong>${App.fmt(t.monto,'money')}</strong></td>
        <td>${App.statusBadge(t.estado)}</td>
      </tr>`).join('');
    } catch(e) { App.toast(e.message,'error'); }
  }

  async function openNew() {
    await App.populateSelect('fin-cuenta','cuentas');
    App.openModal('modal-fin');
  }

  async function save() {
    const body = {
      tipo: document.getElementById('fin-tipo').value,
      cuenta_id: parseInt(document.getElementById('fin-cuenta').value)||0,
      fecha: document.getElementById('fin-fecha').value,
      monto: parseFloat(document.getElementById('fin-monto').value)||0,
      descripcion: document.getElementById('fin-desc').value.trim(),
      referencia: document.getElementById('fin-ref').value||undefined,
      entidad: document.getElementById('fin-entidad').value||undefined,
    };
    if (!body.cuenta_id || !body.monto || !body.descripcion) return App.toast('Complete todos los campos requeridos','warning');
    try {
      await API.post('/finanzas/transacciones', body);
      App.closeModal('modal-fin'); App.toast('Transacción registrada','success'); load(document.getElementById('page-finanzas'));
    } catch(e) { App.toast(e.message,'error'); }
  }

  return { load, openNew, save };
})();

/* ── Reportes ───────────────────────────────────────────────────────────── */
const Module_reportes = (() => {
  async function load(container) {
    const today = new Date().toISOString().slice(0,10);
    const monthStart = today.slice(0,7) + '-01';
    container.innerHTML = `
      <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
        <input type="date" class="filter-select" id="rep-desde" value="${monthStart}">
        <input type="date" class="filter-select" id="rep-hasta" value="${today}">
        <button class="btn btn-primary" onclick="Module_reportes.loadAll()"><i class="fas fa-sync"></i> Actualizar</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px">
        <div class="card"><div class="card-header"><span class="card-title">Ventas por Cliente</span></div><div id="rep-ventas-cli"></div></div>
        <div class="card"><div class="card-header"><span class="card-title">Compras por Proveedor</span></div><div id="rep-compras-prov"></div></div>
        <div class="card" style="grid-column:1/-1"><div class="card-header"><span class="card-title">Movimientos por Período</span></div><div id="rep-movimientos" class="table-wrap"><table><thead><tr><th>Día</th><th>Tipo</th><th>Material</th><th>Cantidad</th><th>Valor</th></tr></thead><tbody id="rep-mov-tbody"></tbody></table></div></div>
      </div>`;
    loadAll();
  }

  async function loadAll() {
    const desde = document.getElementById('rep-desde')?.value;
    const hasta = document.getElementById('rep-hasta')?.value;
    if (!desde || !hasta) return;

    try {
      const [vc, cp, mv] = await Promise.all([
        API.get('/reportes/ventas-cliente', { desde, hasta }),
        API.get('/reportes/compras-proveedor', { desde, hasta }),
        API.get('/reportes/movimientos', { desde, hasta }),
      ]);
      renderVentasCli(vc.data);
      renderComprasProv(cp.data);
      renderMovimientos(mv.data);
    } catch(e) { App.toast(e.message,'error'); }
  }

  function renderVentasCli(rows) {
    const el = document.getElementById('rep-ventas-cli');
    if (!rows?.length) { el.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i><p>Sin datos</p></div>'; return; }
    el.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Órdenes</th><th>Total</th></tr></thead><tbody>
      ${rows.map(r=>`<tr><td>${r.cliente}</td><td>${r.ordenes}</td><td>${App.fmt(r.total,'money')}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  function renderComprasProv(rows) {
    const el = document.getElementById('rep-compras-prov');
    if (!rows?.length) { el.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i><p>Sin datos</p></div>'; return; }
    el.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Proveedor</th><th>Órdenes</th><th>Total</th></tr></thead><tbody>
      ${rows.map(r=>`<tr><td>${r.proveedor}</td><td>${r.ordenes}</td><td>${App.fmt(r.total,'money')}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  function renderMovimientos(rows) {
    const tbody = document.getElementById('rep-mov-tbody');
    if (!tbody || !rows?.length) { App.setEmpty('rep-mov-tbody', 5); return; }
    tbody.innerHTML = rows.map(r=>`<tr>
      <td>${App.fmt(r.dia,'date')}</td><td>${App.statusBadge(r.tipo)}</td>
      <td>${r.material}</td><td>${App.fmt(r.cantidad_total,'num')}</td><td>${App.fmt(r.valor_total,'money')}</td>
    </tr>`).join('');
  }

  return { load, loadAll };
})();

/* ── Usuarios ───────────────────────────────────────────────────────────── */
const Module_usuarios = (() => {
  async function load(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">Usuarios del Sistema</div>
          <div style="display:flex;gap:8px">
            <input class="search-input" id="usr-search" placeholder="Buscar..." oninput="Module_usuarios.search()">
            ${API.hasPerm('usuarios.write')?`<button class="btn btn-primary" onclick="Module_usuarios.openNew()"><i class="fas fa-plus"></i> Nuevo Usuario</button>`:''}
          </div>
        </div>
        <div class="table-wrap">
          <table><thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Departamento</th><th>Último Acceso</th><th>Estado</th>${API.hasPerm('usuarios.write')?'<th>Acciones</th>':''}</tr></thead>
          <tbody id="usr-tbody"></tbody></table>
        </div>
      </div>
      <div class="modal-backdrop" id="modal-usr">
        <div class="modal">
          <div class="modal-header"><span class="modal-title">Nuevo Usuario</span><button class="modal-close" onclick="App.closeModal('modal-usr')">×</button></div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group full"><label>Nombre completo *</label><input id="usr-nombre" required></div>
              <div class="form-group full"><label>Correo electrónico *</label><input type="email" id="usr-email" required></div>
              <div class="form-group full"><label>Contraseña *</label><input type="password" id="usr-pass" minlength="8" required placeholder="Mínimo 8 caracteres"></div>
              <div class="form-group"><label>Rol *</label><select id="usr-rol"><option value="">— Seleccione —</option></select></div>
              <div class="form-group"><label>Departamento</label><select id="usr-depto"><option value="">— Seleccione —</option></select></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="App.closeModal('modal-usr')">Cancelar</button>
            <button class="btn btn-primary" onclick="Module_usuarios.save()">Crear Usuario</button>
          </div>
        </div>
      </div>`;
    await loadData();
  }

  async function loadData(q = '') {
    App.setLoading('usr-tbody', 7);
    try {
      const r = await API.get('/usuarios', { search: q||undefined, limit:50 });
      const rows = r.data, canEdit = API.hasPerm('usuarios.write');
      const tbody = document.getElementById('usr-tbody');
      if (!tbody || !rows?.length) { App.setEmpty('usr-tbody', 7); return; }
      tbody.innerHTML = rows.map(u=>`<tr>
        <td><strong>${u.nombre}</strong></td><td>${u.email}</td>
        <td><span class="badge badge-blue">${u.rol}</span></td><td>${u.departamento||'—'}</td>
        <td>${App.fmt(u.ultimo_acceso,'dt')}</td>
        <td><span class="badge ${u.activo?'badge-green':'badge-gray'}">${u.activo?'Activo':'Inactivo'}</span></td>
        ${canEdit?`<td class="td-actions"><button class="btn btn-sm btn-danger" onclick="Module_usuarios.toggle(${u.id},${u.activo})"><i class="fas fa-${u.activo?'ban':'check'}"></i></button></td>`:''}
      </tr>`).join('');
    } catch(e) { App.toast(e.message,'error'); }
  }

  async function search() {
    await loadData(document.getElementById('usr-search')?.value||'');
  }

  async function openNew() {
    await Promise.all([App.populateSelect('usr-rol','roles'), App.populateSelect('usr-depto','departamentos')]);
    App.openModal('modal-usr');
  }

  async function save() {
    const body = {
      nombre: document.getElementById('usr-nombre').value.trim(),
      email: document.getElementById('usr-email').value.trim(),
      password: document.getElementById('usr-pass').value,
      rol_id: parseInt(document.getElementById('usr-rol').value)||0,
      departamento_id: parseInt(document.getElementById('usr-depto').value)||undefined,
    };
    if (!body.nombre||!body.email||!body.password||!body.rol_id) return App.toast('Complete todos los campos','warning');
    if (body.password.length < 8) return App.toast('La contraseña debe tener al menos 8 caracteres','warning');
    try {
      await API.post('/usuarios', body);
      App.closeModal('modal-usr'); App.toast('Usuario creado','success'); await loadData();
    } catch(e) { App.toast(e.message,'error'); }
  }

  async function toggle(id, activo) {
    if (!confirm(`¿${activo?'Desactivar':'Activar'} este usuario?`)) return;
    try {
      await API.put(`/usuarios/${id}`, { activo: !activo });
      App.toast('Usuario actualizado','success'); await loadData();
    } catch(e) { App.toast(e.message,'error'); }
  }

  return { load, search, openNew, save, toggle };
})();

/* ── Config ─────────────────────────────────────────────────────────────── */
const Module_config = (() => {
  async function load(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">Configuración del Sistema</div></div>
        <div id="cfg-body"><div style="text-align:center;padding:40px"><span class="spinner"></span></div></div>
      </div>`;
    try {
      const r = await API.get('/config');
      const items = r.data;
      document.getElementById('cfg-body').innerHTML = `
        <div class="form-grid">
          ${items.map(c=>`
            <div class="form-group">
              <label>${c.descripcion || c.clave}</label>
              <div style="display:flex;gap:8px">
                <input id="cfg-${c.clave}" value="${c.valor||''}" style="flex:1">
                <button class="btn btn-outline btn-sm" onclick="Module_config.saveKey('${c.clave}')">Guardar</button>
              </div>
            </div>`).join('')}
        </div>`;
    } catch(e) { App.toast(e.message,'error'); }
  }

  async function saveKey(clave) {
    const valor = document.getElementById(`cfg-${clave}`)?.value ?? '';
    try {
      await API.put('/config', { clave, valor });
      App.toast('Configuración guardada','success');
    } catch(e) { App.toast(e.message,'error'); }
  }

  return { load, saveKey };
})();
