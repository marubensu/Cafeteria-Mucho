/* ==========================================================================
   MUCHO · Comportamiento común a todas las páginas
   - Estado abierto/cerrado en tiempo real (hora de Buenos Aires)
   - Horarios con el día de hoy resaltado
   - Enlaces de WhatsApp
   - Destacados de carta en la home
   ========================================================================== */

(function () {
  const { local } = MUCHO;

  /* ---------- Hora actual en Buenos Aires ---------- */
  function ahoraEnBA() {
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
    }).formatToParts(new Date());
    const get = (t) => partes.find((p) => p.type === t).value;
    const dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { dia: dias[get('weekday')], hora: Number(get('hour')) % 24, minuto: Number(get('minute')) };
  }

  /* ---------- Estado abierto / cerrado ---------- */
  function calcularEstado() {
    const { dia, hora, minuto } = ahoraEnBA();
    const [abre, cierra] = local.horarios[dia];
    const actual = hora + minuto / 60;

    if (actual >= abre && actual < cierra) {
      return { abierto: true, corto: 'Abierto', largo: `Abierto · hasta las ${cierra} h` };
    }
    if (actual < abre) {
      return { abierto: false, corto: 'Cerrado', largo: `Cerrado · abre hoy a las ${abre} h` };
    }
    const manana = local.horarios[(dia + 1) % 7][0];
    return { abierto: false, corto: 'Cerrado', largo: `Cerrado · abre mañana a las ${manana} h` };
  }

  function pintarEstado() {
    const estado = calcularEstado();
    document.querySelectorAll('[data-estado]').forEach((el) => {
      el.classList.toggle('estado--abierto', estado.abierto);
      el.classList.toggle('estado--cerrado', !estado.abierto);
      const $texto = el.querySelector('.estado__texto');
      if (el.dataset.estado === 'corto') { $texto.textContent = estado.corto; return; }
      // "Abierto" + " · hasta las 20 h": la segunda parte se oculta en pantallas muy angostas
      $texto.textContent = estado.corto;
      const extra = document.createElement('span');
      extra.className = 'estado__extra';
      extra.textContent = estado.largo.slice(estado.corto.length);
      $texto.appendChild(extra);
    });
  }

  /* ---------- Horarios (lista con hoy resaltado) ---------- */
  function pintarHorarios() {
    const { dia } = ahoraEnBA();
    document.querySelectorAll('[data-horarios]').forEach((lista) => {
      lista.innerHTML = local.horariosTexto.map((h) => `
        <li class="${h.diasSemana.includes(dia) ? 'es-hoy' : ''}">
          <span>${h.dias}${h.diasSemana.includes(dia) ? ' <em>· hoy</em>' : ''}</span>
          <span>${h.horas}</span>
        </li>`).join('');
    });
  }

  /* ---------- WhatsApp ---------- */
  function enlaceWhatsApp(texto = 'Hola MUCHO, quería hacerles una consulta.') {
    return `https://wa.me/${local.whatsapp}?text=${encodeURIComponent(texto)}`;
  }
  window.enlaceWhatsApp = enlaceWhatsApp;

  document.querySelectorAll('[data-whatsapp]').forEach((a) => {
    a.href = enlaceWhatsApp(a.dataset.whatsapp || undefined);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- Destacados en la home ---------- */
  const destacados = document.querySelector('[data-destacados]');
  if (destacados) {
    const items = MUCHO.items.filter((i) => i.estado === 'destacado').slice(0, 4);
    destacados.innerHTML = items.map((i) => `
      <a class="plato-card" href="menu.html?plato=${i.id}">
        <div class="plato-card__foto">${fotoHTML(i.foto, i.nombre, '', i.fotoPosicion, i.fotoZoom)}</div>
        <div class="plato-card__cuerpo">
          <h3 class="plato-card__nombre">${i.nombre}</h3>
          <p class="plato-card__desc">${i.descripcion}</p>
          <div class="plato-card__pie">
            <div class="plato-card__tags">${etiquetasDieta(i.dietas)}</div>
            <span class="precio">${formatoPrecio(i.precio)}</span>
          </div>
        </div>
      </a>`).join('');
  }

  /* ---------- Servicios ---------- */
  document.querySelectorAll('[data-servicios]').forEach((el) => {
    const conDetalle = el.dataset.servicios === 'detalle';
    el.innerHTML = local.servicios.map((s) => conDetalle
      ? `<li><span class="tag">${s.nombre}</span><p>${s.detalle}</p></li>`
      : `<li class="tag">${s.nombre}</li>`).join('');
  });

  /* ---------- Año del footer ---------- */
  document.querySelectorAll('[data-anio]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Fondo que cambia de color según la sección en pantalla (body.fondo-scroll) ---------- */
  if (document.body.classList.contains('fondo-scroll')) {
    const bloques = [...document.querySelectorAll('main [data-fondo]')];
    // Toma la última sección cuyo borde superior ya pasó la mitad de la pantalla
    const actualizarFondo = () => {
      const mitad = window.innerHeight / 2;
      let actual = bloques[0];
      bloques.forEach((b) => { if (b.getBoundingClientRect().top <= mitad) actual = b; });
      if (document.body.dataset.fondo !== actual.dataset.fondo) document.body.dataset.fondo = actual.dataset.fondo;
    };
    window.addEventListener('scroll', actualizarFondo, { passive: true });
    window.addEventListener('resize', actualizarFondo);
    actualizarFondo();
  }

  /* ---------- Figuras de fondo (inspiradas en milkandmadu.com, en la paleta de marrones) ---------- */
  const PALETA = {
    cream: '#ddc9b1', sand: '#cab08f', caramel: '#c29b72', honey: '#af7c4f',
    light: '#976b44', chestnut: '#885c39', cinnamon: '#875233', taupe: '#754930',
    mocha: '#6c4e34', chocolate: '#4c3120', coffee: '#472d1e', walnut: '#3a281c',
    espresso: '#412d22', mahogany: '#371e17', dark: '#2b1c15', ebony: '#1d1513'
  };
  const FORMAS = {
    // cuatro aspas que giran desde el centro
    aspas: (c, f) => [0, 90, 180, 270].map((r) => `<path transform="rotate(${r} 50 50)" d="M50 50 C50 22 68 2 104 -4 C104 28 82 50 50 50Z" fill="${c}"/>`).join(''),
    // arcos concentricos que nacen del borde inferior
    arcos: (c) => `<path d="M2 104 A48 48 0 0 1 98 104" fill="none" stroke="${c}" stroke-width="14"/><path d="M27 104 A23 23 0 0 1 73 104" fill="none" stroke="${c}" stroke-width="14"/>`,
    // circulo grande cortado por la esquina y un punto
    circulo: (c) => `<circle cx="72" cy="72" r="50" fill="${c}"/><circle cx="22" cy="22" r="10" fill="${c}"/>`,
    // flor de ocho petalos
    flor: (c, f) => [...Array(8)].map((_, i) => { const a = (i * Math.PI) / 4; return `<circle cx="${50 + 27 * Math.cos(a)}" cy="${50 + 27 * Math.sin(a)}" r="17" fill="${c}"/>`; }).join('') + `<circle cx="50" cy="50" r="28" fill="${c}"/><circle cx="50" cy="50" r="9" fill="${f}"/>`,
    // bucle grueso que cruza el recuadro
    bucle: (c) => `<path d="M-8 74 C14 18 44 16 50 48 S86 86 108 26" fill="none" stroke="${c}" stroke-width="15" stroke-linecap="round"/>`,
    // grano de cafe
    grano: (c, f) => `<g transform="rotate(-28 50 50)"><ellipse cx="50" cy="52" rx="31" ry="42" fill="${c}"/><path d="M50 12 C34 36 66 66 50 94" fill="none" stroke="${f}" stroke-width="6" stroke-linecap="round"/></g>`
  };
  // Figuras grandes de fondo: <svg class="fig-fondo" data-forma="flor" data-color="sand" style="..."></svg>
  document.querySelectorAll('.fig-fondo[data-forma]').forEach((svg) => {
    const color = PALETA[svg.dataset.color] || svg.dataset.color;
    const hueco = PALETA[svg.dataset.hueco] || svg.dataset.hueco || 'var(--fondo-actual, #f8f4ef)';
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.innerHTML = FORMAS[svg.dataset.forma](color, hueco);
  });

  /* ---------- Mobile: menú hamburguesa ---------- */
  const toggle = document.querySelector('.header__toggle');
  if (toggle) {
    const header = toggle.closest('.header');
    const cerrar = () => {
      header.classList.remove('nav-abierta');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
    };
    toggle.addEventListener('click', () => {
      const abierta = header.classList.toggle('nav-abierta');
      toggle.setAttribute('aria-expanded', String(abierta));
      toggle.setAttribute('aria-label', abierta ? 'Cerrar menú' : 'Abrir menú');
    });
    header.querySelectorAll('.header__nav a').forEach((a) => a.addEventListener('click', cerrar));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
    window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) cerrar(); });
  }

  /* ---------- Trazos a mano: se dibujan al entrar en pantalla ---------- */
  const circulados = document.querySelectorAll('.circulado');
  if (circulados.length) {
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        // Se dibuja al entrar en pantalla y se borra al salir, para volver a dibujarse la próxima vez
        e.target.classList.toggle('visible', e.isIntersecting);
      });
    }, { threshold: 0.9 });
    circulados.forEach((c) => obs.observe(c));
  }

  pintarEstado();
  pintarHorarios();
  setInterval(pintarEstado, 60 * 1000);
})();
