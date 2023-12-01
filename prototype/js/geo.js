/**
 * @module glance/geo
 * @desc The geo module provides functions to load or create geometry.
 * @license MIT
 * @version 0.2
 */
export { 
// createBox,
createSkyBoxAttributes, createSkyBoxIndices, createSphereAttributes, createSphereIndices, createTorusKnotAttributes, createTorusKnotIndices, 
// createFullscreenQuad,
loadObj, };
import { logWarning, throwError, } from "./dev.js";
import { vec3, } from "./math.js";
// =============================================================================
// Module functions
// =============================================================================
// /** Creates a Box around the origin with the given options.
//  * @param gl The WebGL context.
//  * @param name The name of the box entity.
//  * @param shader The shader program to use for rendering the box.
//  * @param uniforms Uniform values of this entity to override the shader's defaults. Default: empty.
//  * @param size The size of the box, either as a single number or an array of three. Default: 1.0.
//  * @param uvScale The scale of the UV texture coordinates, either as a single number or an array of two. Default: 1.0.
//  * @param positionAttribute The name of the position attribute. Default: "aPosition".
//  * @param normalAttribute The name of the normal attribute. Default: undefined => no normals.
//  * @param texCoordAttribute The name of the texture coordinate attribute. Default: undefined => no uvs.
//  * @returns The box entity.
//  */
// function createBox(
//     { gl, name, shaders,
//         uniforms = {},
//         size = 1.0,
//         uvScale = 1.0,
//         positionAttribute = "aPosition",
//         normalAttribute = undefined,
//         texCoordAttribute = undefined,
//     }: {
//         gl: WebGL2,
//         name: string,
//         shaders: Shader | Shader[],
//         uniforms?: {
//             [name: string]: UniformValue,
//         },
//         size?: number | [number, number, number],
//         uvScale?: number | [number, number],
//         positionAttribute?: string,
//         normalAttribute?: string,
//         texCoordAttribute?: string,
//     }
// ): Entity
// {
//     if (typeof uvScale === "number") {
//         uvScale = [uvScale, uvScale]
//     }
//     if (typeof size === "number") {
//         size = [size, size, size]
//     }
//     const halfWidth = size[0] / 2.
//     const halfHeight = size[1] / 2.
//     const halfDepth = size[2] / 2.
//     // Create an array of positions for the cube.
//     const positions = [
//         // Front face
//         -halfWidth, -halfHeight, halfDepth,
//         halfWidth, -halfHeight, halfDepth,
//         halfWidth, halfHeight, halfDepth,
//         -halfWidth, halfHeight, halfDepth,
//         // Back face
//         halfWidth, -halfHeight, -halfDepth,
//         -halfWidth, -halfHeight, -halfDepth,
//         -halfWidth, halfHeight, -halfDepth,
//         halfWidth, halfHeight, -halfDepth,
//         // Top face
//         -halfWidth, halfHeight, halfDepth,
//         halfWidth, halfHeight, halfDepth,
//         halfWidth, halfHeight, -halfDepth,
//         -halfWidth, halfHeight, -halfDepth,
//         // Bottom face
//         -halfWidth, -halfHeight, -halfDepth,
//         halfWidth, -halfHeight, -halfDepth,
//         halfWidth, -halfHeight, halfDepth,
//         -halfWidth, -halfHeight, halfDepth,
//         // Right face
//         halfWidth, -halfHeight, halfDepth,
//         halfWidth, -halfHeight, -halfDepth,
//         halfWidth, halfHeight, -halfDepth,
//         halfWidth, halfHeight, halfDepth,
//         // Left face
//         -halfWidth, -halfHeight, -halfDepth,
//         -halfWidth, -halfHeight, halfDepth,
//         -halfWidth, halfHeight, halfDepth,
//         -halfWidth, halfHeight, -halfDepth,
//     ]
//     // The normals never change.
//     const normals = [
//         repeat([0, 0, 1], 4),   // front
//         repeat([0, 0, -1], 4),  // back
//         repeat([0, 1, 0], 4),   // top
//         repeat([0, -1, 0], 4),  // bottom
//         repeat([1, 0, 0], 4),   // right
//         repeat([-1, 0, 0], 4),  // left
//     ].flat()
//     // .. neither do the UVs.
//     const texCoords = repeat([
//         0, uvScale[1],          // top left
//         uvScale[0], uvScale[1], // top right
//         uvScale[0], 0,          // bottom right
//         0, 0,                   // bottom left
//     ], 6)
//     // Create the interleaved vertex array.
//     const interleaved = [positions]
//     const quantities = [3]
//     let stride = 3
//     let normalOffset = 3
//     let texCoordOffset = 3
//     if (normalAttribute) {
//         interleaved.push(normals)
//         quantities.push(3)
//         stride += 3
//         texCoordOffset += 3
//     }
//     if (texCoordAttribute) {
//         interleaved.push(texCoords)
//         quantities.push(2)
//         stride += 2
//     }
//     stride *= Float32Array.BYTES_PER_ELEMENT
//     normalOffset *= Float32Array.BYTES_PER_ELEMENT
//     texCoordOffset *= Float32Array.BYTES_PER_ELEMENT
//     const vertexArray = interleaveArrays(interleaved, quantities)
//     const data = new Float32Array(vertexArray)
//     // We know that the box requires vertex positions, so we always create a
//     // buffer for them.
//     const vertexBuffers: { [name: string]: AttributeBuffer } = {}
//     vertexBuffers[positionAttribute] = createAttributeBuffer({
//         gl, data,
//         numComponents: 3,
//         stride,
//         offset: 0,
//     })
//     if (normalAttribute) {
//         vertexBuffers[normalAttribute] = createAttributeBuffer({
//             gl, data,
//             numComponents: 3,
//             stride,
//             offset: normalOffset,
//             glBuffer: vertexBuffers[positionAttribute].glBuffer,
//         })
//     }
//     if (texCoordAttribute) {
//         vertexBuffers[texCoordAttribute] = createAttributeBuffer({
//             gl, data,
//             numComponents: 2,
//             stride,
//             offset: texCoordOffset,
//             glBuffer: vertexBuffers[positionAttribute].glBuffer,
//         })
//     }
//     // This array defines each face as two triangles, using the
//     // indices into the vertex array to specify each triangle's
//     // position.
//     const indices = [
//         0, 1, 2, 0, 2, 3,       // front
//         4, 5, 6, 4, 6, 7,       // back
//         8, 9, 10, 8, 10, 11,    // top
//         12, 13, 14, 12, 14, 15, // bottom
//         16, 17, 18, 16, 18, 19, // right
//         20, 21, 22, 20, 22, 23, // left
//     ]
//     const indexBuffer = createIndexBuffer({ gl, indices })
//     // Create the box entity.
//     return createEntity({ gl, name, vertexBuffers, indexBuffer, shaders, uniforms })
// }
/**
 * Creates a skybox of unit size around the origin with shared vertices.
 */
function createSkyBoxAttributes() {
    return [
        -1, -1, -1,
        +1, -1, -1,
        +1, +1, -1,
        -1, +1, -1,
        -1, -1, +1,
        +1, -1, +1,
        +1, +1, +1,
        -1, +1, +1, // 7
    ];
}
/**
 * Creates indices for a skybox.
 */
function createSkyBoxIndices() {
    return [
        4, 5, 6, 4, 6, 7,
        1, 0, 3, 1, 3, 2,
        7, 6, 2, 7, 2, 3,
        0, 1, 5, 0, 5, 4,
        5, 1, 2, 5, 2, 6,
        0, 4, 7, 0, 7, 3, // left
    ];
}
/** Creates a sphere around the origin with the given options.
 * @param radius The radius of the sphere.
 * @param latitudeBands The number of bands around the sphere from top to bottom.
 * @param longitudeBands The number of bands around the sphere from left to right.
 * @param options Options to control which vertex attributes to create.
 * @returns An array of interleaved vertex data.
 */
function createSphereAttributes(radius, latitudeBands, longitudeBands, options = {}) {
    // Create values for all arrays of the sphere.
    // They are easier to create and then discard if unused.
    const positions = [];
    const normals = [];
    const texCoords = [];
    for (let lat = 0; lat <= latitudeBands; lat++) {
        const theta = lat * Math.PI / latitudeBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (let lon = 0; lon <= longitudeBands; lon++) {
            const phi = lon * 2 * Math.PI / longitudeBands;
            const x = Math.cos(phi) * sinTheta;
            const y = cosTheta;
            const z = Math.sin(phi) * sinTheta;
            const u = 1. - (lon / longitudeBands);
            const v = lat / latitudeBands;
            positions.push(radius * x, radius * y, radius * z);
            normals.push(x, y, z);
            texCoords.push(u, v);
        }
    }
    // Create the interleaved vertex array.
    const interleaved = [positions];
    const quantities = [3];
    if (options.normals ?? true) {
        interleaved.push(normals);
        quantities.push(3);
    }
    if (options.uvs ?? true) {
        interleaved.push(texCoords);
        quantities.push(2);
    }
    return interleaveArrays(interleaved, quantities);
}
/**
 * Create indices for a sphere with the given options.
 * @param latitudeBands The number of bands around the sphere from top to bottom.
 * @param longitudeBands The number of bands around the sphere from left to right.
 * @returns The indices of the sphere.
 */
function createSphereIndices(latitudeBands, longitudeBands) {
    const buffer = [];
    for (let lat = 0; lat < latitudeBands; lat++) {
        for (let lon = 0; lon < longitudeBands; lon++) {
            const first = lat * (longitudeBands + 1) + lon;
            const second = first + longitudeBands + 1;
            buffer.push(first, first + 1, second);
            buffer.push(second, first + 1, second + 1);
        }
    }
    return buffer;
}
// TODO: enable/disable attributes for torus knot
function createTorusKnotAttributes(radius = 1, tube = 0.4, tubularSegments = 64, radialSegments = 8, p = 2, q = 3) {
    // Ensure segments are integers.
    tubularSegments = Math.floor(tubularSegments);
    radialSegments = Math.floor(radialSegments);
    // buffers
    const buffer = [];
    // This function calculates the current position on the torus curve.
    const calculatePositionOnCurve = (u, p, q, radius, position) => {
        const cu = Math.cos(u);
        const su = Math.sin(u);
        const quOverP = q / p * u;
        const cs = Math.cos(quOverP);
        position[0] = radius * (2 + cs) * 0.5 * cu;
        position[1] = radius * (2 + cs) * su * 0.5;
        position[2] = radius * Math.sin(quOverP) * 0.5;
    };
    // helper variables
    const vertex = vec3.zero();
    const P1 = vec3.zero();
    let B = vec3.zero();
    let T = vec3.zero();
    let N = vec3.zero();
    // generate vertices, normals and uvs
    for (let i = 0; i <= tubularSegments; ++i) {
        // the radian "u" is used to calculate the position on the torus curve of the current tubular segment
        const u = i / tubularSegments * p * Math.PI * 2;
        // now we calculate two points. P1 is our current position on the curve, P2 is a little farther ahead.
        // these points are used to create a special "coordinate space", which is necessary to calculate the correct vertex positions
        calculatePositionOnCurve(u, p, q, radius, P1);
        calculatePositionOnCurve(u + 0.01, p, q, radius, N);
        // calculate orthonormal basis
        vec3.subtract(vec3.copy(T, N), P1);
        vec3.cross(vec3.copy(B, T), N);
        vec3.cross(vec3.copy(N, B), T);
        // normalize B and N. T can be ignored, we don't use it
        vec3.normalize(B);
        vec3.normalize(N);
        for (let j = 0; j <= radialSegments; ++j) {
            // now calculate the vertices. they are nothing more than an extrusion of the torus curve.
            // because we extrude a shape in the xy-plane, there is no need to calculate a z-value.
            const v = j / radialSegments * Math.PI * 2;
            const cx = -tube * Math.cos(v);
            const cy = tube * Math.sin(v);
            // now calculate the final vertex position.
            // first we orient the extrusion with our basis vectors, then we add it to the current position on the curve
            vertex[0] = P1[0] + (cx * N[0] + cy * B[0]);
            vertex[1] = P1[1] + (cx * N[1] + cy * B[1]);
            vertex[2] = P1[2] + (cx * N[2] + cy * B[2]);
            buffer.push(vertex[0], vertex[1], vertex[2]);
            // normal (P1 is always the center/origin of the extrusion, thus we can use it to calculate the normal)
            vec3.subtract(vertex, P1);
            vec3.normalize(vertex);
            buffer.push(vertex[0], vertex[1], vertex[2]);
            // uv
            buffer.push(i / tubularSegments);
            buffer.push(j / radialSegments);
        }
    }
    return buffer;
}
function createTorusKnotIndices(tubularSegments = 64, radialSegments = 8) {
    const indices = [];
    for (let tubeIdx = 1; tubeIdx <= tubularSegments; tubeIdx++) {
        for (let radIdx = 1; radIdx <= radialSegments; radIdx++) {
            const a = (radialSegments + 1) * (tubeIdx - 1) + (radIdx - 1);
            const b = (radialSegments + 1) * tubeIdx + (radIdx - 1);
            const c = (radialSegments + 1) * tubeIdx + radIdx;
            const d = (radialSegments + 1) * (tubeIdx - 1) + radIdx;
            indices.push(a, b, d, b, c, d);
        }
    }
    return indices;
}
/**
 * Load and parse an OBJ file into a raw `ObjData` object.
 * For now, we only support OBJ files with a single object as exported by Blender,
 * with 3-D positions, 2-D UV coordiantes, normals and triangulated faces.
 * @param text The text contents of the OBJ file.
 * @returns A promise that resolves to the parsed OBJ data.
 */
function parseObj(text) {
    // Ignore comments, materials, groups, and smooth shading
    const ignoredLines = new Set(["#", "mtllib", "g", "usemtl", "s", ""]);
    // Parse the OBJ contents
    let name = undefined;
    const positions = [];
    const splitIndices = [];
    const normals = [];
    const texCoords = [];
    const lines = text.split("\n");
    for (const [index, line] of lines.entries()) {
        const tokens = line.split(" ");
        const type = tokens[0];
        if (ignoredLines.has(type)) {
            continue;
        }
        else if (type === "o") {
            if (name === undefined) {
                name = tokens[1];
            }
            else {
                throwError(() => `Multiple object names defined in OBJ file (on line ${index})`);
            }
        }
        else if (type === "v") {
            positions.push(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
        }
        else if (type === "vn") {
            normals.push(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
        }
        else if (type === "vt") {
            texCoords.push(parseFloat(tokens[1]), parseFloat(tokens[2]));
        }
        else if (type === "f") {
            for (let i = 1; i <= 3; i++) {
                const face = tokens[i].split("/");
                splitIndices.push([
                    parseInt(face[0]) - 1,
                    parseInt(face[1]) - 1,
                    parseInt(face[2]) - 1, // normal
                ]);
            }
        }
        else {
            logWarning(() => `Unexpected OBJ token: '${type}' on line ${index}`);
        }
    }
    if (name === undefined) {
        throwError(() => "No object name defined in OBJ file");
    }
    return {
        name,
        positions,
        texCoords,
        normals,
        splitIndices,
    };
}
/**
 * Takes a raw OBJ data object and creates an attribute, and index buffer from it.
 * @param objData OBJ data to expand.
 * @returns [Attributes, Indices]
 */
function expandObj(objData) {
    let positions = [];
    let texCoords = [];
    let normals = [];
    let indices = [];
    // Expand the raw OBJ data into arrays of vertex attributes and indices.
    let vertIdx = 0;
    const knownIndices = new Map();
    for (const splitIndex of objData.splitIndices) {
        const vertexKey = splitIndex.join("|");
        // Detect duplicate vertices
        const existingVertex = knownIndices.get(vertexKey);
        if (existingVertex !== undefined) {
            indices.push(existingVertex);
            continue;
        }
        const [posIdx, uvIdx, normIdx] = splitIndex;
        // Create a new vertex
        const positionIndex = posIdx * 3;
        positions.push(...objData.positions.slice(positionIndex, positionIndex + 3));
        const uvIndex = uvIdx * 2;
        texCoords.push(...objData.texCoords.slice(uvIndex, uvIndex + 2));
        const normalIndex = normIdx * 3;
        normals.push(...objData.normals.slice(normalIndex, normalIndex + 3));
        indices.push(vertIdx);
        knownIndices.set(vertexKey, vertIdx);
        vertIdx++;
    }
    // Interleave the vertex attributes.
    const attributes = interleaveArrays([positions, texCoords, normals], [3, 2, 3]);
    return [attributes, indices];
}
/**
 * Load an OBJ file and return the vertex attributes and indices.
 * The attributes are interleaved as [position(3), texcoord(2), normal(3)].
 * @param path Location of the OBJ file.
 * @returns [Attributes, Indices]
 */
async function loadObj(path) {
    // Load the OBJ file
    const response = await fetch(path);
    const text = await response.text();
    // Parse the OBJ file
    const objData = parseObj(text);
    // Expand the OBJ data
    const [attributes, indices] = expandObj(objData);
    return {
        name: objData.name,
        attributes,
        indices,
    };
}
// =============================================================================
// Private Functions
// =============================================================================
/** Creates a new array with the given pattern repeated the given number of times. */
function repeat(pattern, times) {
    return Array.from({ length: times }, () => pattern).flat();
}
/** Interleave the given arrays, taking a number of elements (quantity) from each array in turn.
 * @param arrays An array of arrays to interleave.
 * @param quantities Either an array of quantities to take from each array,
 * or a single quantity to take from each array. Defaults to 1.
 * @returns A new array with the interleaved values.
 */
function interleaveArrays(arrays, quantities = 1) {
    // Ensure that all arrays are the same size.
    if (arrays.length === 0) {
        return [];
    }
    // If there is only one array, return it.
    if (arrays.length === 1) {
        return arrays[0];
    }
    // Ensure that quantities is an array of the correct size.
    if (!Array.isArray(quantities)) {
        quantities = repeat([quantities], arrays.length);
    }
    else if (quantities.length !== arrays.length) {
        throwError(() => `'quantities' must be either a number or an array with the same length as 'arrays'.\n` +
            `    'quantities' length: ${quantities.length}\n` +
            `    'arrays' length: ${arrays.length}`);
    }
    // Ensure that the every quantity is valid.
    const bandCount = arrays[0].length / quantities[0];
    for (let i = 0; i < arrays.length; i++) {
        const quantity = quantities[i];
        if (quantity < 1) {
            throwError(() => `'quantity' must be greater than 0, but the value at index ${i} is ${quantity}`);
        }
        if (quantity % 1 !== 0) {
            throwError(() => `'quantity' must be an integer, but the value at index ${i} is ${quantity}`);
        }
        if (arrays[i].length % quantity !== 0) {
            throwError(() => `The length of the corresponding array must be a multiple of 'quantity'\n` +
                `    but the quantity at index ${i} is ${quantity}\n` +
                `    whereas the length of the corresponding array is ${arrays[i].length}`);
        }
        if (arrays[i].length / quantity !== bandCount) {
            throwError(() => `All arrays must have the same number of quantities,\n` +
                `    but array ${i} of size ${arrays[i].length} contains ${arrays[i].length / quantity} times ${quantity} quantities,\n` +
                `    whereas the first array conttains ${arrays[0].length / quantity} times ${quantities[0]} quantities.`);
        }
    }
    // Interleave the arrays.
    const interleaved = [];
    for (let band = 0; band < bandCount; band++) {
        for (let arrayIndex = 0; arrayIndex < arrays.length; arrayIndex++) {
            const array = arrays[arrayIndex];
            const quantity = quantities[arrayIndex];
            interleaved.push(...array.slice(band * quantity, (band + 1) * quantity));
        }
    }
    return interleaved;
}
