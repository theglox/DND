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
    restaurada = false;
    frame.src = urlLibro(true);
  });

  // --- Navegación por secciones de la historia ---
  // La historia (historia/navegacion.js) envía sus secciones y la sección visible por postMessage;
  // la app le pide saltar a una sección. Funciona también abriendo la app desde disco (file://).
  window.Sonidos.init();
  window.Secciones.init();
  window.Narrador.init();
  const selLibro = document.getElementById("selLibro");
  const selSeccion = document.getElementById("selSeccion");
  const saltos = document.getElementById("saltos");
  const LIBROS = window.DATA_LIBROS || [{ id: "libro1", titulo: "Historia", archivo: "historia/historia.html", grupos: {} }];
  let secciones = [];
  let restaurada = false;
  // Última sección vista en cada libro (antes se guardaba una sola: prefs.seccion)
  const seccionPorLibro = prefs.secciones || (prefs.seccion ? { [LIBROS[0].id]: prefs.seccion } : {});
  let libro = LIBROS.find((l) => l.id === prefs.libro) || LIBROS[0];

  const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function enviarHistoria(mensaje) {
    if (frame.contentWindow) frame.contentWindow.postMessage({ fuente: "app", ...mensaje }, "*");
  }

  function irSeccion(id, suave = true) {
    enviarHistoria({ tipo: "ir", id, suave });
    marcarSeccion(id);
    recordarSeccion(id);
  }

  function recordarSeccion(id) {
    seccionPorLibro[libro.id] = id;
    guardarPrefs({ secciones: seccionPorLibro });
  }

  // Cambia el libro que se muestra en la columna de historia
  function abrirLibro(id, { cargar = true } = {}) {
    libro = LIBROS.find((l) => l.id === id) || LIBROS[0];
    selLibro.value = libro.id;
    guardarPrefs({ libro: libro.id });
    window.Sonidos.setLibro(libro.id);
    secciones = [];
    seccionActual = null;
    selSeccion.innerHTML = "<option>Cargando secciones…</option>";
    selSeccion.disabled = true;
    saltos.innerHTML = "";
    window.Narrador.setSecciones(libro.id, []);
    restaurada = false;
    if (cargar) frame.src = urlLibro();
  }

  // Dirección del libro abierto apuntando a su última sección (la historia salta sola al cargar).
  // recargar: añade ?v= para forzar la recarga aunque la dirección sea la misma.
  function urlLibro(recargar = false) {
    const seccion = seccionPorLibro[libro.id];
    return libro.archivo + (recargar ? "?v=" + Date.now() : "") + (seccion ? "#" + encodeURIComponent(seccion) : "");
  }

  let seccionActual = null;

  function marcarSeccion(id) {
    if (!id) return;
    seccionActual = id;
    window.Sonidos.alCambiarSeccion(id);
    window.Secciones.alCambiarSeccion(libro.id, id);
    window.Narrador.alCambiarSeccion(libro.id, id);
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
    window.Narrador.setSecciones(libro.id, lista);

    // Botones rápidos para las áreas con código (D1…D6, S1…S6), agrupados por letra
    const grupos = {};
    lista.filter((s) => s.codigo).forEach((s) => {
      (grupos[s.codigo[0]] = grupos[s.codigo[0]] || []).push(s);
    });
    const titulos = libro.grupos || {};
    saltos.innerHTML = Object.entries(grupos).map(([letra, arr]) =>
      `<span class="saltos-grupo"><span class="saltos-titulo">${titulos[letra] || letra}</span>${arr.map((s) =>
        `<button type="button" data-id="${escHtml(s.id)}" title="${escHtml(s.texto)}">${escHtml(s.codigo)}</button>`).join("")}</span>`).join("");
    saltos.hidden = !Object.keys(grupos).length;

    // Al abrir, vuelve a la última sección consultada
    // La historia ya se abrió en su última sección (#id): solo se marca en el selector.
    // Si el selector se reconstruye (la historia puede enviar la lista dos veces), se conserva la marca.
    const marcada = restaurada ? seccionActual : seccionPorLibro[libro.id];
    if (marcada && lista.some((s) => s.id === marcada)) marcarSeccion(marcada);
    restaurada = true;
  }

  window.addEventListener("message", (e) => {
    if (e.source !== frame.contentWindow) return;
    const d = e.data;
    if (!d || d.fuente !== "historia") return;
    // Mensajes de un libro que ya no está abierto (p. ej. mientras se cambia de libro)
    if (d.pagina && d.pagina !== libro.archivo.split("/").pop()) return;
    if (d.tipo === "secciones") construirSelector(d.secciones || []);
    // Hasta restaurar la última sección, la historia informa "portada" al cargar: no se guarda
    if (d.tipo === "actual" && restaurada) {
      marcarSeccion(d.id);
      recordarSeccion(d.id);
    }
  });

  // El narrador (y otros módulos) pueden pedir saltar a una sección de la historia
  window.App.irSeccion = irSeccion;

  // --- Mostrar / ocultar el narrador ---
  function narradorOculto(oculto) {
    app.classList.toggle("narrador-oculto", oculto);
    guardarPrefs({ narradorOculto: oculto });
  }
  document.getElementById("btnOcultarNarrador").addEventListener("click", () => narradorOculto(true));
  document.getElementById("btnMostrarNarrador").addEventListener("click", () => narradorOculto(false));
  narradorOculto(!!prefs.narradorOculto);

  selLibro.innerHTML = LIBROS.map((l) => `<option value="${escHtml(l.id)}">${escHtml(l.titulo)}</option>`).join("");
  selLibro.hidden = LIBROS.length < 2;
  selLibro.addEventListener("change", () => abrirLibro(selLibro.value));
  // Abre el último libro consultado (el iframe arranca vacío)
  abrirLibro(libro.id);

  selSeccion.addEventListener("change", () => irSeccion(selSeccion.value));
  saltos.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (b) irSeccion(b.dataset.id);
  });
  // (restaurada se pone a false al cambiar el src, no aquí: "load" llega después de los mensajes)
  frame.addEventListener("load", () => {
    enviarHistoria({ tipo: "pedir" });
    // Si la lista no llega (p. ej. se cambió de libro durante la carga), se pide otra vez
    setTimeout(() => { if (!secciones.length) enviarHistoria({ tipo: "pedir" }); }, 800);
  });
  enviarHistoria({ tipo: "pedir" });
})();
