// Pestaña Combate: tirada de iniciativa, orden de turnos, rondas y refuerzos.
// Fases del combate: "iniciativa" → "orden" (desempates / Alerta) → "turnos".
window.Combate = (function () {
  "use strict";

  const R = window.Reglas;
  const D = window.Dados;
  const PJS = window.DATA_PJS || [];
  const ENEMIGOS = window.DATA_ENEMIGOS || [];

  const porId = (lista, id) => lista.find((x) => x.id === id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const MODOS = { normal: "Normal", ventaja: "Ventaja", desventaja: "Desventaja (sorprendido)" };

  let raiz;
  let refuerzosAbierto = false;
  // Refuerzos en preparación (solo interfaz, no se guarda)
  const refuerzo = { enemigoId: ENEMIGOS[0] && ENEMIGOS[0].id, cantidad: 1, tirada: D.nuevaTirada() };

  // ---------- Utilidades ----------
  const combate = () => Estado.get().combate;
  const participante = (c, uid) => c.participantes.find((p) => p.uid === uid);
  const datosDe = (p) => porId(p.tipo === "pj" ? PJS : ENEMIGOS, p.refId);
  const fuera = (p) => (p.tipo === "enemigo" && p.pg <= 0) || Boolean(p.muerto);

  function log(c, texto) {
    c.log.push({ ronda: c.ronda, texto });
  }

  function tirada(c, key) {
    c.tiradasIni = c.tiradasIni || {};
    return c.tiradasIni[key] || (c.tiradasIni[key] = D.nuevaTirada());
  }

  // Filas de tirada: una por PJ y una por enemigo, o una por grupo si comparten.
  function filasIniciativa(c) {
    const filas = [];
    const grupos = {};
    c.participantes.forEach((p) => {
      if (p.tipo === "enemigo" && c.compartir) {
        const key = "grupo:" + p.refId;
        if (!grupos[key]) filas.push((grupos[key] = { key, uids: [] }));
        grupos[key].uids.push(p.uid);
      } else {
        filas.push({ key: p.uid, uids: [p.uid] });
      }
    });
    filas.forEach((f) => {
      const p = participante(c, f.uids[0]);
      f.datos = datosDe(p);
      f.tipo = p.tipo;
      f.nombre = f.uids.length > 1 ? `${f.datos.nombre} ×${f.uids.length}` : p.nombre;
      f.bonus = R.iniciativa(f.datos);
      f.suerte = Boolean(f.datos.suerteMediano);
    });
    return filas;
  }

  // ¿Empata con alguien que no sea de su mismo grupo de tirada compartida?
  function empatado(c, p) {
    return c.participantes.some((q) => q !== p && q.iniciativa === p.iniciativa &&
      !(c.compartir && p.tipo === "enemigo" && q.tipo === "enemigo" && p.refId === q.refId));
  }

  // ---------- Render ----------
  function render() {
    const activo = document.activeElement;
    const foco = activo && activo.dataset && activo.dataset.key;

    const c = combate();
    if (!c) {
      raiz.innerHTML = `
        <div class="card">
          <h3>Orden de iniciativa</h3>
          <div class="empty">No hay un combate en curso. Prepáralo en la pestaña <b>Preparar</b>.</div>
        </div>`;
      return;
    }

    if (c.fase === "iniciativa") raiz.innerHTML = renderIniciativa(c);
    else if (c.fase === "orden") raiz.innerHTML = renderOrden(c);
    else raiz.innerHTML = renderTurnos(c);

    if (foco) enfocar(foco, false);
  }

  function renderIniciativa(c) {
    const filas = filasIniciativa(c);
    const listas = filas.filter((f) => D.resolverD20(tirada(c, f.key), f.suerte)).length;
    return `
      <div class="card">
        <div class="card-head">
          <h3>Tirar iniciativa</h3>
          <label class="check-inline">
            <input type="checkbox" data-accion="compartir" ${c.compartir ? "checked" : ""}>
            Enemigos iguales comparten tirada
          </label>
        </div>
        <p class="muted">Cada uno tira <b>1d20</b> físico. Escribe solo el número del dado: la app suma el bonificador.</p>
        <div class="lista">
          ${filas.map((f) => renderFilaTirada(c, f)).join("")}
        </div>
      </div>
      <div class="barra-acciones">
        <button class="btn" data-accion="cancelar">Cancelar combate</button>
        <span class="sub">${listas}/${filas.length} tiradas</span>
        <button class="btn btn-primary" data-accion="confirmar-ini" ${listas === filas.length ? "" : "disabled"}>Ordenar iniciativa</button>
      </div>`;
  }

  function renderFilaTirada(c, f) {
    const t = tirada(c, f.key);
    const { html, res } = D.renderD20(t, "ini|" + f.key, f.suerte);
    const total = res ? res.natural + f.bonus : null;
    const nat = res && res.natural;
    return `
      <div class="fila-tirada ${f.tipo}">
        <div class="fila-tirada-nombre">
          <span class="nombre">${esc(f.nombre)}</span>
          <span class="sub">1d20 ${R.signo(f.bonus)}${f.suerte ? " · Suerte" : ""}</span>
        </div>
        <select class="select-modo" data-accion="modo" data-key="${esc(f.key)}" aria-label="Modo de tirada">
          ${Object.entries(MODOS).map(([v, txt]) => `<option value="${v}" ${t.modo === v ? "selected" : ""}>${txt}</option>`).join("")}
        </select>
        <div class="dados">${html}</div>
        <div class="total ${nat === 20 ? "nat20" : nat === 1 ? "nat1" : ""}">${total != null ? total : "—"}</div>
      </div>`;
  }

  function renderOrden(c) {
    return `
      <div class="card">
        <div class="card-head">
          <h3>Orden de iniciativa</h3>
          <span class="badge">Revisión</span>
        </div>
        <p class="muted">Arrastra (o usa ▲▼) para resolver empates: en 2024 el DM decide entre monstruos y los jugadores entre sus PJs.</p>
        ${renderListaOrden(c, { alerta: true })}
      </div>
      <div class="barra-acciones">
        <button class="btn" data-accion="volver-tirar">Volver a tirar</button>
        <button class="btn btn-primary" data-accion="comenzar">Comenzar combate</button>
      </div>`;
  }

  function renderListaOrden(c, { alerta = false, turnos = false } = {}) {
    return `<ol class="orden">
      ${c.orden.map((uid, i) => {
        const p = participante(c, uid);
        const d = datosDe(p);
        const actual = turnos && uid === c.turnoUid;
        const tieneAlerta = alerta && p.tipo === "pj" && (d.dotes || []).includes("Alerta");
        const aliados = c.participantes.filter((q) => q.tipo === "pj" && q !== p);
        return `<li class="orden-item ${p.tipo} ${actual ? "actual" : ""} ${fuera(p) ? "fuera" : ""}" draggable="true" data-uid="${esc(uid)}">
          <span class="asa" aria-hidden="true">⋮⋮</span>
          <span class="ini-num" title="Iniciativa">${p.iniciativa}</span>
          <span class="orden-nombre">
            <span class="nombre">${esc(p.nombre)}</span>
            ${empatado(c, p) ? `<span class="chip chip-empate">Empate</span>` : ""}
            ${actual ? `<span class="chip chip-turno">Su turno</span>` : ""}
            ${p.tipo === "pj" && p.pg === 0 ? `<span class="chip chip-caido">0 PG</span>` : ""}
            ${Acciones.chipsEstado(p)}
          </span>
          <span class="chips">
            <span class="chip">CA <b>${Acciones.caDe(p)}</b></span>
            <span class="chip">PG <b>${p.pg}/${p.pgMax}</b></span>
          </span>
          ${tieneAlerta && aliados.length ? `
            <select class="select-alerta" data-accion="alerta" data-uid="${esc(uid)}" title="Alerta: intercambia tu iniciativa con un aliado dispuesto">
              <option value="">⇄ Alerta…</option>
              ${aliados.map((q) => `<option value="${esc(q.uid)}">con ${esc(q.nombre)} (${q.iniciativa})</option>`).join("")}
            </select>` : ""}
          <span class="mover">
            <button class="btn-icon" data-accion="subir" data-uid="${esc(uid)}" ${i === 0 ? "disabled" : ""} aria-label="Subir">▲</button>
            <button class="btn-icon" data-accion="bajar" data-uid="${esc(uid)}" ${i === c.orden.length - 1 ? "disabled" : ""} aria-label="Bajar">▼</button>
          </span>
        </li>`;
      }).join("")}
    </ol>`;
  }

  function renderTurnos(c) {
    const p = participante(c, c.turnoUid);
    const d = p && datosDe(p);
    return `
      <div class="card turno-card ${p ? p.tipo : ""}">
        <div class="card-head">
          <h3>Turno de ${p ? esc(p.nombre) : "—"}</h3>
          <div class="chips">
            ${p ? `<span class="chip">CA <b>${Acciones.caDe(p)}</b></span>
            <span class="chip">PG <b>${p.pg}/${p.pgMax}</b></span>
            <span class="chip ${Acciones.velocidadDe(p) === 0 ? "chip-caido" : ""}" title="Velocidad">${Acciones.velocidadDe(p)} ft</span>` : ""}
            <span class="badge">Ronda ${c.ronda}</span>
          </div>
        </div>
        ${p && Acciones.chipsEstado(p) ? `<div class="chips" style="margin-bottom:8px">${Acciones.chipsEstado(p)}</div>` : ""}
        ${Acciones.renderTurno(Estado.get(), c)}
        <div class="barra-turno">
          <button class="btn" data-accion="anterior">◀ Anterior</button>
          ${renderDeshacer()}
          <button class="btn btn-primary" data-accion="siguiente">Siguiente turno ▶</button>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Orden de iniciativa</h3></div>
        ${renderListaOrden(c, { turnos: true })}
      </div>

      ${renderRefuerzos()}
      ${renderLog(c)}

      <div class="barra-acciones">
        <button class="btn" data-accion="cancelar">Terminar combate</button>
      </div>`;
  }

  function renderDeshacer() {
    const ultima = Estado.ultimaAccion();
    return `<button class="btn" data-accion="deshacer" ${ultima ? "" : "disabled"} title="${ultima ? "Deshacer: " + esc(ultima) : "Nada que deshacer"}">↶ Deshacer${ultima ? `<span class="sub"> ${esc(ultima)}</span>` : ""}</button>`;
  }

  function renderRefuerzos() {
    const en = porId(ENEMIGOS, refuerzo.enemigoId);
    const { html, res } = D.renderD20(refuerzo.tirada, "ref", false);
    const total = res && en ? res.natural + R.iniciativa(en) : null;
    return `
      <details class="card plegable" ${refuerzosAbierto ? "open" : ""}>
        <summary><h3>Refuerzos</h3><span class="sub">añadir enemigos a mitad del combate</span></summary>
        <div class="fila" style="margin-top:10px">
          <select data-accion="ref-enemigo">
            ${R.opcionesEnemigos(ENEMIGOS, (e) => `<option value="${esc(e.id)}" ${e.id === refuerzo.enemigoId ? "selected" : ""}>${esc(e.nombre)} (Ini ${R.signo(R.iniciativa(e))})</option>`)}
          </select>
          <input type="number" min="1" max="30" value="${refuerzo.cantidad}" data-accion="ref-cantidad" class="input-num" aria-label="Cantidad">
        </div>
        <div class="fila-tirada" style="margin-top:8px">
          <div class="fila-tirada-nombre"><span class="sub">Iniciativa (compartida)</span></div>
          <select class="select-modo" data-accion="ref-modo" aria-label="Modo de tirada">
            ${Object.entries(MODOS).map(([v, txt]) => `<option value="${v}" ${refuerzo.tirada.modo === v ? "selected" : ""}>${txt}</option>`).join("")}
          </select>
          <div class="dados">${html}</div>
          <div class="total">${total != null ? total : "—"}</div>
        </div>
        <button class="btn btn-sm" style="margin-top:8px" data-accion="ref-anadir" ${total != null ? "" : "disabled"}>Añadir al combate</button>
      </details>`;
  }

  function renderLog(c) {
    const entradas = c.log.slice().reverse();
    return `
      <div class="card">
        <h3>Registro</h3>
        ${entradas.length
          ? `<ul class="log">${entradas.map((e) => `<li><span class="log-ronda">${e.ronda ? "R" + e.ronda : "Ini"}</span>${esc(e.texto)}</li>`).join("")}</ul>`
          : `<div class="empty">Sin acciones.</div>`}
      </div>`;
  }

  // ---------- Acciones ----------
  function confirmarIniciativa() {
    Estado.actualizar((est) => {
      const c = est.combate;
      filasIniciativa(c).forEach((f) => {
        const t = tirada(c, f.key);
        const r = D.resolverD20(t, f.suerte);
        const total = r.natural + f.bonus;
        f.uids.forEach((uid) => { participante(c, uid).iniciativa = total; });
        const modo = t.modo === "normal" ? "" : ` ${t.modo}: ${t.dados.join("/")}`;
        const suerte = t.suerte.some((v) => v != null) ? " (Suerte)" : "";
        log(c, `Iniciativa · ${f.nombre}: ${total} (d20 ${r.natural}${modo}${suerte} ${R.signo(f.bonus)})`);
      });
      // Mayor total primero; empate: mayor DES, luego PJs antes que monstruos (ajustable a mano)
      c.orden = c.participantes.slice().sort((a, b) =>
        b.iniciativa - a.iniciativa ||
        datosDe(b).atributos.DES - datosDe(a).atributos.DES ||
        (a.tipo === "pj" ? -1 : 0) - (b.tipo === "pj" ? -1 : 0)
      ).map((p) => p.uid);
      c.fase = "orden";
    });
  }

  function mover(uid, destinoUid, despues) {
    Estado.actualizar((est) => {
      const orden = est.combate.orden.filter((u) => u !== uid);
      let i = orden.indexOf(destinoUid);
      if (i < 0) return;
      if (despues) i++;
      orden.splice(i, 0, uid);
      est.combate.orden = orden;
    });
  }

  function desplazar(uid, delta) {
    const orden = combate().orden;
    const i = orden.indexOf(uid);
    const j = i + delta;
    if (j < 0 || j >= orden.length) return;
    mover(uid, orden[j], delta > 0);
  }

  // Alerta: intercambia iniciativa y posición con un aliado.
  function intercambiarAlerta(uid, aliadoUid) {
    Estado.actualizar((est) => {
      const c = est.combate;
      const a = participante(c, uid);
      const b = participante(c, aliadoUid);
      [a.iniciativa, b.iniciativa] = [b.iniciativa, a.iniciativa];
      const ia = c.orden.indexOf(uid);
      const ib = c.orden.indexOf(aliadoUid);
      [c.orden[ia], c.orden[ib]] = [c.orden[ib], c.orden[ia]];
      log(c, `Alerta · ${a.nombre} intercambia su iniciativa con ${b.nombre} (${a.nombre} ${a.iniciativa}, ${b.nombre} ${b.iniciativa})`);
    });
  }

  function comenzar() {
    Estado.actualizar((est) => {
      const c = est.combate;
      c.fase = "turnos";
      c.ronda = 1;
      c.turnoUid = c.orden.find((uid) => !fuera(participante(c, uid)));
      log(c, `Comienza el combate · turno de ${participante(c, c.turnoUid).nombre}`);
      Acciones.alIniciarTurno(c);
    });
  }

  // Avanza (o retrocede) al siguiente participante que siga en pie. Cambia de ronda al dar la vuelta.
  function avanzar(delta) {
    Estado.actualizar((est) => {
      const c = est.combate;
      const n = c.orden.length;
      if (!c.orden.some((uid) => !fuera(participante(c, uid)))) return;
      let i = c.orden.indexOf(c.turnoUid);
      if (i < 0) i = 0;
      if (delta > 0) Acciones.alTerminarTurno(c);
      for (let paso = 0; paso < n; paso++) {
        i += delta;
        if (i >= n) { i = 0; c.ronda++; log(c, `— Ronda ${c.ronda} —`); }
        if (i < 0) { i = n - 1; c.ronda = Math.max(1, c.ronda - 1); }
        if (!fuera(participante(c, c.orden[i]))) break;
      }
      c.turnoUid = c.orden[i];
      Acciones.alIniciarTurno(c);
    });
  }

  function anadirRefuerzos() {
    const en = porId(ENEMIGOS, refuerzo.enemigoId);
    const res = D.resolverD20(refuerzo.tirada, false);
    if (!en || !res) return;
    const total = res.natural + R.iniciativa(en);

    Estado.actualizar((est) => {
      const c = est.combate;
      const existentes = c.participantes.filter((p) => p.refId === en.id);
      if (existentes.length === 1 && existentes[0].nombre === en.nombre) existentes[0].nombre = en.nombre + " 1";
      const numerar = existentes.length + refuerzo.cantidad > 1;
      const nuevos = [];
      for (let k = 0; k < refuerzo.cantidad; k++) {
        const num = existentes.length + k + 1;
        nuevos.push({
          uid: `en:${en.id}:${num}:${Date.now().toString(36)}`, tipo: "enemigo", refId: en.id,
          nombre: numerar ? `${en.nombre} ${num}` : en.nombre,
          pg: en.pgMax, pgMax: en.pgMax, iniciativa: total
        });
      }
      c.participantes.push(...nuevos);
      // Se colocan tras los que tengan igual o mayor iniciativa
      let pos = c.orden.findIndex((uid) => participante(c, uid).iniciativa < total);
      if (pos < 0) pos = c.orden.length;
      c.orden.splice(pos, 0, ...nuevos.map((p) => p.uid));
      log(c, `Refuerzos · ${nuevos.map((p) => p.nombre).join(", ")} entran con iniciativa ${total} (d20 ${res.natural} ${R.signo(R.iniciativa(en))})`);
    });
    refuerzo.tirada = D.nuevaTirada();
  }

  // ---------- Casilleros de dados ----------
  function tiradaPorClave(c, key) {
    const partes = key.split("|");
    if (partes[0] === "ref") return { t: refuerzo.tirada, idx: partes[1] };
    return { t: tirada(c, partes[1]), idx: partes[2] };
  }

  function guardarDado(key, valor) {
    if (key.startsWith("ac|")) {
      Estado.actualizar((est) => Acciones.guardarDado(est, key, valor));
      return;
    }
    const guardar = (c) => {
      const { t, idx } = tiradaPorClave(c, key);
      D.guardarEnTirada(t, idx, valor);
    };
    if (key.startsWith("ref")) guardar(combate());
    else Estado.actualizar((est) => guardar(est.combate));
  }

  function alEscribirDado(input) {
    const caras = Number(input.dataset.caras);
    const valor = D.leer(input.value, caras);
    input.classList.toggle("invalido", valor === undefined);
    if (valor === undefined) return;

    const key = input.dataset.key;
    guardarDado(key, valor);
    render();
    enfocar(key, D.completo(valor, caras));
  }

  // Enfoca el casillero `key` o, con `siguiente`, el próximo dentro del mismo bloque
  // (acción en curso, refuerzos o lista de iniciativa); tras el último, el botón de confirmar.
  function enfocar(key, siguiente) {
    const actual = [...raiz.querySelectorAll("[data-dado]")].find((el) => el.dataset.key === key);
    if (!actual) return;
    const bloque = actual.closest(".accion-en-curso, .aviso, details.plegable, .card") || raiz;
    const inputs = [...bloque.querySelectorAll("[data-dado]")];
    let i = inputs.indexOf(actual);
    if (siguiente) {
      i++;
      if (i >= inputs.length) {
        const confirmar = bloque.querySelector('[data-accion="confirmar-ini"]:not([disabled]), [data-accion="ac-aplicar"]:not([disabled]), [data-accion="ac-fallo"], [data-accion="ref-anadir"]:not([disabled])')
          || raiz.querySelector('[data-accion="confirmar-ini"]:not([disabled])');
        if (confirmar) confirmar.focus();
        return;
      }
    }
    const el = inputs[i];
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }

  function alTeclear(e) {
    if (!e.target.matches("[data-dado]") || e.key !== "Enter") return;
    e.preventDefault();
    enfocar(e.target.dataset.key, true);
  }

  // Acciones que cambian el combate y se pueden deshacer
  const DESHACIBLES = {
    "confirmar-ini": "ordenar iniciativa", "comenzar": "comenzar combate", "siguiente": "siguiente turno",
    "anterior": "turno anterior", "ref-anadir": "refuerzos", "subir": "reordenar", "bajar": "reordenar",
    "alerta": "Alerta", "ac-aplicar": "aplicar", "ac-fallo": "fallo", "ac-rozar": "Rozar",
    "ac-resolver": "resolver efecto", "ac-muerte": "salvación de muerte", "ac-manual-dano": "daño manual",
    "ac-manual-cura": "curación manual", "ac-manual-cond": "añadir condición", "ac-estabilizar": "estabilizar",
    "ac-quitar-cond": "quitar condición", "ac-quitar-buff": "quitar buff", "ac-recurso": "rasgo",
    "ac-encender": "encender arma", "ac-inspiracion": "inspiración", "ac-fin-conc": "terminar concentración", "ac-forzar": "actuar igualmente", "ac-sacar-arma": "sacar arma", "ac-guardar-arma": "guardar arma", "ac-escudo": "escudo"
  };

  function guardarParaDeshacer(accion) {
    if (!DESHACIBLES[accion]) return;
    const c = combate();
    const p = c && c.turnoUid && participante(c, c.turnoUid);
    Estado.snapshot(`${DESHACIBLES[accion]}${p ? " · " + p.nombre : ""}`);
  }

  function alCambiar(e) {
    const { accion, key, uid } = e.target.dataset;
    guardarParaDeshacer(accion);
    if (accion && accion.startsWith("ac-")) {
      Estado.actualizar((est) => Acciones.manejar(est, accion, e.target));
      render();
      return;
    }
    if (accion === "compartir") {
      Estado.actualizar((est) => { est.combate.compartir = e.target.checked; });
    } else if (accion === "modo") {
      Estado.actualizar((est) => {
        const t = tirada(est.combate, key);
        t.modo = e.target.value;
        if (t.modo === "normal") { t.dados.length = Math.min(t.dados.length, 1); t.suerte.length = Math.min(t.suerte.length, 1); }
      });
    } else if (accion === "alerta" && e.target.value) {
      intercambiarAlerta(uid, e.target.value);
    } else if (accion === "ref-enemigo") {
      refuerzo.enemigoId = e.target.value;
    } else if (accion === "ref-cantidad") {
      refuerzo.cantidad = Math.max(1, Math.min(30, Number(e.target.value) || 1));
    } else if (accion === "ref-modo") {
      refuerzo.tirada.modo = e.target.value;
      if (refuerzo.tirada.modo === "normal") refuerzo.tirada.dados.length = Math.min(refuerzo.tirada.dados.length, 1);
    } else {
      return;
    }
    render();
  }

  function alClic(e) {
    const summary = e.target.closest("details.plegable > summary");
    if (summary) {
      const abrir = !summary.parentElement.open;
      if (summary.parentElement.classList.contains("manual")) {
        Estado.actualizar((est) => { est.combate.manualAbierto = abrir; });
      } else if (summary.parentElement.classList.contains("oportunidad")) {
        Estado.actualizar((est) => { est.combate.oportunidadAbierto = abrir; });
      } else {
        refuerzosAbierto = abrir;
      }
    }
    const btn = e.target.closest("button[data-accion]");
    if (!btn || btn.disabled) return;
    const { accion, uid } = btn.dataset;

    if (accion === "deshacer") {
      const etiqueta = Estado.deshacer();
      render();
      if (etiqueta) {
        const aviso = raiz.querySelector(".turno-card, .card");
        if (aviso) aviso.insertAdjacentHTML("afterbegin", `<div class="aviso deshecho">↶ Deshecho: ${esc(etiqueta)}</div>`);
      }
      return;
    }
    guardarParaDeshacer(accion);

    if (accion.startsWith("ac-")) {
      Estado.actualizar((est) => Acciones.manejar(est, accion, btn));
      render();
      if (accion !== "ac-cancelar" && accion !== "ac-aplicar") {
        const primero = raiz.querySelector(".accion-en-curso [data-dado]");
        if (primero && !primero.value) primero.focus();
      }
      return;
    }

    if (accion === "cancelar") {
      Dialogo.confirmar("Se cerrará el combate. Los PG, espacios de conjuro y objetos gastados de los PJs se conservan.",
        { titulo: "¿Terminar el combate?", aceptar: "Terminar combate", peligro: true })
        .then((ok) => { if (ok) terminarCombate(); });
      return;
    } else if (accion === "confirmar-ini") {
      confirmarIniciativa();
    } else if (accion === "volver-tirar") {
      Estado.actualizar((est) => { est.combate.fase = "iniciativa"; });
    } else if (accion === "comenzar") {
      comenzar();
    } else if (accion === "subir" || accion === "bajar") {
      desplazar(uid, accion === "subir" ? -1 : 1);
    } else if (accion === "siguiente" || accion === "anterior") {
      avanzar(accion === "siguiente" ? 1 : -1);
    } else if (accion === "ref-anadir") {
      anadirRefuerzos();
    } else {
      return;
    }
    render();
  }

  // Cierra el combate. Tras el combate se recupera la mitad de la munición gastada.
  function terminarCombate() {
    const recuperada = [];
    Estado.actualizar((est) => {
      Object.entries((est.combate && est.combate.municionGastada) || {}).forEach(([k, n]) => {
        const [pjId, nombre] = k.split("|");
        const pj = porId(PJS, pjId);
        const mitad = Math.floor(n / 2);
        const ent = pj && Objetos.inventarioDe(est, pj).find((e) => e.nombre === nombre);
        if (ent && mitad) {
          ent.cantidad += mitad;
          recuperada.push(`${pj.nombre}: ${mitad} ${nombre.toLowerCase()}`);
        }
      });
      est.combate = null;
    });
    render();
    if (recuperada.length) {
      Dialogo.aviso("Se recupera la mitad de la munición gastada:\n" + recuperada.join("\n"), "Munición recuperada");
    }
  }

  // ---------- Arrastrar para reordenar ----------
  let arrastrando = null;

  function initArrastre() {
    raiz.addEventListener("dragstart", (e) => {
      const item = e.target.closest(".orden-item");
      if (!item) return;
      arrastrando = item.dataset.uid;
      item.classList.add("arrastrado");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", arrastrando);
    });
    raiz.addEventListener("dragover", (e) => {
      const item = e.target.closest(".orden-item");
      if (!arrastrando || !item) return;
      e.preventDefault();
      const rect = item.getBoundingClientRect();
      const despues = e.clientY > rect.top + rect.height / 2;
      raiz.querySelectorAll(".orden-item").forEach((el) => el.classList.remove("soltar-antes", "soltar-despues"));
      if (item.dataset.uid !== arrastrando) item.classList.add(despues ? "soltar-despues" : "soltar-antes");
    });
    raiz.addEventListener("drop", (e) => {
      const item = e.target.closest(".orden-item");
      if (!arrastrando || !item) return;
      e.preventDefault();
      if (item.dataset.uid !== arrastrando) {
        const rect = item.getBoundingClientRect();
        mover(arrastrando, item.dataset.uid, e.clientY > rect.top + rect.height / 2);
      }
      arrastrando = null;
      render();
    });
    raiz.addEventListener("dragend", () => {
      arrastrando = null;
      raiz.querySelectorAll(".orden-item").forEach((el) => el.classList.remove("arrastrado", "soltar-antes", "soltar-despues"));
    });
  }

  function init() {
    raiz = document.getElementById("panel-combate");
    raiz.addEventListener("input", (e) => { if (e.target.matches("[data-dado]")) alEscribirDado(e.target); });
    raiz.addEventListener("keydown", alTeclear);
    raiz.addEventListener("change", alCambiar);
    raiz.addEventListener("click", alClic);
    initArrastre();
    // Ctrl+Z: deshacer (solo con la pestaña Combate visible y fuera de un campo de texto)
    document.addEventListener("keydown", (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z" || e.shiftKey) return;
      if (e.target.matches("input, textarea, select") || !raiz.classList.contains("activo")) return;
      const btn = raiz.querySelector('[data-accion="deshacer"]:not([disabled])');
      if (btn) { e.preventDefault(); btn.click(); }
    });
    render();
  }

  return { init, render };
})();
