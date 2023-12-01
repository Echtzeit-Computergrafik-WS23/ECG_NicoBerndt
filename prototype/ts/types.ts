/** Short name for the WebGL2 context. */
export type WebGL2 = WebGL2RenderingContext

// Attribute Buffer ========================================================= //

/**
 * Data types for WebGL2 attributes.
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer#type
 */
export enum AttributeDataType
{
    BYTE = 0x1400,
    UNSIGNED_BYTE = 0x1401,
    SHORT = 0x1402,
    UNSIGNED_SHORT = 0x1403,
    INT = 0x1404,
    UNSIGNED_INT = 0x1405,
    FLOAT = 0x1406,
    HALF_FLOAT = 0x140B,
    INT_2_10_10_10_REV = 0x8D9F,
    UNSIGNED_INT_2_10_10_10_REV = 0x8368,
}

/**
 * GLSL Attributes can be 1, 2, 3 or 4 dimensional.
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer#size
 */
export type AttributeSize = 1 | 2 | 3 | 4

/**
 * Description of a single Attribute.
 */
export type AttributeDescription = {
    /** WebGL data type of the Attribute. */
    readonly type: AttributeDataType,

    /** Number of dimensions of the Attribute. */
    readonly size: AttributeSize,

    /** Whether integral data should be normalized. Defaults to false. */
    readonly normalized?: boolean,
}

/**
 * A Vertex Buffer Object (VBO) containing Attributes.
 */
export type AttributeBuffer = {
    /** The name of the Attribute Buffer. */
    readonly name: string,

    /** The WebGL Vertex Buffer Object. */
    readonly glBuffer: WebGLBuffer,

    /** The number of Vertices defined in the buffer. */
    readonly size: number,

    /** Interleaved Attributes defined in the buffer. Addressable by name. */
    readonly attributes: ReadonlyMap<string, AttributeDescription>,
}

/**
 * Refereence to a single Attribute in an Attribute Buffer.
 */
export type AttributeReference = {
    /** The Buffer containing this Attribute. */
    readonly buffer: AttributeBuffer,

    /** The name of the Attribute in the Buffer. */
    readonly name: string,
}

// Index Buffer ============================================================= //

/**
 * Data types for WebGL2 indices.
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements#type
 */
export enum IndexDataType
{
    UNSIGNED_BYTE = 0x1401,
    UNSIGNED_SHORT = 0x1403,
    UNSIGNED_INT = 0x1405,
}

/**
 * A Index Buffer Object (IBO) for drawing faces.
 */
export type IndexBuffer = {
    /** The WebGL Vertex Buffer Object. */
    readonly glBuffer: WebGLBuffer,

    /** The data type of an index. */
    readonly type: IndexDataType,

    /** The number of Indices in the buffer. */
    readonly size: number,
}

// VAO ====================================================================== //

export type VAO = {
    /** The name of the VAO. */
    readonly name: string,

    /** The WebGL Vertex Array Object. */
    readonly glVao: WebGLVertexArrayObject,

    /** The Index Buffer Object. */
    readonly ibo: IndexBuffer,

    /** The Attribute Bindings. */
    readonly attributes: ReadonlyMap<AttributeLocation, AttributeReference>,
}

// Texture ================================================================== //

/**
 * WebGL Texture targets.
 * See https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture#target
 */
export enum TextureTarget
{
    TEXTURE_2D = 0x0DE1,
    TEXTURE_3D = 0x806F,
    TEXTURE_CUBE_MAP = 0x8513,
    TEXTURE_2D_ARRAY = 0x8C1A,
}

/**
 * All WebGL Texture data targets.
 * See https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D#target
 * and https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/texImage3D#target
 */
export enum TextureDataTarget
{
    TEXTURE_2D = 0x0DE1,
    TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515,
    TEXTURE_CUBE_MAP_NEGATIVE_X = 0x8516,
    TEXTURE_CUBE_MAP_POSITIVE_Y = 0x8517,
    TEXTURE_CUBE_MAP_NEGATIVE_Y = 0x8518,
    TEXTURE_CUBE_MAP_POSITIVE_Z = 0x8519,
    TEXTURE_CUBE_MAP_NEGATIVE_Z = 0x851A,
    TEXTURE_3D = 0x806F,
    TEXTURE_2D_ARRAY = 0x8C1A,
}

/**
 * A 2D, 3D or Cube Texture.
 */
export type Texture = {
    /** The name of the Texture. */
    readonly name: string,

    /** The WebGL texture object. */
    readonly glTexture: WebGLTexture,

    /** The target of the texture. */
    readonly target: TextureTarget,
}

// Shader =================================================================== //

/**
 * A generic WebGL Shader.
 */
export interface Shader
{
    /** The WebGL Vertex Shader Object. Is mutable so it can be deleted. */
    glShader: WebGLShader | null,

    /** The shader source code. */
    readonly source: string,
}

/**
 * A WebGL Vertex Shader.
 */
export type VertexShader = Shader &
{
    /** The Shader Stage. */
    readonly stage: ShaderStage.VERTEX,
}

/**
 * A WebGL Fragment Shader.
 */
export type FragmentShader = Shader &
{
    /** The Shader Stage. */
    readonly stage: ShaderStage.FRAGMENT,
}

// Shader Attribute ========================================================= //

/** The location of an Attribute in a Shader Program. */
export type AttributeLocation = number

/** Acceptable Vertex Shader Input (Attribute) types.
 * See chapter 4.3.4 of:
 *  https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf
 */
export type GlslAttributeDataType =
    | "int" | "ivec2" | "ivec3" | "ivec4"
    | "uint" | "uvec2" | "uvec3" | "uvec4"
    | "float" | "vec2" | "vec3" | "vec4"
    | "mat2" | "mat2x2" | "mat2x3" | "mat2x4"
    | "mat3" | "mat3x2" | "mat3x3" | "mat3x4"
    | "mat4" | "mat4x2" | "mat4x3" | "mat4x4"

/**
 * A per-Vertex Input to the Vertex Shader stage of a Shader Program.
 */
export type ShaderAttribute = {
    /** Location of the Attribute in the Shader. */
    readonly location: AttributeLocation,

    /** The GLSL data type of the Attribute. */
    readonly type: GlslAttributeDataType,
}

// Shader Uniform =========================================================== //

/** Acceptable Uniform Shader Input types.
 * See chapter 4.3.5 of:
 *  https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf
 * Note that this does not cover the case where a Uniform is a struct or an
 * array of structs. See:
 *  https://www.khronos.org/opengl/wiki/Uniform_(GLSL)#Uniform_management
 */
export type GlslUniformDataType = GlslAttributeDataType
    | "bool" | "bvec2" | "bvec3" | "bvec4"
    | "sampler2D" | "sampler2DArray" | "samplerCube" | "sampler3D"
    | "isampler2D" | "isampler2DArray" | "isamplerCube" | "isampler3D"
    | "usampler2D" | "usampler2DArray" | "usamplerCube" | "usampler3D"
    | "sampler2DShadow" | "sampler2DArrayShadow" | "samplerCubeShadow"

/** Any value that can be assigned to a Uniform */
export type UniformValue = number | Array<number>

/**
 * A Uniform input to a Shader Program.
 */
export type ShaderUniform = {
    /** The type of the uniform. */
    readonly type: GlslUniformDataType,

    /** The location of the uniform in the shader program. */
    readonly location: WebGLUniformLocation,

    /** The array size of the uniform (=1 if it is a scalar). */
    readonly size: number,

    /** The current value of the uniform. */
    value: UniformValue,
}

// Shader Program =========================================================== //

/**
 * A WebGL Shader Program.
 */
export type ShaderProgram = {
    /** The name of the Shader Program. */
    readonly name: string,

    /** The WebGL Shader Program Object. */
    readonly glProgram: WebGLProgram,

    /** The Vertex Shader. */
    readonly vertexShader: VertexShader,

    /** The Fragment Shader. */
    readonly fragmentShader: FragmentShader,

    /** Attributes of the Vertex Shader, addressable by name. */
    readonly attributes: ReadonlyMap<string, ShaderAttribute>,

    /** Uniforms of the Shader Program, addressable by name. */
    readonly uniforms: ReadonlyMap<string, ShaderUniform>,
}

// Draw Call ================================================================ //

/**
 * The ID of a WebGL Texture Unit.
 */
export type TextureUnitId = number

/**
 * A WebGL2 Texture Unit.
 */
export type TextureUnit = {
    texture_2d?: Texture,
    texture_3d?: Texture,
    texture_cube?: Texture,
    texture_2d_array?: Texture,
}

/** Callback type to update a uniform value prior to a draw call. */
export type UniformUpdateCallback = (time: number) => UniformValue

/**
 * Everything needed to define and execute a WebGL Draw Call.
 */
export type DrawCall = {
    /** The Shader Program to use. */
    readonly program: ShaderProgram,

    /** The Vertex Array Object to use. */
    readonly vao: VAO,

    /** The number of indices to draw. */
    readonly count: number,

    /** The offset in the index buffer. */
    readonly offset: number,

    /** Callbacks to update uniforms before drawing. */
    readonly uniforms: ReadonlyMap<string, UniformUpdateCallback>,

    /** Texture Unit bindings. */
    readonly textures: ReadonlyMap<TextureUnitId, TextureUnit>,

    // TODO: draw call state like depth test etc.

    /** Whether the draw call is enabled. */
    readonly enabled?: (time: number) => boolean,
}

// WebGL Constants ========================================================== //

/**
 * WebGL2 Buffer Usage.
 * See: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData#usage
 */
export enum BufferUsage
{
    // The contents of the buffer are likely to be used often and not change often.
    STATIC_DRAW = 0x88E4,
    // The contents of the buffer are likely to not be used often.
    STREAM_DRAW = 0x88E0,
    // The contents of the buffer are likely to be used often and change often.
    DYNAMIC_DRAW = 0x88E8,

    // The contents are intended to be specified once by reading data from WebGL, and queried many times by the application.
    STATIC_READ = 0x88E5,
    // The contents are intended to be respecified repeatedly by reading data from WebGL, and queried many times by the application.
    DYNAMIC_READ = 0x88E9,
    // The contents are intended to be specified once by reading data from WebGL, and queried at most a few times by the application
    STREAM_READ = 0x88E1,
    // The contents are intended to be specified once by reading data from WebGL, and used many times as the source for WebGL drawing and image specification commands.
    STATIC_COPY = 0x88E6,
    // The contents are intended to be respecified repeatedly by reading data from WebGL, and used many times as the source for WebGL drawing and image specification commands.
    DYNAMIC_COPY = 0x88EA,
    // The contents are intended to be specified once by reading data from WebGL, and used at most a few times as the source for WebGL drawing and image specification commands.
    STREAM_COPY = 0x88E2,
}

/**
 * WebGL2 Shader Types.
 */
export enum ShaderStage
{
    VERTEX = 0x8B31,
    FRAGMENT = 0x8B30,
}

/**
 * GLSL data precisions.
 */
export type GlslPrecision = "lowp" | "mediump" | "highp"