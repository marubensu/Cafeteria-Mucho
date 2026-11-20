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
    // misma onda, pero sigue hacia la derecha hasta meterse debajo de lo que tenga al lado (ej. el video de El lugar)
    'bucle-largo': (c) => `<path d="M-8 74 C14 18 44 16 50 48 S86 86 108 26 C116 4 132 -2 170 16" fill="none" stroke="${c}" stroke-width="15" stroke-linecap="round"/>`,
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

  // Figuras con data-completa: en vez de quedar recortadas por el borde de la pantalla,
  // se corren lo justo para verse enteras y apoyadas en el borde (si son más anchas que la pantalla, se achican)
  const completas = [...document.querySelectorAll('.fig-fondo[data-completa]')];
  function acomodarFiguras() {
    const ancho = document.documentElement.clientWidth;
    completas.forEach((svg) => {
      svg.style.translate = ''; svg.style.scale = '';
      const caja = svg.getBBox(); const ctm = svg.getScreenCTM(); if (!ctm) return;
      let x0 = ctm.e + caja.x * ctm.a; let x1 = ctm.e + (caja.x + caja.width) * ctm.a;
      let escala = 1;
      if (x1 - x0 > ancho) {
        escala = ancho / (x1 - x0);
        svg.style.scale = String(escala);
        const caja2 = svg.getBBox(); const ctm2 = svg.getScreenCTM();
        x0 = ctm2.e + caja2.x * ctm2.a; x1 = ctm2.e + (caja2.x + caja2.width) * ctm2.a;
      }
      let dx = 0;
      if (x0 < 0) dx = -x0;
      else if (x1 > ancho) dx = ancho - x1;
      if (dx) svg.style.translate = `${Math.round(dx)}px 0`;
    });
  }
  if (completas.length) {
    acomodarFiguras();
    let espera;
    window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(acomodarFiguras, 120); });
    if (document.fonts) document.fonts.ready.then(acomodarFiguras); // el texto puede mover las secciones al cargar la tipografía
  }

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

  /* ---------- Inicio: granos de café que caen por detrás del vaso ---------- */
  const heroImagen = document.querySelector('.hero__imagen');
  const sinMovimientoHero = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroImagen && !sinMovimientoHero && CSS.supports('container-type', 'size')) {
    const lluvia = document.createElement('div');
    lluvia.className = 'hero__lluvia';
    lluvia.setAttribute('aria-hidden', 'true');
    const cantidad = window.matchMedia('(max-width: 640px)').matches ? 9 : 14;
    const azar = (min, max) => min + Math.random() * (max - min);
    for (let i = 0; i < cantidad; i++) {
      const grano = document.createElement('img');
      grano.src = `assets/img/decoracion/granos/grano-${(i % 7) + 1}.png`;
      grano.alt = '';
      grano.className = 'grano-cae';
      const lejos = i % 4 === 3;                       // algunos más chicos y desenfocados: dan profundidad
      const ancho = lejos ? azar(6, 8) : azar(9, 14);  // % del ancho de la imagen
      const dur = lejos ? azar(6.5, 8.5) : azar(4.2, 6.2);
      grano.style.width = `${ancho}cqw`;
      grano.style.setProperty('--x0', `${azar(-4, 70)}cqw`); // empiezan dentro de la foto: no pasan sobre el texto
      grano.style.setProperty('--dx', `${azar(30, 50)}cqw`);
      grano.style.setProperty('--r0', `${azar(-180, 180)}deg`);
      grano.style.setProperty('--r1', `${azar(-180, 180) + (Math.random() < 0.5 ? -1 : 1) * azar(240, 480)}deg`);
      grano.style.setProperty('--dur', `${dur}s`);
      grano.style.setProperty('--delay', `${-azar(0, dur)}s`); // negativo: ya hay granos cayendo al cargar
      if (lejos) grano.classList.add('lejos');
      lluvia.appendChild(grano);
    }
    heroImagen.insertBefore(lluvia, heroImagen.querySelector('.hero__vaso'));
    heroImagen.classList.add('lluvia-activa');
    // Fuera de pantalla, la animación se pausa
    new IntersectionObserver((entradas) => {
      entradas.forEach((e) => heroImagen.classList.toggle('lluvia-pausa', !e.isIntersecting));
    }).observe(heroImagen);
  }

  /* ---------- Perro pet-friendly: mueve la cola al aparecer en pantalla y al pasar o tocar ---------- */
  document.querySelectorAll('.perro-animado').forEach((perro) => {
    const menear = () => {
      perro.classList.remove('menea');
      void perro.offsetWidth; // reinicia la animación
      perro.classList.add('menea');
    };
    perro.addEventListener('animationend', () => perro.classList.remove('menea'));
    perro.addEventListener('mouseenter', menear);
    perro.addEventListener('click', menear);
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { if (e.isIntersecting) { menear(); obs.disconnect(); } });
    }, { threshold: 0.6 });
    obs.observe(perro);
  });

  /* ---------- Footer: el perro llega caminando hasta sus humanos ---------- */
  // Si no hay JS o la persona pidió menos movimiento, el perro ya está en su lugar
  const escena = document.querySelector('.footer-escena');
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (escena && 'IntersectionObserver' in window && !sinMovimiento) {
    escena.classList.add('lista');
    const obsEscena = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        escena.classList.add('camina');
        obsEscena.disconnect();
      });
    }, { threshold: 0.5 });
    obsEscena.observe(escena);
  }

  pintarEstado();
  pintarHorarios();
  setInterval(pintarEstado, 60 * 1000);
})();
