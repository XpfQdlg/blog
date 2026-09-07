/* =====================================================
   glow-cursor.js —— 首页 hero 的鼠标光带（ReactBits GlowCursor 移植）
   说明：原作者用 React + ogl 实现。这里抽出核心 GLSL，
   用手写纯 WebGL 渲染，零依赖、不引 React/ogl。
   挂在 #page-header.full_page 上，位于 Orb 之上、文字之下。

   效果：鼠标在 hero 内移动，拖出一条带色彩渐变与光晕的
   尾迹；离开或停顿时淡出。mix-blend-mode: screen 与背景叠加。
   ===================================================== */
(function () {
  'use strict'

  const MAX_POINTS = 64

  const VERT = `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `

  const FRAG = `
    precision highp float;

    #define MAX_POINTS 64

    uniform vec2 uResolution;
    uniform vec2 uPoints[MAX_POINTS];
    uniform float uPointCount;
    uniform vec3 uColor;
    uniform vec3 uSecondaryColor;
    uniform float uTrailWidth;
    uniform float uTaper;
    uniform float uGlowIntensity;
    uniform float uGlowSpread;
    uniform float uHotspot;
    uniform float uBrightness;
    uniform float uOpacity;
    uniform float uPulseSpeed;
    uniform float uNoiseStrength;
    uniform float uTime;
    uniform float uFade;

    varying vec2 vUv;

    float sRGB(float x) {
      if (x <= 0.00031308) return 12.92 * x;
      return 1.055 * pow(x, 1.0 / 2.4) - 0.055;
    }

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float filmGrain(vec2 p, float time) {
      float frame = time * 18.0;
      float frameIndex = mod(floor(frame), 256.0);
      float nextFrameIndex = mod(frameIndex + 1.0, 256.0);
      float blend = fract(frame);
      blend = blend * blend * (3.0 - 2.0 * blend);
      vec2 pixel = floor(p);
      float current = hash(pixel + vec2(frameIndex * 17.0, frameIndex * 31.0));
      float next = hash(pixel + vec2(nextFrameIndex * 17.0, nextFrameIndex * 31.0));
      return mix(current, next, blend) * 2.0 - 1.0;
    }

    void main() {
      vec2 pixel = vUv * uResolution;
      float denominator = max(uPointCount - 1.0, 1.0);
      float strongest = 0.0;
      float strongestCore = 0.0;
      float colorWeight = 0.0;
      vec3 colorSum = vec3(0.0);

      for (int i = 0; i < MAX_POINTS - 1; i++) {
        float index = float(i);
        float active = 1.0 - step(uPointCount - 1.0, index);
        vec2 start = uPoints[i];
        vec2 end = uPoints[i + 1];
        vec2 toPixel = pixel - start;
        vec2 segment = end - start;
        float along = clamp(dot(toPixel, segment) / max(dot(segment, segment), 0.0001), 0.0, 1.0);
        float progress = clamp((index + along) / denominator, 0.0, 1.0);
        float life = pow(max(1.0 - progress, 0.0), mix(0.55, 1.25, uTaper));
        float width = uTrailWidth * mix(1.0, 0.25, pow(progress, mix(0.55, 1.6, uTaper)));
        float distanceToTrail = length(toPixel - segment * along);
        float falloff = max(width * (0.8 + uGlowSpread * 1.4), 0.5);
        float beam = min(1.0, (falloff * falloff) / (distanceToTrail * distanceToTrail + falloff * falloff));
        float core = exp(-pow(distanceToTrail / max(width, 0.5), 2.0) * 2.5);
        float pulseAmount = min(abs(uPulseSpeed), 1.0);
        float pulse = 1.0 + sin(uTime * uPulseSpeed * 3.0 - progress * 11.0) * 0.16 * pulseAmount;
        float intensity = (core + beam * uGlowIntensity * 0.55) * life * pulse * active;
        vec3 segmentColor = mix(uColor, uSecondaryColor, progress);

        strongest = max(strongest, intensity);
        strongestCore = max(strongestCore, core * life * active);
        colorSum += segmentColor * intensity;
        colorWeight += intensity;
      }

      float grain = filmGrain(pixel, uTime);
      float noiseAmount = (1.0 - exp(-uNoiseStrength * 2.2)) * 0.4;
      float alpha = clamp(strongest * uOpacity * uFade, 0.0, 1.0);
      if (alpha < 0.0005) discard;

      vec3 color = colorSum / max(colorWeight, 0.0001);
      color = mix(color, vec3(1.0), smoothstep(0.25, 0.95, strongestCore) * uHotspot);
      float luminance = sRGB(clamp(strongest * uBrightness, 0.0, 1.0));
      luminance *= 1.0 + grain * noiseAmount;
      vec3 additiveColor = color * luminance;
      gl_FragColor = vec4(additiveColor, alpha);
    }
  `

  /* ---------- 迷你 WebGL 工具 ---------- */

  function createShader(gl, type, src) {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error('glow shader: ' + gl.getShaderInfoLog(s))
    }
    return s
  }

  function createProgram(gl) {
    const vs = createShader(gl, gl.VERTEX_SHADER, VERT)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG)
    const p = gl.createProgram()
    gl.attachShader(p, vs)
    gl.attachShader(p, fs)
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error('glow program: ' + gl.getProgramInfoLog(p))
    }
    return p
  }

  function hexToRgb(hex) {
    let v = (hex || '').replace('#', '').trim()
    if (v.length === 3) v = v.split('').map(c => c + c).join('')
    const n = parseInt(v || '000000', 16)
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
  }

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

  function isReducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /* ---------- 参数（对齐素材里的推荐取值） ---------- */

  const CFG = {
    color: '#f7d467',
    secondaryColor: '#6366f1',
    trailLength: 40,
    trailWidth: 8,
    trailTaper: 0.8,
    followSpeed: 0.26,
    glowIntensity: 2.3,
    glowSpread: 1.2,
    hotspot: 0.65,
    brightness: 1.25,
    opacity: 1,
    pulseSpeed: 4,
    noiseStrength: 0.035,
    idleFade: true,
    idleTimeout: 700,
    fadeDuration: 900
  }

  /* ---------- 入口 ---------- */

  function mount(header) {
    if (header.querySelector('.glow-canvas')) return
    if (isReducedMotion()) return

    const canvas = document.createElement('canvas')
    canvas.className = 'glow-canvas'
    header.insertBefore(canvas, header.firstChild)

    let gl
    try {
      gl = canvas.getContext('webgl', { alpha: true })
        || canvas.getContext('experimental-webgl')
      if (!gl) throw new Error('no webgl')
    } catch (e) { canvas.remove(); return }

    let program
    try { program = createProgram(gl) } catch (e) { console.warn('[glow]', e); canvas.remove(); return }

    gl.clearColor(0, 0, 0, 0)
    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(program)

    // 全屏三角形
    const tri = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, tri)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uvBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 2, 0, 0, 2]), gl.STATIC_DRAW)
    const aUv = gl.getAttribLocation(program, 'uv')
    gl.enableVertexAttribArray(aUv)
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0)

    const U = {
      res: gl.getUniformLocation(program, 'uResolution'),
      points: gl.getUniformLocation(program, 'uPoints[0]'),
      count: gl.getUniformLocation(program, 'uPointCount'),
      color: gl.getUniformLocation(program, 'uColor'),
      color2: gl.getUniformLocation(program, 'uSecondaryColor'),
      width: gl.getUniformLocation(program, 'uTrailWidth'),
      taper: gl.getUniformLocation(program, 'uTaper'),
      glowI: gl.getUniformLocation(program, 'uGlowIntensity'),
      glowS: gl.getUniformLocation(program, 'uGlowSpread'),
      hot: gl.getUniformLocation(program, 'uHotspot'),
      bright: gl.getUniformLocation(program, 'uBrightness'),
      op: gl.getUniformLocation(program, 'uOpacity'),
      pulse: gl.getUniformLocation(program, 'uPulseSpeed'),
      noise: gl.getUniformLocation(program, 'uNoiseStrength'),
      time: gl.getUniformLocation(program, 'uTime'),
      fade: gl.getUniformLocation(program, 'uFade')
    }

    // 每帧要推的着色器常量
    gl.uniform1f(U.width, CFG.trailWidth)
    gl.uniform1f(U.taper, CFG.trailTaper)
    gl.uniform1f(U.glowI, CFG.glowIntensity)
    gl.uniform1f(U.glowS, CFG.glowSpread)
    gl.uniform1f(U.hot, CFG.hotspot)
    gl.uniform1f(U.bright, CFG.brightness)
    gl.uniform1f(U.op, CFG.opacity)
    gl.uniform1f(U.pulse, CFG.pulseSpeed)
    gl.uniform1f(U.noise, CFG.noiseStrength)
    const c1 = hexToRgb(CFG.color)
    const c2 = hexToRgb(CFG.secondaryColor)
    gl.uniform3f(U.color, c1[0], c1[1], c1[2])
    gl.uniform3f(U.color2, c2[0], c2[1], c2[2])

    const pointData = new Float32Array(MAX_POINTS * 2)
    const points = Array.from({ length: MAX_POINTS }, () => ({ x: 0, y: 0 }))
    let target = { x: 0, y: 0 }
    let head = { x: 0, y: 0 }
    let initialized = false
    let pointerInside = false
    let fade = 0
    let lastInput = performance.now()
    let lastFrame = 0
    let raf = 0
    let destroyed = false

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.max(header.clientWidth, 1)
      const h = Math.max(header.clientHeight, 1)
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(U.res, canvas.width, canvas.height)
    }

    function initTrail(x, y) {
      target = { x, y }; head = { x, y }
      for (let i = 0; i < MAX_POINTS; i++) { points[i].x = x; points[i].y = y }
      initialized = true
      fade = 1
    }

    function updatePointer(e) {
      const rect = header.getBoundingClientRect()
      const x = clamp(e.clientX - rect.left, 0, rect.width)
      // 着色器里 y 向上，故翻转
      const y = clamp(rect.height - (e.clientY - rect.top), 0, rect.height)
      if (!initialized) initTrail(x, y)
      target.x = x; target.y = y
      pointerInside = true
      lastInput = performance.now()
    }

    function onLeave() {
      pointerInside = false
      lastInput = performance.now()
    }

    const ro = new ResizeObserver(resize)
    ro.observe(header)
    header.addEventListener('pointermove', updatePointer)
    header.addEventListener('pointerenter', updatePointer)
    header.addEventListener('pointerleave', onLeave)
    resize()

    function frame(now) {
      if (destroyed || !canvas.isConnected) { cleanup(); return }
      raf = requestAnimationFrame(frame)
      const dt = lastFrame ? Math.min((now - lastFrame) / 16.667, 3) : 1
      lastFrame = now

      if (initialized) {
        const headEase = 1 - Math.pow(1 - clamp(CFG.followSpeed, 0.01, 0.99), dt)
        const chainBase = clamp(0.28 + CFG.followSpeed * 0.35, 0.08, 0.92)
        const chainEase = 1 - Math.pow(1 - chainBase, dt)
        head.x += (target.x - head.x) * headEase
        head.y += (target.y - head.y) * headEase
        points[0].x = head.x; points[0].y = head.y
        for (let i = 1; i < MAX_POINTS; i++) {
          points[i].x += (points[i - 1].x - points[i].x) * chainEase
          points[i].y += (points[i - 1].y - points[i].y) * chainEase
        }
        for (let i = 0; i < MAX_POINTS; i++) {
          pointData[i * 2] = points[i].x
          pointData[i * 2 + 1] = points[i].y
        }
        gl.uniform2fv(U.points, pointData)
      }

      const idleFor = now - lastInput
      const shouldFade = CFG.idleFade && (!pointerInside || idleFor > CFG.idleTimeout)
      const fadeTarget = initialized && !shouldFade ? 1 : 0
      const step = (16.667 * dt) / Math.max(CFG.fadeDuration, 16)
      fade += (fadeTarget - fade) * Math.min(1, step * 7)

      gl.uniform1f(U.count, clamp(Math.round(CFG.trailLength), 2, MAX_POINTS))
      gl.uniform1f(U.time, now * 0.001)
      gl.uniform1f(U.fade, fade)

      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    function cleanup() {
      destroyed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      header.removeEventListener('pointermove', updatePointer)
      header.removeEventListener('pointerenter', updatePointer)
      header.removeEventListener('pointerleave', onLeave)
    }

    raf = requestAnimationFrame(frame)
  }

  function init() {
    const header = document.querySelector('#page-header.full_page')
    if (header) mount(header)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
