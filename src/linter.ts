import { ParseResult } from './types';

export type Severity = 'error' | 'warning';

export interface LintIssue {
    line: number;
    severity: Severity;
    code: string;
    message: string;
    rule: string;
}

/**
 * Static analysis over a parsed filter list.
 *
 * The goal is the kind of feedback a list maintainer actually wants before they
 * publish: duplicates that bloat the list, rules that can never match, and
 * patterns that are almost certainly typos. We err toward `warning` over
 * `error` so the linter is usable in CI without being a nuisance — only
 * genuinely broken rules are errors.
 */
export function lint(result: ParseResult): LintIssue[] {
    const issues: LintIssue[] = [];
    const firstSeen = new Map<string, number>();

    for (const rule of result.rules) {
        if (rule.type === 'comment') continue;

        // Duplicate detection keyed by (type, pattern): an allow rule and a block
        // rule with the same pattern are NOT duplicates — they mean opposite things.
        if (rule.pattern) {
            const key = `${rule.type}:${rule.pattern}`;
            const seenAt = firstSeen.get(key);
            if (seenAt !== undefined) {
                issues.push({
                    line: rule.line,
                    severity: 'warning',
                    code: 'duplicate-rule',
                    message: `Duplicate of the rule first seen on line ${seenAt}`,
                    rule: rule.raw.trim(),
                });
            } else {
                firstSeen.set(key, rule.line);
            }
        }

        // A block/allow rule with no pattern can never match anything.
        if ((rule.type === 'block' || rule.type === 'allow') && rule.pattern === '') {
            issues.push({
                line: rule.line,
                severity: 'error',
                code: 'empty-rule',
                message: 'Rule has no matchable pattern',
                rule: rule.raw.trim(),
            });
        }

        // `**` and longer wildcard runs are redundant — `*` already matches any
        // sequence, so consecutive wildcards only slow matching down.
        if (rule.pattern.includes('**')) {
            issues.push({
                line: rule.line,
                severity: 'warning',
                code: 'redundant-wildcard',
                message: 'Consecutive `*` wildcards are redundant; a single `*` is equivalent',
                rule: rule.raw.trim(),
            });
        }
    }

    return issues;
}
