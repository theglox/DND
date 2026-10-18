// Personajes jugadores. Fuente: hojas en /hojas (PDF).
window.DATA_PJS = [
  {
    id: "lady_applejack",
    nombre: "Lady Applejack",
    jugador: "Erica Sinclair",
    especie: "Elfo (linaje: Elfo del bosque)",
    clase: "Pícaro", subclase: null, nivel: 2,
    trasfondo: "Criminal",
    alineamiento: "Caótico bueno",
    tamano: "Mediano",

    pgMax: 17,                                // nv1 8+2 · nv2 5+2 (CON 2)
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
    equipoInicial: { enMano: ["arma:espada_corta", "arma:daga"] },   // armas en la mano al empezar
    armas: ["espada_corta", "daga", "arco_corto"],
    maestrias: ["espada_corta", "daga", "arco_corto"],
    dotes: ["Alerta"],

    trucos: ["druidismo"],
    atributoConjuro: "INT",                   // solo para los hechizos del linaje élfico
    espaciosConjuro: {},

    ataqueFurtivo: "1d6",
    accionAstuta: true,                       // nv 2: Correr, Destrabarse o Esconderse como acción adicional
    rasgos: [
      { nombre: "Acción astuta", combate: true,
        texto: "En su turno puede Correr, Destrabarse o Esconderse como acción adicional." },
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
      "Acrobacias": 5, "Atletismo": -1, "Arcanos": 2, "Engaño": 2, "Historia": 2,
      "Perspicacia": 3, "Intimidación": 0, "Investigación": 4, "Medicina": 1,
      "Naturaleza": 2, "Percepción": 3, "Interpretación": 0, "Persuasión": 0,
      "Religión": 2, "Juego de manos": 7, "Sigilo": 7, "Supervivencia": 1,
      "Trato con animales": 1
    },

    inventario: [
      { nombre: "Daga", cantidad: 2 },
      { objetoId: "flechas", nombre: "Flechas", cantidad: 15 },              // 20 − 5 perdidas en el libro 1
      { objetoId: "aceite", nombre: "Frasco de aceite", cantidad: 6,         // 7 − 1 gastado en el libro 1
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
    clase: "Mago", subclase: null, nivel: 2,
    trasfondo: "Escriba",
    alineamiento: "Neutral bueno",
    tamano: "Mediano",

    pgMax: 16,                                // nv1 6+1+2 · nv2 4+1+2 (CON 1, Duro 2/nivel)
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
    equipoInicial: { enMano: ["arma:baston"] },   // armas en la mano al empezar
    armas: ["baston", "daga"],
    maestrias: [],
    dotes: ["Hábil", "Duro"],

    trucos: ["luz", "mano_de_mago", "rayo_de_escarcha"],
    atributoConjuro: "INT",
    espaciosConjuro: { 1: 3 },
    maxPreparados: 5,
    recuperacionArcana: true,                 // descanso corto: recupera 1 espacio (1/descanso largo)
    libroConjuros: ["manos_ardientes", "rociada_de_color", "salto", "armadura_de_mago", "proyectil_magico",
                    "escudo", "dormir", "onda_atronadora"],

    rasgos: [
      { nombre: "Lanzamiento de conjuros", combate: true,
        texto: "3 espacios de nivel 1. Prepara 5 hechizos de su libro tras cada descanso largo. CD 13, ataque +5. Foco: el bastón." },
      { nombre: "Escudo (si está preparado)", combate: true,
        texto: "Reacción al ser golpeado: +5 CA hasta el inicio de su turno. Aparece como casilla dentro del ataque enemigo." },
      { nombre: "Erudito", combate: false,
        texto: "Pericia en Arcanos (+7)." },
      { nombre: "Recuperación arcana", combate: false,
        texto: "Tras un descanso corto recupera 1 espacio de nivel 1 (una vez por descanso largo)." },
      { nombre: "Ingenioso", combate: true,
        texto: "Gana Inspiración heroica en cada descanso largo." },
      { nombre: "Duro (dote)", combate: false, texto: "+2 PG por nivel (incluido)." },
      { nombre: "Hábil (dote)", combate: false, texto: "Historia, Medicina y Naturaleza." }
    ],

    habilidades: {
      "Acrobacias": 1, "Atletismo": -1, "Arcanos": 7, "Engaño": 0, "Historia": 5,
      "Perspicacia": 5, "Intimidación": 0, "Investigación": 5, "Medicina": 5,
      "Naturaleza": 5, "Percepción": 5, "Interpretación": 0, "Persuasión": 0,
      "Religión": 3, "Juego de manos": 3, "Sigilo": 1, "Supervivencia": 3,
      "Trato con animales": 3
    },

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
    clase: "Guerrero", subclase: null, nivel: 2,
    trasfondo: "Soldado",
    alineamiento: "Neutral bueno",
    tamano: "Mediano",

    pgMax: 26,                                // nv1 10+3+2 · nv2 6+3+2 (CON 3, Duro 2/nivel)
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
    equipoInicial: { enMano: ["arma:gran_espada"] },   // armas en la mano al empezar
    armas: ["gran_espada", "mayal", "lanza", "jabalina", "ballesta_ligera"],
    maestrias: ["gran_espada", "mayal", "lanza", "jabalina", "ballesta_ligera"],
    dotes: ["Atacante salvaje", "Duro"],

    trucos: [],
    atributoConjuro: null,
    espaciosConjuro: {},

    tiradaDobleDano: true,                    // Atacante salvaje
    menteTactica: true,                       // nv 2: Tomar aliento para pruebas de característica
    rasgos: [
      { nombre: "Tomar aliento", combate: true,
        texto: "Acción adicional: recupera 1d10 + 2 PG (nivel de guerrero). 2 usos (recupera 1 en descanso corto, todos en largo)." },
      { nombre: "Oleada de acción", combate: true,
        texto: "En su turno puede hacer una acción más (no la acción Magia). 1 uso por descanso corto o largo." },
      { nombre: "Mente táctica", combate: false,
        texto: "Al fallar una prueba de característica puede gastar un uso de Tomar aliento: en vez de curar, tira 1d10 y lo suma a la prueba. Si aun así falla, no gasta el uso. (Panel de pruebas de la historia.)" },
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
      { id: "tomar_aliento", nombre: "Tomar aliento", usos: 2, recarga: "1 en corto / todos en largo" },
      { id: "oleada_accion", nombre: "Oleada de acción", usos: 1, recarga: "corto" }
    ],

    habilidades: {
      "Acrobacias": 1, "Atletismo": 5, "Arcanos": 0, "Engaño": 1, "Historia": 0,
      "Perspicacia": 1, "Intimidación": 3, "Investigación": 0, "Medicina": -1,
      "Naturaleza": 0, "Percepción": 1, "Interpretación": 1, "Persuasión": 1,
      "Religión": 0, "Juego de manos": 1, "Sigilo": 1, "Supervivencia": -1,
      "Trato con animales": -1
    },

    inventario: [
      { nombre: "Jabalina", cantidad: 8 },
      { objetoId: "virotes", nombre: "Virotes", cantidad: 20 },
      { objetoId: "abrojos", nombre: "Abrojos", cantidad: 0,                 // gastados en el libro 1
        texto: "Acción Utilizar: cuadro de 5 ft a 5 ft. Quien entre por primera vez en un turno: salvación de DES CD 15 o 1 de daño perforante y velocidad 0 hasta el inicio de su siguiente turno." },
      { objetoId: "aceite", nombre: "Frasco de aceite", cantidad: 1,         // 2 − 1 gastado en el libro 1
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
    clase: "Clérigo", subclase: null, nivel: 2,
    trasfondo: "Granjero",
    alineamiento: "Neutral bueno",
    tamano: "Mediano",

    pgMax: 21,                                // nv1 8+1+2+1 · nv2 5+1+2+1 (CON 1, Duro 2, Dureza enana 1)
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
    escudo: 2,                                // +2 CA (incluido en ca) mientras lo lleve puesto
    equipoInicial: { enMano: ["arma:hacha_batalla"], escudo: true },   // armas en la mano al empezar
    armas: ["hacha_batalla", "maza"],
    maestrias: [],
    dotes: ["Duro"],

    trucos: ["guia", "llama_sagrada", "estabilizar"],
    atributoConjuro: "SAB",
    espaciosConjuro: { 1: 3 },
    maxPreparados: 5,
    rasgosConjuro: ["chispa_divina_curar", "chispa_divina_danar", "expulsar_muertos"],   // Canalizar divinidad

    rasgos: [
      { nombre: "Lanzamiento de conjuros", combate: true,
        texto: "3 espacios de nivel 1. Prepara 5 hechizos de clérigo tras cada descanso largo. CD 13, ataque +5. Foco: símbolo sagrado." },
      { nombre: "Canalizar divinidad", combate: true,
        texto: "2 usos (recupera 1 en descanso corto, todos en largo). Acción Magia, CD 13. Chispa divina: a 30 ft, cura 1d8 + 3 PG, o salvación de CON o 1d8 + 3 radiante/necrótico (mitad si supera). Expulsar muertos vivientes: los muertos vivientes a 30 ft hacen salvación de SAB o quedan Asustados e Incapacitados 1 min (termina si reciben daño)." },
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
      { id: "conocimiento_piedra", nombre: "Conocimiento de la piedra", usos: 2, recarga: "largo" },
      { id: "canalizar_divinidad", nombre: "Canalizar divinidad", usos: 2, recarga: "1 en corto / todos en largo", sinBoton: true }
    ],

    habilidades: {
      "Acrobacias": -1, "Atletismo": 3, "Arcanos": 0, "Engaño": 1, "Historia": 0,
      "Perspicacia": 5, "Intimidación": 1, "Investigación": 0, "Medicina": 5,
      "Naturaleza": 2, "Percepción": 3, "Interpretación": 1, "Persuasión": 1,
      "Religión": 0, "Juego de manos": -1, "Sigilo": -1, "Supervivencia": 3,
      "Trato con animales": 5
    },

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
    clase: "Paladín", subclase: null, nivel: 2,
    trasfondo: "Noble",
    alineamiento: "Legal bueno",
    tamano: "Pequeño",

    pgMax: 18,                                // nv1 10+1 · nv2 6+1 (CON 1)
    dadoGolpe: "1d10",
    ca: 19,                                   // Cota de malla 16 + estilo Defensa 1 + escudo 2
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
    escudo: 2,                                // +2 CA (incluido en ca) mientras lo lleve puesto
    equipoInicial: { enMano: ["arma:espada_larga"], escudo: true },   // armas en la mano al empezar
    armas: ["espada_larga", "jabalina"],
    maestrias: ["espada_larga", "jabalina"],
    dotes: ["Hábil"],

    trucos: [],
    atributoConjuro: "CAR",
    espaciosConjuro: { 1: 2 },
    maxPreparados: 3,
    siemprePreparados: ["castigo_divino"],    // Castigo del paladín

    rasgos: [
      { nombre: "Imposición de manos (10 PG)", combate: true,
        texto: "Acción adicional: toca a una criatura (o a sí mismo) y restaura PG de una reserva de 10 por descanso largo. Gastando 5 puntos elimina Envenenado (esos puntos no curan)." },
      { nombre: "Lanzamiento de conjuros", combate: true,
        texto: "2 espacios de nivel 1. Castigo divino siempre preparado + 3 hechizos de paladín. CD 12, ataque +4. Foco: símbolo sagrado en el escudo." },
      { nombre: "Castigo del paladín", combate: true,
        texto: "Castigo divino siempre preparado; una vez por descanso largo puede lanzarlo sin gastar espacio (la casilla del ataque lo usa primero)." },
      { nombre: "Estilo de combate: Defensa", combate: true,
        texto: "+1 a la CA con armadura (incluido)." },
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
      { id: "imposicion_manos", nombre: "Imposición de manos", reserva: 10, recarga: "largo" },
      { id: "castigo_paladin", nombre: "Castigo del paladín", usos: 1, recarga: "largo", sinBoton: true }
    ],

    habilidades: {
      "Acrobacias": 0, "Atletismo": 5, "Arcanos": -1, "Engaño": 2, "Historia": 1,
      "Perspicacia": 4, "Intimidación": 4, "Investigación": -1, "Medicina": 2,
      "Naturaleza": -1, "Percepción": 2, "Interpretación": 2, "Persuasión": 4,
      "Religión": 1, "Juego de manos": 0, "Sigilo": 2, "Supervivencia": 2,
      "Trato con animales": 2
    },

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
