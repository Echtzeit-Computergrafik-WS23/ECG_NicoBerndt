export { createAttributeBuffer, createDrawCall, createFragmentShader, createIndexBuffer, createShaderProgram, createTexture, createVAO, createVertexShader, defineTexture, deleteShader, getContext, performDrawCall, };
import { AttributeDataType, ShaderStage, TextureDataTarget, TextureTarget, } from "./types.js";
import { assert, logInfo, logWarning, throwError, } from "./dev.js";
import { isPowerOf2, } from './math.js';
// TODO: ensure that all exceptions leave the WebGL state unchanged (that includes the removal of created objects)
// TODO: make names optional?
// Context ================================================================== //
/**
 * Get the WebGL2 context from a canvas element in the DOM.
 * @param canvasId The id of the canvas element.
 * @param options The WebGL2 context options:
 *  - `antialias`: Whether to enable antialiasing. Defaults to `true`.
 *  - `alpha`: Whether to enable alpha. Defaults to `true`.
 *  - `depth`: Whether to enable depth. Defaults to `true`.
 *  - `stencil`: Whether to enable stencil. Defaults to `false`.
 *  - `premultipliedAlpha`: Whether to enable premultiplied alpha. Defaults to `false`.
 *  - `desynchronized`: Whether to enable desynchronized. Defaults to `true`.
 *  - `preserveDrawingBuffer`: Whether to preserve the drawing buffer. Defaults to `true`.
 * @return The WebGL2 context.
 * @throws If the canvas element could not be found or if WebGL2 is not supported.
 *
 * The defaults followed by this call do not match the defaults of the WebGL2 context.
 * Instead, they reflect the best practices for WebGL2:
 *  - antialias is false by default, because it is expensive
 *  - alpha is true by default, because it is expensive to disable (see https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#avoid_alphafalse_which_can_be_expensive)
 *  - preserveDrawingBuffer is true by default, because it is useful for debugging and follows OpenGL's behavior
 */
function getContext(canvasId, options = {}) {
    const canvasElement = document.querySelector(`#${canvasId}`);
    if (canvasElement == null) {
        throwError(() => `Could not find canvas element with id "${canvasId}"`);
    }
    const gl = canvasElement.getContext('webgl2', {
        antialias: options.antialias ?? true,
        alpha: options.alpha ?? true,
        depth: options.depth ?? true,
        stencil: options.stencil ?? false,
        premultipliedAlpha: options.premultipliedAlpha ?? false,
        desynchronized: options.desynchronized ?? true,
        preserveDrawingBuffer: options.preserveDrawingBuffer ?? true,
    });
    if (gl == null) {
        throwError(() => `Could not acquire a WebGL2 context from canvas with id "${canvasId}"`);
    }
    return gl;
}
// Vertex Buffers =========================================================== //
function getAttributeDataSize(type) {
    switch (type) {
        case (AttributeDataType.BYTE):
        case (AttributeDataType.UNSIGNED_BYTE):
            return 1;
        case (AttributeDataType.SHORT):
        case (AttributeDataType.UNSIGNED_SHORT):
        case (AttributeDataType.HALF_FLOAT):
            return 2;
        case (AttributeDataType.INT):
        case (AttributeDataType.UNSIGNED_INT):
        case (AttributeDataType.FLOAT):
        case (AttributeDataType.INT_2_10_10_10_REV):
        case (AttributeDataType.UNSIGNED_INT_2_10_10_10_REV):
            return 4;
        default:
            throwError(() => `Invalid attribute data type: ${type}.`);
    }
}
function calcStride(attributes) {
    let stride = 0;
    for (const attribute of attributes) {
        stride += attribute.size * getAttributeDataSize(attribute.type);
    }
    return stride;
}
function calcOffset(attribute) {
    let offset = 0;
    for (const [name, description] of attribute.buffer.attributes) {
        if (name === attribute.name) {
            return offset;
        }
        offset += description.size * getAttributeDataSize(description.type);
    }
    return null;
}
/**
 * Create a new Attribute Buffer Object (ABO) from the given data.
 * @param gl The WebGL context.
 * @param name The name of the buffer.
 * @param attributes The Attributes to use.
 * @param data The data to store in the buffer.
 * @returns The buffer object.
 */
function createAttributeBuffer(gl, name, data, attributes, options = {}) {
    // Ensure that the buffer contents are plausible for the given attributes.
    assert(() => [data.length > 0, `Data for Attribute Buffer "${name}" must not be empty.`]);
    const attributeDescriptions = Object.values(attributes);
    assert(() => [attributeDescriptions.length > 0, `Attribute Buffer "${name}" must have at least one attribute.`]);
    const stride = calcStride(attributeDescriptions) / 4; // stride is in bytes, data is in floats
    assert(() => [data.length % stride === 0, `Data length for Attribute Buffer "${name}" must be a multiple of the stride.`]);
    // Create the VBO.
    const vbo = gl.createBuffer();
    if (vbo === null) {
        throwError(() => `Failed to create a new WebGL buffer for attribute buffer "${name}".`);
    }
    // Bind the VBO and store the data.
    const dataArray = new Float32Array(data);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, dataArray, options.usage ?? gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    // Crate the Attribute Buffer Object.
    return {
        name: name,
        glBuffer: vbo,
        size: data.length / stride,
        attributes: new Map(Object.entries(attributes)),
    };
}
/** Create an index buffer from the given data.
 * Simplified version of the `createAttributeBuffer` function above, used for indices.
 * @param gl The WebGL context.
 * @param indices A JavaScript array containing the indices.
 * @returns The buffer object.
 */
function createIndexBuffer(gl, indices, options = {}) {
    // Ensure that the indicies are valid.
    assert(() => [indices.length > 0, "'indices' must not be empty."]);
    assert(() => [indices.length % 3 === 0, "The size of 'indices' must be a multiple of 3."]);
    // Find the highest index.
    let highestIndex = 0;
    for (const index of indices) {
        highestIndex = Math.max(highestIndex, index);
    }
    // Determine the best data type for the index buffer.
    let type;
    if (options.type !== undefined) {
        type = options.type;
    }
    else if (highestIndex < 256) {
        type = gl.UNSIGNED_BYTE;
    }
    else if (highestIndex < 65536) {
        type = gl.UNSIGNED_SHORT;
    }
    else if (highestIndex < 4294967296) {
        type = gl.UNSIGNED_INT;
    }
    else {
        throwError(() => `Index ${highestIndex} does not fit in a 32-bit unsigned integer.`);
    }
    // Create the data array.
    let data;
    switch (type) {
        case (gl.UNSIGNED_BYTE):
            data = new Uint8Array(indices);
            break;
        case (gl.UNSIGNED_SHORT):
            data = new Uint16Array(indices);
            break;
        case (gl.UNSIGNED_INT):
            data = new Uint32Array(indices);
            break;
        default:
            throwError(() => `Invalid index data type: ${type}.`);
    }
    // Create the buffer and store the data.
    const glBuffer = gl.createBuffer();
    if (glBuffer === null) {
        throwError(() => 'Failed to create a new WebGL index buffer.');
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, options.usage ?? gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    // Return the buffer information.
    return {
        glBuffer,
        type,
        size: indices.length,
    };
}
/**
 * Creates a new Vertex Array Object (VAO) from the given IBO and attributes.
 * @param gl The WebGL context.
 * @param name The name of the VAO.
 * @param ibo The Index Buffer Object (IBO) to use.
 * @param attributes The Attributes to use.
 * @returns The VAO object.
 */
function createVAO(gl, name, ibo, attributes) {
    // Create and bind the VAO.
    const vao = gl.createVertexArray();
    if (vao === null) {
        throwError(() => `Failed to create a new VAO object for "${name}".`);
    }
    gl.bindVertexArray(vao);
    // Bind the index buffer to the VAO.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo.glBuffer);
    // Bind the attribute buffers to the VAO.
    for (const [location, attrRef] of attributes) {
        const offset = calcOffset(attrRef);
        if (offset === null) {
            throwError(() => `Could not find VAO attribute for location ${location} in Attribute Buffer "${attrRef.buffer.name}".`);
        }
        const attributeName = attrRef.name;
        const attributebuffer = attrRef.buffer;
        const definition = attributebuffer.attributes.get(attributeName);
        if (definition === undefined) {
            throwError(() => `Could not find VAO attribute for location ${location} in Attribute Buffer "${attributebuffer.name}".`);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, attributebuffer.glBuffer);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, definition.size, definition.type, definition.normalized ?? false, calcStride(attributebuffer.attributes.values()), offset);
        logInfo(() => `Attribute "${attributeName}" of VAO "${name}" bound to location: ${location}`);
        // TODO: this does not handle the case where the attribute type is a matrix, see https://stackoverflow.com/a/17355139
    }
    // Reset the WebGL state again.
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null); // unbind the VAO _before_ the IBO!
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    // Return the VAO object.
    return {
        name,
        glVao: vao,
        ibo,
        attributes,
    };
}
function textureDataTargetToTarget(dataTarget) {
    switch (dataTarget) {
        case TextureDataTarget.TEXTURE_2D:
            return TextureTarget.TEXTURE_2D;
        case TextureDataTarget.TEXTURE_3D:
            return TextureTarget.TEXTURE_3D;
        case TextureDataTarget.TEXTURE_2D_ARRAY:
            return TextureTarget.TEXTURE_2D_ARRAY;
        case TextureDataTarget.TEXTURE_CUBE_MAP_POSITIVE_X:
        case TextureDataTarget.TEXTURE_CUBE_MAP_NEGATIVE_X:
        case TextureDataTarget.TEXTURE_CUBE_MAP_POSITIVE_Y:
        case TextureDataTarget.TEXTURE_CUBE_MAP_NEGATIVE_Y:
        case TextureDataTarget.TEXTURE_CUBE_MAP_POSITIVE_Z:
        case TextureDataTarget.TEXTURE_CUBE_MAP_NEGATIVE_Z:
            return TextureTarget.TEXTURE_CUBE_MAP;
        default:
            throwError(() => `Invalid texture data target: ${dataTarget}.`);
    }
}
function defineTextureImpl(gl, glTexture, dataTarget, source, options = {}) {
    // Get some information about the WebGL context.
    const textureUnitCount = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    const anisotropyExtension = gl.getExtension("EXT_texture_filter_anisotropic");
    const maxAnisotropy = anisotropyExtension ? gl.getParameter(anisotropyExtension.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
    // Validate the arguments and apply default values.
    let width = Math.max(1, Math.ceil(options.width ?? 1));
    let height = Math.max(1, Math.ceil(options.height ?? 1));
    const depth = Math.max(1, Math.ceil(options.depth ?? 1));
    // TODO: check that width, height and depth make sense with the given source
    const level = Math.max(0, Math.ceil(options.level ?? 0));
    const internalFormat = options.internalFormat ?? gl.RGB;
    const sourceFormat = options.sourceFormat ?? gl.RGB;
    const dataType = options.dataType ?? gl.UNSIGNED_BYTE;
    // TODO: validate formats and data types
    // TODO: There should be some sort of automatic decision tree that determines the correct
    // combination of internal format / format and type based on some human-understandable description.
    // Have a look at:
    // * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
    // * https://registry.khronos.org/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
    const wipTextureUnit = options.wipTextureUnit ?? textureUnitCount - 1; // use the highest texture unit by default
    if (wipTextureUnit < 0 || wipTextureUnit >= textureUnitCount) {
        throwError(() => `Invalid WIP texture unit: ${options.wipTextureUnit}.`);
    }
    const createMipMaps = options.createMipMaps ?? true;
    const setAnisotropy = anisotropyExtension ? (options.setAnisotropy ?? true) : false;
    // Use a default source of one black pixel if it is null
    const placeholder = new Uint8Array([0, 0, 0, 255]);
    if (source === null) {
        if (level !== 0) {
            throwError(() => `Level must be zero for empty textures, not ${level}.`);
        }
        width = 1;
        height = 1;
        source = placeholder;
    }
    // Helper functions
    const defineTexture2D = (dataTarget, data) => {
        if (ArrayBuffer.isView(data)) {
            gl.texImage2D(dataTarget, level, internalFormat, width, height, 
            /*border=*/ 0, sourceFormat, dataType, data);
        }
        else {
            gl.texImage2D(dataTarget, level, internalFormat, sourceFormat, dataType, data);
        }
        // Define texture parameters for a 2D texture.
        if (dataTarget === TextureDataTarget.TEXTURE_2D) {
            // Set defaults fist
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            // Generate mipmaps if requested and possible.
            if (createMipMaps) {
                if (isPowerOf2(width) && isPowerOf2(height)) {
                    gl.generateMipmap(gl.TEXTURE_2D);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                }
                else {
                    logWarning(() => 'Mipmaps are only supported for textures with power-of-two dimensions.');
                }
            }
            // Enable anisotropic filtering if supported and requested.
            if (setAnisotropy) {
                if (anisotropyExtension !== null) {
                    gl.texParameterf(gl.TEXTURE_2D, anisotropyExtension.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
                }
                else {
                    logWarning(() => 'Anisotropic filtering is not supported.');
                }
            }
            // TODO: customize filtering
            // TODO: customize wrapping
        }
        // Define texture parameteres for a cubemap face.
        else {
            if (createMipMaps) {
                logWarning(() => 'Mipmaps are not supported for cube map textures.');
            }
            if (setAnisotropy) {
                logWarning(() => 'Anisotropic filtering is not supported for cube map textures.');
            }
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        }
    };
    const defineTexture3D = (dataTarget, data) => {
        gl.texImage3D(dataTarget, level, internalFormat, width, height, depth, 
        /*border=*/ 0, sourceFormat, dataType, data);
        // TODO: 2D Array Textures?
    };
    // Define the texture
    gl.activeTexture(gl.TEXTURE0 + wipTextureUnit);
    const target = textureDataTargetToTarget(dataTarget);
    gl.bindTexture(target, glTexture);
    try {
        switch (target) {
            case TextureTarget.TEXTURE_2D:
            case TextureTarget.TEXTURE_CUBE_MAP:
                defineTexture2D(dataTarget, source);
                break;
            case TextureTarget.TEXTURE_3D:
            case TextureTarget.TEXTURE_2D_ARRAY:
                defineTexture3D(dataTarget, source);
                break;
        }
    }
    finally {
        gl.bindTexture(target, null);
    }
}
/**
 * (Re-)define an existing texture.
 * @param gl The WebGL context.
 * @param texture The texture object to define.
 * @param source The pixel or image data, defaults to one black pixel.
 * @param dataTarget The texture data target, required only for cube map faces.
 * @param options Additional options for the texture.
 */
function defineTexture(gl, texture, source = null, dataTarget = null, options = {}) {
    // When defining cubemap faces, the data target must be specified.
    dataTarget = dataTarget ?? texture.target;
    if (dataTarget === TextureTarget.TEXTURE_CUBE_MAP) {
        throwError(() => `You need to specify the data target for cube map textures.`);
    }
    try {
        defineTextureImpl(gl, texture.glTexture, dataTarget, source, options);
        if (source === null) {
            logInfo(() => `Defined empty texture "${texture.name}".`);
        }
        else if (ArrayBuffer.isView(source)) {
            logInfo(() => `Defined texture "${texture.name}" from a data view.`);
        }
        else {
            logInfo(() => `Defined texture "${texture.name}" with image data.`);
        }
    }
    catch (error) {
        error.message = `Failed to define texture "${texture.name}": ${error.message}`;
        throw error;
    }
}
/**
 * Create and define a new texture.
 * @param gl The WebGL context.
 * @param name The name of the texture.
 * @param target The texture target.
 * @param source The pixel or image data, defaults to one black pixel.
 * @param options Additional options for the texture.
 * @returns The texture object.
 */
function createTexture(gl, name, target = TextureTarget.TEXTURE_2D, source = null, options = {}) {
    // Create the new texture
    const glTexture = gl.createTexture();
    if (glTexture === null) {
        throwError(() => `Failed to create WebGL texture for Texture "${name}"`);
    }
    // Define the texture
    try {
        const isCubemap = target === TextureTarget.TEXTURE_CUBE_MAP;
        if (isCubemap) {
            for (let i = 0; i < 6; ++i) {
                defineTextureImpl(gl, glTexture, TextureDataTarget.TEXTURE_CUBE_MAP_POSITIVE_X + i, source, options);
            }
        }
        else {
            defineTextureImpl(gl, glTexture, target, source, options);
        }
        if (source === null) {
            logInfo(() => `Created empty ${isCubemap ? 'cubemap' : 'texture'} "${name}".`);
        }
        else if (ArrayBuffer.isView(source)) {
            logInfo(() => `Created texture "${name}" from a data view.`);
        }
        else {
            logInfo(() => `Created texture "${name}" with image data.`);
        }
    }
    catch (error) {
        gl.deleteTexture(glTexture);
        error.message = `Failed to create texture "${name}": ${error.message}`;
        throw error;
    }
    // Return the texture.
    return {
        name,
        glTexture,
        target: target,
    };
}
// Shader =================================================================== //
function compileWebGLShader(gl, source, stage) {
    const shader = gl.createShader(stage);
    if (shader === null) {
        throwError(() => {
            const stageName = stage === ShaderStage.VERTEX ? "vertex" : "fragment";
            return `Failed to create a new ${stageName} shader.`;
        });
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}
/**
 * Create a Vertex Shader program from the given source code.
 * @param gl The WebGL context.
 * @param source The source code of the vertex shader.
 * @returns The Vertex Shader object.
 */
function createVertexShader(gl, source) {
    return {
        glShader: compileWebGLShader(gl, source, gl.VERTEX_SHADER),
        stage: ShaderStage.VERTEX,
        source,
    };
}
/**
 * Create a Fragment Shader program from the given source code.
 * @param gl The WebGL context.
 * @param source The source code of the fragment shader.
 * @returns The Fragment Shader object.
 */
function createFragmentShader(gl, source) {
    return {
        glShader: compileWebGLShader(gl, source, gl.FRAGMENT_SHADER),
        stage: ShaderStage.FRAGMENT,
        source,
    };
}
/**
 * Deletes the given Shader.
 * Does nothing if the Shader has already been deleted.
 * @param gl The WebGL context.
 * @param shader The shader to delete.
 */
function deleteShader(gl, shader) {
    if (shader.glShader === null) {
        return;
    }
    gl.deleteShader(shader.glShader);
    shader.glShader = null;
}
function findAttributes(source) {
    const regex = /(?:layout\s*\(location\s*=\s*(?<loc>\d+)\)\s*)?in\s+(?:(?<prec>lowp|mediump|highp)\s+)?(?<type>\w+)\s+(?<name>\w+)\s*;/g;
    const attributes = {};
    let match;
    while ((match = regex.exec(source)) !== null) {
        const { name, type, loc, prec } = match.groups;
        // TODO: check that the type is valid
        attributes[name] = { type };
        if (loc) {
            attributes[name].location = parseInt(loc);
        }
        if (prec) {
            attributes[name].precision = prec;
        }
    }
    return attributes;
}
function findUniforms(vertexSource, fragmentSource) {
    // TODO: uniforms are still found even if they are commented out (attributes probably too)
    const regex = /uniform\s+(?<prec>lowp|mediump|highp)?\s*(?<type>\w+)\s+(?<name>\w+)(?:\s*\[\s*(?<size>\d+)\s*\])?;/g;
    const uniforms = {};
    let match;
    for (let source of [vertexSource, fragmentSource]) {
        while ((match = regex.exec(source)) !== null) {
            const { name, type, prec, size } = match.groups;
            if (name in uniforms) {
                continue; // Ignore known uniforms, their info won't change (or the shader won't compile).
            }
            uniforms[name] = { type };
            if (prec) {
                uniforms[name].precision = prec;
            }
            if (size) {
                uniforms[name].size = parseInt(size);
            }
        }
    }
    return uniforms;
}
/**
 * Helper function to call the corret gl.uniform* function based on the uniform type.
 * @param gl The WebGL context.
 * @param uniform The uniform info with the value to set.
 */
function setUniform(gl, uniform) {
    // Debug checks (are compiled out in release builds).
    const isNumber = (val) => typeof val === 'number';
    const isInt = (val) => Number.isSafeInteger(val);
    const isUint = (val) => isInt(val) && val >= 0;
    const isBool = (val) => typeof val === 'boolean' || (isInt(val) && (val === 0 || val === 1));
    const isArrayOfNumbers = (size) => Array.isArray(uniform.value) && uniform.value.length == size * uniform.size && uniform.value.every(val => isNumber(val));
    const isArrayOfBools = (size) => Array.isArray(uniform.value) && uniform.value.length == size * uniform.size && uniform.value.every(val => isBool(val));
    const isArrayOfInts = (size) => Array.isArray(uniform.value) && uniform.value.length == size * uniform.size && uniform.value.every(val => isInt(val));
    const isArrayOfUints = (size) => Array.isArray(uniform.value) && uniform.value.length == size * uniform.size && uniform.value.every(val => isUint(val));
    const errorMessage = (size, type) => `Value of uniform must be an array of ${size * uniform.size} ${type}s!`;
    // Assign non-sampler uniforms.
    switch (uniform.type) {
        case 'float':
            assert(() => [isNumber(uniform.value), `Value of uniform must be a number!`]);
            return gl.uniform1f(uniform.location, uniform.value);
        case 'vec2':
            assert(() => [isArrayOfNumbers(2), errorMessage(2, 'number')]);
            return gl.uniform2fv(uniform.location, uniform.value);
        case 'vec3':
            assert(() => [isArrayOfNumbers(3), errorMessage(3, 'number')]);
            return gl.uniform3fv(uniform.location, uniform.value);
        case 'vec4':
            assert(() => [isArrayOfNumbers(4), errorMessage(4, 'number')]);
            return gl.uniform4fv(uniform.location, uniform.value);
        case 'mat2':
        case 'mat2x2':
            assert(() => [isArrayOfNumbers(4), errorMessage(4, 'number')]);
            return gl.uniformMatrix2fv(uniform.location, false, uniform.value);
        case 'mat3':
        case 'mat3x3':
            assert(() => [isArrayOfNumbers(9), errorMessage(9, 'number')]);
            return gl.uniformMatrix3fv(uniform.location, false, uniform.value);
        case 'mat4':
        case 'mat4x4':
            assert(() => [isArrayOfNumbers(16), errorMessage(16, 'number')]);
            return gl.uniformMatrix4fv(uniform.location, false, uniform.value);
        case 'int':
        case 'sampler2D':
        case 'sampler2DArray':
        case 'samplerCube':
        case 'sampler3D':
        case 'isampler2D':
        case 'isampler2DArray':
        case 'isamplerCube':
        case 'isampler3D':
        case 'usampler2D':
        case 'usampler2DArray':
        case 'usamplerCube':
        case 'usampler3D':
        case 'sampler2DShadow':
        case 'sampler2DArrayShadow':
        case 'samplerCubeShadow':
            assert(() => [isInt(uniform.value), `Value of uniform must be an integer!`]);
            return gl.uniform1i(uniform.location, uniform.value);
        case 'uint':
            assert(() => [isUint(uniform.value), `Value of uniform must be a positive integer!`]);
            return gl.uniform1ui(uniform.location, uniform.value);
        case 'bool':
            assert(() => [isBool(uniform.value), `Value of uniform must be a boolean, zero or one!`]);
            return gl.uniform1i(uniform.location, uniform.value ? 1 : 0);
        case 'mat2x3':
            assert(() => [isArrayOfNumbers(6), errorMessage(6, 'number')]);
            return gl.uniformMatrix2x3fv(uniform.location, false, uniform.value);
        case 'mat3x2':
            assert(() => [isArrayOfNumbers(6), errorMessage(6, 'number')]);
            return gl.uniformMatrix3x2fv(uniform.location, false, uniform.value);
        case 'mat2x4':
            assert(() => [isArrayOfNumbers(8), errorMessage(8, 'number')]);
            return gl.uniformMatrix2x4fv(uniform.location, false, uniform.value);
        case 'mat4x2':
            assert(() => [isArrayOfNumbers(8), errorMessage(8, 'number')]);
            return gl.uniformMatrix4x2fv(uniform.location, false, uniform.value);
        case 'mat3x4':
            assert(() => [isArrayOfNumbers(12), errorMessage(12, 'number')]);
            return gl.uniformMatrix3x4fv(uniform.location, false, uniform.value);
        case 'mat4x3':
            assert(() => [isArrayOfNumbers(12), errorMessage(12, 'number')]);
            return gl.uniformMatrix4x3fv(uniform.location, false, uniform.value);
        case 'ivec2':
            assert(() => [isArrayOfInts(2), errorMessage(2, 'integer')]);
            return gl.uniform2iv(uniform.location, uniform.value);
        case 'ivec3':
            assert(() => [isArrayOfInts(3), errorMessage(3, 'integer')]);
            return gl.uniform3iv(uniform.location, uniform.value);
        case 'ivec4':
            assert(() => [isArrayOfInts(4), errorMessage(4, 'integer')]);
            return gl.uniform4iv(uniform.location, uniform.value);
        case 'uvec2':
            assert(() => [isArrayOfUints(2), errorMessage(2, 'positive integer')]);
            return gl.uniform2uiv(uniform.location, uniform.value);
        case 'uvec3':
            assert(() => [isArrayOfUints(3), errorMessage(3, 'positive integer')]);
            return gl.uniform3uiv(uniform.location, uniform.value);
        case 'uvec4':
            assert(() => [isArrayOfUints(4), errorMessage(4, 'positive integer')]);
            return gl.uniform4uiv(uniform.location, uniform.value);
        case 'bvec2':
            assert(() => [isArrayOfBools(2), errorMessage(2, 'boolean')]);
            return gl.uniform2iv(uniform.location, uniform.value);
        case 'bvec3':
            assert(() => [isArrayOfBools(3), errorMessage(3, 'boolean')]);
            return gl.uniform3iv(uniform.location, uniform.value);
        case 'bvec4':
            assert(() => [isArrayOfBools(4), errorMessage(4, 'boolean')]);
            return gl.uniform4iv(uniform.location, uniform.value);
        default:
            throwError(() => `Unsupported uniform type "${uniform.type}"`);
    }
}
/** Produce a default value for a uniform based on its type.
 * @param type GLSL type of the uniform.
 * @param size Size of the uniform (for arrays).
 * @returns A default value for the uniform or null if no default value is known.
 */
function getDefaultUniformValue(type, size) {
    assert(() => [size >= 1, `Uniform size must be at least 1, not ${size}.`]);
    let result;
    switch (type) {
        case 'float':
        case 'int':
        case 'uint':
        case 'bool':
            result = 0;
            break;
        case 'vec2':
        case 'ivec2':
        case 'uvec2':
        case 'bvec2':
            result = [0, 0];
            break;
        case 'vec3':
        case 'ivec3':
        case 'uvec3':
        case 'bvec3':
            result = [0, 0, 0];
            break;
        case 'vec4':
        case 'ivec4':
        case 'uvec4':
        case 'bvec4':
            result = [0, 0, 0, 0];
            break;
        case 'mat2':
        case 'mat2x2':
            result = [
                1, 0,
                0, 1
            ];
            break;
        case 'mat3':
        case 'mat3x3':
            result = [
                1, 0, 0,
                0, 1, 0,
                0, 0, 1
            ];
            break;
        case 'mat4':
        case 'mat4x4':
            result = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];
            break;
        case 'mat2x3':
            result = [
                1, 0,
                0, 1,
                0, 0
            ];
            break;
        case 'mat2x4':
            result = [
                1, 0,
                0, 1,
                0, 0,
                0, 0
            ];
            break;
        case 'mat3x2':
            result = [
                1, 0, 0,
                0, 1, 0
            ];
            break;
        case 'mat3x4':
            result = [
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
                0, 0, 0
            ];
            break;
        case 'mat4x2':
            result = [
                1, 0, 0, 0,
                0, 1, 0, 0
            ];
            break;
        case 'mat4x3':
            result = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0
            ];
            break;
        default:
            // Samplers have no meaningful default value. Instead they default
            // to zero which is a valid texture unit but might not be what
            // the user wants.
            return null;
    }
    if (size === 1) {
        return result;
    }
    else {
        return Array(size).fill(result).flat();
    }
}
/**
 * By default, all Uniforms are initialized to zero, which is not always what
 * the user wants. This function returns true if the given uniform type requires
 * an explicit default value (even i)
 * @param type
 * @returns
 */
function uniformHasNonZeroDefault(type) {
    switch (type) {
        case 'float':
        case 'int':
        case 'uint':
        case 'bool':
        case 'vec2':
        case 'ivec2':
        case 'uvec2':
        case 'bvec2':
        case 'vec3':
        case 'ivec3':
        case 'uvec3':
        case 'bvec3':
        case 'vec4':
        case 'ivec4':
        case 'uvec4':
        case 'bvec4':
            return false;
        default:
            return true;
    }
}
function createShaderProgram(gl, name, vertexShader, fragmentShader, uniforms = {}, attributes = {}) {
    // Check that the shaders are valid.
    if (vertexShader.glShader === null) {
        throwError(() => `Cannot create shader program "${name}" because the vertex shader has been deleted.`);
    }
    if (fragmentShader.glShader === null) {
        throwError(() => `Cannot create shader program "${name}" because the fragment shader has been deleted.`);
    }
    // Create the shader program.
    const glProgram = gl.createProgram();
    if (glProgram === null) {
        throwError(() => `Failed to create a new WebGL shader program for "${name}".`);
    }
    gl.attachShader(glProgram, vertexShader.glShader);
    gl.attachShader(glProgram, fragmentShader.glShader);
    // Find all attributes in the vertex shader.
    // If the user specified locations for the attributes, bind them now.
    const foundAttributes = findAttributes(vertexShader.source);
    // TODO: warn about reserved attributes starting with "webgl_" or "_webgl_", see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindAttribLocation#name
    if (Object.keys(attributes).length > 0) {
        for (const [attributeName, attributeLocation] of Object.entries(attributes)) {
            const attributeInfo = foundAttributes[attributeName];
            if (attributeInfo === undefined) {
                logWarning(() => `Attribute "${attributeName}" not found in vertex shader of shader program "${name}".`);
                continue;
            }
            if (attributeInfo.location !== undefined && attributeInfo.location !== attributeLocation) {
                logWarning(() => `Vertex shader of shader program "${name}" specifies the location of attribute "${attributeName}" to be ${attributeInfo.location}, not ${attributeLocation}.`);
                continue;
            }
            attributeInfo.location = attributeLocation; // update the info as well
            gl.bindAttribLocation(glProgram, attributeLocation, attributeName);
        }
    }
    // Link the program and check for errors
    gl.linkProgram(glProgram);
    if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
        throwError(() => `Failed to link shader program "${name}": ${gl.getProgramInfoLog(glProgram)}`
            + `\nVertex Shader log: ${gl.getShaderInfoLog(vertexShader)}`
            + `\nFragent Shader log: ${gl.getShaderInfoLog(fragmentShader)}`);
    }
    // Store the actual location of all attributes.
    const shaderAttributes = new Map();
    for (const [attributeName, attributeInfo] of Object.entries(foundAttributes)) {
        const location = gl.getAttribLocation(glProgram, attributeName);
        if (location === -1) {
            logWarning(() => `Attribute "${attributeName}" not found in linked shader program "${name}"!`);
            continue;
        }
        if (attributeInfo.location) {
            if (attributeInfo.location === location) {
                logInfo(() => `Attribute "${attributeName}" of shader "${name}" found at expected location ${location}.`);
            }
            else {
                logWarning(() => `Shader program "${name}" overrides the location of attribute "${attributeName}" to be ${location}, not ${attributeInfo.location}.`);
            }
        }
        else {
            logInfo(() => `Attribute "${attributeName}" of shader "${name}" found at automatic location ${location}.`);
        }
        shaderAttributes.set(attributeName, { location, type: attributeInfo.type });
    }
    // Detect missing uniforms
    const foundUniforms = findUniforms(vertexShader.source, fragmentShader.source);
    for (const uniformName of Object.keys(uniforms)) {
        if (!(uniformName in foundUniforms)) {
            logWarning(() => `Uniform "${uniformName}" not found in shader program '${name}'!`);
        }
    }
    // Create uniform objects.
    const shaderUniforms = new Map();
    gl.useProgram(glProgram);
    for (const [uniformName, foundUniform] of Object.entries(foundUniforms)) {
        // Find the uniform location.
        const location = gl.getUniformLocation(glProgram, uniformName);
        if (location === null) {
            logWarning(() => `Unused Uniform "${uniformName}" was removed from shader program "${name}"!`);
            continue;
        }
        // Determine the initial value of the uniform.
        const uniformSize = foundUniform.size ?? 1;
        const manualInitialValue = uniforms[uniformName];
        let initialValue;
        if (manualInitialValue !== undefined) {
            initialValue = manualInitialValue;
        }
        else {
            const maybeInitialValue = getDefaultUniformValue(foundUniform.type, uniformSize);
            if (maybeInitialValue === null) {
                throwError(() => `Uniform "${uniformName}" of type '${foundUniform.type}' requires an explicit default value in shader "${name}"`);
            }
            initialValue = maybeInitialValue;
        }
        // Create and store the uniform object.
        const shaderUniform = {
            type: foundUniform.type,
            location,
            size: uniformSize,
            value: initialValue,
        };
        shaderUniforms.set(uniformName, shaderUniform);
        // Upload the value.
        if (manualInitialValue !== undefined || uniformHasNonZeroDefault(foundUniform.type)) {
            try {
                setUniform(gl, shaderUniform);
            }
            catch (error) {
                throwError(() => `Failed to set initial value of uniform "${uniformName}" of shader "${name}": ${error}`);
            }
            logInfo(() => `Uniform "${uniformName}" of shader "${name}" initialized with: ${shaderUniform.value}.`);
        }
    }
    gl.useProgram(null);
    // Return the shader program.
    return {
        name,
        glProgram,
        vertexShader,
        fragmentShader,
        attributes: shaderAttributes,
        uniforms: shaderUniforms,
    };
}
// TODO: Framebuffers (see glance-v1)
// Draw Call ================================================================ //
function createTextureUnit(texture) {
    switch (texture.target) {
        case TextureTarget.TEXTURE_2D:
            return { texture_2d: texture };
        case TextureTarget.TEXTURE_3D:
            return { texture_3d: texture };
        case TextureTarget.TEXTURE_CUBE_MAP:
            return { texture_cube: texture };
        case TextureTarget.TEXTURE_2D_ARRAY:
            return { texture_2d_array: texture };
        default:
            throwError(() => `Unsupported texture target: ${texture.target}`);
    }
}
function insertIntoTextureUnit(textureUnit, texture) {
    switch (texture.target) {
        case TextureTarget.TEXTURE_2D:
            if (textureUnit.texture_2d !== undefined) {
                throwError(() => `Texture unit already contains a 2D texture!`);
            }
            textureUnit.texture_2d = texture;
            break;
        case TextureTarget.TEXTURE_3D:
            if (textureUnit.texture_3d !== undefined) {
                throwError(() => `Texture unit already contains a 3D texture!`);
            }
            textureUnit.texture_3d = texture;
            break;
        case TextureTarget.TEXTURE_CUBE_MAP:
            if (textureUnit.texture_cube !== undefined) {
                throwError(() => `Texture unit already contains a cube map!`);
            }
            textureUnit.texture_cube = texture;
            break;
        case TextureTarget.TEXTURE_2D_ARRAY:
            if (textureUnit.texture_2d_array !== undefined) {
                throwError(() => `Texture unit already contains a 2D array texture!`);
            }
            textureUnit.texture_2d_array = texture;
            break;
        default:
            throwError(() => `Unsupported texture target: ${texture.target}`);
    }
}
function matchAttributeType(attr, glslType) {
    switch (attr.type) {
        case AttributeDataType.BYTE:
        case AttributeDataType.UNSIGNED_BYTE:
        case AttributeDataType.SHORT:
        case AttributeDataType.UNSIGNED_SHORT:
        case AttributeDataType.INT:
        case AttributeDataType.INT_2_10_10_10_REV:
        case AttributeDataType.UNSIGNED_INT:
        case AttributeDataType.UNSIGNED_INT_2_10_10_10_REV:
            switch (glslType) {
                case 'int':
                case 'uint':
                    return attr.size === 1;
                case 'ivec2':
                case 'uvec2':
                    return attr.size === 2;
                case 'ivec3':
                case 'uvec3':
                    return attr.size === 3;
                case 'ivec4':
                case 'uvec4':
                    return attr.size === 4;
                default:
                    return false;
            }
        case AttributeDataType.FLOAT:
        case AttributeDataType.HALF_FLOAT:
            switch (glslType) {
                case 'float':
                    return attr.size === 1;
                case 'vec2':
                    return attr.size === 2;
                case 'vec3':
                    return attr.size === 3;
                case 'vec4':
                    return attr.size === 4;
                // TODO: handle cases where the GLSL type is a matrix
                default:
                    return false;
            }
    }
}
/**
 * Creates a new Draw Call.
 * @param program
 * @param vao
 * @param uniforms Uniform update callbacks to update uniforms before drawing.
 */
function createDrawCall(gl, program, vao, uniforms, textures, enabled, indexCount, indexOffset) {
    // Validate the arguments.
    uniforms = uniforms ?? {};
    textures = textures ?? [];
    indexCount = indexCount ?? vao.ibo.size;
    indexOffset = indexOffset ?? 0;
    if (indexCount <= 0) {
        throwError(() => `Invalid index count: ${indexCount}.`);
    }
    if (indexOffset < 0) {
        throwError(() => `Invalid index offset: ${indexOffset}.`);
    }
    indexCount = Math.ceil(indexCount);
    indexOffset = Math.ceil(indexOffset);
    if (indexOffset + indexCount > vao.ibo.size) {
        throwError(() => `Index offset ${indexOffset} and count ${indexCount} exceed the size of the index buffer (${vao.ibo.size}).`);
    }
    // Ensure that the attribute locations of the VAO match the shader program.
    for (const shaderAttribute of program.attributes.values()) {
        const vaoAttributeRef = vao.attributes.get(shaderAttribute.location);
        if (vaoAttributeRef === undefined) {
            throwError(() => `VAO "${vao.name}" does not provide an attribute at location ${shaderAttribute.location} as expected for shader program "${program.name}"!`);
        }
        const vaoAttribute = vaoAttributeRef.buffer.attributes.get(vaoAttributeRef.name);
        if (vaoAttribute === undefined) {
            throwError(() => `Missing attribute "${vaoAttributeRef.name}" in VBO "${vaoAttributeRef.buffer.name}"!`);
        }
        if (!matchAttributeType(vaoAttribute, shaderAttribute.type)) {
            throwError(() => `Attribute "${vaoAttributeRef.name}" in VBO "${vaoAttributeRef.buffer.name}" has type ${vaoAttribute.type} but shader program "${program.name}" expects type ${shaderAttribute.type}!`);
        }
    }
    // Ensure that all uniforms actually exist in the shader program
    for (const uniformName of Object.keys(uniforms)) {
        if (!program.uniforms.has(uniformName)) {
            throwError(() => `Uniform "${uniformName}" not found in shader program "${program.name}"!`);
        }
    }
    // Create the texture unit mapping.
    const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    const textureUnits = new Map();
    for (const [unitId, texture] of textures) {
        if (unitId < 0 || unitId >= maxTextureUnits) {
            throwError(() => `Invalid texture unit id: ${unitId}. Valid range is [0, ${maxTextureUnits}).`);
        }
        const usedUnit = textureUnits.get(unitId);
        if (usedUnit === undefined) {
            textureUnits.set(unitId, createTextureUnit(texture));
        }
        else {
            insertIntoTextureUnit(usedUnit, texture);
        }
    }
    // Create the draw call.
    return {
        program,
        vao,
        count: indexCount,
        offset: indexOffset,
        uniforms: new Map(Object.entries(uniforms)),
        textures: textureUnits,
        enabled,
    };
}
function performDrawCall(gl, drawCall, time) {
    // Return early if the draw call is disabled.
    if (drawCall.enabled !== undefined && !drawCall.enabled(time)) {
        return;
    }
    gl.bindVertexArray(drawCall.vao.glVao);
    gl.useProgram(drawCall.program.glProgram);
    try {
        // Update the uniforms.
        for (const [uniformName, updateCallback] of drawCall.uniforms) {
            const uniform = drawCall.program.uniforms.get(uniformName);
            if (uniform === undefined) {
                throwError(() => `Uniform "${uniformName}" from update callback not found in shader program "${drawCall.program.name}"!`);
            }
            const newValue = updateCallback(time);
            if (newValue === undefined) {
                throwError(() => `Uniform update callback for "${uniformName}" returned undefined!`);
            }
            if (newValue === uniform.value) {
                continue; // no need to update
            }
            uniform.value = newValue;
            try {
                setUniform(gl, uniform);
            }
            catch (error) {
                throwError(() => `Failed to update uniform "${uniformName}" of shader "${drawCall.program.name}": ${error}`);
            }
        }
        // Bind the textures
        for (const [id, unit] of drawCall.textures) {
            gl.activeTexture(gl.TEXTURE0 + id);
            if (unit.texture_2d !== undefined) {
                gl.bindTexture(gl.TEXTURE_2D, unit.texture_2d.glTexture);
            }
            if (unit.texture_3d !== undefined) {
                gl.bindTexture(gl.TEXTURE_3D, unit.texture_3d.glTexture);
            }
            if (unit.texture_cube !== undefined) {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, unit.texture_cube.glTexture);
            }
            if (unit.texture_2d_array !== undefined) {
                gl.bindTexture(gl.TEXTURE_2D_ARRAY, unit.texture_2d_array.glTexture);
            }
        }
        // Perform the draw call.
        gl.drawElements(gl.TRIANGLES, drawCall.count, drawCall.vao.ibo.type, drawCall.offset);
    }
    finally {
        gl.useProgram(null);
        gl.bindVertexArray(null);
    }
}
// TODO: function to perform a sequence of draw calls, which can be optimized with fewer state changes
