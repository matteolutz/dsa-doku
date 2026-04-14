/**
 * This type is helpful, when you want to do compile time assertions
 * on types. E.g. check for equality of type A and B:
 * `type _ = StaticAssert<A extends B ? true : false>`
 *
 * Thanks *suluke*! (https://stackoverflow.com/a/76969673)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type StaticAssert<_T extends true> = never;
