# 黑岛摄影手册

FF14「拍照科技」相关的个人站点：教程索引、资源下载、相关网站，外加一个不用服务器的后台（GitHub Contents API）。

零依赖、零构建，纯 HTML + CSS + 原生 JS，双击 `index.html` 就能看，部署在 GitHub Pages。

- 线上：<https://heidao0928.github.io/first-site/>
- 仓库：<https://github.com/heidao0928/first-site>

---

## 页面

| 文件 | 内容 |
| --- | --- |
| `index.html` | 单屏门户：左「摄影手册 + 公告 / 致谢」，右「内容入口」 |
| `tutorials.html` | 教程宫格：分类筛选、搜索、4 个全部置顶、分类置顶、分页 15 条 |
| `resources.html` | 资源表：名称 / 类型 / 说明 / 附件（下载或网盘提取码） |
| `links.html` | 相关网站 + 友情代挂群号 + 自制 mod 推荐 |
| `admin.html` | 后台：总管理 / 公告 / 致谢 / 下载链接 / 教程 |
| `post.html` | 文章模板（目前是示例内容，未接入导航） |
| `404.html` | 找不到页面时的提示（GitHub Pages 会自动使用） |

---

## 目录结构

```
.
├── index.html / tutorials.html / resources.html / links.html / post.html / 404.html
├── admin.html                 后台（token 存在浏览器 localStorage，别外传）
├── assets/
│   ├── css/style.css          全部样式
│   ├── js/
│   │   ├── main.js            前台交互：导航、筛选、分页、搜索、链接挂载、公告、致谢
│   │   ├── admin.js           后台：资源表读写
│   │   ├── notices-admin.js   后台：公告
│   │   ├── thanks-admin.js    后台：致谢
│   │   └── tutorials-admin.js 后台：教程增删 / 封面上传 / 置顶
│   ├── data/
│   │   ├── tutorials.js       教程数据（含分类、链接、置顶）
│   │   ├── resources.js       资源表
│   │   ├── notices.js         公告
│   │   └── thanks.js          致谢名单
│   └── img/
│       ├── bg-water.jpg       背景水面
│       ├── covers/cNN.webp    教程封面（720 宽 WebP）
│       └── tips-bg.webp       TIPS 卡背景
├── robots.txt / sitemap.xml
├── tools/                     截图、推送脚本
└── CHANGELOG.md / AGENTS.md
```

---

## 内容怎么改

**推荐用后台**：打开 `/admin.html`，粘贴一个带 `repo` 权限的 GitHub token（只存在本机浏览器里），之后：

- **公告**：改首页公告，保存后约 1 分钟生效
- **致谢**：加一行名字 / 备注 / 链接
- **下载链接**：改资源表
- **教程**：改标题、勾分类（可多选）、填小红书链接、设「全部置顶」与「分类置顶」、上下移动排序、删除、新建（选图会自动压成 720 宽 WebP 再上传）

**也可以直接改数据文件**：`assets/data/*.js` 都是 `window.XXX = {...}` 的形式，改完提交即可。

> 教程页由 `assets/data/tutorials.js` 渲染，`tutorials.html` 里不要再手写卡片。

---

## 本地预览

双击 `index.html` 即可。想更接近线上：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

手机端预览（桌面看手机效果）：`preview/mobile-preview.html`（本地文件，不进仓库）。

---

## 部署

推送到 `main` 分支，GitHub Pages 会自动构建（约 1–2 分钟）。仓库设置里 Pages 来源为 `main` / 根目录。

常用脚本：

- `推送.cmd` —— 提交并推送（自动处理远端冲突）
- `同步.cmd` —— 拉取后台提交的改动
- `备份.cmd` / `恢复.cmd` —— 本地快照

---

## 约定

- 不引构建步骤、不引 npm 依赖，所有资源用相对路径
- 颜色 / 圆角 / 间距走 `style.css` 顶部的 CSS 变量
- 只有浅色主题；`prefers-reduced-motion` 降级必须保留
- 动画只动 `transform` / `opacity`
- 视觉：浅海水下 + 拟态玻璃（磨砂、边缘高光、斜向反光），不要沙滩 / 暖黄色
