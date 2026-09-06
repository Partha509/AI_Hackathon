---
name: ai-copilot-ux
description: >-
  Use this skill to implement AI Co-Pilot interaction patterns, tool invocation badges, coverage progress, diff comparisons, and faculty disclaimers.
---

# AI UX & Co-Pilot Interaction Patterns — FacultyOS

FacultyOS acts as an academic co-pilot empowering educators, not an opaque autonomous black box. The UI must provide transparency, inspectability, and trust.

## 1. Tool & Skill Invocation Badges

When the AI Co-Pilot triggers background analytical passes, render clear status chips:
- `🔧 QuestionQualityChecker` — Checking bloom taxonomy, grammar, and marks distribution.
- `🔧 ConsistencyAnalyzer` — Comparing grading benchmarks across multiple examiners.
- `🔧 SyllabusCoverageAuditor` — Mapping exam items against approved curriculum topics.
- `🔧 RepetitionDetector` — Cross-referencing previous 5 semesters' archived exam papers.

These badges should show dynamic states:
- Spinning/Pulse indicator when actively executing.
- Checkmark badge when complete, with clickable popover to inspect intermediate execution rationale.

## 2. Coverage Progress Indicators

- Syllabus topic coverage represented by custom `Progress` bars with academic milestones:
  - `< 60%`: Amber warning (`#D97706`) with missing modules flagged.
  - `>= 80%`: Emerald success (`#16A34A`) with complete curriculum badge.
- Interactive tooltip displaying covered vs. omitted syllabus modules.

## 3. Grader Diff & Score Comparison Breakdown

- Side-by-side comparison view:
  - Examiner 1 Score vs. Examiner 2 Score vs. AI Proposed Baseline.
  - Visual delta chip (`+4.5`, `-2.0`, `Δ 15% - Review Recommended`).
  - Itemized rubric breakdown highlighting which specific sub-question caused the deviation.

## 4. Academic Advisory Disclaimer Badges

Every AI-generated insight, suggested mark, or flag must bear a persistent, non-intrusive advisory badge:
- Badge text: *"AI Advisory: Final evaluation decision remains strictly with Faculty"*
- Visual: Subtle muted badge with `ShieldAlert` or `Info` icon in secondary/muted palette. Never obstruct grading controls.
