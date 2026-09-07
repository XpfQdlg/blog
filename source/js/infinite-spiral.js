/* =====================================================
   infinite-spiral.js —— 时间轴 Hero 内的螺旋动画
   只把卡片画进 #page-hero 的动画层 #archive-spiral-deco
   （由 page-hero.js 创建），标题在 Hero 内容层、不会被挡。
   数据来源：归档列表里已有文章链接，不重复维护。
   ===================================================== */
(function () {
  'use strict'

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max)
  const modulo = (v, d) => ((v % d) + d) % d
  const smoothstep = (min, max, value) => {
    const x = clamp((value - min) / (max - min || 1), 0, 1)
    return x * x * (3 - 2 * x)
  }

  const CARD_W = 168
  const CARD_H = 64

  const CFG = {
    speed: 0.6,
    radius: 150,
    verticalSpacing: 78,
    perspective: 1000,
    cardsPerTurn: 7,
    rotation: 0,
    cardTilt: 0,
    cardRadius: 14,
    centerScale: 1.15,
    edgeFade: 0.3,
    edgeBlur: 6,
    pauseOnHover: true
  }

  function isReducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function mount() {
    const deco = document.getElementById('archive-spiral-deco')
    const archive = document.getElementById('archive')
    if (!deco || !archive) return
    if (deco.querySelector('.blog-spiral')) return
    const anchors = Array.prototype.slice.call(
      archive.querySelectorAll('a.article-sort-item-title')
    )
    if (anchors.length < 1) return

    const root = document.createElement('div')
    root.className = 'blog-spiral'
    const stage = document.createElement('div')
    stage.className = 'blog-spiral__stage'
    root.appendChild(stage)
    deco.appendChild(root)

    const items = anchors.map(a => ({
      href: a.getAttribute('href'),
      title: a.getAttribute('title') || a.textContent.trim() || ''
    }))
    const cards = items.map(item => {
      const card = document.createElement('a')
      card.className = 'blog-spiral__item'
      card.href = item.href
      card.setAttribute('aria-label', item.title)
      const span = document.createElement('span')
      span.className = 'blog-spiral__text'
      span.textContent = item.title
      card.appendChild(span)
      stage.appendChild(card)
      return card
    })

    const count = items.length
    const half = count / 2
    let progress = 0
    let targetProgress = 0
    let autoSpeed = 0
    let spinOffset = 0
    let hovered = false
    let visible = true
    let prevT = 0
    let raf = 0
    let destroyed = false

    const io = new IntersectionObserver(
      entries => { visible = entries[0].isIntersecting },
      { threshold: 0.02 }
    )
    io.observe(deco)

    const onEnter = () => { hovered = true }
    const onLeave = () => { hovered = false }
    deco.addEventListener('mouseenter', onEnter)
    deco.addEventListener('mouseleave', onLeave)

    function frame(t) {
      if (destroyed || !stage.isConnected) { cleanup(); return }
      raf = requestAnimationFrame(frame)
      const delta = prevT ? Math.min((t - prevT) / 1000, 0.05) : 0.016
      prevT = t

      const motionPaused = hovered && CFG.pauseOnHover
      const desired = visible && !motionPaused && !isReducedMotion()
        ? CFG.speed : 0
      const blend = 1 - Math.exp(-delta * 7)
      autoSpeed += (desired - autoSpeed) * blend
      targetProgress += autoSpeed * delta
      const follow = 1 - Math.exp(-delta * 11)
      progress += (targetProgress - progress) * follow

      const width = Math.max(deco.clientWidth, 1)
      const height = Math.max(deco.clientHeight, 1)
      const fit = Math.min(1, width / (CARD_W * 2.8), height / (CARD_H * 2.35))
      const responsiveRadius =
        Math.min(CFG.radius, Math.max(72, width * 0.36)) * fit
      const fadeStart = clamp(1 - CFG.edgeFade, 0, 0.98)
      const turnSize = Math.max(CFG.cardsPerTurn, 1)
      if (count < turnSize) spinOffset = (spinOffset + delta * 42) % 360

      for (let i = 0; i < count; i++) {
        const card = cards[i]
        let offset = i - progress
        offset = modulo(offset + half, count) - half

        const edge = Math.min(Math.abs(offset) / Math.max(half, 1), 1)
        const opacity = 1 - smoothstep(fadeStart, 1, edge)
        const focus = 1 - Math.min(
          Math.abs(offset) / Math.max(turnSize * 0.65, 1), 1
        )
        const scale = (1 + (CFG.centerScale - 1) * focus) * fit
        const angle = offset * (360 / turnSize) + CFG.rotation + spinOffset
        const rad = (angle * Math.PI) / 180
        const x = Math.sin(rad) * responsiveRadius
        const z = Math.cos(rad) * responsiveRadius
        const depthScale = clamp(
          CFG.perspective / Math.max(CFG.perspective - z, 1), 0.72, 1.45
        )
        const visualScale = scale * depthScale
        const blur = CFG.edgeBlur * smoothstep(0.35, 1, edge)

        card.style.transform =
          'translate(-50%, -50%) translate3d(' + x + 'px, ' +
          (offset * CFG.verticalSpacing * fit) + 'px, 0) rotateZ(' +
          CFG.cardTilt + 'deg) scale(' + visualScale + ')'
        card.style.opacity = opacity.toFixed(3)
        card.style.filter = blur > 0.01 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none'
      }
    }

    function cleanup() {
      destroyed = true
      cancelAnimationFrame(raf)
      io.disconnect()
      deco.removeEventListener('mouseenter', onEnter)
      deco.removeEventListener('mouseleave', onLeave)
    }

    if (isReducedMotion()) {
      prevT = 0
      raf = requestAnimationFrame(t => { frame(t); cancelAnimationFrame(raf) })
    } else {
      raf = requestAnimationFrame(frame)
    }
  }

  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount)
    } else {
      mount()
    }
  }
  boot()
  document.addEventListener('pjax:complete', mount)
})()
