# Contributing to url-filter-analyzer

Thanks for considering a contribution! This project is small and friendly to
first-time contributors.

## Development setup

```bash
git clone https://github.com/fkhb90/url-filter-analyzer.git
cd url-filter-analyzer
npm install
```

## Common tasks

| Command              | What it does                                  |
| -------------------- | --------------------------------------------- |
| `npm test`           | Run the full test suite once (Vitest)         |
| `npm run test:watch` | Re-run tests on change                        |
| `npm run typecheck`  | Type-check without emitting                   |
| `npm run build`      | Compile TypeScript to `dist/`                 |
| `npm run dev -- ...` | Run the CLI from source, e.g. `-- lint x.txt` |

## Conventions

- **TypeScript, strict mode.** No `any` unless justified with a comment.
- **Zero runtime dependencies.** Dev dependencies are fine; runtime ones need a strong reason.
- **Tests verify intent, not implementation.** A change in behavior should break a test.
- **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.
- **Surface failures.** Never swallow an error or silently skip input — make problems visible.

## Pull requests

1. Fork and create a branch: `git checkout -b feat/my-change`
2. Add or update tests for your change.
3. Make sure `npm test` and `npm run typecheck` pass.
4. Open a PR describing **what** changed and **why**.

## Reporting bugs

Open an [issue](https://github.com/fkhb90/url-filter-analyzer/issues) with a
minimal filter-list snippet and the command you ran. Reproductions make fixes
fast.
