# 个人主页框架 · 水下 Y2K 皮肤

一套零依赖、零构建的静态个人主页骨架，视觉是 iPhone 4 时期的水晶质感 + Y2K 网页风格：浅海阳光、果冻玻璃窗口、Aqua 渐变按钮。双击 `index.html` 就能看，也可以直接部署到 GitHub Pages、Vercel 或任意静态服务器。

- 纯 HTML + CSS + 原生 JS，没有 npm 依赖，不会因为工具链升级而烂掉
- 浅海场景：明快的海水渐变 + 水面波光 + 太阳光晕 + 斜射光束，全部用 CSS 实现
- 像素彩蛋：Minecraft 风格的方块气泡、像素星光，连主题切换按钮都是像素月亮 / 像素太阳
- 玻璃面板 + 窗口标题栏（红黄绿三个圆点），像一堆浮在水里的旧窗口
- 明暗双主题：白天浅海 / 夜晚深海，跟随系统也可手动切换并记住选择
- 响应式布局，手机端有下拉菜单
- 首页 / 文章列表 / 文章详情三个页面，文章排版样式齐全

---

## 目录结构

```
.
├── index.html              单屏门户（标题 + 三个入口，不用滚动）
├── tutorials.html          教程列表
├── resources.html          资源列表
├── links.html              相关网站
├── post.html               教程正文页（同时是教程模板）
├── assets/
│   ├── css/style.css       全部样式：场景、玻璃组件、文章排版
│   ├── js/main.js          全部交互，约 280 行，无依赖
│   └── img/
│       ├── avatar.png      头像（顶栏用，128×128）
│       └── favicon.svg     站点图标
└── README.md
```

## 本地预览

最简单：双击 `index.html`。

想更接近线上环境（相对路径、`fetch` 等行为一致），在目录里起一个静态服务器：

```bash
python -m http.server 8000
# 然后打开 http://localhost:8000
```

Node 环境也可以用 `npx serve .`。

---

## 五步改成你自己的

### 1. 改名字和文案

三个 HTML 文件里搜索 `你的名字`、`hello@example.com`，逐个替换。页面里带 `✏️` 注释的地方就是需要你填的占位内容。

### 2. 换头像

把照片放进 `assets/img/`（比如 `me.jpg`），然后修改 `index.html` 里这一段：

```html
<img src="assets/img/me.jpg" alt="我的照片" width="320" height="320" />
```

图片建议裁成正方形，`width` / `height` 保持 320 即可（CSS 会自适应）。头像是「贴在窗口里的照片」：白色边框、轻微倾斜，鼠标悬停会摆正——想关掉这个效果，删掉 `.hero__portrait` 上的 `transform` 就行。

### 3. 加一个作品

复制 `index.html` 中的 `<article class="card">…</article>` 整块，改标题、描述和标签。卡片的链接把 `href="#"` 换成线上地址或仓库地址。

### 4. 加一篇文章

```bash
# 复制模板（新文件名直接用 post- 前缀，和 index.html 放在同一目录）
cp post.html post-my-new-post.html     # Windows: copy post.html post-my-new-post.html
```

> 文章页不要放进子目录。页面里的 `assets/...` 是相对路径，放进子目录后需要改成 `../assets/...`，不如统一放在根目录省事。

然后：

1. 在新文件里改 `<title>`、`<h1>`、日期和正文；
2. 删掉 `<a class="post__back">` 之后的演示内容，写入你自己的段落；
3. 在 `blog.html` 里复制一个 `<li class="post-item">`，把链接指向 `post-my-new-post.html`；
4. 首页 `index.html` 的「最近写了什么」也可以同步加一条。

> 文章正文区在 `<div class="prose">` 内，`h2 / h3 / p / ul / blockquote / pre>code / table / img` 都已有现成样式，直接写标签即可。

### 5. 换配色与水色

所有颜色集中在 `assets/css/style.css` 顶部的 `:root`，深色主题在紧随其后的 `:root[data-theme="dark"]`，两处一起改：

| 变量 | 作用 |
| --- | --- |
| `--ink` / `--ink-2` / `--ink-3` | 正文 / 次要文字 / 弱化文字 |
| `--accent` / `--accent-2` | 强调色（链接、药丸标签、悬停） |
| `--panel` / `--panel-strong` | 玻璃面板底色（第二个更实，用于页头） |
| `--panel-line` / `--panel-gloss` | 面板描边 / 顶部高光 |
| `--radius` | 面板圆角 |
| `--edge` | 页面左右留白 |
| `--container` | 内容最大宽度 |

水的颜色不在这张表里，单独写在场景里：

- `.scene` 的 `background` —— 水面的太阳光晕 + 从浅到深的海水渐变，改这几个色标就能换一片海；
- `.scene__rays` —— 斜射下来的光束（`repeating-linear-gradient` + 模糊）；
- `.scene__caustics` —— 水底游动的光斑；
- `.bubble` —— 一颗从 Minecraft 截图里抠出来的 8×8 像素气泡（透明 PNG），显示尺寸 32 / 40px；
- `.sparkle` —— 水面上闪烁的像素星光。

气泡只放在页面两侧露出的水面上（宽度 ≥ 1024px 时生成），这样它们不会从玻璃窗边缘「切」成半个。数量、速度在 `main.js` 的 `initBubbles` 里改，默认 18 颗气泡 + 10 颗星光。

想直接用一张真实的水下照片当背景，把 `.scene` 的 `background` 换成 `url("../img/water.jpg") center / cover no-repeat`，再把 `.scene__rays` 的不透明度降到 0.2 左右即可（照片放 `assets/img/`）。

---

## 部署

### GitHub Pages（免费，最省事）

1. 新建仓库，把本目录所有文件推到 `main` 分支；
2. 仓库 Settings → Pages → Source 选 `Deploy from a branch`，分支选 `main`、目录选 `/ (root)`；
3. 等一两分钟，访问 `https://<用户名>.github.io/<仓库名>/`。

如果站点部署在子路径（`/仓库名/`），当前写法不用改：所有资源都是相对路径。

### Vercel / Netlify

把仓库连进去，构建命令留空，输出目录填 `.`（根目录）即可。

### 自己的服务器

把整个目录丢到 Nginx / Apache 的站点根目录，不要额外配置。

---

## 已内置的细节

- **主题**：`<head>` 里的内联脚本在渲染前读取 `localStorage` 或系统偏好，避免深色模式闪白；手动切换后写回 `localStorage`。
- **无 JS 降级**：菜单、内容、链接都是真实 HTML；滚动出现的动画只在 JS 可用时才隐藏内容，脚本失效时照常阅读。
- **可访问性**：跳转链接、`aria-expanded` / `aria-pressed`、键盘 Esc 关闭菜单、`focus-visible` 焦点环。
- **动效开关**：系统开启「减少动态效果」时，气泡与星光不生成、水波和光束停止、内容直接显示。
- **SEO 基线**：`lang`、`title`、`description`、`theme-color`、Open Graph 已就位。

## 版本与回退

项目有两层保险：**本地快照**（离线、秒回退）和 **GitHub 提交历史**（云端、可看每一次改动）。

仓库地址：<https://github.com/heidao0928/first-site>

| 想做什么 | 怎么做 |
| --- | --- |
| 改之前 | 双击 **`备份.cmd`**，`版本存档/` 里会多一个带时间戳的 zip |
| 改坏了 | 双击 **`恢复.cmd`**，选编号、输入 `y` |
| 改完想同步到 GitHub | 双击 **`推送.cmd`** |
| 想看看改了什么 | 打开 **`CHANGELOG.md`**，或仓库的 Commits 页面 |
| 让 AI 接手 | 先把 **`AGENTS.md`** 和 **`CHANGELOG.md`** 发给它 |

快照只包含站点文件（三个 HTML、`assets/`、README 与两份说明），不含 `preview/` 截图和 `版本存档/` 本身，所以每个只有几十 KB。

恢复时，当前内容会先被挪到 `_恢复前_日期/` 再解压旧版本——万一恢复错了，还能从这个目录找回来；确认没问题后手动删掉它即可。

> 想要逐行对比、分支、推到 GitHub 这种真正的版本控制，需要装 Git：在终端运行 `winget install Git.Git`，之后把「改完提交」当作备份习惯即可。

## 想让 ChatGPT 帮忙？

它看不到这台电脑，也读不到你和我的对话，所以需要你把东西递过去：

1. 把 `AGENTS.md`（项目规矩）和 `CHANGELOG.md`（改动历史）贴进对话，让它先读再动手；
2. 要改哪个文件，就把那个文件贴过去；或者把整个项目压成 zip 上传；
3. 它给的建议由你在本地执行——执行前先双击 `备份.cmd`。

长期一点的做法：把项目放到 GitHub，把仓库链接发给 ChatGPT（需要它开启联网 / 代码连接功能），它就能直接读代码和提交历史，不用你来回粘贴。

## 想继续扩展时

- **RSS**：新增 `feed.xml`，在 `<head>` 里加 `<link rel="alternate" type="application/rss+xml" href="feed.xml">`。
- **评论**：接入 Giscus（基于 GitHub Discussions）只需在文章页底部加一段脚本，无需后端。
- **统计**：Vercel Analytics 或 Umami，一行脚本。
- **文章自动生成**：内容多起来之后，可以迁到 Astro / Eleventy，HTML 结构可以整段搬过去。
- **作品详情页**：照 `post.html` 复制，把正文换成项目截图和过程说明。
