# Design System Specification: The Wealth Studio Aesthetic

## 1. Overview & Creative North Star: "The Digital Atelier"
This design system moves away from the cold, sterile nature of traditional banking and enters the realm of a high-end "Digital Atelier." The Creative North Star is **The Curated Sanctuary**. 

To achieve a "Wealth Studio" vibe, we break the standard Bootstrap-style grid. We favor **intentional asymmetry**, where large editorial type balances against dense, functional data clusters. We use a "Bento-Box" layout philosophy—grouping related information into distinct, rounded containers that feel like physical objects on a slate-tinted gallery wall. The goal is to make the user feel they are not just managing numbers, but orchestrating a legacy.

---

## 2. Colors & Tonal Depth
We eschew the "pure white" (#FFFFFF) web of the past. Our foundation is built on tinted neutrals that provide a sophisticated, low-glare environment.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off content. Traditional dividers are a sign of "template" design. Boundaries must be defined solely through:
1.  **Background Shifts:** Placing a `surface-container-lowest` card on a `surface` background.
2.  **Tonal Transitions:** Using subtle shifts in the indigo-tinted slate tokens to imply containment.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent materials.
*   **Base Layer:** `surface` (#f7f9fb) – The "Slate Tint" canvas.
*   **Section Layer:** `surface-container-low` (#f2f4f6) – For grouping secondary modules.
*   **Action Layer:** `surface-container-lowest` (#ffffff) – Reserved for primary cards or interactive modules to provide "pop."

### The "Glass & Gradient" Rule
To add "soul," use **Glassmorphism** for floating elements (modals, dropdowns, navigation bars).
*   **Formula:** `surface-variant` at 70% opacity + 20px Backdrop Blur.
*   **Signature Texture:** Main CTAs should use a linear gradient: `primary` (#2a14b4) to `primary-container` (#4338ca) at a 135-degree angle. This creates a "Vivid Royal" depth that flat hex codes cannot replicate.

---

## 3. Typography: Editorial Authority
We utilize a pairing of **Manrope** (Display/Headlines) and **Inter** (UI/Body) to balance character with legibility.

*   **Display (Manrope):** Massive, high-contrast scales (e.g., `display-lg` at 3.5rem) should be used for net worth or portfolio totals to create a sense of scale and importance.
*   **Body (Inter):** Tight tracking (-0.01em or -0.02em) for a "premium print" look. 
*   **Labels:** Use `label-md` with `primary` color and 5% letter spacing for a high-end, "stamped" architectural feel.

---

## 4. Elevation & Depth
Depth is the differentiator between "Amateur" and "Studio" quality.

### The Layering Principle
Do not use shadows for everything. Achieve 90% of your hierarchy through **Tonal Layering**. Place a `surface-container-lowest` card on a `surface-container-low` background. The subtle 2-3% shift in lightness is enough for the human eye to perceive a "lift" without visual clutter.

### Ambient Shadows
When a physical "float" is required (e.g., a hovered card):
*   **Blur:** 40px to 60px.
*   **Opacity:** 4% - 8%.
*   **Tint:** Use a tinted shadow (`on-surface` #191c1e at 5% opacity) rather than pure black. This mimics natural light reflecting off the indigo background.

### The "Ghost Border" Fallback
If a border is required for accessibility, it must be a **Ghost Border**: `outline-variant` (#c7c4d7) at **15% opacity**. Never use 100% opacity borders.

---

## 5. Components

### Bento Cards & Lists
*   **The Rule:** Forbid divider lines.
*   **Implementation:** Use `xl` (1.5rem) or `lg` (1rem) corner radius. Separate list items using 8px of vertical whitespace or a 2% background shift on hover.
*   **Bento Logic:** Mix card sizes (e.g., one 2x2 card next to two 1x1 cards) to create a sophisticated, dashboard-as-art layout.

### Buttons (The "Jewel" Elements)
*   **Primary:** Gradient of `primary` to `primary-container`. Corner radius: `full` (9999px) for a modern, pill-shaped "app" feel.
*   **Secondary:** `surface-container-highest` background with `on-primary-fixed-variant` text. No border.
*   **Tertiary:** Ghost style. No background, `primary` text, underlined only on hover.

### Input Fields
*   **Style:** Minimalist. `surface-container-lowest` background with a subtle "Ghost Border."
*   **Focus State:** A soft 4px outer glow of `primary` at 20% opacity. Transition should be 300ms ease-in-out.

### Finance-Specific Components
*   **Growth Sparklines:** Use `secondary` (#006c49) with a subtle glow (drop-shadow) of the same color at 30% opacity.
*   **Investment Chips:** Use `tertiary` (#4700ab) for "Amethyst" accents. These should have a slight glassmorphism effect (10% opacity fill) when used as tags.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Negative Space:** Give elements "room to breathe." If you think there's enough padding, add 8px more.
*   **Use Subtle Animation:** Layers should "slide" into place with a slight stagger (100ms offset).
*   **Intentional Asymmetry:** Align a large headline to the left, but keep the data visualization slightly offset to the right to break the "template" feel.

### Don't:
*   **Don't use #000000:** Use `on-surface` (#191c1e) for text; it preserves the sophisticated indigo-slate tone.
*   **Don't use "Standard" Grids:** Avoid the 12-column obsession. Design for the content "Bento" first.
*   **Don't use Box Shadows on everything:** Let background colors do the heavy lifting for hierarchy. Shadows are for "Floating" states only.