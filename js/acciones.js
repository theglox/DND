// Acciones del turno: ataques con arma o conjuro, salvaciones (acciones enemigas y hechizos),
// dardos, curación, buffs, recursos de clase, concentración y efectos pendientes.
// Todas las tiradas son dados físicos: la app solo pide casilleros y hace las cuentas.
window.Acciones = (function () {
  "use strict";

  const R = window.Reglas;
  const D = window.Dados;
  const PJS = window.DATA_PJS || [];
  const ENEMIGOS = window.DATA_ENEMIGOS || [];
  const HECHIZOS = window.DATA_HECHIZOS || [];
  const BUFFS = window.DATA_BUFFS || [];
  const OBJETOS = window.DATA_OBJETOS || [];
  const ARMAS = window.DATA_ARMAS || [];

  const porId = (lista, id) => lista.find((x) => x.id === id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const MODOS = { normal: "Normal", ventaja: "Ventaja", desventaja: "Desventaja" };
  const CONDICIONES = ["Agarrado", "Apresado", "Asustado", "Aturdido", "Cegado", "Derribado",
    "Ensordecido", "Envenenado", "Hechizado", "Incapacitado", "Inconsciente", "Invisible",
    "Paralizado", "Petrificado"];

  const MAESTRIAS = {
    Fastidiar: (o) => `Fastidiar: ventaja en tu siguiente ataque contra ${o} antes del final de tu próximo turno.`,
    Socavar: (o) => `Socavar: ${o} tiene desventaja en su siguiente ataque antes del inicio de tu próximo turno.`,
    Ralentizar: (o) => `Ralentizar: ${o} pierde 10 ft de velocidad hasta el inicio de tu próximo turno.`,
    Mella: () => `Mella: el ataque extra con arma ligera puede ir dentro de la acción de Ataque.`,
    Empujar: (o) => `Empujar: puedes alejar a ${o} hasta 10 ft.`
  };

  // ---------- Utilidades ----------
  const participante = (c, uid) => c.participantes.find((p) => p.uid === uid);
  const datosDe = (p) => porId(p.tipo === "pj" ? PJS : ENEMIGOS, p.refId);
  // enHumo: a 0 PG pero se reforma en su turno (No muerto implacable): sigue en la iniciativa
  const fuera = (p) => (p.tipo === "enemigo" && p.pg <= 0 && !p.enHumo) || Boolean(p.muerto);
  const suerteDe = (p) => p.tipo === "pj" && Boolean(datosDe(p).suerteMediano);
  const hechizo = (id) => porId(HECHIZOS, id);

  // CA con buffs: Armadura de mago (base 13 + DES sin armadura) y Escudo de fe (+2).
  function caDe(p) {
    const d = datosDe(p);
    let ca = d.ca;
    let extra = 0;
    (p.buffs || []).forEach((b) => {
      const ef = (porId(BUFFS, b.id) || {}).efectos || {};
      if (ef.caBase && /sin armadura/i.test(d.armadura || "")) ca = Math.max(ca, ef.caBase + R.mod(d.atributos.DES));
      if (ef.ca) extra += ef.ca;
    });
    if (p.tipo === "pj" && d.escudo && !Objetos.equipoDe(Estado.get(), d).escudo) ca -= d.escudo;
    return ca + extra;
  }

  // Dado extra de un buff (Bendecir: "1d4" a ataques/salvaciones). campo: ataqueExtraDado | salvacionExtraDado
  function extraDado(p, campo) {
    for (const b of p.buffs || []) {
      const def = porId(BUFFS, b.id);
      if (def && def.efectos && def.efectos[campo]) return { dado: def.efectos[campo], nombre: def.nombre };
    }
    return null;
  }

  // Defensas contra un ataque concreto: además, la Canción de sangre da resistencia a daño
  // contundente, cortante y perforante de armas no mágicas a los aliados de Lucian
  const FISICOS = ["contundente", "cortante", "perforante"];
  function defensasAtaque(c, ac, desc, obj) {
    const def = defensasDe(obj);
    const armaNoMagica = desc && desc.atk && desc.atk.pj && !desc.atk.arma.magico;
    if (armaNoMagica && bajoCancion(c, obj) && ac.opciones.cancion !== false) {
      def.resistencias = [...new Set([...def.resistencias, ...FISICOS])];
    }
    return def;
  }

  // Defensas de la ficha + resistencias de buffs (p. ej. Poción de resistencia)
  function defensasDe(p) {
    const d = datosDe(p);
    const deBuffs = (p.buffs || []).flatMap((b) => ((porId(BUFFS, b.id) || {}).efectos || {}).resistencias || []);
    return { resistencias: [...(d.resistencias || []), ...deBuffs], inmunidades: d.inmunidades || [], vulnerabilidades: d.vulnerabilidades || [] };
  }

  function log(c, texto) {
    c.log.push({ ronda: c.ronda, texto });
  }

  function flags(c) {
    return c.turnoFlags || (c.turnoFlags = {});
  }

  // Candidatos a objetivo: primero los del bando contrario.
  function candidatos(c, actor) {
    const vivos = c.orden.map((u) => participante(c, u)).filter((q) => q && !fuera(q) && !q.enHumo && q.uid !== actor.uid);
    return [...vivos.filter((q) => q.tipo !== actor.tipo), ...vivos.filter((q) => q.tipo === actor.tipo)];
  }

  function aliados(c, actor) {
    return c.orden.map((u) => participante(c, u)).filter((q) => q && q.tipo === actor.tipo && !fuera(q));
  }

  function opcionesObjetivo(c, actor, seleccionado, { incluirPropio = false } = {}) {
    let lista = candidatos(c, actor);
    if (incluirPropio) lista = [actor, ...lista];
    const opcion = (q) => `<option value="${esc(q.uid)}" ${q.uid === seleccionado ? "selected" : ""}>${esc(q.nombre)}${q.uid === actor.uid ? " (sí mismo)" : ""} (CA ${caDe(q)}, ${q.pg}/${q.pgMax} PG)</option>`;
    const grupo = (titulo, arr) => arr.length ? `<optgroup label="${titulo}">${arr.map(opcion).join("")}</optgroup>` : "";
    return grupo("Enemigos", lista.filter((q) => q.tipo !== actor.tipo)) + grupo("Aliados", lista.filter((q) => q.tipo === actor.tipo));
  }

  function selectModo(scope, tk, modo) {
    return `<select class="select-modo" data-accion="ac-modo" data-scope="${esc(scope)}" data-tk="${esc(tk)}" aria-label="Modo de tirada">
      ${Object.entries(MODOS).map(([v, t]) => `<option value="${v}" ${modo === v ? "selected" : ""}>${t}</option>`).join("")}
    </select>`;
  }

  // Objeto que guarda las tiradas de un casillero: la acción en curso ("a"),
  // la salvación de muerte ("m") o un pendiente.
  function ambito(c, scope) {
    if (scope === "a") return c.accion;
    if (scope === "m") return c.salvMuerte;
    return (c.pendientes || []).find((p) => p.id === scope);
  }

  // ---------- Efectos de cada condición (reglas 2024) ----------
  const EFECTOS_CONDICION = {
    Agarrado: "Velocidad 0. Desventaja al atacar a cualquiera que no sea quien le agarra. Con una acción puede intentar escapar (FUE (Atletismo) o DES (Acrobacias) contra la CD de escape).",
    Apresado: "Velocidad 0. Puede atacar, pero con desventaja; los ataques contra él tienen ventaja. Desventaja en salvaciones de DES.",
    Asustado: "Desventaja en pruebas y ataques mientras vea la fuente del miedo. No puede acercarse voluntariamente a ella.",
    Cegado: "Falla las pruebas que requieran vista. Sus ataques tienen desventaja; los ataques contra él, ventaja.",
    Derribado: "Solo puede arrastrarse o levantarse (cuesta la mitad de su velocidad). Sus ataques tienen desventaja. Contra él: ventaja a 5 ft, desventaja a distancia.",
    Envenenado: "Desventaja en tiradas de ataque y pruebas de característica.",
    Hechizado: "No puede atacar a quien le hechizó ni elegirle como objetivo de efectos dañinos.",
    Ensordecido: "No oye: falla las pruebas que requieran oído.",
    Invisible: "Sus ataques tienen ventaja; los ataques contra él, desventaja (si no pueden verle).",
    Incapacitado: "No puede realizar acciones, acciones adicionales ni reacciones. Pierde la concentración. No puede hablar.",
    Aturdido: "Incapacitado. Falla las salvaciones de FUE y DES. Los ataques contra él tienen ventaja.",
    Paralizado: "Incapacitado y velocidad 0. Falla FUE y DES. Ataques contra él con ventaja; a 5 ft son críticos.",
    Petrificado: "Incapacitado y velocidad 0. Falla FUE y DES. Resistencia a todo el daño. Ataques contra él con ventaja.",
    Inconsciente: "Incapacitado, derribado y velocidad 0. Falla FUE y DES. Ataques contra él con ventaja; a 5 ft son críticos."
  };
  const VELOCIDAD_CERO = ["Agarrado", "Apresado", "Paralizado", "Petrificado", "Inconsciente"];

  function velocidadDe(p) {
    const d = datosDe(p);
    return VELOCIDAD_CERO.some((x) => (p.condiciones || []).includes(x)) ? 0 : d.velocidad;
  }

  function renderCondicionesTurno(c, p) {
    const conds = (p.condiciones || []).filter((x) => EFECTOS_CONDICION[x]);
    if (!conds.length) return "";
    const origen = (cond) => {
      const uid = (p.origenes || {})[cond];
      const q = uid && participante(c, uid);
      return q ? ` <span class="sub">(por ${esc(q.nombre)})</span>` : "";
    };
    return `<div class="panel-condiciones">
      ${conds.map((x) => `<div><b>${esc(x)}</b>${origen(x)}: ${esc(EFECTOS_CONDICION[x])}</div>`).join("")}
    </div>`;
  }

  // Recuadros que recuerdan reglas que la app no aplica sola (data/enemigos.js → recordatorios).
  // momento: "turno" (al empezar su turno) o "ataque" (al atacar). r.quitar: condiciones a retirar,
  // con un botón × por cada criatura que las tenga.
  function renderRecordatorios(c, p, momento) {
    const lista = (datosDe(p).recordatorios || []).filter((r) => (r.en || "turno") === momento);
    if (!lista.length) return "";
    return lista.map((r) => {
      const afectados = (r.quitar || []).length
        ? c.participantes.filter((q) => q.uid !== p.uid && r.quitar.some((x) => tiene(q, x)))
        : [];
      const chips = afectados.map((q) => `<div class="recordatorio-fila"><b>${esc(q.nombre)}:</b>
        ${r.quitar.filter((x) => tiene(q, x)).map((x) => `<span class="chip">${esc(x)}
          <button class="chip-x" data-accion="ac-quitar-cond" data-uid="${esc(q.uid)}" data-cond="${esc(x)}" aria-label="Quitar ${esc(x)}">×</button></span>`).join("")}</div>`).join("");
      return `<div class="recordatorio">
        <div class="recordatorio-titulo">📌 Recuerda · ${esc(r.titulo)}</div>
        <div>${esc(r.texto)}</div>
        ${(r.quitar || []).length ? (chips || `<div class="sub">Ahora nadie tiene ${esc(r.quitar.join(" ni "))}.</div>`) : ""}
      </div>`;
    }).join("");
  }

  // Un agarre (y lo que depende de él, como el Cegado del mordisco del Engendro) termina
  // si quien agarra cae o queda incapacitado.
  function soltarAgarres(c) {
    c.participantes.forEach((p) => {
      Object.entries(p.origenes || {}).forEach(([cond, uid]) => {
        const q = participante(c, uid);
        if (q && !fuera(q) && q.pg > 0 && !INCAPACITANTES.some((x) => tiene(q, x))) return;
        p.condiciones = (p.condiciones || []).filter((x) => x !== cond);
        delete p.origenes[cond];
        log(c, `${p.nombre} ya no está ${cond} (${q ? q.nombre : "su origen"} ya no puede mantenerlo)`);
      });
    });
  }

  // ---------- Iluminación, sentidos y cobertura ----------
  const LUCES = {
    normal: "Luz brillante",
    tenue: "Luz tenue / niebla ligera",
    oscuridad: "Oscuridad / niebla densa",
    magica: "Oscuridad mágica"
  };
  const COBERTURAS = {
    ninguna: { nombre: "Sin cobertura", ca: 0 },
    media: { nombre: "Media (+2 CA)", ca: 2 },
    tres: { nombre: "Tres cuartos (+5 CA)", ca: 5 },
    total: { nombre: "Total (no se puede atacar)", ca: null }
  };

  // Sentidos a partir del texto de la ficha: "Visión en la oscuridad 60 ft", "Vista ciega 30 ft"
  function sentidosDe(p) {
    const t = String(datosDe(p).sentidos || "");
    return { oscuridad: /oscuridad/i.test(t), ciega: /vista ciega/i.test(t) };
  }

  // ¿Puede ver con esta iluminación? (Cegado e Invisible se tratan aparte como condiciones)
  function veConLuz(p, luz) {
    if (luz === "normal" || luz === "tenue" || !luz) return true;
    const s = sentidosDe(p);
    if (s.ciega) return true;
    return luz === "oscuridad" && s.oscuridad;
  }

  function renderEntorno(c) {
    const luz = c.luz || "normal";
    const nota = {
      normal: "",
      tenue: "Solo afecta a Percepción, no a los ataques.",
      oscuridad: "Quien no ve ataca con desventaja; atacar a quien no te ve da ventaja. La visión en la oscuridad y la vista ciega sí ven.",
      magica: "Ni la visión en la oscuridad ve: solo la vista ciega."
    }[luz];
    return `<div class="entorno ${luz !== "normal" ? "activo" : ""}">
      <span>🌗 Iluminación</span>
      <select data-accion="ac-luz" aria-label="Iluminación de la zona" title="Si alguien lleva antorcha, lámpara o el truco Luz, la zona cercana está iluminada">
        ${Object.entries(LUCES).map(([k, v]) => `<option value="${k}" ${k === luz ? "selected" : ""}>${v}</option>`).join("")}
      </select>
      ${nota ? `<span class="sub">${esc(nota)}</span>` : ""}
    </div>`;
  }

  // ---------- Condiciones y marcas → ventaja / desventaja ----------
  const INCAPACITANTES = ["Incapacitado", "Aturdido", "Paralizado", "Inconsciente", "Petrificado"];
  const tiene = (p, cond) => (p.condiciones || []).includes(cond);

  // Marcas temporales: Fastidiar y Saeta guía (ventaja contra), Socavar (desventaja al atacar).
  // expira: "inicio" → al empezar el siguiente turno de la fuente; "finSiguiente" → al acabar su próximo turno.
  function marcar(c, marca) {
    c.marcas = c.marcas || [];
    c.marcas.push({ ronda: c.ronda, ...marca });
  }

  function marcasAplicables(c, actor, obj) {
    return (c.marcas || []).filter((m) =>
      (m.tipo === "ventajaContra" && m.objetivo === obj.uid && (!m.atacante || m.atacante === actor.uid)) ||
      (m.tipo === "desventajaAtaque" && m.quien === actor.uid));
  }

  function consumirMarcas(c, actor, obj) {
    const usadas = marcasAplicables(c, actor, obj);
    c.marcas = (c.marcas || []).filter((m) => !usadas.includes(m));
  }

  // Sugiere el modo de un ataque y explica por qué. Ventaja y desventaja a la vez se anulan.
  function sugerirModo(c, actor, obj, cuerpo) {
    const v = [];
    const d = [];
    ["Cegado", "Envenenado", "Asustado", "Apresado", "Derribado"].forEach((x) => { if (tiene(actor, x)) d.push(`${actor.nombre} ${x}`); });
    if (tiene(actor, "Invisible")) v.push(`${actor.nombre} Invisible`);
    const agarrador = (actor.origenes || {}).Agarrado;
    if (tiene(actor, "Agarrado") && obj && agarrador && agarrador !== obj.uid) d.push(`${actor.nombre} Agarrado (ataca a otro)`);
    if (obj) {
      ["Cegado", "Apresado", "Paralizado", "Aturdido", "Inconsciente", "Petrificado"].forEach((x) => { if (tiene(obj, x)) v.push(`objetivo ${x}`); });
      if (tiene(obj, "Derribado")) (cuerpo ? v : d).push(`objetivo Derribado${cuerpo ? "" : " (a distancia)"}`);
      if (tiene(obj, "Invisible")) d.push("objetivo Invisible");
      marcasAplicables(c, actor, obj).forEach((m) => (m.tipo === "ventajaContra" ? v : d).push(m.nombre));
      const luz = c.luz || "normal";
      if (!veConLuz(actor, luz)) d.push(`${actor.nombre} no ve (${LUCES[luz].toLowerCase()})`);
      if (!veConLuz(obj, luz)) v.push(`${obj.nombre} no le ve (${LUCES[luz].toLowerCase()})`);
    }
    const modo = v.length && !d.length ? "ventaja" : d.length && !v.length ? "desventaja" : "normal";
    return { modo, ventajas: v, desventajas: d };
  }

  // Salvaciones: fallo automático de FUE/DES si está paralizado, aturdido, inconsciente o petrificado.
  function falloAutomatico(p, atr) {
    return (atr === "FUE" || atr === "DES") && ["Paralizado", "Aturdido", "Inconsciente", "Petrificado"].find((x) => tiene(p, x));
  }

  function chipsMarcas(c, p) {
    return (c.marcas || []).filter((m) => m.objetivo === p.uid || m.quien === p.uid).map((m) => {
      const texto = m.tipo === "ventajaContra" ? `${m.nombre}: ventaja contra él` : `${m.nombre}: desventaja al atacar`;
      return `<span class="chip chip-marca" title="${esc(texto)}">${esc(m.tipo === "ventajaContra" ? "⬇ " + m.nombre : "⤓ " + m.nombre)}</span>`;
    }).join("");
  }

  // d20 con modo, Suerte y dado extra de buff (Bendecir). Devuelve html y total (o null).
  function tiradaD20(scope, obj, tk, p, bonus, campoExtra) {
    const t = obj.tiradas[tk];
    const { html, res } = D.renderD20(t, `ac|t|${scope}|${tk}`, suerteDe(p));
    const extra = campoExtra && extraDado(p, campoExtra);
    let extraHtml = "";
    let extraSuma = 0;
    if (extra) {
      const caras = R.carasDe(extra.dado);
      const gk = "x:" + tk;
      extraHtml = `<span class="tag-extra">+ ${esc(extra.nombre)}</span>` +
        D.renderGrupo(caras, obj.valores[gk] || [], `ac|v|${scope}|${gk}`);
      extraSuma = D.sumaGrupo(caras, obj.valores[gk] || []);
    }
    const total = res && extraSuma != null ? res.natural + bonus + extraSuma : null;
    return { html: html + extraHtml, res, total, extra };
  }

  // ---------- PG, concentración, condiciones y buffs ----------
  function syncVida(p) {
    if (p.tipo === "pj") Recursos.guardarVida(Estado.get(), p.refId, p.pg);
  }

  function morir(p) {
    p.muerto = true;
    p.muerte = null;
    if (p.tipo === "pj") {
      const est = Estado.get();
      est.muertos = est.muertos || {};
      est.muertos[p.refId] = true;
    }
  }

  // Resta PG. En PJs gestiona caer a 0, muerte instantánea y fallos de salvación de muerte.
  function restarPG(c, p, cantidad, { critico = false } = {}) {
    const antes = p.pg;
    p.pg = Math.max(0, p.pg - cantidad);
    syncVida(p);
    let nota = "";
    if (p.tipo === "enemigo") {
      const d = datosDe(p);
      if (p.pg === 0 && antes > 0 && d.noMuertoImplacable && !p.implacableUsado) {
        // No muerto implacable: se disuelve en humo y se reforma con 1 PG al inicio de su turno
        p.implacableUsado = true;
        p.enHumo = true;
        nota = " · ¡se disuelve en humo carmesí! Se reformará con 1 PG al inicio de su turno (No muerto implacable)";
      } else {
        nota = p.pg === 0 && antes > 0 ? (d.escapaAlCaer ? ` · ${d.escapaAlCaer}` : " · ¡derrotado!") : "";
      }
    } else if (antes > 0 && p.pg === 0) {
      if (cantidad - antes >= p.pgMax) {
        morir(p);
        nota = " · ¡MUERTE INSTANTÁNEA! (el daño sobrante iguala o supera sus PG máximos)";
      } else {
        caer(p);
        nota = " · cae Inconsciente (salvaciones de muerte)";
      }
    } else if (antes === 0 && cantidad > 0 && !p.muerto) {
      if (cantidad >= p.pgMax) {
        morir(p);
        nota = " · ¡muere! (daño a 0 PG que iguala sus PG máximos)";
      } else {
        nota = " · " + anotarFallosMuerte(c, p, critico ? 2 : 1, critico ? "daño crítico a 0 PG" : "daño a 0 PG");
      }
    }
    if (p.concentracion && cantidad > 0) {
      if (p.pg === 0) {
        nota += " · " + terminarConcentracion(c, p, "cae a 0 PG");
      } else {
        const cd = Math.min(30, Math.max(10, Math.floor(cantidad / 2)));
        nuevaPendiente(c, { tipo: "concentracion", uid: p.uid, cd, nombre: p.concentracion.nombre });
        nota += ` · salvación de concentración CON CD ${cd}`;
      }
    }
    return nota;
  }

  function curar(p, cantidad) {
    if (p.muerto) return " · está muerto: no se puede curar";
    const antes = p.pg;
    p.pg = Math.min(p.pgMax, p.pg + cantidad);
    syncVida(p);
    if (antes === 0 && p.pg > 0 && p.tipo === "pj") {
      despertar(p);
      return " · recupera la consciencia";
    }
    return "";
  }

  // Aceite: si una criatura cubierta de aceite recibe daño de fuego, +5 de fuego y se consume.
  function aceiteYFuego(c, p, tipos) {
    const fuego = tipos.find((t) => t.tipo === "fuego" && t.final > 0);
    if (!fuego || !(p.efectos || []).some((e) => e.tipo === "aceite")) return { extra: 0, nota: "" };
    p.efectos = p.efectos.filter((e) => e.tipo !== "aceite");
    const { final, nota } = R.aplicarDefensas(5, "fuego", defensasDe(p));
    return { extra: final, nota: `el aceite arde: +${final} fuego${nota ? ` (${nota})` : ""}` };
  }

  // ---------- Salvaciones de muerte ----------
  function caer(p) {
    p.muerte = { exitos: 0, fallos: 0 };
    p.estable = false;
    p.condiciones = (p.condiciones || []).filter((x) => x !== "Inconsciente");
    p.condiciones.push("Inconsciente");
  }

  function despertar(p) {
    p.muerte = null;
    p.estable = false;
    p.condiciones = (p.condiciones || []).filter((x) => x !== "Inconsciente");
  }

  function anotarFallosMuerte(c, p, n, motivo) {
    p.estable = false;
    p.muerte = p.muerte || { exitos: 0, fallos: 0 };
    p.muerte.fallos = Math.min(3, p.muerte.fallos + n);
    if (p.muerte.fallos >= 3) {
      morir(p);
      return `${n} fallo${n > 1 ? "s" : ""} de salvación de muerte (${motivo}) · ¡${p.nombre} MUERE!`;
    }
    return `${n} fallo${n > 1 ? "s" : ""} de salvación de muerte (${motivo}) · ${p.muerte.exitos}✔ ${p.muerte.fallos}✖`;
  }

  function puntos(n, simbolo) {
    return simbolo.repeat(n) + "○".repeat(3 - n);
  }

  function nuevaPendiente(c, datos) {
    c.pendientes = c.pendientes || [];
    c.pendientesSeq = (c.pendientesSeq || 0) + 1;
    c.pendientes.push({ id: "p" + c.pendientesSeq, tiradas: { salv: D.nuevaTirada() }, valores: {}, ...datos });
  }

  function iniciarConcentracion(c, p, h) {
    if (p.concentracion) terminarConcentracion(c, p, `lanza ${h.nombre}`);
    p.concentracion = {
      hechizoId: h.id, nombre: h.nombre, buffs: [], condiciones: [],
      hastaRonda: h.duracionRondas ? c.ronda + h.duracionRondas : null
    };
  }

  function terminarConcentracion(c, p, motivo) {
    const conc = p.concentracion;
    if (!conc) return "";
    conc.buffs.forEach(({ uid, id }) => {
      const q = participante(c, uid);
      if (q) q.buffs = (q.buffs || []).filter((b) => !(b.id === id && b.fuenteUid === p.uid));
    });
    conc.condiciones.forEach(({ uid, cond }) => {
      const q = participante(c, uid);
      if (q) q.condiciones = (q.condiciones || []).filter((x) => x !== cond);
    });
    p.concentracion = null;
    c.pendientes = (c.pendientes || []).filter((x) => !(x.tipo === "concentracion" && x.uid === p.uid));
    const txt = `${p.nombre} pierde la concentración en ${conc.nombre} (${motivo})`;
    log(c, txt);
    return txt;
  }

  function anadirCondicion(p, cond, fuente, origenUid) {
    const d = datosDe(p);
    if ((d.inmuneCondiciones || []).includes(cond)) return `${p.nombre} es inmune a ${cond}`;
    p.condiciones = p.condiciones || [];
    if (!p.condiciones.includes(cond)) p.condiciones.push(cond);
    if (fuente && fuente.concentracion) fuente.concentracion.condiciones.push({ uid: p.uid, cond });
    if (origenUid) (p.origenes = p.origenes || {})[cond] = origenUid;
    // Incapacitado (y Aturdido, Paralizado, Petrificado, Inconsciente, que lo incluyen) rompe la concentración
    // (terminarConcentracion ya lo anota en el registro)
    if (p.concentracion && ["Incapacitado", "Aturdido", "Paralizado", "Petrificado", "Inconsciente"].includes(cond)) {
      const c = Estado.get().combate;
      if (c) terminarConcentracion(c, p, `queda ${cond}`);
    }
    return `${p.nombre} queda ${cond}`;
  }

  function anadirBuff(c, p, buffId, fuente, h) {
    p.buffs = p.buffs || [];
    p.buffs = p.buffs.filter((b) => b.id !== buffId);
    p.buffs.push({ id: buffId, fuenteUid: fuente.uid });
    if (h.concentracion) fuente.concentracion.buffs.push({ uid: p.uid, id: buffId });
    else if (!h.duracionRondas && p.tipo === "pj") {
      Recursos.guardarBuffLargo(Estado.get(), p.refId, { id: buffId, fuenteUid: fuente.uid });
    }
  }

  // Etiquetas de estado para la lista de iniciativa y la tarjeta de turno.
  function chipsEstado(p) {
    const c = Estado.get().combate;
    const chips = [];
    if (p.muerto) return `<span class="chip chip-caido">☠ Muerto</span>`;
    if (p.muerte && p.pg === 0) {
      chips.push(`<span class="chip chip-caido" title="Salvaciones de muerte">✔${p.muerte.exitos} ✖${p.muerte.fallos}</span>`);
    }
    if (p.concentracion) chips.push(`<span class="chip chip-conc" title="Concentración">◎ ${esc(p.concentracion.nombre)}
      <button class="chip-x" data-accion="ac-fin-conc" data-uid="${esc(p.uid)}" aria-label="Terminar concentración" title="Terminar la concentración">×</button></span>`);
    (p.buffs || []).forEach((b) => {
      const def = porId(BUFFS, b.id);
      chips.push(`<span class="chip chip-buff">${esc(def ? def.nombre : b.id)}
        <button class="chip-x" data-accion="ac-quitar-buff" data-uid="${esc(p.uid)}" data-id="${esc(b.id)}" aria-label="Quitar">×</button></span>`);
    });
    (p.efectos || []).forEach((e) => chips.push(`<span class="chip chip-cond">${e.tipo === "aceite" ? "🛢" : "🔥"} ${esc(e.nombre)}</span>`));
    (p.condiciones || []).forEach((cond) => chips.push(`<span class="chip chip-cond">${esc(cond)}
      <button class="chip-x" data-accion="ac-quitar-cond" data-uid="${esc(p.uid)}" data-cond="${esc(cond)}" aria-label="Quitar ${esc(cond)}">×</button></span>`));
    if (p.estable) chips.push(`<span class="chip">Estable</span>`);
    if (p.reaccionUsada) chips.push(`<span class="chip chip-reaccion" title="Ya usó su reacción; la recupera al inicio de su turno">↺ reacción usada</span>`);
    if (c) chips.push(chipsMarcas(c, p));
    return chips.join("");
  }

  // ---------- Hechizos ----------
  // Trucos, hechizos preparados y rasgos que se resuelven como un hechizo (Canalizar divinidad)
  function hechizosDe(est, pj) {
    return [...(pj.trucos || []), ...Recursos.preparadosDe(est, pj.id), ...(pj.rasgosConjuro || [])].map(hechizo).filter(Boolean);
  }

  // Motivo por el que no se puede lanzar (o null).
  function bloqueoConjuro(est, c, pj, h) {
    if (h.usaRecurso) return Recursos.restante(est, pj, h.usaRecurso) ? null : `sin usos de ${(Recursos.definicion(pj, h.usaRecurso) || {}).nombre || h.usaRecurso}`;
    if (h.nivel === 0) return null;
    if (Recursos.espaciosLibres(est, pj, h.nivel) === 0) return "sin espacios";
    if (flags(c).espacio) return "ya lanzó un hechizo con espacio este turno";
    return null;
  }

  // Gorro de la Desaparición: la invisibilidad acaba justo después de atacar, dañar o lanzar un conjuro
  function romperGorro(c, p, motivo) {
    if (!p || !p.invisibleGorro) return;
    p.invisibleGorro = false;
    p.condiciones = (p.condiciones || []).filter((x) => x !== "Invisible");
    log(c, `↳ ${p.nombre} deja de ser invisible (Gorro de la Desaparición: ${motivo})`);
  }

  function gastarConjuro(est, c, p, h) {
    romperGorro(c, p, "lanza un conjuro");
    if (h.usaRecurso) {
      Recursos.gastar(est, datosDe(p), h.usaRecurso);
    } else if (h.nivel >= 1) {
      Recursos.gastarEspacio(est, datosDe(p), h.nivel);
      flags(c).espacio = true;
    }
  }

  // ---------- Economía de acciones (Acción, Acción adicional, Reacción) ----------
  const NOMBRE_COSTO = {
    accion: "Acción", ataque: "Ataque", mella: "Mella", adicional: "Adicional", reaccion: "Reacción"
  };
  const esLigera = (arma) => Boolean(arma) && (arma.propiedades || []).includes("ligera");

  // Ataques por acción de Ataque: Ataque múltiple en enemigos; 1 en PJs de nivel 1.
  function ataquesPorAccion(p) {
    const d = datosDe(p);
    if (p.tipo === "enemigo" && d.multiataque) return d.multiataque.ataques.length;
    return d.ataquesPorAccion || 1;
  }

  // Cuántas lleva de esa arma según su inventario (p. ej. "Daga ×2"); 1 si no figura
  function cantidadArma(p, arma) {
    const ent = Objetos.inventarioDe(Estado.get(), datosDe(p)).find((e) => e.nombre === arma.nombre);
    return ent ? ent.cantidad : 1;
  }

  function tieneMella(p) {
    const d = datosDe(p);
    return (d.maestrias || []).some((id) => (porId(ARMAS, id) || {}).maestria === "Mella");
  }

  // Coste de un ataque (o de algo que sustituye un ataque). null si ya no quedan recursos.
  function costoAtaque(c, p, arma, { soloAtaque = false } = {}) {
    const f = flags(c);
    if (!f.accion) return "accion";
    if (f.accionTipo === "ataque" && (f.ataques || 0) < ataquesPorAccion(p)) return "ataque";
    // Ataque extra con arma ligera tras atacar con otra arma ligera
    // (con otra arma ligera distinta; la misma solo si lleva dos, como las 2 dagas)
    const otraArma = arma && (arma.id !== f.armaLigeraUsada || cantidadArma(p, arma) >= 2);
    if (!soloAtaque && p.tipo === "pj" && f.ataqueLigero && esLigera(arma) && otraArma && !f.extraLigera) {
      if (tieneMella(p) && !f.mella) return "mella";
      if (!f.adicional) return "adicional";
    }
    return null;
  }

  function costoSimple(c, tipo) {
    const f = flags(c);
    if (tipo === "accion") return f.accion ? null : "accion";
    if (tipo === "adicional") return f.adicional ? null : "adicional";
    return tipo;
  }

  function tipoTiempo(tiempo) {
    const t = String(tiempo || "");
    if (t.startsWith("acción adicional")) return "adicional";
    if (t.startsWith("reacción")) return "reaccion";
    return "accion";
  }

  function motivoSinCosto(c) {
    return flags(c).accion ? "acción ya usada" : "no disponible";
  }

  // Marca lo gastado al aplicar una acción. extra: { ataque, ligera }
  function gastarCosto(c, ac, extra = {}) {
    const f = flags(c);
    switch (ac.costo) {
      case "accion":
        f.accion = true;
        f.accionTipo = extra.ataque ? "ataque" : "otra";
        f.ataques = extra.ataque ? 1 : 0;
        break;
      case "ataque":
        f.ataques = (f.ataques || 0) + 1;
        break;
      case "mella":
        f.mella = true;
        f.extraLigera = true;
        break;
      case "adicional":
        f.adicional = true;
        if (ac.segundaArma) f.extraLigera = true;
        break;
      case "reaccion":
        participante(c, ac.actorUid).reaccionUsada = true;
        break;
    }
    if (extra.ataque && extra.ligera && (ac.costo === "accion" || ac.costo === "ataque")) {
      f.ataqueLigero = true;
      f.armaLigeraUsada = extra.armaId;
    }
  }

  // Acciones adicionales que puede hacer ahora mismo (para el ⓘ)
  function listaAdicionales(est, c, p) {
    const d = datosDe(p);
    const lista = [];
    if (p.tipo === "enemigo") {
      (d.accionesAdicionales || []).forEach((a) => lista.push([a.nombre, a.texto]));
      return lista;
    }
    hechizosDe(est, d).forEach((h) => {
      if (h.resolucion === "castigo") lista.push([h.nombre, "Justo después de golpear con un arma cuerpo a cuerpo (gasta 1 espacio)."]);
      else if (tipoTiempo(h.tiempo) === "adicional") lista.push([h.nombre, `${h.nivel ? "Hechizo de nivel 1 (gasta 1 espacio)" : "Truco"}. ${h.texto}`]);
    });
    (d.recursos || []).filter((r) => r.id !== "oleada_accion" && !r.sinBoton).forEach((r) => {
      const def = (d.rasgos || []).find((x) => x.nombre.startsWith(r.nombre));
      lista.push([`${r.nombre} (${Recursos.restante(est, d, r.id)}/${Recursos.total(d, r.id)})`, def ? def.texto : ""]);
    });
    if (d.accionAstuta) Object.values(ASTUTA).forEach((a) => lista.push([`${a.nombre} (Acción astuta)`, a.resumen]));
    Objetos.pocionesDe(d, est).forEach((it) => { const o = Objetos.objetoDe(it); lista.push([o.nombre, o.texto]); });
    Objetos.armasDe(d, est).filter(({ item }) => item && item.sintonizado && Objetos.objetoDe(item).veneno && !item.venenoUsado)
      .forEach(({ item }) => lista.push([`Envenenar ${Objetos.objetoDe(item).nombre}`, "Una vez hasta el amanecer: el próximo golpe obliga a una salvación de CON."]));
    Objetos.armasDe(d, est).forEach(({ item }) => {
      const o = item && Objetos.objetoDe(item);
      if (o && o.activable && item.sintonizado) lista.push([`${o.activable.nombre === "Encendida" ? "Encender/apagar" : "Activar"} ${o.nombre}`, `+${o.activable.danoExtra.dado} de ${o.activable.danoExtra.tipo} al golpear mientras arde.`]);
    });
    const ligeras = Objetos.armasDe(d, est).filter(({ arma }) => esLigera(arma));
    if (ligeras.length >= 2 || ligeras.some(({ arma }) => arma.id === "daga")) {
      lista.push(["Ataque con arma ligera", `Tras atacar con un arma ligera, otro ataque con un arma ligera distinta (sin sumar el modificador al daño).${tieneMella(p) ? " Con Mella va dentro de la acción de Ataque, sin gastar la adicional." : ""}`]);
    }
    return lista;
  }

  function renderEconomia(est, c, p) {
    const f = flags(c);
    const maxAtaques = ataquesPorAccion(p);
    const detalleAccion = f.accion
      ? (f.accionTipo === "ataque" && maxAtaques > 1 ? `ataques ${f.ataques || 0}/${maxAtaques}` : "usada")
      : "disponible";
    const adicionales = listaAdicionales(est, c, p);
    const info = `<span class="info-i" tabindex="0" aria-label="Acciones adicionales posibles">i
      <span class="tooltip"><b>Acciones adicionales de ${esc(p.nombre)}</b>
        ${adicionales.length ? `<ul>${adicionales.map(([n, t]) => `<li><b>${esc(n)}</b>${t ? ": " + esc(t) : ""}</li>`).join("")}</ul>` : "<p>No tiene acciones adicionales disponibles.</p>"}
      </span></span>`;
    const chip = (tipo, icono, nombre, usada, detalle) => `<button type="button" class="econ econ-${tipo} ${usada ? "usada" : ""}" data-accion="ac-econ" data-tipo="${tipo}"
      title="${usada ? "Usada · clic para liberarla" : "Disponible · clic para marcarla como usada"}">${icono} ${nombre}<span class="econ-estado">${detalle}</span></button>`;
    return `<div class="economia">
      ${chip("accion", "●", "Acción", f.accion, detalleAccion)}
      <span class="econ-grupo">${chip("adicional", "◆", "Acción adicional", f.adicional, f.adicional ? "usada" : "disponible")}${info}</span>
      ${chip("reaccion", "↺", "Reacción", p.reaccionUsada, p.reaccionUsada ? "usada" : "disponible")}
    </div>`;
  }

  function resumenConjuro(pj, h) {
    const cd = R.cdConjuro(pj);
    switch (h.resolucion) {
      case "ataque": return `ataque ${R.signo(R.ataqueConjuro(pj))} · ${h.dano} ${h.tipoDano}`;
      case "salvacion": {
        const mod = h.sumaModConjuro ? R.mod(pj.atributos[pj.atributoConjuro]) : 0;
        return `${h.salvacion} CD ${cd}${h.dano ? ` · ${h.dano}${mod ? " " + R.signo(mod) : ""} ${h.tipoDano}` : h.aplicaCondicion ? ` · ${[].concat(h.aplicaCondicion).join(" y ")}` : ""}`;
      }
      case "automatico": return `${h.dardos} dardos · ${h.dano} ${h.tipoDano}`;
      case "curacion": return `cura ${h.curacion}${h.sumaModConjuro ? " " + R.signo(R.mod(pj.atributos[pj.atributoConjuro])) : ""}`;
      case "buff": return `${h.tiempo}${h.concentracion ? " · concentración" : ""}`;
      default: return h.tiempo;
    }
  }

  // ---------- Ataques ----------
  function ataquesDe(est, p) {
    const d = datosDe(p);
    if (p.tipo === "pj") {
      return Objetos.armasEnMano(d, est).map(({ key, arma, item }) => {
        const comp = R.competente(d, arma);
        return {
          key, nombre: arma.nombre, arma, item, pj: true, competente: comp,
          maestria: comp && (d.maestrias || []).includes(arma.id) ? arma.maestria : null
        };
      });
    }
    return d.acciones.map((a, i) => ({ key: "acc:" + i, idx: i, nombre: a.nombre, accion: a, pj: false }))
      .filter((a) => a.accion.bonusAtaque != null);
  }

  function puedeCastigar(est, c, p, arma, id = "castigo_abrasador") {
    if (p.tipo !== "pj" || arma.tipo !== "cuerpo a cuerpo") return false;
    const h = hechizo(id);
    return Recursos.preparadosDe(est, p.refId).includes(id) && h;
  }

  // Castigo divino: 2d8 radiante (+1d8 contra infernales y muertos vivientes).
  // Castigo del paladín: una vez por descanso largo sin gastar espacio.
  const castigoGratis = (est, d) => Boolean(Recursos.definicion(d, "castigo_paladin")) && Recursos.restante(est, d, "castigo_paladin") > 0;
  const contraInfernal = (obj) => /infernal|muerto viviente/i.test(datosDe(obj).tipo || "");

  // Bonificador y grupos de dados de daño del ataque en curso.
  function descriptor(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const d = datosDe(actor);

    if (ac.conjuro) {
      const h = hechizo(ac.conjuro);
      return {
        nombre: h.nombre, bonus: R.ataqueConjuro(d), hechizo: h, competente: true, cuerpo: h.ataque === "cuerpo a cuerpo",
        grupos: [{ id: "arma", etiqueta: h.nombre, tipo: h.tipoDano, caras: R.carasDe(h.dano), fijo: 0, principal: true }]
      };
    }

    const atk = ataquesDe(est, actor).find((a) => a.key === ac.ataqueKey);
    if (!atk) return null;

    if (atk.pj) {
      const dosManos = Boolean(ac.opciones.dosManos) && Objetos.manosUsadas(est, d, atk.key) === 0;
      const r = R.ataqueArma(d, atk.arma, { dosManos });
      const fijo = ac.segundaArma ? Math.min(0, r.modAtributo) + (atk.arma.bonusDano || 0) : r.danoMod;
      const grupos = [{ id: "arma", etiqueta: atk.arma.nombre, tipo: atk.arma.tipoDano, caras: R.carasDe(r.dano), fijo, principal: true }];
      const o = atk.item && Objetos.objetoDe(atk.item);
      if (o && o.activable && atk.item.sintonizado && atk.item.encendida) {
        grupos.push({ id: "activable", etiqueta: o.nombre, tipo: o.activable.danoExtra.tipo, caras: R.carasDe(o.activable.danoExtra.dado), fijo: 0 });
      }
      if (ac.opciones.furtivo && d.ataqueFurtivo) {
        grupos.push({ id: "furtivo", etiqueta: "Ataque furtivo", tipo: atk.arma.tipoDano, caras: R.carasDe(d.ataqueFurtivo), fijo: 0 });
      }
      if (ac.opciones.castigo) {
        const h = hechizo("castigo_abrasador");
        grupos.push({ id: "castigo", etiqueta: h.nombre, tipo: h.tipoDano, caras: R.carasDe(h.danoExtra), fijo: 0 });
      }
      if (ac.opciones.castigoDivino) {
        const h = hechizo("castigo_divino");
        const obj = participante(c, ac.objetivoUid);
        const dado = obj && contraInfernal(obj) ? h.danoExtraInfernal : h.danoExtra;
        grupos.push({ id: "castigoDivino", etiqueta: h.nombre, tipo: h.tipoDano, caras: R.carasDe(dado), fijo: 0 });
      }
      if (tieneBuff(actor, "favor_divino")) {
        grupos.push({ id: "favor", etiqueta: "Favor divino", tipo: "radiante", caras: [4], fijo: 0 });
      }
      return { atk, nombre: atk.nombre, bonus: r.bonus, grupos, maestria: atk.maestria, modAtributo: r.modAtributo, competente: r.competente, cuerpo: atk.arma.tipo === "cuerpo a cuerpo" };
    }

    const a = atk.accion;
    const base = R.parseDados(a.dano);
    const grupos = [{ id: "arma", etiqueta: a.nombre, tipo: a.tipoDano, caras: R.carasDe(a.dano), fijo: base.fijo, principal: true }];
    (a.danoExtra || []).forEach((x, i) => grupos.push({ id: "extra" + i, etiqueta: "extra", tipo: x.tipo, caras: R.carasDe(x.dado), fijo: 0 }));
    if (a.extraConVentaja && ac.tiradas.atk.modo === "ventaja") {
      grupos.push({ id: "ventaja", etiqueta: "por ventaja", tipo: a.extraConVentaja.tipo, caras: R.carasDe(a.extraConVentaja.dado), fijo: 0 });
    }
    // Canción de sangre: +2 al ataque y +1d6 necrótico a los aliados de Lucian a 30 ft
    const cancion = bajoCancion(c, actor) && ac.opciones.cancion !== false;
    if (cancion) grupos.push({ id: "cancion", etiqueta: "Canción de sangre", tipo: "necrótico", caras: [6], fijo: 0 });
    return { atk, nombre: a.nombre, bonus: a.bonusAtaque + (cancion ? 2 : 0), grupos, accion: a, competente: true, cuerpo: a.tipo !== "distancia" };
  }

  const tieneBuff = (p, id) => (p.buffs || []).some((b) => b.id === id);

  // Escudo (hechizo de reacción): el objetivo lo puede lanzar cuando le van a golpear.
  // Motivo por el que no puede (o null).
  function bloqueoEscudo(est, obj) {
    if (obj.tipo !== "pj" || obj.pg <= 0) return "no";
    const d = datosDe(obj);
    if (!Recursos.preparadosDe(est, d.id).includes("escudo")) return "no";
    if (tieneBuff(obj, "escudo")) return "ya activo";
    if (obj.reaccionUsada) return "reacción ya usada";
    if (INCAPACITANTES.some((x) => tiene(obj, x))) return "incapacitado";
    if (!Recursos.espaciosLibres(est, d, 1)) return "sin espacios";
    return null;
  }

  // Gasta el espacio y la reacción y deja +5 CA hasta el inicio de su siguiente turno
  function aplicarEscudo(est, c, ac) {
    const obj = participante(c, ac.objetivoUid);
    if (!ac.opciones.escudo || !obj || bloqueoEscudo(est, obj)) return;
    Recursos.gastarEspacio(est, datosDe(obj), 1);
    obj.reaccionUsada = true;
    obj.buffs = (obj.buffs || []).filter((b) => b.id !== "escudo");
    obj.buffs.push({ id: "escudo", fuenteUid: obj.uid });
    log(c, `${obj.nombre} lanza Escudo (reacción, 1 espacio): +5 CA hasta el inicio de su turno → CA ${caDe(obj)}`);
  }

  function resultadoAtaque(c, ac, desc) {
    const actor = participante(c, ac.actorUid);
    const obj = participante(c, ac.objetivoUid);
    if (!obj) return null;
    const { res, total } = tiradaD20("a", ac, "atk", actor, desc.bonus, "ataqueExtraDado");
    if (total == null) return null;
    const ca = caDe(obj) + ((COBERTURAS[ac.cobertura] || {}).ca || 0) + (ac.opciones.escudo && !tieneBuff(obj, "escudo") ? 5 : 0);
    const pifia = res.natural === 1;
    const golpe = res.natural === 20 || (!pifia && total >= ca);
    // Golpe a 5 ft contra Paralizado o Inconsciente: crítico automático
    const critAuto = golpe && desc.cuerpo && ac.opciones.a5ft !== false && ["Paralizado", "Inconsciente"].find((x) => tiene(obj, x));
    const critico = res.natural === 20 || Boolean(critAuto);
    return { natural: res.natural, total, ca, critico, critAuto, pifia, golpe };
  }

  // Suma el daño por tipo y aplica las defensas. factor: 1, 0.5 (mitad) o 0. null si faltan dados.
  function calcularDano(grupos, valores, critico, def, salvaje, factor = 1) {
    const porTipo = {};
    for (const g of grupos) {
      const caras = critico ? [...g.caras, ...g.caras] : g.caras;
      let suma = D.sumaGrupo(caras, valores[g.id] || []);
      if (suma == null) return null;
      if (g.principal && salvaje) {
        const otra = D.sumaGrupo(caras, valores.salvaje || []);
        if (otra == null) return null;
        suma = Math.max(suma, otra);
      }
      porTipo[g.tipo] = (porTipo[g.tipo] || 0) + Math.max(0, suma + g.fijo);
    }
    let total = 0;
    const tipos = Object.entries(porTipo).map(([tipo, bruto]) => {
      const base = Math.floor(bruto * factor);
      const { final, nota } = R.aplicarDefensas(base, tipo, def);
      total += final;
      return { tipo, bruto: base, final, nota };
    });
    return { tipos, total };
  }

  function textoDano(res) {
    return res.tipos.map((t) => `${t.final} ${t.tipo}${t.nota ? ` (${t.bruto}, ${t.nota})` : ""}`).join(" + ");
  }

  function renderGruposDano(grupos, valores, critico, salvaje) {
    return grupos.map((g) => {
      const caras = critico ? [...g.caras, ...g.caras] : g.caras;
      const fila = `<div class="grupo-dados">
        <span class="grupo-etiqueta">${esc(g.etiqueta)} · ${esc(g.tipo)}</span>
        <div class="dados">${D.renderGrupo(caras, valores[g.id] || [], `ac|v|a|${g.id}`)}${g.fijo ? `<span class="fijo">${R.signo(g.fijo)}</span>` : ""}</div>
      </div>`;
      const extra = g.principal && salvaje ? `<div class="grupo-dados">
        <span class="grupo-etiqueta">Atacante salvaje · 2ª tirada</span>
        <div class="dados">${D.renderGrupo(caras, valores.salvaje || [], "ac|v|a|salvaje")}</div>
      </div>` : "";
      return fila + extra;
    }).join("");
  }

  function tituloDano(grupos, critico) {
    return grupos.map((g) => {
      const n = critico ? g.caras.length * 2 : g.caras.length;
      return `<b>${n}d${g.caras[0]}${g.fijo ? " " + R.signo(g.fijo) : ""}</b> ${esc(g.tipo)}${g.id !== "arma" ? ` <span class="sub">(${esc(g.etiqueta)})</span>` : ""}`;
    }).join(" + ");
  }

  // ---------- Acciones enemigas: recarga y usos ----------
  function disponible(c, p, idx) {
    const a = datosDe(p).acciones[idx];
    if (a.recarga && c.recargas && c.recargas[p.uid] && c.recargas[p.uid][idx] === false) return false;
    if (a.usosPorDia && ((c.usos && c.usos[p.uid] && c.usos[p.uid][idx]) || 0) >= a.usosPorDia) return false;
    if (a.nivelConjuro && espaciosEnemigoLibres(c, p, a.nivelConjuro) === 0) return false;
    return true;
  }

  // Espacios de conjuro de un enemigo lanzador (enemigo.espaciosConjuro = { 1: 4, 2: 3… })
  function espaciosEnemigoLibres(c, p, nivel) {
    const total = (datosDe(p).espaciosConjuro || {})[nivel] || 0;
    const usados = ((c.espaciosEnemigo || {})[p.uid] || {})[nivel] || 0;
    return Math.max(0, total - usados);
  }

  function gastarAccion(c, p, idx) {
    const a = datosDe(p).acciones[idx];
    if (a.recarga) { c.recargas = c.recargas || {}; (c.recargas[p.uid] = c.recargas[p.uid] || {})[idx] = false; }
    if (a.usosPorDia) { c.usos = c.usos || {}; const u = (c.usos[p.uid] = c.usos[p.uid] || {}); u[idx] = (u[idx] || 0) + 1; }
    if (a.nivelConjuro) {
      c.espaciosEnemigo = c.espaciosEnemigo || {};
      const e = (c.espaciosEnemigo[p.uid] = c.espaciosEnemigo[p.uid] || {});
      e[a.nivelConjuro] = (e[a.nivelConjuro] || 0) + 1;
    }
  }

  // ---------- Canción de sangre (aura de Lucian) ----------
  // Fuente activa: consciente, no incapacitada y capaz de cantar (no Ensordecida… ni en humo)
  function fuenteCancion(c, excluirUid) {
    return c.participantes.find((q) => q.uid !== excluirUid && datosDe(q).auraCancion && !fuera(q) && !q.enHumo && q.pg > 0 &&
      !INCAPACITANTES.some((x) => tiene(q, x)));
  }

  // Un enemigo aliado de la fuente (no ella misma) puede beneficiarse
  function bajoCancion(c, p) {
    return p && p.tipo === "enemigo" && Boolean(fuenteCancion(c, p.uid));
  }

  // CD de objetos arrojados (aceite, agua bendita): 8 + DES + competencia
  function cdLanzador(pj) {
    return 8 + R.mod(pj.atributos.DES) + pj.competencia;
  }

  function bonusSalvacion(p, atr) {
    const d = datosDe(p);
    return p.tipo === "pj" ? R.salvacion(d, atr) : R.salvacionEnemigo(d, atr);
  }

  // Fuente de una salvación: acción enemiga o hechizo de PJ.
  function fuenteSalvacion(c, ac) {
    const actor = participante(c, ac.actorUid);
    if (ac.objeto) {
      const def = porId(OBJETOS, ac.objeto);
      const aceite = def.efectoAlFallar === "aceite";
      return {
        nombre: def.nombre, cd: def.cd === "lanzador" ? cdLanzador(datosDe(actor)) : def.cd, salvacion: def.salvacion,
        condicion: def.condicion, efectoAlFallar: aceite ? "queda cubierto de aceite (+5 de fuego al recibir daño de fuego)" : def.efectoAlFallar,
        aceite, dano: def.dano, tipoDano: def.tipoDano, alSalvar: def.alSalvar, soloTipos: def.soloTipos,
        objeto: def, area: def.alcance
      };
    }
    if (ac.conjuro) {
      const h = hechizo(ac.conjuro);
      const lanzador = datosDe(actor);
      const modConjuro = R.mod(lanzador.atributos[lanzador.atributoConjuro]);
      return {
        nombre: h.nombre, cd: R.cdConjuro(lanzador), salvacion: h.salvacion, condicion: h.aplicaCondicion,
        efectoAlFallar: h.efectoAlFallar, tipoDano: h.tipoDano, alSalvar: h.alSalvar,
        dano: h.dano && h.sumaModConjuro && modConjuro ? `${h.dano}${R.signo(modConjuro)}` : h.dano,
        exitoAutomatico: h.exitoAutomatico, hechizo: h, area: h.area, soloTipos: h.soloTipos
      };
    }
    const a = datosDe(actor).acciones[ac.idx];
    return {
      nombre: a.nombre, cd: a.cd, salvacion: a.salvacion, condicion: a.aplicaCondicion,
      efectoAlFallar: a.efectoAlFallar, dano: a.dano, tipoDano: a.tipoDano, alSalvar: a.alSalvar, area: a.alcance
    };
  }

  // Agua bendita: solo daña a infernales y muertos vivientes.
  function afectaA(p, fuente) {
    if (!fuente.soloTipos) return true;
    const tipo = datosDe(p).tipo || "";
    return fuente.soloTipos.some((t) => tipo.toLowerCase().includes(t.toLowerCase()));
  }

  function exitoAutomatico(p, fuente) {
    if (fuente.exitoAutomatico !== "sin_sueno") return false;
    const d = datosDe(p);
    return (d.inmuneCondiciones || []).includes("Agotamiento") || (d.inmuneA || []).includes("Dormir mágico");
  }

  // Una salvación puede imponer una o varias condiciones (p. ej. Asustado y Paralizado)
  const condicionesDe = (fuente) => [].concat(fuente.condicion || []);

  function modoSalvacionSugerido(p, fuente) {
    const d = datosDe(p);
    const contra = [...(d.ventajaSalvacionContra || []), ...(p.tipo === "pj" ? Objetos.ventajasSalvacionDe(d, Estado.get()) : [])];
    const ventaja = condicionesDe(fuente).some((cond) => contra.includes(cond));
    const desventaja = fuente.salvacion === "DES" && tiene(p, "Apresado");
    return ventaja && !desventaja ? "ventaja" : desventaja && !ventaja ? "desventaja" : "normal";
  }

  // ---------- Inicio de turno ----------
  function alIniciarTurno(c) {
    c.accion = null;
    c.ultimo = null;
    c.turnoFlags = {};
    c.recargaTiradas = {};
    c.salvMuerte = null;
    c.oportunidad = null;
    soltarAgarres(c);
    const p = participante(c, c.turnoUid);
    if (!p) return;
    p.reaccionUsada = false;
    if (p.enHumo) {
      p.enHumo = false;
      p.pg = 1;
      log(c, `${p.nombre} se reforma del humo carmesí con 1 PG (No muerto implacable)`);
    }
    if (tieneBuff(p, "escudo")) {
      p.buffs = p.buffs.filter((b) => b.id !== "escudo");
      log(c, `Termina Escudo de ${p.nombre} → CA ${caDe(p)}`);
    }
    const d = datosDe(p);
    // Caducan las marcas "hasta el inicio de tu próximo turno" y las de criaturas caídas
    c.marcas = (c.marcas || []).filter((m) => {
      if (m.fuente === p.uid && m.expira === "inicio") return false;
      return [m.fuente, m.objetivo, m.quien].filter(Boolean).every((uid) => {
        const q = participante(c, uid);
        return q && !fuera(q);
      });
    });
    if (p.tipo === "pj" && p.pg === 0 && !p.muerto && !p.estable) {
      c.salvMuerte = { tiradas: { m: D.nuevaTirada() }, valores: {} };
    }
    if (d.regeneracion && p.pg >= 1 && p.pg < p.pgMax) {
      const antes = p.pg;
      curar(p, d.regeneracion);
      log(c, `Regeneración · ${p.nombre} recupera ${p.pg - antes} PG (${p.pg}/${p.pgMax})`);
    }
    if (p.concentracion && p.concentracion.hastaRonda && c.ronda >= p.concentracion.hastaRonda) {
      terminarConcentracion(c, p, "se acaba la duración");
    }
    (p.efectos || []).forEach((e) => {
      if (e.tipo === "ardiendo") nuevaPendiente(c, { tipo: "ardiendo", uid: p.uid, cd: e.cd, nombre: e.nombre });
    });
  }

  // Al terminar el turno de alguien caducan sus marcas "hasta el final de tu próximo turno".
  function alTerminarTurno(c) {
    const uid = c.turnoUid;
    c.marcas = (c.marcas || []).filter((m) => !(m.fuente === uid && m.expira === "finSiguiente" && m.ronda < c.ronda));
  }

  // ---------- Render del turno ----------
  function renderTurno(est, c) {
    const p = participante(c, c.turnoUid);
    if (!p) return "";
    const partes = [];
    (c.pendientes || []).forEach((pe) => partes.push(renderPendiente(c, pe)));
    if (c.ultimo) partes.push(`<div class="resultado ${c.ultimo.clase || ""}">${c.ultimo.html}</div>`);
    partes.push(renderEntorno(c));
    const caido = p.tipo === "pj" && p.pg === 0;
    if (p.tipo === "pj" && !caido) partes.push(renderRecursos(est, p));
    if (p.tipo === "enemigo") partes.push(renderRecargas(c, p), renderRecordatorios(c, p, "turno"));

    if (caido) {
      partes.push(renderSalvMuerte(c, p));
    } else {
      const incap = INCAPACITANTES.find((x) => tiene(p, x));
      partes.push(renderCondicionesTurno(c, p));
      if (incap && !flags(c).forzarActuar && !c.accion) {
        partes.push(`<div class="aviso bloqueo">
          ⛔ ${esc(p.nombre)} está <b>${esc(incap)}</b>: no puede realizar acciones, acciones adicionales ni reacciones.
          Pasa al siguiente turno.
          <button class="btn btn-sm" data-accion="ac-forzar" title="Por si decides que sí puede actuar">Actuar igualmente</button>
        </div>`);
      } else {
        partes.push(renderEconomia(est, c, p));
        if (p.tipo === "pj" && !c.accion) partes.push(renderEquipo(est, c, p));
        if (c.accion) partes.push(renderAccion(est, c, c.accion));
        else partes.push(renderMenu(est, c, p), incap ? "" : renderOportunidad(est, c, p));
      }
    }

    partes.push(renderManual(c));
    return partes.join("");
  }

  function renderRecursos(est, p) {
    const d = datosDe(p);
    const chips = [];
    const tot = Recursos.espaciosTotales(d, 1);
    if (tot) {
      const libres = Recursos.espaciosLibres(est, d, 1);
      chips.push(`<span class="chip chip-espacios ${libres ? "" : "agotados"}" title="Espacios de conjuro de nivel 1: ${libres} de ${tot}">
        ✨ Espacios de conjuro <span class="gemas">${'<i class="gema llena"></i>'.repeat(libres)}${'<i class="gema"></i>'.repeat(tot - libres)}</span><b>${libres}/${tot}</b></span>`);
    }
    (d.recursos || []).forEach((r) => {
      chips.push(`<span class="chip">${esc(r.nombre)} <b>${Recursos.restante(est, d, r.id)}/${Recursos.total(d, r.id)}</b></span>`);
    });
    if (d.tiradaDobleDano) chips.push(`<span class="chip ${flags(Estado.get().combate).salvaje ? "chip-usado" : ""}">Atacante salvaje</span>`);
    const insp = Recursos.inspiracion(est, d);
    chips.push(`<button class="chip chip-boton ${insp ? "chip-insp" : "chip-usado"}" data-accion="ac-inspiracion"
      title="${insp ? "Usar: repite cualquier dado y cambia su valor en el casillero" : "Sin Inspiración heroica (clic para dársela)"}">${insp ? "★" : "☆"} Inspiración heroica</button>`);
    return chips.length ? `<div class="chips recursos-turno">${chips.join("")}</div>` : "";
  }

  function boton(accion, attrs, icono, nombre, detalle, deshabilitado, costo, clase = "") {
    const etiqueta = costo ? `<span class="coste coste-${costo}">${NOMBRE_COSTO[costo]}</span>` : "";
    return `<button class="btn btn-accion ${clase}" data-accion="${accion}" ${attrs} ${deshabilitado ? "disabled" : ""}>
      <span class="accion-nombre">${icono} ${esc(nombre)}${etiqueta}</span><span class="sub">${esc(detalle)}</span></button>`;
  }

  // Acción astuta (pícaro nv 2): Correr, Destrabarse o Esconderse como acción adicional
  const ASTUTA = {
    correr: { icono: "🏃", nombre: "Correr", resumen: "movimiento extra igual a su velocidad" },
    destrabarse: { icono: "↩", nombre: "Destrabarse", resumen: "su movimiento no provoca ataques de oportunidad este turno" },
    esconderse: { icono: "🫥", nombre: "Esconderse", resumen: "DES (Sigilo) CD 15 sin que la vean; si supera, Invisible" }
  };

  function renderMenu(est, c, p) {
    const d = datosDe(p);
    // Dos apartados según lo que cuesta cada cosa ahora mismo
    const armas = [];        // Acción: ataques
    const conjuros = [];     // Acción: conjuros
    const otras = [];        // Acción: rasgos, objetos, acciones especiales
    const adicionales = [];  // Acción adicional (incluye el 2º ataque con arma ligera)

    ataquesDe(est, p).forEach((a) => {
      let detalle;
      let sinMunicion = false;
      if (a.pj) {
        const r = R.ataqueArma(d, a.arma);
        const mun = Objetos.municionDe(est, d, a.arma);
        sinMunicion = Boolean(mun) && mun.cantidad === 0;
        detalle = `${R.signo(r.bonus)} · ${r.textoDano}${a.item && a.item.encendida ? " +2d6 fuego" : ""}${a.item && a.item.envenenado ? " · ☠ hoja envenenada" : ""}${mun ? ` · ${mun.cantidad} ${mun.nombre.toLowerCase()}` : ""}`;
      } else {
        const extra = (a.accion.danoExtra || []).map((x) => ` + ${x.dado}`).join("");
        detalle = `${R.signo(a.accion.bonusAtaque)} · ${a.accion.dano}${extra}`;
      }
      const costo = costoAtaque(c, p, a.arma);
      if (costo === "mella" || costo === "adicional") {
        const r = R.ataqueArma(d, a.arma);
        const fijo = Math.min(0, r.modAtributo) + (a.arma.bonusDano || 0);
        detalle = `${R.signo(r.bonus)} · ${r.dano}${fijo ? " " + R.signo(fijo) : ""} · 2º ataque con arma ligera (sin mod. al daño)`;
      }
      if (!costo) detalle += " · " + motivoSinCosto(c);
      (costo === "mella" || costo === "adicional" ? adicionales : armas)
        .push(boton("ac-atacar", `data-key="${esc(a.key)}"`, "⚔", a.nombre, detalle, sinMunicion || !costo, costo));
    });

    if (p.tipo === "enemigo") {
      d.acciones.forEach((a, i) => {
        if (a.cd == null) return;
        const ok = disponible(c, p, i);
        const tipo = a.adicional ? "adicional" : "accion";
        const costo = costoSimple(c, tipo);
        const etiqueta = a.recarga ? ` · recarga ${a.recarga}` : a.usosPorDia ? ` · ${a.usosPorDia}/día` :
          a.nivelConjuro ? ` · conjuro nv${a.nivelConjuro} (${espaciosEnemigoLibres(c, p, a.nivelConjuro)} espacios)` : "";
        (a.adicional ? adicionales : otras).push(boton("ac-salvacion", `data-idx="${i}"`, "✦", a.nombre,
          `${a.salvacion} CD ${a.cd}${a.dano ? ` · ${a.dano} ${a.tipoDano}` : ""}${etiqueta}${ok ? "" : " · no disponible"}${costo ? "" : ` · ${a.adicional ? "acción adicional" : "acción"} ya usada`}`, !ok || !costo, costo));
      });
    } else {
      hechizosDe(est, d).forEach((h) => {
        if (h.resolucion === "castigo" || h.resolucion === "reaccion") return;   // se usan desde un ataque (propio o enemigo)
        const costo = costoSimple(c, tipoTiempo(h.tiempo));
        const bloqueo = bloqueoConjuro(est, c, d, h) || (!costo && (tipoTiempo(h.tiempo) === "adicional" ? "acción adicional ya usada" : "acción ya usada"));
        (tipoTiempo(h.tiempo) === "adicional" ? adicionales : conjuros).push(boton("ac-conjuro", `data-id="${esc(h.id)}"`, h.usaRecurso ? "☀" : h.nivel ? "✨" : "✧",
          h.nombre, `${h.usaRecurso ? `${Recursos.definicion(d, h.usaRecurso).nombre} ${Recursos.restante(est, d, h.usaRecurso)}/${Recursos.total(d, h.usaRecurso)}` : h.nivel ? "nv1 · gasta 1 espacio" : "truco"} · ${resumenConjuro(d, h)}${bloqueo ? " · " + bloqueo : ""}`,
          Boolean(bloqueo), costo, h.usaRecurso ? "btn-canalizar" : h.nivel ? "btn-conjuro-nivel" : "btn-truco"));
      });
      (d.recursos || []).forEach((r) => {
        const quedan = Recursos.restante(est, d, r.id);
        if (r.id === "oleada_accion") {
          // Oleada de acción: sin coste; tras gastar la acción, da otra (no la acción Magia)
          const f = flags(c);
          const motivo = f.oleada ? "ya usada este turno" : !f.accion ? "primero usa tu acción" : quedan === 0 ? "sin usos (descanso corto o largo)" : "";
          otras.push(boton("ac-oleada", "", "⚡", r.nombre, `sin coste · una acción más este turno (no Magia) · ${quedan}/${Recursos.total(d, r.id)}${motivo ? " · " + motivo : ""}`, Boolean(motivo), null, "btn-oleada"));
          return;
        }
        if (r.sinBoton) return;   // se usa desde otro sitio (p. ej. Canalizar divinidad, en Conjuros)
        const info = r.id === "tomar_aliento" ? `acción adicional · 1d10 + ${d.nivel}` :
          r.id === "imposicion_manos" ? "acción adicional · reserva de PG" : "acción adicional";
        const costo = costoSimple(c, "adicional");
        adicionales.push(boton("ac-recurso", `data-id="${esc(r.id)}"`, "✚", r.nombre, `${info} · ${quedan}/${Recursos.total(d, r.id)}${costo ? "" : " · acción adicional ya usada"}`, quedan === 0 || !costo, costo));
      });
      if (d.accionAstuta) {
        const costo = costoSimple(c, "adicional");
        Object.entries(ASTUTA).forEach(([tipo, a]) => adicionales.push(boton("ac-astuta", `data-tipo="${tipo}"`, a.icono, a.nombre,
          `Acción astuta · ${a.resumen}${costo ? "" : " · acción adicional ya usada"}`, !costo, costo)));
      }
      Objetos.usablesDe(est, d).forEach(({ entrada, def }) => {
        const cd = def.cd === "lanzador" ? cdLanzador(d) : def.cd;
        const info = def.uso === "salvacion" ? `${def.salvacion} CD ${cd}` : "estabiliza a 0 PG";
        const costo = def.tiempo === "sustituye un ataque" ? costoAtaque(c, p, null, { soloAtaque: true }) : costoSimple(c, tipoTiempo(def.tiempo));
        (tipoTiempo(def.tiempo) === "adicional" ? adicionales : otras).push(boton("ac-objeto", `data-id="${esc(def.id)}"`, "🎒", def.nombre, `${def.tiempo} · ${info} · quedan ${entrada.cantidad}${costo ? "" : " · acción ya usada"}`, !costo, costo));
      });
      Objetos.pocionesDe(d, est).forEach((it) => {
        const o = Objetos.objetoDe(it);
        const costo = costoSimple(c, "adicional");
        const info = o.aplicaBuff ? `${(porId(BUFFS, o.aplicaBuff) || {}).nombre} 1 hora` : o.curacion;
        adicionales.push(boton(o.aplicaBuff ? "ac-pocion-buff" : "ac-pocion", `data-uid="${esc(it.uid)}"`, "🧪", o.nombre, `acción adicional · ${info} · a sí o a alguien a 5 ft${costo ? "" : " · acción adicional ya usada"}`, !costo, costo));
      });
      // Periapto de salud: acción Magia, una vez hasta el amanecer
      Objetos.maravillososDe(d, est).filter((it) => Objetos.objetoDe(it).curacion).forEach((it) => {
        const o = Objetos.objetoDe(it);
        const costo = costoSimple(c, "accion");
        otras.push(boton("ac-maravilloso", `data-uid="${esc(it.uid)}"`, "📿", o.nombre, `acción Magia · cura ${o.curacion}${it.usadoHoy ? " · ya usado hoy" : ""}${costo ? "" : " · acción ya usada"}`, it.usadoHoy || !costo, costo));
      });
      // Gorro de la Desaparición: acción Magia y 1 carga → Invisible
      Objetos.maravillososDe(d, est).filter((it) => Objetos.objetoDe(it).invisibilidad).forEach((it) => {
        const o = Objetos.objetoDe(it);
        const costo = costoSimple(c, "accion");
        const motivo = !it.cargas ? "sin cargas (vuelven al amanecer)" : p.invisibleGorro ? "ya está invisible" : !costo ? "acción ya usada" : "";
        otras.push(boton("ac-gorro", `data-uid="${esc(it.uid)}"`, "🎩", o.nombre,
          `acción Magia · Invisible 10 min · ${it.cargas}/${o.cargas} cargas · termina al atacar, dañar o lanzar un conjuro${motivo ? " · " + motivo : ""}`, Boolean(motivo), costo));
      });
      // Kukri empapado en veneno: acción adicional para envenenar la hoja (1 vez hasta el amanecer)
      Objetos.armasDe(d, est).filter(({ item }) => item && item.sintonizado && Objetos.objetoDe(item).veneno).forEach(({ item }) => {
        const o = Objetos.objetoDe(item);
        const costo = costoSimple(c, "adicional");
        const motivo = item.envenenado ? "la hoja ya está envenenada" : item.venenoUsado ? "ya usado hoy" : !costo ? "acción adicional ya usada" : "";
        adicionales.push(boton("ac-envenenar", `data-uid="${esc(item.uid)}"`, "☠", `Envenenar ${o.nombre}`,
          `1 min o hasta golpear · CON CD ${o.veneno.cd} o ${o.veneno.dano} ${o.veneno.tipoDano} y ${o.veneno.condicion}${motivo ? " · " + motivo : ""}`, Boolean(motivo), costo));
      });
    }

    const notasAccion = [];
    const notasAdicional = [];
    if (d.multiataque) notasAccion.push(`<b>Ataque múltiple:</b> ${esc(d.multiataque.texto)}`);
    if (p.tipo === "enemigo") {
      d.acciones.filter((a) => a.bonusAtaque == null && a.cd == null).forEach((a) => notasAccion.push(`<b>${esc(a.nombre)}:</b> ${esc(a.texto)}`));
      (d.accionesAdicionales || []).forEach((a) => notasAdicional.push(`<b>${esc(a.nombre)}:</b> ${esc(a.texto)}`));
    } else {
      ["castigo_abrasador", "castigo_divino"].filter((id) => Recursos.preparadosDe(est, d.id).includes(id)).forEach((id) =>
        notasAdicional.push(`<b>${esc(hechizo(id).nombre)}:</b> justo después de golpear con un arma cuerpo a cuerpo (casilla dentro del ataque).`));
    }

    const f = flags(c);
    const lista = (arr) => arr.length ? `<div class="menu-acciones">${arr.join("")}</div>` : "";
    const sub = (titulo, arr) => arr.length ? `<div class="menu-subtitulo">${titulo}</div>${lista(arr)}` : "";
    const notas = (arr) => arr.length ? `<ul class="rasgos notas-turno">${arr.map((n) => `<li>${n}</li>`).join("")}</ul>` : "";
    const estadoAccion = f.accion
      ? (f.accionTipo === "ataque" && (f.ataques || 0) < ataquesPorAccion(p) ? `ataques ${f.ataques}/${ataquesPorAccion(p)}` : "usada")
      : "disponible";

    return `
      <div class="bloque-menu bloque-accion ${f.accion && estadoAccion === "usada" ? "gastado" : ""}">
        <div class="menu-titulo titulo-accion">● Acciones <span class="menu-estado">${estadoAccion}</span>
          <span class="sub">una por turno: atacar, lanzar un conjuro, usar un objeto…</span></div>
        ${sub("Ataques", armas)}
        ${sub("Conjuros", conjuros)}
        ${p.tipo === "pj" && Recursos.espaciosTotales(d, 1) && !hechizosDe(est, d).some((h) => h.nivel >= 1)
          ? `<p class="sub aviso-texto">${esc(d.nombre)} no tiene hechizos de nivel 1 preparados. Elígelos en Preparar → Ficha de ${esc(d.nombre)}${est.partidaId ? "" : " (primero elige la partida)"}.</p>` : ""}
        ${sub(p.tipo === "pj" ? "Rasgos y objetos" : "Acciones especiales", otras)}
        ${!armas.length && !conjuros.length && !otras.length ? `<p class="muted">Sin acciones disponibles.</p>` : ""}
        ${notas(notasAccion)}
      </div>
      <div class="bloque-menu bloque-adicional ${f.adicional ? "gastado" : ""}">
        <div class="menu-titulo titulo-adicional">◆ Acciones adicionales <span class="menu-estado">${f.adicional ? "usada" : "disponible"}</span>
          <span class="sub">una por turno, solo si algo te la concede</span></div>
        ${lista(adicionales)}
        ${!adicionales.length && !notasAdicional.length ? `<p class="muted">No tiene acciones adicionales disponibles ahora.</p>` : ""}
        ${notas(notasAdicional)}
      </div>`;
  }

  function renderSalvMuerte(c, p) {
    const m = p.muerte || { exitos: 0, fallos: 0 };
    const marcador = `<span class="muerte-marcador"><span class="ok">${puntos(m.exitos, "✔")}</span> <span class="ko">${puntos(m.fallos, "✖")}</span></span>`;
    if (p.muerto) return `<div class="aviso">☠ ${esc(p.nombre)} ha muerto.</div>`;
    if (p.estable) {
      return `<div class="aviso">${esc(p.nombre)} está <b>estable</b> a 0 PG (inconsciente). No hace salvaciones de muerte; recupera 1 PG en 1d4 horas o si alguien le cura.</div>`;
    }
    if (!c.salvMuerte) {
      return `<div class="aviso">${esc(p.nombre)} está a 0 PG ${marcador}. Hará su salvación de muerte al inicio de su próximo turno. Curarle le despierta.</div>`;
    }
    const { html, res, total } = tiradaD20("m", c.salvMuerte, "m", p, 0, "salvacionExtraDado");
    let resultado = "";
    if (res && total != null) {
      resultado = res.natural === 20 ? "20 natural: recupera 1 PG y despierta"
        : res.natural === 1 ? "1 natural: cuenta como 2 fallos"
          : total >= 10 ? `${total}: éxito` : `${total}: fallo`;
    }
    return `
      <div class="accion-en-curso muerte">
        <div class="paso-titulo">💀 <b>${esc(p.nombre)}</b> está a 0 PG: <b>salvación de muerte</b> · tira 1d20, <b class="objetivo-num">10</b> o más es éxito ${marcador}</div>
        <div class="fila-tirada sin-borde">
          ${selectModo("m", "m", c.salvMuerte.tiradas.m.modo)}
          <div class="dados">${html}</div>
          <div class="total ${!res ? "" : res.natural === 20 || total >= 10 ? "nat20" : "nat1"}">${total == null ? "—" : total}</div>
        </div>
        ${resultado ? `<div class="banner ${res.natural === 20 || (res.natural !== 1 && total >= 10) ? "golpe" : "fallo"}">${esc(resultado)}</div>` : ""}
        <p class="sub">3 éxitos: queda estable · 3 fallos: muere · recibir daño a 0 PG: 1 fallo (2 si es crítico).</p>
        <div class="barra-acciones"><span></span>
          <button class="btn btn-primary" data-accion="ac-muerte" ${total != null ? "" : "disabled"}>Anotar salvación</button>
        </div>
      </div>`;
  }

  function resolverSalvMuerte(c) {
    const p = participante(c, c.turnoUid);
    const { res, total } = tiradaD20("m", c.salvMuerte, "m", p, 0, "salvacionExtraDado");
    if (total == null) return;
    p.muerte = p.muerte || { exitos: 0, fallos: 0 };
    let txt;
    if (res.natural === 20) {
      curar(p, 1);
      txt = `${p.nombre}: salvación de muerte 20 natural → recupera 1 PG y despierta`;
    } else if (res.natural === 1) {
      txt = `${p.nombre}: salvación de muerte 1 natural → ${anotarFallosMuerte(c, p, 2, "1 natural")}`;
    } else if (total >= 10) {
      p.muerte.exitos++;
      if (p.muerte.exitos >= 3) {
        p.estable = true;
        txt = `${p.nombre}: salvación de muerte ${total} → éxito · 3 éxitos: queda estable`;
      } else {
        txt = `${p.nombre}: salvación de muerte ${total} → éxito · ${p.muerte.exitos}✔ ${p.muerte.fallos}✖`;
      }
    } else {
      txt = `${p.nombre}: salvación de muerte ${total} → ${anotarFallosMuerte(c, p, 1, "fallo")}`;
    }
    log(c, txt);
    c.ultimo = { clase: p.muerto ? "fallo" : res.natural === 20 || total >= 10 ? "cura" : "fallo", html: esc(txt) };
    c.salvMuerte = null;
  }

  // Ataques cuerpo a cuerpo de una criatura (los únicos válidos como ataque de oportunidad)
  function ataquesCuerpo(est, q) {
    return ataquesDe(est, q).filter((a) => (a.pj ? a.arma.tipo === "cuerpo a cuerpo" : a.accion.tipo !== "distancia"));
  }

  // Quién puede hacer un ataque de oportunidad contra la criatura del turno (p)
  function posiblesOportunidad(c, p) {
    const lista = c.orden.map((u) => participante(c, u))
      .filter((q) => q && q.uid !== p.uid && !fuera(q) && q.pg > 0 && !INCAPACITANTES.some((x) => tiene(q, x)));
    // Primero el bando contrario al que se mueve
    return [...lista.filter((q) => q.tipo !== p.tipo), ...lista.filter((q) => q.tipo === p.tipo)];
  }

  function eleccionOportunidad(est, c, p) {
    const op = c.oportunidad || {};
    const posibles = posiblesOportunidad(c, p);
    let atacante = participante(c, op.atacanteUid);
    if (!atacante || !posibles.includes(atacante)) {
      atacante = posibles.find((q) => q.tipo !== p.tipo && !q.reaccionUsada) || posibles.find((q) => q.tipo !== p.tipo) || posibles[0];
    }
    const ataques = atacante ? ataquesCuerpo(est, atacante) : [];
    const ataque = ataques.find((a) => a.key === op.ataqueKey) || ataques[0];
    return { posibles, atacante, ataques, ataque };
  }

  function renderOportunidad(est, c, p) {
    const { posibles, atacante, ataques, ataque } = eleccionOportunidad(est, c, p);
    if (!posibles.length) return "";
    const puede = atacante && !atacante.reaccionUsada && ataque;
    const opcionesAtacante = posibles.map((q) => `<option value="${esc(q.uid)}" ${q === atacante ? "selected" : ""}>${esc(q.nombre)}${q.reaccionUsada ? " (reacción usada)" : ""}${q.tipo === p.tipo ? " · aliado" : ""}</option>`).join("");
    const opcionesAtaque = ataques.map((a) => `<option value="${esc(a.key)}" ${a === ataque ? "selected" : ""}>${esc(a.nombre)}</option>`).join("");
    return `
      <details class="plegable oportunidad" ${c.oportunidadAbierto ? "open" : ""}>
        <summary><span class="titulo-reaccion">↺ Ataque de oportunidad</span>
          <span class="sub">reacción · cuando ${esc(p.nombre)} sale del alcance de alguien</span></summary>
        <p class="sub" style="margin:8px 0">Una criatura que sale de tu alcance usando su movimiento provoca un ataque cuerpo a cuerpo que gasta tu <b>reacción</b>.
          No lo provoca si usó <b>Destrabarse</b> (p. ej. la Huida ágil del goblin) ni si la mueven sin usar su movimiento.</p>
        <div class="fila">
          <select data-accion="ac-op-atacante" aria-label="Quién ataca">${opcionesAtacante}</select>
          <select data-accion="ac-op-ataque" aria-label="Con qué ataca" ${ataques.length ? "" : "disabled"}>${opcionesAtaque || "<option>Sin ataques cuerpo a cuerpo</option>"}</select>
          <button class="btn btn-sm btn-reaccion" data-accion="ac-oportunidad" ${puede ? "" : "disabled"}>Atacar a ${esc(p.nombre)}</button>
        </div>
        ${atacante && atacante.reaccionUsada ? `<p class="sub aviso-texto">${esc(atacante.nombre)} ya usó su reacción esta ronda.</p>` : ""}
      </details>`;
  }

  // Armas en la mano, armas guardadas y escudo del PJ del turno
  function renderEquipo(est, c, p) {
    const d = datosDe(p);
    const eq = Objetos.equipoDe(est, d);
    const enMano = Objetos.armasEnMano(d, est);
    const guardadas = Objetos.armasGuardadas(d, est);
    const f = flags(c);
    const manos = Objetos.manosUsadas(est, d);
    const chips = enMano.map(({ key, arma }) => `<span class="chip chip-mano">✋ ${esc(arma.nombre)}${Objetos.manosArma(arma) === 2 ? " (2 manos)" : ""}
      <button class="chip-x" data-accion="ac-guardar-arma" data-key="${esc(key)}" title="Guardar" aria-label="Guardar ${esc(arma.nombre)}">×</button></span>`).join("");
    const escudo = d.escudo
      ? `<button class="btn btn-sm ${eq.escudo ? "" : "btn-escudo-off"}" data-accion="ac-escudo" ${f.accion ? "disabled" : ""}
          title="Ponerse o quitarse el escudo gasta la Acción (Utilizar)">🛡 ${eq.escudo ? "Quitarse el escudo" : "Ponerse el escudo"} <span class="coste coste-accion">Acción</span></button>`
      : "";
    return `
      <div class="equipo-turno">
        <span class="sub">En mano (${manos}/2):</span>
        ${chips || `<span class="sub">manos vacías</span>`}
        ${eq.escudo ? `<span class="chip chip-mano">🛡 Escudo +${d.escudo} CA</span>` : ""}
        ${guardadas.length ? `<select data-ref="sacar-arma" aria-label="Arma para sacar">
            ${guardadas.map(({ key, arma }) => `<option value="${esc(key)}">${esc(arma.nombre)}${Objetos.manosArma(arma) === 2 ? " (2 manos)" : ""}</option>`).join("")}
          </select>
          <button class="btn btn-sm" data-accion="ac-sacar-arma" title="Gratis: una al atacar, o con la interacción con un objeto del turno">Sacar</button>` : ""}
        ${escudo}
        ${(f.cambiosArma || 0) > 1 ? `<span class="sub aviso-texto">Más de un cambio de arma este turno: normalmente es uno por ataque o interacción.</span>` : ""}
      </div>`;
  }

  function renderRecargas(c, p) {
    const d = datosDe(p);
    return d.acciones.map((a, i) => ({ a, i }))
      .filter(({ a, i }) => a.recarga && c.recargas && c.recargas[p.uid] && c.recargas[p.uid][i] === false)
      .map(({ a, i }) => `<div class="aviso fila">
        <span>Recarga de <b>${esc(a.nombre)}</b> (${esc(a.recarga)}): tira 1d6</span>
        ${D.casillero({ key: `ac|rec|${i}`, caras: 6, valor: (c.recargaTiradas || {})[i] })}
      </div>`).join("");
  }

  function renderPendiente(c, pe) {
    const p = participante(c, pe.uid);
    if (!p) return "";
    const bonus = bonusSalvacion(p, "CON");
    const { html, total } = tiradaD20(pe.id, pe, "salv", p, bonus, "salvacionExtraDado");
    const supera = total != null && total >= pe.cd;
    let titulo;
    let dados = "";
    let listo = total != null;
    if (pe.tipo === "concentracion") {
      titulo = `<b>${esc(p.nombre)}</b> recibió daño: salvación de <b>CON CD <span class="objetivo-num">${pe.cd}</span></b> para mantener <b>${esc(pe.nombre)}</b>`;
    } else if (pe.tipo === "veneno") {
      titulo = `<b>${esc(pe.nombre)}</b> sobre ${esc(p.nombre)}: salvación de <b>CON CD <span class="objetivo-num">${pe.cd}</span></b>; si falla, ${esc(pe.dano)} de ${esc(pe.tipoDano)} y ${esc(pe.condicion)} 1 min`;
      if (total != null && !supera) {
        const caras = R.carasDe(pe.dano);
        dados = `<div class="grupo-dados"><span class="grupo-etiqueta">Veneno</span><div class="dados">${D.renderGrupo(caras, pe.valores.veneno || [], `ac|v|${pe.id}|veneno`)}</div></div>`;
        listo = D.sumaGrupo(caras, pe.valores.veneno || []) != null;
      }
    } else {
      titulo = `<b>${esc(pe.nombre)}</b> sobre ${esc(p.nombre)}: 1d6 de fuego y salvación de <b>CON CD <span class="objetivo-num">${pe.cd}</span></b> (si la supera, se apaga)`;
      dados = `<div class="grupo-dados"><span class="grupo-etiqueta">Fuego</span><div class="dados">${D.renderGrupo([6], pe.valores.fuego || [], `ac|v|${pe.id}|fuego`)}</div></div>`;
      listo = listo && D.sumaGrupo([6], pe.valores.fuego || []) != null;
    }
    return `
      <div class="accion-en-curso pendiente">
        <div class="paso-titulo">⏳ ${titulo}</div>
        ${dados}
        <div class="fila-tirada sin-borde">
          ${selectModo(pe.id, "salv", pe.tiradas.salv.modo)}
          <div class="dados">${html}</div>
          <div class="total ${total == null ? "" : supera ? "nat20" : "nat1"}">${total == null ? "—" : total}<span class="sub">${total == null ? "" : supera ? " supera" : " falla"}</span></div>
        </div>
        <div class="sub">1d20 ${R.signo(bonus)} (CON)</div>
        <div class="barra-acciones"><span></span>
          <button class="btn btn-primary" data-accion="ac-resolver" data-id="${esc(pe.id)}" ${listo ? "" : "disabled"}>Resolver</button>
        </div>
      </div>`;
  }

  // Poción que da un buff (Poción de resistencia): a sí o a una criatura a 5 ft
  function renderPocionBuff(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const item = (est.botin || []).find((it) => it.uid === ac.itemUid);
    const o = item && Objetos.objetoDe(item);
    if (!o) return "";
    return `
      <div class="accion-en-curso">
        <div class="fila">
          <span class="paso-etiqueta">${esc(actor.nombre)} usa <b>${esc(o.nombre)}</b> (acción adicional) en</span>
          <select data-accion="ac-objetivo">
            ${aliados(c, actor).map((q) => `<option value="${esc(q.uid)}" ${q.uid === ac.objetivoUid ? "selected" : ""}>${esc(q.nombre)}${q.uid === actor.uid ? " (sí mismo)" : ""}</option>`).join("")}
          </select>
        </div>
        <p class="sub">${esc(o.texto)}</p>
        <div class="barra-acciones">
          <button class="btn" data-accion="ac-cancelar">Cancelar</button>
          <button class="btn btn-primary" data-accion="ac-aplicar">Aplicar</button>
        </div>
      </div>`;
  }

  function aplicarPocionBuff(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const obj = participante(c, ac.objetivoUid);
    const item = (est.botin || []).find((it) => it.uid === ac.itemUid);
    if (!item || !obj) return;
    const o = Objetos.objetoDe(item);
    gastarCosto(c, ac);
    item.usado = true;
    anadirBuff(c, obj, o.aplicaBuff, actor, {});
    const txt = `${actor.nombre} usa ${o.nombre} en ${obj.nombre}: ${(porId(BUFFS, o.aplicaBuff) || {}).nombre} durante 1 hora`;
    log(c, txt);
    c.ultimo = { clase: "cura", html: `🧪 ${esc(txt)}` };
    c.accion = null;
  }

  function renderAccion(est, c, ac) {
    switch (ac.tipo) {
      case "pocionBuff": return renderPocionBuff(est, c, ac);
      case "ataque": return renderAtaque(est, c, ac);
      case "salvacion": return renderSalvacion(c, ac);
      case "dardos": return renderDardos(c, ac);
      case "curacion": return renderCuracion(est, c, ac);
      case "buff": return renderBuff(c, ac);
      case "utilidad": return renderUtilidad(c, ac);
      case "imposicion": return renderImposicion(est, c, ac);
      case "estabilizar": return renderEstabilizar(est, c, ac);
      default: return "";
    }
  }

  function check(opcion, marcado, texto, deshabilitado) {
    return `<label class="check-inline ${deshabilitado ? "deshabilitado" : ""}">
      <input type="checkbox" data-accion="ac-opcion" data-opcion="${opcion}" ${marcado ? "checked" : ""} ${deshabilitado ? "disabled" : ""}> ${texto}</label>`;
  }

  function renderAtaque(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const d = datosDe(actor);
    const desc = descriptor(est, c, ac);
    const obj = participante(c, ac.objetivoUid);
    if (!desc || !obj) return `<p class="muted">Ataque no disponible (sin arma u objetivo).</p><button class="btn" data-accion="ac-cancelar">Volver</button>`;
    const { html: d20, res, extra } = tiradaD20("a", ac, "atk", actor, desc.bonus, "ataqueExtraDado");
    const r = ac.cobertura === "total" ? null : resultadoAtaque(c, ac, desc);
    const f = flags(c);

    const op = [];
    if (desc.atk && desc.atk.pj) {
      const arma = desc.atk.arma;
      if (arma.versatil) {
        const libre = Objetos.manosUsadas(est, d, desc.atk.key) === 0;
        op.push(check("dosManos", ac.opciones.dosManos && libre,
          `A dos manos (${arma.versatil})${libre ? "" : " · necesita la otra mano libre (sin escudo ni otra arma)"}`, !libre));
      }
      const o = desc.atk.item && Objetos.objetoDe(desc.atk.item);
      if (o && o.activable) {
        op.push(desc.atk.item.sintonizado
          ? `<label class="check-inline"><input type="checkbox" data-accion="ac-encender" data-uid="${esc(desc.atk.item.uid)}" ${desc.atk.item.encendida ? "checked" : ""}> ${esc(o.activable.nombre)} (+${esc(o.activable.danoExtra.dado)} ${esc(o.activable.danoExtra.tipo)}, ${esc(o.activable.tiempo)})</label>`
          : `<span class="sub">Sin sintonizar: funciona como un arma normal (pestaña Objetos).</span>`);
      }
      if (d.ataqueFurtivo && (arma.propiedades.includes("sutil") || arma.tipo === "distancia")) {
        const usado = f.furtivo && !ac.opciones.furtivo;
        op.push(check("furtivo", ac.opciones.furtivo, `Ataque furtivo (+${d.ataqueFurtivo}) — con ventaja, o aliado a 5 ft del objetivo y sin desventaja${usado ? " · ya usado este turno" : ""}`, usado));
      }
      if (d.tiradaDobleDano) {
        const usado = f.salvaje && !ac.opciones.salvaje;
        op.push(check("salvaje", ac.opciones.salvaje, `Atacante salvaje: tira el daño del arma dos veces y usa el mayor${usado ? " · ya usado este turno" : ""}`, usado));
      }
      if (!ac.oportunidad && puedeCastigar(est, c, actor, arma)) {
        const bloqueo = !ac.opciones.castigo && ((ac.opciones.castigoDivino && "ya usas Castigo divino") || bloqueoConjuro(est, c, d, hechizo("castigo_abrasador")) || (f.adicional && "acción adicional ya usada"));
        op.push(check("castigo", ac.opciones.castigo, `Castigo abrasador al golpear (+1d6 fuego y arde; gasta 1 espacio, acción adicional)${bloqueo ? " · " + bloqueo : ""}`, Boolean(bloqueo)));
      }
      if (!ac.oportunidad && puedeCastigar(est, c, actor, arma, "castigo_divino")) {
        const gratis = castigoGratis(est, d);
        const bloqueo = !ac.opciones.castigoDivino && ((ac.opciones.castigo && "ya usas Castigo abrasador") || (f.adicional && "acción adicional ya usada") ||
          (!gratis && bloqueoConjuro(est, c, d, hechizo("castigo_divino"))));
        op.push(check("castigoDivino", ac.opciones.castigoDivino,
          `Castigo divino al golpear (+2d8 radiante, +1d8 contra infernal o muerto viviente; acción adicional · ${gratis ? "gratis: Castigo del paladín, 1/descanso largo" : "gasta 1 espacio"})${bloqueo ? " · " + bloqueo : ""}`, Boolean(bloqueo)));
      }
      if (!desc.competente) op.push(`<span class="sub aviso-texto">Sin competencia con esta arma: no suma el bonificador de competencia.</span>`);
    }
    const hechizador = (actor.origenes || {}).Hechizado;
    if (tiene(actor, "Hechizado") && hechizador === obj.uid) op.push(`<span class="sub aviso-texto">Hechizado: no puede atacar a quien le hechizó.</span>`);
    const indefenso = desc.cuerpo && ["Paralizado", "Inconsciente"].find((x) => tiene(obj, x));
    if (indefenso) op.push(check("a5ft", ac.opciones.a5ft !== false, `A 5 ft de un objetivo ${indefenso}: si impacta, es crítico automático`));
    const cantor = fuenteCancion(c, actor.tipo === "enemigo" ? actor.uid : obj.uid);
    if (actor.tipo === "enemigo" && bajoCancion(c, actor)) {
      op.push(check("cancion", ac.opciones.cancion !== false, `🩸 Canción de sangre de ${esc(cantor.nombre)} (si está a 30 ft): +2 al ataque y +1d6 necrótico`));
    } else if (actor.tipo === "pj" && bajoCancion(c, obj) && desc.atk && desc.atk.pj && !desc.atk.arma.magico) {
      op.push(check("cancion", ac.opciones.cancion !== false, `🩸 ${esc(obj.nombre)} bajo la Canción de sangre de ${esc(cantor.nombre)} (a 30 ft): resiste daño contundente, cortante y perforante de armas no mágicas`));
    }
    const bEscudo = bloqueoEscudo(est, obj);
    if (bEscudo !== "no" && bEscudo !== "ya activo") {
      op.push(check("escudo", ac.opciones.escudo && !bEscudo,
        `🛡 ${obj.nombre} lanza Escudo (reacción): +5 CA contra este ataque y hasta el inicio de su turno · gasta 1 espacio${bEscudo ? " · " + bEscudo : ""}`, Boolean(bEscudo)));
    }
    const sug = ac.sugerencia;
    const razones = sug && (sug.ventajas.length || sug.desventajas.length)
      ? `<div class="razones">${sug.ventajas.length ? `<span class="ok">Ventaja: ${esc(sug.ventajas.join(", "))}</span>` : ""}
          ${sug.desventajas.length ? `<span class="ko">Desventaja: ${esc(sug.desventajas.join(", "))}</span>` : ""}
          ${ac.modoManual ? `<span class="sub">(modo cambiado a mano)</span>` : ""}</div>` : "";

    let resultado = "";
    if (r) {
      resultado = r.critico
        ? `<div class="banner golpe critico">🎯 ¡CRÍTICO! ${r.total} (${r.critAuto ? `objetivo ${esc(r.critAuto)} a 5 ft` : "20 natural"}) — dados de daño dobles</div>`
        : r.pifia
          ? `<div class="banner fallo">✖ 1 natural — falla automáticamente</div>`
          : r.golpe
            ? `<div class="banner golpe">✔ ¡Impacta! ${r.total} contra CA ${r.ca}</div>`
            : `<div class="banner fallo">✖ Falla: ${r.total} contra CA ${r.ca}</div>`;
    }

    let danoHtml = "";
    let listo = false;
    if (r && r.golpe) {
      const res2 = calcularDano(desc.grupos, ac.valores, r.critico, defensasAtaque(c, ac, desc, obj), ac.opciones.salvaje);
      listo = Boolean(res2);
      danoHtml = `
        <div class="paso">
          <div class="paso-titulo">Daño: tira ${tituloDano(desc.grupos, r.critico)}</div>
          ${renderGruposDano(desc.grupos, ac.valores, r.critico, ac.opciones.salvaje)}
          ${res2 ? `<div class="total-dano">= <b>${res2.total}</b> de daño <span class="sub">${esc(textoDano(res2))}</span>
            → ${esc(obj.nombre)} ${Math.max(0, obj.pg - res2.total)}/${obj.pgMax} PG</div>` : ""}
        </div>`;
    }

    const rozar = r && !r.golpe && desc.maestria === "Rozar" && desc.modAtributo > 0
      ? `<button class="btn" data-accion="ac-rozar">Rozar: aplicar ${desc.modAtributo} de daño ${esc(desc.atk.arma.tipoDano)}</button>` : "";
    const verbo = desc.hechizo ? `lanza <b>${esc(desc.nombre)}</b> contra` : `ataca con <b>${esc(desc.nombre)}</b> a`;
    const cabecera = ac.oportunidad ? `<div class="banner-reaccion">↺ Ataque de oportunidad · gasta la reacción de ${esc(actor.nombre)}</div>` : "";

    return `
      <div class="accion-en-curso ${ac.oportunidad ? "reaccion" : ""}">
        ${cabecera}
        <div class="paso">
          <div class="fila">
            <span class="paso-etiqueta">${esc(actor.nombre)} ${verbo}</span>
            <select data-accion="ac-objetivo">${opcionesObjetivo(c, actor, ac.objetivoUid)}</select>
          </div>
          ${op.length ? `<div class="opciones">${op.join("")}</div>` : ""}
        </div>
        ${actor.tipo === "enemigo" ? renderRecordatorios(c, actor, "ataque") : ""}
        <div class="paso">
          <div class="fila cobertura">
            <span class="sub">Cobertura del objetivo</span>
            <select data-accion="ac-cobertura" aria-label="Cobertura del objetivo">
              ${Object.entries(COBERTURAS).map(([k, v]) => `<option value="${k}" ${k === (ac.cobertura || "ninguna") ? "selected" : ""}>${v.nombre}</option>`).join("")}
            </select>
          </div>
          ${ac.cobertura === "total" ? `<div class="banner fallo">Cobertura total: no se le puede atacar directamente.</div>` : `
          <div class="paso-titulo">Tira <b>1d20 ${R.signo(desc.bonus)}${extra ? ` + ${esc(extra.dado)}` : ""}</b> · necesita <b class="objetivo-num">${caDe(obj) + ((COBERTURAS[ac.cobertura] || {}).ca || 0)}</b> o más
            <span class="sub">(CA de ${esc(obj.nombre)} ${caDe(obj)}${(COBERTURAS[ac.cobertura] || {}).ca ? ` + ${COBERTURAS[ac.cobertura].ca} por cobertura` : ""})</span></div>`}
          <div class="fila-tirada sin-borde">
            ${selectModo("a", "atk", ac.tiradas.atk.modo)}
            <div class="dados">${d20}</div>
            <div class="total ${res && res.natural === 20 ? "nat20" : res && res.natural === 1 ? "nat1" : ""}">${r ? r.total : "—"}</div>
          </div>
          ${razones}
          ${resultado}
        </div>
        ${danoHtml}
        <div class="barra-acciones">
          <button class="btn" data-accion="ac-cancelar">Cancelar</button>
          ${rozar}
          ${r && !r.golpe ? `<button class="btn btn-primary" data-accion="ac-fallo">Anotar fallo</button>` : ""}
          ${r && r.golpe ? `<button class="btn btn-primary" data-accion="ac-aplicar" ${listo ? "" : "disabled"}>Aplicar daño</button>` : ""}
        </div>
      </div>`;
  }

  function renderSalvacion(c, ac) {
    const actor = participante(c, ac.actorUid);
    const fuente = fuenteSalvacion(c, ac);
    const lista = candidatos(c, actor);
    let completas = ac.objetivos.length > 0;
    const gruposDano = fuente.dano
      ? [{ id: "dano", etiqueta: fuente.nombre, tipo: fuente.tipoDano, caras: R.carasDe(fuente.dano), fijo: R.parseDados(fuente.dano).fijo }]
      : null;
    // Daño previsto para un objetivo según supere o no (con sus resistencias/vulnerabilidades)
    const previa = (p, supera) => {
      if (!gruposDano) return "";
      if (!afectaA(p, fuente)) return " · no le afecta";
      const factor = supera ? (fuente.alSalvar === "mitad" ? 0.5 : 0) : 1;
      const res = calcularDano(gruposDano, ac.valores, false, defensasDe(p), false, factor);
      return res ? ` · recibe ${res.total}${res.tipos.some((t) => t.nota) ? ` (${res.tipos.map((t) => t.nota).filter(Boolean).join(", ")})` : ""}` : "";
    };

    const filas = ac.objetivos.map((uid) => {
      const p = participante(c, uid);
      const bonus = bonusSalvacion(p, fuente.salvacion);
      if (exitoAutomatico(p, fuente)) {
        return `<div class="fila-tirada ${p.tipo}"><div class="fila-tirada-nombre"><span class="nombre">${esc(p.nombre)}</span></div>
          <span class="sub">Éxito automático (no duerme)${previa(p, true)}</span><span></span><div class="total nat20">✔</div></div>`;
      }
      const autoFallo = falloAutomatico(p, fuente.salvacion);
      if (autoFallo) {
        return `<div class="fila-tirada ${p.tipo}"><div class="fila-tirada-nombre"><span class="nombre">${esc(p.nombre)}</span></div>
          <span class="sub">Fallo automático (${esc(autoFallo)})${previa(p, false)}</span><span></span><div class="total nat1">✖</div></div>`;
      }
      const { html, total } = tiradaD20("a", ac, uid, p, bonus, "salvacionExtraDado");
      if (total == null) completas = false;
      const supera = total != null && total >= fuente.cd;
      const sugerido = modoSalvacionSugerido(p, fuente) === "ventaja";
      return `<div class="fila-tirada ${p.tipo}">
        <div class="fila-tirada-nombre"><span class="nombre">${esc(p.nombre)}</span>
          <span class="sub">1d20 ${R.signo(bonus)} (${fuente.salvacion})${sugerido ? " · ventaja contra " + esc(condicionesDe(fuente).join(" y ")) : ""}</span></div>
        ${selectModo("a", uid, ac.tiradas[uid].modo)}
        <div class="dados">${html}</div>
        <div class="total ${total == null ? "" : supera ? "nat20" : "nat1"}">${total == null ? "—" : total}<span class="sub">${total == null ? "" : (supera ? " supera" : " falla") + previa(p, supera)}</span></div>
      </div>`;
    }).join("");

    let danoHtml = "";
    if (gruposDano) {
      const grupos = gruposDano;
      const suma = D.sumaGrupo(grupos[0].caras, ac.valores.dano || []);
      if (suma == null) completas = false;
      danoHtml = `<div class="paso">
        <div class="paso-titulo">Daño (una tirada para todos): ${tituloDano(grupos, false)} · ${fuente.alSalvar === "mitad" ? "mitad si supera" : "nada si supera"}</div>
        ${renderGruposDano(grupos, ac.valores, false, false)}
        ${suma != null ? `<div class="total-dano">= <b>${suma + grupos[0].fijo}</b> ${esc(fuente.tipoDano)}</div>` : ""}
      </div>`;
    }

    return `
      <div class="accion-en-curso">
        <div class="paso">
          <div class="paso-titulo">${esc(actor.nombre)} ${ac.conjuro ? "lanza" : "usa"} <b>${esc(fuente.nombre)}</b>: salvación de <b>${fuente.salvacion} CD <span class="objetivo-num">${fuente.cd}</span></b>${fuente.area ? ` <span class="sub">(${esc(fuente.area)})</span>` : ""}</div>
          ${fuente.condicion ? `<p class="sub">Si falla: queda ${esc(condicionesDe(fuente).join(" y "))}. ${esc(fuente.efectoAlFallar || "")}</p>` : fuente.efectoAlFallar ? `<p class="sub">Si falla: ${esc(fuente.efectoAlFallar)}</p>` : ""}
          <div class="chips objetivos-check">
            ${lista.map((q) => `<label class="check-inline"><input type="checkbox" data-accion="ac-objetivos" data-uid="${esc(q.uid)}" ${ac.objetivos.includes(q.uid) ? "checked" : ""}> ${esc(q.nombre)}</label>`).join("")}
          </div>
        </div>
        <div class="paso"><div class="lista">${filas || `<p class="muted">Marca al menos un objetivo.</p>`}</div></div>
        ${danoHtml}
        <div class="barra-acciones">
          <button class="btn" data-accion="ac-cancelar">Cancelar</button>
          <button class="btn btn-primary" data-accion="ac-aplicar" ${completas ? "" : "disabled"}>Aplicar resultado</button>
        </div>
      </div>`;
  }

  function renderDardos(c, ac) {
    const actor = participante(c, ac.actorUid);
    const h = hechizo(ac.conjuro);
    const caras = R.carasDe(h.dano);
    const fijo = R.parseDados(h.dano).fijo;
    const listo = ac.dardos.every((_, i) => D.sumaGrupo(caras, ac.valores["d" + i] || []) != null);
    return `
      <div class="accion-en-curso">
        <div class="paso-titulo">${esc(actor.nombre)} lanza <b>${esc(h.nombre)}</b>: ${ac.dardos.length} dardos que impactan siempre, <b>${esc(h.dano)}</b> ${esc(h.tipoDano)} cada uno</div>
        ${ac.dardos.map((uid, i) => `<div class="grupo-dados">
          <span class="grupo-etiqueta">Dardo ${i + 1}</span>
          <select data-accion="ac-dardo" data-i="${i}">${opcionesObjetivo(c, actor, uid)}</select>
          <div class="dados">${D.renderGrupo(caras, ac.valores["d" + i] || [], `ac|v|a|d${i}`)}<span class="fijo">${R.signo(fijo)}</span></div>
        </div>`).join("")}
        <div class="barra-acciones">
          <button class="btn" data-accion="ac-cancelar">Cancelar</button>
          <button class="btn btn-primary" data-accion="ac-aplicar" ${listo ? "" : "disabled"}>Aplicar daño</button>
        </div>
      </div>`;
  }

  // Curación: poción, hechizo (Curar heridas) o rasgo (Tomar aliento).
  function fuenteCuracion(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const d = datosDe(actor);
    if (ac.fuente.tipo === "item") {
      const item = (est.botin || []).find((it) => it.uid === ac.fuente.uid);
      const o = item && Objetos.objetoDe(item);
      if (!o) return null;
      return { nombre: o.nombre, tiempo: o.tiempo, caras: R.carasDe(o.curacion), fijo: R.parseDados(o.curacion).fijo, item, soloPropio: Boolean(o.soloPropio), usoDiario: Boolean(o.usoDiario) };
    }
    if (ac.fuente.tipo === "conjuro") {
      const h = hechizo(ac.fuente.id);
      const fijo = R.parseDados(h.curacion).fijo + (h.sumaModConjuro ? R.mod(d.atributos[d.atributoConjuro]) : 0);
      return { nombre: h.nombre, tiempo: h.tiempo, caras: R.carasDe(h.curacion), fijo, hechizo: h };
    }
    return { nombre: "Tomar aliento", tiempo: "acción adicional", caras: [10], fijo: d.nivel, recurso: "tomar_aliento", soloPropio: true };
  }

  function renderCuracion(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const f = fuenteCuracion(est, c, ac);
    if (!f) return "";
    const suma = D.sumaGrupo(f.caras, ac.valores.cura || []);
    const obj = participante(c, ac.objetivoUid);
    const objetivos = f.soloPropio ? [actor] : c.participantes.filter((q) => q.tipo === actor.tipo);
    return `
      <div class="accion-en-curso">
        <div class="paso">
          <div class="fila">
            <span class="paso-etiqueta">${esc(actor.nombre)} usa <b>${esc(f.nombre)}</b> (${esc(f.tiempo)}) en</span>
            <select data-accion="ac-objetivo">
              ${objetivos.map((q) => `<option value="${esc(q.uid)}" ${q.uid === ac.objetivoUid ? "selected" : ""}>${esc(q.nombre)}${q.uid === actor.uid ? " (sí mismo)" : ""} · ${q.pg}/${q.pgMax} PG</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="paso">
          <div class="paso-titulo">Tira <b>${f.caras.length}d${f.caras[0]} ${R.signo(f.fijo)}</b></div>
          <div class="dados">${D.renderGrupo(f.caras, ac.valores.cura || [], "ac|v|a|cura")}<span class="fijo">${R.signo(f.fijo)}</span></div>
          ${suma != null ? `<div class="total-dano">= <b>${suma + f.fijo}</b> PG → ${esc(obj.nombre)} ${Math.min(obj.pgMax, obj.pg + suma + f.fijo)}/${obj.pgMax} PG</div>` : ""}
        </div>
        <div class="barra-acciones">
          <button class="btn" data-accion="ac-cancelar">Cancelar</button>
          <button class="btn btn-primary" data-accion="ac-aplicar" ${suma != null ? "" : "disabled"}>Curar</button>
        </div>
      </div>`;
  }

  function renderBuff(c, ac) {
    const actor = participante(c, ac.actorUid);
    const h = hechizo(ac.conjuro);
    const max = h.objetivos || 1;
    const lista = /^personal/.test(h.alcance || "") ? [actor] : aliados(c, actor);
    return `
      <div class="accion-en-curso">
        <div class="paso-titulo">${esc(actor.nombre)} lanza <b>${esc(h.nombre)}</b> (${esc(h.tiempo)}${h.concentracion ? ", concentración" : ""})</div>
        <p class="sub">${esc(h.texto)}</p>
        ${actor.concentracion && h.concentracion ? `<p class="sub aviso-texto">Al lanzarlo pierde la concentración en ${esc(actor.concentracion.nombre)}.</p>` : ""}
        <div class="chips objetivos-check">
          <span class="sub">Objetivos (máx. ${max}):</span>
          ${lista.map((q) => {
            const marcado = ac.objetivos.includes(q.uid);
            const lleno = !marcado && ac.objetivos.length >= max;
            return `<label class="check-inline ${lleno ? "deshabilitado" : ""}"><input type="checkbox" data-accion="ac-objetivos" data-uid="${esc(q.uid)}" ${marcado ? "checked" : ""} ${lleno ? "disabled" : ""}> ${esc(q.nombre)}</label>`;
          }).join("")}
        </div>
        <div class="barra-acciones">
          <button class="btn" data-accion="ac-cancelar">Cancelar</button>
          <button class="btn btn-primary" data-accion="ac-aplicar" ${ac.objetivos.length ? "" : "disabled"}>Lanzar</button>
        </div>
      </div>`;
  }

  function renderUtilidad(c, ac) {
    const actor = participante(c, ac.actorUid);
    const h = hechizo(ac.conjuro);
    const todos = c.orden.map((u) => participante(c, u));
    return `
      <div class="accion-en-curso">
        <div class="paso-titulo">${esc(actor.nombre)} lanza <b>${esc(h.nombre)}</b> (${esc(h.tiempo)}, ${esc(h.alcance)})</div>
        <p class="sub">${esc(h.texto)}</p>
        <div class="fila"><span class="sub">Objetivo (opcional)</span>
          <select data-accion="ac-objetivo">
            <option value="">—</option>
            ${todos.map((q) => `<option value="${esc(q.uid)}" ${q.uid === ac.objetivoUid ? "selected" : ""}>${esc(q.nombre)} (${q.pg}/${q.pgMax} PG)</option>`).join("")}
          </select>
        </div>
        <div class="barra-acciones">
          <button class="btn" data-accion="ac-cancelar">Cancelar</button>
          <button class="btn btn-primary" data-accion="ac-aplicar">Lanzar</button>
        </div>
      </div>`;
  }

  function renderImposicion(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const d = datosDe(actor);
    const quedan = Recursos.restante(est, d, "imposicion_manos");
    const lista = c.participantes.filter((q) => q.tipo === "pj");
    const obj = participante(c, ac.objetivoUid);
    const coste = (ac.cantidad || 0) + (ac.veneno ? 5 : 0);
    const valido = coste > 0 && coste <= quedan;
    return `
      <div class="accion-en-curso">
        <div class="paso-titulo">${esc(actor.nombre)} usa <b>Imposición de manos</b> (acción adicional) · reserva ${quedan}</div>
        <div class="fila">
          <select data-accion="ac-objetivo">
            ${lista.map((q) => `<option value="${esc(q.uid)}" ${q.uid === ac.objetivoUid ? "selected" : ""}>${esc(q.nombre)}${q.uid === actor.uid ? " (sí mismo)" : ""} · ${q.pg}/${q.pgMax} PG</option>`).join("")}
          </select>
          <input type="number" min="0" max="${quedan}" value="${ac.cantidad || 0}" class="input-num" data-accion="ac-cantidad" aria-label="PG a curar">
          <span class="sub">PG</span>
        </div>
        <label class="check-inline"><input type="checkbox" data-accion="ac-veneno" ${ac.veneno ? "checked" : ""}> Eliminar Envenenado (gasta 5)</label>
        ${obj ? `<div class="total-dano">→ ${esc(obj.nombre)} ${Math.min(obj.pgMax, obj.pg + (ac.cantidad || 0))}/${obj.pgMax} PG · gasta ${coste} de ${quedan}</div>` : ""}
        <div class="barra-acciones">
          <button class="btn" data-accion="ac-cancelar">Cancelar</button>
          <button class="btn btn-primary" data-accion="ac-aplicar" ${valido ? "" : "disabled"}>Aplicar</button>
        </div>
      </div>`;
  }

  function renderEstabilizar(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const def = porId(OBJETOS, ac.objeto);
    const caidos = c.participantes.filter((q) => q.tipo === "pj" && q.pg === 0 && !q.muerto && !q.estable);
    return `
      <div class="accion-en-curso">
        <div class="paso-titulo">${esc(actor.nombre)} usa <b>${esc(def.nombre)}</b> (${esc(def.tiempo)}) · quedan ${Objetos.cantidadDe(est, datosDe(actor), def.id)} usos</div>
        ${caidos.length ? `<div class="fila"><span class="sub">Estabilizar a</span>
          <select data-accion="ac-objetivo">${caidos.map((q) => `<option value="${esc(q.uid)}" ${q.uid === ac.objetivoUid ? "selected" : ""}>${esc(q.nombre)} (0 PG)</option>`).join("")}</select></div>`
          : `<p class="muted">No hay nadie a 0 PG sin estabilizar.</p>`}
        <div class="barra-acciones">
          <button class="btn" data-accion="ac-cancelar">Cancelar</button>
          <button class="btn btn-primary" data-accion="ac-aplicar" ${caidos.length ? "" : "disabled"}>Estabilizar</button>
        </div>
      </div>`;
  }

  function aplicarEstabilizar(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const obj = participante(c, ac.objetivoUid);
    if (!obj) return;
    obj.estable = true;
    gastarCosto(c, ac);
    Objetos.gastarObjeto(est, datosDe(actor), ac.objeto);
    const txt = `${actor.nombre} estabiliza a ${obj.nombre} con el kit de sanador (quedan ${Objetos.cantidadDe(est, datosDe(actor), ac.objeto)} usos)`;
    log(c, txt);
    c.ultimo = { clase: "cura", html: esc(txt) };
    c.accion = null;
  }

  function renderManual(c) {
    const todos = c.orden.map((u) => participante(c, u));
    return `
      <details class="plegable manual" ${c.manualAbierto ? "open" : ""}>
        <summary><span class="sub">Ajuste manual: daño, curación y condiciones</span></summary>
        <div class="fila" style="margin-top:8px">
          <select data-ref="manual-objetivo">
            ${todos.map((q) => `<option value="${esc(q.uid)}">${esc(q.nombre)} (${q.pg}/${q.pgMax} PG)</option>`).join("")}
          </select>
          <input type="number" min="0" class="input-num" data-ref="manual-cantidad" placeholder="PG">
          <button class="btn btn-sm" data-accion="ac-manual-dano">Dañar</button>
          <button class="btn btn-sm" data-accion="ac-manual-cura">Curar</button>
          <button class="btn btn-sm" data-accion="ac-estabilizar" title="PJ a 0 PG: kit de sanador o Medicina CD 10">Estabilizar</button>
        </div>
        <div class="fila" style="margin-top:6px">
          <select data-ref="manual-condicion">
            ${CONDICIONES.map((x) => `<option>${x}</option>`).join("")}
          </select>
          <button class="btn btn-sm" data-accion="ac-manual-cond">Añadir condición</button>
        </div>
      </details>`;
  }

  // ---------- Crear acciones ----------
  function nuevaAccion(tipo, actor, extra) {
    return { tipo, actorUid: actor.uid, tiradas: {}, valores: {}, opciones: {}, ...extra };
  }

  function nuevoAtaque(c, actor, extra) {
    const primero = candidatos(c, actor)[0];
    const ac = nuevaAccion("ataque", actor, { objetivoUid: primero ? primero.uid : null, ...extra });
    ac.tiradas.atk = D.nuevaTirada();
    return ac;
  }

  function nuevoConjuro(est, c, actor, h) {
    const primero = candidatos(c, actor)[0];
    switch (h.resolucion) {
      case "ataque":
        return nuevoAtaque(c, actor, { conjuro: h.id });
      case "salvacion": {
        const ac = nuevaAccion("salvacion", actor, { conjuro: h.id, objetivos: [] });
        if (primero) alternarObjetivo(c, ac, primero.uid, true);
        return ac;
      }
      case "automatico":
        return nuevaAccion("dardos", actor, { conjuro: h.id, dardos: Array(h.dardos).fill(primero ? primero.uid : null) });
      case "curacion":
        return nuevaAccion("curacion", actor, { fuente: { tipo: "conjuro", id: h.id }, objetivoUid: actor.uid });
      case "buff":
        return nuevaAccion("buff", actor, { conjuro: h.id, objetivos: [actor.uid] });
      default:
        return nuevaAccion("utilidad", actor, { conjuro: h.id, objetivoUid: "" });
    }
  }

  // Ajusta el modo del ataque según condiciones y marcas (si el DM no lo cambió a mano).
  function aplicarSugerencia(est, c, ac) {
    if (!ac || ac.tipo !== "ataque") return;
    const actor = participante(c, ac.actorUid);
    const obj = participante(c, ac.objetivoUid);
    const desc = descriptor(est, c, ac);
    if (!desc) return;
    ac.sugerencia = sugerirModo(c, actor, obj, desc.cuerpo);
    if (ac.modoManual) return;
    const t = ac.tiradas.atk;
    t.modo = ac.sugerencia.modo;
    if (t.modo === "normal") { t.dados.length = Math.min(t.dados.length, 1); t.suerte.length = Math.min(t.suerte.length, 1); }
  }

  function alternarObjetivo(c, ac, uid, marcado) {
    if (marcado && !ac.objetivos.includes(uid)) {
      ac.objetivos.push(uid);
      if (ac.tipo === "salvacion") {
        ac.tiradas[uid] = D.nuevaTirada(modoSalvacionSugerido(participante(c, uid), fuenteSalvacion(c, ac)));
      }
    } else if (!marcado) {
      ac.objetivos = ac.objetivos.filter((u) => u !== uid);
      delete ac.tiradas[uid];
    }
  }

  // ---------- Casilleros ----------
  // Claves: ac|rec|<idx> · ac|t|<ámbito>|<tirada>|<i> · ac|v|<ámbito>|<grupo>|<i>
  function guardarDado(est, key, valor) {
    const c = est.combate;
    const partes = key.split("|");
    if (partes[1] === "rec") {
      const idx = Number(partes[2]);
      const p = participante(c, c.turnoUid);
      const a = datosDe(p).acciones[idx];
      c.recargaTiradas = c.recargaTiradas || {};
      c.recargaTiradas[idx] = valor;
      if (valor != null) {
        const ok = valor >= Number(String(a.recarga).split("-")[0]);
        if (ok) c.recargas[p.uid][idx] = true;
        log(c, `Recarga · ${p.nombre}, ${a.nombre}: d6 = ${valor} → ${ok ? "¡recargada!" : "no se recarga"}`);
      }
      return;
    }
    const obj = ambito(c, partes[2]);
    if (!obj) return;
    if (partes[1] === "t") {
      D.guardarEnTirada(obj.tiradas[partes[3]], partes[4], valor);
    } else if (partes[1] === "v") {
      const grupo = (obj.valores[partes[3]] = obj.valores[partes[3]] || []);
      grupo[Number(partes[4])] = valor;
    }
  }

  // ---------- Eventos ----------
  function manejar(est, accion, el) {
    const c = est.combate;
    const actor = participante(c, c.turnoUid);
    const ac = c.accion;
    const ds = el.dataset;

    switch (accion) {
      case "ac-atacar": {
        const atk = ataquesDe(est, actor).find((a) => a.key === ds.key);
        const costo = costoAtaque(c, actor, atk && atk.arma);
        if (!costo) break;
        c.accion = nuevoAtaque(c, actor, { ataqueKey: ds.key, costo, segundaArma: costo === "mella" || costo === "adicional" });
        aplicarSugerencia(est, c, c.accion);
        c.ultimo = null;
        break;
      }
      case "ac-conjuro": {
        const h = hechizo(ds.id);
        const costo = costoSimple(c, tipoTiempo(h.tiempo));
        if (!costo) break;
        c.accion = nuevoConjuro(est, c, actor, h);
        c.accion.costo = costo;
        aplicarSugerencia(est, c, c.accion);
        c.ultimo = null;
        break;
      }
      case "ac-op-atacante":
        c.oportunidad = { atacanteUid: el.value };
        break;
      case "ac-op-ataque":
        c.oportunidad = { ...(c.oportunidad || {}), ataqueKey: el.value };
        break;
      case "ac-oportunidad": {
        const { atacante, ataque } = eleccionOportunidad(est, c, actor);
        if (!atacante || !ataque || atacante.reaccionUsada) break;
        c.accion = nuevoAtaque(c, atacante, { ataqueKey: ataque.key, costo: "reaccion", oportunidad: true });
        c.accion.objetivoUid = actor.uid;
        c.oportunidad = null;      // el siguiente vuelve a proponer a alguien con reacción
        aplicarSugerencia(est, c, c.accion);
        c.ultimo = null;
        break;
      }
      case "ac-sacar-arma": {
        const d = datosDe(actor);
        const key = el.closest(".equipo-turno").querySelector('[data-ref="sacar-arma"]').value;
        const r = Objetos.equipar(est, d, key);
        if (!r.ok) {
          c.ultimo = { clase: "fallo", html: esc(r.error || "No se pudo sacar el arma.") };
          break;
        }
        const f = flags(c);
        f.cambiosArma = (f.cambiosArma || 0) + 1;
        const nombre = Objetos.armasEnMano(d, est).find((a) => a.key === key).arma.nombre;
        const txt = `${actor.nombre} saca ${nombre}${r.guardadas.length ? ` y guarda ${r.guardadas.join(", ")}` : ""}`;
        log(c, txt);
        c.ultimo = { clase: "", html: esc(txt) };
        break;
      }
      case "ac-guardar-arma": {
        const d = datosDe(actor);
        const a = Objetos.armasEnMano(d, est).find((x) => x.key === ds.key);
        Objetos.guardarArma(est, d, ds.key);
        flags(c).cambiosArma = (flags(c).cambiosArma || 0) + 1;
        if (a) log(c, `${actor.nombre} guarda ${a.arma.nombre}`);
        break;
      }
      case "ac-escudo": {
        const d = datosDe(actor);
        const eq = Objetos.equipoDe(est, d);
        const r = Objetos.ponerEscudo(est, d, !eq.escudo);
        if (!r.ok) {
          c.ultimo = { clase: "fallo", html: esc(r.error) };
          break;
        }
        const f = flags(c);
        f.accion = true;
        f.accionTipo = "otra";
        const txt = `${actor.nombre} ${eq.escudo ? "se pone" : "se quita"} el escudo (Acción) · CA ${caDe(actor)}`;
        log(c, txt);
        c.ultimo = { clase: "", html: esc(txt) };
        break;
      }
      case "ac-luz":
        c.luz = el.value;
        log(c, `Iluminación: ${LUCES[c.luz]}`);
        aplicarSugerencia(est, c, ac);
        break;
      case "ac-cobertura":
        ac.cobertura = el.value;
        break;
      case "ac-forzar":
        flags(c).forzarActuar = true;
        log(c, `${actor.nombre} actúa pese a su condición (decisión del DM)`);
        break;
      case "ac-fin-conc": {
        const p = participante(c, ds.uid);
        if (p && p.concentracion) terminarConcentracion(c, p, "la termina voluntariamente");
        break;
      }
      case "ac-econ": {
        const f = flags(c);
        if (ds.tipo === "accion") {
          f.accion = !f.accion;
          if (!f.accion) { f.accionTipo = null; f.ataques = 0; f.ataqueLigero = false; }
          else f.accionTipo = "otra";
        } else if (ds.tipo === "adicional") {
          f.adicional = !f.adicional;
        } else if (ds.tipo === "reaccion") {
          actor.reaccionUsada = !actor.reaccionUsada;
        }
        break;
      }
      case "ac-salvacion": {
        const primero = candidatos(c, actor)[0];
        const def = datosDe(actor).acciones[Number(ds.idx)];
        c.accion = nuevaAccion("salvacion", actor, { idx: Number(ds.idx), objetivos: [], costo: def && def.adicional ? "adicional" : "accion" });
        if (primero) alternarObjetivo(c, c.accion, primero.uid, true);
        c.ultimo = null;
        break;
      }
      case "ac-objeto": {
        const def = porId(OBJETOS, ds.id);
        c.ultimo = null;
        if (def.uso === "estabilizar") {
          const caido = c.participantes.find((q) => q.tipo === "pj" && q.pg === 0 && !q.muerto && !q.estable);
          c.accion = nuevaAccion("estabilizar", actor, { objeto: def.id, objetivoUid: caido ? caido.uid : null, costo: costoSimple(c, "accion") });
        } else {
          const primero = candidatos(c, actor)[0];
          const costo = def.tiempo === "sustituye un ataque" ? costoAtaque(c, actor, null, { soloAtaque: true }) : costoSimple(c, tipoTiempo(def.tiempo));
          c.accion = nuevaAccion("salvacion", actor, { objeto: def.id, objetivos: [], costo, sustituyeAtaque: def.tiempo === "sustituye un ataque" });
          if (primero) alternarObjetivo(c, c.accion, primero.uid, true);
        }
        break;
      }
      case "ac-pocion":
        c.accion = nuevaAccion("curacion", actor, { fuente: { tipo: "item", uid: ds.uid }, objetivoUid: actor.uid, costo: "adicional" });
        c.ultimo = null;
        break;
      case "ac-pocion-buff":
        c.accion = nuevaAccion("pocionBuff", actor, { itemUid: ds.uid, objetivoUid: actor.uid, costo: "adicional" });
        c.ultimo = null;
        break;
      case "ac-maravilloso":
        c.accion = nuevaAccion("curacion", actor, { fuente: { tipo: "item", uid: ds.uid }, objetivoUid: actor.uid, costo: "accion" });
        c.ultimo = null;
        break;
      case "ac-gorro": {
        const item = (est.botin || []).find((it) => it.uid === ds.uid);
        if (!item || !item.cargas || actor.invisibleGorro || !costoSimple(c, "accion")) break;
        item.cargas -= 1;
        const f = flags(c);
        f.accion = true;
        f.accionTipo = "otra";
        actor.invisibleGorro = true;
        const txt = `${actor.nombre} usa ${Objetos.objetoDe(item).nombre} (acción Magia, quedan ${item.cargas} cargas): ${anadirCondicion(actor, "Invisible")}`;
        log(c, txt);
        c.ultimo = { clase: "", html: `🎩 ${esc(txt)}. <span class="sub">Termina justo después de atacar, causar daño o lanzar un conjuro.</span>` };
        break;
      }
      case "ac-envenenar": {
        const item = (est.botin || []).find((it) => it.uid === ds.uid);
        if (!item || item.envenenado || item.venenoUsado || !costoSimple(c, "adicional")) break;
        item.envenenado = true;
        item.venenoUsado = true;
        flags(c).adicional = true;
        const o = Objetos.objetoDe(item);
        const txt = `${actor.nombre} envenena ${o.nombre} (acción adicional): el próximo golpe obliga a una salvación de CON CD ${o.veneno.cd}`;
        log(c, txt);
        c.ultimo = { clase: "", html: `☠ ${esc(txt)}` };
        break;
      }
      case "ac-astuta": {
        const a = ASTUTA[ds.tipo];
        if (!a || !costoSimple(c, "adicional")) break;
        flags(c).adicional = true;
        const d = datosDe(actor);
        log(c, `${actor.nombre} usa Acción astuta: ${a.nombre}`);
        c.ultimo = ds.tipo === "esconderse"
          ? { clase: "", html: `${a.icono} <b>${esc(actor.nombre)}</b> intenta esconderse: tira 1d20 ${R.signo((d.habilidades || {}).Sigilo ?? R.mod(d.atributos.DES))} (Sigilo) contra CD 15.
              <div class="fila" style="margin-top:6px"><button class="btn btn-sm btn-primary" data-accion="ac-escondida">Supera → queda Invisible</button>
              <span class="sub">Si falla, no pasa nada. Deja de estar Invisible al hacer ruido, atacar o lanzar un conjuro con componente verbal, o si la encuentran.</span></div>` }
          : { clase: "", html: `${a.icono} <b>${esc(actor.nombre)}</b> usa ${esc(a.nombre)} (acción adicional): ${esc(a.resumen)}.` };
        break;
      }
      case "ac-escondida":
        log(c, `↳ ${anadirCondicion(actor, "Invisible")} (escondida)`);
        c.ultimo = { clase: "", html: `🫥 <b>${esc(actor.nombre)}</b> queda Invisible: sus ataques tienen ventaja y los ataques contra ella, desventaja. Quítala cuando la descubran o ataque.` };
        break;
      case "ac-oleada": {
        const d = datosDe(actor);
        const f = flags(c);
        if (!f.accion || f.oleada || !Recursos.restante(est, d, "oleada_accion")) break;
        Recursos.gastar(est, d, "oleada_accion");
        f.oleada = true;
        f.accion = false;
        f.accionTipo = null;
        f.ataques = 0;
        const txt = `${actor.nombre} usa Oleada de acción: tiene otra acción este turno (no Magia)`;
        log(c, txt);
        c.ultimo = { clase: "", html: `⚡ ${esc(txt)}` };
        break;
      }
      case "ac-recurso":
        c.ultimo = null;
        if (ds.id === "tomar_aliento") {
          c.accion = nuevaAccion("curacion", actor, { fuente: { tipo: "recurso", id: ds.id }, objetivoUid: actor.uid, costo: "adicional" });
        } else if (ds.id === "imposicion_manos") {
          c.accion = nuevaAccion("imposicion", actor, { objetivoUid: actor.uid, cantidad: 0, costo: "adicional" });
        } else {
          const d = datosDe(actor);
          Recursos.gastar(est, d, ds.id);
          flags(c).adicional = true;
          const def = Recursos.definicion(d, ds.id);
          log(c, `${actor.nombre} usa ${def.nombre} (quedan ${Recursos.restante(est, d, ds.id)})`);
          c.ultimo = { clase: "", html: `${esc(actor.nombre)} usa <b>${esc(def.nombre)}</b>.` };
        }
        break;
      case "ac-cancelar":
        c.accion = null;
        break;
      case "ac-objetivo":
        ac.objetivoUid = el.value;
        aplicarSugerencia(est, c, ac);
        break;
      case "ac-modo": {
        const obj = ambito(c, ds.scope);
        const t = obj.tiradas[ds.tk];
        if (ds.scope === "a" && ds.tk === "atk") ac.modoManual = true;
        t.modo = el.value;
        if (el.value === "normal") t.dados.length = Math.min(t.dados.length, 1);
        break;
      }
      case "ac-objetivos":
        alternarObjetivo(c, ac, ds.uid, el.checked);
        break;
      case "ac-dardo":
        ac.dardos[Number(ds.i)] = el.value;
        break;
      case "ac-cantidad":
        ac.cantidad = Math.max(0, Number(el.value) || 0);
        break;
      case "ac-veneno":
        ac.veneno = el.checked;
        break;
      case "ac-opcion":
        ac.opciones[ds.opcion] = el.checked;
        if (ds.opcion === "dosManos" || ds.opcion === "salvaje") ac.valores = {};
        break;
      case "ac-encender": {
        const item = (est.botin || []).find((it) => it.uid === ds.uid);
        if (item) {
          item.encendida = el.checked;
          flags(c).adicional = true;
          log(c, `${actor.nombre} ${el.checked ? "enciende" : "apaga"} ${Objetos.objetoDe(item).nombre} (acción adicional)`);
        }
        break;
      }
      case "ac-aplicar":
        aplicar(est, c, ac);
        break;
      case "ac-fallo":
        anotarFallo(est, c, ac);
        break;
      case "ac-rozar":
        aplicarRozar(est, c, ac);
        break;
      case "ac-resolver":
        resolverPendiente(c, ds.id);
        break;
      case "ac-muerte":
        resolverSalvMuerte(c);
        break;
      case "ac-inspiracion": {
        const d = datosDe(actor);
        const tenia = Recursos.inspiracion(est, d);
        Recursos.ponerInspiracion(est, d.id, !tenia);
        const txt = tenia
          ? `${actor.nombre} usa Inspiración heroica: repite un dado (cambia su valor en el casillero)`
          : `${actor.nombre} recibe Inspiración heroica`;
        log(c, txt);
        c.ultimo = { clase: "", html: esc(txt) };
        break;
      }
      case "ac-estabilizar": {
        const p = participante(c, el.closest(".manual").querySelector('[data-ref="manual-objetivo"]').value);
        if (p && p.tipo === "pj" && p.pg === 0 && !p.muerto) {
          p.estable = true;
          log(c, `${p.nombre} queda estable (kit de sanador / Medicina CD 10)`);
        }
        break;
      }
      case "ac-manual-dano":
      case "ac-manual-cura":
      case "ac-manual-cond":
        manual(c, accion, el.closest(".manual"));
        break;
      case "ac-quitar-cond": {
        const p = participante(c, ds.uid);
        p.condiciones = (p.condiciones || []).filter((x) => x !== ds.cond);
        if (p.origenes) delete p.origenes[ds.cond];
        if (ds.cond === "Invisible") p.invisibleGorro = false;
        log(c, `${p.nombre} ya no está ${ds.cond}`);
        break;
      }
      case "ac-quitar-buff": {
        const p = participante(c, ds.uid);
        p.buffs = (p.buffs || []).filter((b) => b.id !== ds.id);
        if (p.tipo === "pj") Recursos.quitarBuffLargo(est, p.refId, ds.id);
        log(c, `${p.nombre} pierde ${(porId(BUFFS, ds.id) || {}).nombre || ds.id}`);
        break;
      }
    }
  }

  // ---------- Aplicar ----------
  function aplicar(est, c, ac) {
    if (ac.tipo === "ataque") aplicarAtaque(est, c, ac);
    else if (ac.tipo === "salvacion") aplicarSalvacion(est, c, ac);
    else if (ac.tipo === "dardos") aplicarDardos(est, c, ac);
    else if (ac.tipo === "curacion") aplicarCuracion(est, c, ac);
    else if (ac.tipo === "buff") aplicarBuff(est, c, ac);
    else if (ac.tipo === "utilidad") aplicarUtilidad(est, c, ac);
    else if (ac.tipo === "imposicion") aplicarImposicion(est, c, ac);
    else if (ac.tipo === "estabilizar") aplicarEstabilizar(est, c, ac);
    else if (ac.tipo === "pocionBuff") aplicarPocionBuff(est, c, ac);
  }

  function aplicarAtaque(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const obj = participante(c, ac.objetivoUid);
    const desc = descriptor(est, c, ac);
    const r = resultadoAtaque(c, ac, desc);
    const res = calcularDano(desc.grupos, ac.valores, r.critico, defensasAtaque(c, ac, desc, obj), ac.opciones.salvaje);
    if (!res) return;
    aplicarEscudo(est, c, ac);
    romperGorro(c, actor, "ataca");
    if (desc.hechizo) gastarConjuro(est, c, actor, desc.hechizo);
    gastarCosto(c, ac, { ataque: !desc.hechizo, ligera: desc.atk && desc.atk.pj && esLigera(desc.atk.arma), armaId: desc.atk && desc.atk.arma && desc.atk.arma.id });
    consumirMarcas(c, actor, obj);
    gastarMunicion(est, c, actor, desc);
    const aceite = aceiteYFuego(c, obj, res.tipos);
    res.total += aceite.extra;
    const nota = restarPG(c, obj, res.total, { critico: r.critico }) + (aceite.nota ? " · " + aceite.nota : "");
    const f = flags(c);
    if (ac.opciones.furtivo) f.furtivo = true;
    if (ac.opciones.salvaje) f.salvaje = true;

    const extras = [];
    if (ac.opciones.castigo) {
      flags(c).adicional = true;
      const h = hechizo("castigo_abrasador");
      gastarConjuro(est, c, actor, h);
      if (obj.pg > 0) {
        obj.efectos = (obj.efectos || []).filter((e) => e.tipo !== "ardiendo");
        obj.efectos.push({ tipo: "ardiendo", nombre: h.nombre, cd: R.cdConjuro(datosDe(actor)), fuenteUid: actor.uid });
        extras.push(`${obj.nombre} arde: al inicio de sus turnos 1d6 de fuego y salvación de CON CD ${R.cdConjuro(datosDe(actor))}.`);
      }
    }
    // Kukri envenenado: el golpe gasta el veneno y el objetivo hace la salvación (pendiente)
    const itemArma = desc.atk && desc.atk.item;
    if (itemArma && itemArma.envenenado && (Objetos.objetoDe(itemArma) || {}).veneno) {
      const v = Objetos.objetoDe(itemArma).veneno;
      itemArma.envenenado = false;
      if (obj.pg > 0) {
        nuevaPendiente(c, { tipo: "veneno", uid: obj.uid, cd: v.cd, nombre: Objetos.objetoDe(itemArma).nombre, dano: v.dano, tipoDano: v.tipoDano, condicion: v.condicion });
        extras.push(`Veneno: ${obj.nombre} hace salvación de CON CD ${v.cd} (arriba, en pendientes).`);
      }
    }
    if (ac.opciones.castigoDivino) {
      flags(c).adicional = true;
      const d = datosDe(actor);
      if (castigoGratis(est, d)) {
        Recursos.gastar(est, d, "castigo_paladin");
        extras.push("Castigo divino con Castigo del paladín (sin gastar espacio; vuelve tras un descanso largo).");
      } else {
        gastarConjuro(est, c, actor, hechizo("castigo_divino"));
        extras.push("Castigo divino: gasta 1 espacio de nivel 1.");
      }
    }
    if (obj.pg > 0) {
      // Marcas automáticas para el siguiente ataque
      if (desc.maestria === "Fastidiar" && res.total > 0) {
        marcar(c, { tipo: "ventajaContra", objetivo: obj.uid, atacante: actor.uid, fuente: actor.uid, expira: "finSiguiente", nombre: `Fastidiar (${actor.nombre})` });
      }
      if (desc.maestria === "Socavar") {
        marcar(c, { tipo: "desventajaAtaque", quien: obj.uid, fuente: actor.uid, expira: "inicio", nombre: `Socavar (${actor.nombre})` });
      }
      if (desc.hechizo && desc.hechizo.id === "saeta_guia") {
        marcar(c, { tipo: "ventajaContra", objetivo: obj.uid, atacante: null, fuente: actor.uid, expira: "finSiguiente", nombre: "Saeta guía" });
      }
      if (desc.maestria && MAESTRIAS[desc.maestria]) extras.push(MAESTRIAS[desc.maestria](obj.nombre));
      if (desc.hechizo && desc.hechizo.efectoAlGolpear) extras.push(desc.hechizo.efectoAlGolpear);
      if (desc.accion && desc.accion.efectoAlGolpear) extras.push(desc.accion.efectoAlGolpear);
      if (desc.accion && desc.accion.aplicaCondicionAlGolpear) {
        desc.accion.aplicaCondicionAlGolpear.forEach((cond) => extras.push(anadirCondicion(obj, cond, null, actor.uid)));
      }
    }

    log(c, `${actor.nombre} → ${obj.nombre} con ${desc.nombre}: ${r.total} vs CA ${r.ca} ✔${r.critico ? " CRÍTICO" : ""} · ${textoDano(res)} = ${res.total} · ${obj.nombre} ${obj.pg}/${obj.pgMax} PG${nota}`);
    extras.forEach((x) => log(c, "↳ " + x));
    c.ultimo = {
      clase: r.critico ? "critico" : "golpe",
      html: `<b>${esc(obj.nombre)}</b> recibe <b>${res.total}</b> de daño (${esc(textoDano(res))}) → ${obj.pg}/${obj.pgMax} PG${esc(nota)}
        ${extras.map((x) => `<div class="sub">↳ ${esc(x)}</div>`).join("")}`
    };
    c.accion = null;
  }

  function gastarMunicion(est, c, actor, desc) {
    if (!desc.atk || !desc.atk.pj || !desc.atk.arma.municion) return;
    const d = datosDe(actor);
    const mun = Objetos.municionDe(est, d, desc.atk.arma);
    if (mun && mun.cantidad > 0) mun.cantidad--;
    c.municionGastada = c.municionGastada || {};
    const k = `${d.id}|${desc.atk.arma.municion}`;
    c.municionGastada[k] = (c.municionGastada[k] || 0) + 1;
  }

  function anotarFallo(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const obj = participante(c, ac.objetivoUid);
    const desc = descriptor(est, c, ac);
    const r = resultadoAtaque(c, ac, desc);
    aplicarEscudo(est, c, ac);
    romperGorro(c, actor, "ataca");
    if (desc.hechizo) gastarConjuro(est, c, actor, desc.hechizo);
    gastarCosto(c, ac, { ataque: !desc.hechizo, ligera: desc.atk && desc.atk.pj && esLigera(desc.atk.arma), armaId: desc.atk && desc.atk.arma && desc.atk.arma.id });
    consumirMarcas(c, actor, obj);
    gastarMunicion(est, c, actor, desc);
    log(c, `${actor.nombre} → ${obj.nombre} con ${desc.nombre}: ${r.total} vs CA ${r.ca} ✖${r.pifia ? " (1 natural)" : ""}`);
    c.ultimo = { clase: "fallo", html: `${esc(actor.nombre)} falla contra ${esc(obj.nombre)} (${r.total} vs CA ${r.ca}).` };
    c.accion = null;
  }

  function aplicarRozar(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const obj = participante(c, ac.objetivoUid);
    const desc = descriptor(est, c, ac);
    const r = resultadoAtaque(c, ac, desc);
    aplicarEscudo(est, c, ac);
    romperGorro(c, actor, "ataca");
    const { final, nota } = R.aplicarDefensas(desc.modAtributo, desc.atk.arma.tipoDano, defensasAtaque(c, ac, desc, obj));
    gastarCosto(c, ac, { ataque: true, ligera: esLigera(desc.atk.arma), armaId: desc.atk.arma.id });
    consumirMarcas(c, actor, obj);
    const extra = restarPG(c, obj, final);
    log(c, `${actor.nombre} → ${obj.nombre} con ${desc.nombre}: ${r.total} vs CA ${r.ca} ✖ · Rozar: ${final} ${desc.atk.arma.tipoDano}${nota ? " (" + nota + ")" : ""} · ${obj.nombre} ${obj.pg}/${obj.pgMax} PG${extra}`);
    c.ultimo = { clase: "fallo", html: `Falla, pero <b>Rozar</b> hace ${final} de daño a ${esc(obj.nombre)} → ${obj.pg}/${obj.pgMax} PG${esc(extra)}` };
    c.accion = null;
  }

  function aplicarSalvacion(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const fuente = fuenteSalvacion(c, ac);
    const h = fuente.hechizo;
    const grupos = fuente.dano
      ? [{ id: "dano", etiqueta: fuente.nombre, tipo: fuente.tipoDano, caras: R.carasDe(fuente.dano), fijo: R.parseDados(fuente.dano).fijo }]
      : null;
    if (grupos && D.sumaGrupo(grupos[0].caras, ac.valores.dano || []) == null) return;
    gastarCosto(c, ac, { ataque: Boolean(ac.sustituyeAtaque) });
    if (grupos) romperGorro(c, actor, "causa daño");
    if (h) {
      if (h.concentracion) iniciarConcentracion(c, actor, h);
      gastarConjuro(est, c, actor, h);
    } else if (fuente.objeto) {
      if (!fuente.objeto.reutilizable) Objetos.gastarObjeto(est, datosDe(actor), fuente.objeto.id);
    } else {
      gastarAccion(c, actor, ac.idx);
    }

    const lineas = [];
    ac.objetivos.forEach((uid) => {
      const p = participante(c, uid);
      let supera;
      let txt;
      if (exitoAutomatico(p, fuente)) {
        supera = true;
        txt = `${p.nombre}: éxito automático`;
      } else if (falloAutomatico(p, fuente.salvacion)) {
        supera = false;
        txt = `${p.nombre}: fallo automático (${falloAutomatico(p, fuente.salvacion)})`;
      } else {
        const { total } = tiradaD20("a", ac, uid, p, bonusSalvacion(p, fuente.salvacion), "salvacionExtraDado");
        supera = total >= fuente.cd;
        txt = `${p.nombre}: ${total} vs CD ${fuente.cd} → ${supera ? "supera" : "falla"}`;
      }
      if (grupos && !afectaA(p, fuente)) {
        txt += " · no le afecta";
      } else if (grupos) {
        const factor = supera ? (fuente.alSalvar === "mitad" ? 0.5 : 0) : 1;
        const res = calcularDano(grupos, ac.valores, false, defensasDe(p), false, factor);
        const ac2 = aceiteYFuego(c, p, res.tipos);
        const total = res.total + ac2.extra;
        if (total > 0 || factor > 0) txt += ` · ${textoDano(res)}${ac2.nota ? " · " + ac2.nota : ""} → ${p.pg - Math.min(p.pg, total)}/${p.pgMax} PG${restarPG(c, p, total)}`;
      }
      if (!supera && fuente.aceite) {
        p.efectos = (p.efectos || []).filter((e) => e.tipo !== "aceite");
        p.efectos.push({ tipo: "aceite", nombre: "Aceite" });
        txt += " · queda cubierto de aceite";
      }
      if (!supera) condicionesDe(fuente).forEach((cond) => { txt += ` · ${anadirCondicion(p, cond, h && h.concentracion ? actor : null)}`; });
      if (!supera && !fuente.condicion && fuente.efectoAlFallar && !fuente.aceite) txt += ` · ${fuente.efectoAlFallar}`;
      lineas.push(txt);
    });
    log(c, `${actor.nombre} ${h ? "lanza" : "usa"} ${fuente.nombre} (${fuente.salvacion} CD ${fuente.cd})${fuente.objeto && !fuente.objeto.reutilizable ? ` · quedan ${Objetos.cantidadDe(est, datosDe(actor), fuente.objeto.id)}` : ""}`);
    lineas.forEach((l) => log(c, "↳ " + l));
    c.ultimo = { clase: "", html: `<b>${esc(fuente.nombre)}</b>${lineas.map((l) => `<div>${esc(l)}</div>`).join("")}` };
    c.accion = null;
  }

  function aplicarDardos(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const h = hechizo(ac.conjuro);
    const caras = R.carasDe(h.dano);
    const fijo = R.parseDados(h.dano).fijo;
    gastarConjuro(est, c, actor, h);
    gastarCosto(c, ac);
    const porObjetivo = {};
    ac.dardos.forEach((uid, i) => {
      porObjetivo[uid] = (porObjetivo[uid] || 0) + D.sumaGrupo(caras, ac.valores["d" + i]) + fijo;
    });
    const lineas = Object.entries(porObjetivo).map(([uid, bruto]) => {
      const p = participante(c, uid);
      const { final, nota } = R.aplicarDefensas(bruto, h.tipoDano, defensasDe(p));
      const extra = restarPG(c, p, final);
      return `${p.nombre}: ${final} ${h.tipoDano}${nota ? ` (${bruto}, ${nota})` : ""} → ${p.pg}/${p.pgMax} PG${extra}`;
    });
    log(c, `${actor.nombre} lanza ${h.nombre}`);
    lineas.forEach((l) => log(c, "↳ " + l));
    c.ultimo = { clase: "golpe", html: `<b>${esc(h.nombre)}</b>${lineas.map((l) => `<div>${esc(l)}</div>`).join("")}` };
    c.accion = null;
  }

  function aplicarCuracion(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const obj = participante(c, ac.objetivoUid);
    const f = fuenteCuracion(est, c, ac);
    const suma = D.sumaGrupo(f.caras, ac.valores.cura || []);
    if (suma == null) return;
    const total = suma + f.fijo;
    gastarCosto(c, ac);
    if (f.item && f.usoDiario) f.item.usadoHoy = true;
    else if (f.item) f.item.usado = true;
    if (f.hechizo) gastarConjuro(est, c, actor, f.hechizo);
    if (f.recurso) Recursos.gastar(est, datosDe(actor), f.recurso);
    const nota = curar(obj, total);
    log(c, `${actor.nombre} usa ${f.nombre} en ${obj.nombre}: +${total} PG → ${obj.pg}/${obj.pgMax}${nota}`);
    c.ultimo = { clase: "cura", html: `<b>${esc(obj.nombre)}</b> recupera <b>${total}</b> PG → ${obj.pg}/${obj.pgMax}${esc(nota)}` };
    c.accion = null;
  }

  function aplicarBuff(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const h = hechizo(ac.conjuro);
    if (h.concentracion) iniciarConcentracion(c, actor, h);
    gastarConjuro(est, c, actor, h);
    gastarCosto(c, ac);
    const nombres = ac.objetivos.map((uid) => {
      const p = participante(c, uid);
      anadirBuff(c, p, h.aplicaBuff, actor, h);
      return p.nombre;
    });
    const txt = `${actor.nombre} lanza ${h.nombre} sobre ${nombres.join(", ")}${h.concentracion ? " (concentración)" : ""}`;
    log(c, txt);
    c.ultimo = { clase: "cura", html: esc(txt) };
    c.accion = null;
  }

  function aplicarUtilidad(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const h = hechizo(ac.conjuro);
    const obj = ac.objetivoUid && participante(c, ac.objetivoUid);
    gastarConjuro(est, c, actor, h);
    gastarCosto(c, ac);
    let txt = `${actor.nombre} lanza ${h.nombre}${obj ? " sobre " + obj.nombre : ""}`;
    if (h.id === "estabilizar" && obj && obj.tipo === "pj" && obj.pg === 0) {
      obj.estable = true;
      txt += ` · ${obj.nombre} queda estable`;
    }
    log(c, txt);
    c.ultimo = { clase: "", html: esc(txt) };
    c.accion = null;
  }

  function aplicarImposicion(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const d = datosDe(actor);
    const obj = participante(c, ac.objetivoUid);
    const coste = (ac.cantidad || 0) + (ac.veneno ? 5 : 0);
    if (coste <= 0 || coste > Recursos.restante(est, d, "imposicion_manos")) return;
    Recursos.gastar(est, d, "imposicion_manos", coste);
    gastarCosto(c, ac);
    let txt = `${actor.nombre} usa Imposición de manos en ${obj.nombre}`;
    if (ac.cantidad) {
      const nota = curar(obj, ac.cantidad);
      txt += `: +${ac.cantidad} PG → ${obj.pg}/${obj.pgMax}${nota}`;
    }
    if (ac.veneno) {
      obj.condiciones = (obj.condiciones || []).filter((x) => x !== "Envenenado");
      txt += " · elimina Envenenado";
    }
    txt += ` (reserva ${Recursos.restante(est, d, "imposicion_manos")})`;
    log(c, txt);
    c.ultimo = { clase: "cura", html: esc(txt) };
    c.accion = null;
  }

  function resolverPendiente(c, id) {
    const pe = (c.pendientes || []).find((x) => x.id === id);
    if (!pe) return;
    const p = participante(c, pe.uid);
    const { total } = tiradaD20(pe.id, pe, "salv", p, bonusSalvacion(p, "CON"), "salvacionExtraDado");
    if (total == null) return;
    const supera = total >= pe.cd;
    c.pendientes = c.pendientes.filter((x) => x !== pe);

    if (pe.tipo === "concentracion") {
      if (supera) log(c, `${p.nombre} mantiene la concentración en ${pe.nombre} (${total} vs CD ${pe.cd})`);
      else terminarConcentracion(c, p, `falla la salvación: ${total} vs CD ${pe.cd}`);
      c.ultimo = { clase: supera ? "golpe" : "fallo", html: `${esc(p.nombre)} ${supera ? "mantiene" : "pierde"} la concentración en <b>${esc(pe.nombre)}</b> (${total} vs CD ${pe.cd}).` };
      return;
    }
    if (pe.tipo === "veneno") {
      let txt = `${pe.nombre} · ${p.nombre}: CON ${total} vs CD ${pe.cd} → ${supera ? "resiste el veneno" : "falla"}`;
      if (!supera) {
        const bruto = D.sumaGrupo(R.carasDe(pe.dano), pe.valores.veneno || []) || 0;
        const { final, nota } = R.aplicarDefensas(bruto, pe.tipoDano, defensasDe(p));
        txt += ` · ${final} de ${pe.tipoDano}${nota ? ` (${bruto}, ${nota})` : ""}${restarPG(c, p, final)} → ${p.pg}/${p.pgMax} PG`;
        if (p.pg > 0) txt += ` · ${anadirCondicion(p, pe.condicion)}`;
      }
      log(c, txt);
      c.ultimo = { clase: supera ? "fallo" : "golpe", html: esc(txt) };
      return;
    }
    // Castigo abrasador
    const bruto = D.sumaGrupo([6], pe.valores.fuego || []);
    const { final: base, nota } = R.aplicarDefensas(bruto, "fuego", defensasDe(p));
    const aceite = aceiteYFuego(c, p, [{ tipo: "fuego", final: base }]);
    const final = base + aceite.extra;
    const extra = restarPG(c, p, final) + (aceite.nota ? " · " + aceite.nota : "");
    if (supera || p.pg === 0) p.efectos = (p.efectos || []).filter((e) => e.tipo !== "ardiendo");
    const txt = `${pe.nombre} · ${p.nombre} recibe ${final} de fuego${nota ? ` (${bruto}, ${nota})` : ""} → ${p.pg}/${p.pgMax} PG${extra} · CON ${total} vs CD ${pe.cd}: ${supera ? "se apaga" : "sigue ardiendo"}`;
    log(c, txt);
    c.ultimo = { clase: "golpe", html: esc(txt) };
  }

  function manual(c, accion, cont) {
    const p = participante(c, cont.querySelector('[data-ref="manual-objetivo"]').value);
    if (!p) return;
    if (accion === "ac-manual-cond") {
      log(c, anadirCondicion(p, cont.querySelector('[data-ref="manual-condicion"]').value));
      return;
    }
    const n = Math.max(0, Number(cont.querySelector('[data-ref="manual-cantidad"]').value) || 0);
    if (!n) return;
    if (accion === "ac-manual-dano") {
      const nota = restarPG(c, p, n);
      log(c, `Ajuste · ${p.nombre} recibe ${n} de daño → ${p.pg}/${p.pgMax} PG${nota}`);
    } else {
      const nota = curar(p, n);
      log(c, `Ajuste · ${p.nombre} recupera ${n} PG → ${p.pg}/${p.pgMax} PG${nota}`);
    }
  }

  return { renderTurno, alIniciarTurno, alTerminarTurno, guardarDado, manejar, caDe, velocidadDe, chipsEstado, CONDICIONES };
})();
