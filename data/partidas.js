// Partidas: hechizos de nivel 1 preparados por cada PJ y botín disponible en esa sesión.
window.DATA_PARTIDAS = [
  {
    id: "prueba",
    nombre: "Partida de prueba",
    preparados: {
      lady_applejack: [],
      sundar: [],
      will_el_sabio: ["proyectil_magico", "armadura_de_mago", "dormir", "onda_atronadora"],
      nog: ["bendecir", "saeta_guia", "curar_heridas", "escudo_de_fe"],
      tayr: ["orden_imperiosa", "castigo_abrasador"]
    },
    enemigos: ["goblin_guerrero"],
    // Objetos que se pueden recoger en la mazmorra (ids de data/objetos.js)
    botin: ["lengua_de_fuego", "varita_secretos", "mayal_mas1", "pocion_curacion", "pocion_curacion"]
  },
  {
    id: "libro2",
    nombre: "Libro 2 · Grito de la Cosecha (nivel 2)",
    // Sugerencia de hechizos preparados (se pueden cambiar en Preparar → Ficha)
    preparados: {
      lady_applejack: [],
      sundar: [],
      will_el_sabio: ["proyectil_magico", "escudo", "dormir", "manos_ardientes", "armadura_de_mago"],
      nog: ["bendecir", "saeta_guia", "curar_heridas", "escudo_de_fe", "detectar_bien_mal"],
      tayr: ["favor_divino", "orden_imperiosa", "castigo_abrasador"]
    },
    enemigos: [],
    // Al elegirla, los inventarios se cargan de la ficha (ya descuenta lo gastado en el libro 1)
    inventarioDeFicha: true,
    // Objetos (ids de data/objetos.js). Los que ya llevan desde el libro 1 traen portador
    // (y sintonización si la necesitan); el resto se encuentra en esta aventura.
    botin: [
      { id: "mayal_mas1", portador: "sundar" },
      { id: "gorro_desaparicion", portador: "lady_applejack", sintonizado: true },
      { id: "varita_secretos", portador: "will_el_sabio" },
      { id: "lengua_de_fuego", portador: "tayr", sintonizado: true },
      { id: "pocion_curacion", portador: "sundar" },
      { id: "pocion_curacion", portador: "nog" },
      "kukri_veneno", "periapto_salud", "pocion_resistencia_acido", "dardo_mas1"
    ]
  }
];
