/* ==========================================================================
   MUCHO · Menú
   Carta filtrable por momento del día y dieta, anclas por categoría,
   ficha de plato en modal, PDF imprimible y schema.org/Menu.
   Todo se genera a partir de MUCHO (js/data.js).
   ========================================================================== */

(function () {
  const { items, categorias, momentos, ejecutivo } = MUCHO;

  const $secciones = document.getElementById('carta-secciones');
  const $contador = document.getElementById('carta-contador');
  const $vacio = document.getElementById('carta-vacia');
  const $avisoGluten = document.getElementById('aviso-gluten-filtro');
  const $form = document.getElementById('filtros');
  const $ficha = document.getElementById('ficha');
  const $fichaCuerpo = document.getElementById('ficha-cuerpo');

  const nombreMomento = Object.fromEntries(momentos.map((m) => [m.id, m.nombre]));
  const nombreCategoria = Object.fromEntries(categorias.map((c) => [c.id, c.nombre]));

  const estado = { momento: 'todo', dietas: [] };
  let visibles = [];

  /* ---------- Render inicial de la carta ---------- */
  function badgeEstado(item) {
    if (item.estado === 'nuevo') return '<span class="badge badge--nuevo">Nuevo</span>';
    if (item.estado === 'destacado') return '<span class="badge">Destacado</span>';
    if (item.estado === 'sin-stock') return '<span class="badge badge--sin-stock">Sin stock hoy</span>';
    return '';
  }

  function tarjeta(item) {
    return `
      <li class="plato-card-wrap" data-id="${item.id}">
        <article class="plato-card ${item.estado === 'sin-stock' ? 'plato-card--sin-stock' : ''}">
          <div class="plato-card__foto">${fotoHTML(item.foto, item.nombre, '', item.fotoPosicion, item.fotoZoom)}${badgeEstado(item)}</div>
          <div class="plato-card__cuerpo">
            <h3 class="plato-card__nombre"><button type="button" class="plato-card__abrir" data-abrir="${item.id}">${item.nombre}</button></h3>
            <p class="plato-card__desc">${item.descripcion}</p>
            ${item.ejecutivo ? '<p class="plato-card__ejecutivo">Entra en el menú ejecutivo</p>' : ''}
            <div class="plato-card__pie">
              <div class="plato-card__tags">${etiquetasDieta(item.dietas)}</div>
              <span class="precio">${formatoPrecio(item.precio)}</span>
            </div>
          </div>
        </article>
      </li>`;
  }

  $secciones.innerHTML = categorias.map((cat) => {
    const deCat = items.filter((i) => i.categoria === cat.id);
    return `
      <section class="carta-seccion" id="${cat.id}" aria-labelledby="titulo-${cat.id}">
        <header class="carta-seccion__cabecera">
          <h2 id="titulo-${cat.id}">${cat.nombre}</h2>
          <p>${cat.bajada}</p>
        </header>
        ${cat.id === 'tostones' ? `<p class="aviso aviso--ejecutivo">${ejecutivo.texto} · ${formatoPrecio(ejecutivo.precio)}</p>` : ''}
        <ul class="grilla-platos">${deCat.map(tarjeta).join('')}</ul>
        ${cat.id === 'pasteleria' ? '<p class="carta-seccion__extra">¿Una torta entera para un cumpleaños o una reunión? <a href="tienda.html?seccion=tortas">Mirá las tortas por encargo →</a></p>' : ''}
      </section>`;
  }).join('');

  /* ---------- Filtros ---------- */
  function cumpleMomento(item) {
    return estado.momento === 'todo' || item.momentos.includes('todo') || item.momentos.includes(estado.momento);
  }

  function cumpleDietas(item) {
    return estado.dietas.every((d) => d === 'sin-gluten'
      ? item.dietas.includes('sin-gluten') || item.dietas.includes('sin-gluten-opc')
      : item.dietas.includes(d));
  }

  function aplicarFiltros() {
    visibles = items.filter((i) => cumpleMomento(i) && cumpleDietas(i));
    const ids = new Set(visibles.map((i) => i.id));

    document.querySelectorAll('.plato-card-wrap').forEach((el) => { el.hidden = !ids.has(el.dataset.id); });
    document.querySelectorAll('.carta-seccion').forEach((sec) => {
      const hay = visibles.some((i) => i.categoria === sec.id);
      sec.hidden = !hay;
      const link = document.querySelector(`.filtros__anclas a[href="#${sec.id}"]`);
      if (link) link.classList.toggle('sin-resultados', !hay);
    });

    const veganos = visibles.filter((i) => i.dietas.includes('vegano')).length;
    if ($contador) $contador.textContent = `${visibles.length} ${visibles.length === 1 ? 'ítem' : 'ítems'} · ${veganos} ${veganos === 1 ? 'vegano' : 'veganos'}`;
    $vacio.hidden = visibles.length > 0;
    $avisoGluten.hidden = !estado.dietas.includes('sin-gluten');

    // Mediodía: el menú ejecutivo pasa al frente
    document.querySelectorAll('.plato-card__ejecutivo').forEach((el) => {
      el.classList.toggle('resaltado', estado.momento === 'mediodia');
    });

    actualizarURL();
  }

  function leerFormulario() {
    const datos = new FormData($form);
    estado.momento = datos.get('momento') || 'todo';
    estado.dietas = datos.getAll('dieta');
    aplicarFiltros();
  }

  // Al cambiar un filtro, si el usuario está más abajo, vuelve al inicio de la carta
  function volverAlInicio() {
    const inicio = document.querySelector('.carta').getBoundingClientRect().top + window.scrollY - 120;
    if (window.scrollY > inicio) window.scrollTo({ top: inicio });
  }

  $form.addEventListener('change', () => { leerFormulario(); volverAlInicio(); });
  $form.addEventListener('reset', () => setTimeout(leerFormulario, 0));

  /* ---------- URL compartible (?momento=…&dieta=…&plato=…) ---------- */
  function actualizarURL(platoId) {
    const params = new URLSearchParams();
    if (estado.momento !== 'todo') params.set('momento', estado.momento);
    if (estado.dietas.length) params.set('dieta', estado.dietas.join(','));
    const plato = platoId !== undefined ? platoId : (new URLSearchParams(location.search).get('plato'));
    if (plato) params.set('plato', plato);
    const query = params.toString();
    history.replaceState(null, '', location.pathname + (query ? '?' + query : '') + location.hash);
  }

  function leerURL() {
    const params = new URLSearchParams(location.search);
    const momento = params.get('momento');
    if (momento && (momento === 'todo' || nombreMomento[momento])) {
      $form.querySelector(`input[name="momento"][value="${momento}"]`).checked = true;
    }
    (params.get('dieta') || '').split(',').filter(Boolean).forEach((d) => {
      const input = $form.querySelector(`input[name="dieta"][value="${d}"]`);
      if (input) input.checked = true;
    });
    leerFormulario();
    const plato = params.get('plato');
    if (plato && items.some((i) => i.id === plato)) abrirFicha(plato);
  }

  /* ---------- Anclas: categoría activa según scroll ---------- */
  const anclas = document.querySelectorAll('.filtros__anclas a');
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      anclas.forEach((a) => a.classList.toggle('activo', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  document.querySelectorAll('.carta-seccion').forEach((s) => observador.observe(s));

  /* ---------- Ficha de plato (modal) ---------- */
  let fichaActual = null;

  function renderFicha(item) {
    const idx = visibles.findIndex((i) => i.id === item.id);
    const anterior = visibles[idx - 1];
    const siguiente = visibles[idx + 1];
    const momentosTexto = item.momentos.includes('todo')
      ? 'Todo el día'
      : item.momentos.map((m) => nombreMomento[m]).join(' · ');
    // El aviso de contaminación cruzada aplica a la comida, no a las bebidas
    const esComida = !['cafeteria', 'bebidas'].includes(item.categoria);
    const tieneGluten = item.dietas.includes('sin-gluten-opc') || (esComida && item.dietas.includes('sin-gluten'));

    $fichaCuerpo.innerHTML = `
      <div class="ficha__foto">${fotoHTML(item.foto, item.nombre, '', item.fotoPosicion, item.fotoZoom)}</div>
      <div class="ficha__info">
        <p class="ficha__categoria">${nombreCategoria[item.categoria]}</p>
        <h2 id="ficha-titulo" class="ficha__nombre">${item.nombre}</h2>
        <p class="ficha__precio precio">${formatoPrecio(item.precio)}</p>
        ${item.estado === 'sin-stock' ? '<p class="aviso aviso--sin-stock">Hoy no nos queda. Consultá en la barra si vuelve más tarde.</p>' : ''}
        <p class="ficha__desc">${item.descripcion}</p>
        <div class="ficha__tags">
          ${etiquetasDieta(item.dietas)}
          <span class="tag">${momentosTexto}</span>
          ${badgeEstado(item) && item.estado !== 'sin-stock' ? `<span class="tag tag--marca">${item.estado === 'nuevo' ? 'Nuevo' : 'Destacado'}</span>` : ''}
        </div>
        ${item.ejecutivo ? `<p class="ficha__ejecutivo">Entra en el <strong>menú ejecutivo</strong>: de lunes a viernes de 12 a 15, con bebida y café, a ${formatoPrecio(ejecutivo.precio)}.</p>` : ''}
        ${item.adicionales ? `
          <div class="ficha__adicionales">
            <h3>Adicionales</h3>
            <p>${item.adicionales.join(' · ')}</p>
          </div>` : ''}
        ${tieneGluten ? `<p class="aviso aviso--gluten">${MUCHO.avisoGluten}</p>` : ''}
        <nav class="ficha__nav" aria-label="Otros platos">
          <button type="button" class="enlace-flecha" ${anterior ? `data-ir="${anterior.id}"` : 'disabled'}>← ${anterior ? anterior.nombre : 'Anterior'}</button>
          <button type="button" class="enlace-flecha" ${siguiente ? `data-ir="${siguiente.id}"` : 'disabled'}>${siguiente ? siguiente.nombre : 'Siguiente'} →</button>
        </nav>
      </div>`;
  }

  function abrirFicha(id) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    // Si el plato quedó fuera del filtro (link directo), se suma a la navegación igual
    if (!visibles.some((i) => i.id === id)) visibles = [item, ...visibles];
    fichaActual = id;
    renderFicha(item);
    if (!$ficha.open) $ficha.showModal();
    actualizarURL(id);
  }

  function cerrarFicha() {
    $ficha.close();
  }

  $ficha.addEventListener('close', () => {
    const card = document.querySelector(`[data-abrir="${fichaActual}"]`);
    fichaActual = null;
    actualizarURL(null);
    if (card) card.focus();
  });

  $secciones.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-abrir]');
    if (btn) abrirFicha(btn.dataset.abrir);
  });

  $ficha.addEventListener('click', (e) => {
    if (e.target === $ficha) return cerrarFicha(); // clic en el fondo
    if (e.target.closest('[data-cerrar]')) return cerrarFicha();
    const ir = e.target.closest('[data-ir]');
    if (ir) abrirFicha(ir.dataset.ir);
  });

  $ficha.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const idx = visibles.findIndex((i) => i.id === fichaActual);
    const destino = visibles[idx + (e.key === 'ArrowRight' ? 1 : -1)];
    if (destino) abrirFicha(destino.id);
  });

  /* ---------- Menú imprimible / PDF (misma fuente de datos) ---------- */
  const $impreso = document.getElementById('menu-impreso');
  const abreviaturaDieta = (d) => ({ vegano: 'V', 'sin-gluten': 'SG', 'sin-gluten-opc': 'SG opc.' }[d]);

  $impreso.innerHTML = `
    <header class="impreso__cabecera">
      <img src="assets/img/logos/logo-mucho-cafe.png" alt="MUCHO">
      <div>
        <p>${MUCHO.local.direccion}, ${MUCHO.local.barrio}</p>
        <p>Lunes a viernes 8 a 20 h · Sábados y domingos 9 a 20 h</p>
      </div>
    </header>
    <div class="impreso__columnas">
      ${categorias.map((cat) => `
        <section class="impreso__seccion">
          <h2>${cat.nombre}</h2>
          ${cat.id === 'tostones' ? `<p class="impreso__nota">${ejecutivo.texto} · ${formatoPrecio(ejecutivo.precio)}</p>` : ''}
          <ul>
            ${items.filter((i) => i.categoria === cat.id).map((i) => `
              <li>
                <p class="impreso__linea"><span>${i.nombre}${i.dietas.length ? ` <small>${i.dietas.map(abreviaturaDieta).join(' · ')}</small>` : ''}</span><span>${formatoPrecio(i.precio)}</span></p>
                <p class="impreso__desc">${i.descripcion}${i.adicionales ? ` Adicionales: ${i.adicionales.join(', ')}.` : ''}</p>
              </li>`).join('')}
          </ul>
        </section>`).join('')}
    </div>
    <footer class="impreso__pie">
      <p>V: vegano · SG: sin gluten · SG opc.: con pan sin gluten a pedido. ${MUCHO.avisoGluten}</p>
      <p>Adicionales para toda la carta: ${MUCHO.adicionalesGenerales.join(' · ')}. ${MUCHO.avisoCarta}</p>
    </footer>`;


  /* ---------- Datos estructurados para Google (schema.org/Menu) ---------- */
  const dietaSchema = { vegano: 'https://schema.org/VeganDiet', 'sin-gluten': 'https://schema.org/GlutenFreeDiet' };
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Carta de MUCHO',
    inLanguage: 'es-AR',
    hasMenuSection: categorias.map((cat) => ({
      '@type': 'MenuSection',
      name: cat.nombre,
      description: cat.bajada,
      hasMenuItem: items.filter((i) => i.categoria === cat.id).map((i) => ({
        '@type': 'MenuItem',
        name: i.nombre,
        description: i.descripcion,
        offers: { '@type': 'Offer', price: i.precio, priceCurrency: 'ARS' },
        suitableForDiet: i.dietas.map((d) => dietaSchema[d]).filter(Boolean)
      }))
    }))
  };
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify(schema);
  document.head.appendChild(ld);

  leerURL();
})();
