// Página de hojas de personaje para los jugadores (personajes.html).
// Lee los mismos datos que el asistente (data/*.js) y los explica en lenguaje de mesa.
(function () {
  "use strict";

  const R = window.Reglas;
  const PJS = window.DATA_PJS || [];
  const ARMAS = window.DATA_ARMAS || [];
  const HECHIZOS = window.DATA_HECHIZOS || [];
  const OBJETOS = window.DATA_OBJETOS || [];
  const PARTIDAS = window.DATA_PARTIDAS || [];
  // La partida cuyos objetos y hechizos sugeridos se muestran (la más reciente)
  const PARTIDA = PARTIDAS.find((p) => p.id === "libro2") || PARTIDAS[PARTIDAS.length - 1] || {};

  const porId = (lista, id) => lista.find((x) => x.id === id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const signo = R.signo;

  const NOMBRES_ATR = { FUE: "Fuerza", DES: "Destreza", CON: "Constitución", INT: "Inteligencia", SAB: "Sabiduría", CAR: "Carisma" };
  const ATR_HABILIDAD = {
    "Acrobacias": "DES", "Atletismo": "FUE", "Arcanos": "INT", "Engaño": "CAR", "Historia": "INT",
    "Perspicacia": "SAB", "Intimidación": "CAR", "Investigación": "INT", "Medicina": "SAB",
    "Naturaleza": "INT", "Percepción": "SAB", "Interpretación": "CAR", "Persuasión": "CAR",
    "Religión": "INT", "Juego de manos": "DES", "Sigilo": "DES", "Supervivencia": "SAB",
    "Trato con animales": "SAB"
  };

  // Qué hace cada maestría de arma, explicado para el jugador
  const MAESTRIAS = {
    Fastidiar: "Si golpeas y haces daño, tienes ventaja en tu siguiente ataque contra esa criatura antes del final de tu próximo turno.",
    Socavar: "Si golpeas, esa criatura tiene desventaja en su siguiente tirada de ataque antes del inicio de tu próximo turno.",
    Ralentizar: "Si golpeas y haces daño, su velocidad baja 10 ft hasta el inicio de tu próximo turno.",
    Rozar: "Si fallas, la criatura recibe igualmente tanto daño como tu modificador de característica (del mismo tipo).",
    Mella: "El ataque extra de un arma ligera lo haces dentro de la acción de Ataque, sin gastar tu acción adicional (una vez por turno).",
    Derribar: "Si golpeas, la criatura hace una salvación de CON (CD 8 + mod. + competencia) o queda Derribada."
  };

  // Consejos de juego por personaje (para que cada jugador sepa sacarle partido)
  const CONSEJOS = {
    lady_applejack: [
      "Busca siempre el <b>Ataque furtivo</b> (+1d6): lo consigues si atacas con ventaja, o si un aliado está a 5 ft de tu objetivo.",
      "Con <b>Mella</b> en la daga, atacas con la espada corta y luego con la daga en la misma acción, y te queda la acción adicional libre.",
      "Usa la <b>Acción astuta</b>: ataca y luego <b>Destrábate</b> para alejarte sin ataques de oportunidad, o <b>Escóndete</b> para tener ventaja en el siguiente ataque.",
      "El <b>Gorro de la Desaparición</b> te vuelve Invisible: perfecto para explorar o colocarte. Se rompe al atacar, pero ese primer ataque va con ventaja.",
      "Eres la experta en trampas y cerraduras: Juego de manos y Sigilo +7, y herramientas de ladrón."
    ],
    will_el_sabio: [
      "Tienes CA 11 y pocos PG: quédate detrás. Lanza <b>Armadura de mago</b> al empezar el día (dura 8 horas y no requiere concentración) y pasarás a CA 14.",
      "<b>Escudo</b> es tu salvavidas: cuando te vayan a golpear, úsalo como reacción para sumar +5 a tu CA.",
      "<b>Dormir</b> y <b>Rociada de color</b> anulan a varios enemigos a la vez. <b>Proyectil mágico</b> nunca falla. <b>Onda atronadora</b> y <b>Manos ardientes</b>, si te rodean.",
      "Solo puedes concentrarte en un hechizo a la vez. Si te dañan mientras te concentras, tiras una salvación de CON para mantenerlo.",
      "Tras un descanso corto, la <b>Recuperación arcana</b> te devuelve un espacio de conjuro (una vez por descanso largo).",
      "La <b>Varita de secretos</b> te avisa si hay puertas secretas o trampas cerca: úsala en salas sospechosas."
    ],
    sundar: [
      "Eres la primera línea: CA 17 y 26 PG. Colócate entre los enemigos y tus compañeros más frágiles.",
      "<b>Atacante salvaje</b>: una vez por turno, al golpear, tiras el daño dos veces y te quedas con el mejor.",
      "Con la gran espada y <b>Rozar</b>, incluso si fallas haces 3 de daño. Con el <b>Mayal +1</b> y <b>Socavar</b>, el enemigo tendrá desventaja en su siguiente ataque.",
      "<b>Oleada de acción</b>: una vez por descanso, haces dos acciones en el mismo turno (por ejemplo, dos ataques).",
      "<b>Tomar aliento</b> (acción adicional) te cura 1d10 + 2. Fuera de combate, con <b>Mente táctica</b>, si fallas una prueba puedes gastar un uso para sumar 1d10.",
      "Jabalinas y ballesta con <b>Ralentizar</b>: ideales contra enemigos que huyen."
    ],
    nog: [
      "Eres el sanador del grupo y además aguantas bien: CA 18.",
      "Empieza los combates difíciles con <b>Bendecir</b>: tres aliados suman 1d4 a sus ataques y salvaciones (concentración).",
      "<b>Saeta guía</b> hace 4d6 radiante y da ventaja al siguiente ataque contra el objetivo.",
      "Cura con <b>Curar heridas</b> (gasta espacio) o con <b>Chispa divina</b> (gasta Canalizar divinidad, sin espacio). Si alguien cae a 0 PG, <b>Preservar la vida</b> lo estabiliza a 15 ft.",
      "<b>Canalizar divinidad</b> (2 usos): Chispa divina cura o daña 1d8 + 3. <b>Expulsar muertos vivientes</b> hace huir a los no muertos.",
      "Lanza <b>Guía</b> a quien vaya a hacer una prueba importante: suma 1d4."
    ],
    tayr: [
      "Eres un muro: CA 19 con escudo. Protege a los demás y aguanta en primera línea.",
      "<b>Castigo divino</b>: justo después de golpear cuerpo a cuerpo, +2d8 radiante (+3d8 contra infernales y muertos vivientes). Una vez al día es gratis.",
      "<b>Favor divino</b> (acción adicional): durante 1 minuto, todos tus ataques con arma hacen +1d4 radiante.",
      "<b>Imposición de manos</b>: reserva de 10 PG para curar a quien toques. Con 5 puntos también quitas el veneno.",
      "<b>Suerte</b> de mediano: si sacas un 1 en el d20, repites la tirada. <b>Valiente</b>: ventaja contra el miedo.",
      "La <b>Lengua de fuego</b> es una gran espada a dos manos: para usarla tienes que quitarte el escudo (eso cuesta tu acción). Enciéndela con la acción adicional y suma 2d6 de fuego."
    ]
  };

  // ---------- Datos derivados ----------
  function armasDe(pj) {
    const propias = pj.armas.map((id) => ({ arma: porId(ARMAS, id), magico: null })).filter((a) => a.arma);
    const magicas = objetosDe(pj)
      .map(({ objeto }) => objeto)
      .filter((o) => o.tipo === "arma")
      .map((o) => {
        const base = porId(ARMAS, o.armaBase);
        return base && {
          arma: { ...base, nombre: o.nombre, bonusAtaque: (o.bonusAtaque || 0), bonusDano: (o.bonusDano || 0) },
          magico: o
        };
      })
      .filter(Boolean);
    return [...magicas, ...propias];
  }

  // Objetos mágicos que el PJ lleva en la partida (portador asignado en data/partidas.js)
  function objetosDe(pj) {
    return (PARTIDA.botin || [])
      .filter((e) => typeof e === "object" && e.portador === pj.id)
      .map((e) => ({ objeto: porId(OBJETOS, e.id), sintonizado: Boolean(e.sintonizado) }))
      .filter((x) => x.objeto);
  }

  function hechizosDe(pj) {
    const trucos = (pj.trucos || []).map((id) => porId(HECHIZOS, id)).filter(Boolean);
    const conocidos = pj.libroConjuros
      ? pj.libroConjuros.map((id) => porId(HECHIZOS, id)).filter(Boolean)
      : HECHIZOS.filter((h) => h.nivel === 1 && (h.clases || []).includes(pj.clase));
    const siempre = (pj.siemprePreparados || []).map((id) => porId(HECHIZOS, id)).filter(Boolean);
    const rasgos = (pj.rasgosConjuro || []).map((id) => porId(HECHIZOS, id)).filter(Boolean);
    const sugeridos = ((PARTIDA.preparados || {})[pj.id]) || [];
    return { trucos, conocidos, siempre, rasgos, sugeridos };
  }

  // ---------- Render ----------
  function renderPj(pj) {
    const con = R.mod(pj.atributos.CON);
    const pasiva = 10 + ((pj.habilidades || {})["Percepción"] ?? R.mod(pj.atributos.SAB));
    return `
      <article class="hoja">
        <section class="encabezado">
          <div>
            <h2>${esc(pj.nombre)}</h2>
            <p class="linea">${esc(pj.clase)} de nivel ${pj.nivel} · ${esc(pj.especie)} · ${esc(pj.trasfondo)} · ${esc(pj.alineamiento)}</p>
            <p class="sub">Jugador: ${esc(pj.jugador)} · Tamaño ${esc(pj.tamano)}</p>
          </div>
        </section>

        <section class="numeros">
          ${caja("Clase de armadura", pj.ca, esc(pj.armadura || ""))}
          ${caja("Puntos de golpe", pj.pgMax, `Dados de golpe: ${pj.nivel}${esc(pj.dadoGolpe.replace(/^\d+/, ""))} (${signo(con)} CON cada uno)`)}
          ${caja("Velocidad", pj.velocidad + " ft", "por turno")}
          ${caja("Iniciativa", signo(R.iniciativa(pj)), "suma esto a tu d20")}
          ${caja("Competencia", signo(pj.competencia), "en lo que dominas")}
          ${caja("Percepción pasiva", pasiva, "para notar cosas sin tirar")}
        </section>

        ${consejos(pj)}

        <div class="dos-columnas">
          <section class="bloque">
            <h3>Características</h3>
            <p class="ayuda">El <b>modificador</b> se suma a las tiradas. ★ = salvación en la que eres competente.</p>
            <div class="atributos">
              ${R.ATRIBUTOS.map((a) => {
                const comp = (pj.salvacionesCompetentes || []).includes(a);
                return `<div class="atributo ${comp ? "competente" : ""}">
                  <span class="atr-nombre">${NOMBRES_ATR[a]}</span>
                  <span class="atr-mod">${signo(R.mod(pj.atributos[a]))}</span>
                  <span class="atr-valor">${pj.atributos[a]}</span>
                  <span class="atr-salv">${comp ? "★ " : ""}Salvación ${signo(R.salvacion(pj, a))}</span>
                </div>`;
              }).join("")}
            </div>
          </section>

          <section class="bloque">
            <h3>Habilidades</h3>
            <p class="ayuda">Bonificador a sumar al d20 en cada prueba. En dorado, las que dominas.</p>
            ${habilidades(pj)}
          </section>
        </div>

        ${ataques(pj)}
        ${hechizos(pj)}
        ${rasgos(pj)}
        ${objetos(pj)}
        ${inventario(pj)}
      </article>`;
  }

  function caja(titulo, valor, pie) {
    return `<div class="caja"><span class="caja-titulo">${titulo}</span><span class="caja-valor">${esc(valor)}</span><span class="caja-pie">${pie}</span></div>`;
  }

  function consejos(pj) {
    const lista = CONSEJOS[pj.id];
    if (!lista) return "";
    return `<section class="bloque consejos">
      <h3>💡 Cómo jugar a ${esc(pj.nombre)}</h3>
      <ul>${lista.map((t) => `<li>${t}</li>`).join("")}</ul>
    </section>`;
  }

  function habilidades(pj) {
    const hab = pj.habilidades || {};
    const nombres = Object.keys(ATR_HABILIDAD).sort((a, b) => a.localeCompare(b, "es"));
    return `<ul class="habilidades">${nombres.map((n) => {
      const atr = ATR_HABILIDAD[n];
      const base = R.mod(pj.atributos[atr]);
      const valor = hab[n] != null ? hab[n] : base;
      const competente = valor > base;
      return `<li class="${competente ? "competente" : ""}"><span>${n} <span class="sub">(${atr})</span></span><b>${signo(valor)}</b></li>`;
    }).join("")}</ul>`;
  }

  function ataques(pj) {
    const filas = armasDe(pj).map(({ arma, magico }) => {
      const r = R.ataqueArma(pj, arma);
      const conMaestria = (pj.maestrias || []).includes(magico ? magico.armaBase : arma.id);
      const alcance = [arma.alcance && `cuerpo a cuerpo ${arma.alcance}`, arma.distancia && `a distancia ${arma.distancia} ft`].filter(Boolean).join(" · ");
      return `<tr>
        <td><b>${magico ? "✨ " : ""}${esc(arma.nombre)}</b>
          <div class="sub">${esc(arma.propiedades.join(", ") || "—")}${arma.versatil ? ` · a dos manos ${esc(arma.versatil)}` : ""}${r.competente ? "" : " · <span class='aviso'>sin competencia</span>"}</div></td>
        <td class="num">${signo(r.bonus)}</td>
        <td>${esc(r.textoDano)} <span class="sub">${esc(arma.tipoDano)}</span></td>
        <td class="sub">${esc(alcance)}</td>
        <td>${conMaestria ? `<b>${esc(arma.maestria)}</b><div class="sub">${esc(MAESTRIAS[arma.maestria] || "")}</div>` : `<span class="sub">—</span>`}</td>
      </tr>`;
    }).join("");
    return `<section class="bloque">
      <h3>⚔ Ataques</h3>
      <p class="ayuda">Tira 1d20 + <b>Ataque</b>; si igualas o superas la CA del enemigo, golpeas y tiras el <b>Daño</b>. Con un 20 natural es crítico: tiras el doble de dados de daño.</p>
      <div class="tabla-scroll"><table>
        <thead><tr><th>Arma</th><th>Ataque</th><th>Daño</th><th>Alcance</th><th>Maestría</th></tr></thead>
        <tbody>${filas}</tbody>
      </table></div>
      ${pj.ataqueFurtivo ? `<p class="nota">🗡 <b>Ataque furtivo:</b> una vez por turno, +${esc(pj.ataqueFurtivo)} al daño con un arma sutil o a distancia si tienes ventaja, o si un aliado está a 5 ft del objetivo (y no tienes desventaja).</p>` : ""}
    </section>`;
  }

  function fichaHechizo(h, etiqueta) {
    const marcas = [
      h.nivel === 0 ? "Truco · sin límite" : h.usaRecurso ? "Canalizar divinidad" : `Nivel ${h.nivel} · gasta 1 espacio`,
      h.tiempo, h.alcance, h.concentracion ? "concentración" : null
    ].filter(Boolean);
    return `<div class="hechizo">
      <div class="hechizo-cab"><b>${esc(h.nombre)}</b> <span class="sub">${esc(h.en || "")}</span>${etiqueta ? ` <span class="etiqueta">${etiqueta}</span>` : ""}</div>
      <div class="hechizo-meta">${marcas.map((m) => `<span>${esc(m)}</span>`).join("")}</div>
      <p>${esc(h.texto)}</p>
    </div>`;
  }

  function hechizos(pj) {
    const { trucos, conocidos, siempre, rasgos, sugeridos } = hechizosDe(pj);
    if (!trucos.length && !conocidos.length && !rasgos.length) return "";
    const espacios = (pj.espaciosConjuro || {})[1] || 0;
    const cd = R.cdConjuro(pj);
    const conRasgosNv1 = espacios > 0;
    return `<section class="bloque">
      <h3>✨ Magia</h3>
      ${cd != null && conRasgosNv1 ? `<div class="chips">
        <span class="chip">CD de tus conjuros <b>${cd}</b></span>
        <span class="chip">Ataque de conjuro <b>${signo(R.ataqueConjuro(pj))}</b></span>
        <span class="chip">Espacios de nivel 1: <b>${espacios}</b> (vuelven con descanso largo)</span>
        ${pj.maxPreparados ? `<span class="chip">Preparas <b>${pj.maxPreparados}</b> hechizos tras cada descanso largo</span>` : ""}
      </div>
      <p class="ayuda">Los enemigos tiran salvación contra tu <b>CD</b>; en los hechizos de ataque tiras tú 1d20 + <b>ataque de conjuro</b>. Un hechizo de nivel 1 gasta un espacio; los trucos son gratis. Solo puedes mantener <b>un</b> hechizo de concentración a la vez.</p>` : ""}
      ${trucos.length ? `<h4>Trucos</h4><div class="hechizos">${trucos.map((h) => fichaHechizo(h)).join("")}</div>` : ""}
      ${rasgos.length ? `<h4>Canalizar divinidad</h4><div class="hechizos">${rasgos.map((h) => fichaHechizo(h)).join("")}</div>` : ""}
      ${siempre.length ? `<h4>Siempre preparados</h4><div class="hechizos">${siempre.map((h) => fichaHechizo(h, "siempre")).join("")}</div>` : ""}
      ${conocidos.filter((h) => !siempre.includes(h)).length ? `<h4>${pj.libroConjuros ? "Tu libro de conjuros" : "Hechizos de nivel 1 que puedes preparar"}</h4>
        <div class="hechizos">${conocidos.filter((h) => !siempre.includes(h)).map((h) => fichaHechizo(h, sugeridos.includes(h.id) ? "preparado" : "")).join("")}</div>` : ""}
    </section>`;
  }

  function rasgos(pj) {
    const recursos = (pj.recursos || []).map((r) => {
      const total = r.usos != null ? `${r.usos} uso${r.usos === 1 ? "" : "s"}` : `reserva de ${r.reserva} PG`;
      const recarga = { largo: "descanso largo", corto: "descanso corto o largo" }[r.recarga] || r.recarga.replace("1 en corto / todos en largo", "recupera 1 con descanso corto y todos con largo");
      return `<li><b>${esc(r.nombre)}</b>: ${esc(total)} · ${esc(recarga)}</li>`;
    }).join("");
    return `<section class="bloque">
      <h3>🛡 Rasgos y dotes</h3>
      <div class="rasgos">
        ${(pj.rasgos || []).filter((r) => r.texto).map((r) => `<div class="rasgo ${r.combate ? "combate" : ""}">
          <div class="rasgo-cab"><b>${esc(r.nombre)}</b>${r.combate ? ` <span class="etiqueta">combate</span>` : ""}</div>
          <p>${esc(r.texto)}</p>
        </div>`).join("")}
      </div>
      ${recursos ? `<h4>Usos limitados</h4><ul class="recursos">${recursos}</ul>` : ""}
    </section>`;
  }

  function objetos(pj) {
    const lista = objetosDe(pj);
    if (!lista.length) return "";
    return `<section class="bloque">
      <h3>🎒 Objetos mágicos</h3>
      <div class="rasgos">
        ${lista.map(({ objeto: o, sintonizado }) => `<div class="rasgo magico">
          <div class="rasgo-cab"><b>${esc(o.nombre)}</b> <span class="sub">${esc(o.en)} · ${esc(o.rareza)}</span>
            ${o.sintonizacion ? `<span class="etiqueta">${sintonizado ? "sintonizado" : "requiere sintonización"}</span>` : ""}</div>
          <p>${esc(o.texto)}</p>
        </div>`).join("")}
      </div>
      ${lista.some(({ objeto }) => objeto.sintonizacion) ? `<p class="ayuda">Sintonizarse con un objeto lleva un descanso corto dedicado a él. Puedes tener hasta 3 objetos sintonizados.</p>` : ""}
    </section>`;
  }

  function inventario(pj) {
    const items = (pj.inventario || []).filter((e) => e.cantidad > 0);
    return `<section class="bloque">
      <h3>🎒 Equipo</h3>
      <ul class="inventario">
        ${items.map((e) => `<li><span><b>${esc(e.nombre)}</b>${e.cantidad > 1 ? ` ×${e.cantidad}` : ""}</span>${e.texto ? `<span class="sub">${esc(e.texto)}</span>` : ""}</li>`).join("")}
      </ul>
      <p class="nota">💰 ${pj.oro} piezas de oro</p>
    </section>`;
  }

  // Guía rápida de reglas para toda la mesa
  function renderGuia() {
    return `<article class="hoja guia">
      <section class="encabezado"><div><h2>Guía rápida de combate</h2><p class="linea">Lo esencial de las reglas de 2024 para todos los jugadores</p></div></section>
      <div class="dos-columnas">
        <section class="bloque">
          <h3>Tu turno</h3>
          <ul>
            <li><b>Movimiento</b>: hasta tu velocidad, repartido como quieras antes y después de actuar.</li>
            <li><b>Una acción</b>: atacar, lanzar un conjuro, Correr, Destrabarse, Esconderse, Ayudar, usar un objeto…</li>
            <li><b>Una acción adicional</b>, solo si algo te la da (Tomar aliento, una poción, Acción astuta, ciertos hechizos).</li>
            <li><b>Una reacción</b> por ronda, incluso en el turno de otro: el ataque de oportunidad o el hechizo Escudo.</li>
            <li>Solo puedes lanzar <b>un hechizo con espacio</b> por turno.</li>
          </ul>
        </section>
        <section class="bloque">
          <h3>Tiradas</h3>
          <ul>
            <li><b>Ventaja</b>: tira 2d20 y quédate con el mayor. <b>Desventaja</b>: el menor. Si tienes las dos, se anulan.</li>
            <li><b>20 natural</b> en un ataque: crítico, tiras el doble de dados de daño. <b>1 natural</b>: fallas siempre.</li>
            <li><b>Inspiración heroica</b>: gástala para repetir cualquier d20.</li>
            <li><b>Ataque de oportunidad</b>: si sales del alcance de un enemigo sin Destrabarte, puede atacarte con su reacción.</li>
          </ul>
        </section>
        <section class="bloque">
          <h3>Caer a 0 PG</h3>
          <ul>
            <li>Quedas inconsciente. En cada turno tiras un d20 sin bonificadores: <b>10 o más</b> es un éxito y <b>menos de 10</b> es un fallo.</li>
            <li>Con 3 éxitos te estabilizas; con 3 fallos mueres. Un <b>20</b> te devuelve 1 PG. Un <b>1</b> cuenta como dos fallos.</li>
            <li>Cualquier curación te levanta. Un aliado puede estabilizarte con un kit de sanador o con Preservar la vida.</li>
          </ul>
        </section>
        <section class="bloque">
          <h3>Concentración</h3>
          <ul>
            <li>Algunos hechizos (Bendecir, Escudo de fe…) duran mientras te concentras. Solo uno a la vez.</li>
            <li>Si recibes daño, haz una salvación de CON con CD 10 o la mitad del daño, la mayor de las dos. Si fallas, el hechizo termina.</li>
            <li>También la pierdes si quedas Incapacitado o lanzas otro hechizo de concentración.</li>
          </ul>
        </section>
        <section class="bloque">
          <h3>Descansos</h3>
          <ul>
            <li><b>Descanso corto</b> (1 hora): gasta dados de golpe para curarte. Recupera Tomar aliento (1 uso), Oleada de acción y Canalizar divinidad (1 uso).</li>
            <li><b>Descanso largo</b> (8 horas): recuperas todos los PG, los espacios de conjuro y los usos, y vuelves a preparar hechizos.</li>
          </ul>
        </section>
        <section class="bloque">
          <h3>Condiciones frecuentes</h3>
          <ul class="condiciones">
            <li><b>Agarrado</b>: velocidad 0. Para escapar, acción con prueba de FUE (Atletismo) o DES (Acrobacias).</li>
            <li><b>Apresado</b>: velocidad 0; tus ataques tienen desventaja y los ataques contra ti, ventaja.</li>
            <li><b>Asustado</b>: desventaja mientras veas la fuente del miedo; no puedes acercarte a ella.</li>
            <li><b>Derribado</b>: levantarte cuesta la mitad de tu movimiento. Los ataques cuerpo a cuerpo contra ti tienen ventaja.</li>
            <li><b>Envenenado</b>: desventaja en ataques y pruebas de característica.</li>
            <li><b>Invisible</b>: tus ataques tienen ventaja y los de quien no te ve, desventaja.</li>
            <li><b>Paralizado</b>: no puedes actuar ni moverte. Los golpes a 5 ft contra ti son críticos.</li>
          </ul>
        </section>
      </div>
    </article>`;
  }

  // ---------- Navegación ----------
  const pestanas = document.getElementById("pestanas");
  const hoja = document.getElementById("hoja");
  document.getElementById("subtitulo").textContent = PARTIDA.nombre ? `Objetos y hechizos de: ${PARTIDA.nombre}` : "";

  const entradas = [...PJS.map((p) => ({ id: p.id, nombre: p.nombre })), { id: "guia", nombre: "📜 Guía rápida" }];

  function mostrar(id) {
    const pj = porId(PJS, id);
    hoja.innerHTML = pj ? renderPj(pj) : renderGuia();
    pestanas.querySelectorAll("a").forEach((a) => a.setAttribute("aria-current", a.dataset.id === id ? "page" : "false"));
    document.title = `${pj ? pj.nombre : "Guía rápida"} · Hojas de personaje`;
    window.scrollTo(0, 0);
  }

  pestanas.innerHTML = entradas.map((e) => `<a href="#${esc(e.id)}" data-id="${esc(e.id)}">${esc(e.nombre)}</a>`).join("");
  window.addEventListener("hashchange", () => mostrar(location.hash.slice(1) || entradas[0].id));
  mostrar(location.hash.slice(1) || entradas[0].id);
})();
