/* ==========================================================================
   MUCHO · Tu pedido (carrito sin precios)
   Se carga en todas las páginas, después de data.js y main.js.
   - Guarda el pedido en el navegador (sobrevive al cambiar de página)
   - Suma el botón de la bolsa al header
   - Panel "Tu pedido": lista → datos → se envía armado por WhatsApp
   API para otras páginas: window.Pedido.agregar(), .cambiar(), .lineas(), .alCambiar(), .abrir()
   ========================================================================== */

(function () {
  const { tienda, local } = MUCHO;
  const CLAVE = 'mucho-pedido-v1';
  const productos = Object.fromEntries(tienda.productos.map((p) => [p.id, p]));

  /* ---------- Utilidades de texto ---------- */
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
  // Precio por unidad de venta, si el producto lo tiene
  function textoPrecio(producto) {
    if (typeof producto.precio !== 'number') return 'Precio a consultar';
    const sufijo = { docena: ' / docena', peso: ' / kg', unidad: '' }[producto.venta] || '';
    return formatoPrecio(producto.precio) + sufijo;
  }
  window.PedidoTexto = { formatoPeso, textoCantidad, textoVariante, textoPrecio, escapar };

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

  /* ---------- Panel "Tu pedido" ---------- */
  const $panel = document.createElement('dialog');
  $panel.className = 'pedido';
  $panel.setAttribute('aria-labelledby', 'pedido-titulo');
  $panel.innerHTML = `
    <div class="pedido__cabecera">
      <button type="button" class="pedido__volver" data-paso-ir="lista" hidden aria-label="Volver a la lista">←</button>
      <h2 id="pedido-titulo">Tu pedido</h2>
      <button type="button" class="ficha__cerrar pedido__cerrar" data-cerrar aria-label="Cerrar pedido">×</button>
    </div>

    <div class="pedido__paso" data-paso="lista">
      <div class="pedido__vacio" hidden>
        <p class="pedido__vacio-titulo">Todavía no agregaste nada.</p>
        <p>Café para casa y productos de la proveeduría, por docena, por kilo o por unidad.</p>
        <a class="btn btn--primario" href="tienda.html">Ir a la tienda</a>
      </div>
      <ul class="pedido__lineas"></ul>
      <div class="pedido__pie">
        <p class="pedido__nota">Sin precios en la web: te respondemos por WhatsApp con el precio del día y la disponibilidad.</p>
        <button type="button" class="btn btn--primario btn--ancho" data-paso-ir="datos">Continuar</button>
        <a class="pedido__seguir" href="tienda.html">Seguir agregando</a>
      </div>
    </div>

    <form class="pedido__paso pedido__form" data-paso="datos" hidden novalidate>
      <div class="pedido__resumen"></div>
      <div class="campo">
        <label for="pedido-nombre">Nombre</label>
        <input id="pedido-nombre" name="nombre" type="text" autocomplete="name" required>
      </div>
      <div class="campo">
        <label for="pedido-telefono">Teléfono</label>
        <input id="pedido-telefono" name="telefono" type="tel" autocomplete="tel" placeholder="Ej.: 11 5555-5555" required>
      </div>
      <fieldset class="campo pedido__elegir">
        <legend>Es para</legend>
        <label class="opcion-pill"><input type="radio" name="para" value="casa" checked><span>Mi casa</span></label>
        <label class="opcion-pill"><input type="radio" name="para" value="negocio"><span>Mi negocio</span></label>
      </fieldset>
      <div class="campo" data-si="para=negocio" hidden>
        <label for="pedido-negocio">Nombre del negocio <span class="campo__opcional">(opcional)</span></label>
        <input id="pedido-negocio" name="negocio" type="text" autocomplete="organization">
      </div>
      <fieldset class="campo pedido__elegir">
        <legend>Entrega</legend>
        <label class="opcion-pill"><input type="radio" name="entrega" value="retiro" checked><span>Retiro en el local</span></label>
        <label class="opcion-pill"><input type="radio" name="entrega" value="envio"><span>Envío</span></label>
      </fieldset>
      <div class="campo" data-si="entrega=envio" hidden>
        <label for="pedido-direccion">Dirección de entrega</label>
        <input id="pedido-direccion" name="direccion" type="text" autocomplete="street-address" placeholder="Calle, número y barrio">
        <small>Te confirmamos si llegamos a tu zona y el costo del envío.</small>
      </div>
      <div class="campo">
        <label for="pedido-fecha">Fecha preferida <span class="campo__opcional">(opcional)</span></label>
        <input id="pedido-fecha" name="fecha" type="date">
      </div>
      <div class="campo">
        <label for="pedido-comentarios">Comentarios <span class="campo__opcional">(opcional)</span></label>
        <textarea id="pedido-comentarios" name="comentarios" placeholder="Horario de retiro, factura, alguna aclaración…"></textarea>
      </div>
      <button class="btn btn--primario btn--ancho pedido__enviar" type="submit">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z"/></svg>
        Enviar pedido por WhatsApp
      </button>
    </form>

    <div class="pedido__paso pedido__listo" data-paso="enviado" hidden>
      <p class="pedido__listo-icono" aria-hidden="true">✓</p>
      <h3>Se abrió WhatsApp con tu pedido</h3>
      <p>Envialo desde ahí y te respondemos con el precio y la disponibilidad. Si no se abrió, <a href="#" class="pedido__reintentar" target="_blank" rel="noopener">tocá acá</a>.</p>
      <button type="button" class="btn btn--primario btn--ancho" data-vaciar>Empezar un pedido nuevo</button>
      <button type="button" class="pedido__seguir" data-paso-ir="lista">Volver a mi pedido</button>
    </div>`;
  document.body.appendChild($panel);

  const $lineas = $panel.querySelector('.pedido__lineas');
  const $vacio = $panel.querySelector('.pedido__vacio');
  const $pie = $panel.querySelector('.pedido__pie');
  const $form = $panel.querySelector('.pedido__form');
  const $volver = $panel.querySelector('.pedido__volver');
  const $titulo = $panel.querySelector('#pedido-titulo');

  // Fecha mínima: mañana
  const manana = new Date(Date.now() + 24 * 60 * 60 * 1000);
  $form.fecha.min = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`;

  function irAPaso(paso) {
    $panel.querySelectorAll('[data-paso]').forEach((el) => { el.hidden = el.dataset.paso !== paso; });
    $volver.hidden = paso !== 'datos';
    $titulo.textContent = paso === 'datos' ? 'Tus datos' : 'Tu pedido';
    if (paso === 'datos') pintarResumen();
    $panel.scrollTop = 0;
    const primero = $panel.querySelector(`[data-paso="${paso}"] input, [data-paso="${paso}"] button`);
    if (paso === 'datos' && primero) primero.focus();
  }

  function abrirPanel() {
    $aviso.classList.remove('visible');
    irAPaso('lista');
    pintarLineas();
    if (!$panel.open) $panel.showModal();
    document.documentElement.classList.add('pedido-abierto');
  }
  function cerrarPanel() { $panel.close(); }
  $panel.addEventListener('close', () => document.documentElement.classList.remove('pedido-abierto'));

  // Contador – n + (se usa también en la tienda)
  function contadorHTML(cantidad, etiqueta) {
    return `<div class="contador" data-contador>
      <button type="button" data-delta="-1" aria-label="Quitar uno de ${escapar(etiqueta)}">${cantidad === 1 ? '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>' : '–'}</button>
      <output aria-live="polite">${cantidad}</output>
      <button type="button" data-delta="1" aria-label="Sumar uno de ${escapar(etiqueta)}">+</button>
    </div>`;
  }
  window.contadorHTML = contadorHTML;

  function pintarLineas() {
    const hay = lineas.length > 0;
    $vacio.hidden = hay;
    $pie.hidden = !hay;
    $lineas.innerHTML = lineas.map((l, i) => {
      const p = productos[l.id];
      const variante = textoVariante(p, l);
      const [una, varias] = { docena: ['docena', 'docenas'], peso: ['bolsa', 'bolsas'], unidad: ['unidad', 'unidades'] }[p.venta];
      return `<li class="pedido-linea" data-i="${i}">
        <div class="pedido-linea__foto">${fotoHTML(p.foto, p.nombre, '', p.fotoPosicion)}</div>
        <div class="pedido-linea__info">
          <p class="pedido-linea__nombre">${escapar(p.nombre)}</p>
          ${variante ? `<p class="pedido-linea__variante">${escapar(variante)}</p>` : ''}
          <div class="pedido-linea__pie">
            ${contadorHTML(l.cantidad, p.nombre)}
            <span class="pedido-linea__unidad">${l.cantidad === 1 ? una : varias}</span>
          </div>
        </div>
      </li>`;
    }).join('');
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
    if (e.target === $panel || e.target.closest('[data-cerrar]')) return cerrarPanel();
    const ir = e.target.closest('[data-paso-ir]');
    if (ir) irAPaso(ir.dataset.pasoIr);
    if (e.target.closest('[data-vaciar]')) { Pedido.vaciar(); $form.reset(); mostrarCondicionales(); cerrarPanel(); }
  });

  // Campos que aparecen según una elección (negocio, dirección)
  function mostrarCondicionales() {
    $form.querySelectorAll('[data-si]').forEach((campo) => {
      const [nombre, valor] = campo.dataset.si.split('=');
      const visible = $form.elements[nombre].value === valor;
      campo.hidden = !visible;
      campo.querySelectorAll('input').forEach((input) => {
        if (input.name === 'direccion') input.required = visible;
      });
    });
  }
  $form.addEventListener('change', mostrarCondicionales);

  function agruparPorSeccion() {
    return tienda.secciones
      .map((s) => ({ seccion: s, items: lineas.filter((l) => productos[l.id].seccion === s.id) }))
      .filter((g) => g.items.length);
  }

  function pintarResumen() {
    const total = lineas.length;
    $panel.querySelector('.pedido__resumen').innerHTML = `
      <p class="pedido__resumen-titulo">${total === 1 ? '1 producto' : `${total} productos`} <button type="button" class="pedido__editar" data-paso-ir="lista">Editar</button></p>
      <ul>${lineas.map((l) => `<li>${escapar(productos[l.id].nombre)} <span>${escapar(textoCantidad(productos[l.id], l))}${l.opcion ? ' · ' + escapar(l.opcion) : ''}</span></li>`).join('')}</ul>`;
  }

  /* ---------- Mensaje de WhatsApp ---------- */
  function armarMensaje(datos) {
    const bloques = agruparPorSeccion().map(({ seccion, items }) =>
      [`*${seccion.nombre}*`, ...items.map((l) => {
        const p = productos[l.id];
        return `• ${p.nombre}: ${textoCantidad(p, l)}${l.opcion ? ` · ${l.opcion}` : ''}`;
      })].join('\n'));

    const fecha = datos.get('fecha')
      ? new Date(datos.get('fecha') + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
      : '';
    const entrega = datos.get('entrega') === 'envio'
      ? `Envío a ${datos.get('direccion')}`
      : `Retiro en el local (${local.direccion})`;
    const para = datos.get('para') === 'negocio'
      ? `Mi negocio${datos.get('negocio') ? ` (${datos.get('negocio')})` : ''}`
      : 'Mi casa';

    return [
      'Hola MUCHO, quiero hacer este pedido. ¿Me pasan precio y disponibilidad?',
      '',
      bloques.join('\n\n'),
      '',
      `Entrega: ${entrega}`,
      fecha ? `Fecha preferida: ${fecha}` : null,
      `Es para: ${para}`,
      `Nombre: ${datos.get('nombre')}`,
      `Teléfono: ${datos.get('telefono')}`,
      datos.get('comentarios') ? `Comentarios: ${datos.get('comentarios')}` : null
    ].filter((linea) => linea !== null).join('\n');
  }

  $form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!lineas.length) return irAPaso('lista');
    if (!$form.checkValidity()) { $form.reportValidity(); return; }
    const url = `https://wa.me/${tienda.whatsapp || local.whatsapp}?text=${encodeURIComponent(armarMensaje(new FormData($form)))}`;
    $panel.querySelector('.pedido__reintentar').href = url;
    window.open(url, '_blank', 'noopener');
    irAPaso('enviado');
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
    if ($panel.open && !$panel.querySelector('[data-paso="lista"]').hidden) pintarLineas();
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
