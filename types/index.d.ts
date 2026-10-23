export type MediaTypeString = string;
export type MediaRangeString = string;
export type AcceptString = string;

/**
 * Parsing
 *
 * Without `type` option, the type of the source is determined by `identify`;
 * unidentifiable source is parsed as media type.
 */
export function parse<TTree>(
  source: string,
  options: ParseOptions & { readonly translator: Translator<TTree> },
): ParseResult<TTree>;
export function parse(
  source: string,
  options: ParseOptions & { readonly translator: null },
): ParseResult<undefined>;
export function parse(
  source: MediaTypeString,
  options: ParseOptions & { readonly type: 'media-type' },
): ParseResult<MediaType>;
export function parse(
  source: MediaRangeString,
  options: ParseOptions & { readonly type: 'media-range' },
): ParseResult<MediaRange>;
export function parse(
  source: AcceptString,
  options: ParseOptions & { readonly type: 'accept' },
): ParseResult<Accept>;
export function parse(source: string, options?: ParseOptions | null): ParseResult<ASTTree>;

export type Type = 'media-type' | 'media-range' | 'accept';

export interface ParseOptions {
  readonly type?: Type | null;
  readonly translator?: Translator | null;
  readonly stats?: boolean;
  readonly trace?: boolean;
}

/**
 * Identification
 *
 * Identifies the narrowest type the source is valid as, or null.
 */
export function identify(source: unknown): Type | null;

export interface Translator<TTree = unknown> {
  getTree(): TTree;
}
export declare class CSTTranslator implements Translator<CSTTree> {
  getTree(): CSTTree;
}
export declare class ASTTranslator implements Translator<ASTTree> {
  getTree(): ASTTree;
}
export declare class XMLTranslator implements Translator<XMLTree> {
  getTree(): XMLTree;
}

export interface CSTNode {
  readonly type:
    | 'Accept'
    | 'media-range'
    | 'weight'
    | 'qvalue'
    | 'media-type'
    | 'type'
    | 'subtype'
    | 'parameters'
    | 'parameter'
    | 'parameter-name'
    | 'parameter-value';
  readonly text: string;
  readonly start: number;
  readonly length: number;
  readonly children: CSTNode[];
}

export interface CSTTree {
  readonly root: CSTNode;
}

export interface MediaType {
  readonly type: string;
  readonly subtype: string;
  readonly suffix?: string;
  readonly parameters: Record<string, string>;
}

export type MediaRange = MediaType;

export interface AcceptElement extends MediaRange {
  /**
   * Weight is NaN when the "q" parameter value is not a valid qvalue; matching functions ignore such element.
   */
  readonly weight: number;
}

export type Accept = AcceptElement[];

export type ASTTree = MediaType | MediaRange | Accept;

export type XMLTree = string;

export interface ParseResult<TTree = ASTTree> {
  readonly result: {
    readonly success: boolean;
    readonly state: number;
    readonly stateName: string;
    readonly length: number;
    readonly matched: number;
    readonly maxMatched: number;
    readonly maxTreeDepth: number;
    readonly nodeHits: number;
  };
  readonly tree?: TTree;
  readonly stats?: Stats;
  readonly trace?: Trace;
}

export interface Stats {
  displayStats(): string;
  displayHits(): string;
}

export interface Trace {
  displayTrace(): string;
  inferExpectations(): string[];
}

/**
 * Testing
 */
export function test(source: string, options?: TestOptions | null): boolean;
export function test(source: unknown, options?: TestOptions | null): source is string;

export interface TestOptions {
  readonly type?: Type | null;
}

/**
 * Matching
 *
 * Matching functions never throw on invalid strings: invalid media types and media ranges never match,
 * invalid Accept elements are ignored, and Accept without usable elements means no preference.
 * Missing Accept field can be passed as undefined or null.
 * Arguments that are neither strings nor parsed ASTs, and lists that are strings or not iterable, throw TypeError.
 */
export function matches(
  mediaRange: MediaRangeString | MediaRange,
  mediaType: MediaTypeString | MediaType,
  options?: MatchOptions | null,
): boolean;
export function selectBestMatch<T extends MediaRangeString | MediaRange>(
  mediaRanges: Iterable<T>,
  mediaType: MediaTypeString | MediaType,
  options?: MatchOptions | null,
): T | null;
/**
 * Parameter matching:
 * - "required" (default): every parameter of the media range must be present in the media type
 *   with an equal value, as in Accept negotiation (RFC 9110, Section 12.5.1)
 * - "compatible": parameters present on both sides must have an equal value, parameters present
 *   on one side only are ignored; suited for OpenAPI content map lookup
 */
export type ParameterMatching = 'required' | 'compatible';

export interface MatchOptions {
  readonly parameters?: ParameterMatching | null;
}

export function quality(
  accept: AcceptString | Accept | null | undefined,
  mediaType: MediaTypeString | MediaType,
): number;
export function negotiate<T extends MediaTypeString | MediaType>(
  accept: AcceptString | Accept | null | undefined,
  mediaTypes: Iterable<T>,
): T[];

/**
 * Grammar
 */
export function Grammar(): Grammar;

export interface Grammar {
  grammarObject: string; // Internal identifier
  rules: Rule[]; // List of grammar rules
  udts: UDT[]; // User-defined terminals (empty in this grammar)
  toString(): string; // Method to return the grammar in ABNF format
}

export interface Rule {
  name: string; // Rule name
  lower: string; // Lowercased rule name
  index: number; // Rule index
  isBkr: boolean; // Is this a back-reference?
  opcodes?: Opcode[]; // List of opcodes for the rule
}

export type Opcode =
  | { type: 1; children: number[] } // ALT (Alternation)
  | { type: 2; children: number[] } // CAT (Concatenation)
  | { type: 3; min: number; max: number } // REP (Repetition)
  | { type: 4; index: number } // RNM (Rule reference)
  | { type: 5; min: number; max: number } // TRG (Terminal range)
  | { type: 6 | 7; string: number[] }; // TBS or TLS (Byte sequence or Literal string)

export type UDT = {}; // User-defined terminals (empty in this grammar)

/**
 * Errors
 */
export declare class MediaTypeError extends Error {
  constructor(message?: string, options?: MediaTypeErrorOptions);
}
export declare class MediaTypeParseError extends MediaTypeError {
  readonly source?: string;
  readonly type?: Type;
}

export interface MediaTypeErrorOptions {
  readonly cause?: unknown;
  readonly [key: string]: unknown;
}
