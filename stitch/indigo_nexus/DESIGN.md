# Design System Strategy: The Tech Editorial

## 1. Overview & Creative North Star

### Creative North Star: "The Digital Architect"
This design system moves beyond the standard transactional marketplace aesthetic to embrace an "Editorial Tech" philosophy. It treats the Mongolian IT landscape as a high-end professional ecosystem where talent and opportunity are curated, not just listed. 

To achieve this, the system leverages **intentional asymmetry** and **high-contrast typography**. Unlike generic grids that place elements in predictable rows, "The Digital Architect" uses expansive whitespace (the "breathing room") and overlapping depth to guide the eye. We break the "template" look by treating the browser as a canvas for a premium professional journal—clean, authoritative, and sophisticated.

---

## 2. Colors & Surface Philosophy

The color palette is anchored in a deep indigo-violet, conveying stability and technical prowess.

### Tonal Hierarchy
- **Primary (`#451ebb`):** Use for high-intent actions and brand-defining moments.
- **Secondary (`#595d78`):** Use for supporting information and less urgent interactive elements.
- **Tertiary (`#004a64`):** Reserved for technical depth and contrast accents.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define major sections. Structural boundaries must be achieved through:
1.  **Background Shifts:** Placing a `surface_container_low` section directly against a `surface` background.
2.  **Negative Space:** Using the Spacing Scale (specifically `8` to `16`) to create distinct content groupings without physical lines.

### The "Glass & Gradient" Rule
To inject "soul" into the interface, use Glassmorphism for floating components (e.g., navigation bars or tooltips) by applying `surface` colors at 80% opacity with a `backdrop-filter: blur(20px)`. Main CTAs and Hero backgrounds should utilize a subtle linear gradient from `primary` to `primary_container` (135-degree angle) to avoid a flat, dated appearance.

---

## 3. Typography

The typography strategy uses a dual-font system to balance "Tech" with "Modern Professionalism."

*   **Display & Headline (Manrope):** A geometric sans-serif that feels engineered and modern. Used for high-impact messaging.
    *   *Display LG (`3.5rem`):* For primary value propositions.
    *   *Headline MD (`1.75rem`):* For section titles to establish clear authority.
*   **Title, Body & Label (Inter):** A highly legible, neutral sans-serif that handles technical data and long-form descriptions with ease.
    *   *Title LG (`1.375rem`):* For project names and freelancer titles.
    *   *Body MD (`0.875rem`):* The workhorse for descriptions and metadata.

---

## 4. Elevation & Depth

We eschew traditional drop shadows for a more organic **Tonal Layering** approach.

### The Layering Principle
Depth is created by "nesting" the surface tiers:
- **Level 0 (Base):** `surface` (`#f8f9ff`)
- **Level 1 (Sections):** `surface_container_low`
- **Level 2 (Cards):** `surface_container_lowest` (Pure white) sitting on Level 1. This creates a natural "pop" without a single line of CSS shadow.

### Ambient Shadows & "Ghost Borders"
When a floating effect is mandatory (e.g., a modal or dropdown):
- **Ambient Shadow:** Use a blur of `40px` at `4%` opacity, using the `on_surface` color as the shadow tint.
- **Ghost Border:** If accessibility requires a container edge, use the `outline_variant` token at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Buttons
- **Primary:** Gradient (`primary` to `primary_container`), `label-md` uppercase, `rounded-full`.
- **Secondary:** `surface_container_high` background with `on_secondary_container` text.
- **Tertiary:** No background; `primary` text with an underline on hover.

### Card Architecture (Freelancers & Projects)
Cards are the heart of this design system. 
- **Style:** `rounded-xl`, `surface_container_lowest` background.
- **Rules:** No dividers. Use `Spacing 2` for grouping related metadata and `Spacing 4` for separating the title from the body. Use `primary_fixed` as a subtle background for skill tags.

### Trust Indicators (QPay Integration)
Trust badges must feel integrated, not "pasted on." 
- Use `tertiary_container` backgrounds for "Verified" badges to provide a calm, secure color shift away from the energetic primary violet.

### Input Fields
- **Default:** `surface_container_low` background with a `0.5rem` radius.
- **Focus State:** A 2px "Ghost Border" using `surface_tint` at 40% opacity.

---

## 6. Do’s and Don’ts

### Do
- **Do** use `display-lg` typography to create "editorial moments" where text is the hero.
- **Do** use the `24 (8.5rem)` spacing token for top-level section margins to emphasize the premium market position.
- **Do** leverage the `surface_container` tiers to create hierarchy; think of the UI as layers of paper.

### Don’t
- **Don’t** use `#000000` for text. Always use `on_surface` (`#191c20`) to maintain tonal softness.
- **Don’t** use standard `1px` gray dividers. If you need a separator, use a `1px` height `surface_variant` bar with 30% opacity, or simply more whitespace.
- **Don’t** cram information. If a card feels full, increase the card size rather than decreasing the font size.

### Accessibility Note
Ensure that all text combinations meet WCAG 2.1 AA standards. Specifically, when using `on_primary_container` text on `primary_fixed` backgrounds, verify the contrast ratio exceeds 4.5:1.