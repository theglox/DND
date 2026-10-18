// Pruebas de característica, salvaciones y botín de cada sección de cada libro.
// Las claves son los ids de los títulos (d1…d6, s1…s6, t1…t9 y el resto en minúsculas con guiones).
//
// Prueba:    { tipo: "prueba", atributo, habilidad, cd, accion, texto, exito, fallo }
// Salvación: { tipo: "salvacion", atributo, cd, texto, dano, tipoDano, alSalvar: "mitad" | "nada", condicion, fallo, exito }
// Botín:     { nombre, detalle, cantidad, oro, objetoId (objeto de data/objetos.js que se asigna en Objetos) }
window.DATA_SECCIONES = {
  // ================= Libro 1 · El Gnomo Evanescente =================
  libro1: {
    "llegada-a-la-mazmorra": {
      pruebas: [
        { tipo: "prueba", atributo: "INT", habilidad: "Historia", cd: 12, texto: "Inspeccionar la entrada.",
          exito: "Los monstruos infestan esta mazmorra imbuida de magia sombría. Fue un templo de un dios olvidado y se rumorea que hay una segunda mazmorra más siniestra conectada." },
        { tipo: "prueba", atributo: "INT", habilidad: "Arcanos", cd: 12, texto: "Inspeccionar la entrada.",
          exito: "La mazmorra está vinculada al Valle de las Sombras, un reflejo sombrío del mundo natural habitado por criaturas espantosas y sombras vivientes." }
      ]
    },
    "caracteristicas-de-la-mazmorra": {
      pruebas: [
        { tipo: "prueba", atributo: "SAB", habilidad: "Percepción", cd: 15, accion: "Buscar", texto: "Examinar una pared con puerta secreta.",
          exito: "Encuentra la puerta secreta (fisura elástica y arañosa)." }
      ]
    },
    "d2": {
      pruebas: [
        { tipo: "prueba", atributo: "SAB", habilidad: "Percepción", cd: 12, accion: "Buscar", texto: "Rebuscar entre la basura (el primer éxito).",
          exito: "Desentierra cinco urnas de marfil: cuatro vacías y una con una Poción de curación y una estatuilla de peltre." },
        { tipo: "prueba", atributo: "INT", habilidad: "Religión", cd: 13, texto: "Examinar la estatuilla del demonio de dos cabezas.",
          exito: "Es un ídolo de Demogorgon." }
      ],
      botin: [
        { nombre: "Urnas de marfil", cantidad: 5, detalle: "10 po cada una" },
        { nombre: "Poción de curación", objetoId: "pocion_curacion", detalle: "Dentro de una de las urnas" },
        { nombre: "Estatuilla de peltre de un demonio de dos cabezas", detalle: "Vale 90 po (ídolo de Demogorgon)" }
      ]
    },
    "d3": {
      pruebas: [
        { tipo: "prueba", atributo: "SAB", habilidad: "Percepción", cd: 15, accion: "Buscar", texto: "Buscar trampas en el laberinto.",
          exito: "Detecta los agujeros de las trampas de lanzas (marcadas con T)." },
        { tipo: "prueba", atributo: "INT", habilidad: "Investigación", cd: 15, accion: "Estudiar", texto: "Examinar el suelo.",
          exito: "Detecta la placa de presión." },
        { tipo: "salvacion", atributo: "DES", cd: 13, texto: "Trampa de lanzas: al pisar la placa por primera vez en un turno.",
          dano: "1d6", tipoDano: "perforante", alSalvar: "nada", fallo: "Recibe 1d6 de daño perforante. La trampa se retrae y se restablece." }
      ]
    },
    "terror-en-el-laberinto": {
      pruebas: [
        { tipo: "prueba", atributo: "DES", habilidad: "Sigilo", cd: 13, texto: "Colarse sin que el engendro lo note mientras devora al minotauro.",
          exito: "Pasa sin ser detectado.", fallo: "El engendro se gira, chilla y ataca: ¡tirad iniciativa!" }
      ],
      botin: [
        { nombre: "Varita de secretos", objetoId: "varita_secretos", detalle: "En el pequeño cofre junto al minotauro" },
        { nombre: "Monedas de oro", oro: 25, detalle: "En el mismo cofre" }
      ]
    },
    "d4": {
      pruebas: [],
      notas: "Forja de Gibbletrax: como acción adicional, un PJ sumerge un arma o munición en la forja: +1d6 de fuego en su siguiente golpe (10 min). Una vez por PJ, salvo que los goblins lo permitan de nuevo."
    },
    "d5": {
      pruebas: [
        { tipo: "prueba", atributo: "INT", habilidad: "Investigación", cd: 12, accion: "Estudiar", texto: "Examinar la estatua del caballero.",
          exito: "La base es inestable: un empujón significativo podría derribarla." },
        { tipo: "prueba", atributo: "FUE", habilidad: "Atletismo", cd: 10, texto: "Derribar la estatua (a 5 ft, usa una acción).",
          exito: "Cae en un espacio a 5 ft: cada criatura debajo recibe 4d6 contundente y queda Derribada. Se desmorona y revela su tesoro." },
        { tipo: "salvacion", atributo: "DES", cd: 12, texto: "Telarañas: al entrar por primera vez en un turno o empezar el turno en ellas.",
          condicion: "Apresado", fallo: "Queda Apresado por las telarañas." },
        { tipo: "prueba", atributo: "FUE", habilidad: "Atletismo", cd: 12, texto: "Escapar de las telarañas (acción). También vale DES (Acrobacias).",
          exito: "Se libera de las telarañas." }
      ],
      botin: [
        { nombre: "Lengua de fuego", objetoId: "lengua_de_fuego", detalle: "Dentro de la araña de cristal (CA 13, 50 PG; resiste perforante y cortante)" }
      ]
    },
    "d6": {
      pruebas: [
        { tipo: "salvacion", atributo: "CON", cd: 13, texto: "Ritual completado: risa retumbante del altar (toda criatura que no sea gnoll en la sala).",
          dano: "1d8", tipoDano: "trueno", alSalvar: "mitad", fallo: "1d8 de trueno (mitad si supera)." }
      ],
      botin: [
        { nombre: "Mayal +1", objetoId: "mayal_mas1", detalle: "El mayal del altar" }
      ]
    },
    "caracteristicas-de-la-mazmorra-sombria": {
      pruebas: [
        { tipo: "prueba", atributo: "SAB", habilidad: "Percepción", cd: 15, accion: "Buscar", texto: "Examinar una pared con puerta secreta.",
          exito: "Encuentra la puerta secreta (fisura que deja pasar rayos de luz)." }
      ]
    },
    "s1": {
      pruebas: [
        { tipo: "prueba", atributo: "SAB", habilidad: "Medicina", cd: 12, texto: "Inspeccionar el cadáver del enano.",
          exito: "Su vida fue drenada por una fuerza sobrenatural." }
      ],
      botin: [
        { nombre: "Nota del enano", detalle: "Folleto de advertencia de la mazmorra. Al leerla, la Sombra se alza del cadáver." }
      ]
    },
    "s2": {
      pruebas: [
        { tipo: "prueba", atributo: "SAB", habilidad: "Percepción", cd: 12, texto: "Registrar la basura (el primero).",
          exito: "Desentierra cinco urnas agrietadas de granito negro, sin valor; una contiene una Poción de curación y un ojo de cristal." }
      ],
      botin: [
        { nombre: "Poción de curación", objetoId: "pocion_curacion", detalle: "Dentro de una urna" },
        { nombre: "Ojo de cristal con pupila de esmeralda", detalle: "Vale 10 po" }
      ]
    },
    "s3": {
      pruebas: [
        { tipo: "prueba", atributo: "INT", habilidad: "Naturaleza", cd: 15, accion: "Estudiar", texto: "Examinar las paredes.",
          exito: "Identifica los bulbos tóxicos de las trampas de esporas." },
        { tipo: "prueba", atributo: "INT", habilidad: "Investigación", cd: 15, accion: "Estudiar", texto: "Inspeccionar el suelo.",
          exito: "Identifica la placa de presión fúngica. Cortar los tallos desactiva la trampa." },
        { tipo: "salvacion", atributo: "CON", cd: 13, texto: "Trampa de esporas: cubo de 5 ft centrado en la placa.",
          condicion: "Envenenado", fallo: "Queda Envenenado durante 1 hora." }
      ],
      botin: [
        { nombre: "Varita rota", detalle: "Inútil" },
        { nombre: "Monedas de oro", oro: 25, detalle: "En el cofre del centro del laberinto" }
      ]
    },
    "s4": {
      pruebas: [
        { tipo: "prueba", atributo: "INT", habilidad: "Arcanos", cd: 13, accion: "Estudiar", texto: "Inspeccionar la forja.",
          exito: "Identifica el peligro sobrenatural: marchita y mata a los vivos." },
        { tipo: "salvacion", atributo: "CON", cd: 15, texto: "Entrar en la forja por primera vez o empezar el turno en ella.",
          dano: "4d8", tipoDano: "necrótico", alSalvar: "mitad", fallo: "4d8 de daño necrótico (mitad si supera)." }
      ]
    },
    "s5": {
      pruebas: [
        { tipo: "prueba", atributo: "INT", habilidad: "Investigación", cd: 12, accion: "Estudiar", texto: "Examinar la estatua del caballero.",
          exito: "La base es inestable: un empujón significativo podría derribarla." },
        { tipo: "prueba", atributo: "FUE", habilidad: "Atletismo", cd: 10, texto: "Derribar la estatua (a 5 ft, usa una acción).",
          exito: "Cae: cada criatura debajo recibe 4d6 contundente y queda Derribada. Revela su tesoro; el yelmo queda intacto." },
        { tipo: "salvacion", atributo: "DES", cd: 12, texto: "Telarañas: al entrar por primera vez en un turno o empezar el turno en ellas.",
          condicion: "Apresado", fallo: "Queda Apresado por las telarañas." },
        { tipo: "prueba", atributo: "FUE", habilidad: "Atletismo", cd: 12, texto: "Escapar de las telarañas (acción). También vale DES (Acrobacias).",
          exito: "Se libera de las telarañas." }
      ],
      botin: [
        { nombre: "Yelmo aterrador carmesí", detalle: "El yelmo de la estatua, con forma de cabeza de demonio cornudo" },
        { nombre: "Turmalina negra en forma de corazón", detalle: "Vale 30 po (dentro de la estatua)" }
      ]
    },
    "s6": {
      pruebas: [
        { tipo: "prueba", atributo: "INT", habilidad: "Religión", cd: 12, texto: "Examinar el contenido del altar.",
          exito: "La mano y el ojo son el símbolo de Vecna; el reloj de arena simboliza su regreso." }
      ]
    },
    "conclusion": {
      botin: [
        { nombre: "Gorro de la Desaparición", detalle: "Recompensa de Flizzlebin (a quien no haya encontrado objeto mágico)" }
      ]
    }
  },

  // ================= Libro 2 · Grito de la Cosecha =================
  libro2: {
    "la-peticion-de-rillard": {
      botin: [
        { nombre: "Kukri empapado en veneno", detalle: "Préstamo de Rillard; se lo quedan al final de la aventura" }
      ]
    },
    "caracteristicas-de-los-tuneles": {
      pruebas: [
        { tipo: "prueba", atributo: "INT", habilidad: "Arcanos", cd: 13, accion: "Estudiar", texto: "Inspeccionar las raíces y vides.",
          exito: "La vegetación está corrompida por una fuerza sobrenatural maligna." }
      ],
      notas: "Túneles sin iluminar (pon la iluminación en Oscuridad en el combate). Las raíces son terreno difícil."
    },
    "t1": {
      pruebas: [
        { tipo: "prueba", atributo: "SAB", habilidad: "Naturaleza", cd: 13, texto: "Escuchar el aullido lejano.",
          exito: "Ningún perro o lobo ordinario puede producir ese sonido." }
      ]
    },
    "t2": {
      pruebas: [
        { tipo: "prueba", atributo: "SAB", habilidad: "Percepción", cd: 15, accion: "Buscar", texto: "Inspeccionar el área.",
          exito: "Detecta las dos Enredaderas atrapantes.", fallo: "Si empieza el combate sin notarlas, tira iniciativa con desventaja." }
      ]
    },
    "t3": {
      pruebas: [
        { tipo: "prueba", atributo: "INT", habilidad: "Investigación", cd: 15, accion: "Estudiar", texto: "Inspeccionar los espantapájaros.",
          exito: "Reconoce al espantapájaros viviente escondido entre los inanimados.", fallo: "Si lo perturban, el espantapájaros sorprende a quien no lo haya identificado." },
        { tipo: "salvacion", atributo: "CON", cd: 13, texto: "Esporas tóxicas: al entrar en el área.",
          condicion: "Envenenado", fallo: "Envenenado 1 minuto; repite la salvación al final de cada turno.", exito: "Inmune a estas esporas durante 24 horas." }
      ],
      botin: [
        { nombre: "Periapto de salud", detalle: "El colgante que cuelga del techo" }
      ]
    },
    "t4": {
      pruebas: [
        { tipo: "prueba", atributo: "SAB", habilidad: "Percepción", cd: 15, accion: "Buscar", texto: "Examinar el suelo.",
          exito: "Detecta las tres Plagas aguja." },
        { tipo: "prueba", atributo: "SAB", habilidad: "Medicina", cd: 13, accion: "Estudiar", texto: "Inspeccionar el ganado muerto.",
          exito: "Las vacas fueron asesinadas violentamente y arrastradas por una criatura corpulenta con mandíbulas ácidas." },
        { tipo: "prueba", atributo: "INT", habilidad: "Arcanos", cd: 13, texto: "Inspeccionar los cadáveres.",
          exito: "Esta área es un nido de ankheg." }
      ],
      botin: [
        { nombre: "Saco de arpillera «R.J.»", detalle: "Un pan de dos días y tres manzanas" },
        { nombre: "Monedas de oro", oro: 5, detalle: "En el saco" },
        { nombre: "Poción de resistencia (ácido)", detalle: "En el saco" }
      ],
      notas: "El suelo está 10 ft más bajo que los túneles que llegan (caída de 10 ft). Techo de 20 ft."
    },
    "t5": {
      pruebas: [],
      notas: "Niebla: el área está muy oscurecida (en el combate, iluminación «Oscuridad / niebla densa»). El ankheg tiene sentido sísmico y no le afecta."
    },
    "t6": {
      pruebas: [
        { tipo: "prueba", atributo: "INT", habilidad: "Religión", cd: 12, texto: "Inspeccionar las raíces que atan a Justine.",
          exito: "Al destruir las raíces (CA 10, 15 PG; inmunes a contundente, perforante y psíquico) liberarán a Justine." }
      ],
      botin: [
        { nombre: "Emblema de plata de Heironeous", detalle: "Con forma de rayo, vale 25 po (en el cuello de Justine)" }
      ]
    },
    "t7": {
      pruebas: [
        { tipo: "prueba", atributo: "SAB", habilidad: "Percepción", cd: 15, accion: "Buscar", texto: "Escanear las paredes cubiertas de vides.",
          exito: "Detecta las dos Enredaderas atrapantes." }
      ],
      botin: [
        { nombre: "Herramientas agrícolas", detalle: "Guantes de jardinería, una azada y una pala" },
        { nombre: "Anillo heredado", detalle: "Vale 10 po" }
      ]
    },
    "t8": {
      pruebas: [
        { tipo: "prueba", atributo: "FUE", habilidad: "Atletismo", cd: 15, texto: "Liberar a Rilly June de las vides (acción).",
          exito: "Rilly June se despierta, se presenta y comparte lo que sabe." },
        { tipo: "prueba", atributo: "CAR", habilidad: "Persuasión", cd: 15, accion: "Influir", texto: "Convencer a Rilly June de que vuelva a la superficie.",
          exito: "Vuelve a regañadientes a la casa de labranza.", fallo: "Acompaña al grupo el resto de la aventura." }
      ]
    },
    "t9": {
      pruebas: [
        { tipo: "prueba", atributo: "INT", habilidad: "Arcanos", cd: 13, accion: "Estudiar", texto: "Examinar el árbol Gulthias.",
          exito: "Volverá a crecer en 3d10 días si se deja en la tierra." },
        { tipo: "prueba", atributo: "FUE", habilidad: "Atletismo", cd: 15, texto: "Desarraigar el árbol (Rilly June puede Ayudar: ventaja).",
          exito: "Sus efectos terminan y mueren todas las Plagas aguja y Enredaderas atrapantes de los túneles." }
      ],
      botin: [
        { nombre: "Dardo +1", detalle: "Con forma de extraño renacuajo (en el ataúd de Gunthar)" },
        { nombre: "Amuleto con araña de cristal", detalle: "Vale 25 po" },
        { nombre: "Pañuelo de seda azul con bordado dorado", detalle: "Vale 5 po" },
        { nombre: "Monedas de oro", oro: 50, detalle: "En una bolsa" }
      ],
      notas: "Árbol Gulthias: objeto Enorme, CA 15, 50 PG, inmune a necrótico, veneno y psíquico; vulnerable al fuego."
    },
    "recompensa-de-rillard": {
      botin: [
        { nombre: "Recompensa de Rillard", oro: 200, detalle: "200 po por encontrar a Rilly June y la fuente de la plaga" }
      ]
    }
  }
};
