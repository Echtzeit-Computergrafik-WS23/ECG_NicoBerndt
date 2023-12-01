// Attribute Buffer ========================================================= //
/**
 * Data types for WebGL2 attributes.
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer#type
 */
export var AttributeDataType;
(function (AttributeDataType) {
    AttributeDataType[AttributeDataType["BYTE"] = 5120] = "BYTE";
    AttributeDataType[AttributeDataType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
    AttributeDataType[AttributeDataType["SHORT"] = 5122] = "SHORT";
    AttributeDataType[AttributeDataType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
    AttributeDataType[AttributeDataType["INT"] = 5124] = "INT";
    AttributeDataType[AttributeDataType["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
    AttributeDataType[AttributeDataType["FLOAT"] = 5126] = "FLOAT";
    AttributeDataType[AttributeDataType["HALF_FLOAT"] = 5131] = "HALF_FLOAT";
    AttributeDataType[AttributeDataType["INT_2_10_10_10_REV"] = 36255] = "INT_2_10_10_10_REV";
    AttributeDataType[AttributeDataType["UNSIGNED_INT_2_10_10_10_REV"] = 33640] = "UNSIGNED_INT_2_10_10_10_REV";
})(AttributeDataType || (AttributeDataType = {}));
// Index Buffer ============================================================= //
/**
 * Data types for WebGL2 indices.
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements#type
 */
export var IndexDataType;
(function (IndexDataType) {
    IndexDataType[IndexDataType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
    IndexDataType[IndexDataType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
    IndexDataType[IndexDataType["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
})(IndexDataType || (IndexDataType = {}));
// Texture ================================================================== //
/**
 * WebGL Texture targets.
 * See https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture#target
 */
export var TextureTarget;
(function (TextureTarget) {
    TextureTarget[TextureTarget["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
    TextureTarget[TextureTarget["TEXTURE_3D"] = 32879] = "TEXTURE_3D";
    TextureTarget[TextureTarget["TEXTURE_CUBE_MAP"] = 34067] = "TEXTURE_CUBE_MAP";
    TextureTarget[TextureTarget["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
})(TextureTarget || (TextureTarget = {}));
/**
 * All WebGL Texture data targets.
 * See https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D#target
 * and https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/texImage3D#target
 */
export var TextureDataTarget;
(function (TextureDataTarget) {
    TextureDataTarget[TextureDataTarget["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
    TextureDataTarget[TextureDataTarget["TEXTURE_CUBE_MAP_POSITIVE_X"] = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X";
    TextureDataTarget[TextureDataTarget["TEXTURE_CUBE_MAP_NEGATIVE_X"] = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X";
    TextureDataTarget[TextureDataTarget["TEXTURE_CUBE_MAP_POSITIVE_Y"] = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y";
    TextureDataTarget[TextureDataTarget["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y";
    TextureDataTarget[TextureDataTarget["TEXTURE_CUBE_MAP_POSITIVE_Z"] = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z";
    TextureDataTarget[TextureDataTarget["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z";
    TextureDataTarget[TextureDataTarget["TEXTURE_3D"] = 32879] = "TEXTURE_3D";
    TextureDataTarget[TextureDataTarget["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
})(TextureDataTarget || (TextureDataTarget = {}));
// WebGL Constants ========================================================== //
/**
 * WebGL2 Buffer Usage.
 * See: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData#usage
 */
export var BufferUsage;
(function (BufferUsage) {
    // The contents of the buffer are likely to be used often and not change often.
    BufferUsage[BufferUsage["STATIC_DRAW"] = 35044] = "STATIC_DRAW";
    // The contents of the buffer are likely to not be used often.
    BufferUsage[BufferUsage["STREAM_DRAW"] = 35040] = "STREAM_DRAW";
    // The contents of the buffer are likely to be used often and change often.
    BufferUsage[BufferUsage["DYNAMIC_DRAW"] = 35048] = "DYNAMIC_DRAW";
    // The contents are intended to be specified once by reading data from WebGL, and queried many times by the application.
    BufferUsage[BufferUsage["STATIC_READ"] = 35045] = "STATIC_READ";
    // The contents are intended to be respecified repeatedly by reading data from WebGL, and queried many times by the application.
    BufferUsage[BufferUsage["DYNAMIC_READ"] = 35049] = "DYNAMIC_READ";
    // The contents are intended to be specified once by reading data from WebGL, and queried at most a few times by the application
    BufferUsage[BufferUsage["STREAM_READ"] = 35041] = "STREAM_READ";
    // The contents are intended to be specified once by reading data from WebGL, and used many times as the source for WebGL drawing and image specification commands.
    BufferUsage[BufferUsage["STATIC_COPY"] = 35046] = "STATIC_COPY";
    // The contents are intended to be respecified repeatedly by reading data from WebGL, and used many times as the source for WebGL drawing and image specification commands.
    BufferUsage[BufferUsage["DYNAMIC_COPY"] = 35050] = "DYNAMIC_COPY";
    // The contents are intended to be specified once by reading data from WebGL, and used at most a few times as the source for WebGL drawing and image specification commands.
    BufferUsage[BufferUsage["STREAM_COPY"] = 35042] = "STREAM_COPY";
})(BufferUsage || (BufferUsage = {}));
/**
 * WebGL2 Shader Types.
 */
export var ShaderStage;
(function (ShaderStage) {
    ShaderStage[ShaderStage["VERTEX"] = 35633] = "VERTEX";
    ShaderStage[ShaderStage["FRAGMENT"] = 35632] = "FRAGMENT";
})(ShaderStage || (ShaderStage = {}));
