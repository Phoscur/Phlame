# Contributing to Phlame

Thanks for your interest! Phlame is a spare-time passion project under
[AGPLv3](./license.md) — it requires forking publicly anyways, so start with a fork.

## Before you start

- **Open an issue first** before creating a pull request.
- Read [CONTEXT.md](./CONTEXT.md) (architecture tour) and skim
  [PLAN.md](./PLAN.md) — it lists milestones and open questions, and is the best
  place to find something to work on.
- Check [docs/decisions/](./docs/decisions/README.md) before proposing structural
  changes — most "why don't you just..." questions are answered there.
  New decisions of consequence get a new ADR, agreed in the issue first.

## Ground rules

- **No React** — and no framework at all. `.tsx` is Hono JSX on the server, pure
  Custom Elements + Signals on the client ([ADR 0001](./docs/decisions/0001-no-frontend-framework-no-react-just-hono-jsx.md)).
  If we ever adopt one it's SolidJS or VanJS.
- **The engine stays pure**: `engine/src` imports nothing from the app, node, or any
  package. Value objects are immutable, amounts are int32 (don't "fix" the `| 0` casts —
  [ADR 0003](./docs/decisions/0003-int32-resource-arithmetic.md)/[0005](./docs/decisions/0005-immutable-value-objects.md)).
  Every engine module keeps its `*.spec.ts` sibling green and covering new behavior.
- User-facing strings go through `src/app/i18n.ts`, not hardcoded.
- Match existing style; formatting via oxfmt (`npx vp fmt`), linting via oxlint —
  `npm run lint` checks both.
- Update the docs you invalidate (CONTEXT.md, PLAN.md, glossary) in the same PR.

## Developing

```
npm install
npm start            # dev server at http://localhost:4200
npx vitest           # app unit tests (watch)
npm run test-engine  # engine library tests (watch)
npm run tsc && npm run lint
npm run e2e          # Playwright (or: npm run ci)
```

## Commits & sign-off (DCO)

Keep commits small and focussed, titled with a capitalised verb in imperative
(`Add`, `Fix`, `Change`, `Refactor`, ...).

All contributions must be signed off under the
[Developer Certificate of Origin](https://developercertificate.org/):

```
git commit -s
```

The `Signed-off-by:` line certifies that you wrote the change (or otherwise have the
right to submit it) and that you contribute it under the project's AGPLv3 license.
