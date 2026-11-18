/* ==========================================================================
   MUCHO · Tienda
   Pestañas (café para casa / proveeduría), tarjetas de producto y ficha
   para elegir peso, molienda y cantidad. El pedido lo maneja pedido.js.
   ========================================================================== */

(function () {
  const { secciones, productos } = MUCHO.tienda;
  const { formatoPeso, textoPrecio, escapar } = window.PedidoTexto;
  const $tabs = document.getElementById('tienda-tabs');
  const $paneles = document.getElementById('tienda-paneles');
  const $ficha = document.getElementById('ficha-producto');
  const $fichaCuerpo = document.getElementById('ficha-producto-cuerpo');

  // Un producto se agrega directo desde la tarjeta si no hay nada que elegir
  const necesitaFicha = (p) => (p.venta === 'peso' && p.pesos.length > 1) || !!p.opciones;
  const lineaSimple = (p) => ({ id: p.id, peso: p.venta === 'peso' ? p.pesos[0] : null, opcion: null });
  const etiquetaVenta = (p) => ({ docena: 'Por docena', peso: 'Por peso', unidad: 'Por unidad' }[p.venta]);

  /* ---------- Pestañas ---------- */
  $tabs.innerHTML = secciones.map((s) => `
    <button type="button" role="tab" id="tab-${s.id}" aria-controls="panel-${s.id}" data-seccion="${s.id}">${s.nombre}</button>`).join('');

  /* ---------- Paneles con tarjetas ---------- */
  $paneles.innerHTML = secciones.map((s) => {
    const items = productos.filter((p) => p.seccion === s.id);
    return `<section class="tienda-panel" role="tabpanel" id="panel-${s.id}" aria-labelledby="tab-${s.id}" tabindex="-1">
      <p class="tienda-panel__bajada">${s.bajada}</p>
      <ul class="grilla-platos grilla-productos">${items.map(tarjetaHTML).join('')}</ul>
    </section>`;
  }).join('');

  function tarjetaHTML(p) {
    const badge = p.estado === 'nuevo' ? '<span class="badge badge--nuevo">Nuevo</span>' : '';
    return `<li>
      <article class="plato-card producto-card" data-producto="${p.id}">
        <div class="plato-card__foto">${fotoHTML(p.foto, p.nombre, '', p.fotoPosicion, p.fotoZoom)}${badge}</div>
        <div class="plato-card__cuerpo">
          <p class="producto-card__contenido">${escapar(p.contenido)}</p>
          <h3 class="plato-card__nombre"><button type="button" class="plato-card__abrir" data-abrir="${p.id}">${escapar(p.nombre)}</button></h3>
          <p class="plato-card__desc">${escapar(p.descripcion)}</p>
          ${p.ejemplo ? '<p class="producto-card__ejemplo">Producto de ejemplo</p>' : ''}
          <div class="plato-card__pie">
            <span class="producto-card__precio ${typeof p.precio === 'number' ? 'precio' : ''}">${textoPrecio(p)}</span>
            <div class="producto-card__accion" data-accion="${p.id}"></div>
          </div>
        </div>
      </article>
    </li>`;
  }

  // El botón de la tarjeta: "Agregar", "Elegir" o el contador si ya está en el pedido
  function pintarAcciones() {
    document.querySelectorAll('[data-accion]').forEach((el) => {
      const p = productos.find((x) => x.id === el.dataset.accion);
      if (necesitaFicha(p)) {
        const enPedido = Pedido.lineas().filter((l) => l.id === p.id).length;
        el.innerHTML = `<button type="button" class="btn btn--chico ${enPedido ? '' : 'btn--primario'}" data-abrir="${p.id}">${enPedido ? `En tu pedido · ${enPedido}` : 'Elegir'}</button>`;
        return;
      }
      const cantidad = Pedido.cantidadDe(lineaSimple(p));
      el.innerHTML = cantidad
        ? contadorHTML(cantidad, p.nombre)
        : `<button type="button" class="btn btn--chico btn--primario" data-agregar="${p.id}">Agregar</button>`;
    });
  }

  $paneles.addEventListener('click', (e) => {
    const agregar = e.target.closest('[data-agregar]');
    const abrir = e.target.closest('[data-abrir]');
    const delta = e.target.closest('[data-delta]');
    if (agregar) {
      const p = productos.find((x) => x.id === agregar.dataset.agregar);
      Pedido.agregar({ ...lineaSimple(p), cantidad: 1 });
      document.querySelector(`[data-accion="${p.id}"] [data-delta="1"]`)?.focus();
    } else if (delta) {
      const p = productos.find((x) => x.id === delta.closest('[data-accion]').dataset.accion);
      const linea = lineaSimple(p);
      Pedido.cambiar(linea, Pedido.cantidadDe(linea) + Number(delta.dataset.delta));
      const destino = document.querySelector(`[data-accion="${p.id}"] [data-delta="${delta.dataset.delta}"]`) || document.querySelector(`[data-accion="${p.id}"] button`);
      destino?.focus();
    } else if (abrir) {
      const p = productos.find((x) => x.id === abrir.dataset.abrir);
      // Productos simples: el nombre también abre la ficha para ver la foto grande
      abrirFicha(p);
    }
  });

  /* ---------- Cambio de pestaña ---------- */
  function mostrarSeccion(id, conFoco) {
    $tabs.querySelectorAll('[role="tab"]').forEach((t) => {
      const activa = t.dataset.seccion === id;
      t.setAttribute('aria-selected', String(activa));
      t.tabIndex = activa ? 0 : -1;
      if (activa && conFoco) t.focus();
    });
    $paneles.querySelectorAll('[role="tabpanel"]').forEach((p) => { p.hidden = p.id !== `panel-${id}`; });
    const url = new URL(location.href);
    url.searchParams.set('seccion', id);
    history.replaceState(null, '', url);
  }
  $tabs.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t) mostrarSeccion(t.dataset.seccion); });
  // Flechas del teclado entre pestañas
  $tabs.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const ids = secciones.map((s) => s.id);
    const actual = ids.indexOf(document.activeElement.dataset.seccion);
    const siguiente = ids[(actual + (e.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length];
    mostrarSeccion(siguiente, true);
  });

  /* ---------- Ficha de producto ---------- */
  function abrirFicha(p) {
    const pesos = p.venta === 'peso' ? p.pesos : [];
    $fichaCuerpo.innerHTML = `
      <div class="ficha__foto">${fotoHTML(p.foto, p.nombre, '', p.fotoPosicion, p.fotoZoom)}</div>
      <form class="ficha__info ficha-producto__form">
        <p class="ficha__categoria">${secciones.find((s) => s.id === p.seccion).nombre}</p>
        <h2 class="ficha__nombre" id="ficha-producto-titulo">${escapar(p.nombre)}</h2>
        <p class="producto-card__contenido">${escapar(p.contenido)}</p>
        <p class="ficha__desc">${escapar(p.descripcion)}</p>
        <p class="ficha-producto__precio ${typeof p.precio === 'number' ? 'precio' : ''}">${textoPrecio(p)}</p>
        ${p.ejemplo ? '<p class="producto-card__ejemplo">Producto de ejemplo: foto, nombre y descripción provisorios</p>' : ''}
        ${pesos.length > 1 ? `<fieldset class="ficha-producto__grupo">
            <legend>Tamaño</legend>
            ${pesos.map((g, i) => `<label class="opcion-pill"><input type="radio" name="peso" value="${g}" ${i === 0 ? 'checked' : ''}><span>${formatoPeso(g)}</span></label>`).join('')}
          </fieldset>` : ''}
        ${p.opciones ? `<fieldset class="ficha-producto__grupo">
            <legend>${escapar(p.opciones.nombre)}</legend>
            ${p.opciones.valores.map((v, i) => `<label class="opcion-pill"><input type="radio" name="opcion" value="${escapar(v)}" ${i === 0 ? 'checked' : ''}><span>${escapar(v)}</span></label>`).join('')}
          </fieldset>` : ''}
        <div class="ficha-producto__comprar">
          <div class="ficha-producto__cantidad">
            <span class="ficha-producto__etiqueta">${{ docena: 'Docenas', peso: 'Bolsas', unidad: 'Cantidad' }[p.venta]}</span>
            <div class="contador">
              <button type="button" data-paso="-1" aria-label="Quitar uno">–</button>
              <output name="cantidad" aria-live="polite">1</output>
              <button type="button" data-paso="1" aria-label="Sumar uno">+</button>
            </div>
          </div>
          <button type="submit" class="btn btn--primario btn--ancho">Agregar al pedido</button>
        </div>
      </form>`;

    const $form = $fichaCuerpo.querySelector('form');
    const $cantidad = $form.querySelector('output');
    $form.addEventListener('click', (e) => {
      const b = e.target.closest('[data-paso]');
      if (b) $cantidad.value = Math.max(1, Math.min(99, Number($cantidad.value) + Number(b.dataset.paso)));
    });
    $form.addEventListener('submit', (e) => {
      e.preventDefault();
      const datos = new FormData($form);
      Pedido.agregar({
        id: p.id,
        peso: p.venta === 'peso' ? Number(datos.get('peso') || p.pesos[0]) : null,
        opcion: datos.get('opcion') || null,
        cantidad: Number($cantidad.value)
      });
      $ficha.close();
    });

    if (!$ficha.open) $ficha.showModal();
    $ficha.querySelector('.ficha__cerrar').focus();
  }
  $ficha.addEventListener('click', (e) => {
    if (e.target === $ficha || e.target.closest('[data-cerrar]')) $ficha.close();
  });

  /* ---------- Inicio ---------- */
  const pedida = new URLSearchParams(location.search).get('seccion');
  mostrarSeccion(secciones.some((s) => s.id === pedida) ? pedida : secciones[0].id);
  Pedido.alCambiar(pintarAcciones);
  pintarAcciones();
})();
