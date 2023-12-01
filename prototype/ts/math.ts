export
{
    // Objects
    vec2,
    vec3,
    mat3,
    mat4,

    // Functions
    clamp,
    degrees,
    hex,
    isPowerOf2,
    radians,
    range,

    // Module state
    epsilon,

    // Types
    type Vec2,
    type Vec3,
    type Mat3,
    type Mat4,
}


// =============================================================================
// Public types
// =============================================================================

// TODO: Honestly, the threejs math types are more intuitive.
//  They use proper classes, getters etc. and offer functions like
//  Out.add(a, b) which writes to out instead of a. Guess if you want to do that
//  in place, you can still write Out.add(Out, b) and have the same effect

type Vec2 = [number, number]
type Vec3 = [number, number, number]
// type vec4 = [number, number, number, number]
type Mat2 = [number, ...number[]] & { length: 4 }
type Mat3 = [number, ...number[]] & { length: 9 }
type Mat4 = [number, ...number[]] & { length: 16 }


// =============================================================================
// Module state
// =============================================================================


const epsilon: number = 0.000001


// =============================================================================
// Module functions
// =============================================================================


/** Radians from degrees.
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function radians(degrees: number): number { return degrees * Math.PI / 180 }


/** Degrees from radians.
 * @param radians Angle in radians
 * @returns Angle in degrees
 */
function degrees(radians: number): number { return radians * 180 / Math.PI }


/** Clamp a value between a minimum and maximum.
 * @param x Value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
function clamp(x: number, min: number, max: number): number { return Math.min(Math.max(x, min), max) }


/** Python-like integer range function.
 * @param start Start value (or stop if stop is undefined).
 * @param stop Stop value
 * @param step Step per iteration. Defaults to 1.
 * @returns Iterable range object
 */
function* range(start: number, stop?: number, step: number = 1): IterableIterator<number>
{
    start = Math.round(start)
    if (stop === undefined) {
        stop = start
        start = 0
    } else {
        stop = Math.round(stop)
    }
    step = Math.max(1, Math.round(Math.abs(step)))
    const sign: number = Math.sign(stop - start) || 1
    while (Math.sign(stop - start) !== -sign) { // sign matches or is zero
        yield start
        start += step * sign
    }
}


/** Convert a number to a hexadecimal string.
 * @param value Number to convert
 * @returns Hexadecimal string
 */
function hex(value: number): string
{
    return value.toString(16).padStart(2, '0')
}


/** Returns true if the given value is a power of 2. */
function isPowerOf2(value: number): boolean
{
    return Number.isInteger(value) && (value & (value - 1)) === 0
}


// =============================================================================
// Vec2
// =============================================================================


const vec2 = {
    zero: (): Vec2 => [0, 0],
    one: (): Vec2 => [1, 1],
    random: (scale: number = 1): Vec2 => vec2.scale(vec2.normalize([Math.random(), Math.random()]), scale),
    create: (x: number = 0, y: number = 0): Vec2 => [x, y],
    clone: (v: Vec2): Vec2 => [v[0], v[1]],
    copy: (out: Vec2, v: Vec2): Vec2 => { out[0] = v[0]; out[1] = v[1]; return out },
    add: (out: Vec2, v: Vec2): Vec2 => { out[0] += v[0]; out[1] += v[1]; return out },
    subtract: (out: Vec2, v: Vec2): Vec2 => { out[0] -= v[0]; out[1] -= v[1]; return out },
    multiply: (out: Vec2, v: Vec2): Vec2 => { out[0] *= v[0]; out[1] *= v[1]; return out },
    divide: (out: Vec2, v: Vec2): Vec2 => { out[0] /= v[0]; out[1] /= v[1]; return out },
    scale: (out: Vec2, s: number): Vec2 => { out[0] *= s, out[1] *= s; return out },
    dot: (a: Vec2, b: Vec2): number => a[0] * b[0] + a[1] * b[1],
    cross: (a: Vec2, b: Vec2): number => a[0] * b[1] - a[1] * b[0],
    lengthSquared: (v: Vec2): number => vec2.dot(v, v),
    length: (v: Vec2): number => Math.hypot(v[0], v[1]),
    normalize: (out: Vec2): Vec2 => vec2.scale(out, 1 / vec2.length(out)),
    distanceSquared: (a: Vec2, b: Vec2): number => vec2.lengthSquared(vec2.subtract(vec2.clone(a), b)),
    distance: (a: Vec2, b: Vec2): number => vec2.length(vec2.subtract(vec2.clone(a), b)),
    lerp: (out: Vec2, v: Vec2, t: number): Vec2 => vec2.add(vec2.scale(out, 1 - t), vec2.scale(vec2.clone(v), t)),
    ceil: (out: Vec2): Vec2 => { out[0] = Math.ceil(out[0]); out[1] = Math.ceil(out[1]); return out },
    floor: (out: Vec2): Vec2 => { out[0] = Math.floor(out[0]); out[1] = Math.floor(out[1]); return out },
    round: (out: Vec2): Vec2 => { out[0] = Math.round(out[0]); out[1] = Math.round(out[1]); return out },
    min: (out: Vec2, b: Vec2): Vec2 => { out[0] = Math.min(out[0], b[0]); out[1] = Math.min(out[1], b[1]); return out },
    max: (out: Vec2, b: Vec2): Vec2 => { out[0] = Math.max(out[0], b[0]); out[1] = Math.max(out[1], b[1]); return out },
    clamp: (out: Vec2, min: Vec2, max: Vec2): Vec2 => vec2.min(vec2.max(out, min), max),
    negate: (out: Vec2): Vec2 => vec2.scale(out, -1),
    inverse: (out: Vec2): Vec2 => { out[0] = 1 / out[0]; out[1] = 1 / out[1]; return out },
    angle: (v: Vec2): number => Math.atan2(v[1], v[0]),
    rotate: (out: Vec2, angle: number): Vec2 =>
    {
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        const x = out[0]
        const y = out[1]
        out[0] = x * c - y * s
        out[1] = x * s + y * c
        return out
    },
    transformMat2: (v: Vec2, m: Mat2): Vec2 => [v[0] * m[0] + v[1] * m[2], v[0] * m[1] + v[1] * m[3]],
    equals: (a: Vec2, b: Vec2): boolean => Math.abs(a[0] - b[0]) <= epsilon && Math.abs(a[1] - b[1]) <= epsilon,
}
Object.freeze(vec2)


// =============================================================================
// Vec3
// =============================================================================


const vec3 = {
    zero: (): Vec3 => [0, 0, 0],
    one: (): Vec3 => [1, 1, 1],
    random: (scale: number = 1): Vec3 => vec3.scale(vec3.normalize([Math.random(), Math.random(), Math.random()]), scale),
    create: (x: number = 0, y: number = 0, z: number = 0): Vec3 => [x, y, z],
    clone: (v: Vec3): Vec3 => [v[0], v[1], v[2]],
    copy: (out: Vec3, v: Vec3): Vec3 => { out[0] = v[0]; out[1] = v[1]; out[2] = v[2]; return out },
    add: (out: Vec3, v: Vec3): Vec3 => { out[0] += v[0]; out[1] += v[1]; out[2] += v[2]; return out },
    subtract: (out: Vec3, v: Vec3): Vec3 => { out[0] -= v[0]; out[1] -= v[1]; out[2] -= v[2]; return out },
    multiply: (out: Vec3, v: Vec3): Vec3 => { out[0] *= v[0]; out[1] *= v[1]; out[2] *= v[2]; return out },
    divide: (out: Vec3, v: Vec3): Vec3 => { out[0] /= v[0]; out[1] /= v[1]; out[2] /= v[2]; return out },
    scale: (out: Vec3, s: number): Vec3 => { out[0] *= s; out[1] *= s; out[2] *= s; return out },
    dot: (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (out: Vec3, b: Vec3): Vec3 =>
    {
        const ax = out[0], ay = out[1], az = out[2]
        const bx = b[0], by = b[1], bz = b[2]
        out[0] = ay * bz - az * by
        out[1] = az * bx - ax * bz
        out[2] = ax * by - ay * bx
        return out
    },
    lengthSquared: (v: Vec3): number => vec3.dot(v, v),
    length: (v: Vec3): number => Math.hypot(v[0], v[1], v[2]),
    normalize: (out: Vec3): Vec3 =>
    {
        const len = vec3.length(out)
        return len ? vec3.scale(out, 1 / len) : out
    },
    distanceSquared: (a: Vec3, b: Vec3): number => vec3.lengthSquared(vec3.subtract(vec3.clone(a), b)),
    distance: (a: Vec3, b: Vec3): number => vec3.length(vec3.subtract(vec3.clone(a), b)),
    lerp: (out: Vec3, v: Vec3, t: number): Vec3 => vec3.add(vec3.scale(out, 1 - t), vec3.scale(vec3.clone(v), t)),
    ceil: (out: Vec3): Vec3 => { out[0] = Math.ceil(out[0]); out[1] = Math.ceil(out[1]); out[2] = Math.ceil(out[2]); return out },
    floor: (out: Vec3): Vec3 => { out[0] = Math.floor(out[0]); out[1] = Math.floor(out[1]); out[2] = Math.floor(out[2]); return out },
    round: (out: Vec3): Vec3 => { out[0] = Math.round(out[0]); out[1] = Math.round(out[1]); out[2] = Math.round(out[2]); return out },
    min: (out: Vec3, v: Vec3): Vec3 => { out[0] = Math.min(out[0], v[0]); out[1] = Math.min(out[1], v[1]); out[2] = Math.min(out[2], v[2]); return out },
    max: (out: Vec3, v: Vec3): Vec3 => { out[0] = Math.max(out[0], v[0]); out[1] = Math.max(out[1], v[1]); out[2] = Math.max(out[2], v[2]); return out },
    clamp: (out: Vec3, min: Vec3, max: Vec3): Vec3 => vec3.min(vec3.max(out, min), max),
    negate: (out: Vec3): Vec3 => vec3.scale(out, -1),
    inverse: (out: Vec3): Vec3 => { out[0] = 1 / out[0]; out[1] = 1 / out[1]; out[2] = 1 / out[2]; return out },
    angle: (a: Vec3, b: Vec3): number => Math.acos(vec3.dot(a, b) / (vec3.length(a) * vec3.length(b))),
    rotateX: (out: Vec3, angle: number): Vec3 =>
    {
        const y = out[1], z = out[2]
        const c = Math.cos(angle), s = Math.sin(angle)
        out[1] = y * c - z * s
        out[2] = y * s + z * c
        return out
    },
    rotateY: (out: Vec3, angle: number): Vec3 =>
    {
        const x = out[0], z = out[2]
        const c = Math.cos(angle), s = Math.sin(angle)
        out[0] = x * c + z * s
        out[2] = -x * s + z * c
        return out
    },
    rotateZ: (out: Vec3, angle: number): Vec3 =>
    {
        const x = out[0], y = out[1]
        const c = Math.cos(angle), s = Math.sin(angle)
        out[0] = x * c - y * s
        out[1] = x * s + y * c
        return out
    },
    transformMat3: (out: Vec3, m: Mat3): Vec3 =>
    {
        const x = out[0], y = out[1], z = out[2]
        out[0] = x * m[0] + y * m[3] + z * m[6]
        out[1] = x * m[1] + y * m[4] + z * m[7]
        out[2] = x * m[2] + y * m[5] + z * m[8]
        return out
    },
    transformMat4: (out: Vec3, m: Mat4): Vec3 =>
    {
        const x = out[0], y = out[1], z = out[2]
        out[0] = x * m[0] + y * m[4] + z * m[8] + m[12]
        out[1] = x * m[1] + y * m[5] + z * m[9] + m[13]
        out[2] = x * m[2] + y * m[6] + z * m[10] + m[14]
        return out
    },
    equals: (a: Vec3, b: Vec3): boolean => Math.abs(a[0] - b[0]) <= epsilon && Math.abs(a[1] - b[1]) <= epsilon && Math.abs(a[2] - b[2]) <= epsilon,
}
Object.freeze(vec3)


// =============================================================================
// Mat3
// =============================================================================


const mat3 = {
    identity: (): Mat3 => ([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1]),
    clone: (m: Mat3): Mat3 => ([
        m[0], m[1], m[2],
        m[3], m[4], m[5],
        m[6], m[7], m[8]]),
    fromMat2: (m: Mat2): Mat3 => ([
        m[0], m[1], 0,
        m[2], m[3], 0,
        0, 0, 1]),
    fromMat4: (m: Mat4): Mat3 => ([
        m[0], m[1], m[2],
        m[4], m[5], m[6],
        m[8], m[9], m[10]]),
    copy: (out: Mat3, m: Mat3): Mat3 =>
    {
        for (let i = 0; i < 9; i++) out[i] = m[i]
        return out
    },
    transpose: (out: Mat3): Mat3 =>
    {
        const a01 = out[1], a02 = out[2], a12 = out[5]
        out[1] = out[3]
        out[2] = out[6]
        out[3] = a01
        out[5] = out[7]
        out[6] = a02
        out[7] = a12
        return out
    },
    invert: (out: Mat3): Mat3 | null =>
    {
        const a00 = out[0], a01 = out[1], a02 = out[2]
        const a10 = out[3], a11 = out[4], a12 = out[5]
        const a20 = out[6], a21 = out[7], a22 = out[8]
        const b01 = a22 * a11 - a12 * a21
        const b11 = -a22 * a10 + a12 * a20
        const b21 = a21 * a10 - a11 * a20
        let det = a00 * b01 + a01 * b11 + a02 * b21
        if (!det) {
            return null
        }
        det = 1 / det
        out[0] = b01 * det
        out[1] = (-a22 * a01 + a02 * a21) * det
        out[2] = (a12 * a01 - a02 * a11) * det
        out[3] = b11 * det
        out[4] = (a22 * a00 - a02 * a20) * det
        out[5] = (-a12 * a00 + a02 * a10) * det
        out[6] = b21 * det
        out[7] = (-a21 * a00 + a01 * a20) * det
        out[8] = (a11 * a00 - a01 * a10) * det
        return out
    },
    adjoint: (out: Mat3): Mat3 =>
    {
        const a00 = out[0], a01 = out[1], a02 = out[2]
        const a10 = out[3], a11 = out[4], a12 = out[5]
        const a20 = out[6], a21 = out[7], a22 = out[8]
        out[0] = a11 * a22 - a12 * a21
        out[1] = a02 * a21 - a01 * a22
        out[2] = a01 * a12 - a02 * a11
        out[3] = a12 * a20 - a10 * a22
        out[4] = a00 * a22 - a02 * a20
        out[5] = a02 * a10 - a00 * a12
        out[6] = a10 * a21 - a11 * a20
        out[7] = a01 * a20 - a00 * a21
        out[8] = a00 * a11 - a01 * a10
        return out
    },
    determinant: (m: Mat3): number =>
    {
        const a10 = m[3], a11 = m[4], a12 = m[5]
        const a20 = m[6], a21 = m[7], a22 = m[8]
        return m[0] * (a22 * a11 - a12 * a21) + m[1] * (-a22 * a10 + a12 * a20) + m[2] * (a21 * a10 - a11 * a20)
    },
    multiply: (out: Mat3, m: Mat3): Mat3 =>
    {
        const a00 = out[0], a01 = out[1], a02 = out[2]
        const a10 = out[3], a11 = out[4], a12 = out[5]
        const a20 = out[6], a21 = out[7], a22 = out[8]
        let b0 = m[0], b1 = m[1], b2 = m[2]
        out[0] = b0 * a00 + b1 * a10 + b2 * a20
        out[1] = b0 * a01 + b1 * a11 + b2 * a21
        out[2] = b0 * a02 + b1 * a12 + b2 * a22
        b0 = m[3], b1 = m[4], b1 = m[5]
        out[3] = b0 * a00 + b1 * a10 + b2 * a20
        out[4] = b0 * a01 + b1 * a11 + b2 * a21
        out[5] = b0 * a02 + b1 * a12 + b2 * a22
        b0 = m[6], b1 = m[7], b2 = m[8]
        out[6] = b0 * a00 + b1 * a10 + b2 * a20
        out[7] = b0 * a01 + b1 * a11 + b2 * a21
        out[8] = b0 * a02 + b1 * a12 + b2 * a22
        return out
    },
    translate: (out: Mat3, v: Vec2): Mat3 =>
    {
        const a00 = out[0], a01 = out[1], a02 = out[2]
        const a10 = out[3], a11 = out[4], a12 = out[5]
        const x = v[0], y = v[1]
        out[0] = a00
        out[1] = a01
        out[2] = a02
        out[3] = a10
        out[4] = a11
        out[5] = a12
        out[6] = x * a00 + y * a10 + out[6]
        out[7] = x * a01 + y * a11 + out[7]
        out[8] = x * a02 + y * a12 + out[8]
        return out
    },
    rotate: (out: Mat3, rad: number): Mat3 =>
    {
        const a00 = out[0], a01 = out[1], a02 = out[2]
        const a10 = out[3], a11 = out[4], a12 = out[5]
        const s = Math.sin(rad), c = Math.cos(rad)
        out[0] = c * a00 + s * a10
        out[1] = c * a01 + s * a11
        out[2] = c * a02 + s * a12
        out[3] = c * a10 - s * a00
        out[4] = c * a11 - s * a01
        out[5] = c * a12 - s * a02
        return out
    },
    scale: (out: Mat3, v: Vec2): Mat3 =>
    {
        const x = v[0], y = v[1]
        out[0] *= x
        out[1] *= x
        out[2] *= x
        out[3] *= y
        out[4] *= y
        out[5] *= y
        return out
    },
    fromTranslation: (v: Vec2): Mat3 =>
    {
        return [
            1, 0, 0,
            0, 1, 0,
            v[0], v[1], 1]
    },
    fromRotation: (rad: number): Mat3 =>
    {
        const s = Math.sin(rad), c = Math.cos(rad)
        return [
            c, s, 0,
            -s, c, 0,
            0, 0, 1]
    },
    fromScaling: (v: Vec2): Mat3 =>
    {
        return [
            v[0], 0, 0,
            0, v[1], 0,
            0, 0, 1]
    },
    normalFromMat4: (m: Mat4): Mat3 | null =>
    {
        const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3]
        const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7]
        const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11]
        const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15]
        const b00 = a00 * a11 - a01 * a10
        const b01 = a00 * a12 - a02 * a10
        const b02 = a00 * a13 - a03 * a10
        const b03 = a01 * a12 - a02 * a11
        const b04 = a01 * a13 - a03 * a11
        const b05 = a02 * a13 - a03 * a12
        const b06 = a20 * a31 - a21 * a30
        const b07 = a20 * a32 - a22 * a30
        const b08 = a20 * a33 - a23 * a30
        const b09 = a21 * a32 - a22 * a31
        const b10 = a21 * a33 - a23 * a31
        const b11 = a22 * a33 - a23 * a32
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
        if (!det) {
            return null
        }
        det = 1.0 / det
        return [
            (a11 * b11 - a12 * b10 + a13 * b09) * det,
            (a12 * b08 - a10 * b11 - a13 * b07) * det,
            (a10 * b10 - a11 * b08 + a13 * b06) * det,
            (a02 * b10 - a01 * b11 - a03 * b09) * det,
            (a00 * b11 - a02 * b08 + a03 * b07) * det,
            (a01 * b08 - a00 * b10 - a03 * b06) * det,
            (a31 * b05 - a32 * b04 + a33 * b03) * det,
            (a32 * b02 - a30 * b05 - a33 * b01) * det,
            (a30 * b04 - a31 * b02 + a33 * b00) * det]
    },
    projection: (width: number, height: number): Mat3 =>
    {
        return [
            2 / width, 0, 0,
            0, -2 / height, 0,
            -1, 1, 1]
    },
    equals: (a: Mat3, b: Mat3): boolean =>
    {
        for (let i = 0; i < 9; i++) {
            if (Math.abs(a[i] - b[i]) > epsilon) {
                return false
            }
        }
        return true
    },
}
Object.freeze(mat3)


// =============================================================================
// Mat4
// =============================================================================


const mat4 = {
    identity: (): Mat4 => ([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1]),
    clone: (m: Mat4): Mat4 => ([
        m[0], m[1], m[2], m[3],
        m[4], m[5], m[6], m[7],
        m[8], m[9], m[10], m[11],
        m[12], m[13], m[14], m[15]]),
    copy: (out: Mat4, m: Mat4): Mat4 =>
    {
        for (let i = 0; i < 16; i++) out[i] = m[i]
        return out
    },
    transpose: (out: Mat4): Mat4 =>
    {
        const a01 = out[1], a02 = out[2], a03 = out[3]
        const a12 = out[6], a13 = out[7]
        const a23 = out[11]
        out[1] = out[4]
        out[2] = out[8]
        out[3] = out[12]
        out[4] = a01
        out[6] = out[9]
        out[7] = out[13]
        out[8] = a02
        out[9] = a12
        out[11] = out[14]
        out[12] = a03
        out[13] = a13
        out[14] = a23
        return out
    },
    invert: (out: Mat4): Mat4 | null =>
    {
        const a00 = out[0], a01 = out[1], a02 = out[2], a03 = out[3]
        const a10 = out[4], a11 = out[5], a12 = out[6], a13 = out[7]
        const a20 = out[8], a21 = out[9], a22 = out[10], a23 = out[11]
        const a30 = out[12], a31 = out[13], a32 = out[14], a33 = out[15]
        const b00 = a00 * a11 - a01 * a10
        const b01 = a00 * a12 - a02 * a10
        const b02 = a00 * a13 - a03 * a10
        const b03 = a01 * a12 - a02 * a11
        const b04 = a01 * a13 - a03 * a11
        const b05 = a02 * a13 - a03 * a12
        const b06 = a20 * a31 - a21 * a30
        const b07 = a20 * a32 - a22 * a30
        const b08 = a20 * a33 - a23 * a30
        const b09 = a21 * a32 - a22 * a31
        const b10 = a21 * a33 - a23 * a31
        const b11 = a22 * a33 - a23 * a32
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
        if (!det) {
            return null
        }
        det = 1 / det
        out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det
        out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det
        out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det
        out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det
        out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det
        out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det
        out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det
        out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det
        out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det
        out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det
        out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det
        out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det
        out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det
        out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det
        out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det
        out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det
        return out
    },
    adjoint: (out: Mat4): Mat4 =>
    {
        const a00 = out[0], a01 = out[1], a02 = out[2], a03 = out[3]
        const a10 = out[4], a11 = out[5], a12 = out[6], a13 = out[7]
        const a20 = out[8], a21 = out[9], a22 = out[10], a23 = out[11]
        const a30 = out[12], a31 = out[13], a32 = out[14], a33 = out[15]
        out[0] = +(a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22))
        out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22))
        out[2] = +(a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12))
        out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12))
        out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22))
        out[5] = +(a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22))
        out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12))
        out[7] = +(a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12))
        out[8] = +(a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21))
        out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21))
        out[10] = +(a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11))
        out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11))
        out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21))
        out[13] = +(a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21))
        out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11))
        out[15] = +(a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11))
        return out
    },
    determinant: (m: Mat4): number =>
    {
        const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3]
        const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7]
        const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11]
        const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15]
        const b00 = a00 * a11 - a01 * a10
        const b01 = a00 * a12 - a02 * a10
        const b02 = a00 * a13 - a03 * a10
        const b03 = a01 * a12 - a02 * a11
        const b04 = a01 * a13 - a03 * a11
        const b05 = a02 * a13 - a03 * a12
        const b06 = a20 * a31 - a21 * a30
        const b07 = a20 * a32 - a22 * a30
        const b08 = a20 * a33 - a23 * a30
        const b09 = a21 * a32 - a22 * a31
        const b10 = a21 * a33 - a23 * a31
        const b11 = a22 * a33 - a23 * a32
        return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
    },
    multiply: (out: Mat4, m: Mat4): Mat4 =>
    {
        const a00 = out[0], a01 = out[1], a02 = out[2], a03 = out[3]
        const a10 = out[4], a11 = out[5], a12 = out[6], a13 = out[7]
        const a20 = out[8], a21 = out[9], a22 = out[10], a23 = out[11]
        const a30 = out[12], a31 = out[13], a32 = out[14], a33 = out[15]
        let b0 = m[0], b1 = m[1], b2 = m[2], b3 = m[3]
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33
        b0 = m[4], b1 = m[5], b2 = m[6], b3 = m[7]
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33
        b0 = m[8], b1 = m[9], b2 = m[10], b3 = m[11]
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33
        b0 = m[12], b1 = m[13], b2 = m[14], b3 = m[15]
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33
        return out
    },
    translate: (out: Mat4, v: Vec3): Mat4 =>
    {
        const x = v[0], y = v[1], z = v[2]
        out[12] = out[0] * x + out[4] * y + out[8] * z + out[12]
        out[13] = out[1] * x + out[5] * y + out[9] * z + out[13]
        out[14] = out[2] * x + out[6] * y + out[10] * z + out[14]
        out[15] = out[3] * x + out[7] * y + out[11] * z + out[15]
        return out
    },
    rotate: (out: Mat4, rad: number, axis: Vec3): Mat4 =>
    {
        let x = axis[0], y = axis[1], z = axis[2]
        let len = Math.hypot(x, y, z)
        if (len < epsilon) return out
        len = 1 / len
        x *= len, y *= len, z *= len
        const s = Math.sin(rad)
        const c = Math.cos(rad)
        const t = 1 - c
        const b00 = x * x * t + c
        const b01 = y * x * t + z * s
        const b02 = z * x * t - y * s
        const b10 = x * y * t - z * s
        const b11 = y * y * t + c
        const b12 = z * y * t + x * s
        const b20 = x * z * t + y * s
        const b21 = y * z * t - x * s
        const b22 = z * z * t + c
        const a00 = out[0], a01 = out[1], a02 = out[2], a03 = out[3]
        const a10 = out[4], a11 = out[5], a12 = out[6], a13 = out[7]
        const a20 = out[8], a21 = out[9], a22 = out[10], a23 = out[11]
        out[0] = a00 * b00 + a10 * b01 + a20 * b02
        out[1] = a01 * b00 + a11 * b01 + a21 * b02
        out[2] = a02 * b00 + a12 * b01 + a22 * b02
        out[3] = a03 * b00 + a13 * b01 + a23 * b02
        out[4] = a00 * b10 + a10 * b11 + a20 * b12
        out[5] = a01 * b10 + a11 * b11 + a21 * b12
        out[6] = a02 * b10 + a12 * b11 + a22 * b12
        out[7] = a03 * b10 + a13 * b11 + a23 * b12
        out[8] = a00 * b20 + a10 * b21 + a20 * b22
        out[9] = a01 * b20 + a11 * b21 + a21 * b22
        out[10] = a02 * b20 + a12 * b21 + a22 * b22
        out[11] = a03 * b20 + a13 * b21 + a23 * b22
        return out
    },
    scale: (out: Mat4, v: Vec3): Mat4 =>
    {
        const x = v[0], y = v[1], z = v[2]
        out[0] *= x, out[1] *= x, out[2] *= x, out[3] *= x
        out[4] *= y, out[5] *= y, out[6] *= y, out[7] *= y
        out[8] *= z, out[9] *= z, out[10] *= z, out[11] *= z
        return out
    },
    fromTranslation: (v: Vec3): Mat4 =>
    {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            v[0], v[1], v[2], 1]
    },
    fromRotation: (rad: number, axis: Vec3): Mat4 =>
    {
        let x = axis[0], y = axis[1], z = axis[2]
        let len = Math.hypot(x, y, z)
        if (len < epsilon) return mat4.identity()
        len = 1 / len
        x *= len, y *= len, z *= len
        const s = Math.sin(rad)
        const c = Math.cos(rad)
        const t = 1 - c
        return [
            x * x * t + c, y * x * t + z * s, z * x * t - y * s, 0,
            x * y * t - z * s, y * y * t + c, z * y * t + x * s, 0,
            x * z * t + y * s, y * z * t - x * s, z * z * t + c, 0,
            0, 0, 0, 1]
    },
    fromScaling: (v: Vec3): Mat4 =>
    {
        return [
            v[0], 0, 0, 0,
            0, v[1], 0, 0,
            0, 0, v[2], 0,
            0, 0, 0, 1]
    },
    getTranslation: (m: Mat4): Vec3 =>
    {
        return [m[12], m[13], m[14]]
    },
    getScaling: (m: Mat4): Vec3 =>
    {
        return [
            Math.hypot(m[0], m[1], m[2]),
            Math.hypot(m[4], m[5], m[6]),
            Math.hypot(m[8], m[9], m[10])]
    },
    frustrum: (left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 =>
    {
        const rl = 1 / (right - left)
        const tb = 1 / (top - bottom)
        const nf = 1 / (near - far)
        return [
            near * 2 * rl, 0, 0, 0,
            0, near * 2 * tb, 0, 0,
            (right + left) * rl, (top + bottom) * tb, (far + near) * nf, -1,
            0, 0, far * near * 2 * nf, 0]
    },
    perspective: (fov: number, aspect: number, near: number, far: number): Mat4 =>
    {
        const f = 1 / Math.tan(fov / 2)
        let o33, o43
        if (far !== null && far !== Infinity) {
            const nf = 1 / (near - far)
            o33 = (far + near) * nf
            o43 = 2 * far * near * nf
        } else {
            o33 = -1
            o43 = -2 * near
        }
        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, o33, -1,
            0, 0, o43, 0]
    },
    ortho: (left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 =>
    {
        const lr = 1 / (left - right)
        const bt = 1 / (bottom - top)
        const nf = 1 / (near - far)
        return [
            -2 * lr, 0, 0, 0,
            0, -2 * bt, 0, 0,
            0, 0, 2 * nf, 0,
            (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1]
    },
    lookAt: (eye: Vec3, center: Vec3, up: Vec3): Mat4 =>
    {
        const eyex = eye[0], eyey = eye[1], eyez = eye[2]
        const centerx = center[0], centery = center[1], centerz = center[2]
        let z0 = eyex - centerx, z1 = eyey - centery, z2 = eyez - centerz
        if (Math.abs(z0) < epsilon && Math.abs(z1) < epsilon && Math.abs(z2) < epsilon) {
            return mat4.identity()
        }
        let len = 1 / Math.hypot(z0, z1, z2)
        z0 *= len, z1 *= len, z2 *= len
        const upx = up[0], upy = up[1], upz = up[2]
        let x0 = upy * z2 - upz * z1
        let x1 = upz * z0 - upx * z2
        let x2 = upx * z1 - upy * z0
        len = Math.hypot(x0, x1, x2)
        if (!len) {
            x0 = 0, x1 = 0, x2 = 0
        } else {
            len = 1 / len
            x0 *= len, x1 *= len, x2 *= len
        }
        let y0 = z1 * x2 - z2 * x1
        let y1 = z2 * x0 - z0 * x2
        let y2 = z0 * x1 - z1 * x0
        len = Math.hypot(y0, y1, y2)
        if (!len) {
            y0 = 0, y1 = 0, y2 = 0
        } else {
            len = 1 / len
            y0 *= len, y1 *= len, y2 *= len
        }
        return [
            x0, y0, z0, 0,
            x1, y1, z1, 0,
            x2, y2, z2, 0,
            -(x0 * eyex + x1 * eyey + x2 * eyez),
            -(y0 * eyex + y1 * eyey + y2 * eyez),
            -(z0 * eyex + z1 * eyey + z2 * eyez),
            1]
    },
    equals: (a: Mat4, b: Mat4): boolean =>
    {
        for (let i = 0; i < 16; i++) {
            if (Math.abs(a[i] - b[i]) > epsilon) {
                return false
            }
        }
        return true
    }
}
Object.freeze(mat4)
