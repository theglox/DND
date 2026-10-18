// Pestaña Objetos: botín de la partida (quién lo lleva, sintonización, cargas, pociones usadas)
// y utilidades para saber qué armas y consumibles tiene cada PJ.
window.Objetos = (function () {
  "use strict";

  const ARMAS = window.DATA_ARMAS || [];
  const OBJETOS = window.DATA_OBJETOS || [];
  const PJS = window.DATA_PJS || [];
  const PARTIDAS = window.DATA_PARTIDAS || [];

  const porId = (lista, id) => lista.find((x) => x.id === id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let raiz;

  // Crea el botín de la partida elegida (una entrada por objeto, incluso pociones repetidas).
  function asegurarBotin(est) {
    const partida = porId(PARTIDAS, est.partidaId);
    if (!partida) return;
    if (est.botin && est.botinPartida === partida.id) return;
    est.botinPartida = partida.id;
    // Cada entrada: "id" o { id, portador, sintonizado } (objetos que ya llevan de antes)
    est.botin = (partida.botin || []).map((entrada, i) => {
      const def = typeof entrada === "string" ? { id: entrada } : entrada;
      const o = porId(OBJETOS, def.id);
      return {
        uid: `${def.id}:${i}`, objetoId: def.id, portador: def.portador || null,
        sintonizado: Boolean(def.sintonizado), encendida: false,
        cargas: o && o.cargas != null ? o.cargas : null,
        usado: false
      };
    });
  }

  function objetoDe(item) {
    return porId(OBJETOS, item.objetoId);
  }

  function delPortador(est, pjId) {
    return (est.botin || []).filter((it) => it.portador === pjId && !it.usado);
  }

  // Armas de un PJ: las de su ficha + armas del botín que lleva.
  // Cada una: { key, arma (datos combinados), item (si viene del botín) }
  function armasDe(pj, est) {
    const propias = pj.armas.map((id) => ({ key: "arma:" + id, arma: porId(ARMAS, id), item: null }))
      .filter((a) => a.arma);
    const magicas = delPortador(est, pj.id)
      .map((item) => {
        const o = objetoDe(item);
        if (!o || o.tipo !== "arma") return null;
        const base = porId(ARMAS, o.armaBase);
        if (!base) return null;
        return {
          key: "item:" + item.uid,
          item,
          arma: {
            ...base,
            nombre: o.nombre,
            bonusAtaque: (base.bonusAtaque || 0) + (o.bonusAtaque || 0),
            bonusDano: (base.bonusDano || 0) + (o.bonusDano || 0),
            magico: true
          }
        };
      })
      .filter(Boolean);
    return [...magicas, ...propias];
  }

  // ---------- Equipo en la mano (máx. 2 manos: armas + escudo) ----------
  // est.equipo[pjId] = { enMano: [claves de armasDe], escudo: bool }. Persiste entre combates.
  function manosArma(arma, dosManos = false) {
    return (arma.propiedades || []).includes("a dos manos") || dosManos ? 2 : 1;
  }

  function equipoDe(est, pj) {
    est.equipo = est.equipo || {};
    if (!est.equipo[pj.id]) {
      const ini = pj.equipoInicial || {};
      est.equipo[pj.id] = {
        enMano: ini.enMano ? [...ini.enMano] : (pj.armas[0] ? ["arma:" + pj.armas[0]] : []),
        escudo: Boolean(pj.escudo) && ini.escudo !== false
      };
    }
    const eq = est.equipo[pj.id];
    // Si un arma del botín cambió de manos, ya no puede estar en la mano de este PJ
    const claves = new Set(armasDe(pj, est).map((a) => a.key));
    eq.enMano = eq.enMano.filter((k) => claves.has(k));
    return eq;
  }

  function manosUsadas(est, pj, excluirKey) {
    const eq = equipoDe(est, pj);
    let n = eq.escudo ? 1 : 0;
    armasDe(pj, est).forEach((a) => {
      if (eq.enMano.includes(a.key) && a.key !== excluirKey) n += manosArma(a.arma);
    });
    return n;
  }

  function armasEnMano(pj, est) {
    const eq = equipoDe(est, pj);
    return armasDe(pj, est).filter((a) => eq.enMano.includes(a.key));
  }

  function armasGuardadas(pj, est) {
    const eq = equipoDe(est, pj);
    return armasDe(pj, est).filter((a) => !eq.enMano.includes(a.key));
  }

  // Saca un arma: guarda las que haga falta para liberar manos. { ok, guardadas: [nombres], error }
  function equipar(est, pj, key) {
    const eq = equipoDe(est, pj);
    const a = armasDe(pj, est).find((x) => x.key === key);
    if (!a || eq.enMano.includes(key)) return { ok: false, guardadas: [] };
    const necesita = manosArma(a.arma);
    if (eq.escudo && necesita === 2) {
      return { ok: false, guardadas: [], error: `${a.arma.nombre} se usa a dos manos: primero quítate el escudo.` };
    }
    const guardadas = [];
    while (2 - manosUsadas(est, pj) < necesita && eq.enMano.length) {
      const fuera = eq.enMano.shift();
      const f = armasDe(pj, est).find((x) => x.key === fuera);
      guardadas.push(f ? f.arma.nombre : fuera);
    }
    eq.enMano.push(key);
    return { ok: true, guardadas };
  }

  function guardarArma(est, pj, key) {
    const eq = equipoDe(est, pj);
    eq.enMano = eq.enMano.filter((k) => k !== key);
  }

  // Ponerse / quitarse el escudo. { ok, error }
  function ponerEscudo(est, pj, puesto) {
    const eq = equipoDe(est, pj);
    if (!pj.escudo) return { ok: false, error: `${pj.nombre} no tiene escudo.` };
    if (puesto && !eq.escudo && manosUsadas(est, pj) >= 2) {
      return { ok: false, error: "Tienes las dos manos ocupadas: guarda un arma antes de ponerte el escudo." };
    }
    eq.escudo = puesto;
    return { ok: true };
  }

  function pocionesDe(pj, est) {
    return delPortador(est, pj.id).filter((it) => (objetoDe(it) || {}).tipo === "pocion");
  }

  // Objetos maravillosos que lleva (y tiene sintonizados si lo requieren), p. ej. el Periapto de salud
  function maravillososDe(pj, est) {
    return delPortador(est, pj.id).filter((it) => {
      const o = objetoDe(it) || {};
      return o.tipo === "maravilloso" && (!o.sintonizacion || it.sintonizado);
    });
  }

  // Condiciones contra las que sus objetos le dan ventaja en las salvaciones
  function ventajasSalvacionDe(pj, est) {
    return maravillososDe(pj, est).flatMap((it) => objetoDe(it).ventajaSalvacionContra || []);
  }

  // Amanecer (descanso largo): vuelven los usos diarios del botín
  function amanecer(est) {
    (est.botin || []).forEach((it) => {
      it.usadoHoy = false; it.venenoUsado = false; it.envenenado = false;
      const o = objetoDe(it);
      if (o && o.recargaTotal && o.cargas != null) it.cargas = o.cargas;   // Gorro: todas las cargas
    });
  }

  // ---------- Inventario de cada PJ ----------
  // Se copia de la ficha la primera vez y a partir de ahí vive en el estado (no lo toca el descanso).
  function inventarioDe(est, pj) {
    est.inventario = est.inventario || {};
    if (!est.inventario[pj.id]) {
      est.inventario[pj.id] = (pj.inventario || []).map((o, i) => ({
        uid: `${pj.id}:${i}`, objetoId: o.objetoId || null, nombre: o.nombre,
        cantidad: o.cantidad != null ? o.cantidad : 1, texto: o.texto || ""
      }));
    }
    return est.inventario[pj.id];
  }

  function entradaDe(est, pj, objetoId) {
    return inventarioDe(est, pj).find((e) => e.objetoId === objetoId);
  }

  function cantidadDe(est, pj, objetoId) {
    const e = entradaDe(est, pj, objetoId);
    return e ? e.cantidad : 0;
  }

  function gastarObjeto(est, pj, objetoId, n = 1) {
    const e = entradaDe(est, pj, objetoId);
    if (e) e.cantidad = Math.max(0, e.cantidad - n);
  }

  // Munición de un arma ("Flechas" → entrada del inventario) o null si no usa.
  function municionDe(est, pj, arma) {
    if (!arma.municion) return null;
    return inventarioDe(est, pj).find((e) => e.nombre === arma.municion) || { nombre: arma.municion, cantidad: 0 };
  }

  // Consumibles del inventario que se pueden usar en combate (con cantidad > 0).
  function usablesDe(est, pj) {
    return inventarioDe(est, pj)
      .map((e) => ({ entrada: e, def: e.objetoId && porId(OBJETOS, e.objetoId) }))
      .filter(({ entrada, def }) => def && def.tipo === "consumible" && entrada.cantidad > 0);
  }

  function oroDe(est, pj) {
    return est.oro && est.oro[pj.id] != null ? est.oro[pj.id] : (pj.oro || 0);
  }

  // ---------- Render de la pestaña ----------
  function render() {
    if (!raiz) return;
    const est = Estado.get();
    const partida = porId(PARTIDAS, est.partidaId);
    if (!partida) {
      raiz.innerHTML = `<div class="card"><h3>Botín</h3>
        <div class="empty">Elige una partida en la pestaña <b>Preparar</b>.</div></div>`;
      return;
    }
    Estado.actualizar((e) => {
      asegurarBotin(e);
      PJS.forEach((pj) => inventarioDe(e, pj));
    });

    raiz.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h3>Botín de la mazmorra</h3>
          <span class="badge">${esc(partida.nombre)}</span>
        </div>
        <p class="muted">Asigna cada objeto a quien lo recoja. Las armas aparecen en su turno de combate y las pociones como acción adicional.</p>
        <div class="lista">
          ${est.botin.map((item) => renderItem(item)).join("")}
        </div>
      </div>
      <div class="card">
        <h3>Inventario de los personajes</h3>
        <p class="muted">Los objetos marcados con ⚔ se pueden usar en combate desde el turno del PJ; al usarlos se descuentan solos.</p>
        <div class="lista">
          ${PJS.map((pj) => renderInventario(est, pj)).join("")}
        </div>
      </div>`;
  }

  const inventariosAbiertos = new Set();

  function renderInventario(est, pj) {
    const inv = inventarioDe(est, pj);
    const magicos = delPortador(est, pj.id).map((it) => objetoDe(it).nombre + (it.sintonizado ? " (sintonizado)" : ""));
    const usados = (est.botin || []).filter((it) => it.portador === pj.id && it.usado).length;
    return `
      <details class="plegable inventario" data-pj="${esc(pj.id)}" ${inventariosAbiertos.has(pj.id) ? "open" : ""}>
        <summary><h3>${esc(pj.nombre)}</h3>
          <span class="sub">${inv.reduce((s, e) => s + (e.cantidad > 0 ? 1 : 0), 0)} objetos · ${oroDe(est, pj)} po${magicos.length ? " · " + esc(magicos.join(", ")) : ""}</span>
        </summary>
        <div class="lista" style="margin-top:8px">
          ${inv.map((e) => {
            const def = e.objetoId && porId(OBJETOS, e.objetoId);
            const usable = def && (def.tipo === "consumible" || def.tipo === "municion");
            return `<div class="fila-inv ${e.cantidad === 0 ? "agotado" : ""}">
              <div class="objeto-info">
                <span class="nombre">${usable ? "⚔ " : ""}${esc(e.nombre)}</span>
                ${e.texto || (def && def.texto) ? `<span class="sub">${esc(def ? def.texto : e.texto)}</span>` : ""}
              </div>
              <span class="contador">
                <button class="btn-icon" data-accion="inv-cantidad" data-pj="${esc(pj.id)}" data-uid="${esc(e.uid)}" data-delta="-1" aria-label="Uno menos">−</button>
                <span class="cantidad">${e.cantidad}</span>
                <button class="btn-icon" data-accion="inv-cantidad" data-pj="${esc(pj.id)}" data-uid="${esc(e.uid)}" data-delta="1" aria-label="Uno más">+</button>
                ${e.propio ? `<button class="btn-icon" data-accion="inv-quitar" data-pj="${esc(pj.id)}" data-uid="${esc(e.uid)}" aria-label="Quitar">×</button>` : ""}
              </span>
            </div>`;
          }).join("")}
          ${usados ? `<p class="sub">${usados} poción(es) del botín ya usada(s).</p>` : ""}
          <div class="fila">
            <input type="text" class="input-texto" data-ref="inv-nombre-${esc(pj.id)}" placeholder="Nuevo objeto">
            <input type="number" min="1" value="1" class="input-num" data-ref="inv-cant-${esc(pj.id)}" aria-label="Cantidad">
            <button class="btn btn-sm" data-accion="inv-anadir" data-pj="${esc(pj.id)}">Añadir</button>
            <span class="sub">Oro</span>
            <input type="number" min="0" class="input-num" value="${oroDe(est, pj)}" data-accion="oro" data-pj="${esc(pj.id)}" aria-label="Oro">
          </div>
        </div>
      </details>`;
  }

  function renderItem(item) {
    const o = objetoDe(item);
    if (!o) return "";
    const base = o.armaBase && porId(ARMAS, o.armaBase);
    const opciones = PJS.map((pj) =>
      `<option value="${esc(pj.id)}" ${item.portador === pj.id ? "selected" : ""}>${esc(pj.nombre)}</option>`).join("");

    const extras = [];
    if (o.sintonizacion && item.portador) {
      extras.push(`<label class="check-inline"><input type="checkbox" data-accion="sintonizar" data-uid="${esc(item.uid)}" ${item.sintonizado ? "checked" : ""}> Sintonizado</label>`);
    }
    if (o.cargas != null) {
      extras.push(`<span class="contador">
        <button class="btn-icon" data-accion="carga" data-uid="${esc(item.uid)}" data-delta="-1" aria-label="Gastar carga">−</button>
        <span class="cantidad">${item.cargas}/${o.cargas}</span>
        <button class="btn-icon" data-accion="carga" data-uid="${esc(item.uid)}" data-delta="1" aria-label="Recuperar carga">+</button>
        <span class="sub">cargas</span>
      </span>`);
    }
    if (o.tipo === "pocion") {
      extras.push(item.usado
        ? `<span class="chip chip-usado">Usada</span> <button class="btn btn-sm" data-accion="restaurar" data-uid="${esc(item.uid)}">Deshacer</button>`
        : `<span class="chip">Disponible</span>${o.aplicaBuff && item.portador ? ` <button class="btn btn-sm" data-accion="beber" data-uid="${esc(item.uid)}" title="Fuera de combate: la bebe quien la lleva (dura 1 hora, hasta el descanso largo)">Beber ahora</button>` : ""}`);
    }
    if (o.usoDiario) {
      extras.push(`<label class="check-inline"><input type="checkbox" data-accion="usado-hoy" data-uid="${esc(item.uid)}" ${item.usadoHoy ? "checked" : ""}> Usado hoy</label>`);
    }
    if (o.veneno) {
      extras.push(`<label class="check-inline"><input type="checkbox" data-accion="veneno-usado" data-uid="${esc(item.uid)}" ${item.venenoUsado ? "checked" : ""}> Veneno usado hoy</label>
        ${item.envenenado ? `<span class="chip chip-cond">☠ hoja envenenada</span>` : ""}`);
    }

    return `
      <div class="fila-objeto ${item.usado ? "usado" : ""}">
        <div class="objeto-info">
          <span class="nombre">${esc(o.nombre)}</span>
          <span class="sub">${esc(o.en)} · ${esc(o.rareza)}${o.sintonizacion ? " · requiere sintonización" : ""}${base ? " · " + esc(base.nombre) : ""}</span>
          <p class="objeto-texto">${esc(o.texto)}</p>
        </div>
        <div class="objeto-controles">
          <select data-accion="portador" data-uid="${esc(item.uid)}" aria-label="Portador">
            <option value="">— Sin recoger —</option>
            ${opciones}
          </select>
          <div class="chips">${extras.join("")}</div>
        </div>
      </div>`;
  }

  function actualizarItem(uid, fn) {
    Estado.actualizar((est) => {
      const item = (est.botin || []).find((it) => it.uid === uid);
      if (item) fn(item);
    });
    render();
  }

  function init() {
    raiz = document.getElementById("panel-objetos");
    raiz.addEventListener("change", (e) => {
      const { accion, uid } = e.target.dataset;
      if (accion === "portador") {
        actualizarItem(uid, (it) => {
          it.portador = e.target.value || null;
          it.sintonizado = false;       // cambiar de manos rompe la sintonización
          it.encendida = false;
        });
      } else if (accion === "sintonizar") {
        actualizarItem(uid, (it) => {
          it.sintonizado = e.target.checked;
          if (!it.sintonizado) { it.encendida = false; it.envenenado = false; }
        });
      } else if (accion === "usado-hoy") {
        actualizarItem(uid, (it) => { it.usadoHoy = e.target.checked; });
      } else if (accion === "veneno-usado") {
        actualizarItem(uid, (it) => { it.venenoUsado = e.target.checked; if (!it.venenoUsado) it.envenenado = false; });
      } else if (accion === "oro") {
        Estado.actualizar((est) => {
          est.oro = est.oro || {};
          est.oro[e.target.dataset.pj] = Math.max(0, Number(e.target.value) || 0);
        });
        render();
      }
    });
    raiz.addEventListener("click", (e) => {
      const summary = e.target.closest("details.inventario > summary");
      if (summary) {
        const id = summary.parentElement.dataset.pj;
        summary.parentElement.open ? inventariosAbiertos.delete(id) : inventariosAbiertos.add(id);
      }
      const btn = e.target.closest("button[data-accion]");
      if (!btn) return;
      const { accion, uid } = btn.dataset;
      const pj = porId(PJS, btn.dataset.pj);
      if (accion === "inv-cantidad") {
        Estado.actualizar((est) => {
          const ent = inventarioDe(est, pj).find((x) => x.uid === uid);
          if (ent) ent.cantidad = Math.max(0, ent.cantidad + Number(btn.dataset.delta));
        });
        render();
        return;
      }
      if (accion === "inv-quitar") {
        Estado.actualizar((est) => {
          est.inventario[pj.id] = inventarioDe(est, pj).filter((x) => x.uid !== uid);
        });
        render();
        return;
      }
      if (accion === "inv-anadir") {
        const nombre = raiz.querySelector(`[data-ref="inv-nombre-${pj.id}"]`).value.trim();
        const cantidad = Math.max(1, Number(raiz.querySelector(`[data-ref="inv-cant-${pj.id}"]`).value) || 1);
        if (!nombre) return;
        Estado.actualizar((est) => {
          const def = OBJETOS.find((o) => o.nombre.toLowerCase() === nombre.toLowerCase());
          inventarioDe(est, pj).push({
            uid: `${pj.id}:n${Date.now().toString(36)}`, objetoId: def ? def.id : null,
            nombre: def ? def.nombre : nombre, cantidad, texto: "", propio: true
          });
        });
        render();
        return;
      }
      if (accion === "carga") {
        actualizarItem(uid, (it) => {
          const max = objetoDe(it).cargas;
          it.cargas = Math.max(0, Math.min(max, it.cargas + Number(btn.dataset.delta)));
        });
      } else if (accion === "restaurar") {
        actualizarItem(uid, (it) => { it.usado = false; });
      } else if (accion === "beber") {
        actualizarItem(uid, (it) => {
          const o = objetoDe(it);
          it.usado = true;
          Recursos.guardarBuffLargo(Estado.get(), it.portador, { id: o.aplicaBuff, fuenteUid: "pj:" + it.portador });
        });
      }
    });
    render();
  }

  return {
    init, render, asegurarBotin, armasDe, pocionesDe, maravillososDe, ventajasSalvacionDe, amanecer, objetoDe,
    inventarioDe, cantidadDe, gastarObjeto, municionDe, usablesDe,
    equipoDe, manosArma, manosUsadas, armasEnMano, armasGuardadas, equipar, guardarArma, ponerEscudo
  };
})();
