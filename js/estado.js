// Estado de la sesión (partida elegida, participantes) guardado en localStorage.
window.Estado = (function () {
  "use strict";

  const KEY = "dnd-combate:estado";

  const inicial = () => ({
    partidaId: null,
    pjsActivos: [],            // ids de PJ
    preparados: {},            // { pjId: [hechizoId] } para la partida actual
    enemigos: [],              // [{ enemigoId, cantidad }]
    combate: null              // se llena al iniciar el combate (fase 3)
  });

  let estado = cargar();

  function cargar() {
    try {
      const guardado = JSON.parse(localStorage.getItem(KEY));
      return guardado ? { ...inicial(), ...guardado } : inicial();
    } catch (e) {
      return inicial();
    }
  }

  function guardar() {
    try {
      localStorage.setItem(KEY, JSON.stringify(estado));
    } catch (e) { /* sin almacenamiento: el estado vive solo en memoria */ }
  }

  function get() {
    return estado;
  }

  function actualizar(fn) {
    fn(estado);
    guardar();
  }

  function reiniciar() {
    estado = inicial();
    historial.length = 0;
    guardar();
  }

  // Sustituye todo el estado (importar desde archivo). Devuelve false si no parece válido.
  function reemplazar(nuevo) {
    if (!nuevo || typeof nuevo !== "object" || !Array.isArray(nuevo.pjsActivos)) return false;
    estado = { ...inicial(), ...nuevo };
    historial.length = 0;
    guardar();
    return true;
  }

  // ---------- Deshacer ----------
  // Copias del estado antes de cada acción que cambia el combate (solo en memoria).
  const historial = [];
  const MAX_HISTORIAL = 40;

  function snapshot(etiqueta) {
    historial.push({ etiqueta, datos: JSON.stringify(estado) });
    if (historial.length > MAX_HISTORIAL) historial.shift();
  }

  function deshacer() {
    const h = historial.pop();
    if (!h) return null;
    estado = JSON.parse(h.datos);
    guardar();
    return h.etiqueta;
  }

  function ultimaAccion() {
    return historial.length ? historial[historial.length - 1].etiqueta : null;
  }

  return { get, actualizar, reiniciar, reemplazar, snapshot, deshacer, ultimaAccion };
})();
