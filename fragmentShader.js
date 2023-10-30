'use strict'

// Get the WebGL context
const canvas = document.getElementById('canvas')
const gl = canvas.getContext('webgl2')

// Add mouse move event handlers to the canvas to update the cursor[] array.
const cursor = [0, 0]
canvas.addEventListener('mousemove', e => {
    cursor[0] = (e.offsetX / canvas.width) * 2 - 1
    cursor[1] = (e.offsetY / canvas.height) * -2 + 1
})

// Basic render loop manager
function setRenderLoop(callback) {
    function renderLoop(time) {
        if (setRenderLoop._callback !== null) {
            setRenderLoop._callback(time)
            requestAnimationFrame(renderLoop)
        }
    }
    setRenderLoop._callback = callback
    requestAnimationFrame(renderLoop)
}
setRenderLoop._callback = null

// Shader //////////////////////////////////////////////////////////////////////

const vertexShaderSource = `#version 300 es
    precision highp float;

    //inputs
	in vec2 a_pos; // attribute is deprecated in GLSL 3.0, use in instead
    in vec3 a_color; // a for attribute

    //outputs
    out vec3 f_color; // f for fragment

	void main() {
        f_color = a_color;
 		gl_Position = vec4(a_pos, 0.0, 1.0);
	}
`

const fragmentShaderSource = `#version 300 es
    // based on this tutorial: https://youtu.be/f4s1h2YETNY

    precision highp float; // fragment shader calculations require less precision

    //uniforms
    uniform float u_time;
    uniform vec2 u_resolution;

    //inputs
    in vec3 f_color;

    //outputs
    out vec4 FragColor; // glsl 3.0 has no build-in gl_FragColor

    vec3 palette( in float t) {
        vec3 a = vec3(0.728, 0.728, 0.678);
        vec3 b = vec3(0.078, 0.630, 0.502);
        vec3 c = vec3(-0.642, -0.742, -0.642);
        vec3 d = vec3(-2.663, 2.077, 1.817);

        return a + b*cos( 6.28318*(c*t+d) );
    }

	void main() {

        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y; // normalized pixel coordinates + the three calculations below condensed into one line.
        //uv = uv-.5; // makes the center of the screen (0, 0)
        //uv *= 2.0; // fits everything in the screen
        //uv.x *= u_resolution.x / u_resolution.y; // corrects aspect ratio
        vec2 uv0 = uv;
        vec3 finalColor = vec3(0.0);

        for (float i=0.0; i<5.0; i++){
            uv = fract(uv * 2.0) - .5; // only returns the decimals of the coordinates
            
            float d = length(uv) * exp(-length(uv0));
            
            vec3 col = palette(.1*length(uv0) + i*.4 * u_time*.4);
            
            d -= sin(u_time);
            //d = 1.0 - d; // inverts movement
            d = sin(10.0*d + 5.0*u_time)/15.0;
            d = abs(d);
            d = smoothstep(0.0, 0.1, d);
            d = pow(.01 / d, 1.2);
            
            finalColor += col * d;
        }

        FragColor = vec4(finalColor, 1.0);
    }
`

var vsSource = vertexShaderSource;
var fsSource = fragmentShaderSource;

// Create the Vertex Shader
const vertexShader = gl.createShader(gl.VERTEX_SHADER)
gl.shaderSource(vertexShader, vsSource)
gl.compileShader(vertexShader)

if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(vertexShader));
}

// Create the Fragment Shader
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
gl.shaderSource(fragmentShader, fsSource)
gl.compileShader(fragmentShader)

if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(fragmentShader));
}

// Link the two into a single Shader Program
const shaderProgram = gl.createProgram()
gl.attachShader(shaderProgram, vertexShader)
gl.attachShader(shaderProgram, fragmentShader)
gl.linkProgram(shaderProgram)
gl.useProgram(shaderProgram)

// Data ////////////////////////////////////////////////////////////////////////

const vertexAttributes = new Float32Array([ // 2D coordinates (x, y) and color (r, g, b)
    -1, -1, 1, 0, 1,
    +1, -1, 0, 1, 1,
    +1, +1, 1, 1, 0,
    -1, +1, 0, 1, 1,
]);

// Create the position buffer
const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, vertexAttributes, gl.STATIC_DRAW)

const faceIndices = new Uint16Array([
    0, 1, 2, // first triangle
    0, 2, 3, // second triangle
]);

// Create the index buffer
const indexBuffer = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, faceIndices, gl.STATIC_DRAW)

// Attribute Mapping ///////////////////////////////////////////////////////////

// Map the contents of the buffer to the vertex shader
const vertexAttribute = gl.getAttribLocation(shaderProgram, 'a_pos')
gl.enableVertexAttribArray(vertexAttribute)
gl.vertexAttribPointer(
    vertexAttribute,
    2,        // numComponents e.g 2 = (x, y) or 3 = (x, y, z) or 7 = (x, y, z, r, g, b, a)
    gl.FLOAT, // type
    false,    // normalize
    20,        // stride in bytes (numComponents * sizeof(type)) e.g. 8 = (2 * sizeof(float))
    0         // offset
)

const colorAttribute = gl.getAttribLocation(shaderProgram, 'a_color')
gl.enableVertexAttribArray(colorAttribute)
gl.vertexAttribPointer(
    colorAttribute,
    3,        // numComponents e.g 2 = (x, y) or 3 = (x, y, z) or 7 = (x, y, z, r, g, b, a)
    gl.FLOAT, // type
    false,    // normalize
    20,        // stride in bytes (numComponents * sizeof(type)) e.g. 8 = (2 * sizeof(float))
    8         // offset in bytes too
)


// Uniforms ////////////////////////////////////////////////////////////////////

const timeUniform = gl.getUniformLocation(shaderProgram, 'u_time')
const cursorUniform = gl.getUniformLocation(shaderProgram, 'u_cursor')
const resolutionUniform = gl.getUniformLocation(shaderProgram, 'u_resolution')

// Rendering ///////////////////////////////////////////////////////////////////

function RenderLoop(time) {
    gl.uniform1f(timeUniform, time / 5000)
    gl.uniform2f(cursorUniform, cursor[0], cursor[1])
    gl.uniform2f(resolutionUniform, canvas.width, canvas.height)

    // Draw the scene.
    gl.drawElements(
        gl.TRIANGLES,       // primitive type
        faceIndices.length, // vertex count
        gl.UNSIGNED_SHORT,  // type of indices
        0                   // offset
    )
}
setRenderLoop(RenderLoop)
