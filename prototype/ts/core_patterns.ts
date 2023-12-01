export
{
    buildShaderProgram,
    buildAttributeMap,
    loadTexture,
    loadCubemap,
    Cached,
    TimeSensitive,
}

import
{
    type AttributeBuffer,
    type AttributeLocation,
    type AttributeReference,
    type FragmentShader,
    type ShaderProgram,
    type Texture,
    type UniformValue,
    type VertexShader,
    type WebGL2,
    TextureTarget,
    TextureDataTarget,
} from "./types"
import
{
    shallowCopy,
} from "./dev"
import
{
    createFragmentShader,
    createShaderProgram,
    createTexture,
    createVertexShader,
    defineTexture,
    deleteShader,
    type TextureOptions,
} from "./core"


function buildShaderProgram(
    gl: WebGL2,
    name: string,
    vertexSource: string,
    fragmentSource: string,
    uniforms: { [name: string]: UniformValue } = {},
    attributes: { [name: string]: AttributeLocation } = {}
): ShaderProgram
{
    let vertexShader: VertexShader | null = null
    let fragmentShader: FragmentShader | null = null
    try {
        vertexShader = createVertexShader(gl, vertexSource)
        fragmentShader = createFragmentShader(gl, fragmentSource)
        return createShaderProgram(gl, name, vertexShader, fragmentShader, uniforms, attributes)
    } finally {
        if (vertexShader !== null) {
            deleteShader(gl, vertexShader)
        }
        if (fragmentShader !== null) {
            deleteShader(gl, fragmentShader)
        }
    }
}

function buildAttributeMap(
    shader: ShaderProgram,
    abo: AttributeBuffer,
    mapping: { [shaderAttribute: string]: string } | Array<string>
): Map<AttributeLocation, AttributeReference>
{
    // If the given mapping is just a list of attribute names, we assume
    // that the attribute names in the shader and the buffer are the same.
    if (Array.isArray(mapping)) {
        mapping = mapping.reduce((acc, cur) =>
        {
            acc[cur] = cur
            return acc
        }, {} as { [shaderAttribute: string]: string })
    }

    // TODO: if mapping is null, inspect the shader and buffer to find
    //       matching attributes automatically.

    // Build the mapping
    const result = new Map<AttributeLocation, AttributeReference>()
    for (const [shaderAttribute, bufferAttribute] of Object.entries(mapping)) {
        const location = shader.attributes.get(shaderAttribute)?.location
        if (location === undefined) {
            throw new Error(`Attribute ${shaderAttribute} not found in shader ${shader.name}`)
        }
        const description = abo.attributes.get(bufferAttribute)
        if (description === undefined) {
            throw new Error(`Attribute ${bufferAttribute} not found in buffer ${abo.name}`)
        }
        result.set(location, { buffer: abo, name: bufferAttribute })
    }

    return result
}

function getNameFromURL(url: string): string
{
    const segments = url.split("/")
    const filename = segments[segments.length - 1]
    return filename.split(".")[0]
}

function loadTexture(
    gl: WebGL2,
    url: string,
    target: TextureTarget = TextureTarget.TEXTURE_2D,
    name?: string
): Texture
{
    const texture = createTexture(gl, name ?? getNameFromURL(url), target)
    let image: HTMLImageElement | null = new Image()
    if (image === null) {
        throw new Error("Failed to create empty Image")
    }
    image.onload = () =>
    {
        defineTexture(gl, texture, image)
        image = null
    }
    image.src = url
    return texture
}

class CubeMapStatus
{
    public _counter: number = 0;

    public increment(): void
    {
        this._counter++
    }

    public isComplete(): boolean
    {
        return this._counter >= 6
    }
}

function loadCubemap(
    gl: WebGL2,
    name: string,
    urls: [string, string, string, string, string, string]
): [Texture, CubeMapStatus]
{
    const cubeMapOptions: TextureOptions = {
        createMipMaps: false,
        setAnisotropy: false,
    }

    const texture = createTexture(gl, name, TextureTarget.TEXTURE_CUBE_MAP, null, cubeMapOptions)
    const completion = new CubeMapStatus()
    urls.forEach((url: string, index: number) =>
    {
        let image: HTMLImageElement | null = new Image()
        if (image === null) {
            throw new Error("Failed to create empty Image")
        }
        image.onload = () =>
        {
            defineTexture(gl, texture, image, TextureDataTarget.TEXTURE_CUBE_MAP_POSITIVE_X + index, cubeMapOptions)
            completion.increment()
            image = null
        }
        image.src = url
    })
    return [texture, completion]
}


/**
 * A cached value, useful in render loops where the same value is needed
 * multiple times per frame.
 */
class Cached<T> {
    private _value: T | null = null;
    private _isDirty: boolean = true;
    private _dependents: Set<Cached<any>> = new Set();

    constructor(private _getter: () => T, dependencies: Cached<any>[] = [])
    {
        for (const dependency of dependencies) {
            dependency._dependents.add(this)
        }
    }

    public get(): T
    {
        if (this._isDirty) {
            this._value = this._getter()
            this._isDirty = false
        }
        return shallowCopy(this._value!)
    }

    public setDirty(): void
    {
        this._isDirty = true
        for (const dependent of this._dependents) {
            dependent.setDirty()
        }
    }
}

class TimeSensitive<T> {
    private _value: T | null = null;
    private _timestamp: number = -1;

    constructor(private _getter: (time: number) => T) { }

    public getAt(time: number): T
    {
        if (this._timestamp < time) {
            this._value = this._getter(time)
            this._timestamp = time
        }
        return shallowCopy(this._value!)
    }
}