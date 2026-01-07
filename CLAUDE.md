# Claude Code Instructions for Provider Portal

## Required Reading

Before starting any task, read and follow the rules in:
- `docs/current/.claude-code-rules.md` - Documentation standards, auto-commit rules, code quality, **styling standards**
- `docs/current/STYLE_GUIDE.md` - UI/UX design standards and color palette

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

### Styling Standards (CRITICAL)

**NEVER use these colors - they are PROHIBITED:**
- `gray-*` → Use `neutral-*`
- `green-*` → Use `success-*`
- `red-*` → Use `error-*`
- `blue-*` → Use `secondary-*` or `primary-*`
- `indigo-*` → Use `primary-*`
- `yellow-*` → Use `warning-*`

**Always use:**
- Rialtic color tokens from `uno.config.ts`
- Typography shortcuts (`h1`, `body-1`, etc.)
- Component shortcuts (`btn`, `card`, `form-input`)
- Heroicons for icons

### Source of Truth
- `docs/current/MEMORY.md` - Current implementation status
- `docs/current/PROJECT_INSTRUCTIONS.md` - Developer patterns and setup
- `docs/current/STYLE_GUIDE.md` - UI/UX design standards
