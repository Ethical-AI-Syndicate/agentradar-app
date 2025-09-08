# AGENTS Instructions

This file provides guidance for automated agents working in the AgentRadar repository.

## Project Overview
- **AgentRadar** is a multi-platform real estate intelligence system with a production-ready API backend, complete admin portal, and Next.js web interface.
- Key packages are managed via npm workspaces under `api/`, `web-app/`, `mcp-integrations/`, `mobile/`, and `desktop/`.

## Repository Structure
- `api/`: Node.js + Express API with Prisma and Jest tests.
- `web-app/`: Next.js 15 application using the App Router and shadcn/ui.
- `mcp-integrations/`: MCP server providing additional tooling.
- `mobile/` and `desktop/`: Planned React Native and Electron clients.
- `scripts/`: Utilities supporting Claude Code team workflows.
- `docs/`: Team coordination guides, including branching and review procedures.

## Development Guidelines
1. Use feature branches named `feature/<ticket-id>-<description>` for new work.
2. Ensure all changes include appropriate tests or documentation updates.
3. Follow TypeScript and ESLint standards where applicable.
4. Maintain clear commit messages using conventional style (e.g., `docs: add AGENTS guide`).

## Required Commands
Run the following at the repository root before committing:

```bash
npm test          # Prints reminder about database setup; ensures test script executes
npm run lint      # Runs custom Claude linting script (may require scripts/claude-linter.js)
```

If working inside sub-packages, also run their local build, lint, and test scripts.

## Additional Notes
- The test suite requires a PostgreSQL database; set up with `npm run db:migrate` before executing full tests.
- Review `CLAUDE.md` and documentation in `docs/` for detailed workflows and team protocols.
- Use Claude team management scripts (`npm run claude:*`) to manage shared context when collaborating.

