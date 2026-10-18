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
  },

  // ===================== Libro 2 · Grito de la Cosecha (enemigos2.pdf) =====================
  {
    id: "ankheg", libro: "libro2",
    nombre: "Ankheg", en: "Ankheg",
    tipo: "Monstruosidad grande, sin alineamiento",
    pgMax: 45, pgFormula: "6d10+12",
    ca: 14,
    velocidad: 30, velocidadExtra: "excavar 10 ft",
    atributos: { FUE: 17, DES: 11, CON: 14, INT: 1, SAB: 13, CAR: 6 },
    salvaciones: {},
    bonusIniciativa: 0,
    sentidos: "Visión en la oscuridad 60 ft · Sentido de la vibración 60 ft",
    resistencias: [], inmunidades: [], vulnerabilidades: [], inmuneCondiciones: [],
    rasgos: [
      { nombre: "Excavador", texto: "Excava roca sólida a la mitad de su velocidad de excavar y deja un túnel de 10 ft de diámetro." }
    ],
    recordatorios: [
      { en: "ataque", titulo: "Mordisco contra su presa",
        texto: "¿El objetivo está Agarrado por este ankheg? → elige Ventaja en la tirada." }
    ],
    acciones: [
      { nombre: "Mordisco", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 5, dano: "2d6+3", tipoDano: "cortante",
        danoExtra: [{ dado: "1d6", tipo: "ácido" }],
        efectoAlGolpear: "Si es Grande o menor: Agarrado (escapar CD 13). Contra un objetivo que tenga agarrado, el Mordisco tiene ventaja.",
        aplicaCondicionAlGolpear: ["Agarrado"] },
      { nombre: "Rociada ácida", recarga: "6", alcance: "línea de 30 × 5 ft",
        cd: 12, salvacion: "DES",
        dano: "4d6", tipoDano: "ácido", alSalvar: "mitad" }
    ],
    vd: "2"
  },
  {
    id: "demoperro", libro: "libro2",
    nombre: "Demoperro", en: "Demodog",
    tipo: "Infernal (demonio) pequeño, caótico malvado",
    pgMax: 27, pgFormula: "6d6+6",
    ca: 14,
    velocidad: 50,
    atributos: { FUE: 16, DES: 15, CON: 12, INT: 6, SAB: 12, CAR: 6 },
    salvaciones: {},
    bonusIniciativa: 2,
    sentidos: "Vista ciega 60 ft · Sigilo +4",
    resistencias: ["frío", "relámpago"],
    inmunidades: ["veneno"],
    vulnerabilidades: [],
    inmuneCondiciones: ["Envenenado"],
    rasgos: [
      { nombre: "Tácticas de manada", texto: "Ventaja en el ataque si un aliado no Incapacitado está a 5 ft del objetivo." }
    ],
    recordatorios: [
      { en: "ataque", titulo: "Tácticas de manada",
        texto: "¿Hay un aliado del demoperro (no Incapacitado) a 5 ft del objetivo? → elige Ventaja en la tirada." }
    ],
    acciones: [
      { nombre: "Mordisco", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 5, dano: "1d10+3", tipoDano: "perforante",
        efectoAlGolpear: "Si es Mediano o menor: queda Derribado.",
        aplicaCondicionAlGolpear: ["Derribado"] }
    ],
    vd: "1"
  },
  {
    id: "espantapajaros", libro: "libro2",
    nombre: "Espantapájaros", en: "Scarecrow",
    tipo: "Constructo mediano, caótico malvado",
    pgMax: 27, pgFormula: "6d8",
    ca: 11,
    velocidad: 30,
    atributos: { FUE: 11, DES: 13, CON: 11, INT: 10, SAB: 10, CAR: 13 },
    salvaciones: {},
    bonusIniciativa: 3,
    sentidos: "Visión en la oscuridad 60 ft",
    resistencias: [],
    inmunidades: ["veneno"],
    vulnerabilidades: ["fuego"],
    inmuneCondiciones: ["Hechizado", "Agotamiento", "Asustado", "Paralizado", "Petrificado", "Envenenado", "Inconsciente"],
    rasgos: [],
    recordatorios: [
      { en: "turno", titulo: "Fin del miedo",
        texto: "Al TERMINAR este turno, quien quedó Asustado por este espantapájaros en su turno anterior deja de estarlo; si fue por la Mirada, quita también Paralizado.",
        quitar: ["Asustado", "Paralizado"] }
    ],
    acciones: [
      { nombre: "Garra terrorífica", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 3, dano: "2d4+1", tipoDano: "cortante",
        efectoAlGolpear: "Queda Asustado hasta el final del siguiente turno del espantapájaros.",
        aplicaCondicionAlGolpear: ["Asustado"] },
      { nombre: "Mirada aterradora", alcance: "30 ft, una criatura que vea",
        cd: 11, salvacion: "SAB",
        aplicaCondicion: ["Asustado", "Paralizado"],
        efectoAlFallar: "Asustado hasta el final del siguiente turno del espantapájaros; mientras esté Asustado, también Paralizado (quita ambas a la vez)." }
    ],
    vd: "1"
  },
  {
    id: "enredadera_atrapante", libro: "libro2",
    nombre: "Enredadera atrapante", en: "Vine Blight Tangler",
    tipo: "Planta mediana, neutral malvada",
    pgMax: 19, pgFormula: "3d8+6",
    ca: 12,
    velocidad: 20,
    atributos: { FUE: 15, DES: 8, CON: 14, INT: 5, SAB: 10, CAR: 3 },
    salvaciones: {},
    bonusIniciativa: -1,
    sentidos: "Vista ciega 60 ft · Sigilo +1",
    resistencias: [], inmunidades: [], vulnerabilidades: [],
    inmuneCondiciones: ["Ensordecido"],
    rasgos: [],
    recordatorios: [
      { en: "turno", titulo: "Fin de las enredaderas",
        texto: "Al EMPEZAR este turno termina el Apresado de sus Enredaderas atrapantes (el Agarrado de la Enredadera constrictora sigue).",
        quitar: ["Apresado"] }
    ],
    acciones: [
      { nombre: "Enredadera constrictora", tipo: "cuerpo a cuerpo", alcance: "10 ft",
        bonusAtaque: 4, dano: "1d10+2", tipoDano: "contundente",
        efectoAlGolpear: "Si es Grande o menor: Agarrado (escapar CD 12) por una de sus tres enredaderas.",
        aplicaCondicionAlGolpear: ["Agarrado"] },
      { nombre: "Enredaderas atrapantes", recarga: "5-6", alcance: "esfera de 10 ft a 60 ft",
        cd: 12, salvacion: "FUE",
        aplicaCondicion: "Apresado",
        efectoAlFallar: "Apresado hasta el inicio del siguiente turno de la enredadera." }
    ],
    vd: "1/2"
  },
  {
    id: "hongo_violeta", libro: "libro2",
    nombre: "Hongo violeta", en: "Violet Fungus",
    tipo: "Planta mediana, sin alineamiento",
    pgMax: 18, pgFormula: "4d8",
    ca: 5,
    velocidad: 5,
    atributos: { FUE: 3, DES: 1, CON: 10, INT: 1, SAB: 3, CAR: 1 },
    salvaciones: {},
    bonusIniciativa: -5,
    sentidos: "Vista ciega 30 ft",
    resistencias: [], inmunidades: [], vulnerabilidades: [],
    inmuneCondiciones: ["Cegado", "Hechizado", "Ensordecido", "Asustado"],
    rasgos: [],
    multiataque: { texto: "Hace dos ataques de Toque putrefacto.", ataques: ["Toque putrefacto", "Toque putrefacto"] },
    acciones: [
      { nombre: "Toque putrefacto", tipo: "cuerpo a cuerpo", alcance: "10 ft",
        bonusAtaque: 2, dano: "1d8", tipoDano: "necrótico" }
    ],
    vd: "1/4"
  },
  {
    id: "plaga_aguja", libro: "libro2",
    nombre: "Plaga aguja", en: "Needle Blight",
    tipo: "Planta mediana, neutral malvada",
    pgMax: 16, pgFormula: "3d8+3",
    ca: 12,
    velocidad: 30,
    atributos: { FUE: 12, DES: 12, CON: 13, INT: 4, SAB: 8, CAR: 3 },
    salvaciones: {},
    bonusIniciativa: 1,
    sentidos: "Vista ciega 60 ft",
    resistencias: [], inmunidades: [], vulnerabilidades: [],
    inmuneCondiciones: ["Ensordecido"],
    rasgos: [],
    acciones: [
      { nombre: "Garra", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 3, dano: "2d4+1", tipoDano: "cortante" },
      { nombre: "Agujas", tipo: "distancia", alcance: "30/60 ft",
        bonusAtaque: 3, dano: "2d4+1", tipoDano: "perforante" }
    ],
    vd: "1/4"
  },
  {
    id: "rilly_june", libro: "libro2",
    nombre: "Rilly June", en: "Rilly June",
    tipo: "Humanoide (mediano) pequeño, neutral",
    pgMax: 13, pgFormula: "3d6+3",
    ca: 12,
    velocidad: 30,
    atributos: { FUE: 14, DES: 14, CON: 13, INT: 10, SAB: 13, CAR: 10 },
    salvaciones: { SAB: 3 },
    bonusIniciativa: 2,
    sentidos: "Percepción +3 · Naturaleza +2 · Supervivencia +3",
    resistencias: [], inmunidades: [], vulnerabilidades: [], inmuneCondiciones: [],
    rasgos: [],
    multiataque: { texto: "Hace dos ataques de Horca.", ataques: ["Horca", "Horca"] },
    acciones: [
      { nombre: "Horca", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 4, dano: "1d8+2", tipoDano: "perforante" },
      { nombre: "¡Fuera, largo!", usosPorDia: 1, alcance: "60 ft, una criatura que vea",
        cd: 11, salvacion: "SAB",
        dano: "3d6", tipoDano: "psíquico", alSalvar: "mitad",
        aplicaCondicion: "Asustado",
        efectoAlFallar: "Asustado hasta el final de su siguiente turno." }
    ],
    vd: "1/2"
  },
  {
    // Villano recurrente añadido por el DM (heraldo de Gunthar el Glotón). Nunca muere en estos encuentros.
    id: "lucian", libro: "libro2",
    nombre: "Lucian Vervain, el Trovador Carmesí", en: "The Crimson Troubadour",
    tipo: "Muerto viviente mediano (bardo), neutral malvado",
    pgMax: 65, pgFormula: "10d8+20",
    ca: 15,
    velocidad: 30,
    atributos: { FUE: 10, DES: 16, CON: 14, INT: 13, SAB: 12, CAR: 18 },
    salvaciones: {},
    bonusIniciativa: 3,
    sentidos: "Visión en la oscuridad 60 ft",
    resistencias: ["necrótico", "veneno"], inmunidades: [], vulnerabilidades: [],
    inmuneCondiciones: ["Hechizado", "Asustado", "Envenenado"],
    auraCancion: true,                        // Canción de sangre: +2 ataque, +1d6 necrótico y resistencia física a sus aliados
    noMuertoImplacable: true,                 // 1/combate: a 0 PG se vuelve humo y se reforma con 1 PG en su turno
    escapaAlCaer: "Lucian NO muere: se disuelve en humo carmesí, su voz resuena y escapa (deja una rosa negra).",
    espaciosConjuro: { 1: 4, 2: 3, 3: 3, 4: 1 },
    rasgos: [
      { nombre: "Canción de sangre (aura)", texto: "Mientras esté consciente y pueda cantar, sus aliados a 30 ft ganan +2 al ataque, +1d6 de daño necrótico y resistencia al daño físico de armas no mágicas. La app lo aplica sola (casilla en cada ataque)." },
      { nombre: "No muerto implacable (1/combate)", texto: "Al llegar a 0 PG se disuelve en humo carmesí y se reforma con 1 PG al inicio de su siguiente turno. La app lo hace sola." },
      { nombre: "Escape garantizado", texto: "No puede morir de forma permanente en estos encuentros: si cae de nuevo, escapa." },
      { nombre: "Conjuros (CD 15, +7)", texto: "Trucos: Burla viciosa, Ilusión menor, Mano de mago. Espacios: nv1 ×4, nv2 ×3, nv3 ×3, nv4 ×1 (la app los descuenta)." }
    ],
    multiataque: { texto: "Hace dos ataques: uno con la Daga de obsidiana y otro con el Zarpazo del laúd.", ataques: ["Daga de obsidiana", "Zarpazo del laúd"] },
    acciones: [
      { nombre: "Daga de obsidiana", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 6, dano: "1d4+4", tipoDano: "perforante",
        danoExtra: [{ dado: "1d6", tipo: "necrótico" }] },
      { nombre: "Zarpazo del laúd", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 5, dano: "1d8+3", tipoDano: "cortante",
        efectoAlGolpear: "Salvación de SAB CD 15 o queda Hechizado hasta el final de su siguiente turno (añádelo a mano si falla)." },
      { nombre: "Nota discordante", recarga: "5-6", alcance: "explosión de 30 ft",
        cd: 15, salvacion: "CON", dano: "4d6", tipoDano: "trueno", alSalvar: "mitad",
        aplicaCondicion: "Ensordecido", efectoAlFallar: "Ensordecido 1 minuto." },
      { nombre: "Canción hipnótica", adicional: true, usosPorDia: 1, alcance: "criaturas a 30 ft",
        cd: 15, salvacion: "SAB", aplicaCondicion: "Hechizado",
        efectoAlFallar: "Hechizado hasta el final de su siguiente turno." },
      // ---- Conjuros (CD 15) ----
      { nombre: "Burla viciosa (truco)", alcance: "60 ft",
        cd: 15, salvacion: "SAB", dano: "2d6", tipoDano: "psíquico", alSalvar: "nada",
        efectoAlFallar: "Desventaja en su siguiente tirada de ataque antes del final de su siguiente turno." },
      { nombre: "Disonancia discordante (nv1)", nivelConjuro: 1, alcance: "60 ft",
        cd: 15, salvacion: "SAB", dano: "3d6", tipoDano: "psíquico", alSalvar: "mitad",
        efectoAlFallar: "Debe usar su reacción, si puede, para alejarse de Lucian tanto como su velocidad." },
      { nombre: "Fuego feérico (nv1)", nivelConjuro: 1, alcance: "cubo de 20 ft a 60 ft",
        cd: 15, salvacion: "DES",
        efectoAlFallar: "Brilla 1 min (concentración): los ataques contra él tienen ventaja y no puede ser Invisible." },
      { nombre: "Encantar persona (nv1)", nivelConjuro: 1, alcance: "30 ft",
        cd: 15, salvacion: "SAB", aplicaCondicion: "Hechizado",
        efectoAlFallar: "Hechizado 1 hora (tiene ventaja en la salvación si están luchando contra Lucian). Termina si le dañan." },
      { nombre: "Inmovilizar persona (nv2)", nivelConjuro: 2, alcance: "60 ft",
        cd: 15, salvacion: "SAB", aplicaCondicion: "Paralizado",
        efectoAlFallar: "Paralizado (concentración, 1 min); repite la salvación al final de cada uno de sus turnos." },
      { nombre: "Sugestión (nv2)", nivelConjuro: 2, alcance: "30 ft",
        cd: 15, salvacion: "SAB", aplicaCondicion: "Hechizado",
        efectoAlFallar: "Hechizado y sigue una sugestión razonable (concentración, hasta 8 h)." },
      { nombre: "Miedo (nv3)", nivelConjuro: 3, alcance: "cono de 30 ft",
        cd: 15, salvacion: "SAB", aplicaCondicion: "Asustado",
        efectoAlFallar: "Asustado (concentración, 1 min): suelta lo que tenga en las manos y huye por la ruta más segura. Repite la salvación si termina su turno sin verle." },
      { nombre: "Patrón hipnótico (nv3)", nivelConjuro: 3, alcance: "cubo de 30 ft a 120 ft",
        cd: 15, salvacion: "SAB", aplicaCondicion: ["Hechizado", "Incapacitado"],
        efectoAlFallar: "Hechizado e Incapacitado, velocidad 0 (concentración, 1 min). Termina si recibe daño o alguien le zarandea (acción)." },
      { nombre: "Invisibilidad (nv2)", texto: "Él o una criatura que toque queda Invisible (concentración, 1 h); termina al atacar o lanzar un conjuro. Gasta un espacio de nv2 a mano." },
      { nombre: "Puerta dimensional (nv4)", texto: "Solo para escapar: se teletransporta hasta 500 ft. Gasta el espacio de nv4 a mano." },
      { nombre: "Ilusión menor / Mano de mago", texto: "Trucos de distracción y teatro." }
    ],
    accionesAdicionales: [
      { nombre: "Fuga teatral (1/combate)", texto: "Bomba de humo carmesí: se teletransporta 30 ft a un espacio que vea, sin provocar ataques de oportunidad." },
      { nombre: "Paso espectral (2/descanso)", texto: "Incorpóreo hasta el final de su siguiente turno: resistencia al daño no mágico y atraviesa criaturas y objetos, pero no puede atacar." }
    ],
    reacciones: [
      { nombre: "Contrahechizo (nv3)", texto: "Cuando ve a alguien lanzar un conjuro a 60 ft: el lanzador hace salvación de CON CD 15 o el conjuro falla y no gasta espacio." }
    ],
    recordatorios: [
      { en: "turno", titulo: "Cómo lucha Lucian",
        texto: "Evita el cuerpo a cuerpo: prefiere Miedo, Patrón hipnótico o Disonancia discordante. Canta un verso burlón cada ronda. Acorralado: Fuga teatral o Puerta dimensional." },
      { en: "turno", titulo: "Cuándo se retira",
        texto: "En el camino: tras 3 rondas, humo carmesí y huye a los túneles dejando una rosa negra. En T9: si mueren los demoperros o baja de 15 PG, reverencia, «El show debe continuar», portal y huye al Valle de las Sombras. Nunca muere." },
      { en: "ataque", titulo: "Zarpazo del laúd",
        texto: "Si impacta con el laúd: salvación de SAB CD 15 o Hechizado hasta el final de su siguiente turno (añádelo a mano)." }
    ],
    vd: "4"
  },
  {
    id: "plebeyo", libro: "libro2",
    nombre: "Plebeyo", en: "Commoner",
    tipo: "Humanoide mediano o pequeño, neutral",
    pgMax: 4, pgFormula: "1d8",
    ca: 10,
    velocidad: 30,
    atributos: { FUE: 10, DES: 10, CON: 10, INT: 10, SAB: 10, CAR: 10 },
    salvaciones: {},
    bonusIniciativa: 0,
    sentidos: "—",
    resistencias: [], inmunidades: [], vulnerabilidades: [], inmuneCondiciones: [],
    rasgos: [
      { nombre: "Entrenamiento", texto: "Competente en una habilidad a elección del DM, con ventaja en las pruebas de esa habilidad." }
    ],
    acciones: [
      { nombre: "Garrote", tipo: "cuerpo a cuerpo", alcance: "5 ft",
        bonusAtaque: 2, dano: "1d4", tipoDano: "contundente" }
    ],
    vd: "0"
  }
];
