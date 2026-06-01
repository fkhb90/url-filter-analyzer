/**
 * Public library API.
 *
 * `url-filter-analyzer` is usable both as a CLI (`ufa`) and as a library. This
 * module is the single entry point for programmatic consumers — everything
 * exported here is considered stable surface and follows semver.
 */
export { parse } from './parser';
export { ruleToRegex, matchUrl } from './matcher';
export { lint } from './linter';
export type { LintIssue, Severity } from './linter';
export { stats, diff } from './stats';
export type { Stats } from './stats';
export type { ParsedRule, ParseResult, RuleType, MatchResult } from './types';
