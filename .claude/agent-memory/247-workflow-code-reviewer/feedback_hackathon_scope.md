---
name: Hackathon-grade review scope
description: For Election Assistant India, keep review feedback narrow and actionable; avoid recommending large refactors or coverage pushes
type: feedback
---

For the Election Assistant India project, restrict review output to surgical cleanup items: dead code, unused files, unused deps, debugging artifacts, inconsistencies, and one-line smells. Do not recommend large refactors, new abstractions, extracted hooks, typed props, or test additions/coverage targets.

**Why:** The user explicitly stated "hackathon-grade is fine" and called out these categories as out-of-scope — recommending them anyway wastes their attention.

**How to apply:** When reviewing this project (or one the user frames as hackathon/demo), produce a short prioritized list (5-10 items) with file:line + one-line fix suggestions. Skip findings without a clear, small fix. If the codebase is clean, say so rather than padding the list.
