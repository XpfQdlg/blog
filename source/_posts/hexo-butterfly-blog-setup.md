---
title: 从零搭一个 Hexo + Butterfly 博客
date: 2026-09-07 20:30:00
updated: 2026-09-07 20:30:00
categories: 项目开发
tags:
  - Hexo
  - Butterfly
  - GitHub Pages
  - 建站
description: 这篇记录了我自己博客的搭建过程：选型、踩的坑、以及怎么部署。它本身就是一篇"项目开发"文章。
---

这篇博客是怎么来的？简单说：我想有一个能长期更新的个人网站，于是把它搭起来了，顺便把过程记下来。它就是本博客的第一篇文章。

## 为什么搭一个博客

我学网络空间安全，平时折腾不少东西。写博客的好处：

- 逼自己把过程讲清楚，讲清楚才算真的会
- 留下时间线，几年后回看能看见自己怎么长起来的
- 项目写多了，面试和考研复试都是活的证明材料

## 选型：VitePress？Hexo？Next？

我一度在三个方向里纠结：

| 方案 | 优点 | 缺点 |
| :--- | :--- | :--- |
| VitePress | Vue 生态、现代、写 Markdown 就出站 | 文档型工具，做博客要自己搭首页/标签 |
| **Hexo + Butterfly** | 博客功能开箱即用、中文教程多、成熟个人博客同款 | 学到的不是主流前端框架 |
| Next.js | 很酷、能完全自定义 | 内容管道全要自己写，工程量大 |

最后选了 Hexo + Butterfly。理由就一条：**我想要的那种个人博客观感，成熟同款已经替我做出来了**，直接用同一套引擎还原度最高、折腾最少。

## 搭建过程（含踩坑记录）

本机是 Windows 11 + Node.js 24 + npm 11。下面是真实执行过的命令。

### 1. 建工程目录、装依赖

```bash
mkdir XpfQdlg-blog && cd XpfQdlg-blog
npm init -y
npm i hexo hexo-renderer-pug hexo-renderer-stylus hexo-generator-searchdb
npm i -D hexo-server hexo-renderer-marked
```

两个**坑**，逐个说：

**坑 1：Markdown 渲染器要自己装。** 我以为 Hexo 自带 Markdown 支持，结果没装 `hexo-renderer-marked` 之前，`source` 里的 `.md` 页面全被当成普通文件原样拷走，根本不渲染成网页。补装后一切正常。

**坑 2：package.json 要有 `hexo` 字段。** 用 `hexo generate` 时报错只打印 help 命令列表，命令根本进不去。查了半天，原来 hexo-cli 是靠 package.json 里的 `hexo.version` 字段来识别"这里是一个 Hexo 工程"的——这个字段只有 `hexo init` 才自动生成。手搭的话要自己补：

```json
"hexo": {
  "version": "8.1.2"
}
```

### 2. 装主题 Butterfly

官方推荐 `git clone` 到 `themes/butterfly`：

```bash
git clone -b master https://github.com/jerryc127/hexo-theme-butterfly.git themes/butterfly
```

**坑 3：直连 GitHub 失败，走 Gitee 镜像。** 我的 git 配置了本地代理 127.0.0.1:7897，但当天代理没开，clone 失败。官方 README 里恰好有国内镜像，换成它一步到位：

```bash
git clone -b master https://gitee.com/immyw/hexo-theme-butterfly.git themes/butterfly
```

### 3. 配置站点与主题

站点配置在 `_config.yml`，主题配置单独放在根目录 `_config.butterfly.yml`。

**坑 4：忘了写 `theme: butterfly`。** 配好一堆主题参数后生成，页面全是"empty"，日志刷 `No layout`。原因很蠢：站点配置里没指定用哪个主题，Hexo 找不到 Butterfly 的模板。补一行即好：

```yaml
theme: butterfly
```

主题的参数我用的是**最小覆盖文件**：Hexo 会把根目录 `_config.butterfly.yml` 深合并（deep-merge）到主题默认配置之上，所以只写我想改的键就够了，主题本体一个文件都不用动。这对我很重要：主题目录被 git 忽略，之后想升级、想重装都不会丢自定义。

```yaml
# _config.butterfly.yml（节选）
menu:
  首页: / || fas fa-home
  时间轴: /archives/ || fas fa-archive
  分类: /categories/ || fas fa-folder-open
  标签: /tags/ || fas fa-tags
  友情链接: /links/ || fas fa-link
```

顶栏菜单我额外做成了**胶囊按钮 + 点按水波动画**：不引任何库，纯 CSS 的 `currentColor` 半透明底、配合一段几十行的 JS 事件委托画涟漪。代码都在 `source/css/custom.css` 和 `source/js/` 里。

### 4. 首页的发光球

这是我加的一点私货：把之前在别的项目里见过的那个 React 组件（`Orb.jsx`）里的 **GLSL 着色器**抽出来，包了一个约 100 行的纯 WebGL 壳，做成首页 hero 的背景。没有引 React、没有引 ogl，一个 `canvas` + 一段 shader 就能跑，离线可用。

它做的事情：首页存在 `#page-header.full_page` 时，插入一个铺满的画布，把站点标题和副标题盖在发光球之上，鼠标靠近球体会让它旋转。

> 技术点：Doom 光卡（light card）、simplex 噪声、YIQ 色相旋转，都在那一段 fragment shader 里。以后单独写一篇拆解它。

## 部署：GitHub Pages

- 源码仓库公开为 `XpfQdlg/blog`
- GitHub Actions 在每次 push main 时：装依赖 → 生成静态站 → 推到 Pages
- 站点根路径是 `/blog/`，所以 `_config.yml` 里 `root: /blog/`
- 本机预览地址是 `http://localhost:4000/blog/`（Hexo Server 会按 root 挂载）

完整配置和命令都放在仓库根目录的 `INDEX.md` 里。

## 小结

搭一个博客，真正费时间的从来不是写博客，而是想清楚"我要一个什么样的地方"。剩下的 Hexo + Butterfly 帮你解决九成。把这次的过程记下来，等这个博客长大后再回来看，会很有意思。
