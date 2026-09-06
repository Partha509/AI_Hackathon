---
name: responsive-mobile-layouts
description: >-
  Use this skill to implement responsive breakpoints, split-pane layouts, and mobile/tablet drawers for FacultyOS.
---

# Responsive & Mobile Layouts — FacultyOS

FacultyOS supports diverse academic workflows ranging from multi-monitor faculty workstations to tablet-based exam hall verification.

## 1. Breakpoint Matrix

| Viewport | Dimension | Primary Layout Mode | Key Interaction Behaviors |
| :--- | :--- | :--- | :--- |
| **Desktop** | `>= 1440px` | Synchronized Split-Pane View | Left: Exam Question / Student Script document pane. Right: AI Evaluation, Rubric criteria, Discrepancy analysis. Persistent sidebar. |
| **Laptop** | `1024px - 1439px` | Adaptive Split-Pane | Resizable/collapsible side panels, compact metric headers. |
| **Tablet** | `768px - 1023px` | Stacked Tab Navigation | Tab switcher between "Script View" and "AI Evaluation". Bottom sheet for tool drawer. |
| **Mobile** | `390px - 767px` | Mobile Single Stream | Full-width cards, sliding drawer (Radix Sheet), touch-friendly action bar. |

## 2. Split-Pane Synchronized Architecture (Desktop)

- Split-pane utilizes CSS Grid or flex with `overflow-hidden` container and independent inner `ScrollArea` for both sides.
- Scrolling in the student script side highlights corresponding rubric item in the evaluation side.
- Minimum split ratio: 50/50 or 60/40 (document/analysis).

## 3. Mobile Touch & Interaction Guidelines

- **Minimum Touch Targets**: All interactive elements (buttons, tab triggers, dropdown items) must maintain at least `44x44px` physical touch area.
- **Collapsible Tool Drawers**: Secondary actions and filter panels slide in via bottom or right Radix `Sheet`.
- **Responsive Tables**: Wrap tables in horizontal scroll containers with visual fade cues (`before:pointer-events-none`) or switch to structured vertical Card views when width < 640px.
