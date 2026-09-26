// Trucos (nivel 0) y hechizos de nivel 1 — PHB 2024.
// resolucion: "ataque" | "salvacion" | "automatico" | "curacion" | "buff" | "utilidad"
window.DATA_HECHIZOS = [
  // ---------------- Trucos ----------------
  {
    id: "druidismo", nombre: "Druidismo", en: "Druidcraft",
    nivel: 0, clases: ["Druida"],
    tiempo: "acción", alcance: "30 ft",
    resolucion: "utilidad", concentracion: false,
    texto: "Efectos menores de naturaleza: predecir el tiempo, hacer florecer una planta, efecto sensorial inofensivo, encender o apagar una pequeña llama."
  },
  {
    id: "luz", nombre: "Luz", en: "Light",
    nivel: 0, clases: ["Mago", "Clérigo"],
    tiempo: "acción", alcance: "toque",
    resolucion: "utilidad", concentracion: false,
    texto: "Un objeto emite luz brillante en 20 ft y tenue 20 ft más durante 1 hora."
  },
  {
    id: "mano_de_mago", nombre: "Mano de mago", en: "Mage Hand",
    nivel: 0, clases: ["Mago"],
    tiempo: "acción", alcance: "30 ft",
    resolucion: "utilidad", concentracion: false,
    texto: "Mano espectral que manipula objetos de hasta 10 lb durante 1 minuto."
  },
  {
    id: "rayo_de_escarcha", nombre: "Rayo de escarcha", en: "Ray of Frost",
    nivel: 0, clases: ["Mago"],
    tiempo: "acción", alcance: "60 ft",
    resolucion: "ataque", ataque: "distancia",
    dano: "1d8", tipoDano: "frío",
    concentracion: false,
    efectoAlGolpear: "Velocidad −10 ft hasta el inicio de tu siguiente turno.",
    texto: "Ataque de conjuro a distancia. 1d8 de frío y −10 ft de velocidad."
  },
  {
    id: "guia", nombre: "Guía", en: "Guidance",
    nivel: 0, clases: ["Clérigo"],
    tiempo: "acción", alcance: "toque",
    resolucion: "buff", concentracion: true, duracionRondas: 10,
    aplicaBuff: "guia",
    texto: "Una criatura dispuesta elige una habilidad: +1d4 a sus pruebas de esa habilidad durante 1 min."
  },
  {
    id: "llama_sagrada", nombre: "Llama sagrada", en: "Sacred Flame",
    nivel: 0, clases: ["Clérigo"],
    tiempo: "acción", alcance: "60 ft",
    resolucion: "salvacion", salvacion: "DES", alSalvar: "nada",
    dano: "1d8", tipoDano: "radiante",
    concentracion: false,
    texto: "Salvación de DES o 1d8 radiante. No se beneficia de cobertura media ni de tres cuartos."
  },
  {
    id: "estabilizar", nombre: "Preservar la vida", en: "Spare the Dying",
    nivel: 0, clases: ["Clérigo"],
    tiempo: "acción", alcance: "15 ft",
    resolucion: "utilidad", concentracion: false,
    texto: "Una criatura a 0 PG queda estable."
  },

  // ---------------- Nivel 1 ----------------
  {
    id: "rociada_de_color", nombre: "Rociada de color", en: "Color Spray",
    nivel: 1, clases: ["Mago"],
    tiempo: "acción", alcance: "cono 15 ft", area: "cono 15 ft",
    resolucion: "salvacion", salvacion: "CON", alSalvar: "nada",
    aplicaCondicion: "Cegado", duracionCondicion: "hasta el final de tu siguiente turno",
    concentracion: false,
    texto: "Cada criatura en el cono: salvación de CON o Cegada hasta el final de tu siguiente turno."
  },
  {
    id: "salto", nombre: "Salto", en: "Jump",
    nivel: 1, clases: ["Mago"],
    tiempo: "acción adicional", alcance: "toque",
    resolucion: "utilidad", concentracion: false, duracionRondas: 10,
    texto: "Durante 1 min, puede saltar hasta 30 ft gastando 10 ft de movimiento."
  },
  {
    id: "proyectil_magico", nombre: "Proyectil mágico", en: "Magic Missile",
    nivel: 1, clases: ["Mago"],
    tiempo: "acción", alcance: "120 ft",
    resolucion: "automatico", dardos: 3,
    dano: "1d4+1", tipoDano: "fuerza",
    concentracion: false,
    texto: "3 dardos que impactan siempre, 1d4 + 1 de fuerza cada uno; se pueden repartir entre objetivos."
  },
  {
    id: "armadura_de_mago", nombre: "Armadura de mago", en: "Mage Armor",
    nivel: 1, clases: ["Mago"],
    tiempo: "acción", alcance: "toque",
    resolucion: "buff", aplicaBuff: "armadura_de_mago",
    concentracion: false,
    texto: "Criatura sin armadura: CA base 13 + DES durante 8 horas."
  },
  {
    id: "dormir", nombre: "Dormir", en: "Sleep",
    nivel: 1, clases: ["Mago"],
    tiempo: "acción", alcance: "60 ft", area: "esfera 5 ft de radio",
    resolucion: "salvacion", salvacion: "SAB", alSalvar: "nada",
    aplicaCondicion: "Incapacitado",
    exitoAutomatico: "sin_sueno",             // elfos (Trance) e inmunes a Agotamiento
    concentracion: true, duracionRondas: 10,
    texto: "Salvación de SAB o Incapacitado hasta el final de su siguiente turno; entonces repite la salvación y si falla queda Inconsciente. Criaturas que no duermen (elfos) o inmunes al agotamiento tienen éxito automático."
  },
  {
    id: "onda_atronadora", nombre: "Onda atronadora", en: "Thunderwave",
    nivel: 1, clases: ["Mago"],
    tiempo: "acción", alcance: "cubo 15 ft", area: "cubo 15 ft desde ti",
    resolucion: "salvacion", salvacion: "CON", alSalvar: "mitad",
    dano: "2d8", tipoDano: "trueno",
    concentracion: false,
    efectoAlFallar: "Empujado 10 ft.",
    texto: "Salvación de CON: 2d8 de trueno y empujado 10 ft; mitad y sin empuje si salva."
  },
  {
    id: "bendecir", nombre: "Bendecir", en: "Bless",
    nivel: 1, clases: ["Clérigo"],
    tiempo: "acción", alcance: "30 ft", objetivos: 3,
    resolucion: "buff", aplicaBuff: "bendecir",
    concentracion: true, duracionRondas: 10,
    texto: "Hasta 3 criaturas suman 1d4 a sus tiradas de ataque y de salvación durante 1 min."
  },
  {
    id: "saeta_guia", nombre: "Saeta guía", en: "Guiding Bolt",
    nivel: 1, clases: ["Clérigo"],
    tiempo: "acción", alcance: "120 ft",
    resolucion: "ataque", ataque: "distancia",
    dano: "4d6", tipoDano: "radiante",
    concentracion: false,
    efectoAlGolpear: "El siguiente ataque contra el objetivo antes del final de tu siguiente turno tiene ventaja.",
    texto: "Ataque de conjuro a distancia: 4d6 radiante y ventaja al siguiente ataque contra él."
  },
  {
    id: "curar_heridas", nombre: "Curar heridas", en: "Cure Wounds",
    nivel: 1, clases: ["Clérigo"],
    tiempo: "acción", alcance: "toque",
    resolucion: "curacion", curacion: "2d8", sumaModConjuro: true,
    concentracion: false,
    texto: "Recupera 2d8 + modificador de conjuro PG."
  },
  {
    id: "escudo_de_fe", nombre: "Escudo de fe", en: "Shield of Faith",
    nivel: 1, clases: ["Clérigo"],
    tiempo: "acción adicional", alcance: "60 ft",
    resolucion: "buff", aplicaBuff: "escudo_de_fe",
    concentracion: true, duracionRondas: 100,
    texto: "+2 a la CA de una criatura durante 10 min."
  },
  {
    id: "orden_imperiosa", nombre: "Orden imperiosa", en: "Command",
    nivel: 1, clases: ["Paladín", "Clérigo"],
    tiempo: "acción", alcance: "60 ft",
    resolucion: "salvacion", salvacion: "SAB", alSalvar: "nada",
    concentracion: false,
    efectoAlFallar: "En su siguiente turno obedece una orden de una palabra: Acércate, Suelta, Huye, Arrástrate (queda Derribado) o Alto.",
    texto: "Salvación de SAB o, en su siguiente turno, obedece una orden: Acércate, Suelta, Huye, Arrástrate o Alto."
  },
  {
    id: "castigo_abrasador", nombre: "Castigo abrasador", en: "Searing Smite",
    nivel: 1, clases: ["Paladín"],
    tiempo: "acción adicional (justo tras golpear)", alcance: "personal",
    resolucion: "castigo", disparador: "golpe cuerpo a cuerpo con arma o sin armas",
    danoExtra: "1d6", tipoDano: "fuego",
    concentracion: false, duracionRondas: 10,
    efectoPorTurno: { dano: "1d6", tipoDano: "fuego", salvacion: "CON", terminaAlSalvar: true },
    texto: "Al golpear: +1d6 de fuego. Al inicio de cada turno del objetivo: 1d6 de fuego y salvación de CON; si la supera, termina."
  }
];
