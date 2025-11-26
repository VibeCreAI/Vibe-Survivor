# Vibe Survivor Documentation Index

This directory contains detailed technical documentation for the Vibe Survivor game project.

## Documentation Overview

### Project Documentation

#### Root Level
- **[README.md](../README.md)** - Main project overview, features, gameplay instructions, and quick start guide
- **[CLAUDE.md](../CLAUDE.md)** - Development guidance and architecture overview for Claude Code
- **[AGENTS.md](../AGENTS.md)** - Custom AI agent workflows and development methodology
- **[LICENSE](../LICENSE)** - Project license and copyright information

#### Technical Documentation (this folder)
- **[REFACTOR.md](./REFACTOR.md)** - Complete refactoring journey from monolithic to modular architecture
- **[boss-system.md](./boss-system.md)** - Boss enemy system design, behaviors, and implementation details
- **[GLOBAL_SCOREBOARD_PLAN.md](./GLOBAL_SCOREBOARD_PLAN.md)** - Comprehensive implementation plan for global leaderboard with Supabase

#### Supabase Backend Documentation
- **[supabase/README.md](../supabase/README.md)** - Git guide for Supabase files (what to commit vs ignore)
- **[supabase/SETUP_INSTRUCTIONS.md](../supabase/SETUP_INSTRUCTIONS.md)** - Step-by-step backend setup guide
- **[supabase/setup.sql](../supabase/setup.sql)** - Database schema, RLS policies, and indexes
- **[supabase/functions/submit-score/](../supabase/functions/submit-score/)** - Edge Function for score validation

---

## Quick Navigation by Topic

### Getting Started
- **New to the project?** → Start with [README.md](../README.md)
- **Setting up development?** → Read [CLAUDE.md](../CLAUDE.md)
- **Deploying the game?** → See deployment section in [README.md](../README.md)

### Architecture & Design
- **Understanding the codebase?** → Read [REFACTOR.md](./REFACTOR.md)
- **How systems work?** → Check [CLAUDE.md](../CLAUDE.md) architecture section
- **Boss mechanics?** → Read [boss-system.md](./boss-system.md)

### Global Leaderboard
- **Implementation details?** → Read [GLOBAL_SCOREBOARD_PLAN.md](./GLOBAL_SCOREBOARD_PLAN.md)
- **Backend setup?** → Follow [supabase/SETUP_INSTRUCTIONS.md](../supabase/SETUP_INSTRUCTIONS.md)
- **Frontend integration?** → See global leaderboard section in [CLAUDE.md](../CLAUDE.md)

### Development Process
- **AI-assisted workflow?** → Read [AGENTS.md](../AGENTS.md)
- **Contributing?** → See contributing section in [README.md](../README.md)

---

## Documentation Standards

### File Organization
- **Root level** - User-facing and general project documentation
- **docs/** - Technical design docs, implementation plans, system documentation
- **supabase/** - Backend-specific documentation and setup guides

### Naming Conventions
- Use **UPPER_CASE.md** for major project docs (README, CLAUDE, AGENTS)
- Use **kebab-case.md** for feature/system-specific docs (boss-system, setup-instructions)

### Content Guidelines
- Keep docs up-to-date with code changes
- Use clear section headers and table of contents for long docs
- Include code examples where helpful
- Link to related documentation

---

## Documentation Maintenance

### When to Update Documentation
- **Adding new features** → Update CLAUDE.md architecture section
- **Changing game mechanics** → Update relevant system docs (e.g., boss-system.md)
- **Refactoring code** → Document in REFACTOR.md if significant
- **Adding backend features** → Update Supabase docs and config guides

### Documentation Checklist
- [ ] Updated relevant technical docs in `docs/`
- [ ] Updated CLAUDE.md if architecture changed
- [ ] Updated README.md if user-facing features changed
- [ ] Verified all links work
- [ ] Added to this index if new doc created

---

## Project Status

**Current Version:** 1.0+
**Architecture:** Modular (refactored from monolithic)
**Backend:** Supabase (optional global leaderboard)
**Documentation Status:** ✅ Complete and up-to-date

---

*Last updated: November 26, 2024*
