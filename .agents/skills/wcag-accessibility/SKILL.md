---
name: wcag-accessibility
description: >-
  Use this skill to enforce WCAG AA accessibility standards, contrast ratios, focus rings, and ARIA alerts for FacultyOS.
---

# Accessibility & WCAG AA Standards — FacultyOS

FacultyOS adheres strictly to WCAG 2.1 Level AA accessibility criteria to ensure every faculty member can review, evaluate, and navigate exams without barriers.

## 1. Keyboard Navigation & Focus Management

- **Visible Focus Indicator**: All interactive elements (buttons, inputs, links, tabs, table row actions) must possess an explicit, high-contrast focus ring:
  ```css
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
  ```
- **Skip Links**: Include skip navigation links for quick access to the main academic evaluation pane.
- **Tab Sequencing**: Logical tab order through question list -> rubric breakdown -> grading action buttons.

## 2. Contrast Ratios & Legibility

- **Body Text**: Contrast ratio strictly `>= 4.5:1` against adjacent background.
- **Large Text / UI Components**: Contrast ratio strictly `>= 3.0:1` against adjacent background.
- **Color Independence**: Never convey grading discrepancy or repetition flags purely through color. Always pair colors with text labels and semantic icons (e.g. `AlertTriangle` icon + "Score Discrepancy Flag" text).

## 3. Screen-Reader Accessible Alert Architecture

- **Grading Discrepancy Flags**:
  - Encapsulated in elements with `role="alert"` and `aria-live="polite"`.
  - Screen readers must announce: *"Warning: 18% discrepancy detected between Examiner 1 and Examiner 2 on Question 3B"*.
- **Repetition Warnings**:
  - Live region alert when an exam question shares >75% similarity with a prior semester's question.
- **Form Controls**:
  - Every `<Input>`, `<Textarea>`, or `<Select>` must have a programmatic `<Label htmlFor="...">` or explicit `aria-label`.
