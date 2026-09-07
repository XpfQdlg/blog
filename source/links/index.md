---
title: 友情链接
date: 2026-09-07 00:00:00
layout: page
type: link
comments: false
page_hero: false
---

<div class="links-cta">
  <p>欢迎交换友链。点下面的按钮，到博客仓库开一个 Issue（标题写「友链申请」），按格式留言，审核后即上链。</p>
  <a class="specular-btn" href="https://github.com/XpfQdlg/blog/issues/new?title=%E5%8F%8B%E9%93%BE%E7%94%B3%E8%AF%B7" target="_blank" rel="noopener">✉️ 申请友链</a>
</div>

留言格式（name / link / avatar / descr 缺一不可）：

```text
名称：
网址：
一句话介绍：
头像：
```

站点数据维护在 `source/_data/link.yml`（格式见下）。首个友链位虚位以待。

```yaml
- class_name: 小伙伴
  class_desc: 一起学习一起折腾的人
  link_list: []
    # 想上链的，按下面格式在 link_list 里加一条（name/link/avatar/descr 缺一不可）：
    # - name: 某某
    #   link: https://example.com
    #   avatar: https://example.com/avatar.png
    #   descr: 一句话介绍
```
