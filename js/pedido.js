/* ==========================================================================
   MUCHO · Tu pedido (carrito sin precios)
   Se carga en todas las páginas, después de data.js y main.js.
   - Guarda el pedido en el navegador (sobrevive al cambiar de página)
   - Suma el botón de la bolsa al header
   - Panel "Tu pedido": vista rápida que lleva al checkout (carrito → pago → confirmación)
   API para otras páginas: window.Pedido.agregar(), .cambiar(), .lineas(), .alCambiar(), .abrir()
   ========================================================================== */

(function () {
  const { tienda, local } = MUCHO;
  const CLAVE = 'mucho-pedido-v1';
  const productos = Object.fromEntries(tienda.productos.map((p) => [p.id, p]));

  /* ---------- Utilidades de texto ---------- */
  const enCheckout = /\/(carrito|pago|confirmacion)\.html$/.test(location.pathname);
  const formatoPeso = (g) => (g >= 1000 ? `${(g / 1000).toLocaleString('es-AR')} kg` : `${g} g`);
  const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // "3 docenas", "1 unidad", "2 × 500 g"
  function textoCantidad(producto, linea) {
    const n = linea.cantidad;
    if (producto.venta === 'docena') return n === 1 ? '1 docena' : `${n} docenas`;
    if (producto.venta === 'peso') return n === 1 ? formatoPeso(linea.peso) : `${n} × ${formatoPeso(linea.peso)}`;
    return n === 1 ? '1 unidad' : `${n} unidades`;
  }
  // "500 g · Espresso" (lo que diferencia una línea de otra del mismo producto)
  function textoVariante(producto, linea) {
    return [producto.venta === 'peso' ? formatoPeso(linea.peso) : '', linea.opcion || ''].filter(Boolean).join(' · ');
  }
  // Precio de una unidad de venta (una docena, una unidad, una bolsa del tamaño elegido)
  function precioUnitario(producto, peso) {
    if (producto.preciosPorPeso) return producto.preciosPorPeso[peso || producto.pesos[0]] ?? null;
    return typeof producto.precio === 'number' ? producto.precio : null;
  }
  const subtotalLinea = (l) => { const u = precioUnitario(productos[l.id], l.peso); return u === null ? null : u * l.cantidad; };
  // Total estimado: null si algún producto no tiene precio
  const totalPedido = () => lineas.reduce((t, l) => (t === null || subtotalLinea(l) === null ? null : t + subtotalLinea(l)), 0);
  // Texto de precio para la tarjeta: "$36.000 la docena", "$450 c/u", "Desde $36.000"
  function textoPrecio(producto) {
    if (producto.preciosPorPeso) return `Desde ${formatoPrecio(Math.min(...Object.values(producto.preciosPorPeso)))}`;
    if (typeof producto.precio !== 'number') return 'Precio a consultar';
    const sufijo = producto.venta === 'docena' ? ' la docena' : producto.contenido === 'Por unidad' ? ' c/u' : '';
    return formatoPrecio(producto.precio) + sufijo;
  }
  const tienePrecio = (producto) => !!producto.preciosPorPeso || typeof producto.precio === 'number';
  window.PedidoTexto = { formatoPeso, textoCantidad, textoVariante, textoPrecio, precioUnitario, tienePrecio, escapar };

  /* ---------- Estado (con localStorage protegido: puede no estar disponible) ---------- */
  const claveLinea = (l) => [l.id, l.peso || '', l.opcion || ''].join('|');

  function leer() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE) || '[]');
      // Descarta productos que ya no están en el catálogo o datos rotos
      return Array.isArray(datos)
        ? datos.filter((l) => productos[l.id] && Number.isInteger(l.cantidad) && l.cantidad > 0)
        : [];
    } catch (e) { return []; }
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(lineas)); } catch (e) { /* sin almacenamiento: el pedido vive mientras la página esté abierta */ }
  }

  let lineas = leer();
  const oyentes = [];
  function avisar() { guardar(); oyentes.forEach((fn) => fn(lineas)); }

  const Pedido = {
    lineas: () => lineas.slice(),
    cantidadDe: (l) => (lineas.find((x) => claveLinea(x) === claveLinea(l)) || {}).cantidad || 0,
    agregar(linea) {
      const existente = lineas.find((x) => claveLinea(x) === claveLinea(linea));
      if (existente) existente.cantidad = Math.min(999, existente.cantidad + linea.cantidad);
      else lineas.push({ id: linea.id, peso: linea.peso || null, opcion: linea.opcion || null, cantidad: linea.cantidad });
      avisar();
      mostrarAviso(productos[linea.id].nombre);
    },
    // Fija la cantidad exacta de una línea (0 la quita)
    cambiar(linea, cantidad) {
      const i = lineas.findIndex((x) => claveLinea(x) === claveLinea(linea));
      if (cantidad <= 0) { if (i > -1) lineas.splice(i, 1); }
      else if (i > -1) lineas[i].cantidad = Math.min(999, cantidad);
      else lineas.push({ id: linea.id, peso: linea.peso || null, opcion: linea.opcion || null, cantidad });
      avisar();
    },
    // Vuelve a poner una línea quitada en su lugar (para "Deshacer")
    restaurar(linea, indice) {
      if (lineas.some((x) => claveLinea(x) === claveLinea(linea))) return;
      lineas.splice(Math.min(indice, lineas.length), 0, { ...linea });
      avisar();
    },
    subtotal: (l) => subtotalLinea(l),
    total: () => totalPedido(),
    // Horas de anticipación que exige el pedido (las tortas por encargo piden 48 h)
    anticipacion: () => Math.max(0, ...lineas.map((l) => productos[l.id].anticipacionHoras || 0)),
    producto: (id) => productos[id],
    vaciar() { lineas = []; avisar(); },
    alCambiar(fn) { oyentes.push(fn); },
    abrir: () => abrirPanel()
  };
  window.Pedido = Pedido;

  // Si el pedido cambia en otra pestaña, se actualiza acá también
  window.addEventListener('storage', (e) => { if (e.key === CLAVE) { lineas = leer(); oyentes.forEach((fn) => fn(lineas)); } });

  /* ---------- Botón de la bolsa en el header ---------- */
  const ICONO_BOLSA = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 8h13l-1 12.5h-11z"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5"/></svg>';
  const $acciones = document.querySelector('.header__acciones');
  let $botonHeader = null;
  if ($acciones) {
    $botonHeader = document.createElement('button');
    $botonHeader.type = 'button';
    $botonHeader.className = 'header__pedido';
    $botonHeader.innerHTML = `${ICONO_BOLSA}<span class="header__pedido-cuenta" aria-hidden="true"></span>`;
    $acciones.insertBefore($botonHeader, $acciones.querySelector('.header__toggle'));
    $botonHeader.addEventListener('click', () => abrirPanel());
  }

  /* ---------- Aviso breve al agregar ---------- */
  const $aviso = document.createElement('div');
  $aviso.className = 'pedido-aviso';
  $aviso.setAttribute('role', 'status');
  $aviso.innerHTML = '<span class="pedido-aviso__texto"></span><button type="button" class="pedido-aviso__ver">Ver pedido</button>';
  document.body.appendChild($aviso);
  $aviso.querySelector('button').addEventListener('click', () => abrirPanel());
  let temporizador;
  function mostrarAviso(nombre) {
    $aviso.querySelector('.pedido-aviso__texto').textContent = `${nombre}: agregado a tu pedido`;
    $aviso.classList.add('visible');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => $aviso.classList.remove('visible'), 3200);
    if ($botonHeader) { $botonHeader.classList.remove('rebote'); void $botonHeader.offsetWidth; $botonHeader.classList.add('rebote'); }
  }

  /* ---------- Panel "Tu pedido" (vista rápida; el checkout está en carrito.html → pago.html) ---------- */
  const $panel = document.createElement('dialog');
  $panel.className = 'pedido';
  $panel.setAttribute('aria-labelledby', 'pedido-titulo');
  $panel.innerHTML = `
    <div class="pedido__cabecera">
      <h2 id="pedido-titulo">Tu pedido</h2>
      <button type="button" class="ficha__cerrar pedido__cerrar" data-cerrar aria-label="Cerrar pedido">×</button>
    </div>
    <div class="pedido__paso">
      <div class="pedido__vacio" hidden>
        <p class="pedido__vacio-titulo">Todavía no agregaste nada.</p>
        <p>Café para casa, productos de la proveeduría y tortas por encargo.</p>
        <a class="btn btn--primario" href="tienda.html">Ir a la tienda</a>
      </div>
      <ul class="pedido__lineas"></ul>
      <div class="pedido__pie">
        <p class="pedido__total"><span>Subtotal</span> <strong data-total></strong></p>
        <p class="pedido__nota">El envío y el medio de pago los elegís en el próximo paso.</p>
        <a class="btn btn--primario btn--ancho" href="carrito.html">Ir al carrito</a>
        <a class="pedido__seguir" href="tienda.html">Seguir agregando</a>
      </div>
    </div>`;
  document.body.appendChild($panel);

  const $lineas = $panel.querySelector('.pedido__lineas');
  const $vacio = $panel.querySelector('.pedido__vacio');
  const $pie = $panel.querySelector('.pedido__pie');

  function abrirPanel() {
    // En el checkout la bolsa lleva directo al carrito
    if (enCheckout) { location.href = 'carrito.html'; return; }
    $aviso.classList.remove('visible');
    pintarLineas();
    if (!$panel.open) $panel.showModal();
    document.documentElement.classList.add('pedido-abierto');
  }
  function cerrarPanel() { $panel.close(); }
  $panel.addEventListener('close', () => document.documentElement.classList.remove('pedido-abierto'));

  // Contador – n + (se usa también en la tienda y en el carrito)
  function contadorHTML(cantidad, etiqueta) {
    return `<div class="contador" data-contador>
      <button type="button" data-delta="-1" aria-label="Quitar uno de ${escapar(etiqueta)}">${cantidad === 1 ? '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>' : '–'}</button>
      <output aria-live="polite">${cantidad}</output>
      <button type="button" data-delta="1" aria-label="Sumar uno de ${escapar(etiqueta)}">+</button>
    </div>`;
  }
  window.contadorHTML = contadorHTML;

  const unidadTexto = (p, n) => {
    const [una, varias] = { docena: ['docena', 'docenas'], peso: ['bolsa', 'bolsas'], unidad: ['unidad', 'unidades'] }[p.venta];
    return n === 1 ? una : varias;
  };
  window.PedidoTexto.unidadTexto = unidadTexto;

  function pintarLineas() {
    const hay = lineas.length > 0;
    $vacio.hidden = hay;
    $pie.hidden = !hay;
    $lineas.innerHTML = lineas.map((l, i) => {
      const p = productos[l.id];
      const variante = textoVariante(p, l);
      return `<li class="pedido-linea" data-i="${i}">
        <div class="pedido-linea__foto">${fotoHTML(p.foto, p.nombre, '', p.fotoPosicion)}</div>
        <div class="pedido-linea__info">
          <p class="pedido-linea__nombre">${escapar(p.nombre)}</p>
          ${variante ? `<p class="pedido-linea__variante">${escapar(variante)}</p>` : ''}
          <div class="pedido-linea__pie">
            ${contadorHTML(l.cantidad, p.nombre)}
            <span class="pedido-linea__unidad">${unidadTexto(p, l.cantidad)}</span>
            ${subtotalLinea(l) !== null ? `<span class="pedido-linea__precio precio">${formatoPrecio(subtotalLinea(l))}</span>` : ''}
          </div>
        </div>
      </li>`;
    }).join('');
    const total = totalPedido();
    $panel.querySelector('.pedido__total').hidden = !hay || total === null;
    if (total !== null) $panel.querySelector('[data-total]').textContent = formatoPrecio(total);
  }

  $lineas.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-delta]');
    if (!btn) return;
    const i = Number(btn.closest('[data-i]').dataset.i);
    const linea = lineas[i];
    Pedido.cambiar(linea, linea.cantidad + Number(btn.dataset.delta));
    pintarLineas();
    // Mantiene el foco en un control equivalente después de repintar
    const misma = $lineas.querySelector(`[data-i="${Math.min(i, lineas.length - 1)}"] [data-delta="${btn.dataset.delta}"]`);
    if (misma) misma.focus();
    else if (!lineas.length) $panel.querySelector('.pedido__vacio a').focus();
  });

  $panel.addEventListener('click', (e) => {
    if (e.target === $panel || e.target.closest('[data-cerrar]')) cerrarPanel();
  });

  /* ---------- Contadores visibles ---------- */
  function actualizarContadores() {
    const n = lineas.length;
    if ($botonHeader) {
      $botonHeader.querySelector('.header__pedido-cuenta').textContent = n || '';
      $botonHeader.classList.toggle('tiene', n > 0);
      $botonHeader.setAttribute('aria-label', n ? `Tu pedido: ${n === 1 ? '1 producto' : `${n} productos`}` : 'Tu pedido: vacío');
    }
    document.querySelectorAll('[data-pedido-cuenta]').forEach((el) => { el.textContent = n === 1 ? '1 producto' : `${n} productos`; });
    document.body.classList.toggle('con-pedido', n > 0);
    if ($panel.open) pintarLineas();
  }
  Pedido.alCambiar(actualizarContadores);
  actualizarContadores();

  // Cualquier enlace o botón con data-abrir-pedido abre el panel
  document.addEventListener('click', (e) => {
    const disparador = e.target.closest('[data-abrir-pedido]');
    if (disparador) { e.preventDefault(); abrirPanel(); }
  });
  // tienda.html#pedido abre el panel al cargar
  if (location.hash === '#pedido') abrirPanel();
})();
