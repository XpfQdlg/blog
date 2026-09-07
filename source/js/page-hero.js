/* =====================================================
   page-hero.js —— 内容页顶部统一蓝色 Hero（#page-hero）
   作用范围：时间轴(/archives)、分类(/categories)、
            标签(/tags)、友情链接(/links) 四类页面。
   （首页走主题自带的 #page-header.full_page，效果同类。）

   结构：
     #page-hero                    蓝色渐变 Hero
       ├─ 动画层 .hero-fx           z-index:0（装饰/背景）
       └─ .hero__content            z-index:1（标题、副标题，居中）

   动画选择：
     时间轴 → InfiniteSpiral（螺旋），挂在 #archive-spiral-deco
     其余   → Orb 发光球，由 orb-hero.js 挂进 [data-fx='orb'] 的 hero

   标题永远在动画之上、居中显示，动画不遮挡文字。
   ===================================================== */
(function () {
  'use strict'

  const HERO_PAGES = {
    '/archives': { title: '时间轴', sub: '沿时间一路向上', fx: 'spiral' },
    '/categories': { title: '分类', sub: '按主题归档', fx: 'orb' },
    '/tags': { title: '标签', sub: '按关键词检索', fx: 'orb' },
    '/links': { title: '友情链接', sub: '欢迎交换友链', fx: 'orb' }
  }

  function matchKind() {
    const path = window.location.pathname
    for (const key in HERO_PAGES) {
      // 站点挂在子路径下（如 /blog/archives/），故用“包含”而非“前缀”
      if (path === key || path.indexOf(key + '/') > -1) {
        return { key, ...HERO_PAGES[key] }
      }
    }
    return null
  }

  function countArticles() {
    return document.querySelectorAll(
      '#archive a.article-sort-item-title'
    ).length
  }

  function build() {
    const info = matchKind()
    if (!info) return
    const bodyWrap = document.getElementById('body-wrap')
    const main = document.querySelector('main#content-inner')
    if (!bodyWrap || !main) return
    if (bodyWrap.querySelector('#page-hero')) return

    const hero = document.createElement('section')
    hero.id = 'page-hero'
    hero.dataset.fx = info.fx

    // 动画层（装饰）：z0
    const fx = document.createElement('div')
    fx.className = 'hero-fx'
    if (info.fx === 'spiral') {
      fx.id = 'archive-spiral-deco'
    }
    hero.appendChild(fx)

    // 内容层：z1，居中
    const content = document.createElement('div')
    content.className = 'hero__content'
    const h1 = document.createElement('h1')
    h1.className = 'hero__title'
    h1.textContent = info.title

    let sub = info.sub
    if (info.key === '/archives') sub = '全部文章 ' + countArticles() + ' 篇 · ' + sub
    const p = document.createElement('p')
    p.className = 'hero__sub'
    p.textContent = sub

    content.appendChild(h1)
    content.appendChild(p)
    hero.appendChild(content)

    // 隐藏主题在该类页正文里重复输出的标题（title 已在 Hero 内居中展示）
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
