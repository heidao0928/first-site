# 给 AI 助手的接手说明

这个项目是一个**纯静态个人主页**（HTML + CSS + 原生 JS，无构建、无依赖）。
任何人或 AI 接手前，请先读这份文件和 `CHANGELOG.md`，再动文件。

## 硬性约束

1. **不引入构建步骤或 npm 依赖**，页面必须能双击 `index.html` 直接打开。
2. 所有资源用**相对路径**（站点可能部署在 GitHub Pages 的子路径下）。
3. 颜色、圆角、间距一律走 `assets/css/style.css` 顶部的 CSS 变量，不要在组件里写死颜色。
4. **只有浅色一套主题**（2026-10-31 起取消暗色模式，`data-theme` 已移除）；但 `prefers-reduced-motion` 降级必须保留。
5. 文案用中文；**不要出现沙滩、沙子、暖黄色**——用户明确要求「水下，不能有沙滩」。
6. 改完必须用浏览器自查：首页、一篇文章页、390px 手机宽度，各看一眼。

## 设计要点（不要轻易推翻）

- **首页是单屏门户**：`.page-hub` + `.hub` 两栏（左介绍、右入口），桌面端 `height: 100svh; overflow: hidden`，不允许出现滚动条；手机端自动堆叠、允许轻微滚动。改字号/间距时必须回来确认 1366×768 和 1920×963 都不溢出。
- 导航固定为：首页 / 教程 / 资源 / 相关网站，对应 `index.html`、`tutorials.html`、`resources.html`、`links.html`；正文模板是 `post.html`。
- 背景是一张实拍水面照（`assets/img/bg-water.jpg`），铺在固定的 `.scene` 上（`center / cover`），`.scene::after` 是四周白色柔化，用来掩盖底图分辨率。原来的光束 `.scene__rays`、光斑 `.scene__caustics`、颗粒 `.scene__grain`、气泡 `.scene__bubbles`、光点 `.sparkle` 目前都设了 `display: none`，想恢复删掉对应规则即可。新加的层只允许动 transform/opacity，别用 filter/background-position 做动画。
- 页面内容是一层层「玻璃窗」：`.hero / .section / .page-head / .post`，每块顶部有 `.window-bar`（红黄绿三个点的标题栏）。
- 气泡用的是 **Minecraft 里的 8×8 像素精灵**（从游戏截图里抠出来、去掉深蓝底后转成透明 PNG，内联成 data URI），尺寸只有 32px / 40px 两种，**只在窗口宽度 ≥ 1024px、且两侧水面 ≥ 90px 时生成**。
- 气泡位置不是按视口百分比，而是用 `.hero` 的实际宽度算出内容栏边缘，再贴着窗口外侧 12–110px 生成（见 `initBubbles`）；改内容栏宽度时这里会跟着变。
- 原素材的浅蓝色（`#6fccf7`）在浅海水面上几乎看不见，所以把右下那半圈压深成了 `#3f9fd0`，并加了一圈 1px 深色描影。想完全还原原色，改 `.bubble` 里的 data URI 即可（`版本存档/` 与 git 历史里都有替换前的版本）。
- 文章页的排版在 `.prose` 里，代码块是深色终端样式。

## 内容数据

- 教程：`assets/data/tutorials.js`（`window.TUTORIAL_DATA`），`items` 里每条 `{cover,title,cats[],link}`，`featured` 是「全部」置顶的封面顺序，`catFeatured` 是分类置顶 `{ana:brio:...}`。教程页由 `initTutorialData()` 渲染出宫格和两个置顶区，改数据即可改页面。
- 资源：`assets/data/resources.js`；公告：`assets/data/notices.js`。
- 后台 `admin.html` 的「教程」页可增删改教程、上传封面（自动压成 720 宽 WebP）、设置全部置顶与分类置顶。

## 修改流程

1. 动手前先跑一次 `备份.cmd`（或在 `版本存档/` 里确认有今天的快照）。
2. 小步改：一次只改一件事，改完立刻在浏览器里看效果。
3. 在 `CHANGELOG.md` 最上面加一条：日期 / 改了什么 / 为什么。
4. 改坏了就跑 `恢复.cmd`，选上一个快照；恢复前的状态会自动留在 `_恢复前_日期/`。
5. 满意后跑 `推送.cmd`，提交并推送到 <https://github.com/heidao0928/first-site>。

## 版本控制

- 仓库：`git@github.com:heidao0928/first-site.git`（SSH 走 `ssh.github.com:443`，见 `~/.ssh/config`）。
- 本机 Git 是便携版：`D:\tools\git\cmd\git.exe`，已加入用户 PATH。
- 提交前会跑 `git add -A`，`.gitignore` 已排除 `preview/`、`版本存档/`、`_恢复前_*/`。

## 常见坑

- 面板是半透明的（`--panel`），背景元素会透出来；不要把动画元素放到会被面板遮挡的位置。
- 改 `.scene` 的背景会影响整页氛围，改完在桌面和手机上各看一眼。
- 文件保存为无 BOM 的 UTF-8；Windows 下用 PowerShell 写中文时注意编码。
- `.gitignore` 里忽略了 `preview/` 和 `版本存档/`，不要把它们提交进去。
