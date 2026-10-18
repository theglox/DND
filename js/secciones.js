// Panel "Pruebas y botín" de la sección visible de la historia (plegable).
// Pruebas: el DM elige el PJ, la app propone su bonificador, casillero d20 y resultado contra la CD.
// Salvaciones con daño: casilleros de daño y botón para restarlo a los PG del PJ.
// Botín: "Dar a…" asigna objetos mágicos (pestaña Objetos), suma oro o añade al inventario.
window.Secciones = (function () {
  "use strict";

  const R = window.Reglas;
  const D = window.Dados;
  const PJS = window.DATA_PJS || [];
  const DATOS = window.DATA_SECCIONES || {};
  const PREFS_KEY = "dnd-combate:panel-seccion";

  const porId = (lista, id) => lista.find((x) => x.id === id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const HABILIDAD_ATRIBUTO = {
    "Acrobacias": "DES", "Arcanos": "INT", "Atletismo": "FUE", "Engaño": "CAR", "Historia": "INT",
    "Perspicacia": "SAB", "Intimidación": "CAR", "Investigación": "INT", "Medicina": "SAB",
    "Naturaleza": "INT", "Percepción": "SAB", "Interpretación": "CAR", "Persuasión": "CAR",
    "Religión": "INT", "Juego de manos": "DES", "Sigilo": "DES", "Supervivencia": "SAB",
    "Trato con animales": "SAB"
  };

  let raiz;
  let libro = null;
  let seccion = null;
  let abierto = leerAbierto();
  let tiradas = {};          // índice de prueba → { pjId, modo, dados, suerte, dano }
  let mensaje = null;

  function leerAbierto() {
    try { return localStorage.getItem(PREFS_KEY) === "1"; } catch (e) { return false; }
  }
  function guardarAbierto() {
    try { localStorage.setItem(PREFS_KEY, abierto ? "1" : "0"); } catch (e) { /* sin almacenamiento */ }
  }

  function datosSeccion() {
    return (DATOS[libro] && DATOS[libro][seccion]) || null;
  }

  // ---------- Bonificadores ----------
  const claveBonus = (p) => `${p.tipo === "salvacion" ? "salv" : p.habilidad}|${p.atributo}`;

  // Guardado por el DM > habilidad de la ficha > salvación > modificador de característica
  function bonusDe(est, pj, p) {
    const guardado = est.bonusPruebas && est.bonusPruebas[pj.id] && est.bonusPruebas[pj.id][claveBonus(p)];
    if (guardado != null) return { valor: guardado, origen: "guardado" };
    if (p.tipo === "salvacion") return { valor: R.salvacion(pj, p.atributo), origen: "salvación" };
    if (pj.habilidades && pj.habilidades[p.habilidad] != null && HABILIDAD_ATRIBUTO[p.habilidad] === p.atributo) {
      return { valor: pj.habilidades[p.habilidad], origen: "ficha" };
    }
    return { valor: R.mod(pj.atributos[p.atributo]), origen: "característica" };
  }

  function pjsDisponibles(est) {
    const vivos = PJS.filter((pj) => !(est.muertos && est.muertos[pj.id]));
    const activos = vivos.filter((pj) => (est.pjsActivos || []).includes(pj.id));
    return activos.length ? activos : vivos;
  }

  function tirada(i, est) {
    if (!tiradas[i]) {
      const pj = pjsDisponibles(est)[0];
      tiradas[i] = { pjId: pj && pj.id, modo: "normal", dados: [], suerte: [], dano: [] };
    }
    return tiradas[i];
  }

  // ---------- Render ----------
  function render() {
    if (!raiz) return;
    const est = Estado.get();
    const datos = datosSeccion();
    const pruebas = (datos && datos.pruebas) || [];
    const botin = (datos && datos.botin) || [];
    const hay = pruebas.length || botin.length || (datos && datos.notas);
    const resumen = [
      pruebas.length && `🎲 ${pruebas.length} prueba${pruebas.length === 1 ? "" : "s"}`,
      botin.length && `💰 ${botin.length} de botín`,
      !pruebas.length && !botin.length && datos && datos.notas && "📌 nota"
    ].filter(Boolean).join(" · ");

    raiz.innerHTML = `
      <details class="panel-seccion ${hay ? "con-contenido" : "vacio"}" ${abierto && hay ? "open" : ""}>
        <summary>
          <span class="panel-seccion-titulo">Pruebas y botín</span>
          <span class="panel-seccion-resumen">${hay ? resumen : "nada en esta sección"}</span>
        </summary>
        ${hay ? `<div class="panel-seccion-cuerpo">
          ${mensaje ? `<div class="aviso">${esc(mensaje)}</div>` : ""}
          ${datos.notas ? `<p class="nota-seccion">📌 ${esc(datos.notas)}</p>` : ""}
          ${pruebas.length ? `<div class="menu-titulo">🎲 Pruebas y salvaciones</div>${pruebas.map((p, i) => renderPrueba(est, p, i)).join("")}` : ""}
          ${botin.length ? `<div class="menu-titulo">💰 Botín</div>${botin.map((b, i) => renderBotin(est, b, i)).join("")}` : ""}
        </div>` : ""}
      </details>`;
  }

  function renderPrueba(est, p, i) {
    const t = tirada(i, est);
    const pj = porId(PJS, t.pjId);
    const titulo = p.tipo === "salvacion"
      ? `Salvación de <b>${esc(p.atributo)}</b> CD <b class="objetivo-num">${p.cd}</b>`
      : `<b>${esc(p.atributo)} (${esc(p.habilidad)})</b> CD <b class="objetivo-num">${p.cd}</b>`;
    const opciones = pjsDisponibles(est).map((q) => `<option value="${esc(q.id)}" ${q.id === t.pjId ? "selected" : ""}>${esc(q.nombre)}</option>`).join("");

    let cuerpo = "";
    if (pj) {
      const bonus = bonusDe(est, pj, p);
      const { html, res } = D.renderD20(t, `pr|${i}`, Boolean(pj.suerteMediano));
      const total = res ? res.natural + bonus.valor : null;
      const supera = total != null && total >= p.cd;
      let resultado = "";
      if (total != null) {
        const texto = supera ? p.exito : p.fallo;
        resultado = `<div class="banner ${supera ? "golpe" : "fallo"}">${supera ? "✔ Supera" : "✖ Falla"} (${total} vs CD ${p.cd})${texto ? ": " + esc(texto) : ""}</div>`;
        if (p.tipo === "salvacion" && p.dano && (!supera || p.alSalvar === "mitad")) {
          resultado += renderDano(est, pj, p, i, supera);
        }
        if (p.tipo === "prueba" && !supera && pj.menteTactica) resultado += renderMenteTactica(est, pj, p, i, total);
      }
      cuerpo = `
        <div class="fila-tirada sin-borde prueba-controles">
          <select data-accion="pr-pj" data-i="${i}" aria-label="Personaje">${opciones}</select>
          <label class="sub" title="Bonificador de ${esc(pj.nombre)} (${bonus.origen}). Corrígelo si hace falta: se recuerda.">
            bonif. <input type="number" class="input-num input-bonus" data-accion="pr-bonus" data-i="${i}" value="${bonus.valor}"></label>
          <select class="select-modo" data-accion="pr-modo" data-i="${i}" aria-label="Modo">
            ${["normal", "ventaja", "desventaja"].map((m) => `<option value="${m}" ${t.modo === m ? "selected" : ""}>${m[0].toUpperCase() + m.slice(1)}</option>`).join("")}
          </select>
          <div class="dados">${html}</div>
          <div class="total ${total == null ? "" : supera ? "nat20" : "nat1"}">${total == null ? "—" : total}</div>
        </div>
        ${resultado}`;
    }

    return `
      <div class="prueba ${p.tipo}">
        <div class="prueba-titulo">${titulo}${p.accion ? ` <span class="chip">acción ${esc(p.accion)}</span>` : ""}
          <span class="sub">${esc(p.texto)}</span></div>
        ${cuerpo}
      </div>`;
  }

  // Mente táctica (guerrero nv 2): tras fallar una prueba, +1d10; solo gasta Tomar aliento si así la supera
  function renderMenteTactica(est, pj, p, i, total) {
    const t = tiradas[i];
    const quedan = Recursos.restante(est, pj, "tomar_aliento");
    const nuevo = t.tactica != null ? total + t.tactica : null;
    let estado = "";
    if (t.tacticaGastada) {
      estado = `<div class="banner golpe">✔ Supera con Mente táctica (${nuevo} vs CD ${p.cd})${p.exito ? ": " + esc(p.exito) : ""} · gastó 1 Tomar aliento</div>`;
    } else if (nuevo != null) {
      estado = nuevo >= p.cd
        ? `<span class="sub">${total} + ${t.tactica} = <b>${nuevo}</b> → ¡supera!</span>
           <button class="btn btn-sm btn-primary" data-accion="pr-tactica" data-i="${i}">Aplicar (gasta 1 Tomar aliento)</button>`
        : `<span class="sub">${total} + ${t.tactica} = <b>${nuevo}</b> → sigue fallando: no se gasta el uso.</span>`;
    }
    return `
      <div class="grupo-dados mente-tactica">
        <span class="grupo-etiqueta">🧠 Mente táctica · +1d10 (Tomar aliento ${quedan}/${Recursos.total(pj, "tomar_aliento")})</span>
        ${quedan || t.tacticaGastada ? `<div class="dados">${D.casillero({ key: `pmt|${i}|0`, caras: 10, valor: t.tactica })}</div>${estado}`
          : `<span class="sub">Sin usos de Tomar aliento.</span>`}
      </div>`;
  }

  function renderDano(est, pj, p, i, supera) {
    const t = tiradas[i];
    const caras = R.carasDe(p.dano);
    const suma = D.sumaGrupo(caras, t.dano);
    let preview = "";
    if (suma != null) {
      const bruto = supera ? Math.floor(suma / 2) : suma;
      const { final, nota } = R.aplicarDefensas(bruto, p.tipoDano, pj);
      preview = `= <b>${final}</b> ${esc(p.tipoDano)}${nota ? ` (${nota})` : ""} → ${esc(pj.nombre)} ${Math.max(0, Recursos.vida(est, pj) - final)}/${pj.pgMax} PG`;
    }
    return `
      <div class="grupo-dados">
        <span class="grupo-etiqueta">Daño ${esc(p.dano)} ${esc(p.tipoDano)}${supera ? " (mitad)" : ""}</span>
        <div class="dados">${D.renderGrupo(caras, t.dano, `prd|${i}`)}</div>
        <span class="sub">${preview}</span>
        <button class="btn btn-sm" data-accion="pr-aplicar" data-i="${i}" ${suma != null ? "" : "disabled"}>Aplicar a ${esc(pj.nombre)}</button>
      </div>`;
  }

  function renderBotin(est, b, i) {
    const reg = recogido(est, i);
    const nombre = `${esc(b.nombre)}${b.cantidad > 1 ? ` ×${b.cantidad}` : ""}${b.oro ? ` (${b.oro} po)` : ""}`;
    const opciones = pjsDisponibles(est).map((q) => `<option value="${esc(q.id)}">${esc(q.nombre)}</option>`).join("");
    return `
      <div class="fila-botin ${reg ? "recogido" : ""}">
        <div class="objeto-info">
          <span class="nombre">${b.objetoId ? "✨ " : b.oro ? "🪙 " : "🎒 "}${nombre}</span>
          ${b.detalle ? `<span class="sub">${esc(b.detalle)}</span>` : ""}
        </div>
        ${reg
          ? `<span class="chip">✔ ${esc((porId(PJS, reg.pjId) || {}).nombre || "")}</span>
             <button class="btn btn-sm" data-accion="bt-devolver" data-i="${i}" title="Deshacer la recogida">Devolver</button>`
          : `<select data-ref="bt-pj-${i}" aria-label="Quién lo recoge">${opciones}</select>
             <button class="btn btn-sm" data-accion="bt-recoger" data-i="${i}">Dar</button>`}
      </div>`;
  }

  // ---------- Botín ----------
  function registro(est) {
    est.botinSecciones = est.botinSecciones || {};
    const clave = `${libro}|${seccion}`;
    return (est.botinSecciones[clave] = est.botinSecciones[clave] || {});
  }

  function recogido(est, i) {
    return est.botinSecciones && est.botinSecciones[`${libro}|${seccion}`] && est.botinSecciones[`${libro}|${seccion}`][i];
  }

  function recoger(est, b, i, pj) {
    const reg = { pjId: pj.id };
    let txt;
    if (b.objetoId) {
      Objetos.asegurarBotin(est);
      const it = (est.botin || []).find((x) => x.objetoId === b.objetoId && !x.portador);
      if (it) {
        it.portador = pj.id;
        reg.itemUid = it.uid;
        txt = `${pj.nombre} recoge ${b.nombre} (asignado en la pestaña Objetos).`;
      }
    }
    if (!txt && b.oro) {
      est.oro = est.oro || {};
      est.oro[pj.id] = (est.oro[pj.id] != null ? est.oro[pj.id] : (pj.oro || 0)) + b.oro;
      reg.oro = b.oro;
      txt = `${pj.nombre} recoge ${b.oro} po (ahora ${est.oro[pj.id]} po).`;
    }
    if (!txt) {
      const uid = `${pj.id}:b${Date.now().toString(36)}`;
      Objetos.inventarioDe(est, pj).push({ uid, objetoId: null, nombre: b.nombre, cantidad: b.cantidad || 1, texto: b.detalle || "", propio: true });
      reg.invUid = uid;
      txt = `${pj.nombre} guarda ${b.nombre} en su inventario.`;
    }
    registro(est)[i] = reg;
    return txt;
  }

  function devolver(est, i) {
    const reg = recogido(est, i);
    if (!reg) return;
    const pj = porId(PJS, reg.pjId);
    if (reg.itemUid) {
      const it = (est.botin || []).find((x) => x.uid === reg.itemUid);
      if (it) { it.portador = null; it.sintonizado = false; it.encendida = false; }
    }
    if (reg.oro && est.oro) est.oro[pj.id] = Math.max(0, (est.oro[pj.id] || 0) - reg.oro);
    if (reg.invUid && est.inventario && est.inventario[pj.id]) {
      est.inventario[pj.id] = est.inventario[pj.id].filter((e) => e.uid !== reg.invUid);
    }
    delete registro(est)[i];
  }

  // ---------- Daño de salvaciones ----------
  function aplicarDano(i) {
    const p = datosSeccion().pruebas[i];
    const t = tiradas[i];
    const pj = porId(PJS, t.pjId);
    const est = Estado.get();
    const res = D.resolverD20(t, Boolean(pj.suerteMediano));
    const supera = res && res.natural + bonusDe(est, pj, p).valor >= p.cd;
    const suma = D.sumaGrupo(R.carasDe(p.dano), t.dano);
    if (suma == null) return;
    const { final } = R.aplicarDefensas(supera ? Math.floor(suma / 2) : suma, p.tipoDano, pj);
    Estado.actualizar((e) => {
      const vida = Math.max(0, Recursos.vida(e, pj) - final);
      Recursos.guardarVida(e, pj.id, vida);
      // Si hay un combate en curso con ese PJ, también baja allí
      const part = e.combate && e.combate.participantes.find((x) => x.uid === "pj:" + pj.id);
      if (part) part.pg = vida;
    });
    const vida = Recursos.vida(Estado.get(), pj);
    mensaje = `${pj.nombre} recibe ${final} de daño ${p.tipoDano} → ${vida}/${pj.pgMax} PG${vida === 0 ? " · ¡cae a 0 PG!" : ""}`;
    tiradas[i] = null;
    if (window.Preparar) Preparar.render();
    if (window.Combate) Combate.render();
  }

  // ---------- Eventos ----------
  function enfocar(key, siguiente) {
    const inputs = [...raiz.querySelectorAll("[data-dado]")];
    let i = inputs.findIndex((el) => el.dataset.key === key);
    if (i < 0) return;
    if (siguiente) {
      const fila = inputs[i].closest(".prueba");
      const siguienteInput = inputs.slice(i + 1).find((el) => el.closest(".prueba") === fila);
      if (!siguienteInput) return;
      i = inputs.indexOf(siguienteInput);
    }
    inputs[i].focus();
    inputs[i].setSelectionRange(inputs[i].value.length, inputs[i].value.length);
  }

  function alEscribir(e) {
    const input = e.target;
    if (!input.matches("[data-dado]")) return;
    const caras = Number(input.dataset.caras);
    const valor = D.leer(input.value, caras);
    input.classList.toggle("invalido", valor === undefined);
    if (valor === undefined) return;
    const [tipo, i, idx] = input.dataset.key.split("|");
    const t = tiradas[i];
    if (!t) return;
    if (tipo === "pr") D.guardarEnTirada(t, idx, valor);
    else if (tipo === "pmt") { if (!t.tacticaGastada) t.tactica = valor; }
    else t.dano[Number(idx)] = valor;
    mensaje = null;
    const key = input.dataset.key;
    render();
    enfocar(key, D.completo(valor, caras));
  }

  function alCambiar(e) {
    const { accion, i } = e.target.dataset;
    if (!accion || !accion.startsWith("pr-")) return;
    const t = tiradas[i];
    if (accion === "pr-pj") {
      tiradas[i] = { pjId: e.target.value, modo: t ? t.modo : "normal", dados: [], suerte: [], dano: [] };
    } else if (accion === "pr-modo") {
      t.modo = e.target.value;
      if (t.modo === "normal") t.dados.length = Math.min(t.dados.length, 1);
    } else if (accion === "pr-bonus") {
      const p = datosSeccion().pruebas[i];
      Estado.actualizar((est) => {
        est.bonusPruebas = est.bonusPruebas || {};
        (est.bonusPruebas[t.pjId] = est.bonusPruebas[t.pjId] || {})[claveBonus(p)] = Number(e.target.value) || 0;
      });
    }
    render();
  }

  function alClic(e) {
    const summary = e.target.closest(".panel-seccion > summary");
    if (summary) {
      abierto = !summary.parentElement.open;
      guardarAbierto();
      return;
    }
    const btn = e.target.closest("button[data-accion]");
    if (!btn) return;
    const { accion, i } = btn.dataset;
    const datos = datosSeccion();
    if (accion === "pr-aplicar") {
      aplicarDano(Number(i));
    } else if (accion === "pr-tactica") {
      const t = tiradas[i];
      const pj = porId(PJS, t.pjId);
      if (!t.tacticaGastada) {
        Estado.actualizar((est) => Recursos.gastar(est, pj, "tomar_aliento"));
        t.tacticaGastada = true;
        if (window.Preparar) Preparar.render();
      }
    } else if (accion === "bt-recoger") {
      const pj = porId(PJS, raiz.querySelector(`[data-ref="bt-pj-${i}"]`).value);
      Estado.actualizar((est) => { mensaje = recoger(est, datos.botin[i], Number(i), pj); });
      if (window.Objetos) Objetos.render();
    } else if (accion === "bt-devolver") {
      Estado.actualizar((est) => devolver(est, Number(i)));
      mensaje = `Devuelto: ${datos.botin[i].nombre}.`;
      if (window.Objetos) Objetos.render();
    } else {
      return;
    }
    render();
  }

  function alCambiarSeccion(libroId, seccionId) {
    if (libroId === libro && seccionId === seccion) return;
    libro = libroId;
    seccion = seccionId;
    tiradas = {};
    mensaje = null;
    render();
  }

  function init() {
    raiz = document.getElementById("panelSeccion");
    if (!raiz) return;
    raiz.addEventListener("input", alEscribir);
    raiz.addEventListener("change", alCambiar);
    raiz.addEventListener("click", alClic);
    render();
  }

  return { init, alCambiarSeccion, render };
})();
