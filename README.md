# url-filter-analyzer

> Lint, test, diff, and analyze ad-block / URL filter lists from the command line — zero runtime dependencies.

[![CI](https://github.com/fkhb90/url-filter-analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/fkhb90/url-filter-analyzer/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/url-filter-analyzer.svg)](https://www.npmjs.com/package/url-filter-analyzer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

`url-filter-analyzer` (`ufa`) is a small, fast toolkit for the people who **write and maintain** ad-block and tracker-blocking lists — EasyList-style Adblock rules, uBlock Origin / AdGuard syntax, and plain `hosts` files. It catches duplicates and dead rules before you publish, tells you exactly *why* a given URL is (or isn't) blocked, and shows what changed between two versions of a list.

It works as both a **CLI** and a **library**, and ships with **zero runtime dependencies** — nothing is pulled into your supply chain.

---

## Why this exists

Filter lists are config-as-code, but almost nobody tests them like code. Lists grow to tens of thousands of lines, accumulate duplicates, and quietly carry rules that can never match anything. When a user reports "this site is broken," the maintainer has no quick way to ask *which rule did that?*

`ufa` brings the basic hygiene tools we take for granted in software — a linter, a "does this match?" probe, and a diff — to filter-list maintenance.

## Features

- **Lint** — find duplicate rules, empty/unmatchable rules, and redundant wildcards, with exact line numbers.
- **Test** — check whether a specific URL is blocked, and see the precise rule (and line) that decided it, including `@@` exception overrides.
- **Stats** — get a rule-count breakdown by type (block / allow / hosts / cosmetic / comment).
- **Diff** — compare two list versions and see which network rules were added or removed.
- **Multi-syntax** — understands Adblock Plus / uBlock / AdGuard network rules **and** `hosts` files in one tool.
- **JSON output** — every command supports `--json` for CI pipelines and editor integrations.
- **Zero dependencies** — pure TypeScript, no third-party runtime packages.

> **Scope note (intentional, not hidden):** the matcher evaluates *pattern* matching — anchors (`||`, `|`), wildcards (`*`), and separators (`^`). Adblock `$options` such as `$third-party` or `$domain=` are parsed and preserved but **not** enforced during matching, because those require full request context a CLI doesn't have. `ufa test` answers "does the pattern match this URL?", not "would my browser block this exact request?". See [Roadmap](#roadmap).

## Installation

```bash
# Global CLI
npm install -g url-filter-analyzer

# Or run once without installing
npx url-filter-analyzer lint easylist.txt

# As a library in your project
npm install url-filter-analyzer
```

Requires Node.js >= 18.

## Usage

```text
ufa <command> [options]

Commands
  lint   <file>                 Report duplicates, empty rules, and redundant wildcards
  test   <file> --url <url>     Check whether a URL is blocked by the list
  stats  <file>                 Show rule-count breakdown by type
  diff   <fileA> <fileB>        Show network rules added/removed between two lists

Options
  --url <url>     URL to test (used by 'test')
  --json          Emit machine-readable JSON
  -h, --help      Show help
  -v, --version   Show version
```

## Examples

Lint a list (a sample list ships in [`examples/`](examples/easylist-sample.txt)):

```bash
$ ufa lint examples/easylist-sample.txt
examples/easylist-sample.txt:22  WARNING  [duplicate-rule] Duplicate of the rule first seen on line 6

1 issue(s): 0 error(s), 1 warning(s).
```

Find out why a URL is blocked:

```bash
$ ufa test examples/easylist-sample.txt --url https://ads.example.com/banner.png
BLOCKED   https://ads.example.com/banner.png
  by line 6: ||ads.example.com^
```

See an exception rule win:

```bash
$ ufa test examples/easylist-sample.txt --url https://analytics.example.org/public/x.js
ALLOWED   https://analytics.example.org/public/x.js
  exception on line 12: @@||analytics.example.org/public^
```

Use it as a library:

```ts
import { parse, matchUrl, lint } from 'url-filter-analyzer';

const list = parse('||ads.example.com^\n@@||ads.example.com/ok^');

matchUrl('https://ads.example.com/banner.png', list.rules);
// => { blocked: true, matched: { line: 1, raw: '||ads.example.com^', ... } }

lint(list); // => LintIssue[]
```

## Roadmap

- [ ] **v0.2** — `$domain=` and `$third-party` option-aware matching (`ufa test --origin <url>`)
- [ ] **v0.3** — fetch remote lists by URL with caching (`ufa lint https://...`)
- [ ] **v0.4** — performance report: flag pathological regex patterns and overly broad rules
- [ ] **v0.5** — GitHub Action wrapper so list repos can lint on every PR
- [ ] **v1.0** — stable library API + cosmetic-rule (CSS selector) validation

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup, coding conventions, and how to run the test suite. Good first issues are labelled [`good first issue`](https://github.com/fkhb90/url-filter-analyzer/labels/good%20first%20issue).

```bash
git clone https://github.com/fkhb90/url-filter-analyzer.git
cd url-filter-analyzer
npm install
npm test
npm run dev -- lint examples/easylist-sample.txt
```

## Related projects

- [URL_Ultimate_Filter](https://github.com/fkhb90/URL_Ultimate_Filter) — the companion filter list this tool was built to maintain.

## License

[MIT](LICENSE) © fkhb90
