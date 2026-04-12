# Design System Specification: The Architectural Curator

## 1. Overview & Creative North Star: "The Architectural Curator"
This design system moves away from the cluttered, "busy" nature of traditional freelance marketplaces. Our Creative North Star is **The Architectural Curator**. We treat every project listing, developer profile, and financial transaction as a high-value asset in a digital gallery. 

By leveraging **Intentional Asymmetry** and **Tonal Layering**, we replace the "boxed-in" feeling of standard SaaS templates with an editorial layout that feels expensive and authoritative. We avoid rigid grids in favor of dynamic whitespace, ensuring that the interface feels like a professional consultancy rather than a generic bidding site.

### Key Principles:
*   **Authority through Space:** We use generous margins to signal importance.
*   **Bilingual Precision:** Typography is tuned for the density of English and the unique verticality/character structure of Mongolian (MN).
*   **The "Invisible" Interface:** Boundaries are felt through color shifts, not seen through lines.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a "Professional Navy" foundation, accented by "Trustworthy Teal" for high-stakes financial interactions (Escrow/Payments).

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using `1px solid` borders for sectioning content. To define boundaries:
1.  **Background Shifts:** Use `surface-container-low` for the page body and `surface-container-lowest` (Pure White) for content cards.
2.  **Tonal Transitions:** Use a shift from `surface` to `surface-variant` to indicate a sidebar or footer.

### Surface Hierarchy (Nesting)
Treat the UI as physical layers.
*   **Base:** `surface` (#f7f9fb)
*   **Recessed:** `surface-container` (#eceef0) for global search bars or secondary dashboard areas.
*   **Elevated:** `surface-container-lowest` (#ffffff) for the primary interaction cards.
*   **Signature Polish:** main CTAs use a gradient from `primary` (#031636) to `primary-container` (#1a2b4c) at a 135-degree angle to provide "soul" and depth.

### Glassmorphism
For floating elements like "Project Status" overlays or "Live Chat" widgets, use:
*   **Background:** `surface` with 70% opacity.
*   **Blur:** `backdrop-blur-md` (12px to 16px).
*   **Effect:** This makes the UI feel integrated and premium, preventing floating elements from looking like "pop-ups."

---

## 3. Typography: The Editorial Voice
We utilize a dual-font strategy to balance character and clarity.

*   **Display & Headlines (Manrope):** Chosen for its geometric modernism. It provides a "tech-forward" feel that is highly legible in both English and Mongolian Cyrillic. 
    *   *Role:* Editorial statements, project titles, and large numbers (e.g., "350+ Devs").
*   **Body & Labels (Inter):** The workhorse. Inter’s tall x-height handles the complex sub-scripts and accents of Mongolian perfectly.
    *   *Role:* Data tables, project descriptions, and system UI.

**Localization Note:** When rendering Mongolian (MN), increase `line-height` by 10% compared to English (EN) to prevent character clipping in dense project descriptions.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows and borders are replaced by **Ambient Depth**.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. The contrast in lightness creates a "Soft Lift."
*   **Ambient Shadows:** For high-priority modals or hover states, use a custom shadow: `shadow-[0_20px_50px_rgba(3,22,54,0.06)]`. The shadow is tinted with the `primary` color (#031636) to feel like natural light passing through blue-tinted glass.
*   **The "Ghost Border":** If a separator is required for accessibility, use `outline-variant` (#c5c6cf) at **15% opacity**. It should be a suggestion of a line, not a hard stop.

---

## 5. Components

### Cards (Project & Profile)
*   **Styling:** No borders. Background `surface-container-lowest`.
*   **Structure:** High-contrast `headline-sm` titles. Avoid dividers; use `24px` (Tailwind `gap-6`) to separate sections.
*   **Hover:** Transition to a slightly deeper `surface-container-low` or add an Ambient Shadow.

### Professional Data Tables
*   **Header:** `surface-container-high` background with `label-md` uppercase text.
*   **Rows:** Alternating shifts between `surface` and `surface-container-low`. Forbid horizontal lines.
*   **Financials:** Escrow status uses `secondary` (#13696a) for text to signal safety.

### Progress Trackers (Project Milestones)
*   **The Path:** Use a thick (4px) `surface-variant` track.
*   **Active State:** A gradient stroke using `primary` to `secondary`.
*   **Nodes:** Large `surface-container-lowest` circles with centered icons. Use `secondary` for "Completed/Funded" milestones.

### Buttons
*   **Primary:** Gradient (#031636 to #1a2b4c), `rounded-md` (0.375rem). Use `primary-fixed` (#d8e2ff) for text.
*   **Secondary (Escrow):** Solid `secondary` (#13696a) with white text. Reserved for "Release Payment" or "Accept Quote."
*   **Tertiary:** Ghost style. No background, `primary` text. Transitions to `surface-container-low` on hover.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical spacing. (e.g., a project description with a wide left margin and a tight right column for metadata).
*   **Do** prioritize the Mongolian typeface rendering; test for "orphaned" Cyrillic characters.
*   **Do** use "Trustworthy Teal" (`secondary`) exclusively for financial status, escrow, and success states.

### Don't:
*   **Don't** use a 1px border to separate the navigation bar from the content. Use a background color shift or a `backdrop-blur`.
*   **Don't** use pure black (#000000). Use `on-surface` (#191c1e) for text to maintain the premium navy undertone.
*   **Don't** use standard Tailwind "Shadow-md." It is too "boxy." Use the custom Ambient Shadows defined in Section 4.
*   **Don't** use dividers inside cards. If you need to separate content, use a background color block or increased padding.

---

## 7. Implementation (Tailwind Configuration)