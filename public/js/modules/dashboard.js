/* ── Dashboard ─────────────────────────────────────────────────────────── */
const Module_dashboard = (() => {
  async function load(container) {
    container.innerHTML = `
      <div class="kpi-grid" id="dash-kpis">
        ${[...Array(5)].map(()=>`<div class="kpi-card"><div class="spinner"></div></div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px">
        <div class="card">
          <div class="card-header"><span class="card-title"><i class="fas fa-chart-line" style="color:var(--lblue)"></i> Ventas últimos 6 meses</span></div>
          <canvas id="chart-ventas" height="180"></canvas>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title"><i class="fas fa-trophy" style="color:var(--orange)"></i> Top Materiales (30 días)</span></div>
          <div id="top-materiales"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <div><span class="card-title"><i class="fas fa-exclamation-triangle" style="color:var(--orange)"></i> Stock Crítico / Bajo</span></div>
            <button class="btn btn-sm btn-outline" onclick="App.navigate('inventario')">Ver todo</button>
          </div>
          <div id="dash-stock"></div>
        </div>
      </div>`;

    try {
      const [dash, stock] = await Promise.all([
        API.get('/reportes/dashboard'),
        API.get('/inventario/stock'),
      ]);
      const d = dash.data;
      renderKPIs(d);
      renderTopMateriales(d.topMateriales);
      renderStockCritico(stock.data);
      renderVentasChart(d.ventasMes);
    } catch(e) {
      container.querySelector('#dash-kpis').innerHTML = `<div style="color:var(--red)"><i class="fas fa-times-circle"></i> Error al cargar: ${e.message}</div>`;
    }
  }

  function renderKPIs(d) {
    document.getElementById('dash-kpis').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon"><i class="fas fa-tag"></i></div>
        <div><div class="kpi-value">${App.fmt(d.ventas30.total,'money')}</div><div class="kpi-label">Ventas últimos 30 días (${d.ventas30.ordenes} órdenes)</div></div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-icon"><i class="fas fa-shopping-cart"></i></div>
        <div><div class="kpi-value">${App.fmt(d.compras30.total,'money')}</div><div class="kpi-label">Compras últimos 30 días (${d.compras30.ordenes} órdenes)</div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon"><i class="fas fa-exchange-alt"></i></div>
        <div><div class="kpi-value">${d.movimientos7.total}</div><div class="kpi-label">Movimientos (7 días) · ↑${d.movimientos7.entradas} ↓${d.movimientos7.salidas}</div></div>
      </div>
      <div class="kpi-card ${d.stockCritico>0?'red':''}">
        <div class="kpi-icon"><i class="fas fa-boxes"></i></div>
        <div><div class="kpi-value">${d.stockCritico}</div><div class="kpi-label">Materiales en stock crítico/bajo</div></div>
      </div>
      <div class="kpi-card ${d.facturasPendientes.total>0?'orange':''}">
        <div class="kpi-icon"><i class="fas fa-file-invoice-dollar"></i></div>
        <div><div class="kpi-value">${App.fmt(d.facturasPendientes.monto,'money')}</div><div class="kpi-label">Facturas pendientes (${d.facturasPendientes.total})</div></div>
      </div>`;
  }

  function renderTopMateriales(items) {
    const el = document.getElementById('top-materiales');
    if (!items?.length) { el.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Sin datos</p></div>'; return; }
    el.innerHTML = items.map((m,i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="width:24px;height:24px;border-radius:50%;background:var(--sky);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">${i+1}</div>
        <div style="flex:1"><div style="font-weight:600;font-size:13px">${m.nombre}</div></div>
        <div style="font-size:12px;color:var(--gray)">${App.fmt(m.cantidad_total,'num')} ${m.unidad}</div>
      </div>`).join('');
  }

  function renderStockCritico(stock) {
    const el = document.getElementById('dash-stock');
    const alertas = stock?.filter(s => s.estado_stock !== 'ok') || [];
    if (!alertas.length) {
      el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--green)"><i class="fas fa-check-circle" style="font-size:32px"></i><p style="margin-top:8px">Todos los materiales tienen stock adecuado</p></div>';
      return;
    }
    el.innerHTML = alertas.map(s => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
        <div><div style="font-weight:600;font-size:13px">${s.nombre}</div><div style="font-size:11px;color:var(--gray)">${s.unidad}</div></div>
        <div style="text-align:right">
          <div style="font-weight:700" class="stock-${s.estado_stock}">${App.fmt(s.stock_disponible,'num')}</div>
          ${App.statusBadge(s.estado_stock,{'ok':'badge-green','bajo':'badge-orange','critico':'badge-red'})}
        </div>
      </div>`).join('');
  }

  function renderVentasChart(meses) {
    const canvas = document.getElementById('chart-ventas');
    if (!canvas || !meses?.length) return;
    const ctx = canvas.getContext('2d');
    const labels = meses.map(m => m.mes);
    const values = meses.map(m => m.total);
    const max = Math.max(...values, 1);
    const W = canvas.offsetWidth || 400, H = 180;
    canvas.width = W; canvas.height = H;
    const pad = { t:20, r:16, b:36, l:60 };
    const bw = (W - pad.l - pad.r) / labels.length;

    ctx.clearRect(0,0,W,H);
    // Grid lines
    ctx.strokeStyle='#e5e9ef'; ctx.lineWidth=1;
    for (let i=0;i<=4;i++) {
      const y = pad.t + (H-pad.t-pad.b)*i/4;
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
      ctx.fillStyle='#5d6d7e'; ctx.font='10px sans-serif'; ctx.textAlign='right';
      ctx.fillText(fmtK(max*(4-i)/4), pad.l-6, y+4);
    }
    // Bars
    labels.forEach((l,i) => {
      const bh = (values[i]/max)*(H-pad.t-pad.b);
      const x = pad.l + i*bw + bw*.15;
      const y = pad.t + (H-pad.t-pad.b) - bh;
      const g = ctx.createLinearGradient(0,y,0,H-pad.b);
      g.addColorStop(0,'#2e86c1'); g.addColorStop(1,'#aed6f1');
      ctx.fillStyle=g;
      ctx.beginPath();
      ctx.roundRect(x, y, bw*.7, bh, [4,4,0,0]);
      ctx.fill();
      ctx.fillStyle='#5d6d7e'; ctx.font='10px sans-serif'; ctx.textAlign='center';
      ctx.fillText(l.slice(5), pad.l + i*bw + bw/2, H-pad.b+14);
    });
  }

  function fmtK(v) {
    if (v >= 1e6) return (v/1e6).toFixed(1)+'M';
    if (v >= 1e3) return (v/1e3).toFixed(0)+'K';
    return Math.round(v).toString();
  }

  return { load };
})();
