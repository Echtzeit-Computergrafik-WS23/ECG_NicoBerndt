/**
 * @module glance/index
 * @desc The main module of the Glance library.
 * @license MIT
 * @version 0.2
 *
 * This module defines the public API of the Glance library.
 */
import * as core from "./core.js";
import * as core_patterns from "./core_patterns.js";
// import * as dev from "./dev.js"
import * as geo from "./geo.js";
import * as math from "./math.js";
// import * as types from "./types"
// TODO: this is a weird way to define the public API, is it?
export const createAttributeBuffer = core.createAttributeBuffer;
export const createDrawCall = core.createDrawCall;
export const createIndexBuffer = core.createIndexBuffer;
export const createVAO = core.createVAO;
export const getContext = core.getContext;
export const performDrawCall = core.performDrawCall;
export * from "./core_patterns.js";
export * from "./geo.js";
export * from "./math.js";
export * from "./types.js";
const glance = Object.freeze({
    ...core,
    ...core_patterns,
    ...geo,
    ...math,
});
export default glance;
