// Buffs, efectos y objetos mágicos.
window.DATA_BUFFS = [
  {
    id: "bendecir", nombre: "Bendecir",
    duracionRondas: 10, concentracion: true,
    efectos: { ataqueExtraDado: "1d4", salvacionExtraDado: "1d4" }
  },
  {
    id: "escudo_de_fe", nombre: "Escudo de fe",
    duracionRondas: 100, concentracion: true,
    efectos: { ca: 2 }
  },
  {
    id: "armadura_de_mago", nombre: "Armadura de mago",
    duracionRondas: null, concentracion: false,
    efectos: { caBase: 13 }                 // 13 + DES, solo sin armadura
  },
  {
    id: "guia", nombre: "Guía",
    duracionRondas: 10, concentracion: true,
    efectos: { pruebaExtraDado: "1d4" }
  }
];
