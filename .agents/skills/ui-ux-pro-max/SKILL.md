---
name: ui-ux-pro-max
description: >-
  Use this skill to enforce Academic-Modern SaaS UI/UX guidelines, visual hierarchy, and color palettes for FacultyOS.
---

# UI/UX Pro Max: Academic-Modern SaaS System — FacultyOS

FacultyOS is designed for university faculty, department heads, and academic evaluation committees (AUST CSE Carnival 8.0). The UI must radiate academic integrity, analytical clarity, precision, and trust.

## 1. Core Visual Principles & Prohibitions

- **BANNED**:
  - ❌ Neon purple gradients or flashy crypto/web3 styling.
  - ❌ Glassmorphism overload (e.g. excessive blur, frosted glass cards that obscure data legibility).
  - ❌ Generic decorative AI blobs or meaningless floating shapes.
  - ❌ Emoji-as-icons (e.g., 🚀, 💡, 🤖 in navigation or buttons). Use strictly `lucide-react` icons.

- **MANDATED**:
  - ✅ **8px Grid System**: Every margin, padding, height, and gap must be a multiple of 8px (e.g., 4px, 8px, 16px, 24px, 32px, 48px, 64px).
  - ✅ **Academic Trust Aesthetic**: High information density, high scannability, crisp borders, subtle elevation.
  - ✅ **Subtle Micro-Interactions**: Predictable hover transitions (`transition-colors duration-150`), crisp button click states.

## 2. Official FacultyOS Color Palette

| Token Role | Hex Code | HSL Approx | Semantic Usage in FacultyOS |
| :--- | :--- | :--- | :--- |
| **Primary (Navy)** | `#0F2942` | `210 63% 16%` | Core identity, primary navigation headers, primary CTA buttons. |
| **Primary Alt (Teal)**| `#0F766E` | `175 77% 26%` | Secondary analytical highlights, co-pilot tools, verified tags. |
| **Accent / Warning** | `#D97706` / `#F59E0B` | `38 92% 50%` | Discrepancy flags, borderline scores, unverified grading criteria. |
| **Danger / Flag** | `#DC2626` | `0 72% 51%` | Repetition flags, major grading gaps (>15%), invalid syllabus items. |
| **Success** | `#16A34A` | `142 76% 36%` | Syllabus coverage met, high agreement between graders, verified answer keys. |
| **Base Neutrals** | `#09090B` (Dark) / `#FFFFFF` (Light) | `Zinc/Slate Base` | Clean backgrounds, true neutral borders, zero blue-tinted dark backgrounds. |

## 3. Visual Scannability Architecture
- **Metric Banners**: Clear key-value cards highlighting syllabus coverage %, average discrepancy delta, and flagged questions.
- **Side-by-Side Verification**: Clean divider rules separating question prompts from rubric scoring criteria.
