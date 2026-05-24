---
description: cgt project conventions
alwaysApply: true
---

# Project Rules

## Project Overview

This repository is being bootstrapped as a web app using Bun and Vite React. Project documentation starts under [docs/](docs/), with stack choices tracked in [docs/architecture/tech-stack.md](docs/architecture/tech-stack.md).

## Package Manager

Use Bun.

- `bun install` to install dependencies
- `bun run SCRIPT_NAME` to run package scripts
- `bunx TOOL_NAME` to run one-off tools
- Do not use `npm install`, `yarn install`, or `pnpm install`
- Do not create or update `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`
- Bun automatically loads `.env`; do not add `dotenv` only to load local environment variables

## Documentation

Project docs live under `docs/`.

- `docs/vision/` - strategic vision, product goals, and project direction
- `docs/architecture/` - current system architecture, data contracts, and technical decisions
- `docs/architecture/current-design/` - how the implemented system works now
- `docs/design/` - active feature specs and implementation plans
- `docs/design/archive/` - implemented, superseded, abandoned, or historical specs
- `docs/planning/` - roadmap, assessments, milestones, migrations, and ongoing planning notes
- `docs/testing/` - QA guides, testing strategy, manual validation, and verification checklists
- `docs/operational/` - runbooks, local setup, deployment, CLI usage, and troubleshooting

Keep `docs/README.md` as the documentation index. If the project uses design specs heavily, also keep `docs/design/README.md` as the active design index and `docs/design/archive/README.md` as the historical design index.

## Documentation Conventions

These documentation lifecycle rules are standard across this user's projects.

- `docs/vision/`, `docs/architecture/`, and `docs/architecture/current-design/` are living current-state docs.
- Put current implemented behavior under `docs/architecture/current-design/`; these docs should avoid user stories, rollout tasks, and workflow statuses.
- Use `docs/design/` for point-in-time specs and implementation plans that are still actionable.
- Use `docs/design/archive/` for shipped, superseded, abandoned, or historical records. Preserve historical context instead of rewriting archived specs as current-state docs.
- Use relative Markdown links inside repo docs; never use absolute filesystem paths.
- When behavior, architecture, commands, environment variables, or user-facing workflows change, update the relevant living docs and affected design-doc statuses in the same pass when feasible.
- When a design doc is replaced or archived, add a short banner linking readers to the current doc or replacement.

Design-doc statuses:

- `Draft` - new or in-progress proposal
- `Active` - approved current implementation plan
- `Revised` - updated proposal or plan that remains actionable
- `Implemented` - shipped and still useful as a recent implementation reference
- `Implemented (Historical)` - shipped and now mainly historical
- `Superseded` - replaced by a newer design
- `Abandoned` - explicitly not moving forward

## Current Source Of Truth

- Tech stack and tooling: `docs/architecture/tech-stack.md`
- Current implemented design: `docs/architecture/current-design/`
- Operational runbooks: `docs/operational/`
- Documentation index: `docs/README.md`

## Testing Expectations

- Run relevant tests for code changes when test commands exist.
- Run build, typecheck, or lint commands when touching shared types, build config, or release-sensitive code and those commands exist.
- If tests cannot run locally because of credentials, services, or device dependencies, document that in the final response.

## Safety

- Do not commit secrets, generated credentials, API keys, tokens, or personal data.
- Do not make destructive cloud, database, filesystem, or git operations unless explicitly requested.
- Do not overwrite user changes.
