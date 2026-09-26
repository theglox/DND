// Efectos de sonido por sección de la historia (ids de los títulos: d1…d6, s1…s6, etc.).
// Los archivos van en assets/sonidos/. Nada suena solo: cada sección muestra sus botones ▶.
// bucle: true → se repite hasta que lo pares.
window.DATA_SONIDOS = {
  carpeta: "assets/sonidos/",
  secciones: {
    "d1": [
      { archivo: "d1_rugido_lejano.mp3", nombre: "Rugido lejano" }
    ],
    "d2": [
      { archivo: "d2_moscas.mp3", nombre: "Moscas" }
    ],
    "d3": [
      { archivo: "engendro_devorando.mp3", nombre: "Engendro devorando" }
    ],
    "terror-en-el-laberinto": [
      { archivo: "engendro_devorando.mp3", nombre: "Engendro devorando" }
    ],
    "d4": [
      { archivo: "d4_forja_martillos.mp3", nombre: "Forja y martillos", bucle: true }
    ],
    "d6": [
      { archivo: "d6_ritual_gnolls.mp3", nombre: "Ritual de los gnolls" },
      { archivo: "d6_risa_altar.mp3", nombre: "Risa del altar" }
    ],
    "s6": [
      { archivo: "s6_reloj_campana.mp3", nombre: "Reloj y campana" }
    ]
  }
};
