# Asistente de Combate D&D — Plan de construcción

> Estado: **las 8 fases están completadas.** Ver "Guía de uso" justo debajo.
>
> **Decisiones confirmadas:**
> - Historia a la **izquierda**, combate a la **derecha**.
> - **Todos los dados son físicos**, también los de los enemigos: la app nunca tira dados, solo indica qué tirar y da **un casillero por cada dado**.
> - Reglas **D&D 2024** (PHB/DMG/MM 2024).
> - La pantalla **no se proyecta**: se muestran siempre la CA, los PG y las CD de los enemigos.
> - **Solo escritorio**: no hay diseño para móvil.
> - Todos los hechizos son del **PHB 2024**; las hojas de personaje llegan en **PDF** (carpeta `hojas/`) y se convierten a `data/personajes.js`.

---

## Guía de uso

**Abrir:** doble clic en `index.html`. No necesita internet ni instalar nada.

**Antes de la sesión (pestaña Preparar)**
1. Elige la **partida** → carga los hechizos preparados de cada PJ (se pueden cambiar en la ficha).
2. Marca los **PJs** que juegan y añade los **enemigos** (con cantidad).
3. En **Objetos**, asigna el botín a quien lo recoja (y marca "Sintonizado" en la Lengua de fuego).

**Durante el combate (pestaña Combate)**
1. **Iniciativa:** cada uno tira 1d20 físico; escribe solo el número del dado. "Ordenar iniciativa" → arrastra o ▲▼ para empates → "Comenzar combate".
2. **Turno:** pulsa un ataque, conjuro, rasgo u objeto → elige objetivo → la app dice qué tirar y qué número hay que superar → escribe cada dado en su casillero (saltan solos) → "Aplicar".
3. La app suma modificadores, aplica críticos, resistencias, buffs (Bendecir, Escudo de fe…), condiciones y marcas (Fastidiar, Socavar, Saeta guía), y resta PG.
4. Avisos automáticos: salvación de concentración, Castigo abrasador ardiendo, recarga de la Telaraña, regeneración del Engendro, salvaciones de muerte.
5. **↶ Deshacer** (o Ctrl+Z) revierte la última acción. **Ajuste manual** para dañar/curar/añadir condiciones a mano.
6. **Terminar combate** recupera la mitad de las flechas y virotes gastados.

**Entre combates:** PG, espacios de conjuro, rasgos, inventario y muertes se mantienen. Usa **Descanso corto / largo** en Preparar.

**Copia de seguridad:** Preparar → Guardar partida → **Exportar (.json)**. Para restaurar o llevarla a otro ordenador: **Importar…**

**Tu historia:** reemplaza `historia/historia.html` por la tuya y pulsa ⟳.

### Añadir o cambiar datos

| Qué | Archivo |
|---|---|
| Personajes (atributos, armas, trucos, rasgos, inventario inicial) | `data/personajes.js` |
| Armas | `data/armas.js` |
| Trucos y hechizos | `data/hechizos.js` |
| Buffs (Bendecir, Escudo de fe…) | `data/buffs.js` |
| Enemigos | `data/enemigos.js` |
| Partidas: hechizos preparados por sesión y botín | `data/partidas.js` |
| Objetos mágicos y consumibles | `data/objetos.js` |

Tras editar un archivo de datos, recarga la página (Ctrl+F5). El inventario de un PJ se copia de su ficha la primera vez; si cambias el inventario inicial, usa "Borrar todo" o ajústalo en la pestaña Objetos.

---

## 1. Objetivo

Una página web local que me ayude **solo en los combates** de mis partidas de D&D 5e:

- Seleccionar qué personajes (PJ) y qué enemigos participan en el combate.
- Registrar las tiradas de **iniciativa** y ordenar a todos automáticamente.
- En cada turno, decirme **qué dados tirar** y **qué número hay que superar** (CA para pegar, CD para salvaciones).
- Los jugadores tiran **dados físicos**; yo escribo el resultado y la app calcula si acierta, el daño, y actualiza los PG.
- Gestionar **armas adicionales, buffs y objetos** de cada personaje.

No es un VTT (no hay mapa ni tablero): es un "copiloto" del DM.

---

## 2. Diseño de la página (dos columnas)

```
┌───────────────────────────────┬───────────────────────────────┐
│  HISTORIA (izquierda)         │  COMBATE (derecha)            │
│                               │                               │
│  <iframe src="historia.html"> │  [Preparar] [Combate] [Objetos]│
│  (placeholder por ahora)      │                               │
│                               │  Orden de iniciativa          │
│                               │  Turno actual → qué tirar     │
│                               │  Entrada de resultado         │
│                               │  Registro (log) del combate   │
└───────────────────────────────┴───────────────────────────────┘
```

- **Izquierda:** tu historia en HTML. Se carga con un `<iframe>` apuntando a `historia/historia.html`. Mientras tanto se muestra un espacio reservado ("Aquí irá la historia").
- **Derecha:** el asistente de combate con 3 pestañas: **Preparar**, **Combate**, **Objetos**.
- Separador arrastrable entre columnas y botón para ocultar/expandir la historia (útil en pleno combate).
- Cada columna tiene su propio scroll.

---

## 3. Tecnología

| Decisión | Elección | Por qué |
|---|---|---|
| Lenguaje | HTML + CSS + JavaScript puro (sin frameworks) | Se abre con doble clic en `index.html`, sin instalar nada. |
| Datos | Archivos `.js` en `/data` (`window.DATA_PJS = [...]`) | `fetch()` de JSON falla al abrir con `file://`; los `.js` no. |
| Estado del combate | `localStorage` | Si recargo la página no pierdo el combate en curso. |
| Respaldo | Botón Exportar/Importar combate en JSON | Guardar una partida a medias o pasarla a otro PC. |

### Estructura de archivos

```
DND/
├── INSTRUCCIONES.md        ← este plan
├── index.html              ← layout de dos columnas
├── css/
│   └── styles.css
├── js/
│   ├── app.js              ← arranque, pestañas, layout
│   ├── reglas.js           ← reglas 5e (modificadores, CD, críticos, ventaja…)
│   ├── combate.js          ← iniciativa, turnos, rondas, PG, condiciones
│   ├── objetos.js          ← armas extra, buffs, inventario
│   └── estado.js           ← guardar/cargar en localStorage, exportar/importar
├── data/
│   ├── personajes.js       ← tus PJs
│   ├── enemigos.js         ← tus enemigos
│   ├── armas.js            ← armas (base y adicionales)
│   ├── buffs.js            ← buffs / efectos / objetos mágicos
│   ├── hechizos.js         ← trucos y hechizos de nivel 1
│   └── partidas.js         ← hechizos preparados por PJ en cada sesión
└── historia/
    └── historia.html       ← tu historia (la pegas tú)
```

---

## 4. Modelo de datos (lo que necesito que me pases)

Pásame la información en el formato que quieras (texto, tabla, foto de la hoja); yo la convierto a estas estructuras.

### 4.1 Personaje (PJ)

```js
{
  id: "thorin",
  nombre: "Thorin",
  especie: "Enano",                       // 2024: "especie" en lugar de "raza"
  clase: "Guerrero", subclase: null, nivel: 1,   // todos los PJs son nivel 1 (sin subclase aún)
  pgMax: 13,
  ca: 18,
  velocidad: 25,
  competencia: 2,                         // nivel 1 → +2
  atributos: { FUE: 16, DES: 12, CON: 16, INT: 8, SAB: 10, CAR: 10 },
  salvacionesCompetentes: ["FUE", "CON"],
  bonusIniciativa: 1,                     // si no se da, = mod DES
  resistencias: [], inmunidades: [], vulnerabilidades: [],
  armas: ["hacha_batalla", "jabalina"],   // ids de armas.js
  maestrias: ["hacha_batalla"],           // armas cuya maestría puede usar (2024)
  dotes: ["Atacante salvaje"],
  trucos: [],                             // cantrips conocidos (ids de hechizos.js)
  atributoConjuro: null,                  // "INT" | "SAB" | "CAR"
  espaciosConjuro: { 1: 0 },              // nivel 1: normalmente 2 (brujo: 1 de Pacto)
  rasgos: ["Tomar aliento", "Maestría con armas"],
  recursos: [                             // usos que la app descuenta
    { nombre: "Tomar aliento", usos: 2, recarga: "corto/largo" }
  ],
  buffsBase: []                           // buffs siempre activos
}
```

Los **hechizos preparados no van en la ficha**: se eligen **por partida** (ver 4.6), porque cambian de sesión a sesión.

### 4.2 Arma

```js
{
  id: "hacha_batalla",
  nombre: "Hacha de batalla",
  tipo: "cuerpo a cuerpo",      // o "distancia"
  atributo: "FUE",              // FUE, DES o "sutil" (usa el mayor)
  dano: "1d8",                  // "1d10" si se usa a dos manos (versátil)
  tipoDano: "cortante",
  bonusAtaque: 0,               // +1, +2… si es mágica
  bonusDano: 0,
  propiedades: ["versátil"],
  maestria: "Derribar",         // 2024: Hender, Rozar, Mella, Empujar, Socavar, Ralentizar, Derribar, Fastidiar
  alcance: "5 ft"               // o "80/320 ft"
}
```

### 4.3 Buff / efecto / objeto

```js
{
  id: "bendecir",
  nombre: "Bendecir",
  duracionRondas: 10,           // null = permanente / hasta que se quite
  concentracion: true,
  efectos: {
    ataqueExtraDado: "1d4",     // se suma a tiradas de ataque
    salvacionExtraDado: "1d4",
    ca: 0, bonusDano: 0,
    danoExtra: null,            // ej. { dado: "1d6", tipo: "fuego" }
    ventajaEn: [], desventajaEn: [],
    resistencias: []
  }
}
```

### 4.4 Enemigo

```js
{
  id: "orco",
  nombre: "Orco",
  pgMax: 15, pgFormula: "2d8+6",
  ca: 13,
  velocidad: 30,
  atributos: { FUE: 16, DES: 12, CON: 16, INT: 7, SAB: 11, CAR: 10 },
  salvaciones: {},              // bonificadores especiales si tiene
  bonusIniciativa: 1,
  resistencias: [], inmunidades: [], vulnerabilidades: [], inmuneCondiciones: [],
  acciones: [
    { nombre: "Gran hacha", bonusAtaque: 5, dano: "1d12+3", tipoDano: "cortante" },
    { nombre: "Aliento de fuego", cd: 13, salvacion: "DES",
      dano: "6d6", tipoDano: "fuego", mitadSiSalva: true }
  ],
  rasgos: ["Agresivo"],
  vd: "1/2"
}
```

### 4.5 Hechizo / truco

```js
{
  id: "rayo_de_fuego",
  nombre: "Rayo de fuego",
  nivel: 0,                     // 0 = truco (cantrip)
  tiempo: "acción",             // "acción" | "acción adicional" | "reacción"
  alcance: "120 ft",
  resolucion: "ataque",         // "ataque" | "salvacion" | "automatico" (ej. Proyectil mágico) | "utilidad"
  ataque: "distancia",          // si resolucion = "ataque": "distancia" | "cuerpo a cuerpo"
  salvacion: null,              // si resolucion = "salvacion": "DES", "SAB"…
  alSalvar: null,               // "mitad" | "nada"
  dano: "1d10", tipoDano: "fuego",
  curacion: null,               // ej. "1d8+mod" (Curar heridas)
  area: null,                   // ej. "cubo 15 ft" → varios objetivos
  concentracion: false,
  duracionRondas: null,
  aplicaBuff: null,             // id de buffs.js (ej. Bendecir, Escudo de fe)
  aplicaCondicion: null,        // ej. "Asustado"
  aNivelSuperior: null          // no se usa en nivel 1 (solo espacios de nivel 1)
}
```

### 4.6 Partida (sesión)

Antes de cada partida defino qué hechizos preparados lleva cada PJ **para esa sesión**:

```js
// data/partidas.js
{
  id: "sesion_03",
  nombre: "La cripta del norte",
  preparados: {
    "elara": ["curar_heridas", "bendecir", "saeta_guia"],
    "kael":  ["proyectil_magico", "escudo", "dormir"]
  },
  enemigos: ["esqueleto", "zombi", "necrofago"]   // opcional: los enemigos previstos
}
```

- En **Preparar**, elijo la partida y la app carga los hechizos preparados de cada PJ (se pueden cambiar ahí mismo).
- Los **trucos** vienen siempre de la ficha del PJ; los **hechizos de nivel 1** vienen de la partida.

---

## 5. Reglas de D&D 2024 que la app aplicará

### 5.1 Cálculos base
- **Modificador de atributo:** `floor((valor − 10) / 2)`.
- **Bono de ataque con arma:** mod del atributo + competencia + bonus mágico + buffs.
- **Daño con arma:** dado del arma + mod del atributo + bonus mágico + buffs.
- **CD de conjuros del PJ:** `8 + competencia + mod del atributo de conjuro`.
- **Ataque de conjuro del PJ:** `competencia + mod del atributo de conjuro`.
- **Salvación:** mod del atributo (+ competencia si es competente) + buffs.

### 5.2 Entrada de dados: un casillero por dado
Todas las tiradas son físicas. Para cada tirada la app dibuja **un casillero por dado** con su tipo:

```
Daño crítico del Hacha: 2d8 + 3
[ d8: __ ] [ d8: __ ]  + 3   →  Total: 12
```

- Solo se escribe el **valor natural** de cada dado; la app suma modificadores, buffs y dados extra (ej. *Bendecir* añade un casillero `d4`).
- Valida el rango (un d8 no acepta un 9).
- El d20 natural permite detectar **20 = crítico** y **1 = fallo**.
- Con **ventaja/desventaja** aparecen dos casilleros `d20` y la app marca cuál cuenta.
- Atajo opcional: campo "total" para tiradas grandes (ej. 8d6 de *Bola de fuego*) si no quiero escribir dado por dado.
- Tecla Tab salta al siguiente casillero y Enter confirma, para ir rápido.

### 5.3 Iniciativa
1. Al iniciar el combate, la app muestra por cada participante (PJs **y enemigos**): **"Tira 1d20 + X"** con su casillero.
2. **Sorpresa (2024):** los sorprendidos tiran iniciativa con **desventaja** (dos casilleros).
3. Grupos de enemigos iguales pueden compartir **una sola tirada** de iniciativa (opción del DM, 2024).
4. Orden de mayor a menor. **Empates (2024):** el DM decide entre monstruos, los jugadores entre sus PJs, y el DM entre un PJ y un monstruo → la app los marca como empatados y los ordeno arrastrando.
5. Puedo **reordenar arrastrando** y **añadir participantes a mitad del combate** (refuerzos).
6. Enemigos iguales ("Orco ×4") se numeran: Orco 1, Orco 2… con PG independientes.

### 5.4 Turno de ataque (PJ → enemigo)
La app muestra, por ejemplo:

> **Thorin ataca al Orco 2 con Hacha de batalla**
> Tira **1d20 + 6**. Necesitas **13 o más** (CA del Orco).

- Escribo el d20 natural en su casillero.
- **20 natural → crítico:** acierta siempre y se tiran **el doble de dados de daño** (los modificadores no se duplican).
- **1 natural → fallo** automático.
- Si acierta: **"Tira 1d8 + 3 de daño cortante"** → un casillero d8 (o dos si fue crítico).
- La app aplica **resistencia (½), vulnerabilidad (×2) o inmunidad (0)** y resta PG.
- **Ventaja / desventaja:** se calcula sola a partir de condiciones y buffs (ej. objetivo *Derribado*), con botón para forzarla a mano. Si hay de ambas, se anulan.
- Ataques múltiples (Ataque extra) → la app encadena el segundo ataque.
- **Maestría de arma (2024):** tras el ataque la app recuerda el efecto:
  - *Derribar:* el objetivo hace salvación de CON (CD 8 + mod atributo + competencia) o queda Derribado.
  - *Rozar:* si falla, daño = mod del atributo.
  - *Fastidiar:* ventaja en el siguiente ataque contra ese objetivo.
  - *Ralentizar:* −10 ft de velocidad. *Socavar:* desventaja en su próximo ataque. *Empujar:* 10 ft. *Hender:* segundo objetivo adyacente. *Mella:* el ataque extra de arma ligera va dentro de la acción de Ataque.
- **Ataque sin armas (2024):** daño, **Agarrar** o **Empujar**; los dos últimos piden salvación de FUE o DES al objetivo con CD 8 + mod FUE + competencia.

### 5.5 Hechizos de los PJs (nivel 1)
- En su turno, el PJ ve sus **trucos** y sus **hechizos preparados de la partida**, agrupados por tiempo de lanzamiento (acción / acción adicional / reacción).
- **Truco:** gratis, sin espacio. Daño de nivel 1 (dado base, sin escalar).
- **Hechizo de nivel 1:** gasta **1 espacio**; la app muestra los espacios restantes (●●○) y bloquea si no quedan. Brujo: 1 espacio de Pacto que se recupera en descanso corto.
- **Regla 2024 de un solo espacio por turno:** si ya lancé un hechizo con espacio en este turno, la app avisa que no puedo lanzar otro con espacio (sí un truco).
- Según `resolucion`:
  - *Ataque:* "Tira 1d20 + X (competencia + mod de conjuro) contra CA N" → igual que un ataque con arma, incluido crítico.
  - *Salvación:* "El objetivo hace salvación de SAB, CD N" → un casillero d20 por objetivo, daño completo/mitad/nada.
  - *Automático:* sin tirada de ataque, solo daño (ej. Proyectil mágico: 3 dardos de 1d4+1).
  - *Curación / buff / condición:* aplica el efecto con su duración y concentración.
- **Concentración:** si lanzo un segundo hechizo de concentración, la app avisa que se pierde el primero.
- **Reacciones** (ej. *Escudo*): botón "Usar reacción" disponible fuera de turno; la app marca la reacción como gastada hasta el inicio de su turno.

### 5.6 Recursos de clase (nivel 1, 2024)
La app lleva el contador de los usos de cada PJ según su clase. En nivel 1:

| Clase | Recurso / rasgo de combate |
|---|---|
| Guerrero | Tomar aliento (2 usos, 1d10 + nivel PG), Maestría con armas, Estilo de combate |
| Pícaro | Ataque furtivo 1d6 (una vez por turno, con ventaja o aliado adyacente), Maestría con armas |
| Paladín | Imposición de manos (5 PG), espacios de conjuro, Maestría con armas |
| Explorador | Marca del cazador gratis (2 usos) + espacios de conjuro, Maestría con armas |
| Monje | Artes marciales (golpe desarmado 1d6 como acción adicional) |
| Hechicero | Hechicería innata (2 usos: +1 CD y ventaja en ataques de conjuro, 1 min) |
| Brujo | 1 espacio de Pacto, Invocación sobrenatural |
| Clérigo / Druida / Mago | Espacios de conjuro (2); Mago: Recuperación arcana (fuera de combate) |

Sin bardos ni bárbaros en el grupo, así que no se implementan Inspiración bárdica ni Furia.

### 5.7 Hechizos / efectos con salvación de enemigos
> **Aliento de fuego del Dragón** → Thorin debe hacer **salvación de DES (1d20 + 1)** y sacar **15 o más**.
> Si falla: 6d6 fuego. Si pasa: mitad.

- Para varios objetivos (área), pide una salvación por cada uno.

### 5.8 Turno del enemigo (enemigo → PJ)
- La app muestra las acciones del enemigo y la CA del PJ objetivo: **"Tira 1d20 + 5, necesitas 18 (CA de Thorin)"**.
- Tiro yo los dados físicos y los escribo en sus casilleros, igual que con los PJs.
- Si es una acción de salvación, le dice al jugador qué salvación y qué CD, y da los casilleros para su tirada.
- Soporta **Ataque múltiple**, acciones con **Recarga X–6** (la app pide un d6 al inicio del turno para ver si se recarga), usos por día y **acciones legendarias** (se gastan al final del turno de otra criatura).

### 5.9 Seguimiento de estado
- **PG** actuales / máximos, PG temporales (se gastan primero), curación (sin pasar del máximo).
- **Concentración:** al recibir daño, la app avisa: "Salvación de CON CD `max(10, daño/2)` para mantener *Bendecir*".
- **Concentración (2024):** CD = 10 o la mitad del daño, lo que sea mayor, **máximo 30**.
- **Condiciones con el texto de 2024** (cegado, hechizado, ensordecido, asustado, agarrado, incapacitado, invisible, paralizado, petrificado, envenenado, derribado, apresado, aturdido, inconsciente) con su efecto recordado (ej. *Derribado: ataques cuerpo a cuerpo contra él con ventaja*; *Agarrado: velocidad 0 y desventaja al atacar a otros que no sean quien lo agarra*).
- **Agotamiento (2024):** niveles 1–6; cada nivel resta **−2 a todas las pruebas de d20** y **−5 ft de velocidad**; a nivel 6 muere. La app lo suma sola a cada tirada.
- **Inspiración heroica (2024):** marcador por PJ; al usarla, la app abre un casillero nuevo para repetir un dado.
- **Duración** de buffs/condiciones en rondas; se descuentan solas al avanzar ronda.
- **PJ a 0 PG:** inconsciente → en su turno pide **salvación de muerte** (10+ éxito, 20 natural recupera 1 PG, 1 natural = 2 fallos; 3 éxitos estable / 3 fallos muere). Daño estando a 0 = 1 fallo (crítico = 2).
- **Enemigo a 0 PG:** marcado como derrotado y se salta en la iniciativa.
- Contador de **ronda** y botón **"Siguiente turno"**.

### 5.10 Registro del combate
Cada acción queda en un log: *"R2 · Thorin → Orco 2: 17 vs CA 13 ✔ · 9 cortante · Orco 2: 6/15 PG"*. Botón para **deshacer** la última acción.

---

## 6. Pestañas de la columna derecha

### Preparar
- Selector de **partida** → carga los hechizos preparados de cada PJ para esa sesión (editables).
- Lista de PJs (checkbox para marcar quién está en la sesión).
- Buscador de enemigos + cantidad → "Añadir al combate".
- Botón **"Iniciar combate"** → pasa a tirar iniciativa.

### Combate
- Lista de iniciativa (tarjetas con nombre, PG en barra, CA, condiciones).
- Panel del **turno actual**: acciones disponibles (armas, hechizos, acciones del enemigo), selector de objetivo, instrucciones de dados y campos para escribir resultados.
- Botones: Siguiente turno · Curar · Dañar manual · Añadir condición · Terminar combate.

### Objetos
- Por PJ: armas equipadas + **armas adicionales** (añadir/quitar de la lista de `armas.js`).
- **Buffs** activos: activar/desactivar, con duración.
- Inventario simple (pociones con cantidad; usar poción → tira 2d4+2 y cura).

---

## 7. Fases de desarrollo

| Fase | Contenido | Resultado |
|---|---|---|
| **1** | Layout 2 columnas + iframe de historia + pestañas vacías | Página que se abre y se ve |
| **2** | Cargar datos (`/data`) + pestaña Preparar + selector de partida | Elegir PJs, hechizos de la sesión y enemigos |
| **3** | Iniciativa: entrada de tiradas, orden, empates, reordenar | Orden de combate listo |
| **4** | Turnos: ataque con CA, crítico/pifia, ventaja, daño, resistencias, PG | Combate básico jugable |
| **5** | Trucos y hechizos de nivel 1, espacios de conjuro, salvaciones y CD, área, concentración, reacciones, recursos de clase | Hechizos y efectos |
| **6** | Condiciones, duraciones, salvaciones de muerte, log + deshacer | Seguimiento completo |
| **7** | Pestaña Objetos: armas extra, buffs, pociones | Gestión de objetos |
| **8** | Guardado automático, exportar/importar, pulido visual (tema oscuro "pergamino") | Versión final |

Tras cada fase: probarla con un combate de ejemplo antes de seguir.

---

## 8. Lo que necesito de ti

1. **Personajes (nivel 1):** hoja de cada PJ (especie, clase, atributos, CA, PG, armas, **trucos** que conoce, rasgos y dote de origen).
2. **Hechizos de la partida:** qué hechizos de nivel 1 tiene preparados cada PJ para esta sesión.
3. **Armas:** base y adicionales (dado de daño, tipo, bonus mágicos, propiedades, maestría).
4. **Buffs / objetos:** qué hacen exactamente y cuánto duran.
5. **Enemigos:** bloque de estadísticas (CA, PG, atributos, acciones con bono de ataque/CD y daño).
6. **Tu `historia.html`** cuando la tengas lista.

Si un hechizo o truco es del PHB 2024, basta con el nombre: yo relleno sus datos (alcance, dados, salvación…). Solo necesito detalle de los homebrew.

---

## 9. Preguntas abiertas

Ninguna por ahora. Siguiente paso: recibir los datos y empezar la **fase 1**.
