/* =====================================================
   nav-buttons.js —— 顶栏导航按钮的点按水波涟漪
   事件委托，兼容 pjax/动态插入；对 #menus 内的站点按钮生效。
   ===================================================== */
(function () {
  'use strict'

  // 按钮选择器：顶栏菜单项 + 搜索按钮 + 侧栏分组展开钮
  const BTN_SELECTOR = [
    '#nav #menus a.site-page',
    '#nav #menus span.site-page.group',
    '#nav #search-button .site-page'
  ].join(',')

  // 减少动画偏好：直接不渲染涟漪
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function spawnRipple(btn, x, y) {
    if (prefersReducedMotion) return
    const rect = btn.getBoundingClientRect()
    // 以点按点为圆心扩散，半径取按钮宽高的较大者
    const size = Math.max(rect.width, rect.height) * 1.1
    const ripple = document.createElement('span')
    ripple.className = 'nav-ripple'
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = x - size / 2 + 'px'
    ripple.style.top = y - size / 2 + 'px'
    btn.appendChild(ripple)
    ripple.addEventListener('animationend', function remove() {
      ripple.removeEventListener('animationend', remove)
      ripple.remove()
    })
  }

  function onPointerDown(e) {
    // 只响应鼠标主键 / 触屏，忽略右键
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    spawnRipple(btn, e.clientX - rect.left, e.clientY - rect.top)
  }

  // 用事件委托绑定到 document，保证 pjax / 后加载内容也生效
  document.addEventListener('pointerdown', function (e) {
    const btn = e.target && e.target.closest
      ? e.target.closest(BTN_SELECTOR)
      : null
    if (!btn) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const rect = btn.getBoundingClientRect()
    spawnRipple(btn, e.clientX - rect.left, e.clientY - rect.top)
  })
})()
