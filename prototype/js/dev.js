/**
 * @module glance/dev
 * @desc The dev module provides common development functions and definitions.
 * @license MIT
 * @version 2.0
 *
 * All log functions of this module are removed during the final build step if
 * the DEBUG flag is set to false.
 */
export { assert, DEBUG, logInfo, logWarning, shallowCopy, throwError, };
// =============================================================================
// Logging
// =============================================================================
/** Logs a message to the console if DEBUG is true.
 * @param message Message to log if DEBUG is true.
 *  Is a function to avoid evaluating the condition if DEBUG is false.
 */
// @ts-ignore: Unused function
function logInfo(message) {
    if (DEBUG) {
        console.log(message());
    }
}
/** Logs a warning to the console if DEBUG is true.
 * @param message Message to log if DEBUG is true.
 *  Is a function to avoid evaluating the condition if DEBUG is false.
 */
// @ts-ignore: Unused function
function logWarning(message) {
    if (DEBUG) {
        console.warn(message());
    }
}
/** Throws an error with a detailed message if DEBUG is true,
 * otherwise throws a generic error.
 * @param message Error message to throw if DEBUG is true.
 *  Is a function to avoid evaluating the condition if DEBUG is false.
 */
// @ts-ignore: Unused function
function throwError(message) {
    if (DEBUG) {
        throw new Error(message());
    }
    else { // LATER: Add error ids for release mode.
        throw new Error("An error occurred.");
    }
}
/** Throws an error if the given condition is false.
 * @param condition Condition funtion producing a truth value and error message.
 *  Is a function to avoid evaluating the condition if DEBUG is false.
 */
// @ts-ignore: Unused function
function assert(condition) {
    if (DEBUG) {
        const [result, message] = condition();
        if (!result) {
            throw new Error(message);
        }
    }
}
// =============================================================================
// Javascript
// =============================================================================
/** Return a shallow copy of the given value. */
function shallowCopy(value) {
    if (Array.isArray(value)) {
        return [...value];
    }
    else if (typeof value === "object") {
        return { ...value };
    }
    else {
        return value;
    }
}
// =============================================================================
// Module variables
// =============================================================================
/** The development code contains more and detailled log messages.
 * During the final (uglify) build step, this debug flag is set to false,
 * and everything within `if(DEBUG){ ... }` blocks is removed.
 */
const DEBUG = true;
