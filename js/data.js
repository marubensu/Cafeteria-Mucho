/* ==========================================================================
   MUCHO · Fuente única de datos
   La carta se carga una sola vez acá. Desde estos datos se generan:
   la vista web filtrable, el PDF imprimible y los datos estructurados
   para Google (schema.org/Menu).
   Los valores marcados [a validar] hay que confirmarlos con el local.
   ========================================================================== */

const MUCHO = {
  local: {
    nombre: 'MUCHO',
    lema: 'Coffee & Kindness',
    direccion: 'Conesa 2686',
    barrio: 'Coghlan, CABA',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Conesa+2686+Coghlan+CABA',
    mapsEmbed: 'https://www.google.com/maps?q=Conesa+2686,+Coghlan,+CABA&output=embed',
    transporte: 'Tren Mitre (estación Coghlan) · Colectivos 41, 44 y 175',
    whatsapp: '5491176167815',
    whatsappVisible: '+54 9 11 7616-7815',
    instagram: 'mucho.arg',
    email: 'hola@muchocafe.com.ar', // [a validar]
    // 0 = domingo … 6 = sábado. Horas en formato 24 h.
    horarios: {
      0: [9, 20], 1: [8, 20], 2: [8, 20], 3: [8, 20], 4: [8, 20], 5: [8, 20], 6: [9, 20]
    },
    horariosTexto: [
      { dias: 'Lunes a viernes', horas: '8 a 20 h', diasSemana: [1, 2, 3, 4, 5] },
      { dias: 'Sábados y domingos', horas: '9 a 20 h', diasSemana: [0, 6] },
      { dias: 'Menú ejecutivo', horas: 'Lunes a viernes, 12 a 15 h', diasSemana: [] }
    ],
    servicios: [
      { id: 'pet', nombre: 'Pet-friendly', detalle: 'Tu perro entra con vos, en el salón y en el deck.' },
      { id: 'wifi', nombre: 'Wifi', detalle: 'Gratis y estable. Pedí la clave en la barra.' },
      { id: 'enchufes', nombre: 'Enchufes', detalle: 'En las mesas junto a la pared del salón.' }, // [a validar]
      { id: 'sin-reservas', nombre: 'Sin reservas', detalle: 'Llegás y te sentás. No tomamos reservas.' },
      { id: 'take-away', nombre: 'Take away', detalle: 'Todo lo de la carta, para llevar.' }
    ]
  },

  momentos: [
    { id: 'desayuno', nombre: 'Desayuno', horario: 'desde las 8 h' },
    { id: 'mediodia', nombre: 'Mediodía', horario: '12 a 15 h' },
    { id: 'merienda', nombre: 'Merienda', horario: 'desde las 16 h' },
    { id: 'after', nombre: 'After', horario: 'desde las 18 h' }
  ],

  dietas: [
    { id: 'vegano', nombre: 'Vegano' },
    { id: 'sin-gluten', nombre: 'Sin gluten' }
  ],

  categorias: [
    { id: 'cafeteria', nombre: 'Cafetería', bajada: 'Café solo, con leche, fríos, filtrados y especiales.' },
    { id: 'bebidas', nombre: 'Bebidas', bajada: 'Matcha e infusiones, aguas frutales, smoothies proteicos y traguitos.' },
    { id: 'desayunos', nombre: 'Desayunos y meriendas', bajada: 'Para empezar el día o cortar la tarde.' },
    { id: 'tostones', nombre: 'Tostones y bowls', bajada: 'Pan de masa madre, bowls abundantes y el menú ejecutivo.' },
    { id: 'sandwiches', nombre: 'Sándwiches y tostados', bajada: 'En focaccia, brioche o masa madre.' },
    { id: 'pasteleria', nombre: 'Pastelería y laminados', bajada: 'Hecho en casa todos los días. Tortas enteras por encargo.' }
  ],

  ejecutivo: {
    texto: 'Menú ejecutivo · de 12 a 15, con bebida y café',
    precio: 19900 // [a validar]
  },

  // Adicionales que aplican a toda la carta
  adicionalesGenerales: [
    'Leche vegetal +$900',
    'Shot extra de espresso +$1.200',
    'Proteína en polvo +$1.500'
  ],

  avisoGluten: 'Tenemos pan sin gluten. No está libre de contaminación cruzada: avisanos con tiempo.',
  avisoCarta: 'La carta puede variar sin previo aviso según la temporada.',

  /* Cada ítem:
     id, nombre, descripcion, precio, categoria, momentos (['todo'] = todo el día),
     dietas ('vegano', 'sin-gluten', 'sin-gluten-opc'), adicionales, estado
     ('nuevo' | 'destacado' | 'sin-stock' | null), ejecutivo (bool), foto (ruta o null) */
  items: [
    // Cafetería
    { id: 'espresso', nombre: 'Espresso', descripcion: 'Doble, de nuestro blend de la semana.', precio: 3200, categoria: 'cafeteria', momentos: ['todo'], dietas: ['vegano', 'sin-gluten'], foto: 'assets/img/carta/espresso.jpg' },
    { id: 'flat-white', nombre: 'Flat white', descripcion: 'Espresso doble y leche texturizada, con latte art.', precio: 4800, categoria: 'cafeteria', momentos: ['todo'], dietas: ['sin-gluten'], foto: 'assets/img/carta/flat-white.jpg' },
    { id: 'cafe-con-leche', nombre: 'Café con leche', descripcion: 'En taza grande, con latte art. Pedilo con leche vegetal si querés.', precio: 4600, categoria: 'cafeteria', momentos: ['desayuno', 'merienda'], dietas: ['sin-gluten'], foto: 'assets/img/carta/cafe-con-leche.jpg', fotoPosicion: 'center 30%' },
    { id: 'v60', nombre: 'Filtrado en V60', descripcion: 'Filtrado en V60 o Chemex, para una o dos tazas. Preguntá qué origen tenemos hoy.', precio: 5200, categoria: 'cafeteria', momentos: ['todo'], dietas: ['vegano', 'sin-gluten'], foto: 'assets/img/carta/filtrado-v60.jpg' },
    { id: 'espresso-tonic', nombre: 'Espresso tonic de frutilla', descripcion: 'Espresso sobre tónica y almíbar de frutilla, con hielo.', precio: 5900, categoria: 'cafeteria', momentos: ['todo'], dietas: ['vegano', 'sin-gluten'], estado: 'destacado', foto: 'assets/img/carta/espresso-tonic-frutilla.jpg' },
    { id: 'mont-blanc', nombre: 'Mont blanc', descripcion: 'Cold brew con crema de naranja.', precio: 6200, categoria: 'cafeteria', momentos: ['todo'], dietas: ['sin-gluten'], estado: 'nuevo', foto: 'assets/img/carta/mont-blanc.jpg' },

    // Bebidas
    { id: 'matcha-latte', nombre: 'Matcha latte', descripcion: 'Matcha ceremonial importado de Japón, batido a mano, con leche a elección.', precio: 6200, categoria: 'bebidas', momentos: ['todo'], dietas: ['sin-gluten'], foto: 'assets/img/carta/matcha-latte.jpg' },
    { id: 'limo-blueberry', nombre: 'Limo blueberry', descripcion: 'Limonada con arándanos, con hielo.', precio: 5200, categoria: 'bebidas', momentos: ['todo'], dietas: ['vegano', 'sin-gluten'], foto: 'assets/img/carta/limo-blueberry.jpg', fotoZoom: 1.15 },
    { id: 'licuado-banana-mango', nombre: 'Licuado de banana, mango y naranja', descripcion: 'Fruta natural licuada con jugo de naranja exprimido.', precio: 6400, categoria: 'bebidas', momentos: ['desayuno', 'merienda'], dietas: ['vegano', 'sin-gluten'], foto: 'assets/img/carta/licuado-banana-mango.jpg' },
    { id: 'gin-tonic-frutilla', nombre: 'Gin tonic de frutilla y pepino', descripcion: 'Gin, tónica, frutilla y pepino fresco.', precio: 8900, categoria: 'bebidas', momentos: ['after'], dietas: ['vegano', 'sin-gluten'], foto: 'assets/img/carta/gin-tonic-frutilla.jpg' },

    // Desayunos y meriendas
    { id: 'desayuno-power', nombre: 'Desayuno power', descripcion: 'Huevos revueltos, panceta crocante, bagel de sésamo, tomates cherry, verdes y manteca con sumac.', precio: 16900, categoria: 'desayunos', momentos: ['desayuno'], dietas: [], foto: 'assets/img/carta/desayuno-power.jpg', fotoZoom: 1.15 },
    { id: 'medialuna-rellena', nombre: 'Medialuna rellena', descripcion: 'Medialuna de manteca rellena con palta fresca, panceta crocante y huevito a la plancha.', precio: 12900, categoria: 'desayunos', momentos: ['desayuno', 'merienda'], dietas: [], estado: 'destacado', foto: 'assets/img/carta/medialuna-rellena.jpg' },
    { id: 'pancakes', nombre: 'Pancakes con frutos rojos', descripcion: 'Con yogur natural, frutos rojos, pistachos y miel.', precio: 14500, categoria: 'desayunos', momentos: ['desayuno', 'merienda'], dietas: [], estado: 'destacado', foto: 'assets/img/carta/pancakes-frutos-rojos.jpg' },
    { id: 'french-toast', nombre: 'French toast', descripcion: 'Con salsa inglesa, moras, granita de frambuesas, banana brulé, mascarpone cítrico y pistachos.', precio: 15200, categoria: 'desayunos', momentos: ['desayuno', 'merienda'], dietas: [], foto: 'assets/img/carta/french-toast.jpg' },
    { id: 'yogurt-granola', nombre: 'Yogur con granola casera', descripcion: 'Yogur natural, granola casera, escamas de coco, banana y frutos rojos.', precio: 11200, categoria: 'desayunos', momentos: ['desayuno', 'merienda'], dietas: [], foto: 'assets/img/carta/yogurt-granola.jpg' },
    { id: 'brunch-variado', nombre: 'Brunch para compartir', descripcion: 'Una selección de la carta para la mesa: huevos, tostones, pastelería, bebidas y café.', precio: 32000, categoria: 'desayunos', momentos: ['desayuno', 'mediodia'], dietas: [], foto: 'assets/img/carta/brunch-variado.jpg' },

    // Tostones y bowls
    { id: 'avocado-toast', nombre: 'Avocado toast', descripcion: 'Palta fresca, huevo poché, tomates asados y verdes sobre tostada de masa madre.', precio: 17900, categoria: 'tostones', momentos: ['todo'], dietas: ['sin-gluten-opc'], adicionales: ['Bacon +$4.400', 'Queso halloumi +$4.900'], ejecutivo: true, foto: 'assets/img/carta/avocado-toast.jpg', fotoPosicion: 'center 75%' },
    { id: 'brunch-proteico', nombre: 'Plato proteico', descripcion: 'Salmón ahumado, huevos revueltos, palta, tostada de masa madre y frutos secos.', precio: 19800, categoria: 'tostones', momentos: ['desayuno', 'mediodia'], dietas: ['sin-gluten-opc'], ejecutivo: true, foto: 'assets/img/carta/brunch-proteico.jpg' },
    { id: 'proteico-veggie', nombre: 'Proteico veggie', descripcion: 'Huevos revueltos, palta, arvejas, tomates asados, zanahoria, tostada y mix de semillas.', precio: 17400, categoria: 'tostones', momentos: ['desayuno', 'mediodia'], dietas: ['sin-gluten-opc'], ejecutivo: true, foto: 'assets/img/carta/proteico-veggie.jpg' },
    { id: 'tarta-verduras', nombre: 'Tarta de verduras', descripcion: 'Espiral de vegetales de estación sobre masa casera.', precio: 15800, categoria: 'tostones', momentos: ['mediodia'], dietas: [], ejecutivo: true, foto: 'assets/img/carta/tarta-verduras.jpg' },
    { id: 'tarta-portobellos', nombre: 'Tarta de portobellos', descripcion: 'Portobellos, queso fontina, cebollas caramelizadas y tomates cherry.', precio: 16400, categoria: 'tostones', momentos: ['mediodia'], dietas: [], ejecutivo: true, foto: 'assets/img/carta/tarta-portobellos.jpg' },

    // Sándwiches y tostados
    { id: 'scon-trucha', nombre: 'Scon de queso con trucha', descripcion: 'Scon de queso relleno con trucha ahumada, palta, queso crema de lima y cebollita.', precio: 16500, categoria: 'sandwiches', momentos: ['todo'], dietas: [], estado: 'nuevo', foto: 'assets/img/carta/scon-trucha.jpg' },
    { id: 'sandwich-chipa', nombre: 'Sándwich de chipá sin gluten', descripcion: 'Pan de chipá con jamón, queso fundido, tomate y pesto.', precio: 12900, categoria: 'sandwiches', momentos: ['todo'], dietas: ['sin-gluten'], foto: 'assets/img/carta/sandwich-chipa-sin-gluten.jpg' },
    { id: 'croque-madame', nombre: 'Croque madame', descripcion: 'Jamón cocido y queso en pan de masa madre, con bechamel y queso gratinado arriba.', precio: 16200, categoria: 'sandwiches', momentos: ['mediodia', 'after'], dietas: [], foto: 'assets/img/carta/croque-madame.jpg', fotoPosicion: 'center 25%' },

    // Pastelería y laminados
    { id: 'chipa', nombre: 'Chipá', descripcion: 'Recién horneado, con queso.', precio: 2900, categoria: 'pasteleria', momentos: ['todo'], dietas: [], foto: 'assets/img/carta/chipa.jpg' }, // [a validar] ¿se ofrece como sin gluten?
    { id: 'danesa-hibiscus', nombre: 'Danesa de hibiscus', descripcion: 'Laminado de manteca con crema de hibiscus y frutillas frescas.', precio: 5400, categoria: 'pasteleria', momentos: ['desayuno', 'merienda'], dietas: [], foto: 'assets/img/carta/danesa-hibiscus.jpg', fotoPosicion: 'center 25%' },
    { id: 'tarteletas', nombre: 'Tarteletas con merengue', descripcion: 'Masa sablée, crema cítrica y merengue flameado.', precio: 4900, categoria: 'pasteleria', momentos: ['merienda', 'after'], dietas: [], foto: 'assets/img/carta/tarteletas.jpg', fotoPosicion: 'center 72%', fotoZoom: 1.15 },
    { id: 'porcion-cheesecake', nombre: 'Cheesecake de frutos rojos', descripcion: 'Porción, con coulis y frutos rojos frescos.', precio: 7900, categoria: 'pasteleria', momentos: ['merienda', 'after'], dietas: [], estado: 'destacado', foto: 'assets/img/carta/cheesecake-frutos-rojos.jpg', fotoZoom: 1.15 },
    { id: 'porcion-torta-black', nombre: 'Torta black', descripcion: 'Porción. Bizcocho de chocolate, ganache de choco y praliné de avellanas.', precio: 7900, categoria: 'pasteleria', momentos: ['merienda', 'after'], dietas: [], foto: 'assets/img/carta/torta-black.jpg' },
    { id: 'porcion-vascamisu', nombre: 'Vascamisú', descripcion: 'Porción. Torta vasca de café tostado, vainillas embebidas y mascarpone con cacao amargo.', precio: 8400, categoria: 'pasteleria', momentos: ['merienda', 'after'], dietas: [], foto: 'assets/img/carta/vascamisu.jpg' },
    { id: 'budin-limon', nombre: 'Budín de limón', descripcion: 'Con mascarpone de lima, higos y pistachos.', precio: 5600, categoria: 'pasteleria', momentos: ['desayuno', 'merienda'], dietas: [], foto: 'assets/img/carta/budin-limon-higos.jpg' },
    { id: 'budin-banana', nombre: 'Budín de banana', descripcion: 'Con nueces pecan, crema de café y salsa toffee.', precio: 5600, categoria: 'pasteleria', momentos: ['desayuno', 'merienda'], dietas: [], foto: 'assets/img/carta/budin-banana-pecan.jpg' },
    { id: 'cookie-chocolate', nombre: 'Cookie de chocolate', descripcion: 'Con chips de chocolate semiamargo y escamas de sal.', precio: 3200, categoria: 'pasteleria', momentos: ['todo'], dietas: [], foto: 'assets/img/carta/cookie-chocolate-sal.jpg' }
  ],

  // Tortas enteras por encargo
  encargos: {
    condiciones: 'Plazo mínimo 48 h · retiro en el local · seña del 50%', // [a validar]
    anticipacionHoras: 48,
    tortas: [
      { id: 'cheese-frambuesas', nombre: 'Cheese full frambuesas', descripcion: 'Cheesecake cubierto de frambuesas frescas y pistachos. 10 a 12 porciones.', precio: 98000, dietas: [], foto: 'assets/img/carta/cheese-frambuesas-pistachos.jpg' },
      { id: 'cheesecake', nombre: 'Cheesecake de frutos rojos', descripcion: 'Base de galletas, queso crema y frutos rojos. 10 a 12 porciones.', precio: 84000, dietas: [], foto: 'assets/img/carta/cheesecake-frutos-rojos.jpg', fotoZoom: 1.15 },
      { id: 'cheesecake-ddl', nombre: 'Cheesecake de dulce de leche', descripcion: 'Cheesecake horneado con copos de crema, dulce de leche y chocolate rallado. 8 porciones.', precio: 78000, dietas: [], foto: 'assets/img/carta/cheesecake-dulce-de-leche.jpg' },
      { id: 'torta-black', nombre: 'Torta black', descripcion: 'Chocolate, ganache de choco y praliné de avellanas. 12 porciones.', precio: 82000, dietas: [], foto: 'assets/img/carta/torta-black.jpg' },
      { id: 'humeda-sin-gluten', nombre: 'Húmeda de chocolate sin gluten', descripcion: 'Con crema y frutos rojos. Sin gluten en la receta; no está libre de contaminación cruzada. 10 porciones.', precio: 80000, dietas: ['sin-gluten'], foto: 'assets/img/carta/humeda-chocolate-sin-gluten.jpg' },
      { id: 'key-lime-pie', nombre: 'Key lime pie', descripcion: 'Masa crocante, crema de lima y merengue. 10 porciones.', precio: 72000, dietas: [], foto: 'assets/img/carta/key-lime-pie.jpg' },
      { id: 'carrot-cake', nombre: 'Carrot cake', descripcion: 'Bizcocho de zanahoria y especias, frosting de queso crema, nueces y pétalos. 10 a 12 porciones.', precio: 77000, dietas: [], foto: 'assets/img/carta/torta-carrot-cake.jpg' },
      { id: 'choco-crema-almendras', nombre: 'Choco crema con almendras y salsa toffee', descripcion: 'Bizcocho de chocolate, crema, almendras tostadas y salsa toffee. 10 porciones.', precio: 82000, dietas: [], foto: 'assets/img/carta/torta-choco-crema-almendras-toffee.jpg' },
      { id: 'pistacho-frutos-rojos', nombre: 'Pistacho, frutos rojos y ganache de chocolate blanco', descripcion: 'Bizcocho de pistacho, frutos rojos y ganache de chocolate blanco, con cerezas. 12 porciones.', precio: 105000, dietas: [], foto: 'assets/img/carta/torta-pistacho-frutos-rojos.jpg' },
    ]
  }
  ,

  /* ---------- Tienda: café para casa, proveeduría y tortas ----------
     Precios de referencia de mercado [a validar con el local]: el carrito calcula
     un total estimado y el pedido se confirma por WhatsApp.
       preciosPorPeso: { 250: …, 500: … } → precio de cada tamaño de bolsa (venta 'peso')
       precio → por unidad de venta (la docena, la unidad o la torta entera)
     Cada producto puede tener:
       venta: 'unidad' | 'docena' | 'peso'   → cómo se elige la cantidad
       pesos: [250, 500, 1000]                → solo para venta 'peso' (en gramos)
       opciones: { nombre, valores }          → una elección extra (por ej. la molienda)
       contenido: texto corto con peso o porciones que trae
       precio: número (opcional). Si no está, se muestra "Precio a consultar".
       ejemplo: true                          → producto de prueba [reemplazar por los reales]
  ------------------------------------------------------------ */
  tienda: {
    whatsapp: '5491176167815', // [a validar] ¿la proveeduría usa otro número?
    // Checkout: carrito → pago → confirmación
    checkout: {
      // 'demo': el pago es una simulación (se avisa en pantalla y no se cobra nada).
      // Para cobrar de verdad hay que conectar una pasarela (por ej. Mercado Pago Checkout Pro).
      modoPago: 'demo',
      prefijoPedido: 'MU-',
      retiro: { detalle: 'Conesa 2686 · listo en 2 h · sin costo' },
      envio: { costo: 4500, detalle: 'CABA · 24 a 48 h hábiles' }, // [a validar] costo y zona de envío
      cuotas: 3
    },
    secciones: [
      { id: 'cafe', nombre: 'Café para casa', bajada: '' },
      { id: 'proveeduria', nombre: 'Proveeduría', bajada: '' },
      { id: 'tortas', nombre: 'Tortas por encargo', bajada: 'Tortas enteras con al menos 48 h de anticipación. Se retiran en el local.' }
    ],
    productos: [
      // Café para casa: la molienda recomendada para cada origen va primera (queda elegida en la ficha).
      // Notas de cata típicas de cada origen [a validar con el lote y el tueste del local]
      { id: 'cafe-blend', seccion: 'cafe', nombre: 'Blend de la casa', descripcion: 'Brasil y Colombia. Chocolate y caramelo, cuerpo medio y equilibrado. El de todos los días: espresso o café con leche.', contenido: 'Bolsa de 250 g, 500 g o 1 kg', venta: 'peso', pesos: [250, 500, 1000], preciosPorPeso: { 250: 36000, 500: 68000, 1000: 128000 }, opciones: { nombre: 'Molienda', valores: ['Espresso', 'Moka / italiana', 'En grano', 'Filtro (V60 / Chemex)', 'Prensa francesa'] }, foto: 'assets/img/tienda/cafe-bolsa-crema.jpg' },
      { id: 'cafe-brasil', seccion: 'cafe', nombre: 'Brasil Cerrado', descripcion: 'Chocolate, frutos secos y dulzor, con acidez baja y mucho cuerpo. Ideal para espresso, moka o con leche.', contenido: 'Bolsa de 250 g, 500 g o 1 kg', venta: 'peso', pesos: [250, 500, 1000], preciosPorPeso: { 250: 36000, 500: 68000, 1000: 128000 }, opciones: { nombre: 'Molienda', valores: ['Espresso', 'Moka / italiana', 'En grano', 'Filtro (V60 / Chemex)', 'Prensa francesa'] }, foto: 'assets/img/tienda/cafe-bolsa-marron.jpg' },
      { id: 'cafe-colombia', seccion: 'cafe', nombre: 'Colombia Huila', descripcion: 'Caramelo, frutos rojos y un toque cítrico, con acidez media. Versátil: rinde en filtro y en espresso.', contenido: 'Bolsa de 250 g, 500 g o 1 kg', venta: 'peso', pesos: [250, 500, 1000], preciosPorPeso: { 250: 36000, 500: 68000, 1000: 128000 }, opciones: { nombre: 'Molienda', valores: ['Filtro (V60 / Chemex)', 'Espresso', 'En grano', 'Prensa francesa', 'Moka / italiana'] }, foto: 'assets/img/tienda/cafe-bolsa-verde.jpg' },
      { id: 'cafe-etiopia', seccion: 'cafe', nombre: 'Etiopía Yirgacheffe', descripcion: 'Floral, bergamota y frutos rojos, con acidez brillante y cuerpo liviano. Para filtrados que se disfrutan solos.', contenido: 'Bolsa de 250 g, 500 g o 1 kg', venta: 'peso', pesos: [250, 500, 1000], preciosPorPeso: { 250: 36000, 500: 68000, 1000: 128000 }, opciones: { nombre: 'Molienda', valores: ['Filtro (V60 / Chemex)', 'Prensa francesa', 'En grano', 'Espresso', 'Moka / italiana'] }, foto: 'assets/img/tienda/cafe-bolsa-azul.jpg' },
      { id: 'cafe-honduras', seccion: 'cafe', nombre: 'Honduras', descripcion: 'Dulce, con caramelo, durazno y panela, y acidez suave. Muy amable en filtro y prensa francesa.', contenido: 'Bolsa de 250 g, 500 g o 1 kg', venta: 'peso', pesos: [250, 500, 1000], preciosPorPeso: { 250: 36000, 500: 68000, 1000: 128000 }, opciones: { nombre: 'Molienda', valores: ['Filtro (V60 / Chemex)', 'Prensa francesa', 'En grano', 'Espresso', 'Moka / italiana'] }, foto: 'assets/img/tienda/cafe-bolsa-terracota.jpg' },

      // Proveeduría (fotos y productos reales; descripciones a revisar con el local)
      { id: 'alfajores', seccion: 'proveeduria', nombre: 'Alfajores sablé', descripcion: 'Masa sablée con frutos secos. De almendras con dulce de leche o de pistacho con chocolate blanco.', contenido: 'Por docena', venta: 'docena', precio: 36000, opciones: { nombre: 'Sabor', valores: ['Almendras y dulce de leche', 'Pistacho y chocolate blanco'] }, foto: 'assets/img/tienda/alfajores-almendra-pistacho.jpg' },
      { id: 'cookies-rellenas', seccion: 'proveeduria', nombre: 'Cookies de chocolate rellenas', descripcion: 'Cookie húmeda de chocolate, rellena de crema de chocolate con leche.', contenido: 'Por docena', venta: 'docena', precio: 38000, foto: 'assets/img/tienda/cookie-chocolate-rellena.jpg', fotoPosicion: 'center 45%' },
      { id: 'budin-carrot', seccion: 'proveeduria', nombre: 'Budín carrot cake', descripcion: 'Zanahoria, especias y nueces, con frosting de queso crema, ralladura de naranja y pétalos.', contenido: 'Entero', venta: 'unidad', precio: 28000, foto: 'assets/img/tienda/budin-carrot-cake.jpg' },
      { id: 'budin-banana-choco', seccion: 'proveeduria', nombre: 'Budín de banana', descripcion: 'Con cobertura de ganache de chocolate, coco en láminas y pétalos.', contenido: 'Entero', venta: 'unidad', precio: 26000, foto: 'assets/img/tienda/budin-banana-chocolate-coco.jpg', fotoPosicion: 'center 60%' },
      { id: 'chipa', seccion: 'proveeduria', nombre: 'Chipá', descripcion: 'Con queso. Ideal para tener en el freezer y hornear cuando lo necesites.', contenido: 'Por unidad', venta: 'unidad', precio: 450, opciones: { nombre: 'Presentación', valores: ['Congelado', 'Para hornear'] }, foto: 'assets/img/tienda/chipa.jpg' },
      { id: 'scones', seccion: 'proveeduria', nombre: 'Scones', descripcion: 'Para servir tibios o rellenar a gusto.', contenido: 'Por unidad', venta: 'unidad', precio: 900, opciones: { nombre: 'Presentación', valores: ['Congelado', 'Para hornear'] }, foto: 'assets/img/carta/scon-trucha.jpg', fotoProvisoria: true }
    ]
  }
};

/* Las tortas por encargo también se piden desde la Tienda (mismos datos que la página Encargos) */
MUCHO.tienda.productos.push(...MUCHO.encargos.tortas.map((t) => {
  const porciones = t.descripcion.match(/(\d+(?: a \d+)?) porciones/);
  return {
    id: `torta-${t.id}`, seccion: 'tortas', nombre: t.nombre, descripcion: t.descripcion,
    contenido: porciones ? `Entera · ${porciones[1]} porciones` : 'Entera',
    venta: 'unidad', precio: t.precio, dietas: t.dietas,
    foto: t.foto, fotoPosicion: t.fotoPosicion, fotoZoom: t.fotoZoom,
    anticipacionHoras: MUCHO.encargos.anticipacionHoras
  };
}));

/* ---------- Utilidades compartidas ---------- */

const formatoPrecio = (n) => '$' + n.toLocaleString('es-AR');

const ICONOS = {
  vegano: '<img class="tag__icono" src="assets/img/iconos/icono-vegano.png" alt="" width="16" height="16">',
  'sin-gluten': '<img class="tag__icono" src="assets/img/iconos/icono-sin-gluten.png" alt="" width="16" height="16">'
};

// Devuelve el HTML de las etiquetas de dieta de un ítem
function etiquetasDieta(dietas) {
  return dietas.map((d) => {
    if (d === 'vegano') return `<span class="tag tag--dieta">${ICONOS.vegano}Vegano</span>`;
    if (d === 'sin-gluten') return `<span class="tag tag--dieta">${ICONOS['sin-gluten']}Sin gluten</span>`;
    if (d === 'sin-gluten-opc') return `<span class="tag tag--dieta">${ICONOS['sin-gluten']}Sin gluten (opc.)</span>`;
    return '';
  }).join('');
}

// Foto del ítem o, si todavía no hay, un espacio reservado con su nombre
// Subí este número cada vez que se reemplace o edite una foto, para que el navegador no muestre la vieja
const VERSION_FOTOS = 8;

function fotoHTML(foto, alt, clase = '', posicion = '', zoom = 1) {
  const reglas = [];
  if (posicion) reglas.push(`object-position: ${posicion}`);
  if (zoom && zoom !== 1) reglas.push(`transform: scale(${zoom})`, `transform-origin: ${posicion || 'center'}`);
  const estilo = reglas.length ? ` style="${reglas.join('; ')};"` : '';
  if (foto) return `<img class="foto ${clase}" src="${foto}?v=${VERSION_FOTOS}" alt="${alt}" loading="lazy"${estilo}>`;
  return `<div class="foto foto--vacia ${clase}" role="img" aria-label="Foto: ${alt}"><span>Foto · ${alt}</span></div>`;
}
