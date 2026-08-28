## What

<!-- one paragraph: what changes and why -->

## Breaking?

- [ ] No public API changed (exports, options, CSS class names, variables)
- [ ] OR: this is breaking → version bump is **major**, CHANGELOG says
      "BREAKING" and lists the migration

## Checklist

- [ ] `npm test` green (unit) and `npm run test:e2e` green (invariants)
- [ ] CHANGELOG.md entry under the next version
- [ ] New behavior has a test that fails without the change
- [ ] Docs touched if the public surface changed (README / docs / llms.txt / AGENTS.md)
