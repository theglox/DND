// Personajes jugadores. Fuente: hojas en /hojas (PDF).
window.DATA_PJS = [
  {
    id: "lady_applejack",
    nombre: "Lady Applejack",
    jugador: "Erica Sinclair",
    especie: "Elfo (linaje: Elfo del bosque)",
    clase: "Pícaro", subclase: null, nivel: 1,
    trasfondo: "Criminal",
    alineamiento: "Caótico bueno",
    tamano: "Mediano",

    pgMax: 10,
    dadoGolpe: "1d8",
    ca: 14,                                   // Armadura de cuero 11 + DES 3
    armadura: "Armadura de cuero",
    velocidad: 35,
    competencia: 2,
    atributos: { FUE: 8, DES: 17, CON: 14, INT: 14, SAB: 12, CAR: 10 },
    salvacionesCompetentes: ["DES", "INT"],
    bonusIniciativa: 5,                       // DES +3 + competencia (dote Alerta)
    sentidos: "Visión en la oscuridad 60 ft",

    resistencias: [], inmunidades: [], vulnerabilidades: [],
    ventajaSalvacionContra: ["Hechizado"],    // Linaje feérico
    inmuneA: ["Dormir mágico"],               // Trance

    competenciaArmas: { sencillas: true, marciales: "sutil_ligera" },
    armas: ["espada_corta", "daga", "arco_corto"],
    maestrias: ["espada_corta", "daga", "arco_corto"],
    dotes: ["Alerta"],

    trucos: ["druidismo"],
    atributoConjuro: "INT",                   // solo para los hechizos del linaje élfico
    espaciosConjuro: {},

    ataqueFurtivo: "1d6",
    rasgos: [
      { nombre: "Ataque furtivo (1d6)", combate: true,
        texto: "Una vez por turno, +1d6 de daño a una criatura que golpees con arma sutil o a distancia si tienes ventaja, o si un aliado no incapacitado está a 5 ft del objetivo y no tienes desventaja." },
      { nombre: "Maestría con armas", combate: true,
        texto: "Mella (daga): el ataque extra de arma ligera va dentro de la acción de Ataque, una vez por turno. Fastidiar (arco corto, espada corta): si golpeas y haces daño, ventaja en tu siguiente ataque contra esa criatura antes del final de tu próximo turno." },
      { nombre: "Alerta (dote)", combate: true,
        texto: "Suma la competencia a la iniciativa (ya incluido). Justo después de tirar iniciativa puede intercambiarla con un aliado dispuesto que no esté incapacitado." },
      { nombre: "Pericia", combate: false,
        texto: "Competencia doble en Juego de manos y Sigilo (+7)." },
      { nombre: "Jerga de ladrones", combate: false, texto: "" },
      { nombre: "Visión en la oscuridad", combate: false, texto: "60 ft." },
      { nombre: "Linaje feérico", combate: true,
        texto: "Ventaja en salvaciones para evitar o terminar la condición Hechizado." },
      { nombre: "Sentidos agudos", combate: false, texto: "Competencia en Perspicacia." },
      { nombre: "Trance", combate: true,
        texto: "No necesita dormir y la magia no puede dormirla (inmune a Dormir)." }
    ],

    habilidades: {
      "Acrobacias": 5, "Atletismo": -1, "Arcanos": 2, "Engaño": 0, "Historia": 2,
      "Perspicacia": 3, "Intimidación": 0, "Investigación": 4, "Medicina": 1,
      "Naturaleza": 2, "Percepción": 1, "Interpretación": 0, "Persuasión": 0,
      "Religión": 2, "Juego de manos": 7, "Sigilo": 7, "Supervivencia": 1,
      "Trato con animales": 1
    },

    inventario: [
      { nombre: "Daga", cantidad: 2 },
      { objetoId: "flechas", nombre: "Flechas", cantidad: 20 },
      { objetoId: "aceite", nombre: "Frasco de aceite", cantidad: 7,
        texto: "Sustituye un ataque: objetivo a 20 ft, salvación de DES CD 13 o queda cubierto de aceite 1 min; si recibe daño de fuego, +5 de fuego." },
      { objetoId: "bolas_rodamiento", nombre: "Bolas de rodamiento", cantidad: 1,
        texto: "Acción Utilizar: área de 10×10 ft a 10 ft. Quien entre por primera vez en un turno: salvación de DES CD 10 o Derribado." },
      { nombre: "Herramientas de ladrón", cantidad: 1 },
      { nombre: "Linterna sorda", cantidad: 1 },
      { nombre: "Palanca", cantidad: 1 }
    ],
    oro: 58
  },

  // ------------------------------------------------------------------
  {
    id: "will_el_sabio",
    nombre: "Will el Sabio",
    jugador: "Will Byers",
    especie: "Humano",
    clase: "Mago", subclase: null, nivel: 1,
    trasfondo: "Escriba",
    alineamiento: "Neutral bueno",
    tamano: "Mediano",

    pgMax: 9,                                 // 6 + CON 1 + Duro 2
    dadoGolpe: "1d6",
    ca: 11,                                   // sin armadura: 10 + DES 1 (Armadura de mago → 14)
    armadura: "Sin armadura",
    velocidad: 30,
    competencia: 2,
    atributos: { FUE: 8, DES: 13, CON: 12, INT: 16, SAB: 16, CAR: 10 },
    salvacionesCompetentes: ["INT", "SAB"],
    bonusIniciativa: 1,
    sentidos: null,
    inspiracionHeroica: true,                 // Ingenioso: la gana en cada descanso largo

    resistencias: [], inmunidades: [], vulnerabilidades: [],

    competenciaArmas: { sencillas: true, marciales: false },
    armas: ["baston", "daga"],
    maestrias: [],
    dotes: ["Hábil", "Duro"],

    trucos: ["luz", "mano_de_mago", "rayo_de_escarcha"],
    atributoConjuro: "INT",
    espaciosConjuro: { 1: 2 },
    maxPreparados: 4,
    libroConjuros: ["rociada_de_color", "salto", "proyectil_magico", "armadura_de_mago", "dormir", "onda_atronadora"],

    rasgos: [
      { nombre: "Lanzamiento de conjuros", combate: true,
        texto: "2 espacios de nivel 1. Prepara 4 hechizos de su libro tras cada descanso largo. Foco: el bastón." },
      { nombre: "Recuperación arcana", combate: false,
        texto: "Tras un descanso corto recupera 1 espacio de nivel 1 (una vez por descanso largo)." },
      { nombre: "Ingenioso", combate: true,
        texto: "Gana Inspiración heroica en cada descanso largo." },
      { nombre: "Duro (dote)", combate: false, texto: "+2 PG por nivel (incluido)." },
      { nombre: "Hábil (dote)", combate: false, texto: "Historia, Medicina y Naturaleza." }
    ],

    inventario: [
      { nombre: "Daga", cantidad: 2 },
      { objetoId: "aceite", nombre: "Frasco de aceite", cantidad: 10,
        texto: "Sustituye un ataque: objetivo a 20 ft, salvación de DES CD 11 o queda cubierto de aceite 1 min; si recibe daño de fuego, +5 de fuego." },
      { nombre: "Libro sobre Demogorgon", cantidad: 1,
        texto: "+5 a pruebas de INT (Religión) sobre el demonio Demogorgon si lo consulta." },
      { nombre: "Lámpara", cantidad: 1 }
    ],
    oro: 55
  },

  // ------------------------------------------------------------------
  {
    id: "sundar",
    nombre: "Sundar el Audaz",
    jugador: "Lucas Sinclair",
    especie: "Humano",
    clase: "Guerrero", subclase: null, nivel: 1,
    trasfondo: "Soldado",
    alineamiento: "Neutral bueno",
    tamano: "Mediano",

    pgMax: 15,                                // 10 + CON 3 + Duro 2
    dadoGolpe: "1d10",
    ca: 17,                                   // Cota de malla 16 + estilo Defensa 1
    armadura: "Cota de malla (desventaja en Sigilo)",
    velocidad: 30,
    competencia: 2,
    atributos: { FUE: 16, DES: 13, CON: 16, INT: 10, SAB: 8, CAR: 12 },
    salvacionesCompetentes: ["FUE", "CON"],
    bonusIniciativa: 1,
    sentidos: null,
    inspiracionHeroica: true,

    resistencias: [], inmunidades: [], vulnerabilidades: [],

    competenciaArmas: { sencillas: true, marciales: true },
    armas: ["gran_espada", "mayal", "lanza", "jabalina", "ballesta_ligera"],
    maestrias: ["gran_espada", "mayal", "lanza", "jabalina", "ballesta_ligera"],
    dotes: ["Atacante salvaje", "Duro"],

    trucos: [],
    atributoConjuro: null,
    espaciosConjuro: {},

    tiradaDobleDano: true,                    // Atacante salvaje
    rasgos: [
      { nombre: "Tomar aliento", combate: true,
        texto: "Acción adicional: recupera 1d10 + 1 PG. 2 usos (recupera 1 en descanso corto, todos en largo)." },
      { nombre: "Atacante salvaje (dote)", combate: true,
        texto: "Una vez por turno, al golpear con un arma, tira los dados de daño dos veces y usa el resultado que prefiera." },
      { nombre: "Estilo de combate: Defensa", combate: true,
        texto: "+1 a la CA con armadura (incluido)." },
      { nombre: "Maestría con armas", combate: true,
        texto: "Rozar (gran espada): si falla, 3 de daño cortante igualmente. Socavar (mayal, lanza): si golpea, el objetivo tiene desventaja en su siguiente ataque antes del inicio de tu próximo turno. Ralentizar (jabalina, ballesta ligera): si golpea y hace daño, −10 ft de velocidad hasta el inicio de tu próximo turno." },
      { nombre: "Ingenioso", combate: true,
        texto: "Gana Inspiración heroica en cada descanso largo." },
      { nombre: "Duro (dote)", combate: false, texto: "+2 PG por nivel (incluido)." }
    ],

    recursos: [
      { id: "tomar_aliento", nombre: "Tomar aliento", usos: 2, recarga: "1 en corto / todos en largo" }
    ],

    inventario: [
      { nombre: "Jabalina", cantidad: 8 },
      { objetoId: "virotes", nombre: "Virotes", cantidad: 20 },
      { objetoId: "abrojos", nombre: "Abrojos", cantidad: 1,
        texto: "Acción Utilizar: cuadro de 5 ft a 5 ft. Quien entre por primera vez en un turno: salvación de DES CD 15 o 1 de daño perforante y velocidad 0 hasta el inicio de su siguiente turno." },
      { objetoId: "aceite", nombre: "Frasco de aceite", cantidad: 2,
        texto: "Sustituye un ataque: objetivo a 20 ft, salvación de DES CD 11 o queda cubierto de aceite 1 min; si recibe daño de fuego, +5 de fuego." },
      { objetoId: "kit_sanador", nombre: "Kit de sanador", cantidad: 10,
        texto: "Acción Utilizar: estabiliza a una criatura a 0 PG sin tirada." },
      { nombre: "Antorcha", cantidad: 10,
        texto: "Como arma sencilla cuerpo a cuerpo: 1 de daño de fuego." },
      { nombre: "Cuerda", cantidad: 1 }
    ],
    oro: 28
  },

  // ------------------------------------------------------------------
  {
    id: "nog",
    nombre: "Nog el Enano",
    jugador: "Dustin Henderson",
    especie: "Enano",
    clase: "Clérigo", subclase: null, nivel: 1,
    trasfondo: "Granjero",
    alineamiento: "Neutral bueno",
    tamano: "Mediano",

    pgMax: 12,                                // 8 + CON 1 + Duro 2 + Dureza enana 1
    dadoGolpe: "1d8",
    ca: 18,                                   // Cota de malla 16 + escudo 2
    armadura: "Cota de malla + escudo (desventaja en Sigilo)",
    velocidad: 30,
    competencia: 2,
    atributos: { FUE: 16, DES: 8, CON: 13, INT: 10, SAB: 16, CAR: 12 },
    salvacionesCompetentes: ["SAB", "CAR"],
    bonusIniciativa: -1,
    sentidos: "Visión en la oscuridad 120 ft",

    resistencias: ["veneno"], inmunidades: [], vulnerabilidades: [],
    ventajaSalvacionContra: ["Envenenado"],

    competenciaArmas: { sencillas: true, marciales: true },
    armas: ["hacha_batalla", "maza"],
    maestrias: [],
    dotes: ["Duro"],

    trucos: ["guia", "llama_sagrada", "estabilizar"],
    atributoConjuro: "SAB",
    espaciosConjuro: { 1: 2 },
    maxPreparados: 4,

    rasgos: [
      { nombre: "Lanzamiento de conjuros", combate: true,
        texto: "2 espacios de nivel 1. Prepara 4 hechizos de clérigo tras cada descanso largo. Foco: símbolo sagrado en el escudo." },
      { nombre: "Orden divina: Protector", combate: false,
        texto: "Competencia con armas marciales y armadura pesada (incluido)." },
      { nombre: "Resiliencia enana", combate: true,
        texto: "Resistencia al daño de veneno y ventaja en salvaciones para evitar o terminar la condición Envenenado." },
      { nombre: "Dureza enana", combate: false, texto: "+1 PG por nivel (incluido)." },
      { nombre: "Conocimiento de la piedra", combate: true,
        texto: "Acción adicional: sentido de la vibración 60 ft durante 10 min si toca piedra. 2 usos por descanso largo." },
      { nombre: "Duro (dote)", combate: false, texto: "+2 PG por nivel (incluido)." }
    ],

    recursos: [
      { id: "conocimiento_piedra", nombre: "Conocimiento de la piedra", usos: 2, recarga: "largo" }
    ],

    inventario: [
      { nombre: "Escudo", cantidad: 1 },
      { objetoId: "agua_bendita", nombre: "Agua bendita", cantidad: 1,
        texto: "Sustituye un ataque: objetivo a 20 ft, salvación de DES CD 9 o 2d8 radiante si es infernal o muerto viviente." },
      { objetoId: "kit_sanador", nombre: "Kit de sanador", cantidad: 10,
        texto: "Acción Utilizar: estabiliza a una criatura a 0 PG sin tirada." },
      { nombre: "Lámpara", cantidad: 1 }
    ],
    oro: 22
  },

  // ------------------------------------------------------------------
  {
    id: "tayr",
    nombre: "Tayr",
    jugador: "Mike Wheeler",
    especie: "Mediano",
    clase: "Paladín", subclase: null, nivel: 1,
    trasfondo: "Noble",
    alineamiento: "Legal bueno",
    tamano: "Pequeño",

    pgMax: 11,                                // 10 + CON 1
    dadoGolpe: "1d10",
    ca: 18,                                   // Cota de malla 16 + escudo 2
    armadura: "Cota de malla + escudo (desventaja en Sigilo)",
    velocidad: 30,
    competencia: 2,
    atributos: { FUE: 17, DES: 10, CON: 12, INT: 8, SAB: 14, CAR: 14 },
    salvacionesCompetentes: ["SAB", "CAR"],
    bonusIniciativa: 0,
    sentidos: null,

    resistencias: [], inmunidades: [], vulnerabilidades: [],
    ventajaSalvacionContra: ["Asustado"],     // Valiente
    suerteMediano: true,                      // repite los 1 naturales en pruebas de d20

    competenciaArmas: { sencillas: true, marciales: true },
    armas: ["espada_larga", "jabalina"],
    maestrias: ["espada_larga", "jabalina"],
    dotes: ["Hábil"],

    trucos: [],
    atributoConjuro: "CAR",
    espaciosConjuro: { 1: 2 },
    maxPreparados: 2,

    rasgos: [
      { nombre: "Imposición de manos (5 PG)", combate: true,
        texto: "Acción adicional: toca a una criatura (o a sí mismo) y restaura PG de una reserva de 5 por descanso largo. Gastando 5 puntos elimina Envenenado (esos puntos no curan)." },
      { nombre: "Lanzamiento de conjuros", combate: true,
        texto: "2 espacios de nivel 1. Prepara 2 hechizos de paladín. Foco: símbolo sagrado en el escudo." },
      { nombre: "Maestría con armas", combate: true,
        texto: "Socavar (espada larga): si golpea, el objetivo tiene desventaja en su siguiente ataque antes del inicio de tu próximo turno. Ralentizar (jabalina): si golpea y hace daño, −10 ft de velocidad hasta el inicio de tu próximo turno." },
      { nombre: "Suerte", combate: true,
        texto: "Cuando saca un 1 natural en una prueba de d20, lo repite y debe usar el nuevo resultado." },
      { nombre: "Valiente", combate: true,
        texto: "Ventaja en salvaciones para evitar o terminar la condición Asustado." },
      { nombre: "Agilidad de mediano", combate: true,
        texto: "Puede moverse por el espacio de criaturas de un tamaño mayor, sin detenerse en él." },
      { nombre: "Sigiloso por naturaleza", combate: false,
        texto: "Puede Esconderse aunque solo le oculte una criatura al menos un tamaño mayor." },
      { nombre: "Hábil (dote)", combate: false, texto: "Intimidación, Religión y Sigilo." }
    ],

    recursos: [
      { id: "imposicion_manos", nombre: "Imposición de manos", reserva: 5, recarga: "largo" }
    ],

    inventario: [
      { nombre: "Escudo", cantidad: 1 },
      { nombre: "Jabalina", cantidad: 8 },
      { objetoId: "agua_bendita", nombre: "Agua bendita", cantidad: 1,
        texto: "Sustituye un ataque: objetivo a 20 ft, salvación de DES CD 10 o 2d8 radiante si es infernal o muerto viviente." },
      { objetoId: "kit_sanador", nombre: "Kit de sanador", cantidad: 10,
        texto: "Acción Utilizar: estabiliza a una criatura a 0 PG sin tirada." },
      { nombre: "Perfume", cantidad: 1,
        texto: "1 hora: ventaja en CAR (Persuasión) para influir a un humanoide indiferente a 5 ft." },
      { nombre: "Lámpara", cantidad: 1 }
    ],
    oro: 39
  }
];
