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
  const fuera = (p) => (p.tipo === "enemigo" && p.pg <= 0) || Boolean(p.muerto);
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

  function defensasDe(p) {
    const d = datosDe(p);
    return { resistencias: d.resistencias || [], inmunidades: d.inmunidades || [], vulnerabilidades: d.vulnerabilidades || [] };
  }

  function log(c, texto) {
    c.log.push({ ronda: c.ronda, texto });
  }

  function flags(c) {
    return c.turnoFlags || (c.turnoFlags = {});
  }

  // Candidatos a objetivo: primero los del bando contrario.
  function candidatos(c, actor) {
    const vivos = c.orden.map((u) => participante(c, u)).filter((q) => q && !fuera(q) && q.uid !== actor.uid);
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
    if (obj) {
      ["Cegado", "Apresado", "Paralizado", "Aturdido", "Inconsciente", "Petrificado"].forEach((x) => { if (tiene(obj, x)) v.push(`objetivo ${x}`); });
      if (tiene(obj, "Derribado")) (cuerpo ? v : d).push(`objetivo Derribado${cuerpo ? "" : " (a distancia)"}`);
      if (tiene(obj, "Invisible")) d.push("objetivo Invisible");
      marcasAplicables(c, actor, obj).forEach((m) => (m.tipo === "ventajaContra" ? v : d).push(m.nombre));
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
      nota = p.pg === 0 && antes > 0 ? " · ¡derrotado!" : "";
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

  function anadirCondicion(p, cond, fuente) {
    const d = datosDe(p);
    if ((d.inmuneCondiciones || []).includes(cond)) return `${p.nombre} es inmune a ${cond}`;
    p.condiciones = p.condiciones || [];
    if (!p.condiciones.includes(cond)) p.condiciones.push(cond);
    if (fuente && fuente.concentracion) fuente.concentracion.condiciones.push({ uid: p.uid, cond });
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
    if (p.concentracion) chips.push(`<span class="chip chip-conc" title="Concentración">◎ ${esc(p.concentracion.nombre)}</span>`);
    (p.buffs || []).forEach((b) => {
      const def = porId(BUFFS, b.id);
      chips.push(`<span class="chip chip-buff">${esc(def ? def.nombre : b.id)}
        <button class="chip-x" data-accion="ac-quitar-buff" data-uid="${esc(p.uid)}" data-id="${esc(b.id)}" aria-label="Quitar">×</button></span>`);
    });
    (p.efectos || []).forEach((e) => chips.push(`<span class="chip chip-cond">${e.tipo === "aceite" ? "🛢" : "🔥"} ${esc(e.nombre)}</span>`));
    (p.condiciones || []).forEach((cond) => chips.push(`<span class="chip chip-cond">${esc(cond)}
      <button class="chip-x" data-accion="ac-quitar-cond" data-uid="${esc(p.uid)}" data-cond="${esc(cond)}" aria-label="Quitar ${esc(cond)}">×</button></span>`));
    if (p.estable) chips.push(`<span class="chip">Estable</span>`);
    if (c) chips.push(chipsMarcas(c, p));
    return chips.join("");
  }

  // ---------- Hechizos ----------
  function hechizosDe(est, pj) {
    return [...(pj.trucos || []), ...((est.preparados || {})[pj.id] || [])].map(hechizo).filter(Boolean);
  }

  // Motivo por el que no se puede lanzar (o null).
  function bloqueoConjuro(est, c, pj, h) {
    if (h.nivel === 0) return null;
    if (Recursos.espaciosLibres(est, pj, h.nivel) === 0) return "sin espacios";
    if (flags(c).espacio) return "ya lanzó un hechizo con espacio este turno";
    return null;
  }

  function gastarConjuro(est, c, p, h) {
    if (h.nivel >= 1) {
      Recursos.gastarEspacio(est, datosDe(p), h.nivel);
      flags(c).espacio = true;
    }
  }

  function resumenConjuro(pj, h) {
    const cd = R.cdConjuro(pj);
    switch (h.resolucion) {
      case "ataque": return `ataque ${R.signo(R.ataqueConjuro(pj))} · ${h.dano} ${h.tipoDano}`;
      case "salvacion": return `${h.salvacion} CD ${cd}${h.dano ? ` · ${h.dano} ${h.tipoDano}` : h.aplicaCondicion ? ` · ${h.aplicaCondicion}` : ""}`;
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
      return Objetos.armasDe(d, est).map(({ key, arma, item }) => {
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

  function puedeCastigar(est, c, p, arma) {
    if (p.tipo !== "pj" || arma.tipo !== "cuerpo a cuerpo") return false;
    const h = hechizo("castigo_abrasador");
    return ((est.preparados || {})[p.refId] || []).includes("castigo_abrasador") && h;
  }

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
      const r = R.ataqueArma(d, atk.arma, { dosManos: ac.opciones.dosManos });
      const grupos = [{ id: "arma", etiqueta: atk.arma.nombre, tipo: atk.arma.tipoDano, caras: R.carasDe(r.dano), fijo: r.danoMod, principal: true }];
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
      return { atk, nombre: atk.nombre, bonus: r.bonus, grupos, maestria: atk.maestria, modAtributo: r.modAtributo, competente: r.competente, cuerpo: atk.arma.tipo === "cuerpo a cuerpo" };
    }

    const a = atk.accion;
    const base = R.parseDados(a.dano);
    const grupos = [{ id: "arma", etiqueta: a.nombre, tipo: a.tipoDano, caras: R.carasDe(a.dano), fijo: base.fijo, principal: true }];
    (a.danoExtra || []).forEach((x, i) => grupos.push({ id: "extra" + i, etiqueta: "extra", tipo: x.tipo, caras: R.carasDe(x.dado), fijo: 0 }));
    if (a.extraConVentaja && ac.tiradas.atk.modo === "ventaja") {
      grupos.push({ id: "ventaja", etiqueta: "por ventaja", tipo: a.extraConVentaja.tipo, caras: R.carasDe(a.extraConVentaja.dado), fijo: 0 });
    }
    return { atk, nombre: a.nombre, bonus: a.bonusAtaque, grupos, accion: a, competente: true, cuerpo: a.tipo !== "distancia" };
  }

  function resultadoAtaque(c, ac, desc) {
    const actor = participante(c, ac.actorUid);
    const obj = participante(c, ac.objetivoUid);
    if (!obj) return null;
    const { res, total } = tiradaD20("a", ac, "atk", actor, desc.bonus, "ataqueExtraDado");
    if (total == null) return null;
    const ca = caDe(obj);
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
    return true;
  }

  function gastarAccion(c, p, idx) {
    const a = datosDe(p).acciones[idx];
    if (a.recarga) { c.recargas = c.recargas || {}; (c.recargas[p.uid] = c.recargas[p.uid] || {})[idx] = false; }
    if (a.usosPorDia) { c.usos = c.usos || {}; const u = (c.usos[p.uid] = c.usos[p.uid] || {}); u[idx] = (u[idx] || 0) + 1; }
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
      return {
        nombre: h.nombre, cd: R.cdConjuro(datosDe(actor)), salvacion: h.salvacion, condicion: h.aplicaCondicion,
        efectoAlFallar: h.efectoAlFallar, dano: h.dano, tipoDano: h.tipoDano, alSalvar: h.alSalvar,
        exitoAutomatico: h.exitoAutomatico, hechizo: h, area: h.area
      };
    }
    const a = datosDe(actor).acciones[ac.idx];
    return {
      nombre: a.nombre, cd: a.cd, salvacion: a.salvacion, condicion: a.aplicaCondicion,
      efectoAlFallar: a.efectoAlFallar, dano: a.dano, tipoDano: a.tipoDano, alSalvar: a.alSalvar
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

  function modoSalvacionSugerido(p, fuente) {
    const d = datosDe(p);
    const ventaja = fuente.condicion && (d.ventajaSalvacionContra || []).includes(fuente.condicion);
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
    const p = participante(c, c.turnoUid);
    if (!p) return;
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
    const caido = p.tipo === "pj" && p.pg === 0;
    if (p.tipo === "pj" && !caido) partes.push(renderRecursos(est, p));
    if (p.tipo === "enemigo") partes.push(renderRecargas(c, p));

    if (caido) {
      partes.push(renderSalvMuerte(c, p));
    } else {
      const incap = INCAPACITANTES.find((x) => tiene(p, x));
      if (incap) partes.push(`<div class="aviso">${esc(p.nombre)} está <b>${esc(incap)}</b>: no puede realizar acciones ni reacciones.</div>`);
      if (c.accion) partes.push(renderAccion(est, c, c.accion));
      else partes.push(renderMenu(est, c, p));
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
      chips.push(`<span class="chip" title="Espacios de conjuro de nivel 1">Espacios nv1 <b class="espacios">${"●".repeat(libres)}${"○".repeat(tot - libres)}</b></span>`);
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

  function boton(accion, attrs, icono, nombre, detalle, deshabilitado) {
    return `<button class="btn btn-accion" data-accion="${accion}" ${attrs} ${deshabilitado ? "disabled" : ""}>
      <span class="accion-nombre">${icono} ${esc(nombre)}</span><span class="sub">${esc(detalle)}</span></button>`;
  }

  function renderMenu(est, c, p) {
    const d = datosDe(p);
    const armas = [];
    const conjuros = [];
    const otras = [];

    ataquesDe(est, p).forEach((a) => {
      let detalle;
      let sinMunicion = false;
      if (a.pj) {
        const r = R.ataqueArma(d, a.arma);
        const mun = Objetos.municionDe(est, d, a.arma);
        sinMunicion = Boolean(mun) && mun.cantidad === 0;
        detalle = `${R.signo(r.bonus)} · ${r.textoDano}${a.item && a.item.encendida ? " +2d6 fuego" : ""}${mun ? ` · ${mun.cantidad} ${mun.nombre.toLowerCase()}` : ""}`;
      } else {
        const extra = (a.accion.danoExtra || []).map((x) => ` + ${x.dado}`).join("");
        detalle = `${R.signo(a.accion.bonusAtaque)} · ${a.accion.dano}${extra}`;
      }
      armas.push(boton("ac-atacar", `data-key="${esc(a.key)}"`, "⚔", a.nombre, detalle, sinMunicion));
    });

    if (p.tipo === "enemigo") {
      d.acciones.forEach((a, i) => {
        if (a.cd == null) return;
        const ok = disponible(c, p, i);
        const etiqueta = a.recarga ? ` · recarga ${a.recarga}` : a.usosPorDia ? ` · ${a.usosPorDia}/día` : "";
        otras.push(boton("ac-salvacion", `data-idx="${i}"`, "✦", a.nombre, `${a.salvacion} CD ${a.cd}${etiqueta}${ok ? "" : " · no disponible"}`, !ok));
      });
    } else {
      hechizosDe(est, d).forEach((h) => {
        if (h.resolucion === "castigo") return;   // se usa desde el ataque con arma
        const bloqueo = bloqueoConjuro(est, c, d, h);
        conjuros.push(boton("ac-conjuro", `data-id="${esc(h.id)}"`, h.nivel ? "✨" : "✧",
          h.nombre, `${h.nivel ? "nv1" : "truco"} · ${resumenConjuro(d, h)}${bloqueo ? " · " + bloqueo : ""}`, Boolean(bloqueo)));
      });
      (d.recursos || []).forEach((r) => {
        const quedan = Recursos.restante(est, d, r.id);
        const info = r.id === "tomar_aliento" ? `acción adicional · 1d10 + ${d.nivel}` :
          r.id === "imposicion_manos" ? "acción adicional · reserva de PG" : "acción adicional";
        otras.push(boton("ac-recurso", `data-id="${esc(r.id)}"`, "✚", r.nombre, `${info} · ${quedan}/${Recursos.total(d, r.id)}`, quedan === 0));
      });
      Objetos.usablesDe(est, d).forEach(({ entrada, def }) => {
        const cd = def.cd === "lanzador" ? cdLanzador(d) : def.cd;
        const info = def.uso === "salvacion" ? `${def.salvacion} CD ${cd}` : "estabiliza a 0 PG";
        otras.push(boton("ac-objeto", `data-id="${esc(def.id)}"`, "🎒", def.nombre, `${def.tiempo} · ${info} · quedan ${entrada.cantidad}`));
      });
      Objetos.pocionesDe(d, est).forEach((it) => {
        const o = Objetos.objetoDe(it);
        otras.push(boton("ac-pocion", `data-uid="${esc(it.uid)}"`, "🧪", o.nombre, `acción adicional · ${o.curacion}`));
      });
    }

    const notas = [];
    if (d.multiataque) notas.push(`<b>Ataque múltiple:</b> ${esc(d.multiataque.texto)}`);
    if (p.tipo === "enemigo") {
      d.acciones.filter((a) => a.bonusAtaque == null && a.cd == null).forEach((a) => notas.push(`<b>${esc(a.nombre)}:</b> ${esc(a.texto)}`));
      (d.accionesAdicionales || []).forEach((a) => notas.push(`<b>${esc(a.nombre)} (acción adicional):</b> ${esc(a.texto)}`));
    } else if (((est.preparados || {})[d.id] || []).includes("castigo_abrasador")) {
      notas.push(`<b>Castigo abrasador:</b> se activa al golpear con un arma cuerpo a cuerpo (casilla en el ataque).`);
    }

    const seccion = (titulo, arr) => arr.length ? `<div class="menu-titulo">${titulo}</div><div class="menu-acciones">${arr.join("")}</div>` : "";
    return `
      ${seccion("Ataques", armas) || `<p class="muted">Sin ataques disponibles.</p>`}
      ${seccion("Conjuros", conjuros)}
      ${seccion(p.tipo === "pj" ? "Rasgos y objetos" : "Acciones especiales", otras)}
      ${notas.length ? `<ul class="rasgos notas-turno">${notas.map((n) => `<li>${n}</li>`).join("")}</ul>` : ""}`;
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

  function renderAccion(est, c, ac) {
    switch (ac.tipo) {
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
    const r = resultadoAtaque(c, ac, desc);
    const f = flags(c);

    const op = [];
    if (desc.atk && desc.atk.pj) {
      const arma = desc.atk.arma;
      if (arma.versatil) op.push(check("dosManos", ac.opciones.dosManos, `A dos manos (${arma.versatil})`));
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
      if (puedeCastigar(est, c, actor, arma)) {
        const bloqueo = !ac.opciones.castigo && bloqueoConjuro(est, c, d, hechizo("castigo_abrasador"));
        op.push(check("castigo", ac.opciones.castigo, `Castigo abrasador al golpear (+1d6 fuego y arde; gasta 1 espacio, acción adicional)${bloqueo ? " · " + bloqueo : ""}`, Boolean(bloqueo)));
      }
      if (!desc.competente) op.push(`<span class="sub aviso-texto">Sin competencia con esta arma: no suma el bonificador de competencia.</span>`);
    }
    const indefenso = desc.cuerpo && ["Paralizado", "Inconsciente"].find((x) => tiene(obj, x));
    if (indefenso) op.push(check("a5ft", ac.opciones.a5ft !== false, `A 5 ft de un objetivo ${indefenso}: si impacta, es crítico automático`));
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
      const res2 = calcularDano(desc.grupos, ac.valores, r.critico, defensasDe(obj), ac.opciones.salvaje);
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

    return `
      <div class="accion-en-curso">
        <div class="paso">
          <div class="fila">
            <span class="paso-etiqueta">${esc(actor.nombre)} ${verbo}</span>
            <select data-accion="ac-objetivo">${opcionesObjetivo(c, actor, ac.objetivoUid)}</select>
          </div>
          ${op.length ? `<div class="opciones">${op.join("")}</div>` : ""}
        </div>
        <div class="paso">
          <div class="paso-titulo">Tira <b>1d20 ${R.signo(desc.bonus)}${extra ? ` + ${esc(extra.dado)}` : ""}</b> · necesita <b class="objetivo-num">${caDe(obj)}</b> o más <span class="sub">(CA de ${esc(obj.nombre)})</span></div>
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
          <span class="sub">1d20 ${R.signo(bonus)} (${fuente.salvacion})${sugerido ? " · ventaja contra " + esc(fuente.condicion) : ""}</span></div>
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
          ${fuente.condicion ? `<p class="sub">Si falla: queda ${esc(fuente.condicion)}. ${esc(fuente.efectoAlFallar || "")}</p>` : fuente.efectoAlFallar ? `<p class="sub">Si falla: ${esc(fuente.efectoAlFallar)}</p>` : ""}
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
      return { nombre: o.nombre, tiempo: o.tiempo, caras: R.carasDe(o.curacion), fijo: R.parseDados(o.curacion).fijo, item };
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
    const lista = aliados(c, actor);
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
      case "ac-atacar":
        c.accion = nuevoAtaque(c, actor, { ataqueKey: ds.key });
        aplicarSugerencia(est, c, c.accion);
        c.ultimo = null;
        break;
      case "ac-conjuro":
        c.accion = nuevoConjuro(est, c, actor, hechizo(ds.id));
        aplicarSugerencia(est, c, c.accion);
        c.ultimo = null;
        break;
      case "ac-salvacion": {
        const primero = candidatos(c, actor)[0];
        c.accion = nuevaAccion("salvacion", actor, { idx: Number(ds.idx), objetivos: [] });
        if (primero) alternarObjetivo(c, c.accion, primero.uid, true);
        c.ultimo = null;
        break;
      }
      case "ac-objeto": {
        const def = porId(OBJETOS, ds.id);
        c.ultimo = null;
        if (def.uso === "estabilizar") {
          const caido = c.participantes.find((q) => q.tipo === "pj" && q.pg === 0 && !q.muerto && !q.estable);
          c.accion = nuevaAccion("estabilizar", actor, { objeto: def.id, objetivoUid: caido ? caido.uid : null });
        } else {
          const primero = candidatos(c, actor)[0];
          c.accion = nuevaAccion("salvacion", actor, { objeto: def.id, objetivos: [] });
          if (primero) alternarObjetivo(c, c.accion, primero.uid, true);
        }
        break;
      }
      case "ac-pocion":
        c.accion = nuevaAccion("curacion", actor, { fuente: { tipo: "item", uid: ds.uid }, objetivoUid: actor.uid });
        c.ultimo = null;
        break;
      case "ac-recurso":
        c.ultimo = null;
        if (ds.id === "tomar_aliento") {
          c.accion = nuevaAccion("curacion", actor, { fuente: { tipo: "recurso", id: ds.id }, objetivoUid: actor.uid });
        } else if (ds.id === "imposicion_manos") {
          c.accion = nuevaAccion("imposicion", actor, { objetivoUid: actor.uid, cantidad: 0 });
        } else {
          const d = datosDe(actor);
          Recursos.gastar(est, d, ds.id);
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
  }

  function aplicarAtaque(est, c, ac) {
    const actor = participante(c, ac.actorUid);
    const obj = participante(c, ac.objetivoUid);
    const desc = descriptor(est, c, ac);
    const r = resultadoAtaque(c, ac, desc);
    const res = calcularDano(desc.grupos, ac.valores, r.critico, defensasDe(obj), ac.opciones.salvaje);
    if (!res) return;
    if (desc.hechizo) gastarConjuro(est, c, actor, desc.hechizo);
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
      const h = hechizo("castigo_abrasador");
      gastarConjuro(est, c, actor, h);
      if (obj.pg > 0) {
        obj.efectos = (obj.efectos || []).filter((e) => e.tipo !== "ardiendo");
        obj.efectos.push({ tipo: "ardiendo", nombre: h.nombre, cd: R.cdConjuro(datosDe(actor)), fuenteUid: actor.uid });
        extras.push(`${obj.nombre} arde: al inicio de sus turnos 1d6 de fuego y salvación de CON CD ${R.cdConjuro(datosDe(actor))}.`);
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
        desc.accion.aplicaCondicionAlGolpear.forEach((cond) => extras.push(anadirCondicion(obj, cond)));
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
    if (desc.hechizo) gastarConjuro(est, c, actor, desc.hechizo);
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
    const { final, nota } = R.aplicarDefensas(desc.modAtributo, desc.atk.arma.tipoDano, defensasDe(obj));
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
      if (!supera && fuente.condicion) txt += ` · ${anadirCondicion(p, fuente.condicion, h && h.concentracion ? actor : null)}`;
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
    if (f.item) f.item.usado = true;
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

  return { renderTurno, alIniciarTurno, alTerminarTurno, guardarDado, manejar, caDe, chipsEstado, CONDICIONES };
})();
