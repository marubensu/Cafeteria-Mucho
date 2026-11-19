/* ==========================================================================
   MUCHO · Checkout: Carrito → Pago → Confirmación
   Se carga en carrito.html, pago.html y confirmacion.html (después de pedido.js).
   - El pedido (productos) lo guarda pedido.js
   - Los datos del checkout (entrega, contacto, medio de pago) se guardan en
     sessionStorage: duran mientras la pestaña esté abierta
   - Los datos de la tarjeta quedan SOLO en memoria: nunca se guardan
   ========================================================================== */

(function () {
  const config = MUCHO.tienda.checkout;
  const { local } = MUCHO;
  const { textoVariante, textoCantidad, unidadTexto, escapar } = window.PedidoTexto;
  const paso = document.body.dataset.checkout; // 'carrito' | 'pago' | 'confirmacion'
  const $ = (s, raiz = document) => raiz.querySelector(s);
  const demo = config.modoPago === 'demo';

  /* ---------- Estado del checkout ---------- */
  const CLAVE = 'mucho-checkout-v1';
  const CLAVE_ULTIMO = 'mucho-ultimo-pedido-v1';
  const leerSesion = (clave, porDefecto) => { try { return JSON.parse(sessionStorage.getItem(clave)) || porDefecto; } catch (e) { return porDefecto; } };
  const guardarSesion = (clave, valor) => { try { sessionStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* sin almacenamiento */ } };

  let estado = leerSesion(CLAVE, {});
  estado = { modo: 'retiro', medioPago: 'tarjeta', ...estado };
  function actualizar(cambios) { estado = { ...estado, ...cambios }; guardarSesion(CLAVE, estado); }

  /* ---------- Resumen del pedido ---------- */
  function resumen() {
    const lineas = Pedido.lineas();
    const items = lineas.map((l, i) => {
      const p = Pedido.producto(l.id);
      return {
        i, linea: l, producto: p, nombre: p.nombre, foto: p.foto, fotoPosicion: p.fotoPosicion,
        variante: textoVariante(p, l), cantidadTexto: textoCantidad(p, l), subtotal: Pedido.subtotal(l) || 0
      };
    });
    const hayTortas = Pedido.anticipacion() > 0;
    // Las tortas por encargo se retiran en el local: con tortas no hay envío
    const modo = hayTortas ? 'retiro' : estado.modo;
    const subtotal = items.reduce((t, it) => t + it.subtotal, 0);
    const envio = modo === 'envio' ? config.envio.costo : 0;
    return { items, vacio: !items.length, hayTortas, modo, subtotal, envio, total: subtotal + envio };
  }

  /* ---------- Barra de pasos ---------- */
  function pintarPasos(actual) {
    const $pasos = $('#checkout-pasos');
    if (!$pasos) return;
    const nombres = ['Carrito', 'Pago', 'Confirmación'];
    $pasos.innerHTML = `<ol class="pasos-checkout">${nombres.map((n, i) => `
      <li class="${i < actual ? 'hecho' : ''} ${i === actual ? 'actual' : ''}" ${i === actual ? 'aria-current="step"' : ''}>
        <span class="pasos-checkout__numero">${i < actual ? '✓' : i + 1}</span><span>${n}</span>
      </li>`).join('')}</ol>`;
  }

  /* ---------- Aviso breve (toast) ---------- */
  let temporizadorAviso;
  function aviso(texto) {
    let $a = $('.checkout-aviso');
    if (!$a) {
      $a = document.createElement('div');
      $a.className = 'checkout-aviso';
      $a.setAttribute('role', 'status');
      document.body.appendChild($a);
    }
    $a.textContent = texto;
    $a.classList.add('visible');
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => $a.classList.remove('visible'), 3200);
  }

  const fotoChica = (it) => `<div class="checkout-item__foto">${fotoHTML(it.foto, it.nombre, '', it.fotoPosicion)}</div>`;

  /* ======================================================================
     PASO 1 · CARRITO
     ====================================================================== */
  function iniciarCarrito() {
    pintarPasos(0);
    let deshacer = null; // { linea, indice, nombre }

    function lista(r) {
      if (r.vacio) {
        return `<div class="checkout-vacio">
          <p class="checkout-vacio__titulo">Tu carrito está vacío.</p>
          <p>Café para casa, productos de la proveeduría y tortas por encargo.</p>
          <a class="btn btn--primario" href="tienda.html">Ir a la tienda</a>
        </div>`;
      }
      return `<ul class="checkout-items">${r.items.map((it) => `
        <li class="checkout-item" data-i="${it.i}">
          ${fotoChica(it)}
          <div class="checkout-item__cuerpo">
            <div class="checkout-item__fila">
              <p class="checkout-item__nombre">${escapar(it.nombre)}</p>
              <span class="checkout-item__subtotal precio">${formatoPrecio(it.subtotal)}</span>
            </div>
            ${it.variante ? `<p class="checkout-item__variante">${escapar(it.variante)}</p>` : ''}
            <div class="checkout-item__acciones">
              <button type="button" class="checkout-boton-texto" data-accion="eliminar">Eliminar</button>
              <div class="checkout-item__cantidad">${contadorHTML(it.linea.cantidad, it.nombre)}<span>${unidadTexto(it.producto, it.linea.cantidad)}</span></div>
            </div>
          </div>
        </li>`).join('')}</ul>`;
    }

    function panel(r) {
      const retiro = r.modo === 'retiro';
      return `<h2 class="checkout-panel__titulo">¿Cómo lo recibís?</h2>
        <button type="button" class="tarjeta-radio ${retiro ? 'activa' : ''}" data-accion="modo" data-valor="retiro" aria-pressed="${retiro}">
          <span class="tarjeta-radio__punto" aria-hidden="true"></span>
          <span class="tarjeta-radio__texto"><span class="tarjeta-radio__titulo">Retiro en el local</span><span class="tarjeta-radio__detalle">${config.retiro.detalle}</span></span>
        </button>
        <button type="button" class="tarjeta-radio ${!retiro ? 'activa' : ''}" data-accion="modo" data-valor="envio" aria-pressed="${!retiro}" ${r.hayTortas ? 'aria-disabled="true"' : ''}>
          <span class="tarjeta-radio__punto" aria-hidden="true"></span>
          <span class="tarjeta-radio__texto"><span class="tarjeta-radio__titulo">Envío a domicilio</span><span class="tarjeta-radio__detalle">${config.envio.detalle} · ${formatoPrecio(config.envio.costo)}</span></span>
        </button>
        ${r.hayTortas ? '<p class="checkout-panel__ayuda">Las tortas por encargo se retiran en el local, así que este pedido es con retiro.</p>' : !retiro ? '<p class="checkout-panel__ayuda">Indicás la dirección en el próximo paso.</p>' : ''}
        <div class="checkout-lineas">
          <div class="checkout-fila"><span>Subtotal</span><span>${formatoPrecio(r.subtotal)}</span></div>
          <div class="checkout-fila"><span>Envío</span><span>${r.envio ? formatoPrecio(r.envio) : 'Sin costo'}</span></div>
        </div>
        <div class="checkout-total"><span>Total a pagar</span><strong>${formatoPrecio(r.total)}</strong></div>
        <button type="button" class="btn btn--primario btn--ancho checkout-cta" data-accion="ir-pago" ${r.vacio ? 'aria-disabled="true"' : ''}>Continuar al pago →</button>`;
    }

    function dibujar() {
      const r = resumen();
      $('#carrito-lista').innerHTML = lista(r) + (deshacer ? `
        <div class="checkout-deshacer" role="status"><span>Eliminaste ${escapar(deshacer.nombre)}</span><button type="button" data-accion="deshacer">Deshacer</button></div>` : '');
      $('#carrito-panel').innerHTML = panel(r);
      $('#carrito-panel').hidden = r.vacio && !deshacer;
    }

    document.querySelector('main').addEventListener('click', (e) => {
      const el = e.target.closest('[data-accion], [data-delta]');
      if (!el) return;
      const $item = el.closest('[data-i]');
      const item = $item ? resumen().items[Number($item.dataset.i)] : null;
      if (el.dataset.delta && item) {
        const nueva = item.linea.cantidad + Number(el.dataset.delta);
        if (nueva <= 0) { deshacer = { linea: item.linea, indice: item.i, nombre: item.nombre }; }
        Pedido.cambiar(item.linea, nueva);
        return;
      }
      switch (el.dataset.accion) {
        case 'eliminar':
          deshacer = { linea: item.linea, indice: item.i, nombre: item.nombre };
          Pedido.cambiar(item.linea, 0);
          break;
        case 'deshacer':
          Pedido.restaurar(deshacer.linea, deshacer.indice);
          deshacer = null;
          dibujar();
          break;
        case 'modo':
          if (el.getAttribute('aria-disabled') === 'true') { aviso('Con tortas por encargo, el pedido se retira en el local'); return; }
          actualizar({ modo: el.dataset.valor });
          dibujar();
          break;
        case 'ir-pago':
          if (resumen().vacio) { aviso('Agregá al menos un producto para continuar'); return; }
          location.href = 'pago.html';
          break;
      }
    });

    Pedido.alCambiar(dibujar);
    dibujar();
  }

  /* ======================================================================
     Validación (mensajes claros, como en el formulario de referencia)
     ====================================================================== */
  const soloDigitos = (v) => String(v || '').replace(/\D/g, '');
  const esAmex = (numero) => /^3[47]/.test(soloDigitos(numero));
  // Dígito verificador de las tarjetas (algoritmo de Luhn)
  function cumpleLuhn(digitos) {
    let suma = 0;
    for (let i = 0; i < digitos.length; i++) {
      let d = Number(digitos[digitos.length - 1 - i]);
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
      suma += d;
    }
    return digitos.length > 0 && suma % 10 === 0;
  }

  const reglas = {
    requerido: (mensaje) => (v) => (String(v || '').trim() ? '' : mensaje),
    nombreCompleto: () => (v) => (String(v).trim().split(/\s+/).length >= 2 ? '' : 'Escribí nombre y apellido.'),
    email: () => (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? '' : 'Revisá el email: tiene que ser como nombre@mail.com.'),
    telefono: () => (v) => { const d = soloDigitos(v); return d.length >= 10 && d.length <= 13 ? '' : 'Ingresá un teléfono con código de área, por ejemplo 11 5555 5555.'; },
    direccion: () => (v) => (/\d/.test(v) && /[a-záéíóúñ]/i.test(v) ? '' : 'Escribí la calle y la altura, por ejemplo Conesa 2686.'),
    codigoPostal: () => (v) => (/^(\d{4}|[a-z]\d{4}[a-z]{3})$/i.test(String(v).trim()) ? '' : 'El código postal tiene 4 números (1430) o el formato C1430ABC.'),
    numeroTarjeta: () => (v) => {
      const d = soloDigitos(v);
      const largo = esAmex(d) ? 15 : 16;
      if (d.length !== largo) return `El número tiene que tener ${largo} dígitos.`;
      return cumpleLuhn(d) ? '' : 'El número de tarjeta no es válido. Revisá que esté bien copiado.';
    },
    vencimiento: () => (v) => {
      const m = String(v).match(/^(\d{2})\/(\d{2})$/);
      if (!m) return 'Usá el formato MM/AA, por ejemplo 08/28.';
      const mes = Number(m[1]); const anio = 2000 + Number(m[2]);
      if (mes < 1 || mes > 12) return 'El mes tiene que estar entre 01 y 12.';
      const hoy = new Date();
      const finDeMes = new Date(anio, mes, 0, 23, 59, 59);
      if (finDeMes < hoy) return 'La tarjeta está vencida.';
      if (anio > hoy.getFullYear() + 20) return 'Revisá el año de vencimiento.';
      return '';
    },
    codigoSeguridad: () => (v, form) => {
      const largo = esAmex(form.elements.tarjetaNumero?.value) ? 4 : 3;
      return new RegExp(`^\\d{${largo}}$`).test(String(v).trim()) ? '' : `El código tiene ${largo} números${largo === 4 ? ' (en American Express está en el frente)' : ' (está en el dorso)'}.`;
    },
    fechaMinima: (minISO, mensaje) => (v) => (!v || v >= minISO ? '' : mensaje)
  };

  // Formato mientras se escribe
  const mascaras = {
    tarjeta: (v) => {
      const d = soloDigitos(v).slice(0, esAmex(v) ? 15 : 16);
      return esAmex(d) ? [d.slice(0, 4), d.slice(4, 10), d.slice(10)].filter(Boolean).join(' ') : d.replace(/(\d{4})(?=\d)/g, '$1 ');
    },
    vencimiento: (v) => { const d = soloDigitos(v).slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; },
    codigo: (v) => soloDigitos(v).slice(0, 4),
    telefono: (v) => String(v).replace(/[^\d\s()+-]/g, '').slice(0, 20),
    cp: (v) => String(v).replace(/[^a-z\d]/gi, '').toUpperCase().slice(0, 8)
  };

  function marcarCampo(form, nombre, mensaje) {
    const input = form.elements[nombre];
    if (!input) return;
    const $campo = input.closest('.campo');
    let $error = $campo.querySelector('.campo__error');
    if (!$error) {
      $error = document.createElement('small');
      $error.className = 'campo__error';
      $error.id = `error-${nombre}`;
      $campo.appendChild($error);
    }
    $error.textContent = mensaje;
    $error.hidden = !mensaje;
    $campo.classList.toggle('campo--error', !!mensaje);
    input.setAttribute('aria-invalid', String(!!mensaje));
    const descritos = new Set((input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
    if (mensaje) descritos.add($error.id); else descritos.delete($error.id);
    if (descritos.size) input.setAttribute('aria-describedby', [...descritos].join(' ')); else input.removeAttribute('aria-describedby');
  }

  function validarCampo(form, esquema, nombre) {
    const input = form.elements[nombre];
    if (!input || !esquema[nombre]) return '';
    const valor = input.value;
    let mensaje = '';
    for (const regla of esquema[nombre]) {
      // Si el campo no es obligatorio y está vacío, no se valida el formato
      if (!String(valor).trim() && !esquema[nombre].obligatorio) break;
      mensaje = regla(valor, form);
      if (mensaje) break;
    }
    marcarCampo(form, nombre, mensaje);
    return mensaje;
  }

  /* ======================================================================
     PASO 2 · PAGO
     ====================================================================== */
  function iniciarPago() {
    if (resumen().vacio) { location.replace('carrito.html'); return; }
    pintarPasos(1);
    const form = $('#pago-form');
    const tarjeta = { tarjetaNumero: '', tarjetaVencimiento: '', tarjetaCodigo: '' }; // solo en memoria
    const GUARDADOS = ['nombre', 'email', 'telefono', 'negocio', 'direccion', 'cp', 'indicaciones', 'fecha'];
    const tocados = new Set();
    if (estado.modo === 'envio' && estado.medioPago === 'efectivo') actualizar({ medioPago: 'tarjeta' });

    const isoDesdeHoras = (h) => { const d = new Date(Date.now() + h * 3600 * 1000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const fechaMinima = () => isoDesdeHoras(Math.max(24, Pedido.anticipacion()));
    const textoFechaLarga = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

    // Las reglas dependen de la entrega, el medio de pago y si hay tortas
    function esquema() {
      const r = resumen();
      const obligatorio = (reglasCampo) => Object.assign(reglasCampo, { obligatorio: true });
      const e = {
        nombre: obligatorio([reglas.requerido('Ingresá tu nombre y apellido: así sabemos a nombre de quién va el pedido.'), reglas.nombreCompleto()]),
        email: obligatorio([reglas.requerido('Ingresá tu email: ahí te mandamos el comprobante.'), reglas.email()]),
        telefono: obligatorio([reglas.requerido('Ingresá un teléfono para avisarte si hay algún problema con el pedido.'), reglas.telefono()])
      };
      if (r.modo === 'envio') {
        e.direccion = obligatorio([reglas.requerido('Ingresá la calle y la altura donde llevamos el pedido.'), reglas.direccion()]);
        e.cp = obligatorio([reglas.requerido('Ingresá el código postal: con él confirmamos la zona de entrega.'), reglas.codigoPostal()]);
      }
      e.fecha = [reglas.fechaMinima(fechaMinima(), r.hayTortas ? `Las tortas necesitan al menos ${Pedido.anticipacion()} h: elegí una fecha desde el ${textoFechaLarga(fechaMinima())}.` : `Elegí una fecha desde el ${textoFechaLarga(fechaMinima())}.`)];
      if (r.hayTortas) e.fecha = obligatorio([reglas.requerido('Elegí la fecha de retiro de la torta.'), ...e.fecha]);
      if (estado.medioPago === 'tarjeta') {
        e.tarjetaNumero = obligatorio([reglas.requerido('Ingresá el número que figura en el frente de la tarjeta.'), reglas.numeroTarjeta()]);
        e.tarjetaVencimiento = obligatorio([reglas.requerido('Ingresá el vencimiento que figura en la tarjeta (MM/AA).'), reglas.vencimiento()]);
        e.tarjetaCodigo = obligatorio([reglas.requerido('Ingresá el código de seguridad de la tarjeta.'), reglas.codigoSeguridad()]);
      }
      return e;
    }

    const campo = ({ etiqueta, nombre, tipo = 'text', valor = '', ayuda = '', opcional = false, atributos = '', clase = '' }) => `
      <div class="campo ${clase}">
        <label for="pago-${nombre}">${etiqueta}${opcional ? ' <span class="campo__opcional">(opcional)</span>' : ''}</label>
        <input id="pago-${nombre}" name="${nombre}" type="${tipo}" value="${escapar(valor || '')}" placeholder="${escapar(ayuda)}" ${atributos}>
      </div>`;

    function seccionDatos() {
      return `<div class="grilla-form">
        ${campo({ etiqueta: 'Nombre y apellido', nombre: 'nombre', valor: estado.nombre, ayuda: 'Laura Gómez', atributos: 'autocomplete="name" autocapitalize="words" maxlength="60"', clase: 'campo--completo' })}
        ${campo({ etiqueta: 'Email', nombre: 'email', tipo: 'email', valor: estado.email, ayuda: 'laura@mail.com', atributos: 'autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" maxlength="254"' })}
        ${campo({ etiqueta: 'Teléfono', nombre: 'telefono', tipo: 'tel', valor: estado.telefono, ayuda: '11 5555 5555', atributos: 'autocomplete="tel" inputmode="tel" maxlength="20"' })}
      </div>
      <label class="check"><input type="checkbox" name="esNegocio" ${estado.esNegocio ? 'checked' : ''}><span>Es para mi negocio (pedido mayorista)</span></label>
      ${estado.esNegocio ? `<div class="grilla-form">${campo({ etiqueta: 'Nombre del negocio', nombre: 'negocio', valor: estado.negocio, opcional: true, atributos: 'autocomplete="organization" maxlength="80"', clase: 'campo--completo' })}</div>` : ''}`;
    }

    function seccionEntrega(r) {
      const fechaCampo = `<div class="grilla-form">
        ${campo({ etiqueta: r.hayTortas ? 'Fecha de retiro' : (r.modo === 'envio' ? '¿Para cuándo lo querés?' : '¿Cuándo lo retirás?'), nombre: 'fecha', tipo: 'date', valor: estado.fecha, opcional: !r.hayTortas, atributos: `min="${fechaMinima()}"` })}
      </div>
      ${r.hayTortas ? `<p class="checkout-nota">Las tortas por encargo necesitan al menos ${Pedido.anticipacion()} h de anticipación.</p>` : ''}`;
      if (r.modo === 'envio') {
        return `<div class="checkout-caja checkout-caja--fila">
            <div><span class="checkout-caja__titulo">Envío a domicilio</span><span class="checkout-caja__detalle">${config.envio.detalle} · ${formatoPrecio(config.envio.costo)}</span></div>
            <button type="button" class="checkout-boton-texto" data-accion="modo" data-valor="retiro">Prefiero retirar</button>
          </div>
          <div class="grilla-form">
            ${campo({ etiqueta: 'Dirección', nombre: 'direccion', valor: estado.direccion, ayuda: 'Calle y altura', atributos: 'autocomplete="street-address" maxlength="80"', clase: 'campo--completo' })}
            ${campo({ etiqueta: 'Código postal', nombre: 'cp', valor: estado.cp, ayuda: '1430', atributos: 'autocomplete="postal-code" autocapitalize="characters" maxlength="8"' })}
            ${campo({ etiqueta: 'Piso, depto o indicaciones', nombre: 'indicaciones', valor: estado.indicaciones, ayuda: 'Timbre, piso, referencias', opcional: true, atributos: 'maxlength="120"' })}
          </div>${fechaCampo}`;
      }
      return `<div class="checkout-caja checkout-caja--fila">
          <div><span class="checkout-caja__titulo">Retiro en ${escapar(local.direccion)}</span><span class="checkout-caja__detalle">${config.retiro.detalle.replace(/^[^·]+·\s*/, '')}</span></div>
          ${r.hayTortas ? '' : '<button type="button" class="checkout-boton-texto" data-accion="modo" data-valor="envio">Prefiero envío</button>'}
        </div>${fechaCampo}`;
    }

    function seccionMedio(r) {
      const envio = r.modo === 'envio';
      const medios = [
        { id: 'tarjeta', titulo: 'Tarjeta', detalle: `Crédito o débito, hasta ${config.cuotas} cuotas` },
        { id: 'mp', titulo: 'Mercado Pago', detalle: 'Te llevamos a Mercado Pago para pagar' },
        { id: 'efectivo', titulo: 'Efectivo', detalle: envio ? 'Solo con retiro en el local' : 'Pagás al retirar', deshabilitado: envio }
      ];
      return `<div class="opciones-pago" role="radiogroup" aria-label="Medio de pago">${medios.map((m) => `
          <button type="button" role="radio" class="tarjeta-radio ${estado.medioPago === m.id ? 'activa' : ''}" data-accion="medio" data-valor="${m.id}" aria-checked="${estado.medioPago === m.id}" ${m.deshabilitado ? 'aria-disabled="true"' : ''}>
            <span class="tarjeta-radio__punto" aria-hidden="true"></span>
            <span class="tarjeta-radio__texto"><span class="tarjeta-radio__titulo">${m.titulo}</span><span class="tarjeta-radio__detalle">${m.detalle}</span></span>
          </button>`).join('')}</div>
        ${estado.medioPago === 'tarjeta' ? `<div class="grilla-form grilla-form--tarjeta">
          ${campo({ etiqueta: 'Número de tarjeta', nombre: 'tarjetaNumero', valor: tarjeta.tarjetaNumero, ayuda: '0000 0000 0000 0000', atributos: 'inputmode="numeric" autocomplete="cc-number" maxlength="19"', clase: 'campo--completo' })}
          ${campo({ etiqueta: 'Vencimiento', nombre: 'tarjetaVencimiento', valor: tarjeta.tarjetaVencimiento, ayuda: 'MM/AA', atributos: 'inputmode="numeric" autocomplete="cc-exp" maxlength="5"' })}
          ${campo({ etiqueta: 'Código', nombre: 'tarjetaCodigo', valor: tarjeta.tarjetaCodigo, ayuda: '123', atributos: 'inputmode="numeric" autocomplete="cc-csc" maxlength="4"' })}
        </div>` : ''}
        ${estado.medioPago === 'mp' ? '<p class="checkout-nota">Al tocar "Pagar", te llevamos a Mercado Pago para terminar el pago.</p>' : ''}`;
    }

    function textoBoton(r) {
      return estado.medioPago === 'efectivo' ? `Confirmar pedido · ${formatoPrecio(r.total)}` : `Pagar ${formatoPrecio(r.total)}`;
    }

    function panelResumen(r) {
      return `<h2 class="checkout-panel__titulo">Resumen</h2>
        <ul class="checkout-resumen">${r.items.map((it) => `
          <li><span>${escapar(it.cantidadTexto)} · ${escapar(it.nombre)}${it.linea.opcion ? ` <em>${escapar(it.linea.opcion)}</em>` : ''}</span><span>${formatoPrecio(it.subtotal)}</span></li>`).join('')}</ul>
        <div class="checkout-lineas">
          <div class="checkout-fila"><span>Subtotal</span><span>${formatoPrecio(r.subtotal)}</span></div>
          <div class="checkout-fila"><span>${r.modo === 'envio' ? 'Envío a domicilio' : 'Retiro en el local'} <a href="carrito.html" class="checkout-cambiar">Cambiar</a></span><span>${r.envio ? formatoPrecio(r.envio) : 'Sin costo'}</span></div>
        </div>
        <div class="checkout-total"><span>Total a pagar</span><strong>${formatoPrecio(r.total)}</strong></div>
        <button type="submit" form="pago-form" class="btn btn--primario btn--ancho checkout-cta">${textoBoton(r)}</button>
        <p class="checkout-panel__nota">${demo ? 'Modo demostración: no se realiza ningún cobro.' : 'Pago seguro. Te mandamos el comprobante por email.'}</p>`;
    }

    function dibujar() {
      const r = resumen();
      if (r.vacio) { location.replace('carrito.html'); return; }
      const foco = document.activeElement && form.contains(document.activeElement) ? document.activeElement.name : null;
      $('#pago-datos').innerHTML = seccionDatos();
      $('#pago-entrega').innerHTML = seccionEntrega(r);
      $('#pago-medio').innerHTML = seccionMedio(r);
      $('#pago-panel').innerHTML = panelResumen(r);
      $('#pago-boton-movil').textContent = textoBoton(r);
      // Vuelve a mostrar los errores de los campos ya tocados
      const e = esquema();
      tocados.forEach((n) => { if (form.elements[n]) validarCampo(form, e, n); });
      if (foco && form.elements[foco]) form.elements[foco].focus();
    }

    const MASCARA_DE = { tarjetaNumero: mascaras.tarjeta, tarjetaVencimiento: mascaras.vencimiento, tarjetaCodigo: mascaras.codigo, telefono: mascaras.telefono, cp: mascaras.cp };

    form.addEventListener('input', (ev) => {
      const input = ev.target;
      const { name } = input;
      if (MASCARA_DE[name]) {
        const antes = input.value;
        const formateado = MASCARA_DE[name](antes);
        if (formateado !== antes) {
          // Mantiene el cursor al final de lo escrito
          const desdeFinal = antes.length - input.selectionStart;
          input.value = formateado;
          const pos = Math.max(0, formateado.length - desdeFinal);
          input.setSelectionRange(pos, pos);
        }
      }
      if (GUARDADOS.includes(name)) actualizar({ [name]: input.value });
      if (name in tarjeta) tarjeta[name] = input.value;
      // Si el campo ya mostró un error, se revalida mientras se corrige
      if (tocados.has(name)) validarCampo(form, esquema(), name);
    });
    form.addEventListener('focusout', (ev) => {
      const { name } = ev.target;
      if (!name || !ev.target.value) return;
      tocados.add(name);
      validarCampo(form, esquema(), name);
    });
    form.addEventListener('change', (ev) => {
      if (ev.target.name === 'esNegocio') { actualizar({ esNegocio: ev.target.checked }); dibujar(); }
      if (ev.target.name === 'fecha') { tocados.add('fecha'); validarCampo(form, esquema(), 'fecha'); }
    });

    document.querySelector('main').addEventListener('click', (ev) => {
      const el = ev.target.closest('[data-accion]');
      if (!el) return;
      if (el.dataset.accion === 'modo') {
        actualizar({ modo: el.dataset.valor, medioPago: el.dataset.valor === 'envio' && estado.medioPago === 'efectivo' ? 'tarjeta' : estado.medioPago });
        dibujar();
      }
      if (el.dataset.accion === 'medio') {
        if (el.getAttribute('aria-disabled') === 'true') { aviso('El pago en efectivo es solo con retiro en el local'); return; }
        actualizar({ medioPago: el.dataset.valor });
        dibujar();
      }
    });
    $('#pago-boton-movil').addEventListener('click', () => form.requestSubmit());

    let enviando = false;
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (enviando) return; // evita un doble pago si tocan dos veces
      const e = esquema();
      let primero = null;
      Object.keys(e).forEach((nombre) => {
        tocados.add(nombre);
        if (validarCampo(form, e, nombre) && !primero) primero = form.elements[nombre];
      });
      if (primero) { primero.focus(); aviso('Revisá los campos marcados en rojo.'); return; }

      const r = resumen();
      const pedido = {
        numero: '#' + config.prefijoPedido + (48214 + Math.floor(Math.random() * 9000)),
        total: r.total, subtotal: r.subtotal, envio: r.envio, modo: r.modo, medioPago: estado.medioPago,
        fecha: estado.fecha || '', email: estado.email, nombre: estado.nombre,
        direccion: r.modo === 'envio' ? `${estado.direccion}${estado.indicaciones ? ` (${estado.indicaciones})` : ''}` : '',
        items: r.items.map((it) => ({ nombre: it.nombre, detalle: [it.cantidadTexto, it.linea.opcion].filter(Boolean).join(' · '), subtotal: it.subtotal })),
        demo
      };

      const terminar = () => {
        guardarSesion(CLAVE_ULTIMO, pedido);
        Pedido.vaciar();
        location.href = 'confirmacion.html';
      };
      // Animación de carga ("Cargando...") entre "Pagar" y la confirmación.
      // Con una pasarela real, acá se esperaría su respuesta (o se redirigiría a Mercado Pago).
      enviando = true;
      document.documentElement.classList.add('cargando-pago');
      $('#pago-carga').hidden = false;
      const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(terminar, menosMovimiento ? 900 : 2900);
    });

    Pedido.alCambiar(dibujar);
    dibujar();
  }

  /* ======================================================================
     PASO 3 · CONFIRMACIÓN
     ====================================================================== */
  function iniciarConfirmacion() {
    const p = leerSesion(CLAVE_ULTIMO, null);
    const $c = $('#confirmacion');
    if (!p) {
      $c.innerHTML = `<h1 class="confirmacion__titulo" tabindex="-1">No hay un pedido reciente</h1>
        <p class="confirmacion__texto">Armá tu pedido en la tienda y pagalo en un par de pasos.</p>
        <div class="confirmacion__acciones"><a class="btn btn--primario" href="tienda.html">Ir a la tienda</a></div>`;
      return;
    }

    const retiro = p.modo !== 'envio';
    const efectivo = p.medioPago === 'efectivo';
    // "sábado 21 de noviembre" (sin la coma que agrega toLocaleDateString)
    const fechaLarga = (iso) => {
      const d = new Date(iso + 'T12:00:00');
      const dia = d.toLocaleDateString('es-AR', { weekday: 'long' });
      const mes = d.toLocaleDateString('es-AR', { month: 'long' });
      return `${dia} ${d.getDate()} de ${mes}`;
    };
    const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    const horarioDe = (fecha) => { const [abre, cierra] = local.horarios[fecha.getDay()]; return `de ${abre} a ${cierra} h`; };

    const ICONOS = {
      cuando: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
      donde: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
      pago: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/></svg>',
      ok: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
      reloj: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/></svg>'
    };

    // Cuándo
    let cuando, cuandoDetalle;
    if (p.fecha) {
      const fecha = new Date(p.fecha + 'T12:00:00');
      cuando = mayuscula(fechaLarga(p.fecha));
      cuandoDetalle = retiro ? `Podés retirarlo ${horarioDe(fecha)}` : 'Fecha de entrega elegida';
    } else if (retiro) {
      cuando = 'Listo en 2 h';
      cuandoDetalle = `Hoy el local abre ${horarioDe(new Date())}`;
    } else {
      cuando = mayuscula(config.envio.detalle.split('·').pop().trim());
      cuandoDetalle = 'Entrega estimada';
    }
    // Dónde
    const donde = retiro ? `${local.direccion}, ${local.barrio.replace(', CABA', '')}` : p.direccion;
    const dondeDetalle = retiro
      ? `<a href="${local.mapsUrl}" target="_blank" rel="noopener">Cómo llegar</a>`
      : 'Envío a domicilio';
    // Pago: el estado va con ícono y etiqueta, no solo con color
    const medio = { tarjeta: 'con tarjeta', mp: 'con Mercado Pago', efectivo: 'en efectivo' }[p.medioPago] || '';
    const pago = efectivo ? `Pagás ${formatoPrecio(p.total)} en efectivo al retirar` : `Pagaste ${formatoPrecio(p.total)} ${medio}`;
    const etiquetaPago = efectivo
      ? `<span class="estado-pago estado-pago--pendiente">${ICONOS.reloj}Pago pendiente</span>`
      : `<span class="estado-pago estado-pago--ok">${ICONOS.ok}Pagado</span>`;

    const consulta = encodeURIComponent(`Hola MUCHO, tengo una consulta sobre mi pedido ${p.numero}.`);
    const subtotal = typeof p.subtotal === 'number' ? p.subtotal : p.total - (p.envio || 0);

    $c.innerHTML = `
      <p class="solo-impresion confirmacion__impreso">MUCHO · Comprobante de pedido</p>
      <div class="confirmacion__encabezado">
        <div class="confirmacion__tilde" aria-hidden="true">✓</div>
        <h1 class="confirmacion__titulo" tabindex="-1">${efectivo ? '¡Recibimos tu pedido!' : '¡Tu compra fue exitosa!'}</h1>
      </div>

      <div class="confirmacion__numero">
        <span class="confirmacion__numero-titulo">Tu número de pedido</span>
        <strong>${escapar(p.numero)}</strong>
        <span class="confirmacion__numero-ayuda">${retiro ? 'Mostralo al retirar' : 'Tenelo a mano si nos escribís'}</span>
      </div>

      <ul class="confirmacion__datos">
        <li>${ICONOS.cuando}<div><strong>${escapar(cuando)}</strong><span>${escapar(cuandoDetalle)}</span></div></li>
        <li>${ICONOS.donde}<div><strong>${escapar(donde)}</strong><span>${dondeDetalle}</span></div></li>
        <li>${ICONOS.pago}<div><strong>${escapar(pago)}</strong><span>${etiquetaPago}</span></div></li>
      </ul>

      <div class="confirmacion__detalle">
        <h2 class="confirmacion__detalle-titulo">Detalle</h2>
        <ul class="checkout-resumen">${p.items.map((it) => `<li><span>${escapar(it.nombre)} <em>${escapar(it.detalle)}</em></span><span>${formatoPrecio(it.subtotal)}</span></li>`).join('')}</ul>
        <div class="checkout-lineas">
          <div class="checkout-fila"><span>Subtotal</span><span>${formatoPrecio(subtotal)}</span></div>
          <div class="checkout-fila"><span>${retiro ? 'Retiro en el local' : 'Envío a domicilio'}</span><span>${p.envio ? formatoPrecio(p.envio) : 'Sin costo'}</span></div>
        </div>
        <div class="checkout-total"><span>Total</span><strong>${formatoPrecio(p.total)}</strong></div>
      </div>

      <div class="confirmacion__acciones">
        ${retiro ? `<a class="btn btn--primario" href="${local.mapsUrl}" target="_blank" rel="noopener">Cómo llegar</a>` : ''}
        <a class="btn" href="tienda.html">Seguir comprando</a>
      </div>
      <p class="confirmacion__enlaces">
        <button type="button" class="checkout-boton-texto" data-imprimir>Descargar comprobante</button>
        <span aria-hidden="true">·</span>
        <a href="index.html">Volver al inicio</a>
      </p>
      <p class="confirmacion__ayuda">¿Dudas con tu pedido? <a href="https://wa.me/${MUCHO.tienda.whatsapp}?text=${consulta}" target="_blank" rel="noopener">Escribinos por WhatsApp</a></p>`;

    $c.querySelector('[data-imprimir]').addEventListener('click', () => window.print());
    // Lectores de pantalla: anuncian primero la confirmación
    $c.querySelector('.confirmacion__titulo').focus({ preventScroll: true });
  }

  if (paso === 'carrito') iniciarCarrito();
  if (paso === 'pago') iniciarPago();
  if (paso === 'confirmacion') iniciarConfirmacion();
})();
