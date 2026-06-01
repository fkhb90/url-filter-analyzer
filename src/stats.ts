import { ParseResult, RuleType } from './types';

export interface Stats {
    total: number;
    byType: Record<RuleType, number>;
    /** Actionable network rules (block + allow + hosts). */
    network: number;
}

/**
 * Summarize the composition of a filter list. Maintainers use this to spot, for
 * example, a list that is 90% cosmetic rules when it claims to be a network
 * blocklist, or a sudden jump in rule count between releases.
 */
export function stats(result: ParseResult): Stats {
    const byType: Record<RuleType, number> = {
        block: 0,
        allow: 0,
        hosts: 0,
        cosmetic: 0,
        comment: 0,
        unknown: 0,
    };

    for (const rule of result.rules) {
        byType[rule.type]++;
    }

    return {
        total: result.rules.length,
        byType,
        network: byType.block + byType.allow + byType.hosts,
    };
}

/**
 * Compare two parsed lists and report which network rules were added or removed.
 * Keyed by `type:pattern` so a rule that merely moved lines is not reported as
 * a change.
 */
export function diff(a: ParseResult, b: ParseResult): { added: string[]; removed: string[] } {
    const keyset = (r: ParseResult) =>
        new Set(
            r.rules
                .filter((x) => x.type !== 'comment' && x.pattern)
                .map((x) => `${x.type}:${x.pattern}`),
        );

    const left = keyset(a);
    const right = keyset(b);

    const added = [...right].filter((k) => !left.has(k));
    const removed = [...left].filter((k) => !right.has(k));

    return { added, removed };
}
