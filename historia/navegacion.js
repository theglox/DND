// Navegación de la historia dentro del Asistente de combate.
// Detecta los títulos (h1–h3), les da un id (D1 → "d1", S3 → "s3"…) y habla con la app
// por postMessage, que funciona aunque la página se abra desde disco (file://).
(function () {
  "use strict";

  const slug = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // ---------- Secciones ----------
  const usados = new Set();
  const secciones = [...document.querySelectorAll("h1, h2, h3")].map((h) => {
    const texto = h.textContent.replace(/\s+/g, " ").trim();
    const codigo = (texto.match(/^([A-Z]\d+)\s*:/) || [])[1];   // D1, S3, T7…
    let id = h.id || (codigo ? codigo.toLowerCase() : h.tagName === "H1" ? "portada" : slug(texto));
    while (usados.has(id)) id += "-2";
    usados.add(id);
    h.id = id;
    return {
      id,
      texto: h.tagName === "H1" ? "Portada" : texto,
      nivel: Number(h.tagName[1]),
      codigo: codigo ? codigo.toUpperCase() : null
    };
  });

  // ---------- Ajustes solo para pantalla (la impresión queda igual) ----------
  const estilo = document.createElement("style");
  estilo.textContent = `
    @media screen {
      html { scroll-padding-top: 12px; }
      body { background: #e9e4d6; }
      .page { width: auto; max-width: 210mm; min-height: 0; margin: 0 auto 14px; padding-bottom: 28mm;
              box-shadow: 0 1px 6px rgba(0,0,0,.18); }
      .cover { min-height: 60vh; }
      .salto-destacado { animation: salto-destacado 1.6s ease-out; }
      @keyframes salto-destacado { 0% { background: #ffe58a; box-shadow: 0 0 0 6px #ffe58a; } 100% { background: transparent; box-shadow: 0 0 0 6px transparent; } }
    }`;
  document.head.appendChild(estilo);

  // ---------- Mensajes con la app ----------
  function enviar(tipo, datos) {
    // "pagina" permite a la app ignorar mensajes de un libro que ya no está abierto
    const pagina = decodeURIComponent(location.pathname.split("/").pop());
    if (window.parent !== window) window.parent.postMessage({ fuente: "historia", tipo, pagina, ...datos }, "*");
  }

  function ir(id, suave) {
    const el = document.getElementById(id);
    if (!el) return;
    // Suave solo en saltos cortos; en los largos, directo (el destello marca dónde caíste)
    const cerca = Math.abs(el.getBoundingClientRect().top) < window.innerHeight * 1.5;
    el.scrollIntoView({ behavior: suave !== false && cerca ? "smooth" : "auto", block: "start" });
    el.classList.remove("salto-destacado");
    void el.offsetWidth;          // reinicia la animación
    el.classList.add("salto-destacado");
  }

  // Un salto antes de terminar la carga se pierde (el navegador recoloca el scroll al acabar)
  function cuandoCargada(fn) {
    if (document.readyState === "complete") fn();
    else window.addEventListener("load", () => setTimeout(fn, 0), { once: true });
  }
  // La app decide dónde se queda la historia: que el navegador no restaure el scroll anterior
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || d.fuente !== "app") return;
    if (d.tipo === "ir") cuandoCargada(() => ir(d.id, d.suave));
    if (d.tipo === "pedir") enviar("secciones", { secciones });
  });

  // Sección visible al hacer scroll (la última cuyo título ya pasó por arriba)
  let actual = null;
  let pendiente = false;
  function detectar() {
    pendiente = false;
    let id = secciones.length ? secciones[0].id : null;
    for (const s of secciones) {
      if (document.getElementById(s.id).getBoundingClientRect().top <= 90) id = s.id;
      else break;
    }
    if (id !== actual) {
      actual = id;
      enviar("actual", { id });
    }
  }
  window.addEventListener("scroll", () => {
    if (!pendiente) { pendiente = true; setTimeout(detectar, 60); }
  }, { passive: true });

  enviar("secciones", { secciones });
  cuandoCargada(() => {
    if (location.hash) ir(decodeURIComponent(location.hash.slice(1)), false);
    detectar();
  });
})();
