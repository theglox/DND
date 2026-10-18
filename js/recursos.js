// Recursos que duran entre combates hasta un descanso: PG de los PJs, espacios de conjuro,
// usos de rasgos (Tomar aliento, Imposición de manos…) y buffs largos (Armadura de mago).
window.Recursos = (function () {
  "use strict";

  const PJS = window.DATA_PJS || [];

  function de(est, pjId) {
    est.recursos = est.recursos || {};
    return est.recursos[pjId] || (est.recursos[pjId] = { espacios: {}, usos: {} });
  }

  // ---------- PG ----------
  function vida(est, pj) {
    return est.vida && est.vida[pj.id] != null ? est.vida[pj.id] : pj.pgMax;
  }

  function guardarVida(est, pjId, pg) {
    est.vida = est.vida || {};
    est.vida[pjId] = pg;
  }

  // ---------- Espacios de conjuro ----------
  function espaciosTotales(pj, nivel = 1) {
    return (pj.espaciosConjuro || {})[nivel] || 0;
  }

  function espaciosLibres(est, pj, nivel = 1) {
    return Math.max(0, espaciosTotales(pj, nivel) - (de(est, pj.id).espacios[nivel] || 0));
  }

  function gastarEspacio(est, pj, nivel = 1) {
    const r = de(est, pj.id);
    r.espacios[nivel] = (r.espacios[nivel] || 0) + 1;
  }

  // ---------- Rasgos con usos o reserva ----------
  function definicion(pj, id) {
    return (pj.recursos || []).find((r) => r.id === id);
  }

  function total(pj, id) {
    const def = definicion(pj, id);
    return def ? (def.usos != null ? def.usos : def.reserva) : 0;
  }

  function restante(est, pj, id) {
    return Math.max(0, total(pj, id) - (de(est, pj.id).usos[id] || 0));
  }

  function gastar(est, pj, id, n = 1) {
    const r = de(est, pj.id);
    r.usos[id] = (r.usos[id] || 0) + n;
  }

  // ---------- Hechizos preparados ----------
  // Los de la sesión (editables en Preparar) o, si ese PJ no tiene copia guardada
  // (p. ej. se eligió la partida antes de añadirlo), los de la partida.
  function preparadosDe(est, pjId) {
    const propios = est.preparados && est.preparados[pjId];
    if (Array.isArray(propios)) return propios;
    const partida = (window.DATA_PARTIDAS || []).find((p) => p.id === est.partidaId);
    return (partida && partida.preparados && partida.preparados[pjId]) || [];
  }

  // ---------- Dados de golpe (tantos como el nivel; se recuperan todos con descanso largo) ----------
  function dadosGolpeTotales(pj) {
    return pj.nivel || 1;
  }

  function dadosGolpeRestantes(est, pj) {
    return Math.max(0, dadosGolpeTotales(pj) - (de(est, pj.id).usos.dados_golpe || 0));
  }

  function gastarDadoGolpe(est, pj) {
    const r = de(est, pj.id);
    r.usos.dados_golpe = (r.usos.dados_golpe || 0) + 1;
  }

  // ---------- Recuperación arcana (mago): 1 espacio gastado, una vez por descanso largo ----------
  function recuperacionArcanaDisponible(est, pj) {
    const r = de(est, pj.id);
    return Boolean(pj.recuperacionArcana) && !r.usos.recuperacion_arcana && (r.espacios[1] || 0) > 0;
  }

  function usarRecuperacionArcana(est, pj) {
    const r = de(est, pj.id);
    r.espacios[1] = Math.max(0, (r.espacios[1] || 0) - 1);
    r.usos.recuperacion_arcana = 1;
  }

  // ---------- Buffs que duran horas ----------
  function buffsLargos(est, pjId) {
    return (est.buffsLargos && est.buffsLargos[pjId]) || [];
  }

  function guardarBuffLargo(est, pjId, buff) {
    est.buffsLargos = est.buffsLargos || {};
    const lista = (est.buffsLargos[pjId] = est.buffsLargos[pjId] || []);
    if (!lista.some((b) => b.id === buff.id)) lista.push(buff);
  }

  function quitarBuffLargo(est, pjId, buffId) {
    if (est.buffsLargos && est.buffsLargos[pjId]) {
      est.buffsLargos[pjId] = est.buffsLargos[pjId].filter((b) => b.id !== buffId);
    }
  }

  // ---------- Inspiración heroica ----------
  // Los humanos (Ingenioso) la tienen tras cada descanso largo; el DM también puede darla.
  function inspiracion(est, pj) {
    return est.inspiracion && est.inspiracion[pj.id] != null ? est.inspiracion[pj.id] : Boolean(pj.inspiracionHeroica);
  }

  function ponerInspiracion(est, pjId, valor) {
    est.inspiracion = est.inspiracion || {};
    est.inspiracion[pjId] = valor;
  }

  // ---------- Descansos ----------
  // Corto: recupera 1 uso de los rasgos "1 en corto" (Tomar aliento).
  function descansoCorto(est) {
    PJS.forEach((pj) => (pj.recursos || []).forEach((def) => {
      if (String(def.recarga).startsWith("1 en corto")) {
        const r = de(est, pj.id);
        r.usos[def.id] = Math.max(0, (r.usos[def.id] || 0) - 1);
      }
    }));
  }

  // Largo: PG, espacios, usos y buffs largos vuelven a cero.
  function descansoLargo(est) {
    est.recursos = {};
    est.vida = {};
    est.buffsLargos = {};
    est.inspiracion = {};
  }

  return {
    preparadosDe,
    inspiracion, ponerInspiracion,
    dadosGolpeTotales, dadosGolpeRestantes, gastarDadoGolpe,
    recuperacionArcanaDisponible, usarRecuperacionArcana,
    vida, guardarVida, espaciosTotales, espaciosLibres, gastarEspacio,
    definicion, total, restante, gastar,
    buffsLargos, guardarBuffLargo, quitarBuffLargo, descansoCorto, descansoLargo
  };
})();
