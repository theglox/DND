// Reglas D&D 2024: cálculos derivados de las fichas.
window.Reglas = (function () {
  "use strict";

  const ATRIBUTOS = ["FUE", "DES", "CON", "INT", "SAB", "CAR"];

  function mod(valor) {
    return Math.floor((valor - 10) / 2);
  }

  function signo(n) {
    return (n >= 0 ? "+" : "") + n;
  }

  // "2d6+3" → { dados: [{cantidad: 2, caras: 6}], fijo: 3 }
  function parseDados(expr) {
    const res = { dados: [], fijo: 0 };
    String(expr).replace(/\s+/g, "").split(/(?=[+-])/).forEach((parte) => {
      const m = parte.match(/^([+-]?)(\d*)d(\d+)$/i);
      if (m) {
        res.dados.push({ cantidad: Number(m[2] || 1), caras: Number(m[3]) });
      } else if (/^[+-]?\d+$/.test(parte)) {
        res.fijo += Number(parte);
      }
    });
    return res;
  }

  function atributoArma(pj, arma) {
    if (arma.atributo === "sutil") {
      return mod(pj.atributos.DES) >= mod(pj.atributos.FUE) ? "DES" : "FUE";
    }
    return arma.atributo;
  }

  // ¿Competente con el arma? competenciaArmas: { sencillas, marciales: true | false | "sutil_ligera" }
  function competente(pj, arma) {
    const c = pj.competenciaArmas || { sencillas: true, marciales: true };
    if (arma.categoria === "sencilla") return Boolean(c.sencillas);
    if (c.marciales === "sutil_ligera") {
      return arma.propiedades.includes("sutil") || arma.propiedades.includes("ligera");
    }
    return Boolean(c.marciales);
  }

  // Ataque y daño de un PJ con un arma. Sin competencia no suma el bonificador de competencia.
  function ataqueArma(pj, arma, { dosManos = false } = {}) {
    const atr = atributoArma(pj, arma);
    const m = mod(pj.atributos[atr]);
    const comp = competente(pj, arma);
    const bonus = m + (comp ? pj.competencia : 0) + (arma.bonusAtaque || 0);
    const danoMod = m + (arma.bonusDano || 0);
    const dado = dosManos && arma.versatil ? arma.versatil : arma.dano;
    return {
      atributo: atr,
      modAtributo: m,
      competente: comp,
      bonus,
      dano: dado,
      danoMod,
      textoDano: dado + (danoMod ? " " + signo(danoMod).replace(/([+-])/, "$1 ") : "")
    };
  }

  // Resistencia (½, hacia abajo), vulnerabilidad (×2) e inmunidad (0) a un tipo de daño.
  function aplicarDefensas(cantidad, tipo, def) {
    if ((def.inmunidades || []).includes(tipo)) return { final: 0, nota: "inmune" };
    let final = cantidad;
    const notas = [];
    if ((def.resistencias || []).includes(tipo)) { final = Math.floor(final / 2); notas.push("resiste"); }
    if ((def.vulnerabilidades || []).includes(tipo)) { final *= 2; notas.push("vulnerable"); }
    return { final, nota: notas.join(", ") };
  }

  // "2d6" → [6, 6]
  function carasDe(expr) {
    return parseDados(expr).dados.flatMap((d) => Array(d.cantidad).fill(d.caras));
  }

  function salvacion(pj, atr) {
    const comp = (pj.salvacionesCompetentes || []).includes(atr) ? pj.competencia : 0;
    return mod(pj.atributos[atr]) + comp;
  }

  function salvacionEnemigo(en, atr) {
    if (en.salvaciones && en.salvaciones[atr] != null) return en.salvaciones[atr];
    return mod(en.atributos[atr]);
  }

  function iniciativa(criatura) {
    return criatura.bonusIniciativa != null ? criatura.bonusIniciativa : mod(criatura.atributos.DES);
  }

  function cdConjuro(pj) {
    if (!pj.atributoConjuro) return null;
    return 8 + pj.competencia + mod(pj.atributos[pj.atributoConjuro]);
  }

  function ataqueConjuro(pj) {
    if (!pj.atributoConjuro) return null;
    return pj.competencia + mod(pj.atributos[pj.atributoConjuro]);
  }

  // <option> de enemigos agrupadas por libro (enemigo.libro; sin libro → libro 1)
  function opcionesEnemigos(enemigos, opcion) {
    const libros = window.DATA_LIBROS || [];
    const grupos = {};
    enemigos.forEach((e) => (grupos[e.libro || "libro1"] = grupos[e.libro || "libro1"] || []).push(e));
    const ids = Object.keys(grupos);
    if (ids.length < 2) return enemigos.map(opcion).join("");
    const etiqueta = (id) => String((libros.find((l) => l.id === id) || { titulo: id }).titulo)
      .replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    return ids.map((id) => `<optgroup label="${etiqueta(id)}">${grupos[id].map(opcion).join("")}</optgroup>`).join("");
  }

  return {
    ATRIBUTOS, mod, signo, parseDados, carasDe, atributoArma, competente, ataqueArma, aplicarDefensas,
    salvacion, salvacionEnemigo, iniciativa, cdConjuro, ataqueConjuro, opcionesEnemigos
  };
})();
