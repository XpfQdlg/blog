# XuPengFei 的小博客

> Do not remain silent after a single failure.

个人博客源码。基于 **Hexo + Butterfly**，部署到 GitHub Pages。

- 站点：<https://xpfqdlg.github.io/blog/>
- 代码索引：见 [`INDEX.md`](./INDEX.md)

## 快速开始

```bash
npm install
git clone --depth 1 -b master https://github.com/jerryc127/hexo-theme-butterfly.git themes/butterfly
npm run dev      # http://localhost:4000/blog/
```

写文章：在 `source/_posts/` 加一个 `.md`，push 到 `main` 即自动上线。

## 仓库结构

- 主题目录 `themes/butterfly` 不入库（`.gitignore`），由 CI 构建时现拉，保证仓库干净可复现
- 自定义都在 `_config.butterfly.yml`（主题覆盖配置）+ `source/css/custom.css` + `source/js/`（首页 Orb 发光球、导航按钮涟漪）
