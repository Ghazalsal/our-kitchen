# Our Kitchen — Design Directions

## Three Possible Directions

### 1. Copperline Atelier
**Very Brief Intro:** A tactile culinary atelier where dark espresso ink frames honest copper, brass, and parchment surfaces. The experience feels like a small-batch cookware journal translated into a shop.

**Probability:** 0.07

### 2. Sunlit Pantry Ledger
**Very Brief Intro:** A daylight-led market catalogue with parchment paper, handwritten inventory marks, and dried-herb hues. It would feel warm, rural, and meticulously organized.

**Probability:** 0.04

### 3. Midnight Mise-en-Place
**Very Brief Intro:** A dark, restrained chef's counter with smoked glass, sharp utility labels, and tiny brass signals. It would make the store feel like a professional tool library after service.

**Probability:** 0.09

---

# Chosen Direction: Copperline Atelier

## Design Movement

**Contemporary culinary editorialism** meets the material honesty of a European food atelier. The storefront uses the dramatic hierarchy of a printed food journal, softened by candlelit kitchen warmth instead of rustic nostalgia.

## Core Principles

1. **Material contrast:** Espresso ink grounds parchment cream, while copper and brass signal moments of action, value, and craft.
2. **Editorial hierarchy:** Large, characterful Fraunces headlines and precise Karla labels create deliberate reading rhythm rather than a generic retail grid.
3. **Tactile restraint:** Fine rules, grain, paper edges, and product cutouts add depth without ornamental clutter.
4. **Useful theatre:** Shopping controls remain direct and legible; expressive composition supports conversion rather than hiding it.

## Color Philosophy

Cream (#FAF6F0) is the paper and porcelain base: calm, daylight-neutral, and readable. Deep espresso ink (#17130F) supplies focus and a sense of kitchen permanence. Copper (#C0632D) is reserved for decisive interaction and heat, while brass (#D9A441) appears as a small discovery signal—an ingredient, not a wallpaper. Faded tomato and sage are secondary accents used sparingly in status and deal context.

## Layout Paradigm

The site follows an **editorial procession**, not a centered-template rhythm: full-bleed campaign moments, offset product rails, vertical label spines, and occasional dark recipe-card interludes. Main content moves between left-aligned chapters and edge-to-edge moments; standard grids are used only where comparison is useful, such as product catalogues and admin tables.

## Signature Elements

1. **Copperline rules:** Hairline copper dividers and horizontal markers that punctuate sections, product cards, and form fields.
2. **Atelier stamps:** Small circular or pill-shaped labels for provenance, availability, and deal status with brass dot accents.
3. **Grain veil:** A low-opacity paper-grain overlay in cream and ink spaces for a tactile, printed finish.

## Interaction Philosophy

Interactions should feel like placing a tool on a workbench: immediate, stable, and subtly weighted. Buttons have a concise press response; drawers, panels, and notifications enter from their relevant edge. Cart and admin inbox feedback should be explicit rather than decorative.

## Animation

Use a 180–260ms custom ease-out for interface changes, with small opacity and 8–14px translate transitions. Product imagery receives a slight scale on hover only. Product rails stagger into view by 45ms per card, while drawers use a 260ms lateral slide. Do not animate routine navigation or form typing. Respect `prefers-reduced-motion` by removing nonessential transforms.

## Typography System

**Fraunces** is the display voice: 500–700 weight with occasional italic emphasis for hero statements, section titles, and product storytelling. **Karla** is the functional voice: 400–700 for prices, descriptions, navigation, labels, and all admin information. Product metadata appears in Karla uppercase with wider tracking; body copy remains spacious and sentence-cased.

## Brand Essence

**Our Kitchen is the considered appliance shop for home cooks who choose tools with as much care as ingredients.**

Personality: **cultivated, candid, warm**.

## Brand Voice

Headlines sound assured, sensory, and specific; CTAs sound practical and inviting. Avoid empty superlatives and generic welcome language.

Example headline: “Make room for the tools that earn their place.”

Example CTA: “Set the counter in motion.”

## Wordmark & Logo

The mark is a **copper cooking ring interrupted by a single brass spark**—a simple symbol inspired by a burner, a plate, and a maker’s stamp. The wordmark pairs a compact Fraunces “Our” with a precise spaced Karla “KITCHEN,” communicating editorial warmth with operational clarity.

## Signature Brand Color

**Copperline Copper — #C0632D**

## Style Decisions

- Avoid fully centered generic hero compositions; preserve the editorial left-aligned procession.
- Avoid purple gradients, default Inter typography, and uniformly rounded card sets.
- Use image areas with clear dark overlays whenever white text sits above photography.
- Each product SKU receives its own object, crop, or styled context under the same candlelit atelier lighting.
- Utility views use espresso/cream panels, copper hairlines, atelier stamps, and candid counter-service copy; they should never drift into generic SaaS styling.
- Copperline Copper is reserved for primary actions, selected states, savings, and measured editorial emphasis; brass remains a small spark signal.
