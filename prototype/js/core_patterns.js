export { buildShaderProgram, buildAttributeMap, loadTexture, loadCubemap, Cached, TimeSensitive, };
import { TextureTarget, TextureDataTarget, } from "./types.js";
import { shallowCopy, } from "./dev.js";
import { createFragmentShader, createShaderProgram, createTexture, createVertexShader, defineTexture, deleteShader, } from "./core.js";
function buildShaderProgram(gl, name, vertexSource, fragmentSource, uniforms = {}, attributes = {}) {
    let vertexShader = null;
    let fragmentShader = null;
    try {
        vertexShader = createVertexShader(gl, vertexSource);
        fragmentShader = createFragmentShader(gl, fragmentSource);
        return createShaderProgram(gl, name, vertexShader, fragmentShader, uniforms, attributes);
    }
    finally {
        if (vertexShader !== null) {
            deleteShader(gl, vertexShader);
        }
        if (fragmentShader !== null) {
            deleteShader(gl, fragmentShader);
        }
    }
}
function buildAttributeMap(shader, abo, mapping) {
    // If the given mapping is just a list of attribute names, we assume
    // that the attribute names in the shader and the buffer are the same.
    if (Array.isArray(mapping)) {
        mapping = mapping.reduce((acc, cur) => {
            acc[cur] = cur;
            return acc;
        }, {});
    }
    // TODO: if mapping is null, inspect the shader and buffer to find
    //       matching attributes automatically.
    // Build the mapping
    const result = new Map();
    for (const [shaderAttribute, bufferAttribute] of Object.entries(mapping)) {
        const location = shader.attributes.get(shaderAttribute)?.location;
        if (location === undefined) {
            throw new Error(`Attribute ${shaderAttribute} not found in shader ${shader.name}`);
        }
        const description = abo.attributes.get(bufferAttribute);
        if (description === undefined) {
            throw new Error(`Attribute ${bufferAttribute} not found in buffer ${abo.name}`);
        }
        result.set(location, { buffer: abo, name: bufferAttribute });
    }
    return result;
}
function getNameFromURL(url) {
    const segments = url.split("/");
    const filename = segments[segments.length - 1];
    return filename.split(".")[0];
}
function loadTexture(gl, url, target = TextureTarget.TEXTURE_2D, name) {
    const texture = createTexture(gl, name ?? getNameFromURL(url), target);
    let image = new Image();
    if (image === null) {
        throw new Error("Failed to create empty Image");
    }
    image.onload = () => {
        defineTexture(gl, texture, image);
        image = null;
    };
    image.src = url;
    return texture;
}
class CubeMapStatus {
    _counter = 0;
    increment() {
        this._counter++;
    }
    isComplete() {
        return this._counter >= 6;
    }
}
function loadCubemap(gl, name, urls) {
    const cubeMapOptions = {
        createMipMaps: false,
        setAnisotropy: false,
    };
    const texture = createTexture(gl, name, TextureTarget.TEXTURE_CUBE_MAP, null, cubeMapOptions);
    const completion = new CubeMapStatus();
    urls.forEach((url, index) => {
        let image = new Image();
        if (image === null) {
            throw new Error("Failed to create empty Image");
        }
        image.onload = () => {
            defineTexture(gl, texture, image, TextureDataTarget.TEXTURE_CUBE_MAP_POSITIVE_X + index, cubeMapOptions);
            completion.increment();
            image = null;
        };
        image.src = url;
    });
    return [texture, completion];
}
/**
 * A cached value, useful in render loops where the same value is needed
 * multiple times per frame.
 */
class Cached {
    _getter;
    _value = null;
    _isDirty = true;
    _dependents = new Set();
    constructor(_getter, dependencies = []) {
        this._getter = _getter;
        for (const dependency of dependencies) {
            dependency._dependents.add(this);
        }
    }
    get() {
        if (this._isDirty) {
            this._value = this._getter();
            this._isDirty = false;
        }
        return shallowCopy(this._value);
    }
    setDirty() {
        this._isDirty = true;
        for (const dependent of this._dependents) {
            dependent.setDirty();
        }
    }
}
class TimeSensitive {
    _getter;
    _value = null;
    _timestamp = -1;
    constructor(_getter) {
        this._getter = _getter;
    }
    getAt(time) {
        if (this._timestamp < time) {
            this._value = this._getter(time);
            this._timestamp = time;
        }
        return shallowCopy(this._value);
    }
}
