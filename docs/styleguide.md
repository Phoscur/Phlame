# Styleguide

Binding rules for all UI/styling work — written for AI agents doing UI tasks as much as
for humans. Decision background: [ADR 0017](./decisions/0017-keep-tailwind-domain-tokens.md).

## Stack

- **Tailwind 4** utilities, configured in CSS via `@theme` in
  [`src/app/styles.css`](../src/app/styles.css) — there is no `tailwind.config.js`.
- No inline `style=` attributes. No new CSS files: if a utility can't express it,
  add a rule to `styles.css` (and question the need first).
- Dark theme only. Design against the `slate-950` page background; do **not** use
  `dark:` variants — there is no light theme (yet, see PLAN.md).

## Color rules (binding)

Chromatic colors go through the **domain tokens** only. The raw palettes (`red-*`,
`blue-*`, `orange-*`, `yellow-*`, …) exist in `styles.css` solely to feed these tokens —
never use them directly in app markup.

| Token classes                                                 | Meaning                                          |
| ------------------------------------------------------------- | ------------------------------------------------ |
| `metallic`, `metallic-dark`                                   | metallic resource (icons, amounts)               |
| `crystalline`, `crystalline-dark`, `crystalline-light`        | crystalline resource (`-light` for text on dark) |
| `liquid`, `liquid-dark`                                       | liquid resource                                  |
| `energy`, `energy-primary`, `energy-secondary`, `energy-dark` | energy                                           |
| `bg`                                                          | page background (`slate-950`)                    |

Used as normal Tailwind color utilities: `text-crystalline`, `bg-liquid-dark`,
`border-energy`, etc.

Neutrals are used directly:

- **Surfaces**: `slate` scale — page `bg`, panels `slate-900`, raised elements `slate-800`.
- **Text & icons**: `gray` scale — default `gray-300`, muted `gray-400`/`gray-500`.

Need a new semantic color? Add a token to `@theme` in `styles.css` first, then use it —
don't inline a palette color as a one-off.

## Spacing, sizing, type

- Stick to the Tailwind scale (`p-4`, `gap-2`, `text-sm`…); no arbitrary values
  (`p-[13px]`) without a very good reason.
- Extra-wide breakpoints exist: `3xl` (1920px) up to `7xl` (8K) — for the game's
  big-screen layouts.
- Monospace (`font-mono`) for resource amounts and anything that ticks.

## Reference patterns

Copy these instead of inventing new variants.

**Dropdown trigger button** (see `session.element.tsx`, `language.dropdown.element.tsx`):

```html
<button
  class="w-30 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-600
  font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
></button>
```

**Dropdown panel**: `hidden z-10 rounded-lg shadow-gray-100 bg-gray-700`, items
`w-full py-2 hover:bg-gray-600`.

**Modal** (see `modal.element.tsx`): backdrop
`hidden fixed top-0 left-0 w-full h-full bg-black/50 justify-center items-center`,
panel `bg-slate-900 p-5 rounded shadow-md w-auto max-w-sm`.

## Non-negotiables from CLAUDE.md that touch UI

- User-facing strings go through `src/app/i18n.ts` — no hardcoded text.
- Custom Elements render into light DOM (no shadow root) — that's what makes global
  Tailwind utilities work. Don't introduce `attachShadow`.
