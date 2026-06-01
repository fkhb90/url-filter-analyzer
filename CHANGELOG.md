# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- `$domain=` / `$third-party` option-aware matching
- Remote list fetching with caching

## [0.1.0] - 2026-06-01

### Added
- `ufa lint` — duplicate, empty-rule, and redundant-wildcard detection with line numbers
- `ufa test --url` — per-URL block/allow resolution with the deciding rule
- `ufa stats` — rule-count breakdown by type
- `ufa diff` — network-rule added/removed comparison between two lists
- Multi-syntax parser: Adblock Plus / uBlock / AdGuard network rules + hosts files
- `--json` output on every command
- Library API (`parse`, `matchUrl`, `ruleToRegex`, `lint`, `stats`, `diff`)
- Test suite (parser, matcher, linter) and GitHub Actions CI

[Unreleased]: https://github.com/fkhb90/url-filter-analyzer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/fkhb90/url-filter-analyzer/releases/tag/v0.1.0
