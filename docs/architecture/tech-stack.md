# Tech Stack

This project is planned as a web app.

## Chosen Tools

- Runtime and package manager: Bun
- Frontend build tool: Vite
- UI framework: React
- Language: TypeScript
- Test runner: Vitest
- Icon library: lucide-react

## Package Management

Use Bun from the repository root.

- `bun install` installs dependencies.
- `bun run SCRIPT_NAME` runs package scripts.
- `bunx TOOL_NAME` runs one-off tools.

Do not create npm, Yarn, or pnpm lockfiles for this project.

## Project Commands

- `bun run dev` starts the Vite development server.
- `bun run build` runs TypeScript project checks and creates a production build.
- `bun run test` runs domain unit tests with Vitest.
- `bun run typecheck` runs TypeScript project checks.
- `bun run lint` currently aliases TypeScript checks until a dedicated linter is added.
