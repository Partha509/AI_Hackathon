---
name: design-tokens-css
description: >-
  Use this skill to configure and enforce CSS variable tokens, true-neutral dark mode, and font pairings for FacultyOS.
---

# Frontend Design Tokens & CSS Architecture — FacultyOS

## 1. CSS Variable Architecture

All design tokens are managed via CSS custom properties in `src/index.css` (or `globals.css`) adhering to HSL channel values for dynamic alpha blending.

### Light Theme Variables
```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;

  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;

  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;

  /* FacultyOS Academic Navy: #0F2942 */
  --primary: 210 63% 16%;
  --primary-foreground: 0 0% 98%;

  /* FacultyOS Teal Accent: #0F766E */
  --secondary: 175 77% 26%;
  --secondary-foreground: 0 0% 98%;

  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;

  /* FacultyOS Warm Amber: #D97706 */
  --accent: 38 92% 50%;
  --accent-foreground: 24 9.8% 10%;

  /* FacultyOS Muted Crimson: #DC2626 */
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 98%;

  /* FacultyOS Emerald: #16A34A */
  --success: 142 76% 36%;
  --success-foreground: 0 0% 98%;

  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 210 63% 16%;
  --radius: 0.5rem;
}
```

### True-Neutral Dark Mode Tokens (Zinc/Slate Base, ZERO Blue-Tinted Dark)
```css
.dark {
  --background: 240 10% 3.9%; /* #09090B - True neutral dark zinc */
  --foreground: 0 0% 98%;

  --card: 240 10% 5.9%;
  --card-foreground: 0 0% 98%;

  --popover: 240 10% 5.9%;
  --popover-foreground: 0 0% 98%;

  --primary: 210 63% 28%; /* Accessible lighter academic navy tone */
  --primary-foreground: 0 0% 98%;

  --secondary: 175 77% 32%;
  --secondary-foreground: 0 0% 98%;

  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;

  --accent: 38 92% 50%;
  --accent-foreground: 0 0% 98%;

  --destructive: 0 62.8% 40.6%;
  --destructive-foreground: 0 0% 98%;

  --success: 142 70% 45%;
  --success-foreground: 0 0% 98%;

  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 210 63% 40%;
}
```

## 2. Typography Specification

- **Heading Font Family**: `Space Grotesk`, sans-serif
  - Used for: Application brand, section titles, card headers, metric numbers.
  - Weights: 600 (SemiBold), 700 (Bold). Tight tracking (`tracking-tight`).
- **Body & Tabular Font Family**: `Inter`, system-ui, sans-serif
  - Used for: Exam questions, student answer scripts, grading rubrics, table data, metadata.
  - Weights: 400 (Regular), 500 (Medium), 600 (SemiBold). Feature settings: `font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11', 'tnum'`.
