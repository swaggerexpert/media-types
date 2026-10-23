# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment Setup

Before running any commands, ensure you're using the correct Node.js version specified in `.nvmrc`:

```bash
nvm use                  # Switch to Node.js version from .nvmrc
```

## Build Commands

```bash
npm install              # Install dependencies
npm run build            # Full build (grammar + ES + CJS + UMD browser bundles)
npm run grammar:compile  # Compile ABNF grammar to parser (src/grammar.bnf → src/grammar.js)
npm test                 # Run all tests with Mocha
npm test -- --grep "pattern"  # Run specific tests matching pattern
npm test -- test/parse/media-type.js  # Run a single test file
```

## Architecture

This is an RFC 9110 media type, media range and `Accept` field value parser, validator and matcher.

### Grammar

`src/grammar.bnf` is ABNF taken verbatim from the body of RFC 9110 (not from Appendix A, see Errata ID 9164).
Do not change the grammar beyond what the ordered choice of apg-lite requires; every such change
must preserve the accepted language and be marked with a `MODIFICATION:` comment.
Semantic rules the RFC states in prose (e.g. "q" parameter is the weight) live in the translators, not in the grammar.

Start rules: `media-type` (default), `media-range`, `Accept`.

### Core Pipeline

1. **Parsing** (`src/parse/`) - apg-lite parser with pluggable translators (AST, CST, XML)
2. **Validation** (`src/test/`) - `testMediaType`, `testMediaRange`, `testAccept`; `qvalue.js` is internal
3. **Matching** (`src/match/`) - `matches`, `selectBestMatch`, `quality`, `negotiate`; shared logic in `utils.js`

### Parse Translators

Located in `src/parse/translators/`:
- `ASTTranslator` (default) - `{ type, subtype, suffix?, parameters }`; for `Accept` a list of those with `weight`
- `CSTTranslator` - Concrete syntax tree with node positions and original text
- `XMLTranslator` - XML string representation

### Error Hierarchy

All errors extend `MediaTypeError`:
- `MediaTypeParseError` - Invalid input passed to matching functions, or unexpected parser failure

### Compliance Tests

`test/compliance/` runs vendored third-party suites against the parser and matcher:
- `fixtures/wpt/` - web-platform-tests MIME type parsing tests (WHATWG algorithm, used as an oracle)
- `fixtures/negotiator/` - negotiator media type negotiation tests, extracted as data

Known deviations (inputs other implementations recover from, but RFC 9110 rejects) are listed explicitly in the test files.

### Module Formats

The build produces three formats:
- `es/` - ES modules (.mjs)
- `cjs/` - CommonJS (.cjs)
- `dist/` - UMD browser bundles (media-types.browser.js, media-types.browser.min.js)

TypeScript types are in `types/index.d.ts`.
