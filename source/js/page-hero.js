/* =====================================================
   page-hero.js —— /archives 与 /links 顶部的紫色横幅
   给这两个页面在导航栏与正文之间插入一整块紫色渐变横幅：
   - 时间轴页：横幅内放 InfiniteSpiral 动画（由 infinite-spiral.js
     挂进 #archive-spiral-deco），下面是原时间轴列表
   - 友链页：横幅内放"申请友链"高光按钮，下面是友链列表
   目的：让动效待在"顶部蓝条"里，不跟内容混在一起。
   ===================================================== */
(function () {
  'use strict'

  const LINK_URL = 'https://github.com/XpfQdlg/blog/discussions'

  function isArchive() {
    return /\/archives\/?$/.test(window.location.pathname) ||
      !!document.getElementById('archive')
  }
  function isLinks() {
    return /\/links\/?$/.test(window.location.pathname) ||
      !!document.querySelector('#page .flink')
  }

  function build() {
    const bodyWrap = document.getElementById('body-wrap')
    const main = document.querySelector('main#content-inner')
    if (!bodyWrap || !main) return
    if (bodyWrap.querySelector('.page-hero')) return

    const archive = isArchive()
    const links = isLinks()
    if (!archive && !links) return

    const hero = document.createElement('section')
    hero.className = 'page-hero'

    const inner = document.createElement('div')
    inner.className = 'page-hero__inner'

    const title = document.createElement('h1')
    title.className = 'page-hero__title'

    const sub = document.createElement('p')
    sub.className = 'page-hero__sub'

    const deco = document.createElement('div')

    if (archive) {
      hero.dataset.kind = 'archive'
      title.textContent = '时间轴'
      const n = document.querySelectorAll(
        '#archive a.article-sort-item-title'
      ).length
      sub.textContent = '全部文章 ' + n + ' 篇，沿时间一路往上'
      deco.className = 'page-hero__deco'
      deco.id = 'archive-spiral-deco'
    } else {
      hero.dataset.kind = 'links'
      title.textContent = '友情链接'
      sub.textContent = '欢迎交换友链，点下面的按钮去博客仓库留言即可'
      deco.className = 'page-hero__deco'
      const btn = document.createElement('a')
      btn.className = 'specular-btn'
      btn.href = LINK_URL
      btn.target = '_blank'
      btn.rel = 'noopener'
      btn.textContent = '✉️ 申请友链'
      deco.appendChild(btn)
    }

    inner.appendChild(title)
    inner.appendChild(sub)
    inner.appendChild(deco)
    hero.appendChild(inner)

    // 插在正文（main）之前，横幅占满整行、动画不进正文流
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
