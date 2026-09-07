# XuPengFei 博客（Hexo + Butterfly）· 代码索引

徐鹏飞的个人博客。参考 https://blog.lris625.top/（同款引擎 Hexo + Butterfly）。部署到 GitHub Pages，地址 `https://xpfqdlg.github.io/blog/`。

## 1. 文件清单

| 路径 | 作用 |
| :--- | :--- |
| `_config.yml` | Hexo 站点配置：标题 XuPengFei、副标题、`root: /blog/`、语言/时区、searchdb |
| `_config.butterfly.yml` | Butterfly 主题覆盖配置（最小覆盖，Hexo 自动 deep-merge 到主题默认之上）。导航菜单、暗色、统计、搜索、giscus、inject |
| `package.json` | 依赖与脚本（`npm run dev/build/clean/new`）；含 `hexo` 字段，hexo-cli 据此识别工程 |
| `.github/workflows/deploy.yml` | push main → 装依赖 → clone 主题 → `hexo generate` → 部署 Pages |
| `source/_posts/*.md` | 博客文章（Markdown，front-matter 带 categories/tags） |
| `source/tags/index.md` | 标签页（`layout: page`、`type: tags`） |
| `source/categories/index.md` | 分类页（`layout: page`、`type: categories`） |
| `source/links/index.md` | 友情链接页（`layout: page`、`type: link`） |
| `source/_data/link.yml` | 友链数据（想上链就改这里） |
| `source/css/custom.css` | 自定义样式：顶栏菜单胶囊按钮化、首页 Orb hero 尺寸 |
| `source/js/orb-hero.js` | 首页发光球动画（纯 WebGL，零依赖，移植自 Orb.jsx 的 GLSL） |
| `source/js/nav-buttons.js` | 顶栏按钮点按水波涟漪（事件委托，几十行） |
| `source/img/avatar.svg` | 站点头像/图标占位（XPF 徽标，可自行替换） |
| `source/img/hero.png` | 首页占位透明图（仅用于让主题渲染 home hero，被 Orb 覆盖） |
| `scaffolds/*.md` | `hexo new` 用的文章/页面模板 |
| `themes/butterfly/` | 主题（**不入库**，git 忽略；本地与 CI 各自 clone） |

## 2. 入口说明

- 首页 = 自动生成的最近文章列表页（由 `source/_posts/` 驱动）
- 每篇文章在 `source/_posts/<名称>.md`，front-matter 写标题/日期/分类/标签/摘要
- 顶栏五个按钮：首页 / 时间轴(/archives/) / 分类 / 标签 / 友情链接
- 自定义效果入口：`_config.butterfly.yml` 底部 `inject` 段挂载 `custom.css` 与两个 JS

## 3. 运行方式

```bash
# 首次：装依赖 + 拉主题（代理或镜像二选一）
npm install
git clone --depth 1 -b master https://github.com/jerryc127/hexo-theme-butterfly.git themes/butterfly
# GitHub 直连不行就换镜像：
# git clone --depth 1 -b master https://gitee.com/immyw/hexo-theme-butterfly.git themes/butterfly

npm run dev      # 本地预览 → http://localhost:4000/blog/
npm run build    # 生成静态站到 public/
npm run new -- "文章标题"   # 新建文章草稿模板
```

## 4. 依赖清单

- Node.js ≥ 20.19（开发机 24 实测通过）
- npm 包：`hexo`、`hexo-server`、`hexo-renderer-pug`、`hexo-renderer-stylus`、`hexo-renderer-marked`、`hexo-generator-searchdb`、`hexo-generator-index/archive/category/tag`
- 主题：`hexo-theme-butterfly`（5.7.0，git clone，不入库）
- 运行期第三方（页面加载，来自 CDN）：FontAwesome 图标、不蒜子访问统计、typed 打字机（主题内置）

## 5. 上线与更新

- 仓库：`XpfQdlg/blog`（公开）。GitHub 仓库 Settings → Pages → Source 选 **GitHub Actions**
- 写新文章 → `git push` main → Actions 自动构建部署 → `https://xpfqdlg.github.io/blog/`
- 本机 push 走代理：`git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 push origin main`

## 6. 待办（尚未启用）

- [ ] **giscus 评论**：本仓库建好并公开后，去 giscus.app 依 repo 拿 `repo_id`/`category_id`，回填 `_config.butterfly.yml` 的 `comments.use: Giscus` 与 giscus 段
- [ ] 头像换成真人照片（替换 `source/img/avatar.svg` 路径即可）
- [ ] 主页 README 加一个到博客的跳转按钮
