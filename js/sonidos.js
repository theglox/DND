// Barra de sonidos de la historia: muestra los efectos de la sección visible.
// Todo es manual: ▶ reproduce, ■ para. Varios sonidos pueden sonar a la vez.
window.Sonidos = (function () {
  "use strict";

  const CFG = window.DATA_SONIDOS || { carpeta: "", secciones: {} };
  const PREFS_KEY = "dnd-combate:sonido";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const sonando = new Map();     // archivo → Audio
  const rotos = new Set();       // archivos que no se pudieron cargar
  let seccion = null;
  let raiz;
  let prefs = cargarPrefs();

  function cargarPrefs() {
    try {
      return { volumen: 0.8, silencio: false, ...JSON.parse(localStorage.getItem(PREFS_KEY)) };
    } catch (e) {
      return { volumen: 0.8, silencio: false };
    }
  }

  function guardarPrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { /* sin almacenamiento */ }
  }

  function volumenEfectivo() {
    return prefs.silencio ? 0 : prefs.volumen;
  }

  // ---------- Reproducción ----------
  function alternar(sonido) {
    if (sonando.has(sonido.archivo)) {
      parar(sonido.archivo);
      return;
    }
    const audio = new Audio(CFG.carpeta + sonido.archivo);
    audio.loop = Boolean(sonido.bucle);
    audio.volume = volumenEfectivo();
    audio.addEventListener("ended", () => { sonando.delete(sonido.archivo); render(); });
    audio.addEventListener("error", () => {
      sonando.delete(sonido.archivo);
      rotos.add(sonido.archivo);
      render();
    });
    sonando.set(sonido.archivo, audio);
    audio.play().catch(() => { sonando.delete(sonido.archivo); render(); });
    render();
  }

  function parar(archivo) {
    const audio = sonando.get(archivo);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    sonando.delete(archivo);
    render();
  }

  function pararTodo() {
    [...sonando.keys()].forEach(parar);
  }

  function aplicarVolumen() {
    sonando.forEach((a) => { a.volume = volumenEfectivo(); });
  }

  // ---------- Render ----------
  let libro = null;

  // Sonidos de una sección del libro abierto (acepta también el formato antiguo sin libros)
  function sonidosDe(id) {
    const mapa = (CFG.libros && CFG.libros[libro]) || CFG.secciones || {};
    return mapa[id] || [];
  }

  function setLibro(id) {
    if (id === libro) return;
    libro = id;
    seccion = null;
    render();
  }

  // Sonidos que siguen sonando pero son de otra sección (para poder pararlos desde aquí)
  function sonandoFuera(lista) {
    const propios = new Set(lista.map((s) => s.archivo));
    return [...sonando.keys()].filter((a) => !propios.has(a));
  }

  function render() {
    if (!raiz) return;
    const lista = sonidosDe(seccion);
    const fuera = sonandoFuera(lista);
    const botones = lista.map((s) => {
      const activo = sonando.has(s.archivo);
      const roto = rotos.has(s.archivo);
      return `<button type="button" class="btn-sonido ${activo ? "sonando" : ""}" data-archivo="${esc(s.archivo)}"
        ${roto ? "disabled" : ""} title="${roto ? "No se encuentra " + esc(s.archivo) : esc(s.archivo) + (s.bucle ? " (en bucle)" : "")}">
        ${activo ? "■" : "▶"} ${esc(s.nombre)}${s.bucle ? " ↻" : ""}</button>`;
    }).join("");

    raiz.innerHTML = `
      <span class="sonidos-icono" aria-hidden="true">🔊</span>
      <div class="sonidos-botones">
        ${botones || `<span class="sub">Sin sonidos en esta sección</span>`}
        ${fuera.length ? `<button type="button" class="btn-sonido sonando" data-accion="parar-fuera" title="${esc(fuera.join(", "))}">■ ${fuera.length} de otra sección</button>` : ""}
      </div>
      <div class="sonidos-controles">
        <button type="button" class="btn-icon" data-accion="silencio" title="${prefs.silencio ? "Quitar silencio" : "Silenciar"}" aria-label="Silenciar">${prefs.silencio ? "🔇" : "🔈"}</button>
        <input type="range" min="0" max="1" step="0.05" value="${prefs.volumen}" data-accion="volumen" aria-label="Volumen" title="Volumen">
        <button type="button" class="btn-icon" data-accion="parar-todo" title="Parar todos los sonidos" aria-label="Parar todo" ${sonando.size ? "" : "disabled"}>■</button>
      </div>`;
  }

  function alCambiarSeccion(id) {
    if (id === seccion) return;
    seccion = id;
    render();
  }

  function init() {
    raiz = document.getElementById("sonidosBarra");
    if (!raiz) return;
    raiz.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b || b.disabled) return;
      if (b.dataset.archivo) {
        const s = sonidosDe(seccion).find((x) => x.archivo === b.dataset.archivo);
        if (s) alternar(s);
      } else if (b.dataset.accion === "parar-todo") {
        pararTodo();
      } else if (b.dataset.accion === "parar-fuera") {
        sonandoFuera(sonidosDe(seccion)).forEach(parar);
      } else if (b.dataset.accion === "silencio") {
        prefs.silencio = !prefs.silencio;
        guardarPrefs();
        aplicarVolumen();
        render();
      }
    });
    raiz.addEventListener("input", (e) => {
      if (e.target.dataset.accion !== "volumen") return;
      prefs.volumen = Number(e.target.value);
      if (prefs.silencio) prefs.silencio = false;
      guardarPrefs();
      aplicarVolumen();
    });
    raiz.addEventListener("change", (e) => {
      if (e.target.dataset.accion === "volumen") render();
    });
    render();
  }

  return { init, alCambiarSeccion, setLibro, pararTodo };
})();
