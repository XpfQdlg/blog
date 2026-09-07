/* =====================================================
   orb-hero.js —— 首页 hero 的发光球动画（纯 WebGL，零依赖）
   移植自 D:\Desktop\test 里的 React+ogl Orb 组件：
   ogl 只是外壳，真正的画面是这段 GLSL 着色器。
   这里用手写的迷你 WebGL 程序渲染同一段 shader，
   不引 React、不引 ogl、无外部资源，可离线运行。

   使用前提：页面里存在 #page-header.full_page（首页 hero）。
   若浏览器不支持 WebGL，直接回退到 CSS 渐变背景，不影响观感。
   ===================================================== */
(function () {
  'use strict'

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
    uniform float iTime;
    uniform vec3 iResolution;
    uniform float hue;
    uniform float hover;
    uniform float rot;
    uniform float hoverIntensity;
    uniform vec3 backgroundColor;
    varying vec2 vUv;

    vec3 rgb2yiq(vec3 c) {
      float y = dot(c, vec3(0.299, 0.587, 0.114));
      float i = dot(c, vec3(0.596, -0.274, -0.322));
      float q = dot(c, vec3(0.211, -0.523, 0.312));
      return vec3(y, i, q);
    }
    vec3 yiq2rgb(vec3 c) {
      float r = c.x + 0.956 * c.y + 0.621 * c.z;
      float g = c.x - 0.272 * c.y - 0.647 * c.z;
      float b = c.x - 1.106 * c.y + 1.703 * c.z;
      return vec3(r, g, b);
    }
    vec3 adjustHue(vec3 color, float hueDeg) {
      float hueRad = hueDeg * 3.14159265 / 180.0;
      vec3 yiq = rgb2yiq(color);
      float cosA = cos(hueRad);
      float sinA = sin(hueRad);
      float i = yiq.y * cosA - yiq.z * sinA;
      float q = yiq.y * sinA + yiq.z * cosA;
      yiq.y = i;
      yiq.z = q;
      return yiq2rgb(yiq);
    }

    vec3 hash33(vec3 p3) {
      p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
      p3 += dot(p3, p3.yxz + 19.19);
      return -1.0 + 2.0 * fract(vec3(
        p3.x + p3.y,
        p3.x + p3.z,
        p3.y + p3.z
      ) * p3.zyx);
    }

    float snoise3(vec3 p) {
      const float K1 = 0.333333333;
      const float K2 = 0.166666667;
      vec3 i = floor(p + (p.x + p.y + p.z) * K1);
      vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
      vec3 e = step(vec3(0.0), d0 - d0.yzx);
      vec3 i1 = e * (1.0 - e.zxy);
      vec3 i2 = 1.0 - e.zxy * (1.0 - e);
      vec3 d1 = d0 - (i1 - K2);
      vec3 d2 = d0 - (i2 - K1);
      vec3 d3 = d0 - 0.5;
      vec4 h = max(0.6 - vec4(
        dot(d0, d0),
        dot(d1, d1),
        dot(d2, d2),
        dot(d3, d3)
      ), 0.0);
      vec4 n = h * h * h * h * vec4(
        dot(d0, hash33(i)),
        dot(d1, hash33(i + i1)),
        dot(d2, hash33(i + i2)),
        dot(d3, hash33(i + 1.0))
      );
      return dot(vec4(31.316), n);
    }

    vec4 extractAlpha(vec3 colorIn) {
      float a = max(max(colorIn.r, colorIn.g), colorIn.b);
      return vec4(colorIn.rgb / (a + 1e-5), a);
    }

    const vec3 baseColor1 = vec3(0.611765, 0.262745, 0.996078);
    const vec3 baseColor2 = vec3(0.298039, 0.760784, 0.913725);
    const vec3 baseColor3 = vec3(0.062745, 0.078431, 0.600000);
    const float innerRadius = 0.6;
    const float noiseScale = 0.65;

    float light1(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * attenuation);
    }
    float light2(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * dist * attenuation);
    }

    vec4 draw(vec2 uv) {
      vec3 color1 = adjustHue(baseColor1, hue);
      vec3 color2 = adjustHue(baseColor2, hue);
      vec3 color3 = adjustHue(baseColor3, hue);

      float ang = atan(uv.y, uv.x);
      float len = length(uv);
      float invLen = len > 0.0 ? 1.0 / len : 0.0;

      float bgLuminance = dot(backgroundColor, vec3(0.299, 0.587, 0.114));

      float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
      float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
      float d0 = distance(uv, (r0 * invLen) * uv);
      float v0 = light1(1.0, 10.0, d0);

      v0 *= smoothstep(r0 * 1.05, r0, len);
      float innerFade = smoothstep(r0 * 0.8, r0 * 0.95, len);
      v0 *= mix(innerFade, 1.0, bgLuminance * 0.7);
      float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;

      float a = iTime * -1.0;
      vec2 pos = vec2(cos(a), sin(a)) * r0;
      float d = distance(uv, pos);
      float v1 = light2(1.5, 5.0, d);
      v1 *= light1(1.0, 50.0, d0);

      float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
      float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);

      vec3 colBase = mix(color1, color2, cl);
      float fadeAmount = mix(1.0, 0.1, bgLuminance);

      vec3 darkCol = mix(color3, colBase, v0);
      darkCol = (darkCol + v1) * v2 * v3;
      darkCol = clamp(darkCol, 0.0, 1.0);

      vec3 lightCol = (colBase + v1) * mix(1.0, v2 * v3, fadeAmount);
      lightCol = mix(backgroundColor, lightCol, v0);
      lightCol = clamp(lightCol, 0.0, 1.0);

      vec3 finalCol = mix(darkCol, lightCol, bgLuminance);

      return extractAlpha(finalCol);
    }

    vec4 mainImage(vec2 fragCoord) {
      vec2 center = iResolution.xy * 0.5;
      float size = min(iResolution.x, iResolution.y);
      vec2 uv = (fragCoord - center) / size * 2.0;

      float angle = rot;
      float s = sin(angle);
      float c = cos(angle);
      uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

      uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
      uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);

      return draw(uv);
    }

    void main() {
      vec2 fragCoord = vUv * iResolution.xy;
      vec4 col = mainImage(fragCoord);
      gl_FragColor = vec4(col.rgb * col.a, col.a);
    }
  `

  /* ---------- 迷你 WebGL 工具 ---------- */

  function createShader(gl, type, source) {
    const sh = gl.createShader(type)
    gl.shaderSource(sh, source)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error('shader compile error: ' + gl.getShaderInfoLog(sh))
    }
    return sh
  }

  function createProgram(gl, vert, frag) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vert)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, frag)
    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('link error: ' + gl.getProgramInfoLog(program))
    }
    return program
  }

  function hexToRgb(color) {
    if (color && color[0] === '#') {
      const r = parseInt(color.slice(1, 3), 16) / 255
      const g = parseInt(color.slice(3, 5), 16) / 255
      const b = parseInt(color.slice(5, 7), 16) / 255
      return [r, g, b]
    }
    return [0, 0, 0]
  }

  function isReducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /* ---------- 入口 ---------- */

  function mount(header) {
    // 已有则跳过（防重复注入）
    if (header.querySelector('.orb-canvas')) return

    const canvas = document.createElement('canvas')
    canvas.className = 'orb-canvas'
    header.insertBefore(canvas, header.firstChild)

    let gl
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
        || canvas.getContext('experimental-webgl')
      if (!gl) throw new Error('no webgl')
    } catch (err) {
      // 不支持 WebGL：删掉画布，保留 CSS 渐变背景即可
      canvas.remove()
      return
    }

    let program
    try {
      program = createProgram(gl, VERT, FRAG)
    } catch (err) {
      console.warn('[orb]', err)
      canvas.remove()
      return
    }

    // 全屏三角形：覆盖视口，uv 0..1
    const positions = new Float32Array([-1, -1, 3, -1, -1, 3])
    const uvs = new Float32Array([0, 0, 2, 0, 0, 2])
    const buffer = gl.createBuffer()
    const uvBuffer = gl.createBuffer()
    gl.useProgram(program)

    const aPosition = gl.getAttribLocation(program, 'position')
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(aPosition)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

    const aUv = gl.getAttribLocation(program, 'uv')
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(aUv)
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0)

    const uniforms = {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      hue: gl.getUniformLocation(program, 'hue'),
      hover: gl.getUniformLocation(program, 'hover'),
      rot: gl.getUniformLocation(program, 'rot'),
      hoverIntensity: gl.getUniformLocation(program, 'hoverIntensity'),
      backgroundColor: gl.getUniformLocation(program, 'backgroundColor')
    }

    const HOVER_INTENSITY = 0.2
    const bg = hexToRgb('#000000')

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = header.clientWidth || 1
      const h = header.clientHeight || 1
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform3f(
        uniforms.iResolution,
        canvas.width, canvas.height, canvas.width / Math.max(canvas.height, 1)
      )
    }

    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.uniform1f(uniforms.hoverIntensity, HOVER_INTENSITY)
    gl.uniform3f(uniforms.backgroundColor, bg[0], bg[1], bg[2])

    let rafId = 0
    let lastT = 0
    let hoverAmt = 0
    let targetHover = 0
    let currentRot = 0
    const ROTATION_SPEED = 0.3

    function pointerUV(x, y) {
      const rect = header.getBoundingClientRect()
      const px = x - rect.left
      const py = y - rect.top
      const size = Math.min(rect.width, rect.height)
      const cx = rect.width / 2
      const cy = rect.height / 2
      const uvx = ((px - cx) / size) * 2
      const uvy = ((py - cy) / size) * 2
      return Math.sqrt(uvx * uvx + uvy * uvy) < 0.8 ? 1 : 0
    }
    function onMove(e) { targetHover = pointerUV(e.clientX, e.clientY) }
    function onLeave() { targetHover = 0 }
    function onTouch() { targetHover = 1 }

    header.addEventListener('pointermove', onMove)
    header.addEventListener('pointerleave', onLeave)

    function frame(t) {
      if (!canvas.isConnected) { cleanup(); return }
      rafId = requestAnimationFrame(frame)
      const dt = lastT ? (t - lastT) * 0.001 : 0
      lastT = t

      const reduced = isReducedMotion()
      if (reduced) targetHover = 0

      hoverAmt += (targetHover - hoverAmt) * 0.1
      if (targetHover > 0.5) currentRot += dt * ROTATION_SPEED

      gl.uniform1f(uniforms.iTime, t * 0.001)
      gl.uniform1f(uniforms.hover, hoverAmt)
      gl.uniform1f(uniforms.rot, currentRot)
      gl.uniform1f(uniforms.hue, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      if (reduced) { cleanup(); }
    }

    function cleanup() {
      cancelAnimationFrame(rafId)
      header.removeEventListener('pointermove', onMove)
      header.removeEventListener('pointerleave', onLeave)
      gl.getExtension('WEBGL_lose_context') && gl.getExtension('WEBGL_lose_context').loseContext()
    }

    resize()
    window.addEventListener('resize', resize)
    rafId = requestAnimationFrame(frame)
  }

  function init() {
    // 首页 hero：存在 #page-header.full_page 才挂载
    const header = document.querySelector('#page-header.full_page')
    if (header) mount(header)
  }

  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init)
    } else {
      init()
    }
  }
  boot()
  // 主题若开启 pjax：切页后重新挂载
  document.addEventListener('pjax:complete', init)
})()
