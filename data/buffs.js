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
    id: "escudo", nombre: "Escudo",
    duracionRondas: 1, concentracion: false,
    efectos: { ca: 5 }                      // hasta el inicio del siguiente turno del lanzador
  },
  {
    id: "favor_divino", nombre: "Favor divino",
    duracionRondas: 10, concentracion: false,
    efectos: { danoArma: { dado: "1d4", tipo: "radiante" } }
  },
  {
    id: "resistencia_acido", nombre: "Resistencia al ácido",
    duracionRondas: null, concentracion: false,   // 1 hora: dura todo el combate; se pierde con el descanso largo
    efectos: { resistencias: ["ácido"] }
  },
  {
    id: "guia", nombre: "Guía",
    duracionRondas: 10, concentracion: true,
    efectos: { pruebaExtraDado: "1d4" }
  }
];
