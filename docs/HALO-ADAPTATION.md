# Halo Theme Next 开发文档

| 项目 | 内容 |
| --- | --- |
| 文档状态 | Alpha v0.1 |
| 最后更新 | 2026-11-04 |
| 目标 Halo | `2.27.2` |
| 最低兼容版本 | `>=2.26.0`（待完成 2.26.x 回归） |
| 目标 Thymeleaf | `3.1.3` |
| 上游视觉与资源基线 | [next-theme/hexo-theme-next](https://github.com/next-theme/hexo-theme-next) `v8.29.0` |
| 工程基线 | [halo-dev/theme-vite-starter](https://github.com/halo-dev/theme-vite-starter) |
| 当前主题版本 | `1.0.0-alpha.1` |

## 1. 项目定位

本仓库是 NexT 的 Halo 2 重写版，不是一个在原主题上继续打补丁的迁移分支。

目标边界：

- 复用 NexT 的视觉资产、四套 scheme、CSS 变量、动画和通用前端交互。
- 使用 Halo Thymeleaf 重新实现页面结构、数据绑定、路由、分页、评论、菜单和配置。
- 不移植 Hexo 的 Nunjucks 模板、helper、配置结构和专用分页机制。
- 旧仓库不再继续维护，所有新功能进入当前仓库。

当前实现已经覆盖核心内容路由、友链、图库、瞬间和首页富文本文章流，并通过真实 Halo 2.27.2 页面渲染验证。距离稳定发布仍缺少许可证确认、2.26.x 回归和浏览器级视觉回归自动化。

## 2. 技术决策

### 2.1 是否使用 Vite

使用 Vite，但 Vite 只负责构建工程，不替代 Halo 运行时。

采用理由：

- NexT 带有大量 CSS、JS、字体和图片，需要统一的资源打包、hash 和缓存失效机制。
- 页面壳层、页头、页脚和文章卡片需要在构建期复用，减少 Thymeleaf 模板重复。
- 官方 `@halo-dev/vite-plugin-halo-theme` 已覆盖 `src/ -> templates/`、静态资源和多页入口。
- `@halo-dev/theme-package-cli` 可以直接生成可安装的主题 ZIP。

明确边界：

| 能力 | Vite 构建期 | Thymeleaf 运行时 |
| --- | --- | --- |
| 页面壳层复用 | `<include>`、`<slot>` | `th:replace`、`th:insert` |
| 静态资源 | 打包、hash、复制 `public/` | `@{...}`、`#theme.assets()` |
| 内容数据 | 不可用 | `post`、`singlePage`、`posts`、Finder API |
| 菜单/分类层级 | 不可用 | `children` 递归 |
| 评论与插件注入 | 不可用 | `<halo:comment>`、`<halo:footer />` |

Vite 不会把 Nunjucks 自动转换成 Thymeleaf，也不会替代 Halo 的权限、路由、评论和插件能力。

### 2.2 为什么新开仓库

旧项目同时存在旧版 Halo API、半成品模板、Hexo 专用逻辑和大量隐式依赖。继续修补会导致：

- `settings.yaml` 和模板字段难以保持一致。
- 评论、分页和菜单修复之间互相影响。
- 无法判断问题来自上游资产还是 Halo 适配层。

新仓库以官方 Vite starter 为工程骨架，从页面契约开始重建，旧仓库只作为视觉和资源参考。

## 3. 运行架构

```text
src/                   源码，开发时修改这里
├── *.html             页面入口
├── error/*.html       错误页入口
├── partials/          仅构建期 include，不直接输出
├── modules/           运行时 Thymeleaf 片段，输出到 templates/modules/
├── css/               Halo 适配样式入口
└── js/                主题脚本入口

public/                原样复制到 templates/
└── assets/            NexT scheme CSS、字体、图片、上游 JS

templates/             构建产物，Halo 实际读取，禁止手改
dist/                  主题包输出，禁止手改
```

关键规则：

1. 页面和片段只修改 `src/`。
2. `src/partials/` 使用 Vite 的 `<include>` / `<slot>`，不会输出。
3. `src/modules/` 使用 Thymeleaf `th:fragment`，构建后输出到 `templates/modules/`。
4. `public/` 只放需要原样发布的静态资源。
5. `templates/` 可以通过 `pnpm build-only` 重复生成，不纳入修复范围。
6. 主题安装目录名必须是 `theme-next`，与 `theme.yaml` 的 `metadata.name` 一致。

## 4. Halo 契约

### 4.1 页面布局

`src/partials/shell.html` 声明：

```html
<html
  xmlns:th="https://www.thymeleaf.org"
  th:fragment="html(head, content)"
>
```

`src/layout.html` 通过 `<include>` 生成 `templates/layout.html`。Halo 当前返回：

```json
{
  "state": "SUPPORTED",
  "reason": "LayoutTemplateSupported",
  "template": "templates/layout.html"
}
```

修改公共页面壳层时，必须同时检查首页和一个详情页，避免只验证单一模板。

### 4.2 核心路由

| 模板 | 路由示例 | 主要变量 | 状态 |
| --- | --- | --- | --- |
| `index.html` | `/` | `posts` | 已实现 |
| `post.html` | `/archives/{slug}` | `post`、`haloCommentEnabled` | 已实现 |
| `page.html` | 自定义单页地址 | `singlePage`、`haloCommentEnabled` | 已实现 |
| `archives.html` | `/archives` | `archives` | 已实现 |
| `tags.html` | `/tags` | `tags` | 已实现 |
| `tag.html` | `/tags/{slug}` | `tag`、`posts` | 已实现 |
| `categories.html` | `/categories` | `categories` | 已实现 |
| `category.html` | `/categories/{slug}` | `category`、`posts` | 已实现 |
| `author.html` | `/authors/{name}` | `author`、`posts` | 已实现 |
| `links.html` | `/links`、`/links?group=...` | `groups`、`simpleGroups`、`links`、`group`、`linkApplicationEnabled`、`csrfToken` | 已实现，依赖 Links 插件 |
| `photos.html` | `/photos` | `photos`、`groups`、`photoUrl` | 已实现，依赖 Photos 插件 |
| `photo.html` | `/photos/{name}` | `photo`、`prev`、`next`、`neighbors`、`position` | 已实现，依赖 Photos 插件 |
| `moments.html` | `/moments`、`/moments?tag=...` | `moments`、`tags`、`title` | 已实现，依赖 Moments 插件 |
| `moment.html` | `/moments/{name}` | `moment`、`title` | 已实现，依赖 Moments 插件 |
| `error/*.html` | HTTP 4xx/5xx | `error` | 已实现 |

#### 首页文章流

首页文章卡片不再只输出纯文本摘要，而是通过 `postFinder.content(post.metadata.name)` 获取 Halo 已渲染的正文 HTML，并使用 `th:utext` 输出。因此 Markdown 生成的标题、图片、链接、列表、引用、代码块等内容会按与文章详情一致的结构显示。

相关配置：

- `post.index_content=html`：渲染正文 HTML，默认值，推荐。
- `post.index_content=text`：只显示纯文本摘要，保留给低带宽或纯摘要场景。
- `post.index_image`：控制文章封面。封面只读取 `post.spec.cover`，不会从正文第一张图片重复生成封面。
- `post.excerpt_description`：缺失时按开启处理，兼容升级前已保存的主题配置。

插件页面说明：

- 三个插件通过 Halo Console 安装并启用，版本分别为 Links `2.5.0`、Photos `2.1.2`、Moments `1.19.0`。
- 插件页面模板使用插件提供的 Finder 数据和路由变量；未安装或停用插件时，对应入口应通过菜单移除或返回插件自身的 404。
- 已实测 `200`：`/links`、`/links?group=test-link-group`、`/photos`、`/photos/{name}`、`/moments`、`/moments?tag=...`、`/moments/{name}`。
- 友链申请使用 Links 插件原生 Form 契约：验证码 `GET /links/apply/captcha`，提交 `POST /links/apply/submit`，成功回跳 `/links?applied=success`。
- 已在 Halo `2.27.2` + Links `2.5.0` 完成端到端验证：CSRF、图形验证码、字段校验、`303` 回跳、后台 `PENDING` 申请记录和错误字段回填均正常。
- 申请表单只在 `linkApplicationEnabled=true` 时渲染。该变量要求插件设置中同时开启“启用友链申请”和“允许访客提交”。

### 4.3 菜单

Halo 菜单使用 `MenuFinder` 获取，`MenuItem` 通过 `children` 表达层级。

实现位置：

- 数据入口：`src/partials/header.html`
- 递归片段：`src/modules/menu-tree.html`

模块入口配置：

- 友链、图库、瞬间没有独立的页面入口开关，统一由 Halo 菜单控制。
- 需在 Console → 菜单中添加 `/links`、`/photos`、`/moments`，并在“基础设置 → 菜单设置”中选择该菜单。
- 三个入口分别依赖 Links、Photos、Moments 插件；未安装或停用时不应保留入口。
- `halo_menu` 的默认值只对首次安装生效，升级后需在主题设置中确认已选择正确的菜单。

约束：

- 不读取旧版 `spec.parent` 手动拼树。
- 图标来自 MenuItem annotation `icon_class`。
- 外链同样经过 `@{...}` 处理。
- 已用二级、三级菜单在真实 Halo 中验证。

### 4.4 分类树

分类通过 `category.children` 递归。

实现位置：

- 数据入口：`src/categories.html`
- 递归片段：`src/modules/category-tree.html`

数量使用根级 `category.postCount`，不使用旧版 `category.status.postCount`。

### 4.5 分页

统一使用 Halo `ListResult` 契约：

- `posts.hasPrevious()`
- `posts.hasNext()`
- `posts.prevUrl`
- `posts.nextUrl`
- `posts.page`
- `posts.totalPages`

归档页通过 `th:with` 将 `archives` 映射为分页片段需要的 `posts`，避免复制分页逻辑。

### 4.6 评论

文章和单页使用独立的评论上下文：

```html
<halo:comment group="content.halo.run" kind="Post" name="..." />
<halo:comment group="content.halo.run" kind="SinglePage" name="..." />
```

评论区域只在 `haloCommentEnabled` 为真时渲染。

### 4.7 时间

Halo 内容时间使用 `java.time` 系列类型，统一使用：

```html
th:text="${#temporals.format(post.spec.publishTime, 'yyyy-MM-dd')}"
```

禁止继续使用 `#dates.format`。

### 4.8 主题设置与 annotation

`settings.yaml` 使用 Halo 当前支持的 FormKit 字段：

- Halo 菜单选择使用 `$formkit: menuRadio`。
- 站点 LOGO 和侧栏头像使用 `attachmentInput`。
- 不在 `array` 上设置 Halo 不支持的 `insertControl`、`upControl`、`downControl`。

`annotation-setting.yaml` 当前提供：

| 目标 | annotation | 用途 |
| --- | --- | --- |
| `MenuItem` | `icon_class` | 菜单图标 class |
| `Post` | `sidebar` | 单篇显示/隐藏侧栏 |
| `Post` | `direction` | 正文 `rtl` 方向 |

`direction` 最终输出到文章正文的 `dir` 属性，已实测 `rtl` 生效。

### 4.9 静态资源与注入

- scheme CSS 位于 `public/assets/css/scheme/`，首轮复用 NexT 预编译产物。
- 适配样式只写入 `src/css/main.css`，不修改预编译的 scheme CSS。
- 上游通用脚本位于 `public/assets/js/`。
- 页面末尾保留 `<halo:footer />`，由 Halo 注入插件资源。
- favicon 由 Halo 系统设置管理，Halo 通过 `DefaultFaviconHeadProcessor` 自动注入，主题不重复输出。

## 5. 构建与本地开发

### 5.1 环境

- Node.js 20+
- pnpm `10.33.0`，由 `packageManager` 固定
- Halo `2.27.2` 开发实例

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
```

### 5.2 命令

```bash
# 仅构建 templates/
pnpm build-only

# 监听 src/，持续重新生成 templates/
pnpm dev

# TypeScript 检查 + 构建 + 生成主题 ZIP
pnpm build

# 只打包现有 templates/
pnpm package
```

主题包输出：

```text
dist/theme-next-1.0.0-alpha.1.zip
```

### 5.3 接入 Halo

开发时把仓库挂载到 Halo 主题目录，目录名必须为 `theme-next`：

```bash
docker run -d \
  --name halo-next-dev \
  -p 8090:8090 \
  -e SPRING_THYMELEAF_CACHE=false \
  -v "$HOME/.halo2-next-dev:/root/.halo2" \
  -v "$PWD:/root/.halo2/themes/theme-next" \
  halohub/halo:2.27.2
```

首次启动完成 Halo 初始化后，在 Console 安装并启用 `theme-next`。修改 `theme.yaml`、`settings.yaml` 或 `annotation-setting.yaml` 后，需要重载主题。

### 5.4 开发检查

```bash
# 禁止使用已移除的 Thymeleaf Web 对象
rg -n '#(request|response|session|servletContext)' src

# 检查旧时间和旧分页 API
rg -n '#dates|hasPrevious[^()]|hasNext[^()]' src

# 检查硬编码路由和遗留标记
rg -n '/archives/page/|/categories/Sports/|TODO|FIXME' src

# 构建
pnpm build-only
```

## 6. 验证矩阵

### 6.1 已完成

验证环境：Halo `2.27.2`，主题 `1.0.0-alpha.1`，页面布局契约 `SUPPORTED`。

| 检查项 | 结果 |
| --- | --- |
| `pnpm build-only` | 通过 |
| `templates/modules/menu-tree.html` 生成 | 通过 |
| `templates/modules/category-tree.html` 生成 | 通过 |
| 首页 `/` | 200 |
| 归档 `/archives` | 200 |
| 文章 `/archives/hello-halo` | 200 |
| 测试文章 `/archives/test-1` | 200 |
| 单页 `/about`、`/privacy-policy` | 200 |
| 标签列表与详情 | 200 |
| 分类列表与详情 | 200 |
| 作者页 | 200 |
| 不存在的页面（HTML 请求） | 404 错误页 |
| 三级 Halo 菜单 | 正确递归 |
| 二级分类 | 正确递归 |
| 文章 `direction=rtl` | 正文输出 `dir="rtl"` |
| 主题 CSS/JS/字体 | 资源请求正常 |
| 测试后 Halo 日志 | 无模板异常 |

### 6.2 发布前必须补齐

| 检查项 | 原因 |
| --- | --- |
| Halo `2.26.x` 回归 | 当前只验证 2.27.2 |
| Muse、Mist、Pisces、Gemini 四套 scheme | 当前主验证为 Pisces |
| 左右侧栏 | 需覆盖 `left` / `right` 资源路径和布局 |
| 亮色、暗色、跟随系统 | 当前只确认页面可渲染 |
| 桌面、平板、移动端 | 需检查导航、侧栏和正文溢出 |
| 分页 2 页以上 | 当前测试数据只有 1 页 |
| 空列表页 | 标签、分类、作者、归档 |
| 有评论、无评论、评论插件关闭 | 需分别验证 |
| 搜索插件开启/关闭 | 当前只做条件渲染判断 |
| 从干净 checkout 安装与打包 | 需清除缓存后重跑 |

## 7. 配置模型

`settings.yaml` 按以下分组组织：

| Group | 内容 |
| --- | --- |
| `basic` | 站点标题、scheme、暗色模式、LOGO、版权协议、菜单 |
| `sidebar` | 侧栏位置、宽度、作者、站点统计、社交链接、目录 |
| `footer` | 备案、版权与主题署名 |
| `post` | 文章元信息、摘要、阅读量、关注入口 |
| `other` | 主题色、动画 |
| `third` | 搜索等可选能力 |

侧栏社交链接拆分为 `sidebar.social`（账号列表）和 `sidebar.social_icons`（`enable`、`icons_only`、`transition`），后者对应上游 `social_icons`；文章底部 Follow me 位于 `post.follow_me`，按上游规则始终显示名称，并以 `.png` / `.jpg` 后缀识别图片项。

修改设置字段时必须同步检查：

1. `settings.yaml` 中的默认值。
2. 模板中的 `theme.config.<group>.<field>` 路径。
3. 未配置时的 `?:` / 安全访问回退。
4. Console 保存后重新加载页面。

## 8. 上游同步策略

- 固定上游 tag，不跟随 `master`。
- Nunjucks 模板只作为 DOM、class 和交互参考，不参与构建。
- scheme CSS 视为 vendored 资产，升级前记录来源和差异。
- 通用 JS 若需要修改，优先在本地文件中集中修改，并在 `docs/UPSTREAM.md` 登记。
- 升级上游前先执行当前验证矩阵，升级后对比截图和关键 DOM。
- 不直接覆盖 `public/assets/` 中已经适配 Halo 的脚本。

## 9. 已知问题与发布阻塞

### P0

1. **许可证尚未最终确认。** 当前 `LICENSE` 和 `theme.yaml` 声明 GPL-3.0，但上游 NexT 为 `AGPL-3.0-only`，并包含附加署名和官网链接要求。发布前必须由维护者确认采用 AGPL-3.0 及保留上游声明，或取得其他合法授权。
2. **最低版本尚未回归。** `theme.yaml` 暂定 `>=2.26.0`，但只在 2.27.2 验证。若 2.26.x 不通过，应提高最低版本或修复兼容层。

### P1

1. 四套 scheme、左右侧栏、暗色模式和响应式布局尚未做完整视觉回归。
2. 搜索入口只做了插件可用性判断，尚未完成搜索插件全链路验证。
3. `public/assets/js/pjax.js` 等上游脚本仍在包内，但页面未启用 Pjax，需确认是否删除或后续接入。
4. 已加入 `pnpm check:config` 配置校验和 `pnpm smoke` 路由检查，但仍缺少浏览器级视觉回归自动化。
5. 上游依赖 Font Awesome、anime.js 和 Creative Commons 图标 CDN，离线或受限网络环境需提供降级方案。

### P2

1. `screenshot.png` 已补充并随主题包打包，后续视觉调整时需同步更新。
2. 未覆盖自定义 permalink pattern 和自定义路由配置。
3. 未完成 SEO、Open Graph、结构化数据与 Halo 系统 SEO 的去重策略。
4. `i18n` 目前以中英文案为主，未建立完整多语言矩阵。
5. 第三方评论、统计、分享和数学公式尚未纳入首轮支持范围。

## 10. 后续计划

### 阶段 A：Alpha 收尾

- 确认许可证和上游署名方案。
- 已补齐 `screenshot.png` 和 README，后续继续完善迁移与发布说明。
- 清理未加载的 Pjax 等死代码。
- 已固化真实 Halo smoke test 脚本，继续补充浏览器级视觉回归。

### 阶段 B：视觉与兼容性

- 四套 scheme + 左右侧栏 + 暗色模式截图回归。
- Halo 2.26.x 回归。
- 移动端导航、侧栏、目录和长代码块检查。

### 阶段 C：功能补齐

- 搜索插件完整接入。
- 分页、空状态、自定义路由测试。
- SEO 与 Halo 系统能力去重。
- 评论、统计和可选插件的组合验证。

## 11. 完成标准

发布 beta 前至少满足：

- `pnpm install && pnpm build` 在干净环境成功。
- 主题包可在 Halo 2.26.x 和 2.27.2 安装、启用、重载。
- `pageLayout.state` 为 `SUPPORTED`。
- 核心路由和错误页全部通过。
- 多级菜单、分类树、分页、评论上下文正确。
- 四套 scheme 和移动端无明显视觉回归。
- 无模板异常、无阻断性 JavaScript 错误。
- 许可证、上游署名和 NexT 官网链接符合上游要求。

## 12. 参考资料

- [Halo 主题开发文档](https://docs.halo.run/developer-guide/theme/index.md)
- [Halo 主题 API 变更日志](https://docs.halo.run/developer-guide/theme/api-changelog.md)
- [Halo Thymeleaf 指南](https://docs.halo.run/developer-guide/theme/thymeleaf.md)
- [Halo 主题设置](https://docs.halo.run/developer-guide/theme/settings.md)
- [Halo 2.27.2 Release](https://github.com/halo-dev/halo/releases/tag/v2.27.2)
- [NexT v8.29.0](https://github.com/next-theme/hexo-theme-next/tree/v8.29.0)
