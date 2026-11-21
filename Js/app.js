$(function () {
  const role = Number(window.BODEGA_ROLE || 0);
  const api = '../php/Api.php';
  let catalogs = { bodegas: [], items: [] };
  const roleNames = { 1: 'Administrador', 2: 'Instructor', 3: 'Coordinador', 4: 'Encargado de bodega' };
  const $content = $('#content');
  const titles = { inicio: 'Inicio', inventario: 'Inventario', nueva: 'Nueva solicitud', solicitudes: 'Solicitudes', movimientos: 'Movimientos' };

  function toast(message, bad = false) {
    $('#toast').text(message).toggleClass('bad', bad).addClass('show');
    setTimeout(() => $('#toast').removeClass('show'), 3200);
  }
  function call(op, data = {}) {
    return $.ajax({ url: api + '?op=' + op, method: 'POST', dataType: 'json', data });
  }
  function esc(value) { return $('<div>').text(value ?? '').html(); }
  function setView(view) {
    $('.side-link').removeClass('active');
    $('.side-link[data-view="' + view + '"]').addClass('active');
    $('#pageTitle').text(titles[view] || 'Panel');
    if (view === 'inicio') dashboard();
    if (view === 'inventario') inventory();
    if (view === 'nueva') newRequest();
    if (view === 'solicitudes') requests();
    if (view === 'movimientos') movements();
  }
  $('.side-link').on('click', function () { setView($(this).data('view')); $('#sidebar').removeClass('open'); });
  $('#toggleSide').on('click', () => $('#sidebar').toggleClass('open'));
  $('#logoutBtn').on('click', () => call('logout').done(() => location.href = '../index.php'));
  function loadCatalog() { return call('catalogos').done(r => { if (r.ok) catalogs = r.datos; }); }

  function dashboard() {
    call('dashboard').done(r => {
      if (!r.ok) { $content.html(`<div class="alert alert-danger">${esc(r.mensaje)}</div>`); return; }
      const d = r.datos || {};
      let cards = [];
      if (role === 1) cards = [['Artículos activos', d.inventario, '▦'], ['Stock bajo', d.stockBajo, '!'], ['Solicitudes por revisar', d.pendientes, '☷'], ['Entregas completadas', d.entregas, '✓']];
      if (role === 2) cards = [['Mis solicitudes', d.misSolicitudes, '☷'], ['Pendientes', d.pendientes, '◷']];
      if (role === 3) cards = [['Por revisar', d.pendientes, '☷'], ['Autorizadas', d.aprobadas, '✓']];
      if (role === 4) cards = [['Artículos en catálogo', d.inventario, '▦'], ['Por entregar', d.porEntregar, '→'], ['Stock bajo', d.stockBajo, '!']];
      let html = `<div class="welcome-card"><div><span class="eyebrow">PANEL DE ${esc(roleNames[role] || 'USUARIO').toUpperCase()}</span><h2>Hola, ${esc(window.BODEGA_USER || '')}</h2><p>Gestiona los recursos del Centro Agropecuario desde tu espacio de trabajo.</p></div><div class="welcome-symbol">✳</div></div>`;
      html += `<div class="stats-grid">${cards.map(c => `<div class="stat-card"><div class="stat-icon">${c[2]}</div><div class="stat-number">${c[1] ?? 0}</div><div class="stat-label">${c[0]}</div></div>`).join('')}</div>`;
      html += `<div class="section-heading"><div><h3>Accesos rápidos</h3><p>Opciones disponibles según tu rol.</p></div></div><div class="quick-grid">`;
      if (role === 2) html += `<button class="quick-card" data-go="nueva"><b>＋ Crear solicitud</b><small>Solicita insumos, herramientas o materiales.</small></button><button class="quick-card" data-go="solicitudes"><b>☷ Ver solicitudes</b><small>Consulta estados y respuestas.</small></button>`;
      if (role === 3) html += `<button class="quick-card" data-go="solicitudes"><b>✓ Revisar solicitudes</b><small>Autoriza o rechaza solicitudes recibidas.</small></button>`;
      if (role === 1) html += `<button class="quick-card" data-go="solicitudes"><b>☷ Revisar solicitudes</b><small>Supervisa el flujo completo.</small></button><button class="quick-card" data-go="inventario"><b>▦ Inventario</b><small>Consulta y registra artículos.</small></button>`;
      if (role === 4) html += `<button class="quick-card" data-go="inventario"><b>▦ Control de inventario</b><small>Revisa existencias y registra entradas.</small></button><button class="quick-card" data-go="solicitudes"><b>→ Preparar entregas</b><small>Entrega solicitudes autorizadas.</small></button>`;
      html += `</div>`;
      $content.html(html); $('.quick-card').on('click', function () { setView($(this).data('go')); });
    });
  }

  function inventory() {
    if (![1, 4].includes(role)) return;
    $content.html(`<div class="section-heading"><div><h3>Inventario general</h3><p>Listado de artículos activos, agrupados por bodega.</p></div><button class="btn btn-main" id="addItem">＋ Nuevo artículo</button></div><div class="table-panel"><div class="table-toolbar"><input class="form-control" id="searchInventory" placeholder="Buscar por nombre, código o categoría"><button class="btn btn-outline-secondary" id="refreshInv">Actualizar</button></div><div id="invTable" class="table-responsive"><div class="loading">Cargando inventario…</div></div></div>`);
    fetchInventory(); $('#searchInventory').on('input', fetchInventory); $('#refreshInv').on('click', fetchInventory);
    $('#addItem').on('click', () => loadCatalog().done(() => { fillWarehouses('#itemWarehouse'); bootstrap.Modal.getOrCreateInstance(document.getElementById('itemModal')).show(); }));
  }
  function fetchInventory() {
    call('listInventario', { q: $('#searchInventory').val() || '' }).done(r => {
      if (!r.ok) return;
      const rows = r.datos; let html = `<table class="table align-middle"><thead><tr><th>Código</th><th>Artículo</th><th>Tipo / categoría</th><th>Bodega</th><th>Stock</th><th>Estado</th>${role === 4 ? '<th>Entrada</th>' : ''}</tr></thead><tbody>`;
      rows.forEach(x => {
        const low = Number(x.stock) <= Number(x.stock_minimo);
        html += `<tr><td>${esc(x.codigo || '—')}</td><td><strong>${esc(x.nombre)}</strong><small class="d-block text-muted">${esc(x.ubicacion || '')}</small></td><td>${esc(x.tipo)}<small class="d-block text-muted">${esc(x.categoria || '')}</small></td><td>${esc(x.bodega)}</td><td><strong>${Number(x.stock).toLocaleString('es-CO')} ${esc(x.unidad)}</strong></td><td><span class="pill ${low ? 'pill-low' : 'pill-ok'}">${low ? 'Stock bajo' : 'Disponible'}</span></td>${role === 4 ? `<td><button class="btn btn-sm btn-outline-success add-stock" data-id="${x.id_item}" data-name="${esc(x.nombre)}">+ Stock</button></td>` : ''}</tr>`;
      });
      html += `</tbody></table>`; $('#invTable').html(rows.length ? html : '<div class="empty-state">No se encontraron artículos.</div>');
      $('.add-stock').on('click', function () {
        const quantity = prompt('Cantidad que ingresará para ' + $(this).data('name') + ':'); if (quantity === null) return;
        const qty = Number(quantity); if (qty <= 0 || !Number.isFinite(qty)) { toast('Ingresa una cantidad válida.', true); return; }
        const detail = prompt('Detalle de la entrada (opcional):', 'Entrada de material');
        call('entradaStock', { id: $(this).data('id'), cantidad: qty, detalle: detail || 'Entrada de stock' }).done(a => { toast(a.mensaje, !a.ok); fetchInventory(); });
      });
    });
  }
  function fillWarehouses(selector) { $(selector).html('<option value="">Selecciona bodega</option>' + catalogs.bodegas.map(w => `<option value="${w.id_bodega}">${esc(w.nombre)}</option>`).join('')); }

  function newRequest() {
    if (role !== 2) { $content.html('<div class="empty-state">Este módulo está disponible para instructores.</div>'); return; }
    loadCatalog().done(() => {
      const html = `<div class="section-heading"><div><h3>Crear solicitud de materiales</h3><p>Selecciona la bodega, los artículos y las cantidades requeridas.</p></div></div><div class="request-panel"><form id="requestForm"><div class="row g-3"><div class="col-md-6"><label class="form-label">Bodega de destino</label><select class="form-select" name="bodega" id="reqWarehouse" required><option value="">Selecciona una bodega</option>${catalogs.bodegas.map(w => `<option value="${w.id_bodega}">${esc(w.nombre)}</option>`).join('')}</select></div><div class="col-md-6"><label class="form-label">Fecha en la que lo necesitas (opcional)</label><input class="form-control" type="date" name="fecha" min="${new Date().toISOString().slice(0, 10)}"></div><div class="col-12"><label class="form-label">Motivo de la solicitud</label><textarea class="form-control" name="justificacion" rows="3" placeholder="Describe la práctica, actividad o necesidad de formación…" required></textarea></div></div><hr><div class="section-heading compact"><h4>Artículos solicitados</h4></div><div class="row g-2 align-items-end"><div class="col-md-7"><label class="form-label">Artículo</label><select class="form-select" id="reqItem"><option value="">Primero selecciona bodega</option></select></div><div class="col-md-3"><label class="form-label">Cantidad</label><input class="form-control" id="reqQty" type="number" min="0.01" step="0.01" value="1"></div><div class="col-md-2"><button class="btn btn-outline-success w-100" id="addReqItem" type="button">Agregar</button></div></div><div class="table-responsive mt-3"><table class="table" id="reqItemsTable"><thead><tr><th>Artículo</th><th>Cantidad</th><th></th></tr></thead><tbody><tr><td colspan="3" class="text-muted">Aún no agregas artículos.</td></tr></tbody></table></div><button class="btn btn-main mt-2">Enviar solicitud</button></form></div>`;
      $content.html(html); let picked = [];
      $('#reqWarehouse').on('change', function () { const wid = Number($(this).val()); const items = catalogs.items.filter(i => Number(i.id_bodega_fk) === wid); $('#reqItem').html('<option value="">Selecciona artículo</option>' + items.map(i => `<option value="${i.id_item}">${esc(i.nombre)} · ${esc(i.unidad)}</option>`).join('')); });
      $('#addReqItem').on('click', function () { const id = Number($('#reqItem').val()), qty = Number($('#reqQty').val()); if (!id || qty <= 0) return toast('Selecciona artículo y cantidad válida.', true); const item = catalogs.items.find(i => Number(i.id_item) === id); const found = picked.find(p => p.id === id); if (found) found.cantidad += qty; else picked.push({ id, cantidad: qty, nombre: item.nombre, unidad: item.unidad }); renderPicked(); });
      function renderPicked() { const body = picked.length ? picked.map(p => `<tr><td>${esc(p.nombre)}</td><td>${p.cantidad} ${esc(p.unidad)}</td><td><button type="button" class="btn btn-sm btn-outline-danger remove-pick" data-id="${p.id}">Eliminar</button></td></tr>`).join('') : '<tr><td colspan="3" class="text-muted">Aún no agregas artículos.</td></tr>'; $('#reqItemsTable tbody').html(body); $('.remove-pick').on('click', function () { picked = picked.filter(p => p.id !== Number($(this).data('id'))); renderPicked(); }); }
      $('#requestForm').on('submit', function (e) { e.preventDefault(); if (!picked.length) return toast('Agrega al menos un artículo.', true); const data = {}; $(this).serializeArray().forEach(f => data[f.name] = f.value); data.items = picked.map(({ id, cantidad }) => ({ id, cantidad })); call('solicitudNueva', data).done(r => { toast(r.mensaje, !r.ok); if (r.ok) setView('solicitudes'); }); });
    });
  }

  function requests() {
    call('listSolicitudes').done(r => {
      if (!r.ok) return;
      $content.html(`<div class="section-heading"><div><h3>${role === 2 ? 'Mis solicitudes' : 'Solicitudes registradas'}</h3><p>Seguimiento del flujo de revisión, autorización y entrega.</p></div><button class="btn btn-outline-secondary" id="refreshReq">Actualizar</button></div><div class="request-list" id="requestList"></div>`);
      const rows = r.datos || []; if (!rows.length) { $('#requestList').html('<div class="empty-state">Todavía no hay solicitudes registradas.</div>'); return; }
      const cards = rows.map(s => {
        const details = (s.detalle || []).map(d => `<li>${esc(d.item)} — ${d.cantidad} ${esc(d.unidad)}</li>`).join(''); let actions = '';
        if ([1, 3].includes(role) && ['Pendiente', 'En revisión'].includes(s.estado)) actions = `<div class="request-actions"><button class="btn btn-sm btn-success decision" data-id="${s.id_solicitud}" data-decision="Aprobada">Autorizar</button><button class="btn btn-sm btn-outline-danger decision" data-id="${s.id_solicitud}" data-decision="Rechazada">Rechazar</button></div>`;
        if ([1, 4].includes(role) && s.estado === 'Aprobada') actions = `<div class="request-actions"><button class="btn btn-sm btn-main deliver" data-id="${s.id_solicitud}">Registrar entrega</button></div>`;
        return `<article class="request-card"><div class="request-top"><div><span class="request-code">${esc(s.codigo || 'Solicitud')}</span><h4>${esc(s.solicitante + ' ' + s.apellido)}</h4><small>${esc(s.programa_formacion || s.rol_solicitante)} · ${esc(s.bodega)}</small></div><span class="pill status-${s.estado.toLowerCase().replace(/ /g, '-').replace('ó','o')} ">${esc(s.estado)}</span></div><p class="request-reason">${esc(s.justificacion)}</p><ul class="request-detail">${details}</ul>${s.observacion_coordinador ? `<div class="request-note"><b>Observación:</b> ${esc(s.observacion_coordinador)}</div>` : ''}${s.fecha_requerida ? `<small class="text-muted">Fecha requerida: ${esc(s.fecha_requerida)}</small>` : ''}${actions}</article>`;
      }).join('');
      $('#requestList').html(cards); $('#refreshReq').on('click', requests);
      $('.decision').on('click', function () { const obs = prompt('Observación (opcional):') || ''; call('decisionSolicitud', { id: $(this).data('id'), decision: $(this).data('decision'), observacion: obs }).done(a => { toast(a.mensaje, !a.ok); if (a.ok) requests(); }); });
      $('.deliver').on('click', function () { if (!confirm('¿Confirmas la entrega? Se descontará del inventario el stock entregado.')) return; call('entregarSolicitud', { id: $(this).data('id') }).done(a => { toast(a.mensaje, !a.ok); if (a.ok) requests(); }); });
    });
  }
  function movements() {
    if (![1, 4].includes(role)) return;
    call('movimientos').done(r => { if (!r.ok) return; let html = `<div class="section-heading"><div><h3>Movimientos de inventario</h3><p>Historial reciente de entradas y salidas.</p></div><button class="btn btn-outline-secondary" id="refreshMov">Actualizar</button></div><div class="table-panel"><div class="table-responsive"><table class="table"><thead><tr><th>Fecha</th><th>Movimiento</th><th>Artículo</th><th>Cantidad</th><th>Detalle</th><th>Usuario</th></tr></thead><tbody>`;
      r.datos.forEach(m => { html += `<tr><td>${esc(m.fecha_movimiento)}</td><td><span class="pill ${m.tipo === 'Entrada' ? 'pill-ok' : 'pill-low'}">${esc(m.tipo)}</span></td><td>${esc(m.item)}</td><td>${Number(m.cantidad).toLocaleString('es-CO')}</td><td>${esc(m.detalle || '')}</td><td>${esc(m.usuario + ' ' + m.apellido)}</td></tr>`; });
      html += `</tbody></table></div></div>`; $content.html(html); $('#refreshMov').on('click', movements); });
  }
  $('#itemForm').on('submit', function (e) { e.preventDefault(); call('crearItem', $(this).serialize()).done(r => { toast(r.mensaje, !r.ok); if (r.ok) { bootstrap.Modal.getOrCreateInstance(document.getElementById('itemModal')).hide(); this.reset(); inventory(); } }); });
  loadCatalog().always(() => dashboard());
});
