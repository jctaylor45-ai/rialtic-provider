# Claude Code Instructions for Provider Portal

## Required Reading

Before starting any task, read and follow the rules in:
- `docs/current/.claude-code-rules.md` - Documentation standards, auto-commit rules, code quality requirements

## Quick Reference

### Documentation Standards
- All markdown files MUST have version headers (Version, Last Updated, Status)
- Only `README.md` exists at root; all other docs go in `docs/current/`
- Archive outdated docs to `docs/archive/` immediately
- Always check document dates before using specifications

### Auto-Commit Protocol
- Commit at the end of each completed task
- Push to GitHub after committing
- Use descriptive commit messages with the standard footer

### Code Quality
- Run `npx vue-tsc --noEmit` before completing any task
- Use existing patterns and composables
- All new code must be TypeScript

### Source of Truth
- `docs/current/MEMORY.md` - Current implementation status
- `docs/current/PROJECT_INSTRUCTIONS.md` - Developer patterns and setup
