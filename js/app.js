// Arranque de la app: pestañas, separador de columnas y mostrar/ocultar historia.
(function () {
  "use strict";

  const PREFS_KEY = "dnd-combate:ui";

  // --- Preferencias de interfaz (solo comodidad; puede fallar sin romper nada) ---
  function leerPrefs() {
    try {
      return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function guardarPrefs(cambios) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...leerPrefs(), ...cambios }));
    } catch (e) { /* sin almacenamiento: ignorar */ }
  }

  const prefs = leerPrefs();
  const app = document.getElementById("app");

  // --- Pestañas ---
  const tabs = document.querySelectorAll(".tab");

  function activarPestana(nombre) {
    tabs.forEach((tab) => {
      const activa = tab.dataset.tab === nombre;
      tab.setAttribute("aria-selected", String(activa));
      tab.tabIndex = activa ? 0 : -1;
      document.getElementById("panel-" + tab.dataset.tab).classList.toggle("activo", activa);
    });
    guardarPrefs({ pestana: nombre });
    // Cada pestaña se redibuja al entrar: el combate y los objetos se afectan entre sí
    const modulos = { preparar: window.Preparar, combate: window.Combate, objetos: window.Objetos };
    if (modulos[nombre] && modulos[nombre].render) modulos[nombre].render();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => activarPestana(tab.dataset.tab));
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const siguiente = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      siguiente.focus();
      activarPestana(siguiente.dataset.tab);
    });
  });

  window.App = { activarPestana };

  window.Preparar.init();
  window.Combate.init();
  window.Objetos.init();
  activarPestana(prefs.pestana || "preparar");

  // --- Separador arrastrable ---
  const splitter = document.getElementById("splitter");
  const MIN_PCT = 20;
  const MAX_PCT = 75;

  function fijarAncho(pct) {
    const limitado = Math.min(MAX_PCT, Math.max(MIN_PCT, pct));
    app.style.setProperty("--col-historia", limitado + "%");
    return limitado;
  }

  let anchoActual = fijarAncho(prefs.anchoHistoria || 50);

  splitter.addEventListener("pointerdown", (e) => {
    splitter.setPointerCapture(e.pointerId);
    app.classList.add("arrastrando");
  });

  splitter.addEventListener("pointermove", (e) => {
    if (!app.classList.contains("arrastrando")) return;
    const rect = app.getBoundingClientRect();
    anchoActual = fijarAncho(((e.clientX - rect.left) / rect.width) * 100);
  });

  function terminarArrastre() {
    if (!app.classList.contains("arrastrando")) return;
    app.classList.remove("arrastrando");
    guardarPrefs({ anchoHistoria: anchoActual });
  }
  splitter.addEventListener("pointerup", (e) => {
    if (splitter.hasPointerCapture(e.pointerId)) splitter.releasePointerCapture(e.pointerId);
    terminarArrastre();
  });
  splitter.addEventListener("pointercancel", terminarArrastre);
  splitter.addEventListener("lostpointercapture", terminarArrastre);
  window.addEventListener("pointerup", terminarArrastre);
  window.addEventListener("blur", terminarArrastre);

  // Teclado: flechas mueven el separador
  splitter.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    anchoActual = fijarAncho(anchoActual + (e.key === "ArrowRight" ? 2 : -2));
    guardarPrefs({ anchoHistoria: anchoActual });
  });

  // Doble clic: volver a 50/50
  splitter.addEventListener("dblclick", () => {
    anchoActual = fijarAncho(50);
    guardarPrefs({ anchoHistoria: anchoActual });
  });

  // --- Mostrar / ocultar historia ---
  function historiaOculta(oculta) {
    app.classList.toggle("historia-oculta", oculta);
    guardarPrefs({ historiaOculta: oculta });
  }

  document.getElementById("btnOcultarHistoria").addEventListener("click", () => historiaOculta(true));
  document.getElementById("btnMostrarHistoria").addEventListener("click", () => historiaOculta(false));
  historiaOculta(!!prefs.historiaOculta);

  // --- Recargar historia (útil al editar historia.html) ---
  const frame = document.getElementById("frameHistoria");
  document.getElementById("btnRecargarHistoria").addEventListener("click", () => {
    frame.src = frame.src;
  });

  // --- Navegación por secciones de la historia ---
  // La historia (historia/navegacion.js) envía sus secciones y la sección visible por postMessage;
  // la app le pide saltar a una sección. Funciona también abriendo la app desde disco (file://).
  window.Sonidos.init();
  const selSeccion = document.getElementById("selSeccion");
  const saltos = document.getElementById("saltos");
  let secciones = [];
  let restaurada = false;

  const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function enviarHistoria(mensaje) {
    if (frame.contentWindow) frame.contentWindow.postMessage({ fuente: "app", ...mensaje }, "*");
  }

  function irSeccion(id, suave = true) {
    enviarHistoria({ tipo: "ir", id, suave });
    marcarSeccion(id);
    guardarPrefs({ seccion: id });
  }

  function marcarSeccion(id) {
    if (!id) return;
    window.Sonidos.alCambiarSeccion(id);
    selSeccion.value = id;
    saltos.querySelectorAll("button").forEach((b) => b.classList.toggle("activo", b.dataset.id === id));
  }

  function construirSelector(lista) {
    secciones = lista;
    // Opciones agrupadas por capítulo (h2); los h3 van dentro de su capítulo
    let html = "";
    let abierto = false;
    lista.forEach((s) => {
      if (s.nivel <= 2) {
        if (abierto) html += "</optgroup>";
        html += `<optgroup label="${escHtml(s.texto)}">`;
        abierto = true;
      }
      html += `<option value="${escHtml(s.id)}">${s.nivel === 3 ? " " : ""}${escHtml(s.texto)}</option>`;
    });
    if (abierto) html += "</optgroup>";
    selSeccion.innerHTML = html;
    selSeccion.disabled = !lista.length;

    // Botones rápidos para las áreas con código (D1…D6, S1…S6), agrupados por letra
    const grupos = {};
    lista.filter((s) => s.codigo).forEach((s) => {
      (grupos[s.codigo[0]] = grupos[s.codigo[0]] || []).push(s);
    });
    const titulos = { D: "Mazmorra", S: "Sombría" };
    saltos.innerHTML = Object.entries(grupos).map(([letra, arr]) =>
      `<span class="saltos-grupo"><span class="saltos-titulo">${titulos[letra] || letra}</span>${arr.map((s) =>
        `<button type="button" data-id="${escHtml(s.id)}" title="${escHtml(s.texto)}">${escHtml(s.codigo)}</button>`).join("")}</span>`).join("");
    saltos.hidden = !Object.keys(grupos).length;

    // Al abrir, vuelve a la última sección consultada
    if (!restaurada && prefs.seccion && lista.some((s) => s.id === prefs.seccion)) {
      irSeccion(prefs.seccion, false);
    }
    restaurada = true;
  }

  window.addEventListener("message", (e) => {
    if (e.source !== frame.contentWindow) return;
    const d = e.data;
    if (!d || d.fuente !== "historia") return;
    if (d.tipo === "secciones") construirSelector(d.secciones || []);
    if (d.tipo === "actual") {
      marcarSeccion(d.id);
      guardarPrefs({ seccion: d.id });
    }
  });

  selSeccion.addEventListener("change", () => irSeccion(selSeccion.value));
  saltos.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (b) irSeccion(b.dataset.id);
  });
  frame.addEventListener("load", () => {
    restaurada = false;
    enviarHistoria({ tipo: "pedir" });
  });
  enviarHistoria({ tipo: "pedir" });
})();
