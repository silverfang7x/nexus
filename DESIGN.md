# NEXUS Design System

Single source of truth extracted from `components/ui/stitch/` reference screens (Main Canvas, Debate, Code, Plan, Mobile). All future components **must** match these tokens and patterns exactly.

---

## Colors

### Canvas & base

| Token | Value | Usage |
|---|---|---|
| `bg-canvas` | `#0A0A0F` | Page body background (darker than M3 `background`) |
| `background` / `surface` | `#131319` | M3 base surface |
| `surface-dim` | `#131319` | Dimmed surface layer |
| `surface-container-lowest` | `#0e0d14` | Deepest inset (input areas, graph canvas) |
| `surface-container-low` | `#1c1b21` | Sidebar panels, bottom sheet |
| `surface-container` | `#201f25` | Panel header bars |
| `surface-container-high` | `#2a2930` | Elevated container |
| `surface-container-highest` | `#35343b` | Highest elevation |
| `surface-variant` | `#35343b` | Hover states on controls |
| `surface-bright` | `#3a383f` | Bright surface accent |

### Primary (lavender)

| Token | Value | Usage |
|---|---|---|
| `primary` | `#c5c0ff` | Brand accent, active states, glows, links |
| `primary-container` | `#8c84eb` | Filled primary containers |
| `primary-fixed` | `#e4dfff` | Fixed primary tone |
| `primary-fixed-dim` | `#c5c0ff` | Dimmed fixed primary |
| `on-primary` | `#2a1c84` | Text on primary fill |
| `on-primary-container` | `#23127d` | Text on primary container |
| `on-primary-fixed` | `#140067` | Text on primary fixed |
| `on-primary-fixed-variant` | `#41379b` | Variant text on primary fixed |
| `inverse-primary` | `#5951b4` | Inverse primary |
| `surface-tint` | `#c5c0ff` | Surface tint overlay |

### Secondary (coral)

| Token | Value | Usage |
|---|---|---|
| `secondary` | `#ffb4a4` | Secondary accent |
| `secondary-container` | `#8d1701` | Secondary container fill |
| `secondary-fixed` | `#ffdad3` | Fixed secondary |
| `secondary-fixed-dim` | `#ffb4a4` | Dimmed secondary fixed |
| `on-secondary` | `#640d00` | Text on secondary |
| `on-secondary-container` | `#ff9a85` | Text on secondary container |
| `on-secondary-fixed` | `#3e0500` | Text on secondary fixed |
| `on-secondary-fixed-variant` | `#8d1701` | Variant on secondary fixed |

### Tertiary (amber)

| Token | Value | Usage |
|---|---|---|
| `tertiary` | `#efc04c` | Warning / timeline / agent accent |
| `tertiary-container` | `#b38b15` | Tertiary container |
| `tertiary-fixed` | `#ffdf98` | Fixed tertiary (timeline hover) |
| `tertiary-fixed-dim` | `#efc04c` | Dimmed tertiary fixed |
| `on-tertiary` | `#3f2e00` | Text on tertiary |
| `on-tertiary-container` | `#362700` | Text on tertiary container |
| `on-tertiary-fixed` | `#251a00` | Text on tertiary fixed |
| `on-tertiary-fixed-variant` | `#5a4300` | Variant on tertiary fixed |

### Error (challenger / deletion)

| Token | Value | Usage |
|---|---|---|
| `error` | `#ffb4ab` | Challenger agent, diff deletions, alerts |
| `error-container` | `#93000a` | Error container fill |
| `on-error` | `#690005` | Text on error |
| `on-error-container` | `#ffdad6` | Text on error container |

### Text & outline

| Token | Value | Usage |
|---|---|---|
| `on-background` / `on-surface` | `#e5e1ea` | Primary text |
| `on-surface-variant` | `#c8c4d4` | Secondary / muted text |
| `outline` | `#928f9d` | Default outline, code comments |
| `outline-variant` | `#474552` | Dividers, borders, chips |
| `inverse-surface` | `#e5e1ea` | Inverse surface |
| `inverse-on-surface` | `#313036` | Text on inverse surface |

### Agent neon palette (swarm panels)

| Token | Value | Border (30% opacity) | Usage |
|---|---|---|---|
| `agent-teal` | `#2dd4bf` | `rgba(45, 212, 191, 0.3)` | Analytics / teal agent |
| `agent-blue` | `#60a5fa` | `rgba(96, 165, 250, 0.3)` | Logic / blue agent |
| `agent-purple` | `#c084fc` | `rgba(192, 132, 252, 0.3)` | Research / purple agent |
| `agent-coral` | `#fb7185` | `rgba(251, 113, 133, 0.3)` | Plan executor / active agent |

### Glass & overlay alphas

| Token | Value | Usage |
|---|---|---|
| `glass-bg` | `rgba(255, 255, 255, 0.04)` | Glass panel background |
| `glass-border` | `rgba(255, 255, 255, 0.08)` | Glass panel border |
| `glass-bg-subtle` | `rgba(255, 255, 255, 0.02)` | Mobile agent panel bg (`bg-white/[0.02]`) |
| `glass-bg-hover` | `rgba(255, 255, 255, 0.05)` | Timeline node labels, hover fills |
| `grid-line` | `rgba(255, 255, 255, 0.02)` | Canvas grid lines |
| `edge-line` | `rgba(255, 255, 255, 0.1)` | Graph connection strokes |
| `primary-overlay-5` | `primary / 5%` (`bg-primary/5`) | Active tab bg, agent header tint |
| `primary-overlay-10` | `primary / 10%` | Center node fill, status badges |
| `primary-overlay-20` | `primary / 20%` | Avatar bg, hover on controls |
| `primary-overlay-30` | `primary / 30%` | Active task border, badge border |
| `primary-overlay-40` | `primary / 40%` | Debate thesis node border, connection lines |
| `primary-overlay-50` | `primary / 50%` | Avatar border, diff line accents |
| `primary-overlay-70` | `primary / 70%` | Secondary graph nodes |
| `error-overlay-5` | `error / 5%` | Challenger header bg |
| `error-overlay-10` | `error / 10%` | Deletion diff rows |
| `error-overlay-30` | `error / 30%` | Challenger badge border |
| `error-overlay-40` | `error / 40%` | Anti-thesis node border |
| `error-overlay-50` | `error / 50%` | Deletion diff gutter |
| `error-overlay-80` | `error / 80%` | Deletion code text |
| `tertiary-overlay-5` | `tertiary / 5%` | Beta agent header |
| `surface-overlay-20` | `surface / 20%` | Constraints sidebar |
| `surface-overlay-40` | `surface / 40%` | Top nav, header bars |
| `surface-overlay-80` | `surface / 80%` | Right panel, mobile sheet |
| `outline-variant-10` | `outline-variant / 10%` | Primary dividers (`border-outline-variant/10`) |
| `outline-variant-20` | `outline-variant / 20%` | Panel header dividers, chip borders |
| `outline-variant-30` | `outline-variant / 30%` | Stat chips, footer buttons |
| `outline-variant-50` | `outline-variant / 50%` | Execute button, drag handle |
| `radial-primary` | `rgba(197, 192, 255, 0.1)` | Debate canvas center glow |
| `line-primary-mobile` | `rgba(197, 192, 255, 0.2)` | Mobile graph edges |
| `tertiary-glow` | `rgba(239, 192, 76, 0.6)` | Active timeline status dot shadow |
| `primary-glow-20` | `rgba(197, 192, 255, 0.2)` | Mobile FAB shadow |
| `primary-glow-30` | `rgba(197, 192, 255, 0.3)` | Center node glow, pulse min |
| `primary-glow-40` | `rgba(197, 192, 255, 0.4)` | Mobile node default shadow |
| `primary-glow-50` | `rgba(197, 192, 255, 0.5)` | Primary graph node glow |
| `primary-glow-60` | `rgba(197, 192, 255, 0.6)` | Mobile node pulse max |
| `noise-opacity` | `0.08` (8%) | Grain texture overlay |

### Code syntax colors

| Token | Value | Maps to |
|---|---|---|
| `code-highlight` | `#c5c0ff` | Identifiers, highlights → `primary` |
| `code-keyword` | `#efc04c` | Keywords → `tertiary` |
| `code-string` | `#ffb4a4` | Strings → `secondary` |
| `code-comment` | `#928f9d` | Comments → `outline` |
| `code-editor-bg` | `#0a0a0f` at 80% | Diff editor background |

---

## Typography

### Font families

| Token | Family | Loaded weights | Role |
|---|---|---|---|
| `font-body-md` / `font-body-lg` | **Geist** | 400 | Body copy, UI text |
| `font-label-caps` / `font-mono-code` | **JetBrains Mono** | 400, 500 | Labels, badges, terminal streams, code |
| `font-display-lg` / `font-display-xl` / `font-headline-md` / `font-headline-sm` | **Syne** | 600, 700, 800 | Headlines, logo, section titles |
| *(icons)* | **Material Symbols Outlined** | 100–700, FILL 0–1 | All iconography |

### Type scale (canonical tokens)

| Token | Size | Weight | Line-height | Letter-spacing | Font |
|---|---|---|---|---|---|
| `display-xl` | 72px | 800 | 1.1 | −0.02em | Syne |
| `display-lg` | 48px | 700 | 1.1 | −0.01em | Syne |
| `headline-md` | 32px | 700 | 1.2 | — | Syne |
| `headline-sm` | 24px | 600 | 1.3 | — | Syne |
| `body-lg` | 18px | 400 | 1.6 | — | Geist |
| `body-md` | 16px | 400 | 1.6 | — | Geist |
| `label-caps` | 12px | 500 | 1.0 | 0.1em (uppercase) | JetBrains Mono |
| `mono-code` | 14px | 400 | 1.5 | — | JetBrains Mono |

### Ad-hoc sizes used in components

| Size | Weight | Usage |
|---|---|---|
| 10px | 400–700 | CPU %, status badges, stat chips, timeline labels, version string |
| 8px | 700 | Mobile agent avatar letter |
| 14px | 400 | Footer nav icons, constraint icons |
| 16px | 600 | Right-panel mode nav labels (`tracking-widest`) |
| 18px | — | Side nav / mode icons |
| 20px | — | Canvas toolbar icons |
| 24px | normal | Default Material Symbol size |

### Typography pairings (always apply both classes)

```
text-{token} font-{token}     →  e.g. text-label-caps font-label-caps
text-headline-sm font-display-lg font-bold tracking-tighter   →  NEXUS logo
text-mono-code font-mono-code →  agent thought streams
leading-tight                   →  compact terminal output
leading-relaxed                 →  mobile agent body text
tracking-widest                 →  mode nav labels (CODE screen)
uppercase                       →  status badges, CTA buttons
```

---

## Spacing

### Design tokens

| Token | Desktop | Mobile | Usage |
|---|---|---|---|
| `margin` | 48px | 16px | Page horizontal padding (`px-margin`) |
| `gutter` | 24px | 16px | Section gaps, nav padding (`py-gutter`, `gap-gutter`) |
| `unit` | 4px | 4px | Micro spacing (`space-x-unit`, `space-y-unit`, `gap-unit`) |
| `container-max` | 1440px | 1440px | Max content width (`max-w-container-max`) |

### Layout dimensions

| Element | Value |
|---|---|
| Side nav width | `w-64` (256px) |
| Agent sidebar | `w-80` (320px) → `lg:w-96` (384px) |
| Right control panel | `w-96` (384px) |
| Code diff panel | `md:w-[45%]` → `lg:w-[50%]` |
| Panel header height | `h-12` (48px) |
| Agent stream body | `h-24` (96px) fixed scroll |
| Top nav offset | `pt-[80px]` |
| Mobile bottom sheet | `h-[751px]` |
| Mobile FAB | `w-14 h-14` (56px) |
| Graph canvas (main) | `w-[600px] h-[600px]` |
| Grid cell (main canvas) | 40px × 40px |
| Grid cell (plan timeline) | 48px × 48px |

### Padding scale (used values)

`p-1` · `p-2` · `p-3` · `p-4` · `p-6` · `p-8` · `p-12` · `px-1.5` · `px-2` · `px-3` · `px-4` · `px-6` · `px-margin` · `py-0.5` · `py-1` · `py-2` · `py-3` · `py-4` · `py-gutter` · `pl-2` · `pl-4` · `pt-4` · `pt-6` · `pb-1` · `pb-2` · `pr-4`

### Margin scale (used values)

`m-4` · `mb-1` · `mb-2` · `mb-3` · `mb-4` · `mb-6` · `mb-8` · `mt-0` · `mt-1` · `mt-2` · `mt-4` · `mt-8` · `mt-auto` · `mr-2` · `mr-3`

### Gap scale (used values)

`gap-1` · `gap-2` · `gap-3` · `gap-4` · `gap-6` · `gap-12` · `gap-16` · `gap-gutter` · `space-x-2` · `space-x-4` · `space-x-6` · `space-x-unit` · `space-x-gutter` · `space-y-2` · `space-y-3` · `space-y-4` · `space-y-6` · `space-y-unit`

### Borders

#### Radius (canonical: **sharp / 0px**)

Main Canvas explicitly overrides all radii to `0px`. Use `rounded-none` everywhere unless a sub-component spec says otherwise.

| Token | Value | Notes |
|---|---|---|
| `radius-none` | `0px` | **Default for NEXUS** — panels, nodes, buttons, chips |
| `radius-sm` | `0.25rem` (4px) | Present in tailwind config but overridden on main canvas |
| `radius-lg` | `0.5rem` (8px) | Debate center node rings only |
| `radius-xl` | `0.75rem` (12px) | — |
| `radius-full` | `9999px` | Mobile drag handle pill, pulse dots, debate orbit rings |

#### Width & color patterns

| Pattern | Usage |
|---|---|
| `border` (1px) | Default panel border |
| `border-b` | Section dividers, tab underlines |
| `border-l-2 border-primary` | Active side-nav tab indicator |
| `border-b-2 border-primary` | Active top-nav / mobile horizontal tab |
| `border-l-2 border-error/50` | Diff deletion gutter |
| `border-l-2 border-primary` | Diff addition gutter, active command stream |
| `border-outline-variant/10` | Primary dividers (nav, panels, sidebars) |
| `border-outline-variant/20` | Agent panel header dividers, legend dividers |
| `border-outline-variant/30` | Stat chips, NEW SESSION button, task tags |
| `border-outline-variant/50` | Execute button, plan session button |
| `border-primary/30` · `/40` · `/50` | Active agent, thesis nodes, badges |
| `border-error/30` · `/40` · `/50` | Challenger nodes, deletion rows |
| `border-neon-{color}` | Agent avatar borders (teal/blue/purple/coral at 30%) |
| `border-transparent` → `hover:border-outline-variant/30` | Canvas toolbar buttons |

### Shadows & glow effects

| Token | Value | Usage |
|---|---|---|
| `glow-node-primary` | `0 0 15px rgba(197, 192, 255, 0.3)` | Center graph node |
| `glow-node-primary-strong` | `0 0 15px rgba(197, 192, 255, 0.5)` | Primary dependency node |
| `glow-tertiary-dot` | `0 0 8px rgba(239, 192, 76, 0.6)` | Plan mode status indicator |
| `glow-fab` | `0 0 20px rgba(197, 192, 255, 0.2)` | Mobile floating action button |
| `glow-node-mobile` | `0 0 15px 5px rgba(197, 192, 255, 0.4)` | Mobile graph nodes (static) |
| `glow-node-mobile-pulse-min` | `0 0 10px 2px rgba(197, 192, 255, 0.3)` | Mobile pulse keyframe 0% |
| `glow-node-mobile-pulse-max` | `0 0 20px 8px rgba(197, 192, 255, 0.6)` | Mobile pulse keyframe 100% |

No `filter:` drop-shadow used; all glow is via `box-shadow`.

### Glassmorphism

#### Base glass panel

```css
.glass-panel {
  background-color: rgba(255, 255, 255, 0.04);   /* glass-bg */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);   /* glass-border */
}
```

#### Active glass variants

```css
.glass-panel-active-primary { border-color: #c5c0ff; }  /* primary */
.glass-panel-active-error   { border-color: #ffb4ab; }  /* error */
```

#### Contextual glass stacks

| Surface | Background | Backdrop | Border |
|---|---|---|---|
| Top nav / header | `bg-surface/40` | `backdrop-blur-xl` | `border-b border-outline-variant/10` |
| Side nav | `bg-surface-container-low/40` | `backdrop-blur-xl` | `border-r border-outline-variant/10` |
| Right panel | `bg-surface/80` | `backdrop-blur-md` | `border-l border-outline-variant/10` |
| Agent sidebar | `bg-surface-container-low/20` or `/50` | — | `border-r border-outline-variant/10` |
| Mobile bottom sheet | `bg-surface-container-low/80` | `backdrop-blur-2xl` | `border-t border-outline-variant/20` |
| Mobile agent panel | `bg-white/[0.02]` | — | `border border-outline-variant/10` |
| Mobile FAB | `bg-primary/10` | `backdrop-blur-md` | `border border-primary` |

#### Grain texture (8% noise)

Fixed overlay or body background-image via SVG fractal noise (`baseFrequency: 0.65`, `numOctaves: 3`, `opacity: 0.08`). Plan mode uses `baseFrequency: 0.85`.

#### Canvas grid backgrounds

```css
/* Main canvas — 40px grid */
background-size: 40px 40px;
background-image:
  linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
  linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);

/* Plan timeline — 48px grid */
background-size: 48px 48px;
/* same line color */
```

---

## Components

### Top navigation bar

```
fixed/sticky top-0 w-full z-40/20
bg-surface/40 backdrop-blur-xl
border-b border-outline-variant/10
px-margin py-4
flex justify-between items-center
```

- **Logo:** `text-headline-sm font-display-lg font-bold tracking-tighter text-primary`
- **Nav links (inactive):** `text-label-caps font-label-caps text-on-surface-variant hover:text-primary transition-colors duration-200`
- **Nav links (active):** `text-primary border-b-2 border-primary pb-1`
- **Icon buttons:** `text-on-surface-variant hover:text-primary scale-95 transition-transform duration-200`

### Side navigation (mode tabs)

Container: `w-64 h-screen bg-surface-container-low/40 backdrop-blur-xl border-r border-outline-variant/10 py-gutter`

**Inactive tab:**
```
flex items-center gap-3
text-on-surface-variant
pl-4 py-2 (or py-3)
hover:bg-primary/5 hover:text-primary
transition-all
group (optional: icon scale-110 on hover)
```

**Active tab:**
```
flex items-center gap-3
text-primary
border-l-2 border-primary
pl-4 py-2 (or py-3)
bg-primary/5
translate-x-1
duration-200
```
Active icon uses `font-variation-settings: 'FILL' 1` where applicable.

**Mobile horizontal tabs:** same colors but `border-b-2 border-primary pb-2 px-4` instead of left border.

### Agent panels — stacked swarm (Main Canvas)

```
glass-panel m-4 flex-shrink-0
├── header: border-b border-outline-variant/10 p-2 flex justify-between
│   ├── left: flex items-center space-x-2
│   │   ├── avatar: w-4 h-4 border border-neon-{color} text-neon-{color}
│   │   │            text-[10px] font-mono-code font-bold  (letter inside)
│   │   └── name: text-label-caps font-label-caps text-neon-{color}
│   └── right: text-[10px] font-mono-code text-on-surface-variant  (CPU %)
└── body: p-3 h-24 overflow-y-auto
         text-mono-code font-mono-code text-on-surface-variant opacity-80 leading-tight
         lines prefixed with "> "
```

**Active agent variant:** add `border-neon-coral` on panel; avatar becomes `bg-neon-coral text-background` (filled); status shows `ACTIVE` in `text-neon-coral font-bold`; highlighted lines use agent color + `blinking-cursor`.

### Agent panels — debate split (Advocate / Challenger)

```
flex-1 flex flex-col glass-panel glass-panel-active-{primary|error}
m-4 mb-2 (advocate) / mt-2 (challenger) overflow-hidden
├── header: border-b border-outline-variant/20 p-3 flex justify-between
│            bg-primary/5 (advocate) | bg-error/5 (challenger)
│   ├── avatar: w-6 h-6 glitch-avatar bg-{color}/20 border border-{color}/50
│   │            text-{color} text-label-caps font-label-caps
│   ├── title: text-label-caps font-label-caps text-{primary|error}
│   └── badge: px-2 py-0.5 bg-{color}/10 border border-{color}/30
│              text-{color} text-[10px] font-mono-code uppercase
└── body: flex-1 p-4 overflow-y-auto space-y-3
          font-mono-code text-mono-code text-on-surface-variant/80
          highlighted lines: text-primary | text-error
          pulse dot: h-2 w-2 rounded-full bg-{color} animate-pulse mt-4
```

**Glitch avatar pattern:**
```css
background: repeating-linear-gradient(
  45deg,
  rgba(255, 255, 255, 0.1),
  rgba(255, 255, 255, 0.1) 2px,
  transparent 2px,
  transparent 4px
);
```

### Agent panels — mobile bottom sheet

```
border border-outline-variant/10 bg-white/[0.02] flex flex-col
├── header: p-3 border-b border-outline-variant/10 bg-{agent-color}/5
│   ├── avatar: w-4 h-4 bg-{color} text-[8px] font-mono-code text-surface font-bold
│   └── status: text-[10px] font-mono-code text-{color}/60
└── body: p-4 font-mono-code text-mono-code text-on-surface-variant leading-relaxed
          active stream: border-l-2 border-primary ml-2 pl-2
```

Agent colors on mobile: `error` (Alpha), `tertiary` (Beta), `primary` (Core).

### Graph nodes

**Center hub (Main Canvas):**
```
w-8 h-8 rounded-none
border border-primary bg-primary/10
shadow-[0_0_15px_rgba(197,192,255,0.3)]
flex items-center justify-center z-10
inner dot: w-2 h-2 bg-primary
```

**Peripheral nodes:**
```
w-4 h-4 rounded-none
border border-outline-variant bg-surface
```

**Code mode nodes:**
- Hub: `w-4 h-4 bg-primary rounded-none shadow-[0_0_15px_rgba(197,192,255,0.5)] hover:scale-125`
- Leaf: `w-3 h-3 bg-primary/70 border border-primary hover:scale-125`

**Debate canvas nodes:**
```
glass-panel border-{primary|error}/40 px-4 py-2
hover:border-{primary|error} transition-colors cursor-pointer
connection: absolute h-[1px] bg-{color}/40 w-48..56 rotated
```

**Debate center nexus:**
```
w-32 h-32 border border-outline-variant/20 rounded-full
  └── w-16 h-16 border border-primary/50 bg-primary/10 rounded-full animate-spin
```

**Timeline nodes (Plan):**
- Standard: `fill: #efc04c` (tertiary), `stroke: #0A0A0F`, `stroke-width: 2`, `r: 4`
- Active: `fill: #c5c0ff`, pulse ring `rgba(197,192,255,0.2) r: 8`
- Future: `fill: none`, dashed stroke `#efc04c`
- Hover: `fill: #ffdf98`, `r: 6`

**Graph edges:** `stroke: rgba(255,255,255,0.1)` or `#c5c0ff` at `stroke-width: 1` (0.5 for tertiary edges).

### Stat / info chips

```
text-[10px] font-mono-code
px-2 py-1
border border-outline-variant/30
text-on-surface-variant  (neutral)
text-primary             (highlighted, e.g. TENSION: NOMINAL)
```

### Panel chrome (Code / graph containers)

```
glass-panel flex flex-col
├── header: h-12 border-b border-outline-variant/10 px-4
│            bg-surface-container/50 flex justify-between items-center
│   ├── icon + text-label-caps font-label-caps text-on-surface
│   └── status chips or action button
└── body: flex-1 overflow-auto
```

**Apply button:** `px-3 py-1 bg-primary/10 text-primary border border-primary/30 text-label-caps font-label-caps hover:bg-primary hover:text-on-primary`

### Query input (Main Canvas)

```
label: text-label-caps font-label-caps text-on-surface-variant mb-2
textarea: w-full h-32 bg-transparent border-0 border-b border-outline-variant
          text-body-md font-body-md text-on-surface
          focus:ring-0 focus:border-b-2 focus:border-primary
          placeholder:text-on-surface-variant/50 resize-none p-2
button: absolute bottom-2 right-2
        border border-outline-variant/50 px-4 py-1
        text-label-caps font-label-caps
        hover:bg-primary hover:text-background hover:border-primary
```

### Code diff rows

| Row type | Classes |
|---|---|
| Context | `border-l border-outline-variant/20 opacity-50` |
| Deletion | `border-l-2 border-error/50 bg-error/10`, gutter `text-error/50`, code `text-error/80` |
| Addition | `border-l-2 border-primary bg-primary/10`, gutter `text-primary/70` |
| Cursor | `w-2 h-4 bg-primary animate-pulse` |

Gutter: `w-10 text-right pr-4`; code: `pl-4`.

### Task cards (Plan constraints)

```
glass-panel p-3
├── header: flex justify-between mb-2
│   ├── id: text-mono-code font-mono-code text-{tertiary|primary|on-surface-variant} text-xs
│   └── icon: material-symbols-outlined text-[14px]
├── body: text-body-md font-body-md text-sm mb-3
└── tag: px-1.5 py-0.5 border text-[10px] font-mono-code
```

States: default · active (`border-primary/30`, tag `bg-primary/10 border-primary/30`) · blocked (`opacity-50`).

### Scrollbar

```css
::-webkit-scrollbar       { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #c5c0ff; }  /* primary */
```

### Animations

| Name | Spec | Usage |
|---|---|---|
| `blinking-cursor` | `█` pseudo, 1s step-end infinite | Awaiting input in terminal |
| `animate-pulse` | Tailwind default | Status dots, synthesizing label, active timeline node |
| `animate-spin` | 10s linear infinite | Debate center ring |
| Mobile `pulse` | 3s alternate scale 0.9→1.1 + glow | Graph nodes |
| Sheet transition | `0.4s cubic-bezier(0.16, 1, 0.3, 1)` | Bottom sheet up/down |

### Icon conventions

- Default size: 24px (Material Symbols)
- Nav inline: 16px–18px
- Toolbar: 20px
- Active mode: `'FILL' 1`; inactive: `'FILL' 0`
- Hover: `group-hover:text-primary`, optional `group-hover:scale-110`

---

## Anti-patterns

1. **Do not use rounded corners on panels, buttons, nodes, or chips.** Main Canvas canon is `0px` radius (`rounded-none`). Only pulse dots, debate orbit rings, and the mobile drag-handle pill may use `rounded-full`.

2. **Do not invent colors outside the token table.** Map agent colors to the neon palette or M3 roles (`primary`, `error`, `tertiary`). Never use raw Tailwind palette classes (`text-blue-400`, `bg-gray-800`, etc.).

3. **Do not mix tab indicator styles on the same breakpoint.** Desktop side nav uses `border-l-2`; mobile uses `border-b-2`. Do not combine both on one tab.

4. **Do not skip the glass stack.** Floating panels require `rgba(255,255,255,0.04)` background **and** `backdrop-filter: blur(12px)` **and** `1px solid rgba(255,255,255,0.08)` border. A semi-transparent bg alone is not glass.

5. **Do not use soft shadows for glow.** Node glow uses tight `0 0 15px rgba(197,192,255,…)` box-shadow, not diffuse drop-shadow or large blur radius.

6. **Do not use non-system fonts.** Only Geist (body), Syne (display), JetBrains Mono (mono/labels), Material Symbols (icons).

7. **Do not use lowercase agent labels.** All agent names, nav items, and status strings are `UPPERCASE` via `label-caps` (letter-spacing 0.1em) or explicit uppercase.

8. **Do not omit the grain overlay on full-page layouts.** Body or fixed overlay at 8% opacity is required for the NEXUS aesthetic.

9. **Do not use thick borders.** Dividers are 1px; active tab indicator is 2px. Never 3px+ on UI chrome.

10. **Do not flatten agent panel hierarchy.** Always: colored header bar → bordered divider → mono thought stream body. Never merge header and body into one undifferentiated block.

11. **Do not use green/red for diff/add semantics.** Additions = `primary` (lavender); deletions = `error` (coral-pink). Not git-green/git-red.

12. **Do not apply `translate-x-1` on inactive tabs.** That offset is reserved for the active tab only.

13. **Do not use light mode.** All screens set `class="dark"` on `<html>`. No light-theme variants exist.

14. **Do not use desktop spacing tokens on mobile.** Mobile uses `margin: 16px` and `gutter: 16px`; desktop uses 48px / 24px.

15. **Do not animate borders or backgrounds without `transition-all` or explicit `transition-colors duration-200`.** Hover states must feel instant but smooth (200ms).
