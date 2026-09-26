// Pestaña Preparar: partida, PJs de la sesión, enemigos y arranque del combate.
window.Preparar = (function () {
  "use strict";

  const R = window.Reglas;
  const PJS = window.DATA_PJS || [];
  const ARMAS = window.DATA_ARMAS || [];
  const HECHIZOS = window.DATA_HECHIZOS || [];
  const ENEMIGOS = window.DATA_ENEMIGOS || [];
  const PARTIDAS = window.DATA_PARTIDAS || [];

  const porId = (lista, id) => lista.find((x) => x.id === id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const abiertos = new Set();   // fichas desplegadas (solo interfaz)
  let raiz;

  // ---------- Render ----------
  function render() {
    const est = Estado.get();
    raiz.innerHTML = `
      ${renderPartida(est)}
      ${renderPjs(est)}
      ${renderEnemigos(est)}
      ${renderGuardado(est)}
      ${renderResumen(est)}
    `;
  }

  function renderGuardado(est) {
    return `
      <details class="card plegable">
        <summary><h3>Guardar partida</h3><span class="sub">exportar, importar o empezar de cero</span></summary>
        <p class="muted" style="margin-top:8px">Todo (PG, espacios, inventarios, botín y el combate en curso) se guarda solo en este navegador.
          Exporta un archivo para tener copia o llevarlo a otro ordenador.</p>
        <div class="fila">
          <button class="btn btn-sm" data-accion="exportar">⬇ Exportar (.json)</button>
          <label class="btn btn-sm">⬆ Importar…<input type="file" accept=".json,application/json" data-accion="importar" hidden></label>
          <span style="flex:1"></span>
          <button class="btn btn-sm btn-peligro" data-accion="reiniciar-todo">Borrar todo</button>
        </div>
      </details>`;
  }

  function exportar() {
    const est = Estado.get();
    const fecha = new Date().toISOString().slice(0, 10);
    const partida = porId(PARTIDAS, est.partidaId);
    const nombre = `dnd-${partida ? partida.id : "partida"}-${fecha}.json`;
    const blob = new Blob([JSON.stringify({ app: "asistente-combate-dnd", version: 1, fecha, estado: est }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importar(archivo) {
    const lector = new FileReader();
    lector.onload = () => {
      let datos;
      try {
        datos = JSON.parse(lector.result);
      } catch (e) {
        alert("El archivo no es un JSON válido.");
        return;
      }
      const nuevo = datos && datos.estado ? datos.estado : datos;
      if (!confirm(`¿Cargar "${archivo.name}"? Se reemplazará la partida actual de este navegador.`)) return;
      if (!Estado.reemplazar(nuevo)) {
        alert("El archivo no parece una partida exportada desde esta app.");
        return;
      }
      render();
      Combate.render();
      Objetos.render();
    };
    lector.readAsText(archivo);
  }

  function renderPartida(est) {
    const opciones = PARTIDAS.map((p) =>
      `<option value="${esc(p.id)}" ${p.id === est.partidaId ? "selected" : ""}>${esc(p.nombre)}</option>`).join("");
    const partida = porId(PARTIDAS, est.partidaId);
    const previstos = partida && partida.enemigos && partida.enemigos.length
      ? `<button class="btn btn-sm" data-accion="cargar-previstos">Añadir enemigos previstos (${partida.enemigos.length})</button>`
      : "";
    return `
      <div class="card">
        <h3>Partida</h3>
        <div class="fila">
          <select data-accion="partida">
            <option value="">— Elegir partida —</option>
            ${opciones}
          </select>
          ${previstos}
        </div>
      </div>`;
  }

  function renderPjs(est) {
    if (!PJS.length) {
      return `<div class="card"><h3>Personajes en la sesión</h3>
        <div class="empty">Sin personajes · <code>data/personajes.js</code></div></div>`;
    }
    return `
      <div class="card">
        <div class="card-head">
          <h3>Personajes en la sesión</h3>
          <div class="chips">
            <button class="btn btn-sm" data-accion="descanso-corto" title="Recupera 1 uso de Tomar aliento">Descanso corto</button>
            <button class="btn btn-sm" data-accion="descanso-largo" title="PG al máximo, espacios y rasgos recuperados, fin de Armadura de mago">Descanso largo</button>
          </div>
        </div>
        <p class="muted">Los PG, espacios de conjuro y usos de rasgos se mantienen entre combates hasta un descanso.</p>
        <div class="lista">
          ${PJS.map((pj) => renderPj(pj, est)).join("")}
        </div>
      </div>`;
  }

  function renderPj(pj, est) {
    const activo = est.pjsActivos.includes(pj.id);
    const abierto = abiertos.has("pj:" + pj.id);
    return `
      <div class="fila-criatura ${activo ? "activa" : ""}">
        <label class="check">
          <input type="checkbox" data-accion="toggle-pj" data-id="${esc(pj.id)}" ${activo ? "checked" : ""}>
          <span class="nombre">${esc(pj.nombre)}${est.muertos && est.muertos[pj.id] ? " ☠" : ""}</span>
          <span class="sub">${esc(pj.clase)} ${pj.nivel} · ${esc(pj.especie.split(" (")[0])}</span>
        </label>
        <div class="chips">
          <span class="chip" title="Clase de armadura">CA <b>${pj.ca}</b></span>
          <span class="chip ${Recursos.vida(est, pj) < pj.pgMax ? "chip-herido" : ""}" title="Puntos de golpe actuales / máximos">PG <b>${Recursos.vida(est, pj)}/${pj.pgMax}</b></span>
          ${Recursos.espaciosTotales(pj, 1) ? `<span class="chip" title="Espacios de conjuro de nivel 1">Espacios <b class="espacios">${"●".repeat(Recursos.espaciosLibres(est, pj, 1))}${"○".repeat(Recursos.espaciosTotales(pj, 1) - Recursos.espaciosLibres(est, pj, 1))}</b></span>` : ""}
          <span class="chip" title="Iniciativa">Ini <b>${R.signo(R.iniciativa(pj))}</b></span>
          <span class="chip" title="Velocidad">${pj.velocidad} ft</span>
        </div>
        <button class="btn btn-sm" data-accion="ficha" data-id="pj:${esc(pj.id)}">${abierto ? "Ocultar" : "Ficha"}</button>
      </div>
      ${abierto ? renderFichaPj(pj, est) : ""}`;
  }

  function renderAtributos(criatura, salvacionFn, competentes) {
    return `
      <div class="atributos">
        ${R.ATRIBUTOS.map((a) => {
          const v = criatura.atributos[a];
          const comp = competentes.includes(a);
          return `<div class="atributo">
            <span class="atr-nombre">${a}</span>
            <span class="atr-mod">${R.signo(R.mod(v))}</span>
            <span class="atr-valor">${v}</span>
            <span class="atr-salv ${comp ? "comp" : ""}" title="Tirada de salvación${comp ? " (competente)" : ""}">
              Salv ${R.signo(salvacionFn(criatura, a))}${comp ? " ●" : ""}
            </span>
          </div>`;
        }).join("")}
      </div>`;
  }

  function renderFichaPj(pj, est) {
    const armas = pj.armas.map((id) => porId(ARMAS, id)).filter(Boolean);
    const trucos = (pj.trucos || []).map((id) => porId(HECHIZOS, id)).filter(Boolean);
    const idsPreparados = est.preparados[pj.id] || [];
    const preparados = idsPreparados.map((id) => porId(HECHIZOS, id)).filter(Boolean);
    const disponibles = hechizosPreparables(pj).filter((h) => !idsPreparados.includes(h.id));
    const lleno = pj.maxPreparados != null && idsPreparados.length >= pj.maxPreparados;
    const lanzador = Boolean(pj.espaciosConjuro && pj.espaciosConjuro[1]);
    const cd = R.cdConjuro(pj);

    return `
      <div class="ficha">
        ${renderAtributos(pj, R.salvacion, pj.salvacionesCompetentes || [])}

        <h4>Armas</h4>
        <table class="tabla">
          <thead><tr><th>Arma</th><th>Ataque</th><th>Daño</th><th>Alcance</th><th>Maestría</th></tr></thead>
          <tbody>
            ${armas.map((a) => {
              const at = R.ataqueArma(pj, a);
              const usaMaestria = (pj.maestrias || []).includes(a.id);
              return `<tr>
                <td>${esc(a.nombre)}<div class="sub">${esc(a.propiedades.join(", "))}</div></td>
                <td><b>${R.signo(at.bonus)}</b></td>
                <td>${esc(at.textoDano)} <span class="sub">${esc(a.tipoDano)}</span>
                  ${a.versatil ? `<div class="sub">${esc(a.versatil)} a dos manos</div>` : ""}</td>
                <td>${esc([a.alcance, a.distancia && a.distancia + " ft"].filter(Boolean).join(" · "))}</td>
                <td>${usaMaestria ? esc(a.maestria) + ` <span class="sub">(${esc(a.maestriaEn)})</span>` : "—"}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>

        <h4>Trucos</h4>
        ${trucos.length
          ? `<div class="chips">${trucos.map((h) => `<span class="chip" title="${esc(h.texto)}">${esc(h.nombre)}</span>`).join("")}</div>`
          : `<p class="muted">Ninguno.</p>`}

        ${lanzador ? `
          <h4>Hechizos preparados en esta partida
            ${pj.maxPreparados != null ? `<span class="contador-prep ${lleno ? "lleno" : ""}">${idsPreparados.length}/${pj.maxPreparados}</span>` : ""}
          </h4>
          ${!est.partidaId
            ? `<p class="muted">Elige una partida arriba.</p>`
            : `<div class="chips">
                ${preparados.map((h) => `<span class="chip" title="${esc(h.texto)}">${esc(h.nombre)}
                  <button class="chip-x" data-accion="quitar-hechizo" data-pj="${esc(pj.id)}" data-id="${esc(h.id)}" aria-label="Quitar">×</button></span>`).join("")
                  || `<span class="muted">Ninguno.</span>`}
              </div>
              ${disponibles.length && !lleno ? `
                <div class="fila" style="margin-top:8px">
                  <select data-ref="hechizo-${esc(pj.id)}">
                    ${disponibles.map((h) => `<option value="${esc(h.id)}">${esc(h.nombre)}</option>`).join("")}
                  </select>
                  <button class="btn btn-sm" data-accion="anadir-hechizo" data-pj="${esc(pj.id)}">Añadir</button>
                </div>` : ""}`}
          <p class="sub">Espacios de conjuro: ${pj.espaciosConjuro[1]} de nivel 1${pj.libroConjuros ? " · prepara desde su libro de conjuros" : ""}</p>` : ""}
        ${cd != null ? `<p class="sub">CD de conjuros ${cd} · Ataque de conjuro ${R.signo(R.ataqueConjuro(pj))} (${esc(pj.atributoConjuro)})</p>` : ""}

        <h4>Rasgos de combate</h4>
        <ul class="rasgos">
          ${pj.rasgos.filter((r) => r.combate).map((r) =>
            `<li><b>${esc(r.nombre)}.</b> ${esc(r.texto)}</li>`).join("")}
        </ul>

        <h4>Inventario</h4>
        <ul class="rasgos">
          ${(pj.inventario || []).map((o) =>
            `<li><b>${esc(o.nombre)}</b>${o.cantidad > 1 ? " ×" + o.cantidad : ""}${o.texto ? " — " + esc(o.texto) : ""}</li>`).join("")}
          ${pj.oro != null ? `<li><b>Oro:</b> ${pj.oro} po</li>` : ""}
        </ul>
      </div>`;
  }

  // Mago: su libro de conjuros. Resto: hechizos de nivel 1 de su clase.
  function hechizosPreparables(pj) {
    if (pj.libroConjuros) return pj.libroConjuros.map((id) => porId(HECHIZOS, id)).filter(Boolean);
    return HECHIZOS.filter((h) => h.nivel === 1 && (h.clases || []).includes(pj.clase));
  }

  function renderEnemigos(est) {
    const opciones = ENEMIGOS.map((e) =>
      `<option value="${esc(e.id)}">${esc(e.nombre)} (VD ${esc(e.vd)})</option>`).join("");
    return `
      <div class="card">
        <h3>Enemigos</h3>
        ${ENEMIGOS.length ? `
          <div class="fila">
            <select data-ref="enemigo">${opciones}</select>
            <input type="number" min="1" max="30" value="1" data-ref="cantidad" class="input-num" aria-label="Cantidad">
            <button class="btn btn-sm" data-accion="anadir-enemigo">Añadir</button>
          </div>` : `<div class="empty">Sin enemigos · <code>data/enemigos.js</code></div>`}
        <div class="lista">
          ${est.enemigos.map((g) => renderGrupoEnemigo(g)).join("")}
        </div>
      </div>`;
  }

  function renderGrupoEnemigo(grupo) {
    const en = porId(ENEMIGOS, grupo.enemigoId);
    if (!en) return "";
    const abierto = abiertos.has("en:" + en.id);
    return `
      <div class="fila-criatura activa enemigo">
        <div class="check">
          <span class="nombre">${esc(en.nombre)}</span>
          <span class="sub">${esc(en.tipo || "")} · VD ${esc(en.vd)}</span>
        </div>
        <div class="chips">
          <span class="chip">CA <b>${en.ca}</b></span>
          <span class="chip">PG <b>${en.pgMax}</b></span>
          <span class="chip">Ini <b>${R.signo(R.iniciativa(en))}</b></span>
        </div>
        <div class="contador">
          <button class="btn-icon" data-accion="cantidad" data-id="${esc(en.id)}" data-delta="-1" aria-label="Uno menos">−</button>
          <span class="cantidad">×${grupo.cantidad}</span>
          <button class="btn-icon" data-accion="cantidad" data-id="${esc(en.id)}" data-delta="1" aria-label="Uno más">+</button>
        </div>
        <button class="btn btn-sm" data-accion="ficha" data-id="en:${esc(en.id)}">${abierto ? "Ocultar" : "Ficha"}</button>
      </div>
      ${abierto ? renderFichaEnemigo(en) : ""}`;
  }

  function renderAccion(a) {
    const etiquetas = [
      a.recarga && `Recarga ${a.recarga}`,
      a.usosPorDia && `${a.usosPorDia}/día`
    ].filter(Boolean).join(", ");
    const partes = [];
    if (a.bonusAtaque != null) partes.push(`Ataque <b>${R.signo(a.bonusAtaque)}</b>, ${esc(a.alcance || "")}.`);
    if (a.cd != null) partes.push(`Salvación de <b>${esc(a.salvacion)} CD ${a.cd}</b>${a.alcance ? ", " + esc(a.alcance) : ""}.`);
    if (a.dano) {
      const extras = (a.danoExtra || []).map((d) => ` + ${esc(d.dado)} ${esc(d.tipo)}`).join("");
      partes.push(`Daño <b>${esc(a.dano)}</b> ${esc(a.tipoDano)}${extras}.`);
    }
    if (a.extraConVentaja) partes.push(`+${esc(a.extraConVentaja.dado)} ${esc(a.extraConVentaja.tipo)} si tenía ventaja.`);
    if (a.efectoAlGolpear) partes.push(esc(a.efectoAlGolpear));
    if (a.efectoAlFallar) partes.push(`Si falla: ${esc(a.efectoAlFallar)}`);
    if (a.texto) partes.push(esc(a.texto));
    return `<li><b>${esc(a.nombre)}${etiquetas ? ` (${etiquetas})` : ""}.</b> ${partes.join(" ")}</li>`;
  }

  function renderFichaEnemigo(en) {
    const competentes = Object.keys(en.salvaciones || {});
    const defensas = [
      en.vulnerabilidades.length && `<b>Vulnerable:</b> ${esc(en.vulnerabilidades.join(", "))}`,
      en.resistencias.length && `<b>Resiste:</b> ${esc(en.resistencias.join(", "))}`,
      en.inmunidades.length && `<b>Inmune (daño):</b> ${esc(en.inmunidades.join(", "))}`,
      en.inmuneCondiciones.length && `<b>Inmune (condiciones):</b> ${esc(en.inmuneCondiciones.join(", "))}`
    ].filter(Boolean);
    const seccion = (titulo, lista, fn) => (lista || []).length
      ? `<h4>${titulo}</h4><ul class="rasgos">${lista.map(fn).join("")}</ul>` : "";
    const rasgo = (r) => `<li><b>${esc(r.nombre)}${r.usosPorDia ? ` (${r.usosPorDia}/día)` : ""}.</b> ${esc(r.texto)}</li>`;

    return `
      <div class="ficha">
        ${renderAtributos(en, R.salvacionEnemigo, competentes)}
        <p class="sub" style="margin-top:8px">Velocidad ${en.velocidad} ft${en.velocidadExtra ? ", " + esc(en.velocidadExtra) : ""}
          · PG ${en.pgMax} (${esc(en.pgFormula)})${en.sentidos ? " · " + esc(en.sentidos) : ""}</p>
        ${defensas.length ? `<ul class="rasgos defensas">${defensas.map((d) => `<li>${d}</li>`).join("")}</ul>` : ""}
        ${seccion("Rasgos", en.rasgos, rasgo)}
        ${en.multiataque || en.acciones.length ? `<h4>Acciones</h4><ul class="rasgos">
          ${en.multiataque ? `<li><b>Ataque múltiple.</b> ${esc(en.multiataque.texto)}</li>` : ""}
          ${en.acciones.map(renderAccion).join("")}</ul>` : ""}
        ${seccion("Acciones adicionales", en.accionesAdicionales, rasgo)}
        ${seccion("Reacciones", en.reacciones, rasgo)}
      </div>`;
  }

  function renderResumen(est) {
    const nPjs = est.pjsActivos.length;
    const nEn = est.enemigos.reduce((s, g) => s + g.cantidad, 0);
    const listo = nPjs > 0 && nEn > 0;
    return `
      <div class="resumen">
        <span>${nPjs} PJ${nPjs === 1 ? "" : "s"} · ${nEn} enemigo${nEn === 1 ? "" : "s"}</span>
        <button class="btn btn-primary" data-accion="iniciar" ${listo ? "" : "disabled"}>Iniciar combate</button>
      </div>`;
  }

  // ---------- Acciones ----------
  function alCambiar(e) {
    if (e.target.dataset.accion === "importar") {
      const archivo = e.target.files && e.target.files[0];
      e.target.value = "";
      if (archivo) importar(archivo);
      return;
    }
    if (e.target.dataset.accion === "partida") {
      const partida = porId(PARTIDAS, e.target.value);
      Estado.actualizar((est) => {
        est.partidaId = partida ? partida.id : null;
        est.preparados = partida ? JSON.parse(JSON.stringify(partida.preparados || {})) : {};
        Objetos.asegurarBotin(est);
      });
      render();
    } else if (e.target.dataset.accion === "toggle-pj") {
      const id = e.target.dataset.id;
      Estado.actualizar((est) => {
        est.pjsActivos = e.target.checked
          ? [...new Set([...est.pjsActivos, id])]
          : est.pjsActivos.filter((x) => x !== id);
      });
      render();
    }
  }

  function anadirEnemigo(est, enemigoId, cantidad) {
    const grupo = est.enemigos.find((g) => g.enemigoId === enemigoId);
    if (grupo) grupo.cantidad += cantidad;
    else est.enemigos.push({ enemigoId, cantidad });
  }

  function alClic(e) {
    const btn = e.target.closest("[data-accion]");
    if (!btn || btn.tagName === "SELECT" || btn.tagName === "INPUT") return;
    const { accion, id } = btn.dataset;

    if (accion === "ficha") {
      abiertos.has(id) ? abiertos.delete(id) : abiertos.add(id);
    } else if (accion === "anadir-enemigo") {
      const enemigoId = raiz.querySelector('[data-ref="enemigo"]').value;
      const cantidad = Math.max(1, Number(raiz.querySelector('[data-ref="cantidad"]').value) || 1);
      Estado.actualizar((est) => anadirEnemigo(est, enemigoId, cantidad));
    } else if (accion === "cargar-previstos") {
      const partida = porId(PARTIDAS, Estado.get().partidaId);
      Estado.actualizar((est) => partida.enemigos.forEach((eid) => {
        if (porId(ENEMIGOS, eid)) anadirEnemigo(est, eid, 1);
      }));
    } else if (accion === "cantidad") {
      Estado.actualizar((est) => {
        const grupo = est.enemigos.find((g) => g.enemigoId === id);
        grupo.cantidad += Number(btn.dataset.delta);
        est.enemigos = est.enemigos.filter((g) => g.cantidad > 0);
      });
    } else if (accion === "anadir-hechizo") {
      const pjId = btn.dataset.pj;
      const hechizoId = raiz.querySelector(`[data-ref="hechizo-${pjId}"]`).value;
      Estado.actualizar((est) => {
        est.preparados[pjId] = [...(est.preparados[pjId] || []), hechizoId];
      });
    } else if (accion === "quitar-hechizo") {
      Estado.actualizar((est) => {
        est.preparados[btn.dataset.pj] = (est.preparados[btn.dataset.pj] || []).filter((h) => h !== id);
      });
    } else if (accion === "exportar") {
      exportar();
      return;
    } else if (accion === "reiniciar-todo") {
      if (!confirm("¿Borrar TODO? PG, inventarios, botín, muertes y el combate en curso volverán al estado inicial. (Exporta antes si quieres una copia.)")) return;
      Estado.reiniciar();
      Combate.render();
    } else if (accion === "descanso-corto") {
      Estado.actualizar((est) => Recursos.descansoCorto(est));
    } else if (accion === "descanso-largo") {
      if (!confirm("¿Descanso largo? Todos los PJs recuperan PG, espacios de conjuro y rasgos.")) return;
      Estado.actualizar((est) => Recursos.descansoLargo(est));
    } else if (accion === "iniciar") {
      iniciarCombate();
      return;
    } else {
      return;
    }
    render();
  }

  // Crea las instancias del combate (enemigos numerados con PG propios).
  function iniciarCombate() {
    if (Estado.get().combate && !confirm("Ya hay un combate en curso. ¿Reemplazarlo por uno nuevo?")) return;
    Estado.actualizar((est) => {
      const participantes = [];
      est.pjsActivos.forEach((id) => {
        const pj = porId(PJS, id);
        if (pj) participantes.push({ uid: "pj:" + id, tipo: "pj", refId: id, nombre: pj.nombre,
          pg: Recursos.vida(est, pj), pgMax: pj.pgMax, iniciativa: null,
          buffs: Recursos.buffsLargos(est, id).map((b) => ({ ...b })),
          // A 0 PG empieza inconsciente; los muertos siguen muertos
          ...(est.muertos && est.muertos[id] ? { muerto: true }
            : Recursos.vida(est, pj) === 0 ? { muerte: { exitos: 0, fallos: 0 }, condiciones: ["Inconsciente"] } : {}) });
      });
      est.enemigos.forEach((g) => {
        const en = porId(ENEMIGOS, g.enemigoId);
        if (!en) return;
        for (let i = 1; i <= g.cantidad; i++) {
          participantes.push({
            uid: `en:${en.id}:${i}`, tipo: "enemigo", refId: en.id,
            nombre: g.cantidad > 1 ? `${en.nombre} ${i}` : en.nombre,
            pg: en.pgMax, pgMax: en.pgMax, iniciativa: null
          });
        }
      });
      est.combate = {
        fase: "iniciativa", compartir: true, tiradasIni: {},
        participantes, orden: [], ronda: 0, turnoUid: null, log: []
      };
    });
    window.App.activarPestana("combate");
    window.Combate && window.Combate.render();
  }

  function init() {
    raiz = document.getElementById("panel-preparar");
    raiz.addEventListener("change", alCambiar);
    raiz.addEventListener("click", alClic);
    render();
  }

  return { init, render };
})();
