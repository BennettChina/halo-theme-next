# 上游来源与资产说明

## 1. 上游项目

| 项目     | 内容                                            |
| -------- | ----------------------------------------------- |
| 项目     | `next-theme/hexo-theme-next`                    |
| 仓库     | <https://github.com/next-theme/hexo-theme-next> |
| 参考版本 | `v8.29.0`                                       |
| 许可证   | `AGPL-3.0-only`                                 |
| 官网     | <https://theme-next.js.org>                     |

上游 `v8.29.0` 作为功能、DOM、class 命名、视觉规范和升级对比的参考基线。它不代表当前仓库的每个 vendored 文件都已逐字节同步到该 tag。

配置项、模板行为和已实现能力的逐项差异见 [上游 NexT 功能差异清单](UPSTREAM-DIFFERENCES.md)。

## 2. 资产来源

当前 `public/assets/` 主要来自旧 Halo NexT 项目的 vendored 资产，并已在 Halo 版本中做过局部修复。

| 路径                            | 内容                                       | 说明                                                                                     |
| ------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `public/assets/css/scheme/`     | Muse、Mist、Pisces、Gemini 预编译 CSS      | 共 12 个文件，包含通用、`left`、`right` 变体                                             |
| `public/assets/js/`             | NexT 通用脚本                              | 当前保留 `utils.js`、`motion.js`、`sidebar.js`、`next-boot.js`、`tocbot.js`、`config.js` |
| `public/assets/js/third-party/` | 搜索、统计、评论、数学公式等第三方适配脚本 | 已在 2026-11-05 清理；未接入的脚本不再随包分发                                           |
| `public/assets/imgs/default/`   | 默认 LOGO、NexT schemes 图、联系图片       | 主题展示资源                                                                             |
| `public/assets/vendor/`         | 随主题分发的第三方前端资源                 | 见下方“第三方前端资源”                                                                   |

当前未包含上游 Stylus 源码。首轮直接使用预编译 scheme CSS，新适配样式写入 `src/css/main.css`。

### 第三方前端资源

页面运行所需的第三方资源均已本地化，不再从 CDN 加载。

| 资源                        | 版本      | 来源                                            | 许可证                                     |
| --------------------------- | --------- | ----------------------------------------------- | ------------------------------------------ |
| Font Awesome Free           | 6.5.2     | <https://fontawesome.com/download>              | 图标 CC BY 4.0、字体 SIL OFL 1.1、代码 MIT |
| animate.css                 | 3.1.1     | <https://github.com/animate-css/animate.css>    | MIT                                        |
| anime.js                    | 3.2.1     | <https://github.com/juliangarnier/anime>        | MIT                                        |
| Creative Commons Vocabulary | 2020.11.3 | <https://github.com/creativecommons/vocabulary> | CC0 1.0                                    |

升级这些资源时，需要同步更新版本目录、模板引用和本表，并重新检查主题包中的字体文件是否完整。

## 3. 已知本地修改

以下文件与上游同版本文件并非逐字节一致：

### `public/assets/js/utils.js`

- 菜单高亮选择器按当前 DOM 调整，使用 `.menu-item` 和 `.menu-item-active`。
- 代码块增强同时选择 `figure.highlight` 和 Halo 输出的 `pre`，并跳过 `shiki-code` 内部节点，避免与 Shiki 插件的复制、折叠和语言名 UI 重复。
- 复制、折叠和语言名配置改为读取 `CONFIG.codeblock.*`；折叠高度通过 `--fold-height` 在运行时注入。
- 返回顶部百分比节点改为可选，`scrollpercent=0` 时不会因缺少 `<span>` 报错。
- 新增 `registerReadingStats()`，在文章页按正文文本估算字数与阅读时长。
- 新增 `registerImageZoom()`，使用原生 `<dialog>` 放大正文图片；跳过链接图片和 `.nozoom` 图片。
- 保留 Halo 版本所需的目录和动画辅助逻辑。
- 与 `v8.29.0` 上游相比，内部实现基于较早的 NexT 8.x 结构，不能直接视为最新版脚本。

### `public/assets/js/motion.js`

- 匹配当前菜单和子菜单 DOM：`.menu-item`、`.sub-menu .menu-item`。
- 依赖页面配置中的 `motion` 字段和 anime.js。

### `public/assets/js/next-boot.js`

- 保留 NexT 启动顺序：注册事件、刷新组件、初始化动画。
- 与当前简化后的 Halo 页面配置协同工作。

### `public/assets/css/scheme/*/*_{left,right}.css`

- 8 个带侧栏位置的 scheme CSS 曾把 `--theme-color` 固化为旧版米黄色 `#d2b48c`。
- 已按上游 v8.29.0 默认值统一修正为黑色 `#222`，与无位置后缀的 scheme CSS 保持一致。

### 其他资源

- 当前没有对预编译 scheme CSS 做逐文件 diff 审计。
- 已在 2026-11-05 移除未引用的 Pjax、书签、旧评论脚本和 `third-party/` 下的未接入资源；后续需要时按功能重新引入并登记来源。
- 页面层面通过 `src/css/main.css` 覆盖 Halo 特有布局，不直接回写上游 CSS；P1/P2 的代码块、阅读进度、分享、标签图标、阅读统计、相关文章和图片放大样式也集中在该文件。

## 4. 文件同步原则

1. 上游 Nunjucks 模板不复制到本仓库。
2. 上游 JS 作为 vendored 文件维护，修改处需在本文登记。
3. 上游 CSS 只接受预编译产物；需要视觉覆盖时新增 Halo 样式。
4. 升级上游 tag 时先比较 `CONFIG` 字段、DOM class、菜单结构和目录实现。
5. 更新资产后必须重新执行真实 Halo smoke test，并做四套 scheme 截图对比。
6. 不从 `master` 自动同步。

## 5. 许可证与署名

上游许可证要求保留 NexT 官方链接，并包含附加署名条款。当前主题页脚已经输出：

```html
Theme <a href="https://theme-next.js.org">NexT</a>
```

本项目已统一采用 `AGPL-3.0-only`：

- 根目录 `LICENSE` 为 AGPL-3.0 完整文本。
- `LICENSE-NEXT.md` 保留上游 NexT 许可证及 Section 7(b) 附加条款。
- `AUTHORS-NEXT.md` 保留上游作者与贡献者列表。
- `NOTICE` 记录本项目版权、上游归属和资产说明。
- `theme.yaml` 的 license 声明为 `AGPL-3.0-only`。

上游附加条款要求保留 NexT 官方链接，当前主题页脚已经满足该要求。

## 6. 核对清单

- [ ] 逐文件记录 vendored 资产对应的上游 commit/tag。
- [ ] 对比 `v8.29.0` 与当前 JS，决定同步、冻结或移除。
- [ ] 确认预编译 scheme CSS 的生成来源。
- [ ] 决定是否恢复 Stylus 构建链。
- [x] 确认许可证和附加署名方案。
- [x] 将 `theme.yaml` 的 license 与根目录 LICENSE 改为最终方案。
- [x] 保留 NexT 官网链接。
