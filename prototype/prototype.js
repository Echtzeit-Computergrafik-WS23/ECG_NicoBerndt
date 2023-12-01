////////////////////////////////////////////////////////////////////////////////
// START OF BOILERPLATE CODE ///////////////////////////////////////////////////

console.log('Hello, WebGL!')

// Get the WebGL context
const canvas = document.getElementById('canvas')
const gl = canvas.getContext('webgl2')

// Add mouse move event handlers to the canvas to update the cursor[] array.
const cursor = [0, 0]
canvas.addEventListener('mousemove', (event) =>
{
    cursor[0] = (event.offsetX / canvas.width) * 2 - 1
    cursor[1] = (event.offsetY / canvas.height) * -2 + 1
})

function onMouseDrag(callback)
{
    canvas.addEventListener('pointerdown', () =>
    {
        const stopDrag = () =>
        {
            canvas.removeEventListener("pointermove", callback)
            canvas.removeEventListener("pointerup", stopDrag)
            canvas.removeEventListener("pointerleave", stopDrag)
        }

        canvas.addEventListener('pointermove', callback)
        canvas.addEventListener("pointerup", stopDrag, { once: true })
        canvas.addEventListener("pointerleave", stopDrag, { once: true })
    })
}

function onMouseWheel(callback)
{
    canvas.addEventListener('wheel', callback)
}

function onKeyDown(callback)
{
    canvas.addEventListener('keydown', callback)
}

function onKeyUp(callback)
{
    canvas.addEventListener('keyup', callback)
}

// Basic render loop manager.
function setRenderLoop(callback)
{
    function renderLoop(time)
    {
        if (setRenderLoop._callback !== null) {
            setRenderLoop._callback(time)
            requestAnimationFrame(renderLoop)
        }
    }
    setRenderLoop._callback = callback
    requestAnimationFrame(renderLoop)
}
setRenderLoop._callback = null

import glance from './js/glance.js'

// BOILERPLATE END
////////////////////////////////////////////////////////////////////////////////

const {
    vec3,
    mat3,
    mat4,
} = glance


// =============================================================================
// Shader Code
// =============================================================================


const worldVertexShader = `#version 300 es
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
`


const worldFragmentShader = `#version 300 es
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
`


const bulletVertexShader = `#version 300 es
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
`


const bulletFragmentShader = `#version 300 es
precision mediump float;

uniform float u_ambient;
uniform float u_specular;
uniform float u_shininess;
uniform vec3 u_lightPos;
uniform vec3 u_lightColor;
uniform vec3 u_viewPos;

in vec3 f_worldPos;
in vec3 f_normal;
in vec2 f_texCoord;

out vec4 FragColor;

void main() {

    // ambient
    vec3 ambient = u_ambient * vec3(1.0);

    // diffuse
    vec3 normal = normalize(f_normal);
    vec3 lightDir = normalize(u_lightPos - f_worldPos);
    float diffuseIntensity = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diffuseIntensity * u_lightColor;

    // specular
    vec3 viewDir = normalize(u_viewPos - f_worldPos);
    vec3 halfWay = normalize(lightDir + viewDir);
    float specularIntensity = pow(max(dot(normal, halfWay), 0.0), u_shininess);
    vec3 specular = (u_specular * specularIntensity) * u_lightColor;

    // color
    FragColor = vec4(ambient + diffuse + specular, 1.0);
}
`


// =============================================================================
// Data
// =============================================================================


const projectionMatrix = mat4.perspective(Math.PI / 4, 1, 0.1, 14)
//const projectionMatrix = mat4.ortho(-5, 5, -5, 5, 0.1, 14)


// The world
const worldShader = glance.buildShaderProgram(gl, "world-shader", worldVertexShader, worldFragmentShader, {
    u_ambient: 0.1,
    u_specular: 0.6,
    u_shininess: 64,
    u_lightPos: [0, 0, 5],
    u_lightColor: [1, 1, 1],
    u_projectionMatrix: projectionMatrix,
    u_texAmbient: 0,
    u_texDiffuse: 1,
    u_texSpecular: 2,
})

const {attributes: sphereAttr, indices: sphereIdx} = await glance.loadObj("./obj/plane.obj")

const worldIBO = glance.createIndexBuffer(gl, sphereIdx)

const worldABO = glance.createAttributeBuffer(gl, "world-abo", sphereAttr, {
    a_pos: { size: 3, type: gl.FLOAT },
    a_texCoord: { size: 2, type: gl.FLOAT },
    a_normal: { size: 3, type: gl.FLOAT },
})

const worldVAO = glance.createVAO(
    gl,
    "world-vao",
    worldIBO,
    glance.buildAttributeMap(worldShader, worldABO, ["a_pos", "a_normal", "a_texCoord"])
)
// TODO: make matcap shading for skyship
//
//
//
const worldTextureAmbient = glance.loadTexture(gl, "./img/marisaSprite.png")
const worldTextureDiffuse = glance.loadTexture(gl, "./img/marisaSprite.png")
const worldTextureSpecular = glance.loadTexture(gl, "./img/marisaSprite.png")


// The bullet
const bulletShader = glance.buildShaderProgram(gl, "bullet-shader", bulletVertexShader, bulletFragmentShader, {
    u_ambient: 0.1,
    u_specular: 0.6,
    u_shininess: 64,
    u_lightPos: [0, 0, 5],
    u_lightColor: [1, 1, 1],
    u_projectionMatrix: projectionMatrix,
})

const {attributes: bulletAttr, indices: bulletIdx} = await glance.loadObj("./obj/sphere.obj")

const bulletIBO = glance.createIndexBuffer(gl, bulletIdx)

const bulletABO = glance.createAttributeBuffer(gl, "bullet-abo", bulletAttr, {
    a_pos: { size: 3, type: gl.FLOAT },
    a_texCoord: { size: 2, type: gl.FLOAT },
    a_normal: { size: 3, type: gl.FLOAT },
})

const bulletVAO = glance.createVAO(
    gl, 
    "bullet-vao", 
    bulletIBO,
    glance.buildAttributeMap(bulletShader, bulletABO, ["a_pos", "a_normal", "a_texCoord"])
)



// =============================================================================
// Draw Calls
// =============================================================================


// Scene State
let viewDist = 13
let horizontalMovement = 0
let verticalMovement = 0
let horizontalDelta = 0
let verticalDelta = 0

let playerFastVelocity = 0.1
let playerSlowVelocity = 0.04
let playerVeloctity = playerFastVelocity
let drawBullet = false

let playerposition = vec3.zero()
let bulletTransformX = playerposition[0]
let bulletTransformY = playerposition[1]
let bulletTransformZ = playerposition[2]


const worldDrawCall = glance.createDrawCall(
    gl,
    worldShader,
    worldVAO,
    {
        // uniform update callbacks
        
        u_modelMatrix: (time) => 
        mat4.multiply(
            mat4.identity(), 
            mat4.fromRotation(Math.PI, [0, 0, 1])),
        u_normalMatrix: (time) => 
        mat3.fromMat4(
            mat4.transpose(
                mat4.invert(
                    mat4.multiply(
                        mat4.identity(), 
                        mat4.fromRotation(Math.PI, [0, 0, 1]))))),
        
        u_viewMatrix: (time) =>
        mat4.invert(
            mat4.multiply(
                mat4.identity(),
                mat4.fromTranslation([-horizontalMovement, verticalMovement, viewDist]))),
        u_viewPos: (time) =>
        playerposition = vec3.transformMat4(
            vec3.zero(),
            mat4.multiply(
                mat4.identity(),
                mat4.fromTranslation([-horizontalMovement, verticalMovement, viewDist]))),
        
    },
    [
        // texture bindings
        [0, worldTextureAmbient],
        [1, worldTextureDiffuse],
        [2, worldTextureSpecular],
    ]
)


// Bullet array
let bullets = [];
let bulletDrawCall;
function createBulletDrawCall() {
    return glance.createDrawCall(
        gl,
        bulletShader,
        bulletVAO,
        {
            // uniform update callbacks
            u_viewMatrix: (time) =>
                mat4.invert(
                    mat4.multiply(
                        mat4.multiply(
                            mat4.identity(),
                            mat4.fromScaling([1.5, 1.5, 1.5])),
                            mat4.fromTranslation([bulletTransformX, bulletTransformY, bulletTransformZ]))),
            u_viewPos: (time) =>
                vec3.transformMat4(
                    vec3.zero(),
                    mat4.multiply(
                        mat4.identity(),
                        mat4.fromTranslation([bulletTransformX, bulletTransformY, bulletTransformZ]))),
        },
        [
            // texture bindings
        ]
    );
}

// Initial bullet draw call
bulletDrawCall = createBulletDrawCall();


// =============================================================================
// System Integration
// =============================================================================

let timeStamp = 0
let b = true
let counter = 0
let newX = 0
let newY = 0

function createBullet() {
    return {
        drawCall: createBulletDrawCall(),
        transformX: playerposition[0],
        transformY: playerposition[1] - 1,
        transformZ: viewDist,
    };
}

function updateBullet(bullet) {
    bullet.transformY -= 0.05; // Update bullet position
    bullet.drawCall = createBulletDrawCall(bullet);
}

setRenderLoop((time) =>
{
    if (b){
        timeStamp = time
        newX = playerposition[0]
        newY = playerposition[1]
        b = false
    }
    counter = time - timeStamp

    // One-time WebGL setup
    // gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    horizontalMovement += horizontalDelta * playerVeloctity
    verticalMovement += verticalDelta * playerVeloctity

    glance.performDrawCall(gl, worldDrawCall, time)

    // Update and draw each bullet
    for (const bullet of bullets) {
        updateBullet(bullet);
        glance.performDrawCall(gl, bullet.drawCall, time);
    }

    if (drawBullet) {
        // Create a new bullet only when 'x' is pressed
        const newBullet = createBullet();
        bullets.push(newBullet);
        drawBullet = false;
    }

    // Remove bullets that are out of view
    bullets = bullets.filter((bullet) => bullet.transformY > -5);
})

onKeyDown((e) =>
{
    if (e.key == "ArrowLeft") {
        horizontalDelta = Math.max(horizontalDelta - 1, -1)
    }
    if (e.key == "ArrowRight") {
        horizontalDelta = Math.min(horizontalDelta + 1, 1)
    }
    if (e.key == "ArrowUp") {
        verticalDelta = Math.max(verticalDelta - 1, -1)
    }
    if (e.key == "ArrowDown") {
        verticalDelta = Math.min(verticalDelta + 1, 1)
    }

    if (e.key == "Shift") {
        playerVeloctity = playerSlowVelocity
    }

    if (e.key == "x") {
        drawBullet = true
    }
})

onKeyUp((e) =>
{
    if (e.key == "ArrowLeft") {
        horizontalDelta = Math.min(horizontalDelta + 1, 1)
    }
    if (e.key == "ArrowRight") {
        horizontalDelta = Math.max(horizontalDelta - 1, -1)
    }
    if (e.key == "ArrowUp") {
        verticalDelta = Math.min(verticalDelta + 1, 1)
    }
    if (e.key == "ArrowDown") {
        verticalDelta = Math.max(verticalDelta - 1, -1)
    }

    if (e.key == "Shift") {
        playerVeloctity = playerFastVelocity
    }

    if (e.key == "x") {
        drawBullet = false
        console.log(bullets.length)
    }
})

