# Contributing & releasing

The rules exist for one reason: **a library update must never be able to
break a production site.** Two halves make that true. Gates on this repo,
and pinning on the consumer side. Both are written down here.

## Day-to-day changes

1. Branch from `main`; open a PR (no direct pushes to `main`).
2. CI must be green: build, unit tests (including the **API-surface
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

1. Prepare the version on a release branch with `npm version <version> --no-git-tag-version`.
   Put the release notes first in CHANGELOG.md. Update the affected API guide, examples,
   public reference in `scripts/docs-build.mjs`, and agent recipes in AGENTS.md.
2. Run `npm run demo:sync` and commit the generated files with the sources.
   This rebuilds the public site, llms.txt and the bundled skill, including the
   current changelog entry. CI repeats generation in a clean checkout and checks
   for changed, deleted and newly generated files.
3. After review and merge, deploy the documentation from the exact merge commit
   with `npm run demo:deploy` and verify it with `npm run docs:check-live`.
   Tag that same commit as `v<version>` and push the tag.
4. The tag workflow tests the packed consumer and compares the public docs, demo,
   gallery and machine-readable references with its generated files before npm
   publication. If the public check fails, deploy the matching docs, verify and
   rerun the failed release job. Confirm the published npm version and tarball.

The npm package includes its matching SKILL.md and AGENTS.md. After upgrading
a consumer, refresh its installed skill with `npx scrollvars skill`; inspect
local edits before using `--force` to replace an existing customized copy.

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

## Generated files: never hand-patch

`npm run demo:sync` rebuilds everything that is derived, and CI fails if the
committed copy differs from what the build produces:

- docs/guide.md and AGENTS.md: the blocks between `<!-- vars:start -->`,
  `<!-- sizes:start -->` and `<!-- bench:start -->` markers, plus every line
  that carries a measured size, come from `scripts/docs-data.mjs`
  (`docs-stamp.mjs`, `bench-tables.mjs`). Edit the data, not the block.
- demo/llms.txt is AGENTS.md with a machine-facing header. Edit AGENTS.md.
- demo/fx/*, demo/docs/*, demo/bench/index.html tables, styles.css and the
  inlined engine blocks in demo/index.html are outputs of the scripts in
  `scripts/`. The gallery content lives in `scripts/fx-data.mjs`.
