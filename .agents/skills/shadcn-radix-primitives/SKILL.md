---
name: shadcn-radix-primitives
description: >-
  Use this skill to guide the selection, composition, and implementation of shadcn/ui and Radix UI primitives for FacultyOS.
---

# shadcn/ui & Radix UI Primitives Specification — FacultyOS

This skill governs all component compositions within FacultyOS, enforcing clean Radix UI headless foundations styled with Tailwind CSS tokens and zero ad-hoc component design.

## 1. Registered Component Registry

All UI elements must map to canonical shadcn/ui component primitives:

| Component Category | Primitives to Use | Composition Pattern |
| :--- | :--- | :--- |
| **Actions** | `Button` | Variants: `default`, `secondary`, `outline`, `destructive`, `ghost`, `link`. Size: `sm`, `default`, `lg`, `icon`. |
| **Form Inputs** | `Input`, `Textarea`, `Label`, `Select` | Explicit `<Label htmlFor="...">`, Radix Select with custom trigger and viewport. |
| **Layout & Containers**| `Card`, `Separator`, `ScrollArea` | Card Header, Title, Description, Content, Footer slots. |
| **Overlays & Dialogs** | `Dialog`, `Sheet`, `Popover`, `Tooltip` | Modal dialogs for confirmations; `Sheet` (drawers) for tool panels and script inspection. |
| **Navigation & Tabs** | `Tabs`, `DropdownMenu` | TabsList, TabsTrigger, TabsContent for switching exam vs. script views. |
| **Feedback & Status** | `Badge`, `Progress`, `Skeleton`, `Toaster` | Sonner for toast notifications; Skeleton for table/report loading states; Badges for rubric tags. |
| **Data & Selection** | `Table`, `Command` | Academic rubric tables, exam item grids, quick command search palettes. |

## 2. Pure Composition Architecture

- **Radix `asChild` Pattern**: When wrapping links or triggers, use `asChild` to pass accessibility props down to child elements without creating redundant DOM wrappers.
- **Variant Authority (`cva`)**: Centralize component variant styles using `class-variance-authority`. Never inline arbitrary arbitrary arbitrary CSS classes or divergent button designs.
- **Zero Ad-Hoc Components**: No bespoke modal backdrops, custom dropdown hacks, or non-Radix tooltips. All interactive overlays must respect ARIA keyboard focus traps provided by Radix UI.
- **Forbidden Overlaps**: Strict prohibition against installing Mantine, MUI, Ant Design, or Bootstrap components into the repository.
