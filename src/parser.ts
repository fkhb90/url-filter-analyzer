import { ParseResult, ParsedRule, RuleType } from './types';

/**
 * Matches a hosts-file redirect entry such as `0.0.0.0 ads.example.com` or
 * `127.0.0.1 tracker.example.net`. We capture the hostname so it can be
 * rewritten into an Adblock-style `||host^` pattern.
 */
const HOSTS_RE = /^(?:0\.0\.0\.0|127\.0\.0\.1|::1|::)\s+(\S+)/;

/**
 * Detects cosmetic / element-hiding separators (`##`, `#@#`, `#?#`, `#$#`).
 * These are not network rules, so the matcher ignores them — but the linter and
 * stats still want to count them.
 */
const COSMETIC_RE = /#@?#|#\?#|#\$#/;

/**
 * Parse a filter list into structured rules.
 *
 * The parser is deliberately format-tolerant: a single list in the wild often
 * mixes Adblock syntax, AdGuard extensions, and hosts entries. Rather than
 * reject unknown lines we classify them and let downstream tools decide what to
 * do — surfacing problems is the linter's job, not the parser's.
 */
export function parse(text: string, source = '<input>'): ParseResult {
    const rules: ParsedRule[] = [];
    const lines = text.split(/\r?\n/);

    lines.forEach((raw, index) => {
        const line = index + 1;
        const trimmed = raw.trim();

        // Blank lines carry no information and would only create noise downstream.
        if (trimmed === '') return;

        let type: RuleType = 'block';
        let pattern = trimmed;
        let isException = false;

        if (trimmed.startsWith('!') || trimmed.startsWith('# ') || trimmed === '#') {
            // Adblock (`!`) and hosts (`#`) comments. `# ` / lone `#` only, so we
            // don't swallow `##.ad` cosmetic rules that also start with `#`.
            type = 'comment';
            pattern = '';
        } else {
            const hosts = HOSTS_RE.exec(trimmed);
            if (hosts) {
                // Normalize to ||host^ so the matcher has one code path for all
                // network rules regardless of original syntax.
                type = 'hosts';
                pattern = `||${hosts[1]}^`;
            } else if (COSMETIC_RE.test(trimmed)) {
                type = 'cosmetic';
                pattern = trimmed;
            } else if (trimmed.startsWith('@@')) {
                type = 'allow';
                isException = true;
                pattern = trimmed.slice(2);
            } else {
                type = 'block';
                pattern = trimmed;
            }
        }

        rules.push({ raw, line, type, pattern, isException });
    });

    return { rules, source };
}
