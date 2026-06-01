import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser';

describe('parse', () => {
    it('classifies a standard blocking rule', () => {
        const { rules } = parse('||ads.example.com^');
        expect(rules).toHaveLength(1);
        expect(rules[0]).toMatchObject({ type: 'block', isException: false });
    });

    it('treats @@ rules as allow/exception rules and strips the @@', () => {
        const { rules } = parse('@@||example.com^');
        expect(rules[0]).toMatchObject({ type: 'allow', isException: true, pattern: '||example.com^' });
    });

    it('normalizes hosts entries into ||host^ form', () => {
        const { rules } = parse('0.0.0.0 ads.example.com');
        expect(rules[0]).toMatchObject({ type: 'hosts', pattern: '||ads.example.com^' });
    });

    it('recognizes ! and "# " comments but not ## cosmetic rules', () => {
        const { rules } = parse('! Title: My List\n# a hosts comment\nexample.com##.banner');
        expect(rules[0].type).toBe('comment');
        expect(rules[1].type).toBe('comment');
        expect(rules[2].type).toBe('cosmetic');
    });

    it('skips blank lines and tracks 1-based line numbers', () => {
        const { rules } = parse('\n\n||a.com^');
        expect(rules).toHaveLength(1);
        expect(rules[0].line).toBe(3);
    });
});
