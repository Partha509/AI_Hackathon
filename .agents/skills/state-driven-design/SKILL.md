---
name: state-driven-design
description: >-
  Use this skill to guarantee that every academic view implements the 4 critical states: Loading, Empty, Error, and Populated.
---

# State-Driven Design: The 4 Critical States — FacultyOS

Every academic evaluation screen, comparison panel, and rubric view in FacultyOS must explicitly account for the four core UI states without layout shift.

## 1. The Four Required States

### State 1: Loading State (Skeleton Loaders)
- Never use full-screen blank spinners that disorient the faculty user.
- Provide content-aware Skeleton components matching the exact shape of:
  - Table rows with mock column widths.
  - Split-pane document view with paragraph skeletons.
  - Metric summary cards with shimmering badge skeletons.

### State 2: Empty State (Constructive Guidance)
- Never display an empty blank card or generic "No data" text.
- Must provide:
  - An academic icon (e.g. `FileQuestion`, `GraduationCap`).
  - Clear heading explaining the state (e.g., "No Exam Paper Loaded").
  - Contextual explanation (e.g., "Select a question paper from the repository or load sample data to test AI co-pilot evaluation").
  - Quick-load actions:
    * `[ Load Sample Exam Paper ]`
    * `[ Load Sample Student Script ]`
    * `[ Upload Syllabus PDF ]`

### State 3: Error State (Actionable Diagnostic)
- Avoid cryptic error codes or generic "Something went wrong".
- Provide:
  - Human-readable error description (e.g., "Failed to parse question syllabus alignment").
  - Cause hint (e.g., "Network timeout reaching local inference server or corrupted PDF stream").
  - Explicit action button: `[ Retry Evaluation ]` or `[ Re-upload Document ]`.

### State 4: Populated State (Academic Hierarchy)
- Clean, structured information density.
- Color-coded confidence badges (`High Confidence`, `Borderline Review Required`, `Verified`).
- Scannable key metrics followed by detailed itemized lists.
