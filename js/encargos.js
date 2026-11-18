/* ==========================================================================
   MUCHO · Encargos
   Catálogo de tortas y formulario que arma la consulta para WhatsApp.
   ========================================================================== */

(function () {
  const { tortas, anticipacionHoras } = MUCHO.encargos;
  const $grilla = document.getElementById('grilla-tortas');
  const $form = document.getElementById('form-encargo');
  const $select = document.getElementById('encargo-torta');
  const $fecha = document.getElementById('encargo-fecha');
  const $mensaje = document.getElementById('encargo-mensaje');

  /* ---------- Catálogo ---------- */
  $grilla.innerHTML = tortas.map((t) => `
    <li>
      <article class="plato-card torta-card">
        <div class="plato-card__foto">${fotoHTML(t.foto, t.nombre, '', t.fotoPosicion, t.fotoZoom)}</div>
        <div class="plato-card__cuerpo">
          <h3 class="plato-card__nombre"><button type="button" class="plato-card__abrir" data-torta="${t.id}">${t.nombre}</button></h3>
          <p class="plato-card__desc">${t.descripcion}</p>
          <div class="plato-card__pie">
            <div class="plato-card__tags">${etiquetasDieta(t.dietas)}</div>
            <span class="precio">${formatoPrecio(t.precio)}</span>
          </div>
          <p class="torta-card__accion" aria-hidden="true">Elegir esta torta →</p>
        </div>
      </article>
    </li>`).join('');

  $select.innerHTML += tortas.map((t) => `<option value="${t.id}">${t.nombre} · ${formatoPrecio(t.precio)}</option>`).join('');

  // Elegir una torta desde el catálogo la carga en el formulario
  $grilla.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-torta]');
    if (!btn) return;
    $select.value = btn.dataset.torta;
    marcarElegida();
    $select.focus();
  });

  function marcarElegida() {
    document.querySelectorAll('.torta-card').forEach((card) => {
      card.classList.toggle('elegida', card.querySelector('[data-torta]').dataset.torta === $select.value);
    });
  }
  $select.addEventListener('change', marcarElegida);

  /* ---------- Fecha mínima según el plazo de anticipación ---------- */
  const minima = new Date(Date.now() + anticipacionHoras * 60 * 60 * 1000);
  const aISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  $fecha.min = aISO(minima);

  /* ---------- Envío: arma el mensaje y abre WhatsApp ---------- */
  $form.addEventListener('submit', (e) => {
    e.preventDefault();
    $mensaje.hidden = true;

    if (!$form.checkValidity()) {
      $form.reportValidity();
      return;
    }

    const datos = new FormData($form);
    const torta = tortas.find((t) => t.id === datos.get('torta'));
    const fecha = new Date(datos.get('fecha') + 'T12:00:00')
      .toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

    const texto = [
      'Hola MUCHO, quiero consultar por un encargo:',
      `• Torta: ${torta.nombre}`,
      `• Retiro: ${fecha}`,
      `• Nombre y teléfono: ${datos.get('contacto')}`,
      datos.get('comentarios') ? `• Comentarios: ${datos.get('comentarios')}` : ''
    ].filter(Boolean).join('\n');

    window.open(enlaceWhatsApp(texto), '_blank', 'noopener');
    $mensaje.hidden = false;
  });
})();
