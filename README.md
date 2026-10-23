# @swaggerexpert/media-types

[![npmversion](https://img.shields.io/npm/v/%40swaggerexpert%2Fmedia-types?style=flat-square&label=npm%20package&color=%234DC81F&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40swaggerexpert%2Fmedia-types)](https://www.npmjs.com/package/@swaggerexpert/media-types)
[![npm](https://img.shields.io/npm/dm/@swaggerexpert/media-types)](https://www.npmjs.com/package/@swaggerexpert/media-types)
[![Test workflow](https://github.com/swaggerexpert/media-types/actions/workflows/test.yml/badge.svg)](https://github.com/swaggerexpert/media-types/actions)
[![Dependabot enabled](https://img.shields.io/badge/Dependabot-enabled-blue.svg)](https://dependabot.com/)
[![](https://data.jsdelivr.com/v1/package/npm/@swaggerexpert/media-types/badge)](https://www.jsdelivr.com/package/npm/@swaggerexpert/media-types)
[![Tidelift](https://tidelift.com/badges/package/npm/@swaggerexpert%2Fmedia-types)](https://tidelift.com/subscription/pkg/npm-.swaggerexpert-media-types?utm_source=npm-swaggerexpert-media-types&utm_medium=referral&utm_campaign=readme)

`@swaggerexpert/media-types` is a **parser**, **validator** and **matcher** for media types, media ranges
and `Accept` field values as defined in [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (HTTP Semantics).

A single parse yields **type**, **subtype**, **structured syntax suffix** ([RFC 6838](https://www.rfc-editor.org/rfc/rfc6838#section-4.2.8))
and **parameters**. Matching follows the precedence rules of [RFC 9110, Section 12.5.1](https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1).

<table>
  <tr>
    <td align="right" valign="middle">
        <img src="https://raw.githubusercontent.com/swaggerexpert/media-types/main/assets/tidelift.webp" alt="Tidelift" width="60" />
      </td>
      <td valign="middle">
        <a href="https://tidelift.com/subscription/pkg/npm-.swaggerexpert-media-types?utm_source=npm-swaggerexpert-media-types&utm_medium=referral&utm_campaign=readme">
            Get professionally supported @swaggerexpert/media-types with Tidelift Subscription.
        </a>
      </td>
  </tr>
</table>

## Table of Contents

- [Getting started](#getting-started)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Parsing](#parsing)
      - [Media Type](#media-type)
      - [Media Range](#media-range)
      - [Accept](#accept)
      - [Translators](#translators)
        - [CST](#cst-translator)
        - [AST](#ast-translator)
        - [XML](#xml-translator)
      - [Statistics](#statistics)
      - [Tracing](#tracing)
    - [Identification](#identification)
    - [Validation](#validation)
    - [Matching](#matching)
      - [matches](#matches)
      - [selectBestMatch](#selectbestmatch)
      - [quality](#quality)
      - [negotiate](#negotiate)
      - [Parameter matching](#parameter-matching)
      - [Invalid input](#invalid-input)
    - [Errors](#errors)
    - [Grammar](#grammar)
- [Compliance](#compliance)
- [Comparison with media-typer and content-type](#comparison-with-media-typer-and-content-type)
- [More about media types](#more-about-media-types)
- [License](#license)

## Getting started

### Installation

You can install `@swaggerexpert/media-types` using `npm`:

```sh
 $ npm install @swaggerexpert/media-types
```

---

**[unpkg.com](https://unpkg.com/)**

Include following script tag into your HTML file:

```html
<script src="https://unpkg.com/@swaggerexpert/media-types@latest/dist/media-types.browser.min.js"></script>
```

Global variable `MediaTypes` will be available in the browser matching interface of `@swaggerexpert/media-types` npm package.
`media-types.browser.min.js` is [UMD](https://github.com/umdjs/umd?tab=readme-ov-file#umd-universal-module-definition) minified build artifact.
There is also unminified `media-types.browser.js` artifact, suitable for debugging.

---

**[jsDelivr](https://www.jsdelivr.com/)**

Include following script tag into your HTML file (ESM mode):

```html
<script type="module">
  import * as MediaTypes from 'https://cdn.jsdelivr.net/npm/@swaggerexpert/media-types@latest/+esm'
</script>
```

Local variable `MediaTypes` will be available in scope of the `<script>` tag matching interface of `@swaggerexpert/media-types` package.

### Usage

`@swaggerexpert/media-types` currently supports **parsing**, **identification**, **validation** and **matching**.
Both parser and validator are based on [ABNF](https://www.rfc-editor.org/rfc/rfc5234) grammar taken from RFC 9110
and use [apg-lite](https://github.com/ldthomas/apg-lite) parser generator.

#### Parsing

Parsing is as simple as importing the **parse** function and calling it.

```js
import { parse } from '@swaggerexpert/media-types';

const parseResult = parse('text/html;charset=utf-8');
```

**parseResult** variable has the following shape:

```
{
  result: <ParseResult['result]>,
  tree: <ParseResult['tree']>,
  stats: <ParseResult['stats']>,
  trace: <ParseResult['trace']>,
}
```

Media types, media ranges and `Accept` field values share the same syntax (every media type is a valid media range,
every media range is a valid `Accept` field value). Without the `type` option, `parse` determines the type of the source
using [identify](#identification); source that cannot be identified is parsed as media type.
The `type` option (`media-type`, `media-range` or `accept`) forces the type. Force the type whenever it is known upfront,
e.g. always parse `Accept` header field values with `{ type: 'accept' }`, so that the shape of the result does not depend
on the value (`text/html` would otherwise be identified as media type).

```js
import { parse } from '@swaggerexpert/media-types';

parse('text/html'); // parsed as media type
parse('text/*'); // parsed as media range
parse('text/html, */*;q=0.1'); // parsed as Accept field value
parse('text/html', { type: 'accept' }); // forced to be parsed as Accept field value
```

[TypeScript typings](https://github.com/swaggerexpert/media-types/blob/main/types/index.d.ts) are available for all fields attached to parse result object returned by the `parse` function.

##### Media Type

[RFC 9110, Section 8.3.1](https://www.rfc-editor.org/rfc/rfc9110#section-8.3.1) media type, e.g. the value of `Content-Type` header field.

```js
import { parse } from '@swaggerexpert/media-types';

parse('application/vnd.api+json; charset="UTF-8"').tree;
// =>
// {
//   type: 'application',
//   subtype: 'vnd.api+json',
//   suffix: 'json',
//   parameters: { charset: 'UTF-8' },
// }
```

- `type`, `subtype` and parameter names are case-insensitive and are always lower-cased.
- Parameter values keep their case, as their case-sensitivity depends on the parameter semantics.
- Quoted parameter values are unquoted and their quoted-pairs (`\"`, `\\`) resolved.
- `subtype` is kept whole; `suffix` holds the part after the last `+` ([RFC 6838, Section 4.2.8](https://www.rfc-editor.org/rfc/rfc6838#section-4.2.8)) and is present only when there is one.
- When a parameter occurs more than once, the first occurrence wins ([RFC 6838, Section 4.3](https://www.rfc-editor.org/rfc/rfc6838#section-4.3)).

##### Media Range

[RFC 9110, Section 12.5.1](https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1) media range, e.g. keys of OpenAPI `content` maps.
Media range has the same AST shape as media type.

```js
import { parse } from '@swaggerexpert/media-types';

parse('text/*;level=1', { type: 'media-range' }).tree;
// => { type: 'text', subtype: '*', parameters: { level: '1' } }
```

##### Accept

[RFC 9110, Section 12.5.1](https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1) `Accept` field value.
Every media range carries its `weight` ([RFC 9110, Section 12.4.2](https://www.rfc-editor.org/rfc/rfc9110#section-12.4.2)), defaulting to `1`.

```js
import { parse } from '@swaggerexpert/media-types';

parse('text/html;level=1;q=0.5, application/json, */*;q=0.1', { type: 'accept' }).tree;
// =>
// [
//   { type: 'text', subtype: 'html', parameters: { level: '1' }, weight: 0.5 },
//   { type: 'application', subtype: 'json', parameters: {}, weight: 1 },
//   { type: '*', subtype: '*', parameters: {}, weight: 0.1 },
// ]
```

As RFC 9110 requires, any parameter named `q` is processed as weight, regardless of parameter ordering.
A `q` value that is not a valid `qvalue` (e.g. `q=2`) results in `NaN` weight; matching functions ignore such element.
Empty list elements (`text/html, , */*`) are allowed as required from recipients by [RFC 9110, Section 5.6.1.2](https://www.rfc-editor.org/rfc/rfc9110#section-5.6.1.2).

##### Translators

`@swaggerexpert/media-types` provides several translators to convert the parse result into different tree representations.

###### CST translator

[Concrete Syntax Tree](https://en.wikipedia.org/wiki/Parse_tree) (Parse tree) representation is available on parse result
when instance of `CSTTranslator` is provided via a `translator` option to the `parse` function.
CST is suitable to be consumed by other tools like IDEs, editors, etc...
CST preserves the original text of every node, including original case and quoting.

```js
import { parse, CSTTranslator } from '@swaggerexpert/media-types';

const { tree: CST } = parse('text/html;charset=utf-8', { translator: new CSTTranslator() });
```

CST tree has a shape documented by [TypeScript typings (CSTTree)](https://github.com/swaggerexpert/media-types/blob/main/types/index.d.ts).

###### AST translator

**Default translator**. [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) representation is available on parse result
by default or when instance of `ASTTranslator` is provided via a `translator` option to the `parse` function.
Its shape is described in the [Media Type](#media-type), [Media Range](#media-range) and [Accept](#accept) sections.

```js
import { parse, ASTTranslator } from '@swaggerexpert/media-types';

const { tree: AST } = parse('text/html', { translator: new ASTTranslator() });
```

###### XML translator

```js
import { parse, XMLTranslator } from '@swaggerexpert/media-types';

const { tree: XML } = parse('text/html;charset=utf-8', { translator: new XMLTranslator() });
```

##### Statistics

`parse` function returns additional statistical information about the parsing process.
Collection of the statistics can be enabled by setting `stats` option to `true`.

```js
import { parse } from '@swaggerexpert/media-types';

const { stats } = parse('text/html', { stats: true });

stats.displayStats(); // returns operator stats
stats.displayHits(); // returns rules grouped by hit count
```

##### Tracing

`parse` function returns additional tracing information about the parsing process.
Tracing can be enabled by setting `trace` option to `true`. Tracing is essential
for debugging failed matches or analyzing rule execution flow.

```js
import { parse } from '@swaggerexpert/media-types';

const { result, trace } = parse('text/', { trace: true });

result.success; // returns false
trace.displayTrace(); // returns trace information
trace.inferExpectations(); // returns parser expectations
```

By combining information from `result` and `trace`, it is possible to analyze the parsing process in detail
and generate messages like this: `'Invalid media type: "text/". Syntax error at position 5, expected "!", "#", "$", ...'`. Please see this
[test file](https://github.com/swaggerexpert/media-types/blob/main/test/parse/trace.js) for more information how to achieve that.

#### Identification

`identify` determines the narrowest type the source is valid as. Its return value can be passed as the `type` option of `parse`.

```js
import { identify } from '@swaggerexpert/media-types';

identify('text/html; charset=utf-8'); // => 'media-type'
identify('text/*'); // => 'media-range'
identify('*/*'); // => 'media-range'
identify('text/html, */*;q=0.1'); // => 'accept'
identify('text/html;q=0.5'); // => 'accept'
identify('garbage'); // => null
identify(''); // => null
```

Rules:

- Single media type with `*` subtype (`*/*`, `type/*`) is a media range. `*/html` or `text/*+json` are media types,
  as `*` is a wildcard only as the whole subtype ([RFC 9110, Section 12.5.1](https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1)).
- Single media type with `q` parameter is an `Accept` field value: `q` is always a weight, and media type parameters
  named `q` are disallowed ([RFC 9110, Section 12.5.1](https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1)).
- Any other single media type is a media type.
- List of media ranges is an `Accept` field value.
- Empty list (e.g. `''` or `', ,'`) and invalid source are not identified (`null`).

#### Validation

Validating is as simple as importing the **test** function and calling it.
`test` accepts the same `type` option as [parse](#parsing) and returns `true` exactly when parsing succeeds.
Without the `type` option, the source is valid when it can be [identified](#identification) as any type.

```js
import { test } from '@swaggerexpert/media-types';

test('text/html; charset=utf-8'); // => true
test('text/html; charset =utf-8'); // => false (no whitespace allowed around "=")
test('text/html, */*', { type: 'media-type' }); // => false
test('text/*', { type: 'media-range' }); // => true
test('text/html, */*;q=0.8', { type: 'accept' }); // => true
test('', { type: 'accept' }); // => true (empty list)
test(''); // => false (cannot be identified)
```

Validation is strict: whitespace around the whole value is not trimmed, as it is removed when the field value is parsed
from an HTTP message ([RFC 9110, Section 5.5](https://www.rfc-editor.org/rfc/rfc9110#section-5.5)).

#### Matching

All matching functions accept either strings or already parsed ASTs. Strings are parsed using the strict grammar.
Matching functions never throw on invalid input; see [Invalid input](#invalid-input).

Matching rules ([RFC 9110, Section 12.5.1](https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1)):

- `*/*` matches every media type, `type/*` matches every subtype of the type, otherwise type and subtype must be equal.
- Every parameter of the media range must be present in the media type with an equal value. Values of `charset` parameter are compared case-insensitively ([RFC 9110, Section 8.3.2](https://www.rfc-editor.org/rfc/rfc9110#section-8.3.2)), other values are compared case-sensitively.
  See [Parameter matching](#parameter-matching) for the alternative used for OpenAPI `content` map lookup.
- Precedence (specificity): `type/subtype` > `type/*` > `*/*`; on equal level, the media range with more matching parameters wins.

##### matches

Tests whether a media range matches a media type.

```js
import { matches } from '@swaggerexpert/media-types';

matches('text/*', 'text/html'); // => true
matches('text/html;level=1', 'text/html'); // => false
matches('*/*;charset=utf-8', 'text/plain;charset=UTF-8'); // => true
```

##### selectBestMatch

Selects the most specific media range matching a media type. On equal specificity, the first media range wins.
Returns `null` when nothing matches.

```js
import { selectBestMatch } from '@swaggerexpert/media-types';

selectBestMatch(['*/*', 'application/*', 'application/json'], 'application/json; charset=utf-8'); // => 'application/json'
selectBestMatch(['application/*', 'text/plain'], 'image/png'); // => null
```

For selecting a key from an OpenAPI `content` map (request or response `Content-Type`), use
[compatible parameter matching](#parameter-matching):

```js
const keys = ['application/json; charset=utf-8', '*/*'];

selectBestMatch(keys, 'application/json'); // => '*/*'
selectBestMatch(keys, 'application/json', { parameterMatching: 'compatible' }); // => 'application/json; charset=utf-8'
```

##### quality

Returns the quality value an `Accept` field value associates with a media type,
determined by the matching media range with the highest precedence. Returns `0` when nothing matches,
and `1` when the `Accept` field value is `undefined` or `null` (no `Accept` header field means any media type is acceptable).

```js
import { quality } from '@swaggerexpert/media-types';

const accept = 'text/*;q=0.3, text/plain;q=0.7, text/plain;format=flowed, text/plain;format=fixed;q=0.4, */*;q=0.5';

quality(accept, 'text/plain;format=flowed'); // => 1
quality(accept, 'text/plain'); // => 0.7
quality(accept, 'text/html'); // => 0.3
quality(accept, 'image/jpeg'); // => 0.5
quality(accept, 'text/plain;format=fixed'); // => 0.4
quality(accept, 'text/html;level=3'); // => 0.3
```

This is the example from [RFC 9110, Section 12.5.1](https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1),
with the last value corrected by [Errata ID 7138](https://www.rfc-editor.org/errata/eid7138).

##### negotiate

Orders available media types by the preference expressed in an `Accept` field value: by quality value,
then by specificity of the matching media range, then by order of media ranges in the `Accept` field value
and finally by order of available media types. Media types that are not acceptable are omitted.

```js
import { negotiate } from '@swaggerexpert/media-types';

const accept = 'text/*;q=0.3, text/plain;q=0.7, text/plain;format=flowed, text/plain;format=fixed;q=0.4, */*;q=0.5';

negotiate(accept, ['text/html', 'image/jpeg', 'text/plain', 'text/plain;format=flowed']);
// => ['text/plain;format=flowed', 'text/plain', 'image/jpeg', 'text/html']

negotiate('application/json;q=0, */*', ['application/json', 'text/html']); // => ['text/html']
negotiate(undefined, ['application/json', 'text/html']); // => ['application/json', 'text/html']
```

##### Parameter matching

`matches` and `selectBestMatch` accept the `parameterMatching` option:

- `required` (default): every parameter of the media range must be present in the media type with an equal value.
  This is the [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1) rule for `Accept`, where parameters of a media range are requirements.
- `compatible`: parameters present on both sides must have an equal value, parameters present on one side only are ignored.
  Suited for OpenAPI `content` map lookup, where a parameter on a key describes the content (e.g. `charset=utf-8`)
  rather than demanding it from the media type being matched.

| media type | media ranges | `required` | `compatible` |
|---|---|---|---|
| `application/json` | `application/json; charset=utf-8` | `null` | `application/json; charset=utf-8` |
| `application/json` | `application/json; charset=utf-8`, `*/*` | `*/*` | `application/json; charset=utf-8` |
| `application/vnd.x; version=2` | `application/vnd.x; version=1` | `null` | `null` |
| `application/json` | `application/json; charset=utf-8`, `application/json` | `application/json` | `application/json` |

With `compatible` parameter matching, the precedence on equal level is: more agreeing parameters,
then fewer parameters present only on the media range, then the first media range.
So an exactly declared media range wins over one with additional parameters, regardless of order.

`quality` and `negotiate` always use `required` parameter matching, as parameters of `Accept` media ranges are requirements.

##### Invalid input

Media types, media ranges and `Accept` field values usually come from untrusted sources
(HTTP requests, user authored OpenAPI documents). Matching functions therefore never throw on invalid strings
and treat them as follows:

- Invalid media range never matches and invalid media type is never matched (`matches` returns `false`,
  `selectBestMatch` skips invalid media ranges, `quality` returns `0`, `negotiate` omits invalid media types).
- From an invalid `Accept` field value, valid elements are recovered and invalid ones are ignored
  ([RFC 9110, Section 2.4](https://www.rfc-editor.org/rfc/rfc9110#section-2.4)). Elements with invalid `qvalue` are ignored as well.
- `Accept` field value without any usable element is treated as missing `Accept` field, i.e. any media type
  is acceptable ([RFC 9110, Section 12.4.1](https://www.rfc-editor.org/rfc/rfc9110#section-12.4.1)).
- Missing `Accept` field can be passed as `undefined` or `null` (e.g. result of `headers.get('accept')`).
- Arguments that are neither strings nor parsed ASTs of the expected kind throw `TypeError`
  (e.g. passing a parse result instead of its `tree`). Lists of media ranges or media types must be iterables
  other than strings; a string would otherwise be iterated character by character.

```js
import { matches, selectBestMatch, negotiate } from '@swaggerexpert/media-types';

matches('text', 'text/html'); // => false
selectBestMatch(['application/json; charset', 'application/*'], 'application/json'); // => 'application/*'
negotiate('text/html;level, application/json;q=0.5', ['text/html', 'application/json']); // => ['application/json']
negotiate('garbage', ['text/html', 'application/json']); // => ['text/html', 'application/json']
```

To reject invalid input instead, validate it upfront using the [test](#validation) function.

#### Errors

`@swaggerexpert/media-types` provides a structured error class hierarchy.

```js
import { MediaTypeError, MediaTypeParseError } from '@swaggerexpert/media-types';
```

**MediaTypeError** is the base class for all errors. **MediaTypeParseError** is thrown by the `parse` function
when the parser fails unexpectedly; it carries the `source` string, the resolved `type`
and the original error as `cause`. Syntax errors in parsed input are not errors; they are reported via `result.success`.

#### Grammar

New grammar instance can be created in following way:

```js
import { Grammar } from '@swaggerexpert/media-types';

const grammar = new Grammar();
```

To obtain original ABNF grammar as a string:

```js
import { Grammar } from '@swaggerexpert/media-types';

const grammar = new Grammar();

grammar.toString();
// or
String(grammar);
```

## Compliance

- **Grammar** is taken from the body of RFC 9110 rather than from its collected ABNF in Appendix A
  (see [Errata ID 9164](https://www.rfc-editor.org/errata/eid9164)). The only modification is the order
  of `media-range` alternatives, required by the ordered choice of the parser; the accepted language is unchanged.
- **Errata** of RFC 9110, RFC 6838 and RFC 5234 were reviewed. [Errata ID 7138](https://www.rfc-editor.org/errata/eid7138)
  (verified) corrects the `Accept` precedence example and is part of the test suite.
- **[web-platform-tests](https://github.com/web-platform-tests/wpt/tree/master/mimesniff/mime-types)** MIME type
  parsing tests (955 cases) are part of the test suite. These tests are written for the
  [WHATWG MIME Sniffing](https://mimesniff.spec.whatwg.org/#parsing-a-mime-type) algorithm, which recovers from
  syntax errors. Every input valid under RFC 9110 produces exactly the same result, every input rejected by WHATWG
  is rejected as well, and inputs WHATWG recovers from are rejected as invalid.
- **[negotiator](https://github.com/jshttp/negotiator)** media type negotiation tests (64 applicable cases) are part
  of the test suite and all of them pass.

## Comparison with media-typer and content-type

[media-typer](https://www.npmjs.com/package/media-typer) parses `type/subtype+suffix`, but rejects any parameters.
[content-type](https://www.npmjs.com/package/content-type) parses parameters, but returns `type/subtype` as a single
string and does not validate (e.g. `garbage` or `text/html; charset=utf-8, application/json` are accepted).
Neither parses media ranges (media-typer rejects `text/*`) or `Accept` field values.

`@swaggerexpert/media-types` produces type, subtype, suffix and parameters in a single strict parse, and
covers media ranges, `Accept` and matching.

## More about media types

Media types, media ranges and `Accept` field values are defined by the following [ABNF](https://www.rfc-editor.org/rfc/rfc5234) syntax

[comment]: <> (SPDX-FileCopyrightText: Copyright &#40;c&#41; 2022 IETF Trust and the persons identified as the document authors.  All rights reserved.)
[comment]: <> (SPDX-License-Identifier: BSD-3-Clause)

```abnf
; Hypertext Transfer Protocol (HTTP) Semantics ABNF syntax
; https://www.rfc-editor.org/rfc/rfc9110
; Rules are taken from the body of RFC 9110 (not from the collected ABNF in Appendix A)
; https://www.rfc-editor.org/errata/eid9164

; https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
; Accept = #( media-range [ weight ] )
Accept          = [ ( media-range [ weight ] ) ] *( OWS "," OWS [ ( media-range [ weight ] ) ] )
                ; list syntax expanded per recipient requirements
                ; https://www.rfc-editor.org/rfc/rfc9110#section-5.6.1.2

; https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
media-range     = ( ( type "/" subtype ) / ( type "/" "*" ) / "*/*" ) parameters
                ; MODIFICATION: alternatives reordered from ( "*/*" / ( type "/" "*" ) / ( type "/" subtype ) )
                ; Alternatives are ordered (first match wins), and the original order would reject
                ; valid media ranges like "text/*+json". Since "*" is a tchar, the language is unchanged.

; https://www.rfc-editor.org/rfc/rfc9110#section-12.4.2
weight          = OWS ";" OWS "q=" qvalue
qvalue          = ( "0" [ "." 0*3DIGIT ] )
                / ( "1" [ "." 0*3("0") ] )

; https://www.rfc-editor.org/rfc/rfc9110#section-8.3.1
media-type      = type "/" subtype parameters
type            = token
subtype         = token

; https://www.rfc-editor.org/rfc/rfc9110#section-5.6.6
parameters      = *( OWS ";" OWS [ parameter ] )
parameter       = parameter-name "=" parameter-value
parameter-name  = token
parameter-value = ( token / quoted-string )

; https://www.rfc-editor.org/rfc/rfc9110#section-5.6.2
token           = 1*tchar
tchar           = "!" / "#" / "$" / "%" / "&" / "'" / "*"
                / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
                / DIGIT / ALPHA
                ; any VCHAR, except delimiters

; https://www.rfc-editor.org/rfc/rfc9110#section-5.6.3
OWS             = *( SP / HTAB )
                ; optional whitespace

; https://www.rfc-editor.org/rfc/rfc9110#section-5.6.4
quoted-string   = DQUOTE *( qdtext / quoted-pair ) DQUOTE
qdtext          = HTAB / SP / %x21 / %x23-5B / %x5D-7E / obs-text
quoted-pair     = "\" ( HTAB / SP / VCHAR / obs-text )

; https://www.rfc-editor.org/rfc/rfc9110#section-5.5
obs-text        = %x80-FF

; https://www.rfc-editor.org/rfc/rfc5234#appendix-B.1
ALPHA           = %x41-5A / %x61-7A   ; A-Z / a-z
DIGIT           = %x30-39             ; 0-9
DQUOTE          = %x22                ; " (Double Quote)
HTAB            = %x09                ; horizontal tab
SP              = %x20
VCHAR           = %x21-7E             ; visible (printing) characters
```

## License

`@swaggerexpert/media-types` is licensed under [Apache 2.0 license](https://github.com/swaggerexpert/media-types/blob/main/LICENSE).
`@swaggerexpert/media-types` comes with an explicit [NOTICE](https://github.com/swaggerexpert/media-types/blob/main/NOTICE) file
containing additional legal notices and information.
