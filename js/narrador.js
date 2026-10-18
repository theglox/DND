// Columna "Narrador": cómo contar la sección visible de la historia y sus bifurcaciones.
// Sigue a la historia (la app le avisa del libro y la sección) y permite saltar a otras secciones.
window.Narrador = (function () {
  "use strict";

  const DATOS = window.DATA_NARRACION || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let raiz;
  let libro = null;
  let seccion = null;
  let titulos = {};          // id de sección → título (lo envía la historia)

  // Título que envía la historia; si aún no ha llegado, el id hecho legible
  const titulo = (id) => titulos[id] ||
    (/^[a-z]\d+$/.test(id || "") ? id.toUpperCase()
      : String(id || "").replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()));

  function ir(id) {
    if (window.App && window.App.irSeccion) window.App.irSeccion(id);
  }

  // ---------- Render ----------
  function render() {
    if (!raiz) return;
    const guia = DATOS[libro];
    if (!guia) {
      raiz.innerHTML = `<div class="empty">Todavía no hay guía de narrador para este libro.</div>`;
      return;
    }
    const s = guia.secciones[seccion];
    raiz.innerHTML = `
      ${renderFlujo(guia)}
      ${s ? renderSeccion(s) : renderSinGuia(guia)}`;
  }

  // Mapa del recorrido: etapas con sus nodos; el de la sección actual resaltado
  function renderFlujo(guia) {
    return `
      <details class="plegable flujo" open>
        <summary><span class="menu-titulo">🗺 Recorrido de la aventura</span></summary>
        <ol class="flujo-etapas">
          ${guia.flujo.map((etapa) => `
            <li class="flujo-etapa">
              <span class="flujo-nombre">${esc(etapa.etapa)}</span>
              <span class="flujo-nodos">
                ${etapa.nodos.map((n) => `<button type="button" class="flujo-nodo ${n.id === seccion ? "actual" : ""}"
                  data-ir="${esc(n.id)}" title="${esc(titulo(n.id))}">${esc(n.texto)}</button>`).join("")}
              </span>
            </li>`).join("")}
        </ol>
      </details>`;
  }

  function renderSeccion(s) {
    return `
      <article class="guia">
        <h3>${esc(titulo(seccion))}</h3>
        ${s.escena ? `<p class="guia-escena">🎬 ${esc(s.escena)}</p>` : ""}
        ${s.guion && s.guion.length ? `
          <div class="menu-titulo">🎭 Guion sugerido</div>
          ${renderGuion(s.guion)}` : ""}
        ${s.preguntas && s.preguntas.length ? `
          <details class="plegable preguntas">
            <summary><span class="menu-titulo">❓ Si preguntan… (${s.preguntas.length})</span></summary>
            <dl class="guia-preguntas">
              ${s.preguntas.map((q) => `<dt>${esc(q.p)}</dt><dd>${esc(q.r)}</dd>`).join("")}
            </dl>
          </details>` : ""}
        ${s.narrar && s.narrar.length ? `
          <div class="menu-titulo">🗣 Cómo contarlo</div>
          <ol class="guia-pasos">${s.narrar.map((p) => `<li>${esc(p)}</li>`).join("")}</ol>` : ""}
        ${s.bifurcaciones && s.bifurcaciones.length ? `
          <div class="menu-titulo">🔀 Bifurcaciones</div>
          <div class="bifurcaciones">
            ${s.bifurcaciones.map((b) => `
              <div class="bifurcacion">
                <div class="bif-si"><b>Si</b> ${esc(lowerFirst(b.si))}…</div>
                <div class="bif-entonces">→ ${esc(b.entonces)}</div>
                ${b.ir ? `<button type="button" class="btn btn-sm bif-ir" data-ir="${esc(b.ir)}">Ir a ${esc(titulo(b.ir))} ➜</button>` : ""}
              </div>`).join("")}
          </div>` : ""}
        ${s.ambiente ? `<p class="guia-nota">🌗 <b>Ambiente:</b> ${esc(s.ambiente)}</p>` : ""}
        ${s.consejo ? `<p class="guia-nota consejo">💡 ${esc(s.consejo)}</p>` : ""}
      </article>`;
  }

  // Líneas de guion agrupadas por bloque (p. ej. "Problema 1 · Los cultivos")
  function renderGuion(guion) {
    const bloques = [];
    guion.forEach((l) => {
      if (l.bloque || !bloques.length) bloques.push({ titulo: l.bloque || null, lineas: [] });
      bloques[bloques.length - 1].lineas.push(l);
    });
    return bloques.map((b) => `
      <div class="guion-bloque">
        ${b.titulo ? `<div class="guion-titulo">${esc(b.titulo)}</div>` : ""}
        ${b.lineas.map((l) => `
          <div class="guion-linea ${l.quien === "Narrador" ? "narrador" : "pnj"}">
            <span class="guion-quien">${esc(l.quien)}</span>
            <p class="guion-texto">«${esc(l.texto)}»</p>
            ${l.acotacion ? `<p class="guion-acotacion">(${esc(l.acotacion)})</p>` : ""}
          </div>`).join("")}
      </div>`).join("");
  }

  function renderSinGuia(guia) {
    const conGuia = Object.keys(guia.secciones);
    return `
      <div class="guia">
        <p class="muted">Esta sección (${esc(titulo(seccion) || "—")}) no tiene guía de narración.</p>
        <div class="menu-titulo">Secciones con guía</div>
        <div class="chips">
          ${conGuia.map((id) => `<button type="button" class="flujo-nodo" data-ir="${esc(id)}">${esc(titulo(id))}</button>`).join("")}
        </div>
      </div>`;
  }

  function lowerFirst(t) {
    return t ? t[0].toLowerCase() + t.slice(1) : "";
  }

  // ---------- API ----------
  function alCambiarSeccion(libroId, seccionId) {
    if (libroId === libro && seccionId === seccion) return;
    libro = libroId;
    seccion = seccionId;
    render();
    const cuerpo = raiz && raiz.closest(".col-body");
    if (cuerpo) cuerpo.scrollTop = 0;
  }

  // La historia envía sus secciones: se usan sus títulos en los botones
  function setSecciones(libroId, lista) {
    if (libroId !== libro) { libro = libroId; seccion = null; }
    titulos = {};
    (lista || []).forEach((s) => { titulos[s.id] = s.texto; });
    render();
  }

  function init() {
    raiz = document.getElementById("narrador");
    if (!raiz) return;
    raiz.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ir]");
      if (b) ir(b.dataset.ir);
    });
    render();
  }

  return { init, alCambiarSeccion, setSecciones };
})();
