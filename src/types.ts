/**
 * Core type definitions shared across the parser, matcher, and linter.
 *
 * We keep these intentionally small and serializable so the same shapes can be
 * emitted as JSON (`--json`) without any transformation step.
 */

export type RuleType =
    | 'block'      // standard blocking rule, e.g. ||ads.example.com^
    | 'allow'      // exception rule, e.g. @@||example.com^
    | 'hosts'      // hosts-file entry, e.g. 0.0.0.0 ads.example.com
    | 'cosmetic'   // element-hiding rule, e.g. example.com##.banner
    | 'comment'    // ! or # comment line
    | 'unknown';

export interface ParsedRule {
    /** The original, untrimmed source line. */
    raw: string;
    /** 1-based line number in the source. */
    line: number;
    type: RuleType;
    /**
     * The matchable network pattern in Adblock syntax. For `hosts` rules this is
     * normalized into `||domain^` form so the matcher can treat every network
     * rule uniformly. Empty for comments and cosmetic rules.
     */
    pattern: string;
    /** True for `@@` exception rules — these unblock a request. */
    isException: boolean;
}

export interface ParseResult {
    rules: ParsedRule[];
    source: string;
}

export interface MatchResult {
    blocked: boolean;
    /** The rule that decided the outcome (a blocking rule, or the exception that overrode it). */
    matched?: ParsedRule;
}
