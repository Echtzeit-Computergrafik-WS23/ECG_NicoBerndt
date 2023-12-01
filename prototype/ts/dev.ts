/**
 * @module glance/dev
 * @desc The dev module provides common development functions and definitions.
 * @license MIT
 * @version 2.0
 *
 * All log functions of this module are removed during the final build step if
 * the DEBUG flag is set to false.
 */
export
{
    logInfo,
    logWarning,
    throwError,
    assert,
    shallowCopy,
}


// =============================================================================
// Logging
// =============================================================================


/** Logs a message to the console if DEBUG is true.
 * @param message Message to log if DEBUG is true.
 *  Is a function to avoid evaluating the condition if DEBUG is false.
 */
// @ts-ignore: Unused function
function logInfo(message: () => string): void
{
    if (DEBUG) {
        console.log(message())
    }
}


/** Logs a warning to the console if DEBUG is true.
 * @param message Message to log if DEBUG is true.
 *  Is a function to avoid evaluating the condition if DEBUG is false.
 */
// @ts-ignore: Unused function
function logWarning(message: () => string): void
{
    if (DEBUG) {
        console.warn(message())
    }
}


/** Throws an error with a detailed message if DEBUG is true,
 * otherwise throws a generic error.
 * @param message Error message to throw if DEBUG is true.
 *  Is a function to avoid evaluating the condition if DEBUG is false.
 */
// @ts-ignore: Unused function
function throwError(message: () => string): never
{
    if (DEBUG) {
        throw new Error(message())
    }
    else { // LATER: Add error ids for release mode.
        throw new Error("An error occurred.")
    }
}


/** Throws an error if the given condition is false.
 * @param condition Condition funtion producing a truth value and error message.
 *  Is a function to avoid evaluating the condition if DEBUG is false.
 */
// @ts-ignore: Unused function
function assert(condition: () => [boolean, string]): void
{
    if (DEBUG) {
        const [result, message] = condition()
        if (!result) {
            throw new Error(message)
        }
    }
}


// =============================================================================
// Javascript
// =============================================================================


/** Return a shallow copy of the given value. */
function shallowCopy<T>(value: T): T
{
    if (Array.isArray(value)) {
        return [...value] as any
    } else if (typeof value === "object") {
        return { ...value } as any
    } else {
        return value
    }
}


// =============================================================================
// Module variables
// =============================================================================


/** The development code contains more and detailled log messages.
 * During the final (uglify) build step, this debug flag is set to false,
 * and everything within `if(DEBUG){ ... }` blocks is removed.
 */
const DEBUG: boolean = true


// =============================================================================
// Type Extensions
// =============================================================================


declare global
{
    /** The Array.at method is not yet supported by TypeScript. */
    interface Array<T>
    {
        at(index: number): T
    }

    /** Extract the K from Map<K,V>. */
    type KeyOf<T> = T extends Map<infer I, any> ? I : never

    /** Extract the V from Map<K,V>. */
    type ValueOf<T> = T extends Map<any, infer I> ? I : never

    /** Turns a ReadonlyMap<K,V> into a Map<K,V>. */
    type MutableMap<T> = Map<
        T extends ReadonlyMap<infer I, any> ? I : never,
        T extends ReadonlyMap<any, infer I> ? I : never>

    /** At least one, but can be more. Never empty. */
    type Some<T> = [T, ...T[]]

    /** A sequence needs at least two elements. */
    type Sequence<T> = [T, T, ...T[]]
}
