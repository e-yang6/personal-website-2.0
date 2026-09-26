/*
MIT License
Copyright (c) 2017 Pavel Dobryakov
https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
*/

'use strict';

(function () {
    var canvas = document.getElementById('ripple-canvas');
    if (!canvas) return;

    canvas.style.width = '100%';
    canvas.style.height = '100%';

    var config = {
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 512,
        DENSITY_DISSIPATION: 2.5,
        VELOCITY_DISSIPATION: 1.0,
        PRESSURE: 0.8,
        PRESSURE_ITERATIONS: 20,
        CURL: 30,
        SPLAT_RADIUS: 0.15,
        SPLAT_FORCE: 3000,
        SHADING: true,
        COLORFUL: true,
        COLOR_UPDATE_SPEED: 10,
        PAUSED: false,
        BACK_COLOR: { r: 10, g: 10, b: 10 },
        TRANSPARENT: false,
        BLOOM: true,
        BLOOM_ITERATIONS: 8,
        BLOOM_RESOLUTION: 256,
        BLOOM_INTENSITY: 0.4,
        BLOOM_THRESHOLD: 0.3,
        BLOOM_SOFT_KNEE: 0.7,
        SUNRAYS: false,
        SUNRAYS_RESOLUTION: 196,
        SUNRAYS_WEIGHT: 1.0,
    };

    function pointerPrototype () {
        this.id = -1;
        this.texcoordX = 0;
        this.texcoordY = 0;
        this.prevTexcoordX = 0;
        this.prevTexcoordY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.down = false;
        this.moved = false;
        this.color = [30, 0, 300];
    }

    var pointers = [];
    var splatStack = [];
    pointers.push(new pointerPrototype());

    var ref = getWebGLContext(canvas);
    var gl = ref.gl;
    var ext = ref.ext;

    if (!ext.supportLinearFiltering) {
        config.DYE_RESOLUTION = 256;
        config.SHADING = false;
        config.BLOOM = false;
    }

    function getWebGLContext (canvas) {
        var params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };

        var gl = canvas.getContext('webgl2', params);
        var isWebGL2 = !!gl;
        if (!isWebGL2)
            gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);

        if (!gl) return { gl: null, ext: {} };

        var halfFloat;
        var supportLinearFiltering;
        if (isWebGL2) {
            gl.getExtension('EXT_color_buffer_float');
            supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
        } else {
            halfFloat = gl.getExtension('OES_texture_half_float');
            supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        var halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : (halfFloat ? halfFloat.HALF_FLOAT_OES : null);
        if (!halfFloatTexType) return { gl: null, ext: {} };

        var formatRGBA, formatRG, formatR;

        if (isWebGL2) {
            formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
        } else {
            formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        }

        return {
            gl: gl,
            ext: {
                formatRGBA: formatRGBA,
                formatRG: formatRG,
                formatR: formatR,
                halfFloatTexType: halfFloatTexType,
                supportLinearFiltering: supportLinearFiltering
            }
        };
    }

    function getSupportedFormat (gl, internalFormat, format, type) {
        if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
            switch (internalFormat) {
                case gl.R16F:
                    return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
                case gl.RG16F:
                    return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
                default:
                    return null;
            }
        }
        return { internalFormat: internalFormat, format: format };
    }

    function supportRenderTextureFormat (gl, internalFormat, format, type) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        return status == gl.FRAMEBUFFER_COMPLETE;
    }

    if (!gl || !ext.formatRGBA) return;

    var Material = function (vertexShader, fragmentShaderSource) {
        this.vertexShader = vertexShader;
        this.fragmentShaderSource = fragmentShaderSource;
        this.programs = [];
        this.activeProgram = null;
        this.uniforms = [];
    };

    Material.prototype.setKeywords = function (keywords) {
        var hash = 0;
        for (var i = 0; i < keywords.length; i++)
            hash += hashCode(keywords[i]);

        var program = this.programs[hash];
        if (program == null) {
            var fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
            program = createProgram(this.vertexShader, fragmentShader);
            this.programs[hash] = program;
        }

        if (program == this.activeProgram) return;

        this.uniforms = getUniforms(program);
        this.activeProgram = program;
    };

    Material.prototype.bind = function () {
        gl.useProgram(this.activeProgram);
    };

    var Program = function (vertexShader, fragmentShader) {
        this.uniforms = {};
        this.program = createProgram(vertexShader, fragmentShader);
        this.uniforms = getUniforms(this.program);
    };

    Program.prototype.bind = function () {
        gl.useProgram(this.program);
    };

    function createProgram (vertexShader, fragmentShader) {
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            console.trace(gl.getProgramInfoLog(program));
        return program;
    }

    function getUniforms (program) {
        var uniforms = [];
        var uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < uniformCount; i++) {
            var uniformName = gl.getActiveUniform(program, i).name;
            uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
        }
        return uniforms;
    }

    function compileShader (type, source, keywords) {
        source = addKeywords(source, keywords);
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            console.trace(gl.getShaderInfoLog(shader));
        return shader;
    }

    function addKeywords (source, keywords) {
        if (keywords == null) return source;
        var keywordsString = '';
        keywords.forEach(function (keyword) {
            keywordsString += '#define ' + keyword + '\n';
        });
        return keywordsString + source;
    }

    var baseVertexShader = compileShader(gl.VERTEX_SHADER, [
        'precision highp float;',
        'attribute vec2 aPosition;',
        'varying vec2 vUv;',
        'varying vec2 vL;',
        'varying vec2 vR;',
        'varying vec2 vT;',
        'varying vec2 vB;',
        'uniform vec2 texelSize;',
        'void main () {',
        '    vUv = aPosition * 0.5 + 0.5;',
        '    vL = vUv - vec2(texelSize.x, 0.0);',
        '    vR = vUv + vec2(texelSize.x, 0.0);',
        '    vT = vUv + vec2(0.0, texelSize.y);',
        '    vB = vUv - vec2(0.0, texelSize.y);',
        '    gl_Position = vec4(aPosition, 0.0, 1.0);',
        '}'
    ].join('\n'));

    var blurVertexShader = compileShader(gl.VERTEX_SHADER, [
        'precision highp float;',
        'attribute vec2 aPosition;',
        'varying vec2 vUv;',
        'varying vec2 vL;',
        'varying vec2 vR;',
        'uniform vec2 texelSize;',
        'void main () {',
        '    vUv = aPosition * 0.5 + 0.5;',
        '    float offset = 1.33333333;',
        '    vL = vUv - texelSize * offset;',
        '    vR = vUv + texelSize * offset;',
        '    gl_Position = vec4(aPosition, 0.0, 1.0);',
        '}'
    ].join('\n'));

    var blurShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision mediump float;',
        'precision mediump sampler2D;',
        'varying vec2 vUv;',
        'varying vec2 vL;',
        'varying vec2 vR;',
        'uniform sampler2D uTexture;',
        'void main () {',
        '    vec4 sum = texture2D(uTexture, vUv) * 0.29411764;',
        '    sum += texture2D(uTexture, vL) * 0.35294117;',
        '    sum += texture2D(uTexture, vR) * 0.35294117;',
        '    gl_FragColor = sum;',
        '}'
    ].join('\n'));

    var copyShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision mediump float;',
        'precision mediump sampler2D;',
        'varying highp vec2 vUv;',
        'uniform sampler2D uTexture;',
        'void main () {',
        '    gl_FragColor = texture2D(uTexture, vUv);',
        '}'
    ].join('\n'));

    var clearShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision mediump float;',
        'precision mediump sampler2D;',
        'varying highp vec2 vUv;',
        'uniform sampler2D uTexture;',
        'uniform float value;',
        'void main () {',
        '    gl_FragColor = value * texture2D(uTexture, vUv);',
        '}'
    ].join('\n'));

    var colorShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision mediump float;',
        'uniform vec4 color;',
        'void main () {',
        '    gl_FragColor = color;',
        '}'
    ].join('\n'));

    var displayShaderSource = [
        'precision highp float;',
        'precision highp sampler2D;',
        'varying vec2 vUv;',
        'varying vec2 vL;',
        'varying vec2 vR;',
        'varying vec2 vT;',
        'varying vec2 vB;',
        'uniform sampler2D uTexture;',
        'uniform sampler2D uBloom;',
        'uniform sampler2D uDithering;',
        'uniform vec2 ditherScale;',
        'uniform vec2 texelSize;',
        'vec3 linearToGamma (vec3 color) {',
        '    color = max(color, vec3(0));',
        '    return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));',
        '}',
        'void main () {',
        '    vec3 c = texture2D(uTexture, vUv).rgb;',
        '#ifdef SHADING',
        '    vec3 lc = texture2D(uTexture, vL).rgb;',
        '    vec3 rc = texture2D(uTexture, vR).rgb;',
        '    vec3 tc = texture2D(uTexture, vT).rgb;',
        '    vec3 bc = texture2D(uTexture, vB).rgb;',
        '    float dx = length(rc) - length(lc);',
        '    float dy = length(tc) - length(bc);',
        '    vec3 n = normalize(vec3(dx, dy, length(texelSize)));',
        '    vec3 l = vec3(0.0, 0.0, 1.0);',
        '    float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);',
        '    c *= diffuse;',
        '#endif',
        '#ifdef BLOOM',
        '    vec3 bloom = texture2D(uBloom, vUv).rgb;',
        '#endif',
        '#ifdef BLOOM',
        '    float noise = texture2D(uDithering, vUv * ditherScale).r;',
        '    noise = noise * 2.0 - 1.0;',
        '    bloom += noise / 255.0;',
        '    bloom = linearToGamma(bloom);',
        '    c += bloom;',
        '#endif',
        '    float a = max(c.r, max(c.g, c.b));',
        '    gl_FragColor = vec4(c, a);',
        '}'
    ].join('\n');

    var bloomPrefilterShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision mediump float;',
        'precision mediump sampler2D;',
        'varying vec2 vUv;',
        'uniform sampler2D uTexture;',
        'uniform vec3 curve;',
        'uniform float threshold;',
        'void main () {',
        '    vec3 c = texture2D(uTexture, vUv).rgb;',
        '    float br = max(c.r, max(c.g, c.b));',
        '    float rq = clamp(br - curve.x, 0.0, curve.y);',
        '    rq = curve.z * rq * rq;',
        '    c *= max(rq, br - threshold) / max(br, 0.0001);',
        '    gl_FragColor = vec4(c, 0.0);',
        '}'
    ].join('\n'));

    var bloomBlurShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision mediump float;',
        'precision mediump sampler2D;',
        'varying vec2 vL;',
        'varying vec2 vR;',
        'varying vec2 vT;',
        'varying vec2 vB;',
        'uniform sampler2D uTexture;',
        'void main () {',
        '    vec4 sum = vec4(0.0);',
        '    sum += texture2D(uTexture, vL);',
        '    sum += texture2D(uTexture, vR);',
        '    sum += texture2D(uTexture, vT);',
        '    sum += texture2D(uTexture, vB);',
        '    sum *= 0.25;',
        '    gl_FragColor = sum;',
        '}'
    ].join('\n'));

    var bloomFinalShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision mediump float;',
        'precision mediump sampler2D;',
        'varying vec2 vL;',
        'varying vec2 vR;',
        'varying vec2 vT;',
        'varying vec2 vB;',
        'uniform sampler2D uTexture;',
        'uniform float intensity;',
        'void main () {',
        '    vec4 sum = vec4(0.0);',
        '    sum += texture2D(uTexture, vL);',
        '    sum += texture2D(uTexture, vR);',
        '    sum += texture2D(uTexture, vT);',
        '    sum += texture2D(uTexture, vB);',
        '    sum *= 0.25;',
        '    gl_FragColor = sum * intensity;',
        '}'
    ].join('\n'));

    var splatShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision highp float;',
        'precision highp sampler2D;',
        'varying vec2 vUv;',
        'uniform sampler2D uTarget;',
        'uniform float aspectRatio;',
        'uniform vec3 color;',
        'uniform vec2 point;',
        'uniform float radius;',
        'void main () {',
        '    vec2 p = vUv - point.xy;',
        '    p.x *= aspectRatio;',
        '    vec3 splat = exp(-dot(p, p) / radius) * color;',
        '    vec3 base = texture2D(uTarget, vUv).xyz;',
        '    gl_FragColor = vec4(base + splat, 1.0);',
        '}'
    ].join('\n'));

    var advectionShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision highp float;',
        'precision highp sampler2D;',
        'varying vec2 vUv;',
        'uniform sampler2D uVelocity;',
        'uniform sampler2D uSource;',
        'uniform vec2 texelSize;',
        'uniform vec2 dyeTexelSize;',
        'uniform float dt;',
        'uniform float dissipation;',
        'vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {',
        '    vec2 st = uv / tsize - 0.5;',
        '    vec2 iuv = floor(st);',
        '    vec2 fuv = fract(st);',
        '    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);',
        '    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);',
        '    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);',
        '    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);',
        '    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);',
        '}',
        'void main () {',
        '#ifdef MANUAL_FILTERING',
        '    vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;',
        '    vec4 result = bilerp(uSource, coord, dyeTexelSize);',
        '#else',
        '    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;',
        '    vec4 result = texture2D(uSource, coord);',
        '#endif',
        '    float decay = 1.0 + dissipation * dt;',
        '    gl_FragColor = result / decay;',
        '}'
    ].join('\n'), ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']);

    var divergenceShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision mediump float;',
        'precision mediump sampler2D;',
        'varying highp vec2 vUv;',
        'varying highp vec2 vL;',
        'varying highp vec2 vR;',
        'varying highp vec2 vT;',
        'varying highp vec2 vB;',
        'uniform sampler2D uVelocity;',
        'void main () {',
        '    float L = texture2D(uVelocity, vL).x;',
        '    float R = texture2D(uVelocity, vR).x;',
        '    float T = texture2D(uVelocity, vT).y;',
        '    float B = texture2D(uVelocity, vB).y;',
        '    vec2 C = texture2D(uVelocity, vUv).xy;',
        '    if (vL.x < 0.0) { L = -C.x; }',
        '    if (vR.x > 1.0) { R = -C.x; }',
        '    if (vT.y > 1.0) { T = -C.y; }',
        '    if (vB.y < 0.0) { B = -C.y; }',
        '    float div = 0.5 * (R - L + T - B);',
        '    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);',
        '}'
    ].join('\n'));

    var curlShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision mediump float;',
        'precision mediump sampler2D;',
        'varying highp vec2 vUv;',
        'varying highp vec2 vL;',
        'varying highp vec2 vR;',
        'varying highp vec2 vT;',
        'varying highp vec2 vB;',
        'uniform sampler2D uVelocity;',
        'void main () {',
        '    float L = texture2D(uVelocity, vL).y;',
        '    float R = texture2D(uVelocity, vR).y;',
        '    float T = texture2D(uVelocity, vT).x;',
        '    float B = texture2D(uVelocity, vB).x;',
        '    float vorticity = R - L - T + B;',
        '    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);',
        '}'
    ].join('\n'));

    var vorticityShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision highp float;',
        'precision highp sampler2D;',
        'varying vec2 vUv;',
        'varying vec2 vL;',
        'varying vec2 vR;',
        'varying vec2 vT;',
        'varying vec2 vB;',
        'uniform sampler2D uVelocity;',
        'uniform sampler2D uCurl;',
        'uniform float curl;',
        'uniform float dt;',
        'void main () {',
        '    float L = texture2D(uCurl, vL).x;',
        '    float R = texture2D(uCurl, vR).x;',
        '    float T = texture2D(uCurl, vT).x;',
        '    float B = texture2D(uCurl, vB).x;',
        '    float C = texture2D(uCurl, vUv).x;',
        '    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));',
        '    force /= length(force) + 0.0001;',
        '    force *= curl * C;',
        '    force.y *= -1.0;',
        '    vec2 velocity = texture2D(uVelocity, vUv).xy;',
        '    velocity += force * dt;',
        '    velocity = min(max(velocity, -1000.0), 1000.0);',
        '    gl_FragColor = vec4(velocity, 0.0, 1.0);',
        '}'
    ].join('\n'));

    var pressureShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision mediump float;',
        'precision mediump sampler2D;',
        'varying highp vec2 vUv;',
        'varying highp vec2 vL;',
        'varying highp vec2 vR;',
        'varying highp vec2 vT;',
        'varying highp vec2 vB;',
        'uniform sampler2D uPressure;',
        'uniform sampler2D uDivergence;',
        'void main () {',
        '    float L = texture2D(uPressure, vL).x;',
        '    float R = texture2D(uPressure, vR).x;',
        '    float T = texture2D(uPressure, vT).x;',
        '    float B = texture2D(uPressure, vB).x;',
        '    float C = texture2D(uPressure, vUv).x;',
        '    float divergence = texture2D(uDivergence, vUv).x;',
        '    float pressure = (L + R + B + T - divergence) * 0.25;',
        '    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);',
        '}'
    ].join('\n'));

    var gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, [
        'precision mediump float;',
        'precision mediump sampler2D;',
        'varying highp vec2 vUv;',
        'varying highp vec2 vL;',
        'varying highp vec2 vR;',
        'varying highp vec2 vT;',
        'varying highp vec2 vB;',
        'uniform sampler2D uPressure;',
        'uniform sampler2D uVelocity;',
        'void main () {',
        '    float L = texture2D(uPressure, vL).x;',
        '    float R = texture2D(uPressure, vR).x;',
        '    float T = texture2D(uPressure, vT).x;',
        '    float B = texture2D(uPressure, vB).x;',
        '    vec2 velocity = texture2D(uVelocity, vUv).xy;',
        '    velocity.xy -= vec2(R - L, T - B);',
        '    gl_FragColor = vec4(velocity, 0.0, 1.0);',
        '}'
    ].join('\n'));

    var blit = (function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        return function (target, clear) {
            if (target == null) {
                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            } else {
                gl.viewport(0, 0, target.width, target.height);
                gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
            }
            if (clear) {
                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        };
    })();

    var dye;
    var velocity;
    var divergence;
    var curl;
    var pressure;
    var bloom;
    var bloomFramebuffers = [];

    function createDitheringTexture () {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        var size = 128;
        var data = new Uint8Array(size * size * 3);
        for (var i = 0; i < data.length; i++) {
            data[i] = Math.random() * 255;
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
        return {
            texture: texture,
            width: size,
            height: size,
            attach: function (id) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return id;
            }
        };
    }

    var ditheringTexture = createDitheringTexture();

    var blurProgram            = new Program(blurVertexShader, blurShader);
    var copyProgram            = new Program(baseVertexShader, copyShader);
    var clearProgram           = new Program(baseVertexShader, clearShader);
    var colorProgram           = new Program(baseVertexShader, colorShader);
    var bloomPrefilterProgram  = new Program(baseVertexShader, bloomPrefilterShader);
    var bloomBlurProgram       = new Program(baseVertexShader, bloomBlurShader);
    var bloomFinalProgram      = new Program(baseVertexShader, bloomFinalShader);
    var splatProgram           = new Program(baseVertexShader, splatShader);
    var advectionProgram       = new Program(baseVertexShader, advectionShader);
    var divergenceProgram      = new Program(baseVertexShader, divergenceShader);
    var curlProgram            = new Program(baseVertexShader, curlShader);
    var vorticityProgram       = new Program(baseVertexShader, vorticityShader);
    var pressureProgram        = new Program(baseVertexShader, pressureShader);
    var gradienSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);

    var displayMaterial = new Material(baseVertexShader, displayShaderSource);

    function initFramebuffers () {
        var simRes = getResolution(config.SIM_RESOLUTION);
        var dyeRes = getResolution(config.DYE_RESOLUTION);

        var texType = ext.halfFloatTexType;
        var rgba    = ext.formatRGBA;
        var rg      = ext.formatRG;
        var r       = ext.formatR;
        var filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

        gl.disable(gl.BLEND);

        if (dye == null)
            dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        else
            dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);

        if (velocity == null)
            velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        else
            velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);

        divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        curl       = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        pressure   = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);

        initBloomFramebuffers();
    }

    function initBloomFramebuffers () {
        var res = getResolution(config.BLOOM_RESOLUTION);
        var texType = ext.halfFloatTexType;
        var rgba = ext.formatRGBA;
        var filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

        bloom = createFBO(res.width, res.height, rgba.internalFormat, rgba.format, texType, filtering);

        bloomFramebuffers.length = 0;
        for (var i = 0; i < config.BLOOM_ITERATIONS; i++) {
            var width = res.width >> (i + 1);
            var height = res.height >> (i + 1);
            if (width < 2 || height < 2) break;
            var fbo = createFBO(width, height, rgba.internalFormat, rgba.format, texType, filtering);
            bloomFramebuffers.push(fbo);
        }
    }

    function createFBO (w, h, internalFormat, format, type, param) {
        gl.activeTexture(gl.TEXTURE0);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);

        var texelSizeX = 1.0 / w;
        var texelSizeY = 1.0 / h;

        return {
            texture: texture,
            fbo: fbo,
            width: w,
            height: h,
            texelSizeX: texelSizeX,
            texelSizeY: texelSizeY,
            attach: function (id) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return id;
            }
        };
    }

    function createDoubleFBO (w, h, internalFormat, format, type, param) {
        var fbo1 = createFBO(w, h, internalFormat, format, type, param);
        var fbo2 = createFBO(w, h, internalFormat, format, type, param);

        return {
            width: w,
            height: h,
            texelSizeX: fbo1.texelSizeX,
            texelSizeY: fbo1.texelSizeY,
            get read () { return fbo1; },
            set read (value) { fbo1 = value; },
            get write () { return fbo2; },
            set write (value) { fbo2 = value; },
            swap: function () {
                var temp = fbo1;
                fbo1 = fbo2;
                fbo2 = temp;
            }
        };
    }

    function resizeFBO (target, w, h, internalFormat, format, type, param) {
        var newFBO = createFBO(w, h, internalFormat, format, type, param);
        copyProgram.bind();
        gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
        blit(newFBO);
        return newFBO;
    }

    function resizeDoubleFBO (target, w, h, internalFormat, format, type, param) {
        if (target.width == w && target.height == h)
            return target;
        target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
        target.write = createFBO(w, h, internalFormat, format, type, param);
        target.width = w;
        target.height = h;
        target.texelSizeX = 1.0 / w;
        target.texelSizeY = 1.0 / h;
        return target;
    }

    function updateKeywords () {
        var displayKeywords = [];
        if (config.SHADING) displayKeywords.push("SHADING");
        if (config.BLOOM) displayKeywords.push("BLOOM");
        displayMaterial.setKeywords(displayKeywords);
    }

    updateKeywords();
    initFramebuffers();

    var lastUpdateTime = Date.now();
    var colorUpdateTimer = 0.0;
    update();

    function update () {
        var dt = calcDeltaTime();
        if (resizeCanvas())
            initFramebuffers();
        updateColors(dt);
        applyInputs();
        if (!config.PAUSED)
            step(dt);
        render(null);
        requestAnimationFrame(update);
    }

    function calcDeltaTime () {
        var now = Date.now();
        var dt = (now - lastUpdateTime) / 1000;
        dt = Math.min(dt, 0.016666);
        lastUpdateTime = now;
        return dt;
    }

    function resizeCanvas () {
        var width = scaleByPixelRatio(canvas.clientWidth);
        var height = scaleByPixelRatio(canvas.clientHeight);
        if (canvas.width != width || canvas.height != height) {
            canvas.width = width;
            canvas.height = height;
            return true;
        }
        return false;
    }

    function updateColors (dt) {
        if (!config.COLORFUL) return;
        colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
        if (colorUpdateTimer >= 1) {
            colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
            pointers.forEach(function (p) {
                p.color = generateColor();
            });
        }
    }

    function applyInputs () {
        if (splatStack.length > 0)
            multipleSplats(splatStack.pop());

        pointers.forEach(function (p) {
            if (p.moved) {
                p.moved = false;
                splatPointer(p);
            }
        });
    }

    function step (dt) {
        gl.disable(gl.BLEND);

        curlProgram.bind();
        gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(curl);

        vorticityProgram.bind();
        gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
        gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
        gl.uniform1f(vorticityProgram.uniforms.dt, dt);
        blit(velocity.write);
        velocity.swap();

        divergenceProgram.bind();
        gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(divergence);

        clearProgram.bind();
        gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
        gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
        blit(pressure.write);
        pressure.swap();

        pressureProgram.bind();
        gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
        for (var i = 0; i < config.PRESSURE_ITERATIONS; i++) {
            gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
            blit(pressure.write);
            pressure.swap();
        }

        gradienSubtractProgram.bind();
        gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
        gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
        blit(velocity.write);
        velocity.swap();

        advectionProgram.bind();
        gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        if (!ext.supportLinearFiltering)
            gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
        var velocityId = velocity.read.attach(0);
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
        gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
        gl.uniform1f(advectionProgram.uniforms.dt, dt);
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
        blit(velocity.write);
        velocity.swap();

        if (!ext.supportLinearFiltering)
            gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
        blit(dye.write);
        dye.swap();
    }

    function render (target) {
        if (config.BLOOM)
            applyBloom(dye.read, bloom);

        if (target == null || !config.TRANSPARENT) {
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);
        } else {
            gl.disable(gl.BLEND);
        }

        if (!config.TRANSPARENT)
            drawColor(target, normalizeColor(config.BACK_COLOR));
        drawDisplay(target);
    }

    function drawColor (target, color) {
        colorProgram.bind();
        gl.uniform4f(colorProgram.uniforms.color, color.r, color.g, color.b, 1);
        blit(target);
    }

    function drawDisplay (target) {
        var width = target == null ? gl.drawingBufferWidth : target.width;
        var height = target == null ? gl.drawingBufferHeight : target.height;

        displayMaterial.bind();
        if (config.SHADING)
            gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height);
        gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
        if (config.BLOOM) {
            gl.uniform1i(displayMaterial.uniforms.uBloom, bloom.attach(1));
            gl.uniform1i(displayMaterial.uniforms.uDithering, ditheringTexture.attach(2));
            var scale = getTextureScale(ditheringTexture, width, height);
            gl.uniform2f(displayMaterial.uniforms.ditherScale, scale.x, scale.y);
        }
        blit(target);
    }

    function applyBloom (source, destination) {
        if (bloomFramebuffers.length < 2)
            return;

        var last = destination;

        gl.disable(gl.BLEND);
        bloomPrefilterProgram.bind();
        var knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
        var curve0 = config.BLOOM_THRESHOLD - knee;
        var curve1 = knee * 2;
        var curve2 = 0.25 / knee;
        gl.uniform3f(bloomPrefilterProgram.uniforms.curve, curve0, curve1, curve2);
        gl.uniform1f(bloomPrefilterProgram.uniforms.threshold, config.BLOOM_THRESHOLD);
        gl.uniform1i(bloomPrefilterProgram.uniforms.uTexture, source.attach(0));
        blit(last);

        bloomBlurProgram.bind();
        for (var i = 0; i < bloomFramebuffers.length; i++) {
            var dest = bloomFramebuffers[i];
            gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
            gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
            blit(dest);
            last = dest;
        }

        gl.blendFunc(gl.ONE, gl.ONE);
        gl.enable(gl.BLEND);

        for (var i = bloomFramebuffers.length - 2; i >= 0; i--) {
            var baseTex = bloomFramebuffers[i];
            gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
            gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
            gl.viewport(0, 0, baseTex.width, baseTex.height);
            blit(baseTex);
            last = baseTex;
        }

        gl.disable(gl.BLEND);
        bloomFinalProgram.bind();
        gl.uniform2f(bloomFinalProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
        gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0));
        gl.uniform1f(bloomFinalProgram.uniforms.intensity, config.BLOOM_INTENSITY);
        blit(destination);
    }

    function blur (target, temp, iterations) {
        blurProgram.bind();
        for (var i = 0; i < iterations; i++) {
            gl.uniform2f(blurProgram.uniforms.texelSize, target.texelSizeX, 0.0);
            gl.uniform1i(blurProgram.uniforms.uTexture, target.attach(0));
            blit(temp);
            gl.uniform2f(blurProgram.uniforms.texelSize, 0.0, target.texelSizeY);
            gl.uniform1i(blurProgram.uniforms.uTexture, temp.attach(0));
            blit(target);
        }
    }

    function splatPointer (pointer) {
        var dx = pointer.deltaX * config.SPLAT_FORCE;
        var dy = pointer.deltaY * config.SPLAT_FORCE;
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    }

    function multipleSplats (amount) {
        for (var i = 0; i < amount; i++) {
            var color = generateColor();
            color.r *= 10.0;
            color.g *= 10.0;
            color.b *= 10.0;
            var x = Math.random();
            var y = Math.random();
            var dx = 1000 * (Math.random() - 0.5);
            var dy = 1000 * (Math.random() - 0.5);
            splat(x, y, dx, dy, color);
        }
    }

    function splat (x, y, dx, dy, color) {
        splatProgram.bind();
        gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
        gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
        gl.uniform2f(splatProgram.uniforms.point, x, y);
        gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
        gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
        blit(velocity.write);
        velocity.swap();

        gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
        gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
        blit(dye.write);
        dye.swap();
    }

    function correctRadius (radius) {
        var aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1)
            radius *= aspectRatio;
        return radius;
    }

    // Mouse/touch: always splat on move (no click required) — fin-through-water effect
    canvas.addEventListener('mousemove', function (e) {
        var pointer = pointers[0];
        if (!pointer.down) {
            pointer.down = true;
            pointer.color = generateColor();
            var posX = scaleByPixelRatio(e.offsetX);
            var posY = scaleByPixelRatio(e.offsetY);
            pointer.texcoordX = posX / canvas.width;
            pointer.texcoordY = 1.0 - posY / canvas.height;
            pointer.prevTexcoordX = pointer.texcoordX;
            pointer.prevTexcoordY = pointer.texcoordY;
        }
        var posX = scaleByPixelRatio(e.offsetX);
        var posY = scaleByPixelRatio(e.offsetY);
        updatePointerMoveData(pointer, posX, posY);
    });

    canvas.addEventListener('mouseleave', function () {
        pointers[0].down = false;
    });

    canvas.addEventListener('touchstart', function (e) {
        e.preventDefault();
        var touches = e.targetTouches;
        while (touches.length >= pointers.length)
            pointers.push(new pointerPrototype());
        for (var i = 0; i < touches.length; i++) {
            var posX = scaleByPixelRatio(touches[i].pageX);
            var posY = scaleByPixelRatio(touches[i].pageY);
            updatePointerDownData(pointers[i + 1], touches[i].identifier, posX, posY);
        }
    });

    canvas.addEventListener('touchmove', function (e) {
        e.preventDefault();
        var touches = e.targetTouches;
        for (var i = 0; i < touches.length; i++) {
            var pointer = pointers[i + 1];
            if (!pointer.down) continue;
            var posX = scaleByPixelRatio(touches[i].pageX);
            var posY = scaleByPixelRatio(touches[i].pageY);
            updatePointerMoveData(pointer, posX, posY);
        }
    }, false);

    window.addEventListener('touchend', function (e) {
        var touches = e.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            var pointer = pointers.find(function (p) { return p.id == touches[i].identifier; });
            if (pointer == null) continue;
            updatePointerUpData(pointer);
        }
    });

    function updatePointerDownData (pointer, id, posX, posY) {
        pointer.id = id;
        pointer.down = true;
        pointer.moved = false;
        pointer.texcoordX = posX / canvas.width;
        pointer.texcoordY = 1.0 - posY / canvas.height;
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.deltaX = 0;
        pointer.deltaY = 0;
        pointer.color = generateColor();
    }

    function updatePointerMoveData (pointer, posX, posY) {
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.texcoordX = posX / canvas.width;
        pointer.texcoordY = 1.0 - posY / canvas.height;
        pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
        pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
        pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    }

    function updatePointerUpData (pointer) {
        pointer.down = false;
    }

    function correctDeltaX (delta) {
        var aspectRatio = canvas.width / canvas.height;
        if (aspectRatio < 1) delta *= aspectRatio;
        return delta;
    }

    function correctDeltaY (delta) {
        var aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1) delta /= aspectRatio;
        return delta;
    }

    function generateColor () {
        var hue = 0.5 + Math.random() * 0.17;
        var c = HSVtoRGB(hue, 0.5, 0.5);
        c.r *= 0.08;
        c.g *= 0.08;
        c.b *= 0.08;
        return c;
    }

    function HSVtoRGB (h, s, v) {
        var r, g, b, i, f, p, q, t;
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }

        return { r: r, g: g, b: b };
    }

    function normalizeColor (input) {
        return { r: input.r / 255, g: input.g / 255, b: input.b / 255 };
    }

    function wrap (value, min, max) {
        var range = max - min;
        if (range == 0) return min;
        return (value - min) % range + min;
    }

    function getResolution (resolution) {
        var aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
        if (aspectRatio < 1)
            aspectRatio = 1.0 / aspectRatio;

        var min = Math.round(resolution);
        var max = Math.round(resolution * aspectRatio);

        if (gl.drawingBufferWidth > gl.drawingBufferHeight)
            return { width: max, height: min };
        else
            return { width: min, height: max };
    }

    function getTextureScale (texture, width, height) {
        return { x: width / texture.width, y: height / texture.height };
    }

    function scaleByPixelRatio (input) {
        var pixelRatio = window.devicePixelRatio || 1;
        return Math.floor(input * pixelRatio);
    }

    function hashCode (s) {
        if (s.length == 0) return 0;
        var hash = 0;
        for (var i = 0; i < s.length; i++) {
            hash = (hash << 5) - hash + s.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }
})();
