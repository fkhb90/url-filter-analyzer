import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser';
import { matchUrl, ruleToRegex } from '../src/matcher';

describe('ruleToRegex', () => {
    it('expands the ^ separator to match a path slash or end of string', () => {
        const re = ruleToRegex('||ads.example.com^');
        expect(re.test('https://ads.example.com/banner.png')).toBe(true);
        expect(re.test('https://ads.example.com')).toBe(true); // ^ also matches end-of-address
    });

    it('matches subdomains via the || anchor', () => {
        const re = ruleToRegex('||ads.example.com^');
        expect(re.test('https://sub.ads.example.com/x')).toBe(true);
    });

    it('does NOT match a look-alike host that shares a suffix', () => {
        const re = ruleToRegex('||ads.example.com^');
        expect(re.test('https://notads.example.com/x')).toBe(false);
    });
});

describe('matchUrl', () => {
    const rules = parse(
        ['||ads.example.com^', '@@||ads.example.com/allowed^', '0.0.0.0 tracker.test'].join('\n'),
    ).rules;

    it('blocks a URL that matches a blocking rule', () => {
        expect(matchUrl('https://ads.example.com/banner.png', rules).blocked).toBe(true);
    });

    it('lets an exception rule override a blocking rule', () => {
        expect(matchUrl('https://ads.example.com/allowed', rules).blocked).toBe(false);
    });

    it('blocks via a normalized hosts entry', () => {
        expect(matchUrl('https://tracker.test/pixel.gif', rules).blocked).toBe(true);
    });

    it('returns no match for an unrelated URL', () => {
        const result = matchUrl('https://example.org/', rules);
        expect(result.blocked).toBe(false);
        expect(result.matched).toBeUndefined();
    });
});
