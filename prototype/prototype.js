////////////////////////////////////////////////////////////////////////////////
// START OF BOILERPLATE CODE ///////////////////////////////////////////////////

console.log('Hello, WebGL!');

// Get the WebGL context
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

// Add mouse move event handlers to the canvas to update the cursor[] array.
const cursor = [0, 0];
canvas.addEventListener('mousemove', (event) =>
{
    cursor[0] = (event.offsetX / canvas.width) * 2 - 1;
    cursor[1] = (event.offsetY / canvas.height) * -2 + 1;
});

function onMouseDrag(callback)
{
    canvas.addEventListener('pointerdown', () =>
    {
        const stopDrag = () =>
        {
            canvas.removeEventListener("pointermove", callback);
            canvas.removeEventListener("pointerup", stopDrag);
            canvas.removeEventListener("pointerleave", stopDrag);
        };

        canvas.addEventListener('pointermove', callback);
        canvas.addEventListener("pointerup", stopDrag, { once: true });
        canvas.addEventListener("pointerleave", stopDrag, { once: true });
    });
}

function onMouseWheel(callback)
{
    canvas.addEventListener('wheel', callback);
}

function onKeyDown(callback)
{
    canvas.addEventListener('keydown', callback);
}

function onKeyUp(callback)
{
    canvas.addEventListener('keyup', callback);
}

// Basic render loop manager.
function setRenderLoop(callback)
{
    function renderLoop(time)
    {
        if (setRenderLoop._callback !== null) {
            setRenderLoop._callback(time);
            requestAnimationFrame(renderLoop);
        }
    }
    setRenderLoop._callback = callback;
    requestAnimationFrame(renderLoop);
}
setRenderLoop._callback = null;

import glance from './js/glance.js';

// BOILERPLATE END
////////////////////////////////////////////////////////////////////////////////

const {
    vec3,
    mat3,
    mat4,
} = glance;


// =============================================================================
// Audio
// =============================================================================
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioGain = audioContext.createGain();
const audioAnalyser = audioContext.createAnalyser();
audioGain.connect(audioAnalyser);
audioAnalyser.connect(audioContext.destination);

const shootSoundClip = './audio/pew.wav';
const backgroundMusic = './audio/nierbackgroundmusic.wav';

function playSoundClip(audioclip, volume, speed, loop_p = false) {
    const audioSource = audioContext.createBufferSource();

    const audioRequest = new XMLHttpRequest();
    audioRequest.open('GET', audioclip, true);
    audioRequest.responseType = 'arraybuffer';

    audioRequest.onload = function() {
        audioContext.decodeAudioData(audioRequest.response, function(buffer) {
            audioSource.buffer = buffer;
            audioSource.loop = loop_p;

            // Adjust volume
            audioGain.gain.setValueAtTime(volume, audioContext.currentTime);
            

            // Adjust speed
            audioSource.playbackRate.setValueAtTime(speed, audioContext.currentTime);

            audioSource.connect(audioGain);
            audioSource.start(0);
        });
    };

    audioRequest.send();
}


// =============================================================================
// Shader Code
// =============================================================================


const phongVertexShader = `#version 300 es
    precision highp float;

    uniform mat4 u_modelMatrix;
    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;
    uniform mat3 u_normalMatrix;

    in vec3 a_pos;
    in vec3 a_normal;
    in vec2 a_texCoord;

    out vec3 f_worldPos;
    out vec3 f_normal;
    out vec2 f_texCoord;

    void main() {
        f_worldPos = vec3(u_modelMatrix * vec4(a_pos, 1.0));
        f_normal = u_normalMatrix * a_normal;
        f_texCoord = a_texCoord;
        gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_pos, 1.0);
    }
`;

const instancedPhongVertexShader = `#version 300 es
    precision highp float;

    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;

    in vec3 a_pos;
    in vec3 a_normal;
    in vec2 a_texCoord;
    in mat4 a_modelMatrix;
    in mat3 a_normalMatrix;

    out vec3 f_worldPos;
    out vec3 f_normal;
    out vec2 f_texCoord;

    void main() {
        f_worldPos = vec3(a_modelMatrix * vec4(a_pos, 1.0));
        f_normal = a_normalMatrix * a_normal;
        f_texCoord = a_texCoord;
        gl_Position = u_projectionMatrix * u_viewMatrix * a_modelMatrix * vec4(a_pos, 1.0);
    }
`;

const phongFragmentShader = `#version 300 es
    precision mediump float;

    uniform float u_ambient;
    uniform float u_specular;
    uniform float u_shininess;
    uniform vec3 u_lightPos;
    uniform vec3 u_lightColor;
    uniform vec3 u_viewPos;
    uniform sampler2D u_texAmbient;
    uniform sampler2D u_texDiffuse;
    uniform sampler2D u_texSpecular;

    in vec3 f_worldPos;
    in vec3 f_normal;
    in vec2 f_texCoord;

    out vec4 FragColor;

    void main() {

        // texture
        vec3 texAmbient = texture(u_texAmbient, f_texCoord).rgb;
        vec3 texDiffuse = texture(u_texDiffuse, f_texCoord).rgb;
        vec3 texSpecular = texture(u_texSpecular, f_texCoord).rgb;

        // ambient
        vec3 ambient = max(vec3(u_ambient), texAmbient) * texDiffuse;

        // diffuse
        vec3 normal = normalize(f_normal);
        vec3 lightDir = normalize(u_lightPos - f_worldPos);
        float diffuseIntensity = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diffuseIntensity * u_lightColor * texDiffuse;

        // specular
        vec3 viewDir = normalize(u_viewPos - f_worldPos);
        vec3 halfWay = normalize(lightDir + viewDir);
        float specularIntensity = pow(max(dot(normal, halfWay), 0.0), u_shininess);
        vec3 specular = (u_specular * specularIntensity) * texSpecular * u_lightColor;

        // color
        FragColor = vec4(ambient + diffuse + specular, 1.0);
    }
`;


const skyVertexShader = `#version 300 es
    precision highp float;

    uniform mat3 u_viewRotationMatrix;
    uniform mat4 u_projectionMatrix;

    in vec3 a_pos;

    out vec3 f_texCoord;

    void main() {
        // Use the local position of the vertex as texture coordinate.
        f_texCoord = a_pos;

        // By setting Z == W, we ensure that the vertex is projected onto the
        // far plane, which is exactly what we want for the background.
        vec4 ndcPos = u_projectionMatrix * inverse(mat4(u_viewRotationMatrix)) * vec4(a_pos, 1.0);
        gl_Position = ndcPos.xyww;
    }
`;


const skyFragmentShader = `#version 300 es
    precision mediump float;

    uniform samplerCube u_skybox;

    in vec3 f_texCoord;

    out vec4 FragColor;

    void main() {
        // The fragment color is simply the color of the skybox at the given
        // texture coordinate (local coordinate) of the fragment on the cube.
        FragColor = texture(u_skybox, f_texCoord);
    }
`;

const postVertexShader = `#version 300 es
    precision highp float;

    in vec2 a_pos;
    in vec2 a_texCoord;

    out vec2 f_texCoord;

    void main()
    {
        f_texCoord = a_texCoord;
        gl_Position = vec4(a_pos, 0.0, 1.0);
    }
`;

const postFragmentShader = `#version 300 es
    precision mediump float;

    uniform sampler2D u_texture;
    uniform float u_time;

    in vec2 f_texCoord;

    out vec4 FragColor;

    vec3 greyscale(vec3 color)
    {
        return vec3(0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b);
    }

    vec3 applyKernel(sampler2D image, vec2 uv, float kernel[9], float offset)
    {
        const vec2 offsets[9] = vec2[](
            vec2(-1,  1), // top-left
            vec2( 0,  1), // top-center
            vec2( 1,  1), // top-right
            vec2(-1,  0), // center-left
            vec2( 0,  0), // center-center
            vec2( 1,  0), // center-right
            vec2(-1, -1), // bottom-left
            vec2( 0, -1), // bottom-center
            vec2( 1, -1)  // bottom-right
        );

        vec3 color = vec3(0.0);
        for(int i = 0; i < 9; i++) {
            color += texture(image, uv + offsets[i] * offset).rgb * kernel[i];
        }
        return color;
    }

    const float sharpenKernel[9] = float[](
        -1., -1., -1.,
        -1.,  9., -1.,
        -1., -1., -1.
    );

    const float blurKernel[9] = float[](
        1./ 16., 2./16., 1./16.,
        2./ 16., 4./16., 2./16.,
        1./ 16., 2./16., 1./16.
    );

    const float grainStrength = 65.0;

    void main() {
        vec2 uv = gl_FragCoord.xy / vec2(512.0, 512.0);
        float x = (uv.x + 4.0 ) * (uv.y + 4.0 ) * (mod(u_time, 10000.));
        float grain = 1.0 - ((mod((mod(x, 13.0) + 1.0) * (mod(x, 123.0) + 1.0), 0.01)-0.005) * grainStrength);

        vec3 color = texture(u_texture, f_texCoord).rgb;
        vec3 blurred = applyKernel(u_texture, f_texCoord, blurKernel, 1.0 / 400.0);
        vec3 sharpened = applyKernel(u_texture, f_texCoord, sharpenKernel, 1.0 / 400.0);

        color = mix(color, sharpened, 1.0);
        color = mix(color, blurred, .7);
        color = greyscale(color);
        color = color * grain;

        FragColor = vec4(color, 1.0);
    }
`;


// =============================================================================
// Variables
// =============================================================================

const projectionMatrix = mat4.perspective(Math.PI / 4, 1, 0.1, 14);

const bulletScale = 0.05;
let bulletSpeed = 0.005;
let bulletCount = 20;

const enemyCount = 6;
const enemyScale = 0.3;
const enemyDistance = 5;
const enemySpeed = 0.0002;

const phongShader = glance.buildShaderProgram(gl, "phong-shader", phongVertexShader, phongFragmentShader, {
    u_ambient: 0.1,
    u_specular: 0.6,
    u_shininess: 64,
    u_lightPos: [0, 0, 5],
    u_lightColor: [1, 1, 1],
    u_projectionMatrix: projectionMatrix,
    u_texAmbient: 0,
    u_texDiffuse: 1,
    u_texSpecular: 2,
});

const instancedPhongShader = glance.buildShaderProgram(gl, "enemy-shader", instancedPhongVertexShader, phongFragmentShader, {
    u_ambient: 0.1,
    u_specular: 0.6,
    u_shininess: 64,
    u_lightPos: [0, 0, 5],
    u_lightColor: [1, 1, 1],
    u_projectionMatrix: projectionMatrix,
    u_texAmbient: 0,
    u_texDiffuse: 1,
    u_texSpecular: 2,
});

// Player ----------------------------------------------------------------------
const { attributes: playerAttr, indices: playerIdx } = await glance.loadObj("./obj/aircraft.obj");

const playerIBO = glance.createIndexBuffer(gl, playerIdx);

const playerABO = glance.createAttributeBuffer(gl, "player-abo", playerAttr, {
    a_pos: { size: 3, type: gl.FLOAT },
    a_texCoord: { size: 2, type: gl.FLOAT },
    a_normal: { size: 3, type: gl.FLOAT },
});

const playerVAO = glance.createVAO(
    gl,
    "player-vao",
    playerIBO,
    glance.buildAttributeMap(phongShader, playerABO),
);
const playerTextureAmbient = await glance.loadTextureNow(gl, "./img/bullets/Metal_ambient.jpg");
const playerTextureDiffuse = await glance.loadTextureNow(gl, "./img/bullets/Metal_color.jpg");
const playerTextureSpecular = await glance.loadTextureNow(gl, "./img/bullets/Metal_specular.png");

// Enemy -----------------------------------------------------------------------
const { attributes: enemyAttr, indices: enemyIdx } = await glance.loadObj("./obj/suzanne.obj");

const enemyIBO = glance.createIndexBuffer(gl, enemyIdx);

const enemyABO = glance.createAttributeBuffer(gl, "enemy-abo", enemyAttr, {
    a_pos: { size: 3, type: gl.FLOAT },
    a_texCoord: { size: 2, type: gl.FLOAT },
    a_normal: { size: 3, type: gl.FLOAT },
});

let enemyInstanceAttributes = new Float32Array(enemyCount * 25); // 16 + 9
const enemyIABO = glance.createAttributeBuffer(gl, "enemy-iabo", enemyInstanceAttributes, {
    a_modelMatrix: { size: 4, width: 4, type: gl.FLOAT, divisor: 1 },
    a_normalMatrix: { size: 3, width: 3, type: gl.FLOAT, divisor: 1 },
});

const enemyVAO = glance.createVAO(
    gl,
    "enemy-vao",
    enemyIBO,
    glance.combineAttributeMaps(
        glance.buildAttributeMap(instancedPhongShader, enemyABO),
        glance.buildAttributeMap(instancedPhongShader, enemyIABO),
    ),
);
const enemyTextureAmbient = await glance.loadTextureNow(gl, "./img/bullets/Metal_ambient.jpg");
const enemyTextureDiffuse = await glance.loadTextureNow(gl, "./img/bullets/Metal_color.jpg");
const enemyTextureSpecular = await glance.loadTextureNow(gl, "./img/bullets/Metal_color.jpg");

function updateEnemyInstanceAttributes(index, posX, posY, time) {
    const modelMatrix = mat4.multiply(
        mat4.fromRotation(index + enemySpeed * time, [0, 0, 1]),
            mat4.multiply(
                mat4.fromTranslation([-enemyDistance, 0, 0]),
                    mat4.multiply(
                            mat4.fromScaling(enemyScale),
                        mat4.multiply(
                            mat4.fromRotation(index + enemySpeed * time, [0, 0, -1]),
                            mat4.fromTranslation([0, 20, 0]),
                )
            )
        ),
    );

    const arrayOffset = index * 25;
    enemyInstanceAttributes.set(modelMatrix, arrayOffset);
    const normalMatrix = mat3.fromMat4(mat4.transpose(mat4.invert(modelMatrix)));
    enemyInstanceAttributes.set(normalMatrix, arrayOffset + 16);

    gl.bindBuffer(gl.ARRAY_BUFFER, enemyIABO.glObject);
    gl.bufferSubData(gl.ARRAY_BUFFER, arrayOffset * 4, enemyInstanceAttributes.subarray(arrayOffset, arrayOffset + 25));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}


// Bullets ---------------------------------------------------------------------

const bulletShader = glance.buildShaderProgram(gl, "bullet-shader", instancedPhongVertexShader, phongFragmentShader, {
    u_ambient: 0.1,
    u_specular: 0.6,
    u_shininess: 64,
    u_lightPos: [0, 0, 5],
    u_lightColor: [1, 1, 1],
    u_projectionMatrix: projectionMatrix,
    u_texAmbient: 0,
    u_texDiffuse: 1,
    u_texSpecular: 2,
});

const { attributes: bulletAttr, indices: bulletIdx } = await glance.loadObj("./obj/sphere.obj");

const bulletIBO = glance.createIndexBuffer(gl, bulletIdx);

const bulletABO = glance.createAttributeBuffer(gl, "bullet-abo", bulletAttr, {
    a_pos: { size: 3, type: gl.FLOAT },
    a_texCoord: { size: 2, type: gl.FLOAT },
    a_normal: { size: 3, type: gl.FLOAT },
});

let bulletInstanceAttributes = new Float32Array(bulletCount * 25); // 16 + 9
const bulletIABO = glance.createAttributeBuffer(gl, "bullet-iabo", bulletInstanceAttributes, {
    a_modelMatrix: { size: 4, width: 4, type: gl.FLOAT, divisor: 1 },
    a_normalMatrix: { size: 3, width: 3, type: gl.FLOAT, divisor: 1 },
});

const bulletVAO = glance.createVAO(
    gl,
    "bullet-vao",
    bulletIBO,
    glance.combineAttributeMaps(
        glance.buildAttributeMap(bulletShader, bulletABO),
        glance.buildAttributeMap(bulletShader, bulletIABO),
    ),
);
const bulletTextureAmbient = await glance.loadTextureNow(gl, "./img/bullets/Metal_ambient.jpg");
const bulletTextureDiffuse = await glance.loadTextureNow(gl, "./img/bullets/Metal_color.jpg");
const bulletTextureSpecular = await glance.loadTextureNow(gl, "./img/bullets/Metal_color.jpg");

function updateBulletInstanceAttributes(index, posX, posY) {
    const modelMatrix = mat4.multiply(
        mat4.fromTranslation([posX, posY, 0]),
        mat4.fromScaling(bulletScale),
    );

    const arrayOffset = index * 25;
    bulletInstanceAttributes.set(modelMatrix, arrayOffset);
    const normalMatrix = mat3.fromMat4(mat4.transpose(mat4.invert(modelMatrix)));
    bulletInstanceAttributes.set(normalMatrix, arrayOffset + 16);

    gl.bindBuffer(gl.ARRAY_BUFFER, bulletIABO.glObject);
    gl.bufferSubData(gl.ARRAY_BUFFER, arrayOffset * 4, bulletInstanceAttributes.subarray(arrayOffset, arrayOffset + 25));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}



// Earth -----------------------------------------------------------------------
const earthIBO = glance.createIndexBuffer(gl, glance.createSphereIndices(64, 64));

const earthABO = glance.createAttributeBuffer(gl, "earth-abo", glance.createSphereAttributes(.9, 64, 64), {
    a_pos: { size: 3, type: gl.FLOAT },
    a_normal: { size: 3, type: gl.FLOAT },
    a_texCoord: { size: 2, type: gl.FLOAT },
});

const earthVAO = glance.createVAO(
    gl,
    "earth-vao",
    earthIBO,
    glance.buildAttributeMap(phongShader, earthABO)
);
const earthTextureAmbient = await glance.loadTextureNow(gl, "./img/Earth_Ambient.avif");
const earthTextureDiffuse = await glance.loadTextureNow(gl, "./img/Earth_Diffuse.avif");
const earthTextureSpecular = await glance.loadTextureNow(gl, "./img/Earth_Specular.avif");


// Skybox ----------------------------------------------------------------------

const skyShader = glance.buildShaderProgram(gl, "sky-shader", skyVertexShader, skyFragmentShader, {
    u_projectionMatrix: projectionMatrix,
    u_skybox: 0,
});

const skyIBO = glance.createIndexBuffer(gl, glance.createSkyBoxIndices());

const skyABO = glance.createAttributeBuffer(gl, "sky-abo", glance.createSkyBoxAttributes(), {
    a_pos: { size: 3, type: gl.FLOAT },
});

const skyVAO = glance.createVAO(gl, "sky-vao", skyIBO, glance.buildAttributeMap(skyShader, skyABO));

const skyCubemap = await glance.loadCubemapNow(gl, "sky-texture", [
    "./img/Skybox_Right.avif",
    "./img/Skybox_Left.avif",
    "./img/Skybox_Top.avif",
    "./img/Skybox_Bottom.avif",
    "./img/Skybox_Front.avif",
    "./img/Skybox_Back.avif",
]);


// Post ------------------------------------------------------------------------
const postShader = glance.buildShaderProgram(gl, "post-shader", postVertexShader, postFragmentShader, {
    u_texture: 0,
});

const postIBO = glance.createIndexBuffer(gl, glance.createQuadIndices());

const postABO = glance.createAttributeBuffer(gl, "post-abo", glance.createQuadAttributes(), {
    a_pos: { size: 2, type: gl.FLOAT },
    a_texCoord: { size: 2, type: gl.FLOAT },
});

const postVAO = glance.createVAO(gl, "post-vao", postIBO, glance.buildAttributeMap(postShader, postABO));


// =============================================================================
// Framebuffer
// =============================================================================

const postColor = glance.createTexture(gl, "color-target", 512, 512, gl.TEXTURE_2D, null, {
    useAnisotropy: false,
    internalFormat: gl.RGBA8,
    levels: 1,
});

const postDepth = glance.createRenderbuffer(gl, "depth-target", 512, 512, gl.DEPTH_COMPONENT16);

const postFramebuffer = glance.createFramebuffer(gl, "framebuffer", postColor, postDepth);


// =============================================================================
// Draw Calls
// =============================================================================


// Scene State
let viewDist = 4.5;
let viewPan = 0;
let viewTilt = 0;
let panDelta = 0;
let tiltDelta = 0;
let shoot = false;
let shootDelayOver = true;
let flyingBullets = 0;
let postEffectOn = false;

const viewRotationMatrix = new glance.Cached(
    () =>
        mat4.multiply(
            mat4.fromRotation(viewPan * 0, [0, 1, 0]),
            mat4.fromRotation(viewTilt * 0, [1, 0, 0]),
        )
);

const viewMatrix = new glance.Cached(
    () => mat4.multiply(
        viewRotationMatrix.get(),
        mat4.fromTranslation([0, 0, viewDist]),
    ),
    [viewRotationMatrix]
);

const earthModelMatrix = new glance.TimeSensitive(
    (time) => mat4.multiply(mat4.identity(), mat4.fromRotation(0.0002 * time, [0, 1, 0]))
);


// Player State
let slow = .05;
let fast = .15;
let playerSpeed = fast;
let PlayerX = 0;
let PlayerY = 0;
let PlayerXDelta = 0;
let PlayerYDelta = 0;

const playerModelMatrix = new glance.TimeSensitive(
    (time) => mat4.multiply(
        mat4.fromScaling([.2, .2, .2]),
        mat4.multiply(
            mat4.fromTranslation([PlayerX, PlayerY, 0]),
            mat4.fromRotation(Math.PI * 1.5, [1, 0, 0]), // rotate to face forward
        ),
    )
);

// Player ----------------------------------------------------------------------
const playerDrawCall = glance.createDrawCall(
    gl,
    phongShader,
    playerVAO,
    {
        uniforms: {
            u_modelMatrix: (time) => playerModelMatrix.getAt(time),
            u_normalMatrix: (time) => mat3.fromMat4(mat4.transpose(mat4.invert(playerModelMatrix.getAt(time)))),
            u_viewMatrix: () => mat4.invert(viewMatrix.get()),
            u_viewPos: () => vec3.transformMat4(vec3.zero(), viewMatrix.get()),
        },
        textures: [
            [0, playerTextureAmbient],
            [1, playerTextureDiffuse],
            [2, playerTextureSpecular],
        ],
        cullFace: gl.BACK,
        depthTest: gl.LESS,
    }
);

// Enemy -----------------------------------------------------------------------
const enemyDrawCall = glance.createDrawCall(
    gl,
    instancedPhongShader,
    enemyVAO,
    {
        uniforms: {
            u_viewMatrix: () => mat4.invert(viewMatrix.get()),
            u_viewPos: () => vec3.transformMat4(vec3.zero(), viewMatrix.get()),
        },
        textures: [
            [0, enemyTextureAmbient],
            [1, enemyTextureDiffuse],
            [2, enemyTextureSpecular],
        ],
        cullFace: gl.BACK,
        depthTest: gl.LESS,
        instanceCount: enemyCount,
    }
);

// Bullets ---------------------------------------------------------------------
// bulletposition array
let bulletPosition = [
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
    [0, -10],
];

const bulletDrawCall = glance.createDrawCall(
    gl,
    bulletShader,
    bulletVAO,
    {
        uniforms: {
            u_viewMatrix: () => mat4.invert(viewMatrix.get()),
            u_viewPos: () => vec3.transformMat4(vec3.zero(), viewMatrix.get()),
        },
        textures: [
            [0, bulletTextureAmbient],
            [1, bulletTextureDiffuse],
            [2, bulletTextureSpecular],
        ],
        cullFace: gl.BACK,
        depthTest: gl.LESS,
        instanceCount: bulletCount,
    }
);

// Earth -----------------------------------------------------------------------
const earthDrawCall = glance.createDrawCall(
    gl,
    phongShader,
    earthVAO,
    {
        uniforms: {
            u_modelMatrix: (time) => earthModelMatrix.getAt(time),
            u_normalMatrix: (time) => mat3.fromMat4(mat4.transpose(mat4.invert(earthModelMatrix.getAt(time)))),
            u_viewMatrix: () => mat4.invert(viewMatrix.get()),
            u_viewPos: () => vec3.transformMat4(vec3.zero(), viewMatrix.get()),
        },
        textures: [
            [0, earthTextureAmbient],
            [1, earthTextureDiffuse],
            [2, earthTextureSpecular],
        ],
        cullFace: gl.BACK,
        depthTest: gl.LESS,
    }
);

// Skybox ----------------------------------------------------------------------
const skyDrawCall = glance.createDrawCall(
    gl,
    skyShader,
    skyVAO,
    {
        uniforms: {
            u_viewRotationMatrix: () => mat3.fromMat4(viewRotationMatrix.get()),
        },
        textures: [
            [0, skyCubemap],
        ],
        cullFace: gl.NONE,
        depthTest: gl.LEQUAL,
    }
);

// Post ------------------------------------------------------------------------
const postDrawCall = glance.createDrawCall(
    gl,
    postShader,
    postVAO,
    {
        uniforms: {
            u_time: (time) => time,
        },
        textures: [
            [0, postColor],
        ],
        cullFace: gl.NONE,
        depthTest: gl.NONE,
    }
);

const framebufferStack = new glance.FramebufferStack();


// =============================================================================
// System Integration
// =============================================================================

let lastTime = 0;
let deltas = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let deltaPtr = 0;


let start = true;
setRenderLoop((time) =>
{
    if (start)  {
        playSoundClip(backgroundMusic, .1, 1, true);
        start = false;
    }

    const deltaTime = time - lastTime;
    lastTime = time;
    deltas[deltaPtr] = deltaTime;
    deltaPtr = (deltaPtr + 1) % deltas.length;
    const avgDeltaTime = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    //if (deltaPtr == 0) console.log(avgDeltaTime);
    
    if (panDelta != 0 || tiltDelta != 0) {
        viewPan += panDelta * .02;
        viewTilt += tiltDelta * .02;
        viewRotationMatrix.setDirty();
    }

    if (PlayerXDelta != 0 || PlayerYDelta != 0) {
        PlayerX += PlayerXDelta * playerSpeed;
        PlayerY -= PlayerYDelta * playerSpeed;
        playerModelMatrix.setDirty();
    }

    for (let i = 0; i < bulletCount; i++) {
        // on start, set bullet position to player position
        if (flyingBullets == i){
            bulletPosition[i][0] = PlayerX / 5;
            bulletPosition[i][1] = PlayerY / 5 + .1;
        }
        if (shoot) {
            playSoundClip(shootSoundClip ,.1, 1);
            shoot = false;
            flyingBullets++;
            console.log(shoot);
            
        }
        if (flyingBullets > i || bulletPosition[i][1] > -10) {
            updateBulletInstanceAttributes(i, bulletPosition[i][0], bulletPosition[i][1]);
            console.log("flying bullets: ", flyingBullets);
            bulletPosition[i][1] += bulletSpeed * avgDeltaTime;
        }
        if (flyingBullets == bulletCount) {
            flyingBullets = 0;
        }
    }

    
    for (let i = 0; i < enemyCount; i++) {
        updateEnemyInstanceAttributes(i, 0, 0, time);
    }

    // TODO: change post effect and toggle it when something relevant happens but i need collision detection first
    if (postEffectOn) {framebufferStack.push(gl, postFramebuffer);}
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    glance.performDrawCall(gl, playerDrawCall, time);
    glance.performDrawCall(gl, enemyDrawCall, time);
    //glance.performDrawCall(gl, earthDrawCall, time);
    glance.performDrawCall(gl, bulletDrawCall, time);
    //glance.performDrawCall(gl, skyDrawCall, time);

    if (postEffectOn){
        framebufferStack.pop(gl);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        glance.performDrawCall(gl, postDrawCall, time);
    }
});


onKeyDown((e) =>
{
    if (e.key == "ArrowLeft") {
        panDelta = Math.max(panDelta - 1, -1);
        PlayerXDelta = Math.max(PlayerXDelta - 1, -1);
    }
    if (e.key == "ArrowRight") {
        panDelta = Math.min(panDelta + 1, 1);
        PlayerXDelta = Math.min(PlayerXDelta + 1, 1);
    }
    if (e.key == "ArrowUp") {
        tiltDelta = Math.max(tiltDelta - 1, -1);
        PlayerYDelta = Math.max(PlayerYDelta - 1, -1);
    }
    if (e.key == "ArrowDown") {
        tiltDelta = Math.min(tiltDelta + 1, 1);
        PlayerYDelta = Math.min(PlayerYDelta + 1, 1);
    }
    if (e.key == "Shift") {
        playerSpeed = slow;
        postEffectOn = true;
    }
    if ((e.key == "x" && shootDelayOver) || (e.key == "X" && shootDelayOver)){
        shoot = true;
        if (shootDelayOver){
            shootDelayOver = false;
            shootDelay();
        }
    }
    if(e.key == "p"){
        
    }
});

onKeyUp((e) =>
{
    if (e.key == "ArrowLeft") {
        panDelta = Math.min(panDelta + 1, 1);
        PlayerXDelta = Math.min(PlayerXDelta + 1, 1);
    }
    if (e.key == "ArrowRight") {
        panDelta = Math.max(panDelta - 1, -1);
        PlayerXDelta = Math.max(PlayerXDelta - 1, -1);
    }
    if (e.key == "ArrowUp") {
        tiltDelta = Math.min(tiltDelta + 1, 1);
        PlayerYDelta = Math.min(PlayerYDelta + 1, 1);
    }
    if (e.key == "ArrowDown") {
        tiltDelta = Math.max(tiltDelta - 1, -1);
        PlayerYDelta = Math.max(PlayerYDelta - 1, -1);
    }
    if (e.key == "Shift") {
        playerSpeed = fast;
        postEffectOn = false;
    }
    if(e.key == "p"){
        
    }
});

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
async function shootDelay() {
    console.log("shoot delay");
    await delay(100);
    shootDelayOver = true;
}
  
  