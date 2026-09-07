/* =====================================================
   page-hero.js —— 内容页顶部统一 Hero（#page-hero，静态）
   作用范围：时间轴(/archives)、分类(/categories)、
            标签(/tags)、友情链接(/links)。
   说明：这里只负责“紫色 Hero 条 + 居中标题”，不含动画；
         动画只在首页（orb-hero / glow-cursor）。
   ===================================================== */
(function () {
  'use strict'

  const PAGES = {
    '/archives': {
      title: '时间轴',
      sub: function () {
        const n = document.querySelectorAll(
          '#archive a.article-sort-item-title'
        ).length
        return '全部文章 ' + n + ' 篇 · 沿时间一路向上'
      }
    },
    '/categories': { title: '分类', sub: '按主题归档' },
    '/tags': { title: '标签', sub: '按关键词检索' },
    '/links': { title: '友情链接', sub: '欢迎交换友链' }
  }

  function match() {
    const path = window.location.pathname
    for (const key in PAGES) {
      if (path === key || path.indexOf(key + '/') > -1) {
        return { key, ...PAGES[key] }
      }
    }
    return null
  }

  function build() {
    const info = match()
    if (!info) return
    const bodyWrap = document.getElementById('body-wrap')
    const main = document.querySelector('main#content-inner')
    if (!bodyWrap || !main) return
    if (bodyWrap.querySelector('#page-hero')) return

    const hero = document.createElement('section')
    hero.id = 'page-hero'

    const content = document.createElement('div')
    content.className = 'hero__content'
    const h1 = document.createElement('h1')
    h1.className = 'hero__title'
    h1.textContent = info.title
    const p = document.createElement('p')
    p.className = 'hero__sub'
    p.textContent = typeof info.sub === 'function' ? info.sub() : info.sub

    content.appendChild(h1)
    content.appendChild(p)
    hero.appendChild(content)

    // 标题已在 Hero 内居中，隐藏主题正文里重复打印的页面标题
    document.body.classList.add('with-hero')
    bodyWrap.insertBefore(hero, main)
  }

  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', build)
    } else {
      build()
    }
  }
  boot()
  document.addEventListener('pjax:complete', build)
})()
