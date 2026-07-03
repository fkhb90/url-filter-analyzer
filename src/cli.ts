#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './parser';
import { lint } from './linter';
import { matchUrl } from './matcher';
import { stats, diff } from './stats';

function readPackageVersion(): string {
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as {
        version?: unknown;
    };
    if (typeof pkg.version !== 'string') throw new Error('package.json version is missing');
    return pkg.version;
}

export const VERSION = readPackageVersion();

const HELP = `url-filter-analyzer (ufa) v${VERSION}

Lint, test, diff, and analyze ad-block / URL filter lists.

USAGE
  ufa <command> [options]

COMMANDS
  lint   <file>                 Report duplicates, empty rules, and redundant wildcards
  test   <file> --url <url>     Check whether a URL is blocked by the list
  stats  <file>                 Show rule-count breakdown by type
  diff   <fileA> <fileB>        Show network rules added/removed between two lists

OPTIONS
  --url <url>     URL to test (used by 'test')
  --json          Emit machine-readable JSON instead of a human report
  -h, --help      Show this help
  -v, --version   Show version

EXAMPLES
  ufa lint easylist.txt
  ufa test easylist.txt --url https://ads.example.com/banner.png
  ufa stats hosts.txt --json
  ufa diff old.txt new.txt
`;

interface Args {
    command?: string;
    positionals: string[];
    url?: string;
    json: boolean;
}

/** Minimal, dependency-free argv parser — keeps the supply chain at zero deps. */
function parseArgs(argv: string[]): Args {
    const args: Args = { positionals: [], json: false };
    for (let i = 0; i < argv.length; i++) {
        const token = argv[i];
        if (token === '--json') args.json = true;
        else if (token === '--url') args.url = argv[++i];
        else if (token === '-h' || token === '--help') args.command = 'help';
        else if (token === '-v' || token === '--version') args.command = 'version';
        else if (!args.command) args.command = token;
        else args.positionals.push(token);
    }
    return args;
}

function read(file: string | undefined): string {
    if (!file) throw new Error('Missing file argument');
    return readFileSync(file, 'utf8');
}

function out(json: boolean, data: unknown, human: () => void): void {
    if (json) console.log(JSON.stringify(data, null, 2));
    else human();
}

export function main(argv: string[]): number {
    const args = parseArgs(argv);

    switch (args.command) {
        case undefined:
        case 'help':
            console.log(HELP);
            return 0;

        case 'version':
            console.log(VERSION);
            return 0;

        case 'lint': {
            const file = args.positionals[0];
            const result = parse(read(file), file);
            const issues = lint(result);
            const errors = issues.filter((i) => i.severity === 'error').length;
            out(args.json, { file, issues }, () => {
                for (const i of issues) {
                    console.log(`${file}:${i.line}  ${i.severity.toUpperCase()}  [${i.code}] ${i.message}`);
                }
                console.log(`\n${issues.length} issue(s): ${errors} error(s), ${issues.length - errors} warning(s).`);
            });
            // Non-zero exit on errors so CI fails loudly — warnings do not break the build.
            return errors > 0 ? 1 : 0;
        }

        case 'test': {
            const file = args.positionals[0];
            if (!args.url) throw new Error("'test' requires --url <url>");
            const result = parse(read(file), file);
            const match = matchUrl(args.url, result.rules);
            out(args.json, { url: args.url, ...match }, () => {
                if (match.blocked) {
                    console.log(`BLOCKED   ${args.url}`);
                    console.log(`  by line ${match.matched?.line}: ${match.matched?.raw.trim()}`);
                } else if (match.matched) {
                    console.log(`ALLOWED   ${args.url}`);
                    console.log(`  exception on line ${match.matched.line}: ${match.matched.raw.trim()}`);
                } else {
                    console.log(`NO MATCH  ${args.url}`);
                }
            });
            return 0;
        }

        case 'stats': {
            const file = args.positionals[0];
            const result = parse(read(file), file);
            const s = stats(result);
            out(args.json, s, () => {
                console.log(`Total lines parsed : ${s.total}`);
                console.log(`Network rules      : ${s.network}`);
                console.log(`  block            : ${s.byType.block}`);
                console.log(`  allow (@@)       : ${s.byType.allow}`);
                console.log(`  hosts            : ${s.byType.hosts}`);
                console.log(`  cosmetic         : ${s.byType.cosmetic}`);
                console.log(`  comment          : ${s.byType.comment}`);
            });
            return 0;
        }

        case 'diff': {
            const [fileA, fileB] = args.positionals;
            const d = diff(parse(read(fileA), fileA), parse(read(fileB), fileB));
            out(args.json, d, () => {
                d.added.forEach((r) => console.log(`+ ${r}`));
                d.removed.forEach((r) => console.log(`- ${r}`));
                console.log(`\n${d.added.length} added, ${d.removed.length} removed.`);
            });
            return 0;
        }

        default:
            console.error(`Unknown command: ${args.command}\n`);
            console.log(HELP);
            return 2;
    }
}

if (require.main === module) {
    try {
        process.exit(main(process.argv.slice(2)));
    } catch (err) {
        // Surface failures loudly with a non-zero exit — never swallow them.
        console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(2);
    }
}
