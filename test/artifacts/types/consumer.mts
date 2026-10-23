// Type checks of the published typings from an ES module consumer.
import {
  parse,
  identify,
  test,
  matches,
  selectBestMatch,
  quality,
  negotiate,
  Grammar,
  CSTTranslator,
  MediaTypeParseError,
  type MediaType,
  type Accept,
  type Type,
} from '@swaggerexpert/media-types';

const mediaType: MediaType | undefined = parse('text/html', { type: 'media-type' }).tree;
const accept: Accept | undefined = parse('text/html', { type: 'accept' }).tree;
const cst = parse('text/html', { translator: new CSTTranslator() }).tree?.root.children;
const type: Type | null = identify('text/*');
const reparsed = parse('text/*', { type });

declare const header: string | undefined;
if (!test(header)) {
  const value: string | undefined = header;
}

const isMatch: boolean = matches('text/*', 'text/html', { parameterMatching: 'compatible' });
const best: string | null = selectBestMatch(['*/*'], 'text/html');
const weight: number = quality(null, 'text/html');
const preferred: string[] = negotiate(undefined, ['text/html']);
const grammar: string = new Grammar().toString();
const error: string | undefined = new MediaTypeParseError('message').source;

// @ts-expect-error unknown type
parse('text/html', { type: 'Accept' });
// @ts-expect-error unknown parameter matching
matches('*/*', 'text/html', { parameterMatching: 'ignore' });
