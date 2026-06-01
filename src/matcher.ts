import { MatchResult, ParsedRule } from './types';

/**
 * Adblock's `^` separator matches any character that is NOT a letter, digit, or
 * one of `_ - . %`, OR the end of the address. We model that as a character
 * class plus an end-anchor alternative.
 */
const SEPARATOR = '(?:[^a-zA-Z0-9_%.\\-]|$)';

/** Regex metacharacters we must escape when copying a literal byte into a pattern. */
const REGEX_SPECIALS = /[.+?()[\]{}\\$=!|/]/g;

const regexCache = new Map<string, RegExp>();

/**
 * Convert a single Adblock network pattern into a RegExp.
 *
 * Supported tokens (the subset that covers the vast majority of real rules):
 *   ||  domain anchor — matches the start of a host or any subdomain boundary
 *   |   address-boundary anchor at start/end
 *   *   wildcard (any sequence)
 *   ^   separator character
 *
 * Adblock `$options` (e.g. `$third-party`, `$domain=`) are intentionally
 * stripped: this MVP answers "does the URL pattern match?", not the full
 * request-context decision an in-browser engine makes. That limitation is
 * documented rather than hidden, because silently pretending to honor options
 * would give users false confidence.
 */
export function ruleToRegex(pattern: string): RegExp {
    const cached = regexCache.get(pattern);
    if (cached) return cached;

    const dollar = pattern.indexOf('$');
    let body = dollar >= 0 ? pattern.slice(0, dollar) : pattern;

    let domainAnchor = false;
    let anchorStart = false;
    let anchorEnd = false;

    if (body.startsWith('||')) {
        domainAnchor = true;
        body = body.slice(2);
    } else if (body.startsWith('|')) {
        anchorStart = true;
        body = body.slice(1);
    }
    if (body.endsWith('|')) {
        anchorEnd = true;
        body = body.slice(0, -1);
    }

    let out = '';
    for (const ch of body) {
        if (ch === '*') out += '.*';
        else if (ch === '^') out += SEPARATOR;
        else out += ch.replace(REGEX_SPECIALS, '\\$&');
    }

    if (domainAnchor) {
        // Optional scheme, `//`, then an optional `subdomain.` prefix so that
        // ||ads.example.com^ also matches sub.ads.example.com but NOT notads.example.com.
        out = '^(?:[a-z][a-z0-9+.\\-]*:)?\\/\\/(?:[^\\/?#]*\\.)?' + out;
    } else if (anchorStart) {
        out = '^' + out;
    }
    if (anchorEnd) out += '$';

    const re = new RegExp(out, 'i');
    regexCache.set(pattern, re);
    return re;
}

/**
 * Decide whether `url` is blocked by `rules`.
 *
 * Exception (`@@`) rules win over blocking rules — this mirrors how real filter
 * engines resolve conflicts, so the result matches what a user would actually
 * experience in their browser.
 */
export function matchUrl(url: string, rules: ParsedRule[]): MatchResult {
    let blockMatch: ParsedRule | undefined;

    for (const rule of rules) {
        if (rule.type !== 'block' && rule.type !== 'allow' && rule.type !== 'hosts') continue;
        if (!rule.pattern) continue;

        if (ruleToRegex(rule.pattern).test(url)) {
            if (rule.isException) {
                // An allow rule short-circuits: nothing downstream can re-block.
                return { blocked: false, matched: rule };
            }
            if (!blockMatch) blockMatch = rule;
        }
    }

    return { blocked: Boolean(blockMatch), matched: blockMatch };
}
