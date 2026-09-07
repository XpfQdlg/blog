/* =====================================================
   specular-button.js —— 高光按钮（Specular 风格）
   鼠标移动时，按钮上的高光锥跟随指针（CSS 变量实现），
   松软如一道擦过的光泽。用法：任意 <a class="specular-btn">。
   无需 WebGL，纯 CSS 高光，深浅色主题通用。
   ===================================================== */
(function () {
  'use strict'

  function bind(btn) {
    if (btn.dataset.specularBound) return
    btn.dataset.specularBound = '1'

    const update = e => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      btn.style.setProperty('--mx', x.toFixed(1) + 'px')
      btn.style.setProperty('--my', y.toFixed(1) + 'px')
    }
    const reset = () => {
      btn.style.removeProperty('--mx')
      btn.style.removeProperty('--my')
    }

    btn.addEventListener('pointermove', update)
    btn.addEventListener('pointerleave', reset)
  }

  function init() {
    const btns = document.querySelectorAll('.specular-btn')
    btns.forEach(bind)
  }

  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init)
    } else {
      init()
    }
  }
  boot()
  // 主题若开启 pjax：切页后重新绑定
  document.addEventListener('pjax:complete', init)
})()
