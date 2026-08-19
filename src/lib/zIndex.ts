// Single source of truth for the app's stacking order. Every fixed/portaled overlay should
// pull its z-index from here via `style={{ zIndex: ... }}` rather than picking its own
// Tailwind `z-[...]` class — Tailwind's class scanner can't see through a template-literal
// interpolation of one of these values, so a shared constant only actually enforces anything
// if it's applied as a real inline style, not baked into a class string.
//
// "Does X render above Y" is then a comparison of these named layers instead of re-deriving
// which magic number needs to exceed which other magic number by re-reading comments in
// unrelated files.
export const Z_INDEX = {
  /** Dashboard top app bar. */
  header: 1100,
  /** Dashboard left nav. */
  sidebar: 1300,
  /** Dropdown menus opened from the header (e.g. the user menu). */
  headerMenu: 9999,
  /** Full-page modals (must clear every layer above, including headerMenu). */
  modal: 10000,
  /** Select/Combobox dropdown content that can be opened from inside a modal — must clear
   * `modal` itself, since Radix Select portals to <body> as its own top-level sibling rather
   * than nesting inside whatever modal triggered it. */
  modalDropdown: 10001,
} as const;
