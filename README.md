# Halo Theme Next

面向 [Halo 2](https://halo.run) 的 NexT 主题重写版，视觉与交互参考 [hexo-theme-next](https://github.com/next-theme/hexo-theme-next)。

主题使用 Halo Thymeleaf 渲染页面，以官方 [theme-vite-starter](https://github.com/halo-dev/theme-vite-starter) 的 Vite 工程管理模板拼接、前端资源和主题打包。

> 当前版本为 `1.0.0-alpha.1` 开发预览。许可证方案尚未最终确认，请勿直接用于正式发布。

## 状态

| 项目               | 状态                                                    |
| ------------------ | ------------------------------------------------------- |
| 目标 Halo          | `2.27.2`，最低声明 `>=2.26.0`                           |
| 页面布局契约       | `SUPPORTED`                                             |
| 核心路由           | 已实现并通过 Halo smoke test                            |
| 首页富文本文章流   | 已实现，支持 Markdown/HTML 正文与图片                   |
| 友链 / 图库 / 瞬间 | 已实现，对应 Links / Photos / Moments 插件              |
| 友链申请           | 已实现，支持验证码、CSRF、审核回跳                      |
| 多级菜单/分类      | 已实现                                                  |
| 四套 scheme        | 首页桌面/移动端抽查通过，全量视觉回归待完成             |
| Halo 2.26.x        | 待回归                                                  |
| 自动化检查         | `pnpm check:config` 配置校验，`pnpm smoke` 真实路由检查 |

## 已支持

- 首页、文章、单页、归档、标签、分类、作者页面
- 首页文章流渲染 Halo 已生成的正文 HTML，保留图片、标题、链接、列表、引用等 Markdown 结果
- 友链页面（`/links`，Links 插件）
- 友链申请（Links 插件原生表单，含图形验证码、CSRF 和后台审核）
- 图库列表与详情（`/photos`、`/photos/{name}`，Photos 插件）
- 瞬间列表与详情（`/moments`、`/moments/{name}`，Moments 插件）
- 4xx/5xx 错误页
- Halo 原生评论组件
- Halo 菜单任意层级递归
- 分类树任意层级递归
- 分页、空状态、上一篇/下一篇
- Muse、Mist、Pisces、Gemini scheme 资源
- 浅色/暗色模式
- 侧栏头像（自定义地址、圆角、悬浮旋转）、统计、目录、社交链接、版权协议
- 侧栏目录深度、编号和默认展开层级
- 版权协议尺寸、许可证语言和逐文章关闭版权声明
- 文章导航方向、首页阅读更多开关、标签云字号与数量配置
- 首页标题副标题、公安备案图标
- 代码块复制、折叠和语言名称配置；Shiki 代码块由插件处理，不会重复增强
- 阅读进度条、返回顶部位置与百分比显示
- 文章标签图标、原生分享（Web Share API 或复制链接）
- 字数统计、阅读时长、相关文章、打赏和原生图片放大
- canonical、Open Graph、Twitter Card 和文章 JSON-LD，可独立关闭
- 文章 annotation：侧栏开关、版权声明开关、右到左正文方向
- 菜单 annotation：图标选择器
- Halo 插件 footer 注入

## 环境

- Halo `2.27.2`
- Node.js 20+
- pnpm `10.33.0`

主题的 `metadata.name` 为 `theme-next`。安装目录或挂载目录必须使用 `theme-next`。

## 安装主题包

```bash
pnpm install
pnpm build
```

构建产物：

```text
dist/theme-next-1.0.0-alpha.1.zip
```

在 Halo Console 的“主题”页面上传 ZIP，安装并启用。

## 本地开发

把仓库挂载为 Halo 的主题目录：

```bash
docker run -d \
  --name halo-next-dev \
  -p 8090:8090 \
  -e SPRING_THYMELEAF_CACHE=false \
  -v "$HOME/.halo2-next-dev:/root/.halo2" \
  -v "$PWD:/root/.halo2/themes/theme-next" \
  halohub/halo:2.27.2
```

启动监听构建：

```bash
pnpm dev
```

`pnpm dev` 只监听 `src/` 并重新生成 `templates/`，不会启动 Halo。Halo 实际读取的是 `templates/`，因此刷新页面前需等待构建完成。

常用命令：

| 命令                              | 作用                                   |
| --------------------------------- | -------------------------------------- |
| `pnpm dev`                        | 监听 `src/` 并持续构建                 |
| `pnpm build-only`                 | 只生成 `templates/`                    |
| `pnpm build`                      | 类型检查、构建并生成 ZIP               |
| `pnpm package`                    | 使用现有 `templates/` 打包             |
| `pnpm check:config <export.json>` | 检查旧主题导出配置并生成迁移结果       |
| `pnpm smoke`                      | 对运行中的 Halo 检查核心路由和主题资源 |

## 目录

```text
src/                   主题源码
├── *.html             页面入口
├── error/             错误页
├── partials/          构建期片段
├── modules/           运行时 Thymeleaf 递归片段
├── css/               Halo 适配样式
└── js/                主题脚本入口

public/                原样复制的上游静态资源
scripts/               配置迁移校验与真实路由 smoke 检查
templates/             Vite 构建产物，禁止手改
dist/                  主题包
```

## 配置

主题配置在 Halo Console 的“主题设置”中完成，主要包括：

- 基础：站点信息、scheme、暗色模式、LOGO、菜单、版权协议
- 侧栏：位置、宽度、作者、统计、社交链接、目录
- 页脚：备案、版权
- 文章：元信息、首页正文模式、首页封面、摘要、阅读量、关注入口、标签图标、原生分享、阅读统计、相关文章、打赏
- 其他：主题色、动画、代码块、阅读进度条、返回顶部、图片放大、SEO
- 第三方：搜索入口

菜单统一使用 Halo 菜单，主题通过 FormKit `menuRadio` 选择要展示的菜单，支持任意层级。

友链、图库、瞬间没有独立的页面开关，入口由 Halo 菜单统一控制：

- 在 Console → 菜单中添加图库 `/photos`、瞬间 `/moments`、友联 `/links`。
- 在“基础设置 → 菜单设置”中选择需要展示的 Halo 菜单。
- 插件依赖：图库、瞬间、友联分别需要启用 Photos、Moments、Links 插件；未安装插件时不要添加对应入口。
- 旧版自定义菜单配置不再读取，升级后需在 Console 中重建菜单并在主题设置中重新选择。

旧配置迁移可先用检查脚本验证，详见 [旧主题配置迁移说明](docs/CONFIG-MIGRATION.md)：

```bash
pnpm check:config export-theme-next-config-1793770166122.json \
  --migrate /tmp/theme-next-config-migrated.json
```

`pnpm smoke` 默认检查 `/`、`/archives`、`/categories`、`/tags` 及首页发现的站内链接。可通过环境变量补充路由：

```bash
HALO_URL=http://localhost:8090 \
SMOKE_ROUTES='/page/2,/authors/admin,/photos,/moments,/links' \
pnpm smoke
```

友链申请由 Links 插件控制。在 `Console → 插件 → 链接管理 → 设置 → 友链申请` 中同时开启“启用友链申请”和“允许访客提交”后，`/links` 页面会自动显示申请表单。

表单使用插件提供的同源接口 `/links/apply/captcha` 和 `/links/apply/submit`，提交成功后通过 `applied=success` 回跳。提交失败时会自动展开表单、回填插件返回的字段值，并聚焦错误字段。

文章额外支持：

- `sidebar`：显示或隐藏侧栏
- `direction=rtl`：将正文设置为从右到左

菜单项额外支持 `icon_class`，可在 Console 的菜单编辑中通过图标选择器选择；旧版 Font Awesome class 仍兼容。

## 文档

- [Halo 适配开发文档](docs/HALO-ADAPTATION.md)
- [上游来源与资产说明](docs/UPSTREAM.md)
- [上游 NexT 功能差异清单](docs/UPSTREAM-DIFFERENCES.md)

## 许可证

当前根目录 `LICENSE` 和 `theme.yaml` 仍为 GPL-3.0，这是开发期的临时状态。上游 NexT 使用 `AGPL-3.0-only`，并包含附加署名和官网链接要求。正式发布前必须确认并统一许可证方案，详见 [上游来源与资产说明](docs/UPSTREAM.md)。

页脚保留 NexT 官网链接：<https://theme-next.js.org>。
