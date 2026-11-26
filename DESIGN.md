# ORBIT — DESIGN.md
**Sistema de Diseño Oficial: *Nocturnal Observatory (Astronomía Impresionista Casi Realista)***

> Construido mediante un proceso multipasada combinando:
> 1. **`ui-ux-pro-max` (`nextlevelbuilder/ui-ux-pro-max-skill`)**: Arquitectura estricta de tokens en 3 capas (Primitivos → Semánticos → Componentes), contraste WCAG AA/AAA y coherencia de interfaz de producto.
> 2. **`taste-skill` (`Leonxlnx/taste-skill`)**: Dirección editorial, arte astronómico impresionista real (cero `placehold.co`, cero *AI slop*), diales de varianza/movimiento/densidad y composición asimétrica para las superficies de entrada/bienvenida.
> 3. **`web-design-guidelines` (`vercel-labs/agent-skills`)**: Auditoría obligatoria de accesibilidad, foco visible, semántica nativa, formularios seguros, truncado y `prefers-reduced-motion`.

---

## 1. Dirección Estética y Filosofía

**Temática:** *Astronomía casi realista impresionista* — inspirada en el realismo espacial clásico (Chesley Bonestell), la atmósfera nocturna pictórica del impresionismo (pinceladas sutiles de polvo cósmico y luz de horizonte) y la precisión de los instrumentos de un observatorio moderno (almanaques astronómicos, retículas finas, lecturas monoespaciadas).

### Diales de `taste-skill` para Orbit
| Superficie | `DESIGN_VARIANCE` | `MOTION_INTENSITY` | `VISUAL_DENSITY` |
| :--- | :--- | :--- | :--- |
| **Auth / Entrada Editorial** | `6/10` (Split asimétrico 44/56 con lienzo astronómico a sangre) | `4/10` (Entradas serenas y físicas) | `3/10` (Aire editorial generoso) |
| **Workspace / Chat / Grupos** | `3/10` (Ergonomía estricta de herramienta diaria) | `3/10` (Micro-feedback silencioso) | `7/10` (Alta legibilidad y densidad útil) |
| **Videollamadas / Modales** | `4/10` (Enfoque espacial inmersivo) | `4/10` (Transiciones amortiguadas) | `5/10` (Equilibrio controles/video) |

### Anti-Patrones Prohibidos
- Cero *blobs* radiales CSS borrosos flotando detrás de la app.
- Cero gradientes violeta-cian genéricos o títulos con texto degradado.
- Cero imágenes `placehold.co` en logos o avatares principales.
- Cero *card-in-card* con sombras neón en listas de grupos o amigos.
- Cero colores hexadecimales sueltos dentro de componentes SCSS (todo pasa por tokens `var(--...)`).

---

## 2. Arquitectura de Tokens en 3 Capas (`ui-ux-pro-max`)

### Capa 1 — Tokens Primitivos (`src/styles/_primitives-tokens.scss`)
Paleta nocturna con sutil subtono amatista-obsidiana y luz estelar cálida (*Starlight Ivory*), preservando el **morado original de Orbit** (`#6D28D9` / `#7C3AED` / `#8B5CF6`) como único acento de marca.

- **Nocturne Neutrals (70% Base):**
  - `--p-void-950`: `#08070D` (Cielo profundo / Rail)
  - `--p-void-900`: `#0E0C17` (Sidebar / Paneles secundarios)
  - `--p-void-850`: `#13101F` (Canvas principal de chat)
  - `--p-void-800`: `#1A162B` (Superficie elevada / Modales / Composer)
  - `--p-void-750`: `#231E38` (Hover interactivo)
  - `--p-void-700`: `#2D2747` (Estado activo neutral)
- **Starlight Neutrals (20% Texto y Retículas):**
  - `--p-star-100`: `#F4F0E8` (Marfil estelar — texto primario, evita fatiga del `#FFF` puro)
  - `--p-star-300`: `#B8B0C9` (Texto secundario — contraste > 7:1 sobre `--p-void-850`)
  - `--p-star-500`: `#7C7492` (Metadatos, timestamps, placeholders — contraste ≥ 4.5:1)
- **Orbit Amethyst (10% Acento — fiel al morado original):**
  - `--p-amethyst-700`: `#5B21B6` (Estado presionado)
  - `--p-amethyst-600`: `#6D28D9` (Morado original Orbit — CTA sólido)
  - `--p-amethyst-500`: `#7C3AED` (Hover CTA / Acento interactivo)
  - `--p-amethyst-400`: `#A78BFA` (Enlaces, resaltados tipográficos sobre oscuro)
  - `--p-amethyst-300`: `#C4B5FD` (Etiquetas suaves)
- **Semántica Astronómica:**
  - `--p-aurora-500`: `#34D399` (En línea / Llamada activa)
  - `--p-solar-500`: `#F59E0B` (Trabajando / Precaución)
  - `--p-nova-500`: `#F43F5E` (Error / Colgar / Acción destructiva)

### Capa 2 — Tokens Semánticos (`src/styles/_tokens.scss`)
Mapeo estricto bajo la **Regla 70 / 20 / 10**:
- **70% Superficies:** `--orbit-bg-canvas`, `--orbit-bg-sidebar`, `--orbit-bg-surface`, `--orbit-bg-elevated`, `--orbit-bg-hover`.
- **20% Estructura y Retículas:** `--orbit-border-subtle`, `--orbit-border-default`, `--orbit-border-strong`, `--orbit-text-primary`, `--orbit-text-secondary`, `--orbit-text-muted`.
- **10% Acento y Semántica:** `--orbit-accent`, `--orbit-accent-hover`, `--orbit-accent-pressed`, `--orbit-accent-text`, `--orbit-accent-soft`, `--orbit-accent-border`, `--orbit-success`, `--orbit-warning`, `--orbit-danger`.

### Capa 3 — Tokens de Componente (`src/styles/_components-tokens.scss`)
Variables dedicadas por componente (`--btn-*`, `--input-*`, `--sidebar-*`, `--chat-*`, `--modal-*`, `--call-*`) para que el ajuste fino visual ocurra en un solo archivo.

---

## 3. Tipografía Editorial y Técnica

| Rol | Familia | Uso | Tracking / Características |
| :--- | :--- | :--- | :--- |
| **Display Astronómico** | `Newsreader` (Serif óptica) | Titulares de bienvenida/Auth, marca editorial, estados vacíos poéticos | `-0.025em`, cursiva sutil para énfasis |
| **Interfaz y Mensajería** | `Plus Jakarta Sans` | Navegación, cuerpo de mensajes, botones, modales, formularios | `-0.015em` en títulos UI, `0` en cuerpo (`14px`, `line-height: 1.55`, máx. `65ch`) |
| **Telemetría / Técnico** | `JetBrains Mono` | Horas de mensajes, duración de llamadas, badges numéricos, coordenadas decorativas | `font-variant-numeric: tabular-nums` |

---

## 4. Espaciado, Radios Concéntricos y Movimiento

- **Escala Base 4px:** `4 / 8 / 12 / 16 / 20 / 24 / 32 / 48px`.
- **Radios Concéntricos:** `6px` (`sm`), `8px` (`md`), `12px` (`lg`), `16px` (`xl`), `9999px` (`full`).
- **Curvas Físicas (`_motion.scss`):**
  - `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)` (entradas de modales, mensajes, popovers).
  - `--ease-standard: cubic-bezier(0.2, 0, 0, 1)` (hover, foco, estados activos).
  - `--ease-orbital: cubic-bezier(0.22, 1, 0.36, 1)` (emergencias astronómicas de contenido).
  - Respeto total a `@media (prefers-reduced-motion: reduce)`.

### Coreografía de Cargas y Transiciones (Una firma por módulo — cero repetición)
| Módulo | Variante (`OrbitLoaderComponent`) | Transición de salida → contenido |
| :--- | :--- | :--- |
| **Chat / Mensajes** | `singularity` (Hoyo Negro Gargantua) | Onda gravitacional + colapso del horizonte → los mensajes emergen desde el centro (`orbitEmergeFromSingularity` con *stagger*). |
| **Sidebar de Grupos** | `eclipse` (Skeletons con barrido estelar) | Cascada orbital horizontal (`orbitCascadeX`). |
| **Lista de Amigos** | `constellation` (Trazado SVG de constelación) | Florecimiento estelar escalonado (`orbitConstellationBloom`). |
| **Solicitudes Pendientes** | `pulsar` (Ondas concéntricas de señal) | Fijación de señal con destello de borde amatista (`orbitSignalLock`). |
| **Buscador de Amigos** | `astrolabe` (Retícula giratoria de cuadrante) | Enfoque óptico de telescopio (`orbitOpticalFocus`). |
| **Inline / Modales** | `comet` (Arco minimalista de cometa) | Crossfade táctil limpio. |

---

## 5. Activos Visuales Astronómicos y Atmósferas Duales (`public/assets/`)
Orbit soporta dos atmósferas astronómicas conmutables mediante `ThemeService` (`[data-theme="dark"]` y `[data-theme="twilight"]`, persistido en `localStorage`):

- **Noche Profunda (`dark`, predeterminado):** Paneles translúcidos oscuros (`rgba(14, 12, 23, 0.56)` / `rgba(19, 16, 31, 0.34)` con `backdrop-filter: blur(14px)`) dejando ver de forma continua la pintura nocturna `assets/orbit-sky-ambient.webp` y el horizonte planetario `assets/orbit-observatory-hero.webp` en Auth.
- **Cielo Estrellado (`twilight`, "modo claro" astronómico):** Atmósfera crepuscular más luminosa sin abandonar el cosmos — superficies índigo-amatista translúcidas (`rgba(29, 23, 56, 0.48)` / `rgba(35, 29, 69, 0.24)`), bordes de luz estelar más vivos y el lienzo `assets/orbit-sky-starlight.webp` (Vía Láctea brillante al óleo con abundantes estrellas cálidas).
- **Avatares astronómicos por defecto (`assets/avatars/*.webp`):** Colección de 6 pinturas cuadradas ligeras en WebP (`nebula`, `galaxy`, `ringed-planet`, `comet`, `constellation`, `eclipse`) asignadas aleatoriamente en registro (incluyendo Google OAuth, ignorando la foto de Google), creación de grupos y comunidades, con fallback determinista vía `orbitAvatar` pipe.
- **Emblema SVG de Orbit (`assets/orbit-emblem.svg` y `assets/orbit-dm-icon.svg`):** Astrolabio/planeta minimalista de trazo fino `1.5px` con anillo inclinado y estrella guía (reemplaza todos los `placehold.co` de marca).

---

## 6. Checklist de Auditoría (`web-design-guidelines`)
Antes de cerrar cualquier iteración, cada plantilla modificada debe cumplir:
1. Botones solo-icono con `aria-label` explícito e iconos decorativos con `aria-hidden="true"`.
2. Elementos interactivos con `<button>` / `<a>` nativos o soporte de teclado (`tabindex`, `role`, `(keydown.enter)`).
3. Indicadores `:focus-visible` nítidos en todo control (nunca `outline: none` sin reemplazo).
4. Formularios con `autocomplete`, `spellcheck="false"` en correos, `aria-live="polite"` en alertas/errores y botones de submit habilitados con feedback de carga.
5. Contenedores flexibles con `min-width: 0` y truncado seguro en nombres largos.
6. Respeto estricto a `prefers-reduced-motion`.
