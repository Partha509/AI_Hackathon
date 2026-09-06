---
name: component-icon-policy
description: >-
  Use this skill to enforce the lucide-react icon policy and TanStack/shadcn table data patterns for FacultyOS.
---

# Component & Icon Policy — FacultyOS

## 1. Iconography Standards

- **Exclusivity**: Icons must be imported strictly from `lucide-react`.
- **Prohibitions**:
  - ❌ ZERO raw `<svg>` elements defined directly in JSX/TSX.
  - ❌ ZERO emojis used as icons (e.g. no ❌, ⚠️, 📌, 🚀, 💡).
  - ❌ ZERO competing icon libraries (no FontAwesome, Heroicons, Material Icons, or Feather).
- **Sizing & Accessibility**:
  - Default icon size: `16px` (`h-4 w-4`) for buttons and badges; `20px` (`h-5 w-5`) for section headings and navigation items.
  - All interactive icon-only buttons must declare an accessible `aria-label` or `sr-only` span:
    ```tsx
    <Button variant="ghost" size="icon" aria-label="Inspect Grading Rationale">
      <Search className="h-4 w-4" />
    </Button>
    ```

## 2. Tabular Data Patterns (TanStack & shadcn Table)

- Use `@tanstack/react-table` combined with shadcn `<Table>` primitives.
- Features required on all academic tables:
  - Column header sorting with `ArrowUpDown` / `ArrowUp` / `ArrowDown` indicators.
  - Column alignment: Numeric marks and percentages right-aligned; text left-aligned; status badges centered.
  - Accessible pagination controls or virtual scrolling for large student cohorts.
  - Row selection for bulk actions (e.g. "Flag selected scripts for moderator review").
