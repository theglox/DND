// Casilleros de dados físicos: un campo por dado, solo acepta valores 1..caras.
window.Dados = (function () {
  "use strict";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function casillero({ key, caras, valor, titulo, descartado }) {
    return `<label class="dado ${descartado ? "descartado" : ""}" title="${esc(titulo || "d" + caras)}">
      <span class="dado-caras">d${caras}</span>
      <input type="text" inputmode="numeric" autocomplete="off"
        maxlength="${String(caras).length}" data-dado data-key="${esc(key)}" data-caras="${caras}"
        value="${valor ?? ""}" aria-label="Resultado del d${caras}">
    </label>`;
  }

  // "" → null (vacío) · número válido → número · otra cosa → undefined (inválido)
  function leer(texto, caras) {
    const t = String(texto).trim();
    if (t === "") return null;
    if (!/^\d+$/.test(t)) return undefined;
    const v = Number(t);
    return v >= 1 && v <= caras ? v : undefined;
  }

  // ¿Ya no puede haber un segundo dígito? (en un d20: 3..9 y 10..20 sí, 1 y 2 esperan)
  function completo(valor, caras) {
    return valor != null && valor * 10 > caras;
  }

  // Resuelve una tirada de d20 { modo, dados[], suerte[] }.
  // Suerte (mediano): un 1 natural se repite y cuenta el nuevo valor.
  // Devuelve { natural, usado } o null si falta algún dado.
  function resolverD20(t, conSuerte) {
    const n = t.modo === "normal" ? 1 : 2;
    const efectivos = [];
    for (let i = 0; i < n; i++) {
      let v = t.dados[i];
      if (v == null) return null;
      if (v === 1 && conSuerte) {
        v = t.suerte[i];
        if (v == null) return null;
      }
      efectivos.push(v);
    }
    let usado = 0;
    if (t.modo === "ventaja") usado = efectivos[1] > efectivos[0] ? 1 : 0;
    if (t.modo === "desventaja") usado = efectivos[1] < efectivos[0] ? 1 : 0;
    return { natural: efectivos[usado], usado, efectivos };
  }

  function nuevaTirada(modo = "normal") {
    return { modo, dados: [], suerte: [] };
  }

  // Casilleros de un d20 (1 o 2 según ventaja/desventaja) con repetición por Suerte.
  // prefijo identifica dónde se guarda: `${prefijo}|0`, `${prefijo}|s0`…
  function renderD20(t, prefijo, conSuerte) {
    const res = resolverD20(t, conSuerte);
    const n = t.modo === "normal" ? 1 : 2;
    const html = [];
    for (let i = 0; i < n; i++) {
      const descartado = res && n === 2 && res.usado !== i;
      html.push(casillero({ key: `${prefijo}|${i}`, caras: 20, valor: t.dados[i], descartado }));
      if (t.dados[i] === 1 && conSuerte) {
        html.push(`<span class="tag-suerte" title="Suerte: repite el 1 natural">Suerte ↻</span>`);
        html.push(casillero({ key: `${prefijo}|s${i}`, caras: 20, valor: t.suerte[i], titulo: "Repetición por Suerte" }));
      }
    }
    return { html: html.join(""), res };
  }

  // Guarda un valor en una tirada de d20 según el índice de la clave ("0", "1", "s0"…).
  function guardarEnTirada(t, idx, valor) {
    if (idx.startsWith("s")) t.suerte[Number(idx.slice(1))] = valor;
    else t.dados[Number(idx)] = valor;
  }

  // Casilleros para una lista de caras [6, 6, 4] con prefijo `${prefijo}|i`.
  function renderGrupo(caras, valores, prefijo) {
    return caras.map((c, i) => casillero({ key: `${prefijo}|${i}`, caras: c, valor: valores[i] })).join("");
  }

  // Suma de un grupo si todos los dados tienen valor; si no, null.
  function sumaGrupo(caras, valores) {
    let s = 0;
    for (let i = 0; i < caras.length; i++) {
      if (valores[i] == null) return null;
      s += valores[i];
    }
    return s;
  }

  return { casillero, leer, completo, resolverD20, nuevaTirada, renderD20, guardarEnTirada, renderGrupo, sumaGrupo };
})();
