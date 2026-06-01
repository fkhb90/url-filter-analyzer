import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser';
import { lint } from '../src/linter';

describe('lint', () => {
    it('flags an exact duplicate rule and points at the first occurrence', () => {
        const issues = lint(parse('||ads.com^\n||ads.com^'));
        const dup = issues.find((i) => i.code === 'duplicate-rule');
        expect(dup).toBeDefined();
        expect(dup?.line).toBe(2);
        expect(dup?.message).toContain('line 1');
    });

    it('does not treat a block and an allow rule with the same pattern as duplicates', () => {
        const issues = lint(parse('||ads.com^\n@@||ads.com^'));
        expect(issues.filter((i) => i.code === 'duplicate-rule')).toHaveLength(0);
    });

    it('reports redundant consecutive wildcards as a warning', () => {
        const issues = lint(parse('||ads**tracker.com^'));
        expect(issues.some((i) => i.code === 'redundant-wildcard')).toBe(true);
    });
});
