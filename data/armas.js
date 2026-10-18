// Armas. "atributo": FUE, DES o "sutil" (usa el mayor de FUE/DES).
// "versatil": dado de daño si se usa a dos manos. "categoria": sencilla | marcial.
window.DATA_ARMAS = [
  {
    id: "espada_corta", nombre: "Espada corta", en: "Shortsword",
    categoria: "marcial",
    tipo: "cuerpo a cuerpo", atributo: "sutil",
    dano: "1d6", tipoDano: "perforante",
    bonusAtaque: 0, bonusDano: 0,
    propiedades: ["sutil", "ligera"],
    maestria: "Fastidiar", maestriaEn: "Vex",
    alcance: "5 ft"
  },
  {
    id: "daga", nombre: "Daga", en: "Dagger",
    categoria: "sencilla",
    tipo: "cuerpo a cuerpo", atributo: "sutil",
    dano: "1d4", tipoDano: "perforante",
    bonusAtaque: 0, bonusDano: 0,
    propiedades: ["sutil", "ligera", "arrojadiza"],
    maestria: "Mella", maestriaEn: "Nick",
    alcance: "5 ft", distancia: "20/60"
  },
  {
    id: "arco_corto", nombre: "Arco corto", en: "Shortbow",
    categoria: "sencilla",
    tipo: "distancia", atributo: "DES",
    dano: "1d6", tipoDano: "perforante",
    bonusAtaque: 0, bonusDano: 0,
    propiedades: ["munición", "a dos manos"],
    maestria: "Fastidiar", maestriaEn: "Vex",
    distancia: "80/320", municion: "Flechas"
  },
  {
    id: "baston", nombre: "Bastón", en: "Quarterstaff",
    categoria: "sencilla",
    tipo: "cuerpo a cuerpo", atributo: "FUE",
    dano: "1d6", versatil: "1d8", tipoDano: "contundente",
    bonusAtaque: 0, bonusDano: 0,
    propiedades: ["versátil"],
    maestria: "Derribar", maestriaEn: "Topple",
    alcance: "5 ft"
  },
  {
    id: "espada_larga", nombre: "Espada larga", en: "Longsword",
    categoria: "marcial",
    tipo: "cuerpo a cuerpo", atributo: "FUE",
    dano: "1d8", versatil: "1d10", tipoDano: "cortante",
    bonusAtaque: 0, bonusDano: 0,
    propiedades: ["versátil"],
    maestria: "Socavar", maestriaEn: "Sap",
    alcance: "5 ft"
  },
  {
    id: "gran_espada", nombre: "Gran espada", en: "Greatsword",
    categoria: "marcial",
    tipo: "cuerpo a cuerpo", atributo: "FUE",
    dano: "2d6", tipoDano: "cortante",
    bonusAtaque: 0, bonusDano: 0,
    propiedades: ["pesada", "a dos manos"],
    maestria: "Rozar", maestriaEn: "Graze",
    alcance: "5 ft"
  },
  {
    id: "mayal", nombre: "Mayal", en: "Flail",
    categoria: "marcial",
    tipo: "cuerpo a cuerpo", atributo: "FUE",
    dano: "1d8", tipoDano: "contundente",
    bonusAtaque: 0, bonusDano: 0,
    propiedades: [],
    maestria: "Socavar", maestriaEn: "Sap",
    alcance: "5 ft"
  },
  {
    id: "lanza", nombre: "Lanza", en: "Spear",
    categoria: "sencilla",
    tipo: "cuerpo a cuerpo", atributo: "FUE",
    dano: "1d6", versatil: "1d8", tipoDano: "perforante",
    bonusAtaque: 0, bonusDano: 0,
    propiedades: ["arrojadiza", "versátil"],
    maestria: "Socavar", maestriaEn: "Sap",
    alcance: "5 ft", distancia: "20/60"
  },
  {
    id: "jabalina", nombre: "Jabalina", en: "Javelin",
    categoria: "sencilla",
    tipo: "cuerpo a cuerpo", atributo: "FUE",
    dano: "1d6", tipoDano: "perforante",
    bonusAtaque: 0, bonusDano: 0,
    propiedades: ["arrojadiza"],
    maestria: "Ralentizar", maestriaEn: "Slow",
    alcance: "5 ft", distancia: "30/120"
  },
  {
    id: "ballesta_ligera", nombre: "Ballesta ligera", en: "Light Crossbow",
    categoria: "sencilla",
    tipo: "distancia", atributo: "DES",
    dano: "1d8", tipoDano: "perforante",
    bonusAtaque: 0, bonusDano: 0,
    propiedades: ["munición", "carga", "a dos manos"],
    maestria: "Ralentizar", maestriaEn: "Slow",
    distancia: "80/320", municion: "Virotes"
  },
  {
    id: "hacha_batalla", nombre: "Hacha de batalla", en: "Battleaxe",
    categoria: "marcial",
    tipo: "cuerpo a cuerpo", atributo: "FUE",
    dano: "1d8", versatil: "1d10", tipoDano: "cortante",
    bonusAtaque: 0, bonusDano: 0,
    propiedades: ["versátil"],
    maestria: "Derribar", maestriaEn: "Topple",
    alcance: "5 ft"
  },
  {
    id: "dardo", nombre: "Dardo", en: "Dart",
    categoria: "sencilla",
    tipo: "distancia", atributo: "sutil",
    dano: "1d4", tipoDano: "perforante",
    bonusAtaque: 0, bonusDano: 0,
    propiedades: ["sutil", "arrojadiza"],
    maestria: "Fastidiar", maestriaEn: "Vex",
    distancia: "20/60"
  },
  {
    id: "maza", nombre: "Maza", en: "Mace",
    categoria: "sencilla",
    tipo: "cuerpo a cuerpo", atributo: "FUE",
    dano: "1d6", tipoDano: "contundente",
    bonusAtaque: 0, bonusDano: 0,
    propiedades: [],
    maestria: "Socavar", maestriaEn: "Sap",
    alcance: "5 ft"
  }
];
