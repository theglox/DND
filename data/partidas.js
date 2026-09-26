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
  }
];
