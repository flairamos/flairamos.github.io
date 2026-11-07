# flairamos.github.io

flairamos 的个人主页。纯 HTML / CSS / JavaScript，无构建步骤、无前端框架，直接部署在 GitHub Pages。

## 页面结构

| 区块 | 内容 |
| --- | --- |
| `#home` | GitHub 头像、flairamos 名字、后端工程师定位与简短介绍 |
| `#about` | 个人介绍、技术栈、工作方式，以及本地头像 |
| `#service` | 后端开发、全栈交付、毕业设计支持、技术咨询，统一邮箱入口 |
| `#project` | 从 GitHub 同步的项目卡片，支持按语言筛选 |
| `#review` | 工作经历、教育经历与正在学习的方向 |
| `#contact` | 大号邮箱 CTA 与 GitHub / Gitee 链接 |

导航保持参考稿的 `Home / About / Service / Project / Review` 与 `Let's Collaborate` 按钮。按需求，点击 `Home` 会先回到首屏，停留约 1.4 秒后自动平滑滚动到 `About`；用户如果在停留期间滚动或按键，会自动取消这次跳转。相关代码在 `assets/js/main.js` 的 “Home → About” 注释块中，删除该段即可关闭自动跳转。

## 本地预览

因为项目列表需要请求 `data/projects.json`，建议用本地 HTTP 服务打开，而不是双击 `index.html`：

```bash
python -m http.server 8788
```

然后访问 <http://127.0.0.1:8788/>。

## GitHub 项目同步

项目区采用四层策略，兼顾实时性与稳定性：

1. **实时请求**：页面打开时请求 `https://api.github.com/users/flairamos/repos`，过滤 fork 与 profile 仓库，展示优先项目和最新更新时间。
2. **本地缓存**：成功同步后缓存到 `localStorage`，5 分钟内再次打开直接使用缓存，避免浪费 GitHub 匿名 API 的 60 次/小时额度。
3. **离线快照**：请求失败或超过匿名额度时，自动读取 `data/projects.json`，所以页面不会出现空列表。
4. **定时快照**：`.github/workflows/sync-projects.yml` 每 6 小时用 GitHub Actions 运行一次 `scripts/sync-projects.mjs`，提交新的 `data/projects.json`。也可以在 Actions 页面手动触发 `Sync GitHub projects`。

项目排序在 `assets/js/main.js` 的 `PRIORITY` 数组中配置；如果以后想展示更多仓库，把仓库名加入数组即可。默认最多展示 8 个，修改 `MAX_PROJECTS` 可调整。

## 修改内容

- 文案：直接编辑 `index.html`。
- 颜色、字体、间距：`assets/css/style.css` 顶部的 CSS 变量与对应区块。
- 头像：替换 `assets/img/flairamos-avatar.jpg`，或在 HTML 中修改图片路径。
- 邮箱：全局搜索 `flairamos@outlook.com` 替换。
- 项目快照：运行 `node scripts/sync-projects.mjs`，或等 GitHub Actions 自动更新。

## 部署

仓库推送到 `main` 分支后，在 GitHub 仓库的 **Settings → Pages** 中选择从 `main` 分支根目录部署即可。新增的 `.github/workflows/sync-projects.yml` 需要仓库允许 Actions 写入：

**Settings → Actions → General → Workflow permissions → Read and write permissions**。

如果不想让 Action 自动提交，可以停用该 workflow；页面仍会使用实时请求 + 本地快照。
