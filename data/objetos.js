// Objetos mágicos y consumibles — DMG 2024.
// tipo: "arma" (se basa en armaBase de armas.js) | "varita" | "pocion"
window.DATA_OBJETOS = [
  {
    id: "lengua_de_fuego", nombre: "Lengua de fuego", en: "Flame Tongue",
    tipo: "arma", armaBase: "gran_espada",    // la aventura dice "Lengua de fuego (espada grande)"
    rareza: "rara", sintonizacion: true,
    activable: {
      nombre: "Encendida", tiempo: "acción adicional",
      danoExtra: { dado: "2d6", tipo: "fuego" }
    },
    texto: "Acción adicional (palabra de mando): la hoja arde hasta que usas otra acción adicional o la sueltas/envainas. Mientras arde: +2d6 de fuego al golpear, luz brillante 40 ft y tenue 40 ft más. Requiere sintonización."
  },
  {
    id: "mayal_mas1", nombre: "Mayal +1", en: "+1 Flail",
    tipo: "arma", armaBase: "mayal",
    rareza: "poco común", sintonizacion: false,
    bonusAtaque: 1, bonusDano: 1,
    texto: "+1 a las tiradas de ataque y de daño."
  },
  {
    id: "varita_secretos", nombre: "Varita de secretos", en: "Wand of Secrets",
    tipo: "varita",
    rareza: "poco común", sintonizacion: false,
    cargas: 3, recarga: "1d3 cargas al amanecer",
    texto: "Acción Magia: gasta 1 carga; si hay una puerta secreta o una trampa a 60 ft, la varita vibra y apunta a la más cercana."
  },
  {
    id: "gorro_desaparicion", nombre: "Gorro de la Desaparición", en: "Cap of Vanishing",
    tipo: "maravilloso",
    rareza: "poco común", sintonizacion: true,
    cargas: 3, recargaTotal: true, recarga: "todas al amanecer",
    invisibilidad: { tiempo: "acción Magia", duracion: "10 minutos" },
    texto: "3 cargas (todas vuelven al amanecer). Acción Magia y 1 carga: quedas Invisible 10 minutos. Termina antes si te quitas el gorro, o justo después de hacer una tirada de ataque, causar daño o lanzar un conjuro. Requiere sintonización."
  },

  // ---------- Libro 2 · Grito de la Cosecha (nivel 2) ----------
  {
    id: "dardo_mas1", nombre: "Dardo +1", en: "+1 Dart",
    tipo: "arma", armaBase: "dardo",
    rareza: "poco común", sintonizacion: false,
    bonusAtaque: 1, bonusDano: 1,
    texto: "Arma sencilla a distancia (sutil, arrojadiza 20/60): +1 a las tiradas de ataque y de daño. Maestría: Fastidiar."
  },
  {
    id: "kukri_veneno", nombre: "Kukri empapado en veneno", en: "Poison-Soaked Kukri",
    tipo: "arma", armaBase: "daga",
    rareza: "poco común", sintonizacion: true,
    veneno: { cd: 13, salvacion: "CON", dano: "2d8", tipoDano: "veneno", condicion: "Envenenado" },
    texto: "Daga (sutil, ligera, arrojadiza 20/60). Acción adicional, 1 vez hasta el amanecer: cubre la hoja de veneno durante 1 min o hasta que golpee. La criatura golpeada hace salvación de CON CD 13 o recibe 2d8 de veneno y queda Envenenada 1 min. Maestría: Mella. Requiere sintonización."
  },
  {
    id: "periapto_salud", nombre: "Periapto de salud", en: "Periapt of Health",
    tipo: "maravilloso",
    rareza: "poco común", sintonizacion: true,
    curacion: "2d4+2", tiempo: "acción Magia", usoDiario: true, soloPropio: true,
    ventajaSalvacionContra: ["Envenenado"],
    texto: "Acción Magia, 1 vez hasta el amanecer: recupera 2d4 + 2 PG. Mientras lo lleve, ventaja en salvaciones para evitar o terminar Envenenado. Requiere sintonización."
  },
  {
    id: "pocion_resistencia_acido", nombre: "Poción de resistencia (ácido)", en: "Potion of Resistance (Acid)",
    tipo: "pocion",
    rareza: "poco común", sintonizacion: false,
    tiempo: "acción adicional", aplicaBuff: "resistencia_acido",
    texto: "Acción adicional: bébela o dásela a una criatura a 5 ft. Resistencia al daño de ácido durante 1 hora."
  },

  {
    id: "pocion_curacion", nombre: "Poción de curación", en: "Potion of Healing",
    tipo: "pocion",
    rareza: "común", sintonizacion: false,
    curacion: "2d4+2", tiempo: "acción adicional",
    texto: "Acción adicional: bébela o dásela a una criatura a 5 ft. Recupera 2d4 + 2 PG."
  },

  // ---------- Equipo de aventurero usable en combate (PHB 2024) ----------
  // uso: "salvacion" → el objetivo tira salvación; cd: número o "lanzador" (8 + DES + competencia)
  {
    id: "aceite", nombre: "Frasco de aceite", en: "Oil",
    tipo: "consumible", uso: "salvacion", tiempo: "sustituye un ataque", alcance: "20 ft",
    salvacion: "DES", cd: "lanzador", efectoAlFallar: "aceite",
    texto: "Sustituye un ataque: objetivo a 20 ft, salvación de DES o queda cubierto de aceite 1 minuto. Si recibe daño de fuego, +5 de fuego y se consume el aceite."
  },
  {
    id: "agua_bendita", nombre: "Agua bendita", en: "Holy Water",
    tipo: "consumible", uso: "salvacion", tiempo: "sustituye un ataque", alcance: "20 ft",
    salvacion: "DES", cd: "lanzador", dano: "2d8", tipoDano: "radiante", alSalvar: "nada",
    soloTipos: ["Infernal", "Muerto viviente"],
    texto: "Sustituye un ataque: objetivo a 20 ft, salvación de DES o 2d8 de daño radiante si es un infernal o un muerto viviente."
  },
  {
    id: "bolas_rodamiento", nombre: "Bolas de rodamiento", en: "Ball Bearings",
    tipo: "consumible", uso: "salvacion", tiempo: "acción Utilizar", alcance: "área 10×10 ft a 10 ft",
    salvacion: "DES", cd: 10, condicion: "Derribado", reutilizable: true,
    texto: "Acción Utilizar: cubren un cuadrado de 10 ft a 10 ft. Quien entre por primera vez en un turno: salvación de DES CD 10 o Derribado. Recogerlas lleva 10 minutos."
  },
  {
    id: "abrojos", nombre: "Abrojos", en: "Caltrops",
    tipo: "consumible", uso: "salvacion", tiempo: "acción Utilizar", alcance: "cuadrado de 5 ft a 5 ft",
    salvacion: "DES", cd: 15, dano: "1", tipoDano: "perforante", alSalvar: "nada", reutilizable: true,
    efectoAlFallar: "Velocidad 0 hasta el inicio de su siguiente turno.",
    texto: "Acción Utilizar: cubren un cuadrado de 5 ft a 5 ft. Quien entre por primera vez en un turno: salvación de DES CD 15 o 1 de daño perforante y velocidad 0 hasta el inicio de su siguiente turno."
  },
  {
    id: "kit_sanador", nombre: "Kit de sanador", en: "Healer's Kit",
    tipo: "consumible", uso: "estabilizar", tiempo: "acción Utilizar",
    texto: "Acción Utilizar: gasta 1 uso para estabilizar a una criatura a 0 PG sin tirada de Medicina."
  },
  { id: "flechas", nombre: "Flechas", en: "Arrows", tipo: "municion", texto: "Munición para arco. Tras el combate se recupera la mitad." },
  { id: "virotes", nombre: "Virotes", en: "Bolts", tipo: "municion", texto: "Munición para ballesta. Tras el combate se recupera la mitad." }
];
