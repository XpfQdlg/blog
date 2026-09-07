/* =====================================================
   footer-tags.js —— 页脚标签胶囊
   拉取 /blog/data/tags.json（由 scripts/tags-json.js 构建时生成），
   在页脚版权行下方渲染一组圆角标签胶囊（悬浮动画）。
   拉取失败时静默跳过，不影响页面。
   ===================================================== */
(function () {
  'use strict'

  const ROOT = '/blog/'

  function render(tags) {
    const footer = document.getElementById('footer')
    if (!footer || !tags || tags.length === 0) return
    const other = footer.querySelector('.footer-other')
    if (!other) return

    // 已渲染过则不重复
    if (footer.querySelector('.footer-tags')) return

    const block = document.createElement('div')
    block.className = 'footer-tags'

    const label = document.createElement('div')
    label.className = 'footer-tags__label'
    label.textContent = '标签'
    block.appendChild(label)

    const list = document.createElement('div')
    list.className = 'footer-tags__list'
    tags.forEach((tag, index) => {
      const a = document.createElement('a')
      a.className = 'footer-tag'
      a.href = tag.url
      a.style.animationDelay = (index * 30) + 'ms'
      a.innerHTML = '<span class="footer-tag__name"></span>' +
                    '<span class="footer-tag__count"></span>'
      a.querySelector('.footer-tag__name').textContent = tag.name
      a.querySelector('.footer-tag__count').textContent = tag.count
      list.appendChild(a)
    })
    block.appendChild(list)
    other.appendChild(block)
  }

  function load() {
    fetch(ROOT + 'data/tags.json')
      .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(json => render(json.tags))
      .catch(() => { /* 忽略：无网络/构建期文件不存在时静默 */ })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load)
  } else {
    load()
  }
})()
