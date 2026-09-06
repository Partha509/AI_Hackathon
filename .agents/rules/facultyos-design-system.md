# FacultyOS Design System & Frontend Architecture Rules
Role: Senior Frontend Architect & Design Systems Lead
Project: FacultyOS — AI-Powered Academic Co-Pilot for University Faculty (AUST CSE Carnival 8.0)

## Strict Design Directives & Constraints

1. **Aesthetic Identity: Academic-Modern SaaS**:
   - Primary: Deep Academic Navy (`#0F2942`) or Deep Teal (`#0F766E`)
   - Accent / Warning: Warm Amber (`#D97706` / `#F59E0B`)
   - Danger / Flag: Muted Crimson (`#DC2626`)
   - Success: Emerald (`#16A34A`)
   - Base Neutrals: Zinc/Slate (`#09090B` dark, `#FFFFFF` light)
   - BANNED: Neon purple gradients, glassmorphism overload, generic AI blobs, emoji-as-icons.

2. **Component Architecture**:
   - Strictly shadcn/ui & Radix UI primitives.
   - Strictly `lucide-react` for icons (no raw SVGs, no emojis).
   - TanStack Table / shadcn Table patterns for tabular data.
   - True-neutral dark mode tokens (0% blue-tinted dark backgrounds).
   - Typography: `Space Grotesk` (headings) + `Inter` (body and tabular data).

3. **Responsive Standards**:
   - Desktop (>= 1440px): Synchronized split-pane view (exam/script on left; AI evaluation/discrepancy on right).
   - Tablet (768px) & Mobile (390px): Stacked tabs, collapsible tool drawers (Radix Sheet), touch targets >= 44x44px.

4. **WCAG AA Accessibility**:
   - Minimum contrast ratio 4.5:1.
   - High-contrast focus rings: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
   - Accessible screen reader announcements with `role="alert"` and `aria-live="polite"`.

5. **The 4 Critical States**:
   - Every view must implement Loading (Skeletons), Empty (Actionable guidance + Sample loaders), Error (Retry + diagnostic hint), and Populated.

6. **AI Co-Pilot Interaction UX**:
   - Tool/Skill invocation chips (`🔧 QuestionQualityChecker`, `🔧 ConsistencyAnalyzer`).
   - Coverage progress bars with syllabus milestone thresholds.
   - Diff/comparison view with visual delta chips.
   - Persistent non-intrusive advisory badge: *"AI Advisory: Decision remains with Faculty"*.
