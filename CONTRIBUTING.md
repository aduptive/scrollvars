# Contributing & releasing

The rules exist for one reason: **a library update must never be able to
break a production site.** Two halves make that true. Gates on this repo,
and pinning on the consumer side. Both are written down here.

## Day-to-day changes

1. Branch from `main`; open a PR (no direct pushes to `main`).
2. CI must be green: build, 22 unit tests (including the **API-surface
   snapshot**. If it trips, you made a breaking change), and the
   progressive-enhancement invariants (no-JS renders complete, nothing
   hidden before `html.sv-on`).
3. At least **one approving review** from a code owner (see
   `.github/CODEOWNERS`).
4. Every PR states in its description whether the public surface changed
   (exports, options, CSS class names, CSS variables. Class names and
   variables ARE public API here).

## Versioning (semver, taken literally)

- **patch**: fixes, no observable behavior change for correct usage.
- **minor**: new exports/presets/options; the API-surface test gains
  lines, never loses them.
- **major**: anything removed or renamed, any default changed, any CSS
  class/variable renamed. CHANGELOG carries a **BREAKING** section with the
  migration. Majors are rare and deliberate.

## Releasing (never from a laptop)

```bash
npm version minor        # bumps package.json + creates the vX.Y.Z tag
git push --follow-tags
```

The tag triggers `.github/workflows/release.yml`, which republishes ONLY if
every gate passes: unit + e2e + tag-matches-version + a pack-smoke that
installs the actual tarball into a throwaway consumer and imports it. The
npm publish carries provenance. No green, no release: there is no manual
path to npm.

## The other half: how consumers must depend on this

A site can only be broken by an update it never asked for. Therefore:

- Consumers pin via **lockfile** and install with `npm ci` in CI/CD.
  A new library version reaches production ONLY through a version-bump PR
  in the consumer repo, which runs the consumer's own build + tests.
- Renovate/Dependabot opens those bump PRs automatically; a human merges.
- Never depend on `latest`, `*`, or a git branch. `file:` deps are for
  local development only.

If both halves are in place, the failure mode "colleague updates plugin,
production breaks" is structurally impossible: the update sits in a PR
until the consumer's own CI proves it harmless.
