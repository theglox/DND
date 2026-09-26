// Enemigos — Manual de Monstruos 2024. Fuente: /hojas (villanos.pdf).
// Acción: { bonusAtaque | cd+salvacion, dano, tipoDano, danoExtra: [{dado, tipo}], recarga: "5-6", usosPorDia }
window.DATA_ENEMIGOS = [
  {
    id: "chillon",
    nombre: "Hongo chillón", en: "Shrieker Fungus",
    tipo: "Planta mediana, sin alineamiento",
    pgMax: 13, pgFormula: "3d8",
    ca: 5,
    velocidad: 5,
    atributos: { FUE: 1, DES: 1, CON: 10, INT: 1, SAB: 3, CAR: 1 },
    salvaciones: {},
    bonusIniciativa: -5,
    sentidos: "Vista ciega 30 ft",
    resistencias: [], inmunidades: [], vulnerabilidades: [],
    inmuneCondiciones: ["Cegado", "Hechizado", "Ensordecido", "Asustado"],
    rasgos: [],
    acciones: [],
    reacciones: [
      { nombre: "Chillido",
        texto: "Disparador: una criatura o fuente de luz brillante se mueve a 30 ft. Emite un chillido audible a 300 ft durante 1 minuto o hasta morir." }
    ],
    vd: "0"
  },
  {
    id: "sombra",
    nombre: "Sombra", en: "Shadow",
    tipo: "Muerto viviente mediano, caótico malvado",
    pgMax: 27, pgFormula: "5d8+5",
    ca: 12,
    velocidad: 40,
    atributos: { FUE: 6, DES: 14, CON: 13, INT: 6, SAB: 10, CAR: 8 },
    salvaciones: {},
    bonusIniciativa: 2,
    sentidos: "Visión en la oscuridad 60 ft",
    vulnerabilidades: ["radiante"],
    resistencias: ["ácido", "frío", "fuego", "relámpago", "trueno"],
    inmunidades: ["necrótico", "veneno"],
    inmuneCondiciones: ["Agotamiento", "Asustado", "Agarrado", "Paralizado", "Petrificado",
                        "Envenenado", "Derribado", "Apresado", "Inconsciente"],
    rasgos: [
      { nombre: "Amorfa", texto: "Puede pasar por espacios de 1 pulgada sin gastar movimiento extra." },
      { nombre: "Debilidad solar", texto: "A la luz del sol tiene desventaja en todas las pruebas de d20." }
    ],
    acciones: [
      { nombre: "Zarpazo drenante", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 4, dano: "1d6+2", tipoDano: "necrótico",
        efectoAlGolpear: "La FUE del objetivo baja 1d4. Si llega a 0, muere. Un humanoide muerto así se levanta como Sombra 1d4 horas después." }
    ],
    accionesAdicionales: [
      { nombre: "Sigilo sombrío", texto: "En luz tenue u oscuridad, realiza la acción Esconderse." }
    ],
    vd: "1/2"
  },
  {
    id: "arana_gigante",
    nombre: "Araña gigante", en: "Giant Spider",
    tipo: "Bestia grande, sin alineamiento",
    pgMax: 26, pgFormula: "4d10+4",
    ca: 14,
    velocidad: 30, velocidadExtra: "trepar 30 ft",
    atributos: { FUE: 14, DES: 16, CON: 12, INT: 2, SAB: 11, CAR: 4 },
    salvaciones: {},
    bonusIniciativa: 3,
    sentidos: "Visión en la oscuridad 60 ft",
    resistencias: [], inmunidades: [], vulnerabilidades: [], inmuneCondiciones: [],
    rasgos: [
      { nombre: "Trepar cual arácnido", texto: "Trepa superficies difíciles, incluso techos, sin pruebas." },
      { nombre: "Caminante de telarañas", texto: "Ignora las restricciones de movimiento de las telarañas y sabe dónde está cualquier criatura que toque su misma telaraña." }
    ],
    acciones: [
      { nombre: "Mordisco", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 5, dano: "1d8+3", tipoDano: "perforante",
        danoExtra: [{ dado: "2d6", tipo: "veneno" }] },
      { nombre: "Telaraña", recarga: "5-6", alcance: "60 ft",
        cd: 13, salvacion: "DES",
        aplicaCondicion: "Apresado",
        efectoAlFallar: "Apresado hasta que se destruya la telaraña (CA 10, 5 PG, vulnerable al fuego, inmune a veneno y psíquico)." }
    ],
    vd: "1"
  },
  {
    id: "gnoll_guerrero",
    nombre: "Guerrero gnoll", en: "Gnoll Warrior",
    tipo: "Infernal mediano, caótico malvado",
    pgMax: 27, pgFormula: "6d8",
    ca: 15,
    velocidad: 30,
    atributos: { FUE: 14, DES: 12, CON: 11, INT: 6, SAB: 10, CAR: 7 },
    salvaciones: {},
    bonusIniciativa: 1,
    sentidos: "Visión en la oscuridad 60 ft",
    resistencias: [], inmunidades: [], vulnerabilidades: [], inmuneCondiciones: [],
    rasgos: [],
    acciones: [
      { nombre: "Desgarrar", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 4, dano: "1d6+2", tipoDano: "perforante" },
      { nombre: "Arco de hueso", tipo: "distancia", alcance: "150/600 ft",
        bonusAtaque: 3, dano: "1d10+1", tipoDano: "perforante" }
    ],
    accionesAdicionales: [
      { nombre: "Frenesí", usosPorDia: 1,
        texto: "Justo después de dañar a una criatura ya Maltrecha (a la mitad de PG o menos), se mueve hasta la mitad de su velocidad y hace un ataque de Desgarrar." }
    ],
    vd: "1/2"
  },
  {
    id: "goblin_guerrero",
    nombre: "Guerrero goblin", en: "Goblin Warrior",
    tipo: "Feérico (goblinoide) pequeño, caótico neutral",
    pgMax: 10, pgFormula: "3d6",
    ca: 15,
    velocidad: 30,
    atributos: { FUE: 8, DES: 15, CON: 10, INT: 10, SAB: 8, CAR: 8 },
    salvaciones: {},
    bonusIniciativa: 2,
    sentidos: "Visión en la oscuridad 60 ft",
    resistencias: [], inmunidades: [], vulnerabilidades: [], inmuneCondiciones: [],
    rasgos: [],
    acciones: [
      { nombre: "Cimitarra", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 4, dano: "1d6+2", tipoDano: "cortante",
        extraConVentaja: { dado: "1d4", tipo: "cortante" } },
      { nombre: "Arco corto", tipo: "distancia", alcance: "80/320 ft",
        bonusAtaque: 4, dano: "1d6+2", tipoDano: "perforante",
        extraConVentaja: { dado: "1d4", tipo: "perforante" } }
    ],
    accionesAdicionales: [
      { nombre: "Huida ágil", texto: "Destrabarse o Esconderse." }
    ],
    vd: "1/4"
  },
  {
    id: "miconido_adulto",
    nombre: "Micónido adulto", en: "Myconid Adult",
    tipo: "Planta mediana, legal neutral",
    pgMax: 16, pgFormula: "3d8+3",
    ca: 12,
    velocidad: 20,
    atributos: { FUE: 10, DES: 10, CON: 12, INT: 10, SAB: 13, CAR: 7 },
    salvaciones: {},
    bonusIniciativa: 0,
    sentidos: "Visión en la oscuridad 60 ft · Telepatía 240 ft",
    resistencias: [], inmunidades: [], vulnerabilidades: [], inmuneCondiciones: [],
    rasgos: [
      { nombre: "Enfermedad solar", texto: "A la luz del sol tiene desventaja en las pruebas de d20; muere si pasa más de 1 hora al sol." }
    ],
    acciones: [
      { nombre: "Golpe", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 2, dano: "1d8", tipoDano: "contundente",
        danoExtra: [{ dado: "1d6", tipo: "veneno" }] },
      { nombre: "Esporas pacificadoras", usosPorDia: 1, alcance: "10 ft",
        cd: 11, salvacion: "CON",
        aplicaCondicion: "Aturdido",
        efectoAlFallar: "Aturdido; repite la salvación al final de cada uno de sus turnos y termina si la supera (éxito automático tras 1 minuto)." },
      { nombre: "Esporas de afinidad", alcance: "emanación 30 ft",
        texto: "Las criaturas con INT 2+ que no sean constructos, elementales ni muertos vivientes ganan telepatía de 30 ft durante 1 hora." }
    ],
    vd: "1/2"
  },
  {
    id: "engendro_demogorgon",
    nombre: "Engendro de Demogorgon", en: "Demogorgon Spawn",
    tipo: "Infernal (demonio) mediano, caótico malvado",
    pgMax: 44, pgFormula: "8d8+8",
    ca: 15,
    velocidad: 40,
    atributos: { FUE: 17, DES: 15, CON: 13, INT: 8, SAB: 12, CAR: 7 },
    salvaciones: {},
    bonusIniciativa: 2,
    sentidos: "Vista ciega 60 ft",
    resistencias: ["frío", "relámpago"],
    inmunidades: ["veneno"],
    vulnerabilidades: [],
    inmuneCondiciones: ["Hechizado", "Asustado", "Envenenado"],
    regeneracion: 5,                          // al inicio de su turno si tiene ≥ 1 PG
    rasgos: [
      { nombre: "Presencia funesta", texto: "Las fuentes de luz en una emanación de 60 ft parpadean; la luz brillante no mágica pasa a ser tenue." },
      { nombre: "Regeneración", texto: "Recupera 5 PG al inicio de cada uno de sus turnos si tiene al menos 1 PG." },
      { nombre: "Salto con carrerilla", texto: "Con 10 ft de carrerilla, salto largo de hasta 30 ft." }
    ],
    multiataque: { texto: "Hace dos ataques de Garra.", ataques: ["Garra", "Garra"] },
    acciones: [
      { nombre: "Mordisco", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 5, dano: "1d4+3", tipoDano: "perforante",
        efectoAlGolpear: "Si es Mediano o menor: Agarrado (escapar CD 13). Mientras esté agarrado, queda Cegado.",
        aplicaCondicionAlGolpear: ["Agarrado", "Cegado"] },
      { nombre: "Garra", tipo: "cuerpo a cuerpo", alcance: "10 ft",
        bonusAtaque: 5, dano: "1d6+3", tipoDano: "cortante" }
    ],
    vd: "2"
  }
];
