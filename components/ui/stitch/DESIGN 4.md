---
name: Nexus Editorial AI
colors:
  surface: '#131319'
  surface-dim: '#131319'
  surface-bright: '#3a383f'
  surface-container-lowest: '#0e0d14'
  surface-container-low: '#1c1b21'
  surface-container: '#201f25'
  surface-container-high: '#2a2930'
  surface-container-highest: '#35343b'
  on-surface: '#e5e1ea'
  on-surface-variant: '#c8c4d4'
  inverse-surface: '#e5e1ea'
  inverse-on-surface: '#313036'
  outline: '#928f9d'
  outline-variant: '#474552'
  surface-tint: '#c5c0ff'
  primary: '#c5c0ff'
  on-primary: '#2a1c84'
  primary-container: '#8c84eb'
  on-primary-container: '#23127d'
  inverse-primary: '#5951b4'
  secondary: '#ffb4a4'
  on-secondary: '#640d00'
  secondary-container: '#8d1701'
  on-secondary-container: '#ff9a85'
  tertiary: '#efc04c'
  on-tertiary: '#3f2e00'
  tertiary-container: '#b38b15'
  on-tertiary-container: '#362700'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e4dfff'
  primary-fixed-dim: '#c5c0ff'
  on-primary-fixed: '#140067'
  on-primary-fixed-variant: '#41379b'
  secondary-fixed: '#ffdad3'
  secondary-fixed-dim: '#ffb4a4'
  on-secondary-fixed: '#3e0500'
  on-secondary-fixed-variant: '#8d1701'
  tertiary-fixed: '#ffdf98'
  tertiary-fixed-dim: '#efc04c'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5a4300'
  background: '#131319'
  on-background: '#e5e1ea'
  surface-variant: '#35343b'
typography:
  display-xl:
    fontFamily: Syne
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Syne
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  mono-code:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.1em
spacing:
  unit: 4px
  gutter: 24px
  margin: 48px
  container-max: 1440px
---

## Brand & Style

This design system is built for an autonomous AI research environment where high-density information meets architectural clarity. The brand personality is **analytical, sophisticated, and immersive**, prioritizing a focused "command center" atmosphere over casual interaction.

The style is a fusion of **Editorial Minimalism** and **High-Tech Glassmorphism**. It utilizes a "dark-mode-first" approach with structural rigidity—favoring sharp edges and strict grid alignment—balanced by the ethereal nature of translucent glass panels and a subtle 8% grain texture that eliminates digital flatness. The emotional response should be one of deep focus, suggesting an environment where complex synthetic logic is being synthesized in real-time.

## Colors

The color palette is anchored in a deep, near-black void (`#0A0A0F`), providing a high-contrast foundation for the "Agent Palette." 

- **Primary Accent:** Purple (`#7F77DD`) acts as the "System" or "Synthesizer" color, used for primary actions and global states.
- **Agent Palette:** Specific hues (Coral, Red, Teal, Blue) are reserved for identifying unique AI personas or data streams within a debate. They must be used sparingly as status indicators, pips, or thin borders to prevent visual fatigue.
- **Surface Texture:** An 8% opacity monochromatic grain overlay must be applied globally to the background layer to add tactile depth and reduce banding in glass blurs.

## Typography

Typography in the design system follows a rigid hierarchy. 

- **Display & Headlines:** Use **Syne**. Its architectural, ultra-wide characters provide a sense of authority and structural weight. For mobile devices, `display-xl` should scale down to `36px` to maintain legibility.
- **Body Text:** Use **Geist** (a clean, technical sans-serif) for general reading. It provides a neutral balance to the expressive headers.
- **Technical/Agent Data:** Use **JetBrains Mono** for all agent-generated logs, code snippets, and metadata labels. This reinforces the "AI-driven" nature of the platform. All technical labels should be set in uppercase with increased letter spacing for an "archived" look.

## Layout & Spacing

The layout is based on a **12-column architectural grid** with a strict 4px baseline. 

- **Grid:** Use a fixed-width central container on desktop (1440px max) to maintain readability for long-form research. 
- **Rhythm:** Spacing follows a 4px scale (4, 8, 16, 24, 32, 48, 64). Large vertical gaps are encouraged to separate distinct research phases or debate segments.
- **Adaptation:** On mobile, margins shrink to 16px and the grid collapses to 4 columns. All panels lose their absolute positioning and stack vertically, maintaining the 1px border separation.

## Elevation & Depth

Depth is conveyed through **translucency and 1px strokes**, rather than traditional shadows.

1.  **Base Layer:** The grain-textured `#0A0A0F` background.
2.  **Panel Layer:** Semi-transparent containers using `rgba(255,255,255,0.04)` with a `12px` backdrop blur. 
3.  **Border Definition:** Every interactive or containing element is defined by a 1px solid stroke (`rgba(255,255,255,0.08)`). No drop shadows should be used; instead, "active" panels are highlighted by changing their border color to the `Primary` or `Agent` accent.
4.  **Z-Index:** Floating elements (modals or pop-overs) should use a slightly higher background opacity (0.08) to distinguish themselves from the primary workspace.

## Shapes

The design system uses a **Strict Sharp** geometry. 

All corners for buttons, input fields, cards, and panels are set to `0px`. This geometric rigidity reflects architectural blueprints and technical precision. Circles are strictly forbidden unless used for status pips or agent avatars. Under no circumstances should "pill-shaped" buttons or rounded inputs be utilized.

## Components

- **Buttons:** Sharp 0px rectangles. Default state: 1px border with transparent background. Hover state: Solid background with inverted text. No gradients.
- **Cards/Panels:** Utilize the glassmorphism spec. Use a "Header" section within the card, separated by a 1px horizontal line, to house the `label-caps` metadata.
- **Input Fields:** Bottom-border only (1px) in a resting state. Upon focus, the border animates to the full perimeter of the field using the Primary accent.
- **Chips:** Small, sharp-edged tags with mono typography. Used primarily for "Source Attribution" or "Data Confidence" levels.
- **Agent Avatars:** Small squares (not circles) containing a glitch-pattern or a single letter in the designated Agent Palette color.
- **Navigation:** A structural sidebar or top-bar consisting of simple text-links in `label-caps`. Active states are indicated by a 2px vertical/horizontal bar in the Primary color, never a background fill.
- **Scrollbars:** Custom minimal styling—3px width, no track background, primary color thumb.