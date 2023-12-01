/**
 * @module glance/index
 * @desc The main module of the Glance library.
 * @license MIT
 * @version 0.2
 *
 * This module defines the public API of the Glance library.
 */
import * as core from "./core"
import * as core_patterns from "./core_patterns"
// import * as dev from "./dev"
import * as geo from "./geo"
import * as math from "./math"
// import * as types from "./types"


// TODO: this is a weird way to define the public API, is it?

export const createAttributeBuffer = core.createAttributeBuffer
export const createDrawCall = core.createDrawCall
export const createIndexBuffer = core.createIndexBuffer
export const createVAO = core.createVAO
export const getContext = core.getContext
export const performDrawCall = core.performDrawCall

export * from "./core_patterns"
export * from "./geo"
export * from "./math"
export * from "./types"

const glance = Object.freeze({
    createAttributeBuffer: core.createAttributeBuffer,
    createDrawCall: core.createDrawCall,
    createIndexBuffer: core.createIndexBuffer,
    createVAO: core.createVAO,
    getContext: core.getContext,
    performDrawCall: core.performDrawCall,

    ...core_patterns,
    ...geo,
    ...math,
})
export default glance