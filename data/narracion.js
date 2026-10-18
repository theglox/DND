// Guía del narrador: cómo contar cada sección, qué decir y sus bifurcaciones.
// Claves = ids de los títulos de la historia (t1…t9, comienzo-de-la-aventura, …).
//
// flujo:   etapas del recorrido con nodos { id, texto } (clic → salta a esa sección)
// sección: {
//   escena,                         una frase: qué está pasando
//   guion: [{ bloque?, quien, texto, acotacion? }],   lo que dirías en la mesa (bloque abre un apartado)
//   narrar: [pasos],                cómo contarlo (técnica)
//   preguntas: [{ p, r }],          respuestas preparadas
//   bifurcaciones: [{ si, entonces, ir }], ambiente, consejo
// }
window.DATA_NARRACION = {
  // ================= Libro 2 · Grito de la Cosecha =================
  libro2: {
    flujo: [
      { etapa: "🎻 Preludio", nodos: [
        { id: "preludio-portal", texto: "Portal de la Forja" },
        { id: "preludio-camino", texto: "Lucian en el camino" }
      ] },
      { etapa: "Inicio", nodos: [
        { id: "comienzo-de-la-aventura", texto: "Goldenwheat marchito" },
        { id: "llegada-a-la-granja-de-la-familia-rillard", texto: "El Viejo Rill" }
      ] },
      { etapa: "La granja: eligen una pista", nodos: [
        { id: "explorando-la-granja", texto: "4 pistas" }
      ] },
      { etapa: "Entrada a los túneles", nodos: [
        { id: "t1", texto: "Campos → T1" },
        { id: "t6", texto: "Sótano → T6" },
        { id: "t3", texto: "Espantapájaros → T3" },
        { id: "t4", texto: "Granero → T4" }
      ] },
      { etapa: "Túneles (en el orden que elijan)", nodos: [
        { id: "t2", texto: "T2 Hongos" },
        { id: "t5", texto: "T5 Ankheg" },
        { id: "t7", texto: "T7 Vides" }
      ] },
      { etapa: "El corazón de la plaga", nodos: [
        { id: "t8", texto: "T8 Rilly June" },
        { id: "t9", texto: "T9 Cripta · Lucian" }
      ] },
      { etapa: "Desenlace", nodos: [
        { id: "conclusion", texto: "¿Vuelve Rilly?" },
        { id: "recompensa-de-rillard", texto: "Recompensa" }
      ] }
    ],

    secciones: {
      // ---------- Preludio (añadido por el DM): Lucian Vervain, el Trovador Carmesí ----------
      "preludio": {
        escena: "Lucian Vervain, el Trovador Carmesí: el villano recurrente que une las dos aventuras.",
        narrar: [
          "Es para ti: Lucian fue el bardo de Gunthar el Glotón. Se volvió no muerto para revivir a su amo y quiere regar el árbol Gulthias con sangre de héroes.",
          "Aparece tres veces: el portal de la Forja (si venís del libro 1), la emboscada en el camino y la cripta (T9).",
          "Voz: prosodia perfecta, rimas y metáforas de teatro («acto», «función», «público»). Teatral y sádico, pero nunca suicida."
        ],
        bifurcaciones: [
          { si: "Venís de El Gnomo Evanescente", entonces: "Empieza por el portal de la Forja.", ir: "preludio-portal" },
          { si: "Empezáis directamente el libro 2", entonces: "Empieza por la emboscada en el camino.", ir: "preludio-camino" }
        ],
        consejo: "Regla de oro: Lucian nunca muere en esta aventura. A 0 PG se vuelve humo (la app lo reforma con 1 PG); si vuelve a caer, escapa. Siempre deja una rosa negra y una nota."
      },

      "preludio-portal": {
        escena: "Justo después de derrotar al Engendro de Demogorgon en la Forja (S4 del libro 1), Lucian aparece, abre un portal y se burla de Flizzlebin.",
        guion: [
          { bloque: "Al caer el Engendro", quien: "Narrador", texto: "El engendro se desploma sobre el yunque y la forja se queda en silencio. Un silencio tan completo que oís vuestra propia respiración… y entonces, un laúd.",
            acotacion: "Deja que celebren la victoria dos segundos antes de empezar." },
          { quien: "Narrador", texto: "De las sombras de la forja sale una figura alta con un jubón carmesí y una máscara de porcelana agrietada. Aplaude despacio, con unos guantes negros que no hacen ruido.",
            acotacion: "Cada paso que da deja una rosa negra marchita en el suelo." },
          { quien: "Lucian", texto: "¡Bravo! ¡Bravísimo! Qué carnicería tan bien coreografiada. Hacía siglos que no veía un primer acto tan prometedor." },
          { quien: "Narrador", texto: "Hace un gesto con la mano y el aire se abre detrás de él: una garganta negra, de bordes temblorosos, como una boca que bosteza hacia otro lugar." },
          { quien: "Lucian", texto: "¿Y el gnomo? ¿Flizzlebin, el que juega a esconderse? Decidle a ese gnomo que su recompensa puede esperar. ¡Gunthar el Glotón está a punto de regresar!",
            acotacion: "Esta frase, tal cual. Reverencia, y cruza el portal de espaldas." },
          { bloque: "El portal se cierra", quien: "Narrador", texto: "El portal no se cierra del todo: palpita, encogiéndose poco a poco, como una herida que cicatriza.",
            acotacion: "Tienen 3 rondas para saltar: DES (Acrobacias) CD 13 en el panel de pruebas." }
        ],
        preguntas: [
          { p: "¿Atacan a Lucian antes de que se vaya?", r: "Esquiva con una pirueta y entra en el portal riendo. No es su momento de pelear." },
          { p: "¿Quién es Gunthar el Glotón?", r: "Nadie lo sabe aún. Si Flizzlebin está presente, palidece: «Un vampiro… muerto hace mucho. O eso creíamos»." }
        ],
        bifurcaciones: [
          { si: "Saltan al portal (Acrobacias CD 13 en 3 rondas)", entonces: "Aparecen en el camino a Goldenwheat, con Lucian esperándolos.", ir: "preludio-camino" },
          { si: "Nadie salta o fallan", entonces: "El portal se cierra. Flizzlebin entrega la recompensa y los guía a Goldenwheat.", ir: "preludio-camino" }
        ],
        ambiente: "Después del combate, silencio total. El laúd tiene que sonar fuera de lugar.",
        consejo: "Es una presentación, no un combate: Lucian solo viene a anunciar el libro 2 y a dejarles con ganas de seguirle. Si empezáis directamente el libro 2, cuéntalo como un recuerdo en dos frases."
      },

      "preludio-camino": {
        escena: "Antes de ver los campos de Goldenwheat, el Trovador Carmesí les corta el paso: combate teatral de 3 rondas.",
        guion: [
          { bloque: "En el camino", quien: "Narrador", texto: "A media tarde, el camino se estrecha entre dos setos secos. Entonces lo oís: un laúd. Una melodía lenta, desafinada a propósito, que parece venir de todas partes y de ninguna.",
            acotacion: "Baja la voz. Si tienes música de laúd o de violín, ahora." },
          { quien: "Narrador", texto: "Sobre una roca junto al camino, como si fuera un escenario, hay una figura alta. Jubón carmesí hecho jirones, botas negras, un sombrero con una pluma de cuervo marchita. Su cara es una máscara de porcelana blanca, agrietada; por la grieta asoma una mandíbula sin labios. El laúd que toca está hecho de costillas.",
            acotacion: "Descríbelo de arriba abajo, como un plano de cine. La mandíbula, lo último." },
          { quien: "Lucian", texto: "¡Ah, mi público! Llega tarde, pero llega. Damas, caballeros… gnomos ausentes. Bienvenidos al segundo acto.",
            acotacion: "Reverencia exagerada, quitándose el sombrero. Si alguno saltó por su portal, salúdalo por su nombre." },
          { quien: "Lucian", texto: "La granja os espera, la cosecha también… pero antes de la función, veamos si sangráis bien.",
            acotacion: "Toca un acorde estridente. Tirad iniciativa (añade a Lucian en Preparar)." },
          { bloque: "Durante el combate: un verso por ronda", quien: "Lucian", texto: "¡Qué elenco tan valiente, qué reparto tan pequeño! Un enano, un mediano… y un mago con sueño.",
            acotacion: "Ronda 1. Adapta los versos a lo que hagan: se burla del que falle." },
          { quien: "Lucian", texto: "Golpead, golpead, que la música no cesa: el trigo ya está muerto y vosotros sois la presa.",
            acotacion: "Ronda 2." },
          { quien: "Lucian", texto: "Se acaba el primer acto, el telón está cayendo… regad bien vuestras tumbas, que el árbol está creciendo.",
            acotacion: "Ronda 3, justo antes de irse. «El árbol» es la pista: no la expliques." },
          { bloque: "Final de la ronda 3: la huida", quien: "Narrador", texto: "Lucian hace girar el laúd sobre su cabeza y lo estrella contra el suelo. Una nube de humo carmesí lo envuelve todo, espesa y dulce como pétalos podridos.",
            acotacion: "Se va pase lo que pase. No hay tirada para impedirlo." },
          { quien: "Narrador", texto: "Cuando el humo se disipa, no queda nadie. Solo una rosa negra, marchita, clavada en el barro… con una nota atada al tallo." },
          { quien: "Nota", texto: "Nos veremos bajo tierra, donde las raíces cantan. Con cariño, L. V.",
            acotacion: "Si puedes, dales la nota escrita en papel. Después, sigue con «Comienzo de la aventura»." }
        ],
        preguntas: [
          { p: "¿Quién es ese bardo?", r: "No se presenta del todo: «Lucian, para los amigos; Trovador, para el público». Si le preguntan por su amo, solo dice: «Un hombre de gran apetito»." },
          { p: "¿Pueden seguirlo tras el humo?", r: "El humo no deja rastro. Pero la rosa negra está clavada apuntando hacia la granja." },
          { p: "Le hablan en vez de luchar", r: "Le encanta: responde en verso, se burla y alarga la escena. Pero al final de la ronda 3 se va igual." }
        ],
        bifurcaciones: [
          { si: "Bajan a Lucian a 0 PG", entonces: "Se disuelve en humo carmesí y se reforma con 1 PG al empezar su turno (la app lo hace sola). Luego se ríe y huye." },
          { si: "Huyen o no quieren pelear", entonces: "No los persigue: toca, se ríe y les canta desde lejos. Deja la rosa en el camino." },
          { si: "Termina la ronda 3 (o Lucian escapa antes)", entonces: "Siguen camino y coronan la colina de Goldenwheat.", ir: "comienzo-de-la-aventura" }
        ],
        ambiente: "Tarde, setos secos, sin viento. El laúd es lo único que suena.",
        consejo: "Lucian no viene a ganar, viene a presentarse: que sea un espectáculo y que se vaya en la ronda 3 pase lo que pase."
      },

      "trasfondo-de-la-aventura": {
        escena: "Lo que los jugadores no saben (todavía).",
        narrar: [
          "No lo leas en voz alta: es para ti. Resúmelo en tres piezas: vampiro muerto con una estaca → la estaca brota un árbol maldito → un ankheg abre la cripta y la maldición se escapa por sus túneles.",
          "Todo lo que pasa en la granja (cosechas muertas, vacas que desaparecen, espantapájaros que se mueven) sale de esa cadena. Tenla clara y podrás improvisar cualquier respuesta."
        ],
        consejo: "La historia de Gunthar la contará Rillard como leyenda de abuelos: deja que los jugadores la descarten… hasta que encuentren la cripta."
      },

      "comienzo-de-la-aventura": {
        escena: "Llegan a Goldenwheat: todo está muerto y huele a podrido.",
        guion: [
          { quien: "Narrador", texto: "El camino sube una última colina y, al coronarla, el oro que os habían prometido no está. Hasta donde alcanza la vista, el trigo es gris, doblado, como si alguien le hubiera sorbido el color.",
            acotacion: "Despacio. Deja un segundo de silencio al final." },
          { quien: "Narrador", texto: "Las calabazas se han hundido sobre sí mismas. No corre ni una brizna de aire y, aun así, os llega un olor dulzón: fruta pasada y tierra húmeda que no ha visto la lluvia." },
          { quien: "Narrador", texto: "Junto al camino, un espantapájaros cuelga torcido de su poste. Su cabeza de calabaza, podrida, cae sobre el pecho, y las moscas zumban a su alrededor.",
            acotacion: "Mismo tono que el resto. No te detengas en él." },
          { quien: "Narrador", texto: "Un cartel de madera cruje al balancearse: «Granja de la Familia Rillard». Más arriba, una casa de dos plantas os espera entre los campos muertos." }
        ],
        preguntas: [
          { p: "¿Hay alguien trabajando?", r: "Nadie. Ni peones, ni animales en los prados. Solo moscas." },
          { p: "Examinan el trigo", r: "Se deshace entre los dedos como ceniza. Si arrancan una mata, la raíz está negra y pegajosa." },
          { p: "Examinan el espantapájaros", r: "Paja vieja y una calabaza agusanada. Nada raro… salvo que el poste está un poco inclinado, como si algo hubiera tirado de él." }
        ],
        narrar: [
          "Empieza por los sentidos, no por los datos. Contrasta: esta tierra alimenta a media región; que se note que algo va muy mal, no que es una granja pobre.",
          "Termina señalando la casa: ahí está la siguiente escena."
        ],
        bifurcaciones: [
          { si: "Tocan o golpean el espantapájaros", entonces: "Se desmorona en paja podrida. Más adelante, trata al de T3 como «otro» espantapájaros." },
          { si: "Lo ignoran y luego vuelven a mirar", entonces: "Ya no está en su poste. No lo expliques: que se queden con la inquietud.", ir: "t3" }
        ],
        ambiente: "Luz del día, pero apagada. Si tienes sonido de viento o moscas, este es el momento.",
        consejo: "El espantapájaros es un presagio: plántalo sin subrayarlo. Si sospechan demasiado pronto, se pierde la sorpresa de T3."
      },

      "llegada-a-la-granja-de-la-familia-rillard": {
        escena: "Rillard Senior los recibe en el porche y les cuenta sus problemas.",
        guion: [
          { bloque: "La llegada", quien: "Narrador", texto: "En el porche de la casa, un mediano anciano con sombrero de paja se mece despacio, con la vista clavada en los campos. Al oír vuestros pasos, la mecedora deja de crujir.",
            acotacion: "Que tarde en levantarse. Se apoya en la baranda." },
          { quien: "Rillard", texto: "Buenas tardes, forasteros. Tenéis pinta de saber usar eso que lleváis al cinto… Soy Rillard Senior. Aunque aquí todo el mundo me llama Viejo Rill.",
            acotacion: "Voz lenta y cálida, de campo. Se rasca las patillas mientras os mira de arriba abajo." },
          { quien: "Rillard", texto: "No me gusta pedir ayuda, os lo confieso. Pero la granja está enferma… y no es lo único que va mal. Sentaos, si queréis. Esto va para rato." },

          { bloque: "Problema 1 · Los cultivos (su orgullo)", quien: "Rillard", texto: "Mirad eso. Sesenta cosechas llevo sacando de esta tierra y jamás la vi así. Empezó hará un par de semanas: una mancha gris aquí, otra allá… y ahora, todo.",
            acotacion: "Señala los campos con la barbilla. Orgullo herido, no tristeza." },
          { quien: "Rillard", texto: "Hasta le pagué a un mago que pasaba por el camino. Agitó las manos, dijo unas palabras raras, cobró su oro… y a los tres días estaba peor. No es plaga de bichos, eso os lo aseguro: la conozco." },

          { bloque: "Problema 2 · Los espantapájaros (con humor)", quien: "Rillard", texto: "Y luego están los gamberros. Alguien me está robando los espantapájaros, ¡con su cabeza de calabaza y todo! Ya me faltan unos cuantos. Como pille a los mocosos…",
            acotacion: "Aquí sube el tono, casi divertido: es el problema que menos le preocupa. Buen contraste antes de lo serio." },
          { quien: "Rillard", texto: "¿El del camino, decís? Ese me lo arrancaron hace días; todavía no había puesto otro. A lo mejor se ha ido andando, ¡ja!",
            acotacion: "Solo si mencionan que lo vieron. Que se ría solo." },

          { bloque: "Problema 3 · El ganado (preocupado)", quien: "Rillard", texto: "Lo de las vacas ya no tiene gracia. Cierro el granero cada noche, con tranca. Y aun así, una noche sí y otra no, falta una novilla. Ni rastro de lobo. Ni puerta forzada. Como si se las tragara la tierra.",
            acotacion: "Más serio. «Como si se las tragara la tierra» es literal (el ankheg): déjala caer sin énfasis." },

          { bloque: "Problema 4 · Rilly June (lo último, en voz baja)", quien: "Rillard", texto: "Y… mi nieta. Rilly June.",
            acotacion: "Pausa larga. Mira un momento la otra mecedora del porche, vacía." },
          { quien: "Rillard", texto: "Hace dos días que no la veo. Es dura como una raíz de roble, esa chica: trabaja más que tres peones y sabe cuidarse sola. Me digo que andará detrás de los ladrones de vacas… pero dos días son muchos días." },
          { quien: "Rillard", texto: "Por eso os he llamado, en realidad. Lo demás… lo demás es tierra y animales. Ella no.",
            acotacion: "Aquí es donde los jugadores deciden si les importa. Deja que respondan antes de pasar a la petición." }
        ],
        preguntas: [
          { p: "¿Dónde vio a Rilly por última vez?", r: "«Cenando, en la cocina. Dijo que oía ruidos raros abajo, en el sótano. Le dije que serían ratas…» (pista opcional hacia T6; tuerce el gesto al decirlo)." },
          { p: "¿Tiene Rilly enemigos o novio?", r: "«¿Enemigos? Las malas hierbas. ¿Novio? Si lo tiene, a mí no me lo ha presentado, la muy lista.»" },
          { p: "¿Quién era el mago?", r: "«Uno con sombrero puntiagudo y mucha prisa. No dejó nombre. Ni resultado.»" },
          { p: "¿Y las granjas vecinas?", r: "«También empiezan a secarse, pero lo nuestro es lo peor. Como si empezara aquí.» (lo es)." },
          { p: "¿Desde cuándo pasa todo?", r: "«Un par de semanas lo del trigo. Las vacas, algo antes. Lo de los espantapájaros ni lo sé, uno no cuenta espantapájaros.»" },
          { p: "¿Han visto algo de noche?", r: "«Yo duermo como un tronco. Pero los perros de los vecinos ladran hacia aquí, y no sé a qué.»" }
        ],
        narrar: [
          "Orden emocional: orgullo (cultivos) → humor (espantapájaros) → preocupación (vacas) → miedo contenido (Rilly). El contraste del medio hace que lo último pese más.",
          "No lo recites de un tirón: deja que los jugadores interrumpan con preguntas entre problema y problema.",
          "Cada problema es una pista hacia una entrada distinta de los túneles."
        ],
        bifurcaciones: [
          { si: "Preguntan por cada problema en detalle", entonces: "Cada uno lleva a una entrada distinta: campos, casa, espantapájaros o granero.", ir: "explorando-la-granja" },
          { si: "Rechazan el trabajo", entonces: "Rillard no insiste, pero vuelve a mencionar a su nieta. Casi todos los grupos cambian de idea." }
        ],
        consejo: "Rillard es el corazón emocional de la aventura: si los jugadores le cogen cariño aquí, el final pesa mucho más."
      },

      "la-peticion-de-rillard": {
        escena: "El encargo: encontrar a Rilly June y la causa de la plaga (200 po).",
        guion: [
          { quien: "Rillard", texto: "Os daré doscientas piezas de oro si me traéis a Rilly June a casa y averiguáis qué está matando mi tierra. No es una fortuna, pero es lo que hay en el bote." },
          { quien: "Rillard", texto: "Tomad. Es un dibujo de ella. Iba a llevárselo a la guardia de la ciudad… pero la guardia no baja hasta aquí por una granjera.",
            acotacion: "Saca un papel doblado muchas veces. Entrega el cartel de persona desaparecida." },
          { quien: "Rillard", texto: "Y llevaos esto. Era el kukri de mi bisabuelo. Dicen que la hoja guarda veneno; yo nunca lo he probado ni pienso hacerlo. Me lo devolvéis cuando acabéis.",
            acotacion: "Lo desenvuelve de un trapo y lo entrega con las dos manos." }
        ],
        preguntas: [
          { p: "Piden que Rillard los acompañe", r: "«¿Yo? Con estas rodillas no bajo ni al sótano sin quejarme. No, muchachos: esto es cosa vuestra.»" },
          { p: "Regatean el precio", r: "«Si traéis a la chica sana, os añado la mejor cena de Goldenwheat. Más oro no tengo.»" }
        ],
        bifurcaciones: [
          { si: "Quieren que Rillard los acompañe", entonces: "No: tiene unos ochenta años y lo dice él mismo, con humor." }
        ]
      },

      "hora-del-cuento": {
        escena: "Rillard cuenta la leyenda de Gunthar el Glotón.",
        guion: [
          { quien: "Rillard", texto: "¿Sabéis? Me recordáis a aquellos héroes… los que libraron a esta tierra de Gunthar el Glotón. ¿No conocéis la historia? Mi abuelo me la contaba para que volviera a casa antes de anochecer.",
            acotacion: "Se acomoda en la mecedora, tono de fuego de campamento." },
          { quien: "Rillard", texto: "Gunthar era un vampiro. Y tenía tres perros, tan sedientos de sangre como él. Secaban vacas, secaban granjeros… Hasta que unos valientes bajaron a su cripta y le clavaron una estaca en el corazón. La cerraron por fuera y nunca más se supo.",
            acotacion: "Recalca «tres perros»: son los demoperros de T9." },
          { quien: "Rillard", texto: "Hay quien dice que maldijo estas tierras con su último aliento. Y quien dice que todavía ronda por aquí. Bah. Cuentos para críos.",
            acotacion: "Ríe, pero se le escapa una mirada hacia los campos." }
        ],
        consejo: "Si los jugadores recuerdan «tres perros» al ver los demoperros de T9, habrás ganado."
      },

      "explorando-la-granja": {
        escena: "Eligen qué pista seguir: cada una lleva a una entrada distinta.",
        guion: [
          { quien: "Narrador", texto: "Tenéis cuatro hilos de los que tirar: los campos enfermos, la casa donde vivía Rilly June, el poste vacío del espantapájaros y el granero donde desaparecen las vacas. ¿Por dónde empezáis?" },
          { bloque: "Si van a los campos", quien: "Narrador", texto: "Entre las balas de trigo podrido, una está hundida hacia dentro. Al apartarla, un aliento frío sube desde un agujero en la tierra." },
          { bloque: "Si registran la casa", quien: "Narrador", texto: "El sótano huele a tierra recién removida. Tres tablas del suelo ceden bajo vuestro peso; debajo, un túnel baja hacia la oscuridad." },
          { bloque: "Si siguen al espantapájaros", quien: "Narrador", texto: "Alrededor del poste vacío quedan hebras de paja. Siguen, como migas de pan, hasta un agujero abierto entre los matorrales." },
          { bloque: "Si van al granero", quien: "Narrador", texto: "Las vacas que quedan están inquietas y no se acercan a una esquina. Allí, un montón de heno se ha derrumbado hacia dentro: debajo, la tierra está abierta como una boca." }
        ],
        narrar: [
          "Describe el hallazgo de cada entrada como un pequeño descubrimiento, no como una puerta evidente."
        ],
        bifurcaciones: [
          { si: "Investigan los cultivos (campos)", entonces: "Túnel oculto tras una bala de trigo podrida.", ir: "t1" },
          { si: "Buscan a Rilly June (la casa)", entonces: "Tablas sueltas en el sótano. Lleva directamente al osario de Justine.", ir: "t6" },
          { si: "Siguen al espantapájaros (camino)", entonces: "Rastro de paja hasta un agujero en el suelo.", ir: "t3" },
          { si: "Revisan el ganado (granero)", entonces: "Agujero bajo el heno derrumbado: el nido del ankheg.", ir: "t4" }
        ],
        consejo: "No importa cuál elijan: todas las entradas acaban conectando. Deja que el grupo se sienta dueño de la decisión."
      },

      "tuneles-de-la-granja": {
        escena: "Bajan a la red de túneles del ankheg.",
        guion: [
          { quien: "Narrador", texto: "La luz de vuestra antorcha apenas llega a tres pasos. Las paredes son de tierra cruda, marcadas por algo que ha raspado con fuerza, una y otra vez. De ellas brotan raíces negras que se enroscan unas con otras…",
            acotacion: "Baja la voz. Frases cortas." },
          { quien: "Narrador", texto: "…y si os quedáis quietos, juraríais que se mueven." }
        ],
        narrar: [
          "Cambia el ritmo: oscuridad, olor a tierra húmeda y a raíz podrida.",
          "Revela el mapa poco a poco: cubre lo que no han visto.",
          "Pregunta quién lleva luz. En la pestaña Combate, pon la iluminación en «Oscuridad» si nadie la lleva."
        ],
        ambiente: "Oscuridad total salvo sus luces. Las raíces son terreno difícil."
      },

      "t1": {
        escena: "Túnel de entrada desde los campos: niebla, vides negras y un aullido lejano.",
        guion: [
          { quien: "Narrador", texto: "Una niebla fina os lame los tobillos mientras bajáis. Vides negras, retorcidas, se aferran a las paredes de tierra como venas." },
          { quien: "Narrador", texto: "Entonces, desde muy lejos, llega un aullido. Largo. Hueco. Y no termina donde debería terminar.",
            acotacion: "Haz el aullido tú, o calla tres segundos. Mira a los jugadores." },
          { bloque: "Si superan Naturaleza CD 13", quien: "Narrador", texto: "Has oído lobos y perros toda tu vida. Eso no es ninguno de los dos.",
            acotacion: "Díselo solo a ese jugador, en voz baja." }
        ],
        bifurcaciones: [
          { si: "Siguen adelante por el túnel", entonces: "Continúan hacia el interior según el mapa (por ejemplo, el túnel de hongos).", ir: "t2" }
        ],
        consejo: "Escena sin combate: úsala para marcar el tono y que teman lo que aúlla."
      },

      "t2": {
        escena: "Hongos violeta y dos enredaderas atrapantes escondidas.",
        guion: [
          { quien: "Narrador", texto: "El túnel se ensancha. Del suelo se alzan dos plantas enormes, con forma de gota, cuyas ramas moradas se entrelazan como encaje y trepan hasta mezclarse con las vides del techo. Es… casi bonito.",
            acotacion: "Invita a acercarse. Que la curiosidad los meta en la trampa." },
          { bloque: "Si alguien supera Percepción CD 15", quien: "Narrador", texto: "Entre las raíces de la pared hay algo con forma de persona. Demasiado quieto. Y tiene espinas." },
          { bloque: "Cuando atacan", quien: "Narrador", texto: "Las plantas moradas se estremecen y sus zarcillos se lanzan hacia vosotros… mientras, de la pared, dos figuras de raíz se desprenden con un crujido." }
        ],
        bifurcaciones: [
          { si: "Alguien busca y supera Percepción CD 15", entonces: "Descubre las enredaderas: no tendrá desventaja en la iniciativa." },
          { si: "Se acercan a 10 ft sin detectarlas", entonces: "Las plantas atacan. Quien no las notó tira iniciativa con desventaja." }
        ]
      },

      "t3": {
        escena: "Esporas, un colgante brillante y una sala llena de espantapájaros… uno está vivo.",
        guion: [
          { quien: "Narrador", texto: "El aire está lleno de esporas blancas que flotan como polvo al sol. Hay espantapájaros por toda la sala: siete, ocho… Cada uno con su cabeza de calabaza podrida, todos mirando a ninguna parte.",
            acotacion: "Plano. No mires a ningún espantapájaros en concreto." },
          { quien: "Narrador", texto: "Del techo, enredado en una raíz nudosa, cuelga un colgante que brilla con luz propia. Parece esperar a que alguien lo coja." },
          { quien: "Narrador", texto: "Todos, una salvación de Constitución, por favor.",
            acotacion: "Las esporas (panel de Pruebas). Pídelo con naturalidad, como un trámite." },
          { bloque: "Cuando el espantapájaros despierta", quien: "Narrador", texto: "Uno de los espantapájaros gira la cabeza. Despacio. Hacia ti. La calabaza cruje al moverse y algo se retuerce dentro de las cuencas.",
            acotacion: "Señala al jugador más cercano." }
        ],
        bifurcaciones: [
          { si: "Tocan el colgante o al espantapájaros sin haberlo identificado", entonces: "El espantapájaros ataca y sorprende a quien no lo haya identificado." },
          { si: "Identifican al espantapájaros vivo (Investigación CD 15)", entonces: "Pueden atacarlo primero o evitarlo." },
          { si: "Se van sin luchar contra él", entonces: "Los sigue en silencio y ataca cuando estén débiles, por ejemplo justo después del ankheg.", ir: "t5" }
        ],
        consejo: "Si vuelven más tarde, puede faltar algún espantapájaros más: que empiecen a mirar a su espalda."
      },

      "t4": {
        escena: "El nido del ankheg: cadáveres de vacas, raíces que se mueven y plagas aguja escondidas.",
        guion: [
          { quien: "Narrador", texto: "Lo primero es el olor: carne podrida, dulce y espesa, que se pega a la garganta.",
            acotacion: "Deja que reaccionen antes de seguir." },
          { quien: "Narrador", texto: "El túnel termina de golpe en una caída de diez pies. Abajo, una sala amplia llena de huesos de vaca y cadáveres a medio comer, envueltos por raíces que se aprietan y se aflojan despacio… como si respiraran." },
          { bloque: "Si registran los cadáveres", quien: "Narrador", texto: "Entre los restos hay un saco de arpillera. Dentro, pan duro y tres manzanas. En la tela, dos letras bordadas con cuidado: R. J.",
            acotacion: "Pausa: es la primera prueba de que Rilly June estuvo aquí." }
        ],
        bifurcaciones: [
          { si: "Detectan las plagas (Percepción CD 15)", entonces: "Pueden rodearlas o prepararse." },
          { si: "Pisan las raíces o tocan los cadáveres", entonces: "Las tres plagas aguja atacan." },
          { si: "Examinan los cadáveres (Medicina o Arcanos CD 13)", entonces: "Descubren que es el nido de un ankheg: saben lo que les espera.", ir: "t5" }
        ]
      },

      "t5": {
        escena: "Una cámara llena de niebla donde el ankheg sigue excavando.",
        guion: [
          { quien: "Narrador", texto: "Una niebla espesa llena la cámara: no veis más allá de vuestro propio brazo. Huele a tierra recién abierta." },
          { quien: "Narrador", texto: "Clic. Clic-clic. Algo duro, como un caparazón, chasquea en la niebla. Rocas que ruedan. Tierra que cae…",
            acotacion: "Haz los chasquidos con los dedos o la lengua, cada vez más cerca." },
          { quien: "Narrador", texto: "…y de pronto, dos mandíbulas del tamaño de una puerta salen de la niebla, goteando algo que humea al tocar el suelo. ¡Tirad iniciativa!" }
        ],
        narrar: [
          "El ankheg los nota antes que ellos a él (sentido sísmico). Pon la iluminación en «Oscuridad / niebla densa»: los PJs atacan con desventaja y él no."
        ],
        bifurcaciones: [
          { si: "No lucharon contra el espantapájaros de T3", entonces: "Justo después de este combate, el espantapájaros ataca por la espalda.", ir: "t3" }
        ],
        consejo: "Es el combate más duro de los túneles: si el grupo llega muy tocado, recuérdales que pueden retirarse y descansar."
      },

      "t6": {
        escena: "Un osario con motas de luz: el espíritu de Justine pide ayuda.",
        guion: [
          { quien: "Narrador", texto: "Motas de luz flotan en el aire como luciérnagas cansadas. El suelo es un cementerio de huesos. Sobre ellos, raíces que se deslizan van desmontando, poco a poco, un esqueleto con una armadura de cuero rota." },
          { quien: "Narrador", texto: "Las motas se juntan alrededor del esqueleto. Y una voz, que no sale de ninguna parte, os habla." },
          { quien: "Justine", texto: "¿Hola…? ¿Hay alguien de verdad ahí? ¿Sois… aventureros? Por favor. Ya no sé cuánto tiempo llevo aquí abajo. ¿Podéis sacarme?",
            acotacion: "Voz lejana, con eco. Esperanza que casi no se atreve a serlo." },
          { bloque: "Si preguntan quién es", quien: "Justine", texto: "Me llamo Justine. Justine Fobarb. Bajé a esta cripta hace mucho… con mi grupo. Os lo cuento todo si me liberáis de estas raíces." },
          { bloque: "Si la liberan (tras vencer a las enredaderas)", quien: "Justine", texto: "Escuchad bien, que no me queda mucho. Hay un bicho enorme que escupe ácido; se lleva las vacas a su nido. Hay tres perros, los de Gunthar, que ya no son perros. Y hay un árbol en la cripta: nació de la estaca del vampiro. El fuego lo debilita, pero si no lo arrancáis de raíz, volverá.",
            acotacion: "Rápido, como alguien que por fin puede hablar." },
          { quien: "Justine", texto: "Mis compañeros se llevaron la gloria… y me dejaron aquí. No os hagáis eso entre vosotros. Nunca.",
            acotacion: "Las motas se apagan una a una. Silencio." }
        ],
        narrar: [
          "Justine no puede ser atacada ni afectada: es una presencia, no una criatura.",
          "Si superan Religión CD 12, entienden que las raíces son su jaula."
        ],
        bifurcaciones: [
          { si: "Destruyen las raíces (CA 10, 15 PG)", entonces: "Dos enredaderas atrapantes se desprenden de las paredes y atacan. Al vencer, Justine se despide y cuenta lo que sabe." },
          { si: "La ignoran o se van", entonces: "Justine se queda atrapada y no comparte nada. Pueden volver más tarde." }
        ],
        consejo: "Justine es la gran fuente de información: si la liberan, les das el mapa mental del final. Su abandono es un buen espejo para el grupo."
      },

      "t7": {
        escena: "Túnel cubierto de vides: dos plagas aguja se rascan con un rastrillo.",
        guion: [
          { quien: "Narrador", texto: "Las paredes desaparecen bajo una masa de vides que se retuercen. Y en mitad del túnel, dos criaturas bípedas cubiertas de espinas… se están rascando la espalda. Por turnos. Con un rastrillo oxidado." },
          { quien: "Narrador", texto: "Una de ellas suelta un suspiro largo, de puro gusto.",
            acotacion: "Deja que se rían. Justo cuando se relajen, empieza la emboscada." },
          { bloque: "Cuando atacan", quien: "Narrador", texto: "El rastrillo cae al suelo. Las dos criaturas se giran a la vez… y las vides de las paredes se despegan con un crujido: no estaban solas." }
        ],
        bifurcaciones: [
          { si: "Detectan las enredaderas (Percepción CD 15)", entonces: "Evitan la desventaja en la iniciativa." },
          { si: "Pasan sin mirar", entonces: "Plagas aguja de frente y enredaderas por los lados." }
        ]
      },

      "t8": {
        escena: "La entrada de la cripta y Rilly June, atrapada e inconsciente entre las vides.",
        guion: [
          { quien: "Narrador", texto: "Ante vosotros, unas puertas de piedra reventadas, medio tragadas por vides gruesas como brazos. Junto a ellas, envuelta en raíces como en un capullo, una joven mediana con ropa de faena. Respira. Es la chica del dibujo." },
          { bloque: "Al liberarla (Atletismo CD 15)", quien: "Rilly June", texto: "¿Qué…? ¡Ay, mi cabeza! ¿Quiénes sois? … ¿Os manda el abuelo? Soy Rilly June.",
            acotacion: "Energía de granjera: se levanta demasiado rápido y se tambalea." },
          { quien: "Rilly June", texto: "Oí excavar debajo del sótano, bajé a mirar y algo me agarró por la espalda. Ahí dentro hay un árbol. ¡Un árbol! Bajo tierra." },
          { quien: "Rilly June", texto: "¿Volver a casa? Es mi granja la que se está muriendo. Dadme mi horca y vamos.",
            acotacion: "Si intentan convencerla, que se cruce de brazos: Persuasión CD 15." }
        ],
        bifurcaciones: [
          { si: "La liberan (Atletismo CD 15, usa una acción)", entonces: "Despierta y cuenta lo que sabe: el túnel del sótano, la emboscada y el árbol de la cripta." },
          { si: "La convencen de volver (Persuasión CD 15)", entonces: "Vuelve a regañadientes a la casa: el final será sin ella.", ir: "conclusion" },
          { si: "No la convencen", entonces: "Os acompaña con su horca. Llévala tú o dale su carta a un jugador; intenta que no muera.", ir: "t9" }
        ],
        consejo: "Rilly June es valiente y tozuda: que insista en ayudar, es su granja."
      },

      "t9": {
        escena: "La cripta de Gunthar: el árbol Gulthias sale del ataúd, tres demoperros sin ojos lo guardan… y Lucian los espera sentado en una rama.",
        guion: [
          { quien: "Narrador", texto: "La cripta es alta y fría. En el centro, un árbol de corteza negra se retuerce contra el techo. Su tronco nace de la tapa astillada de un ataúd, enjaulado en raíces anudadas.",
            acotacion: "Primero el árbol. Luego el ataúd. Los perros, al final." },
          { quien: "Narrador", texto: "Tres perros dan vueltas a su alrededor. No tienen ojos. Cuando levantan la cabeza hacia vosotros, sus hocicos se abren… y se siguen abriendo. Demasiado." },
          { quien: "Narrador", texto: "Tres perros. Como en el cuento del Viejo Rill.",
            acotacion: "Solo si ningún jugador lo dice antes. Si alguien lo dice, mejor." },
          { bloque: "🎻 Lucian en el árbol", quien: "Narrador", texto: "Entonces, desde arriba, una nota de laúd. Sentado en la rama más alta, con las piernas cruzadas como en un palco, el Trovador Carmesí afina sus cuerdas de tripa. Una rosa negra cae girando hasta vuestros pies.",
            acotacion: "Si ya lo conocen del camino, deja que lo reconozcan solos." },
          { quien: "Lucian", texto: "¡Bienvenidos al acto final! ¿Lo oís? Es mi amo, que late bajo la madera. Solo necesita un poco de riego… rojo.",
            acotacion: "Señala el ataúd con el mástil del laúd." },
          { quien: "Lucian", texto: "¡Cantad conmigo, mis perritos! Que la sangre lleve el compás.",
            acotacion: "Fase A: empieza la Canción de sangre. Los demoperros ganan +2 al ataque, +1d6 necrótico y resistencia física (la app lo aplica)." },
          { quien: "Lucian", texto: "Tres perros sin ojos, un árbol sin muerte, y cinco héroes sin suerte… ¡qué bello es el final cuando nadie lo advierte!",
            acotacion: "Un verso por ronda. Lucian evita el cuerpo a cuerpo: Miedo, Patrón hipnótico, Disonancia discordante." },
          { bloque: "🎻 Fase B: el artista se retira", quien: "Lucian", texto: "Un público exigente… me encanta. Pero el show debe continuar.",
            acotacion: "Cuando mueran los demoperros o Lucian baje de 15 PG. Reverencia profunda." },
          { quien: "Narrador", texto: "Detrás de él, el aire se rasga como una tela negra. Da un paso atrás, hacia la oscuridad, y lo último que veis es su máscara sonriendo… aunque la porcelana no puede sonreír.",
            acotacion: "El portal se cierra al instante. Os deja solos con el árbol." },
          { quien: "Nota", texto: "El telón ha caído, pero la obra no ha terminado. Mi amo tiene paciencia; yo, repertorio. — L. V.",
            acotacion: "Atada a otra rosa negra, en la rama donde estaba sentado." },
          { bloque: "Cuando el árbol llega a 0 PG", quien: "Narrador", texto: "El árbol chilla como madera que se parte en pleno invierno. Sus hojas se ennegrecen y caen… pero no cae. Sus raíces siguen hundidas en la tierra, esperando." },
          { bloque: "Si lo desarraigan", quien: "Narrador", texto: "Con un último tirón, las raíces se sueltan con un crujido que recorre todos los túneles. A lo lejos, algo chilla… y se calla. Por primera vez, el aire huele solo a tierra." }
        ],
        bifurcaciones: [
          { si: "Mueren los demoperros o Lucian baja de 15 PG", entonces: "Fase B: reverencia, «el show debe continuar», portal negro y huye al Valle de las Sombras. Los deja con el árbol." },
          { si: "Lucian llega a 0 PG", entonces: "Se convierte en humo y se reforma con 1 PG en su turno (la app lo hace). Si vuelve a caer, su voz resuena en la cripta y escapa: nunca muere aquí." },
          { si: "Atacan a Lucian para impedir la canción", entonces: "Si queda Incapacitado o no puede cantar, la Canción de sangre se apaga (la app deja de aplicarla)." },
          { si: "Intentan seguirlo por el portal", entonces: "Se cierra justo delante de ellos. Queda en el aire un olor a rosas podridas." },
          { si: "Reducen el árbol a 0 PG", entonces: "Se marchita, pero sigue en pie: volverá a crecer en 3d10 días si no lo arrancan." },
          { si: "Usan fuego", entonces: "El árbol es vulnerable al fuego (daño doble)." },
          { si: "Lo desarraigan (Atletismo CD 15; Rilly ayuda: ventaja)", entonces: "Todas las plagas y enredaderas de los túneles mueren. Pueden abrir el ataúd.", ir: "conclusion" },
          { si: "Abren el ataúd", entonces: "Botín de Gunthar: Dardo +1, amuleto, pañuelo y 50 po." }
        ],
        consejo: "Premia la creatividad: un conjuro, un ritual o una idea loca para arrancar el árbol también valen. Lucian quiere que la sangre de los héroes riegue el árbol: si alguien cae junto al tronco, que lo celebre en verso. Al irse, deja la pista para la próxima aventura."
      },

      "conclusion": {
        escena: "Vuelven a la casa: la escena depende de Rilly June.",
        guion: [
          { bloque: "Si vuelven con Rilly June (o ella volvió antes)", quien: "Narrador", texto: "La mecedora deja de crujir antes de que lleguéis al camino. El Viejo Rill ya está de pie, apretando el sombrero entre las manos." },
          { quien: "Rillard", texto: "¡Por todas las calabazas de Goldenwheat! ¡Mi niña! … Todavía quedan héroes de los de verdad, ¿eh?",
            acotacion: "Abraza a Rilly; luego, sin soltarla, os mira a vosotros." },
          { quien: "Rillard", texto: "Pasad, pasad. Hay sopa de calabaza en el horno… de las pocas que sobrevivieron. Os la habéis ganado. Y esta casa es vuestra siempre que paséis por aquí." },
          { bloque: "Si vuelven sin ella", quien: "Rillard", texto: "Solos…",
            acotacion: "Se sienta despacio. No os mira." },
          { quien: "Rillard", texto: "Os pagaré lo prometido. Pero si queda alguna posibilidad… volved ahí abajo. Por favor.",
            acotacion: "Si Rilly murió, que pague en silencio y entre en casa sin despedirse." }
        ],
        bifurcaciones: [
          { si: "Vuelven con Rilly June", entonces: "Final feliz: cena, alojamiento y la gratitud de Rillard." },
          { si: "Rilly volvió antes a casa (la convencieron en T8)", entonces: "Rilly espera en el porche con su abuelo: mismo final feliz." },
          { si: "Vuelven sin ella (sigue en los túneles)", entonces: "Rillard les pide que vuelvan a buscarla.", ir: "t8" },
          { si: "Rilly June murió", entonces: "Rillard paga en silencio y no los invita a quedarse." }
        ],
        consejo: "Devuelve aquí todo lo que invirtieron en Rillard al principio: una frase suya bien dicha vale más que el oro."
      },

      "recompensa-de-rillard": {
        escena: "El pago: 200 po y el kukri del bisabuelo.",
        guion: [
          { quien: "Rillard", texto: "Doscientas, como dije. Contadlas si queréis, no me ofendo." },
          { quien: "Rillard", texto: "Y el kukri… quedáoslo. Mi bisabuelo habría querido que estuviera en buenas manos, no colgado de una pared.",
            acotacion: "Si intentan devolverlo, que cierre sus manos sobre las del jugador." }
        ]
      },

      "avance-de-personaje": {
        escena: "Subida a nivel 3.",
        narrar: [
          "Cierra la sesión con la subida de nivel y deja que cada jugador apunte su botín en la hoja nueva."
        ]
      }
    }
  }
};
