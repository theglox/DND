// Diálogos propios dentro de la página (en lugar de confirm/alert del navegador,
// que algunos navegadores o vistas incrustadas bloquean sin avisar).
window.Dialogo = (function () {
  "use strict";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let abierto = null;

  function abrir({ titulo, texto, aceptar = "Aceptar", cancelar = null, peligro = false }) {
    cerrar(false);
    return new Promise((resolver) => {
      const capa = document.createElement("div");
      capa.className = "dialogo-capa";
      capa.innerHTML = `
        <div class="dialogo" role="dialog" aria-modal="true" aria-label="${esc(titulo || texto)}">
          ${titulo ? `<h3>${esc(titulo)}</h3>` : ""}
          <p>${esc(texto).replace(/\n/g, "<br>")}</p>
          <div class="dialogo-botones">
            ${cancelar ? `<button type="button" class="btn" data-r="0">${esc(cancelar)}</button>` : ""}
            <button type="button" class="btn ${peligro ? "btn-peligro-lleno" : "btn-primary"}" data-r="1">${esc(aceptar)}</button>
          </div>
        </div>`;
      const teclas = (e) => {
        if (e.key === "Escape") { e.preventDefault(); cerrar(false); }
        else if (e.key === "Enter") { e.preventDefault(); cerrar(true); }
      };
      capa.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-r]");
        if (b) cerrar(b.dataset.r === "1");
        else if (e.target === capa && cancelar) cerrar(false);
      });
      document.addEventListener("keydown", teclas, true);
      document.body.appendChild(capa);
      abierto = { capa, resolver, teclas };
      capa.querySelector('[data-r="1"]').focus();
    });
  }

  function cerrar(valor) {
    if (!abierto) return;
    const { capa, resolver, teclas } = abierto;
    abierto = null;
    document.removeEventListener("keydown", teclas, true);
    capa.remove();
    resolver(valor);
  }

  // Pregunta sí/no → Promise<boolean>
  function confirmar(texto, { titulo, aceptar = "Sí", cancelar = "Cancelar", peligro = false } = {}) {
    return abrir({ titulo, texto, aceptar, cancelar, peligro });
  }

  // Aviso con un solo botón → Promise
  function aviso(texto, titulo) {
    return abrir({ titulo, texto, aceptar: "Entendido" });
  }

  return { confirmar, aviso };
})();
