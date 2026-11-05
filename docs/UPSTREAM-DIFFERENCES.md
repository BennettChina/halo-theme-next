# 上游 NexT 功能差异清单

| 项目     | 内容                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| 对照基线 | `next-theme/hexo-theme-next` `v8.29.0`                                                                          |
| 对照日期 | 2026-11-05                                                                                                      |
| 对照范围 | `settings.yaml`、`src/` 模板与脚本、`public/assets/css/scheme/`、上游 `_config.yml` / `layout/` / `source/css/` |
| 未覆盖   | 预编译 CSS 的逐像素截图回归、vendored JS 的逐行语义 diff                                                        |

本文记录当前 Halo 实现与上游 NexT 在**功能行为和配置语义**上的差异，不记录单纯的 Thymeleaf 写法差异。

状态说明：

- ✅ 已对齐：行为或可配置能力与上游基本一致。
- ⚠️ 配置未接线 / 行为不同：主题设置里有字段，但模板或脚本没有完全消费，或默认行为与上游不同。
- ❌ 未实现：上游存在、本地没有对应功能或配置。
- 🔁 平台适配：由于 Halo 与 Hexo 的机制不同而有意替换。
- 🚫 明确不做：与 Halo 平台冲突、维护成本过高或收益过低。
- ⏸️ 暂缓：有能力实现，但不属于当前 1.0.0 发布范围。

## 1. 取舍结论

当前处于 1.0.0 发布收尾阶段，不以“功能数量对齐上游”为目标。判断标准如下：

- Halo 原生或插件已提供的能力，不重复实现。
- Hexo 专属模板、helper 和标签插件机制不硬搬。
- 配置项必须真正生效，否则删除或保持注释，不能长期保留“可配置但无效”的字段。
- 发布阻塞项优先于功能补齐；Halo 2.26 兼容回归、四套 scheme 和左右侧栏已完成，剩余发布阻塞项见第 7.1 节。

结论：差异清单中大部分第三方服务和内容扩展可以明确不做或暂缓；近期只做配置接线、低成本可见增强和发布阻塞项。

### 1.1 明确不做

| 类别        | 项目                                                                                                                                                                   | 原因                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 第三方服务  | local search、Algolia、Disqus、Gitalk、Utterances、Isso、analytics、chat、Webmaster 验证                                                                               | Halo 已有搜索插件、原生评论、插件资源注入和系统设置；主题重复接入会增加配置、隐私和维护负担 |
| Hexo 专属   | note / tabs、PDF、WaveDrom、Google Calendar、`custom_file_path`                                                                                                        | 依赖 Hexo 标签插件或模板路径注入，Halo 内容模型和主题机制不适用                             |
| 内容渲染    | MathJax / KaTeX、Mermaid 主题级实现                                                                                                                                    | 应由 Halo 编辑器、渲染器或插件负责；主题最多补样式，不应内置整套渲染器                      |
| 过时/低收益 | Pjax、Pace、Quicklink、Canvas Ribbon、GitHub Banner、Bookmark、`exturl`、Pangu、字体配置、`lightdark`、`body_scrollbar.overlay`、`mobile_layout_economy`、`preconnect` | 维护和兼容成本高于收益；Pjax 还会与 Halo 评论、搜索和插件脚本冲突                           |
| 低需求装饰  | 菜单 badge、语言切换、AddToAny、文章编辑入口                                                                                                                           | 使用频率低；内容未翻译时语言切换反而误导用户                                                |
| 许可证约束  | `footer.powered` 完整关闭                                                                                                                                              | NexT 官网链接是上游许可要求；最多隐藏版本号或 “Powered by Halo”，不提供移除 NexT 署名的开关 |

### 1.2 暂缓

| 项目                     | 原因                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------- |
| 完整相关度算法           | 当前按首个标签推荐，没有标签时回退首个分类；未做多标签权重、分类加权和发布时间衰减 |
| 第三方灯箱库、图片懒加载 | 已用原生 `<dialog>` 实现图片放大，不引入 FancyBox / Medium Zoom；懒加载继续暂缓    |

### 1.3 建议做

| 优先级       | 项目                                                         | 说明                                                                                           |
| ------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| P0           | TOC `max_depth`、`expand_all`、`number`                      | `max_depth` 当前只有 5 一个选项，tocbot 又固定 `h1-h5`；先接线，`number` 用 CSS，`wrap` 暂不做 |
| P0           | Creative Commons `size`、`language`、逐文章关闭              | `size` 已有字段但未消费；`language` 需要新增；逐文章关闭通过 Post annotation 实现              |
| P0           | `post_meta.item_text`、`updated_at.another_day`              | 成本很低、用户可见；`another_day` 比较发布日期和修改日期                                       |
| P0           | `read_more_btn`、`post_navigation`、首页副标题、公安备案图标 | 都是小改动，可一次补齐                                                                         |
| P0           | 标签云 `min` / `max` / `amount`                              | 先做字体范围和数量限制；`orderby` / `order` 取决于 Halo Finder 是否支持排序                    |
| P0           | 侧栏统计零值判断、`sidebar.display=hide`                     | 零值判断是顺手修复；`hide` 可补，但默认值保持 `always`，避免改变现有站点观感                   |
| P1（已完成） | 代码块复制、折叠、语言名称                                   | 只处理未经过 Shiki 的代码块，避免与插件自带的复制/折叠/语言名重复                              |
| P1（已完成） | 阅读进度条                                                   | 使用 `.reading-progress-bar` 和 CSS 变量 `--progress`，支持左右起始与上下位置                  |
| P1（已完成） | 返回顶部 `enable` / `sidebar` / `scrollpercent`              | 支持侧栏和右下角两种位置，百分比可关闭                                                         |
| P1（已完成） | `tag_icon`、原生分享                                         | 分享优先使用 Web Share API，不支持时复制链接；不引入 AddToAny                                  |
| P2（已完成） | 阅读统计、相关文章、打赏、图片放大、Open Graph / SEO         | 相关文章使用单次 Finder 查询；图片放大使用原生对话框；SEO 提供元数据与结构化数据开关           |
| P2（部分）   | 完整相关度算法、图片懒加载                                   | 当前实现优先低成本和可关闭，不引入额外前端依赖                                                 |

### 1.4 发布阻塞

1. 完成首次上架所需的干净实例安装、升级和卸载回归。
2. 补充全站逐页视觉回归自动化；四套 scheme、左右侧栏、暗色模式和移动端已完成首页/文章页抽查。

功能补齐不应排在这些事项之前。

最低兼容版本已扩展至 `>=2.26.0`；2.26.0 / 2.26.1 回归记录见 [REGRESSION-2.26.md](REGRESSION-2.26.md)。

### 1.5 P0 落地记录（2026-11-05）

- 已完成 TOC `max_depth`、`number`、`expand_all` 接线；`wrap` 仍暂不做。
- 已完成 Creative Commons `size`、`language` 和逐文章关闭。
- 已完成 `post_meta.item_text`、`post_meta.another_day`、`read_more_btn`、`post_navigation`、首页副标题和公安备案图标。
- 已完成标签云 `min` / `max` / `amount`；`orderby` / `order` 未做。
- 已完成侧栏统计零值判断和 `sidebar.display=hide`；默认值仍保留 `always`。
- 已移除未引用的 Pjax、书签、旧评论脚本和未接入的第三方脚本资源。
- 已用本地 Halo 2.26.1 / 2.27.2 + Chrome Headless 验证文章页 TOC、文章导航、标签云和版权声明。

### 1.6 P1 落地记录（2026-11-05）

- 已完成代码块复制按钮、折叠、语言名称和三种复制按钮样式；Shiki 代码块由插件自行处理，主题不重复包裹。
- 已完成阅读进度条，支持 `left` / `right` 起始位置和 `top` / `bottom` 垂直位置。
- 已完成返回顶部 `enable`、`sidebar`、`scrollpercent`；关闭百分比时不再渲染 `<span>`，脚本也不会报错。
- 已完成文章标签图标和原生分享按钮；分享失败时回退为复制链接，并提供成功/失败提示。
- 已通过 `pnpm build`、`pnpm check:config`、`pnpm smoke` 和 Chrome Headless DOM 检查。

### 1.7 P2 落地记录（2026-11-05）

- 已完成文章字数与阅读时长，由浏览器根据正文估算，不写入数据库，也不增加服务端解析。
- 已完成相关文章：优先按文章首个标签查询，没有标签时回退首个分类，结果数量可配置。
- 已完成打赏：支持微信、支付宝、PayPal、Bitcoin 收款码，未填写二维码时不渲染。
- 已完成图片放大：点击正文图片使用原生 `<dialog>` 放大，不引入 FancyBox / Medium Zoom。
- 已完成 SEO：输出 canonical、Open Graph、Twitter Card 和文章 `BlogPosting` JSON-LD；提供独立开关，避免与插件重复。
- 已用真实 Halo 验证相关文章 Finder 查询、阅读统计脚本、图片放大 DOM 和 JSON-LD 有效性。

### 1.8 Halo 2.26 回归记录（2026-11-05）

- Halo `2.26.0` / `2.26.1` 干净实例完成主题 ZIP 安装、启用和重载，`pageLayout.state` 均为 `SUPPORTED`。
- `2.26.1` 完成 15 篇文章、多级分类、三级菜单及 Links / Photos / Moments 完整数据回归。
- `2.26.0` 完成核心路由和三个插件的空状态页面回归。
- 四套 scheme × 左右侧栏、暗色模式、首页/文章页桌面与移动端检查通过，无模板异常或横向溢出。
- 最低兼容版本保持 `>=2.26.0`；完整记录见 [REGRESSION-2.26.md](REGRESSION-2.26.md)。

## 2. 当前实现结论

当前实现已经覆盖核心页面结构、四套 scheme、Halo 菜单、分类树、分页、侧栏头像/统计/社交、文章版权、Follow me、Halo 评论，以及 P1/P2 的代码块、阅读交互、分享、阅读统计、相关文章、打赏、图片放大和 SEO。

主要差异集中在三类：

1. 上游配置项在本地存在但没有真正接线，或默认行为不同。
2. 上游可选增强能力只保留完整相关度算法、图片懒加载、第三方服务和内容扩展等低优先级项目。
3. Halo 平台已经提供、不应在主题内重复实现的能力。

## 3. 配置与实现状态核对

本节按实际状态区分 `配置未接线`、`未实现`、`行为不同`。此前版本把下列项目统一归入“配置存在但未生效”，其中多项在 `settings.yaml` 中并没有可生效字段，不能当作小 bug 排期。

| 功能                   | 状态     | 本地现状                                                                  | 上游行为                                                        | 位置                                                       |
| ---------------------- | -------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| 侧栏目录深度           | 已对齐   | `max_depth`、`number`、`expand_all` 已接入 tocbot；`wrap` 未做            | `toc.max_depth` 参与目录生成                                    | `settings.yaml:530`、`src/partials/scripts.html:24`        |
| 目录编号/换行/展开     | 部分对齐 | `number`、`expand_all` 已接入；`wrap` 暂不做                              | 支持 `number`、`wrap`、`expand_all`                             | `settings.yaml:530`                                        |
| Creative Commons 尺寸  | 已对齐   | 侧栏按 `small` / `big` 选择徽章                                           | `creative_commons.size` 支持 `small` / `big`                    | `settings.yaml:160`、`src/partials/sidebar.html:123`       |
| Creative Commons 语言  | 已对齐   | `language` 追加到许可证链接                                               | `creative_commons.language` 可指定许可证语言                    | `settings.yaml:169`                                        |
| 单篇文章关闭版权声明   | 已对齐   | Post annotation `copyright=0` 可关闭                                      | 上游通过 front-matter `copyright: false` 关闭                   | `src/partials/copyright.html`、`annotation-setting.yaml`   |
| 侧栏显示模式           | 部分对齐 | 已补 `hide`；默认仍为 `always`                                            | 支持 `post`、`always`、`hide`、`remove`，默认 `post`            | `settings.yaml:275`                                        |
| 文章元信息文字         | 已对齐   | `item_text=0` 时隐藏文字，只保留图标和值                                  | `post_meta.item_text` 可关闭文字                                | `src/partials/post-meta.html:9`                            |
| 文章更新日期           | 已对齐   | 本地字段为 `post_meta.another_day`，默认开启                              | `updated_at.another_day` 可限制为跨天更新才显示                 | `settings.yaml:807`、`src/partials/post-meta.html:17`      |
| 标签云                 | 部分对齐 | `min` / `max` / `amount` 已接入；`orderby` / `order` 未做                 | `tagcloud.min/max/amount/orderby/order` 可配置                  | `src/tags.html:27`                                         |
| 上一篇/下一篇          | 已对齐   | 支持 `left` / `right` / `false`                                           | 支持 `post_navigation: left / right / false`                    | `src/partials/post-nav.html`                               |
| 首页阅读更多           | 已对齐   | `read_more_btn=0` 可关闭按钮                                              | `read_more_btn` 可关闭                                          | `src/partials/post-card.html:56`                           |
| 页脚 Powered by        | 不做     | 受许可证约束，不移除 NexT 署名；最多隐藏版本号                            | `footer.powered` 可关闭                                         | `src/partials/footer.html:50`                              |
| 页脚语言切换           | 不做     | 内容未翻译时语言切换会误导用户                                            | `language_switcher` 可显示多语言切换                            | `src/partials/footer.html`                                 |
| 公安备案图标           | 已对齐   | `gongan_icon_url` 已接入                                                  | `footer.beian.gongan_icon_url` 可显示公安备案图标               | `settings.yaml:698`                                        |
| 菜单 badge             | 不做     | 使用频率低，暂不实现                                                      | `menu_settings.badges` 支持菜单项 badge                         | `src/modules/menu-tree.html`                               |
| 首页副标题             | 已对齐   | `index_with_subtitle=1` 时标题追加副标题                                  | `index_with_subtitle` 可将副标题加入首页标题                    | `src/index.html`                                           |
| 侧栏统计零值           | 已对齐   | 帖子/分类/标签为 0 时不再渲染对应项                                       | 上游对上架项做非空判断                                          | `src/partials/sidebar.html:41`                             |
| 代码块复制/折叠/语言名 | 已对齐   | 复制样式支持 `default` / `flat` / `mac`；折叠高度可配置；Shiki 代码块跳过 | `codeblock.copy_button`、`codeblock.fold`、`codeblock.language` | `public/assets/js/utils.js:85`、`src/css/main.css`         |
| 阅读进度条             | 已对齐   | 支持 `enable`、`start_at`、`position`                                     | `reading_progress.enable/start_at/position`                     | `src/partials/shell.html`、`src/css/main.css`              |
| 返回顶部               | 已对齐   | 支持开关、侧栏/右下角位置和百分比显示                                     | `back2top.enable/sidebar/scrollpercent`                         | `src/partials/sidebar.html`、`src/partials/shell.html`     |
| 文章标签图标           | 已对齐   | `tag_icon=1` 时在标签前显示图标                                           | `tag_icon`                                                      | `src/partials/post-article.html`                           |
| 原生分享               | 已对齐   | Web Share API 优先，失败或不可用时复制链接；不使用 AddToAny               | 上游使用 AddToAny                                               | `src/partials/share.html`                                  |
| 字数统计 / 阅读时长    | 已对齐   | 浏览器按 CJK 字符和英文单词估算，速度和显示项可配置                       | `symbols_count_time`                                            | `src/partials/post-meta.html`、`public/assets/js/utils.js` |
| 相关文章               | 部分对齐 | 按首个标签推荐，无标签时回退首个分类；数量可配置                          | `related_posts` 支持更复杂的相似度策略                          | `src/partials/related-posts.html`                          |
| 打赏                   | 已对齐   | 支持微信、支付宝、PayPal、Bitcoin 收款码和提示文字                        | `reward_settings`、`reward`                                     | `src/partials/reward.html`                                 |
| 图片放大               | 已对齐   | 正文图片点击后用原生 `<dialog>` 放大；链接图片和 `.nozoom` 图片跳过       | 上游使用 FancyBox / Medium Zoom                                 | `public/assets/js/utils.js`、`src/css/main.css`            |
| Open Graph / SEO       | 已对齐   | 输出 canonical、OG、Twitter Card 和文章 JSON-LD，提供独立开关             | 上游依赖第三方插件或扩展标签                                    | `src/partials/seo.html`、`settings.yaml`                   |

> 说明：2026-11-05 已完成 P0、P1、P2 的主体接线；剩余差异主要是 `toc.wrap`、`tagcloud.orderby/order`、`footer.powered`、`language_switcher`、菜单 badge、完整相关度算法和图片懒加载，按第 1 节分别为暂缓或不做。

## 4. 上游有但本地未实现

以下项目不代表都要实现，取舍见第 1 节；这里保留完整差异用于后续查漏。

### 4.1 文章组件

文章标签图标、版权开关、原生分享、打赏、相关文章和字数统计均已完成；文章编辑入口仍不做。

- 文章编辑入口：`post_edit`。

已对齐：

- `tag_icon`：文章底部标签前显示图标。
- 按文章关闭版权声明：Post annotation `copyright=0`。
- 原生分享：`post.share.enabled`，不使用上游的 AddToAny。
- 打赏：`post.reward.enabled`，支持多种收款码，未填写二维码时不显示。
- 相关文章：`post.related.enabled`，按首个标签或分类推荐。
- 字数统计 / 阅读时长：`post.reading_stats.enabled`，浏览器端估算。

### 4.2 代码块与阅读交互

代码块复制、折叠、语言名称、阅读进度和返回顶部配置已完成；Pjax、Pace、Quicklink、Canvas Ribbon 等不做。

已对齐：

- 代码块复制按钮：`codeblock.copy_button.enable/style`。
- 代码块折叠：`codeblock.fold.enable/height`。
- 代码块语言名称：`codeblock.language`。
- 阅读进度条：`reading_progress.enable/start_at/position`。
- 返回顶部：`back2top.enable/sidebar/scrollpercent`。
- 图片放大：`image_zoom.enabled`，使用原生 `<dialog>`，不加载第三方灯箱库。

仍不做或未实现：

- 书签：`bookmark`；配置和未引用脚本已移除。
- Pjax：页面未启用，相关脚本已移除。
- FancyBox / Medium Zoom：不引入；主题使用原生图片放大。
- 图片懒加载：`lazyload` 固定为 false。
- Pangu 中英文空格：`pangu` 固定为 false。
- Quicklink：未实现。
- Pace：未实现。
- Canvas Ribbon：未实现。
- GitHub Banner：未实现。

### 4.3 内容扩展

整体不做，交给 Halo 编辑器、渲染器或插件处理；主题最多补样式。

- MathJax / KaTeX：未提供主题级配置。
- Mermaid：未实现。
- PDF：未实现。
- WaveDrom：未实现。
- note / tabs 等上游标签插件样式与交互：未实现。
- Google Calendar 页面：未实现。

### 4.4 第三方服务

整体不做。搜索、评论、统计和聊天优先使用 Halo 插件或系统注入。

| 能力 | 本地现状                    | 上游                                                     |
| ---- | --------------------------- | -------------------------------------------------------- |
| 搜索 | 只接 Halo 官方搜索插件      | local search / Algolia 等多种搜索                        |
| 评论 | 只接 Halo 原生评论          | Disqus、Gitalk、Utterances、Isso 等，多系统 tabs/buttons |
| 统计 | 未提供主题级 analytics 配置 | 百度、Google、Matomo、Umami、Plausible 等                |
| 聊天 | 未实现                      | Chatra、Tidio、Knocket 等                                |

### 4.5 SEO 与杂项

已补 canonical、Open Graph、Twitter Card 和文章 JSON-LD，并提供 `other.seo.enable_metadata`、`other.seo.enable_structured_data` 开关；Halo 注入的 title 和 description 不重复输出。

- Open Graph / Twitter Card 输出：已实现，可关闭。
- 文章 `BlogPosting` JSON-LD：已实现，可关闭。
- Google / Bing / Yandex / Baidu Webmaster 验证。
- `exturl` 外部链接加密。
- 字体配置。
- `lightdark` 原生 light-dark 模式。
- `body_scrollbar.overlay`。
- `preconnect`。
- `mobile_layout_economy`。
- 上游 `custom_file_path` 自定义模板注入机制。

## 5. 侧栏社交链接

已对齐的部分：

- 侧栏社交数量没有上限，与上游一致。
- `social_icons.enable`、`icons_only`、`transition` 已接入。
- Follow me 支持按 `.png` / `.jpg` 后缀识别图片项，并始终显示名称。
- 社交账号不再限制为 5 个。

当前仍存在的差异：

| 差异             | 说明                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------- |
| 两栏文字模式对齐 | 本地改为 `text-align: left`，修复上游 `v8.29.0` 中因继承居中导致的图标错位；这是有意偏离 |
| `enabled` 开关   | 本地保留 Halo 风格的社交 / Follow me 开关；上游以配置列表是否为空决定显示                |
| Follow me 旧字段 | 本地保留 `type: img` + `img_url` 兼容逻辑；上游只按 URL 后缀判断                         |
| 链接 target      | 本地社交链接统一 `target="_blank"`；上游只对外链添加                                     |

## 6. 平台适配差异

以下差异来自 Halo 与 Hexo 的机制不同，不应直接视为缺陷：

- 菜单由 Halo `MenuFinder` 提供，支持任意层级。
- 评论由 Halo 原生评论组件提供。
- 搜索由 Halo 搜索插件提供。
- 友链、图库、瞬间分别使用 Links、Photos、Moments 插件页面。
- favicon 由 Halo 系统设置注入。
- 插件资源通过 `<halo:footer />` 注入。
- 侧栏友链组件改为 Links 插件页面，不再使用上游侧栏 blogroll。

## 7. 实施顺序

### 7.1 发布阻塞优先

1. 完成首次上架所需的干净实例安装、升级和卸载回归。
2. 补充全站逐页视觉回归自动化；四套 scheme、左右侧栏、暗色模式和移动端已完成首页/文章页抽查。

### 7.2 P0：配置接线与低成本补齐（2026-11-05 已完成）

1. TOC `max_depth`、`expand_all`、`number`；`wrap` 暂不做。
2. Creative Commons `size`、`language`，逐文章关闭版权。
3. 文章元信息 `item_text`、`updated_at.another_day`。
4. `read_more_btn`、`post_navigation`、首页副标题、公安备案图标。
5. 标签云 `min` / `max` / `amount`；`orderby` / `order` 先确认 Finder 支持。
6. 侧栏统计零值判断；补 `sidebar.display=hide`，默认值保持 `always`。
7. 清理未使用脚本和无法生效的配置字段。

### 7.3 P1：代码块与阅读交互（2026-11-05 已完成）

1. 代码块复制、折叠、语言名称，Shiki 代码块由插件自行处理。
2. 阅读进度条，支持起点和垂直位置。
3. 返回顶部 `enable` / `sidebar` / `scrollpercent`。
4. 文章标签图标。
5. 原生分享，Web Share API 优先、复制链接兜底。

### 7.4 P2：增强能力（2026-11-05 已完成）

1. 字数统计和阅读时长，浏览器端估算。
2. 相关文章，按首个标签或分类推荐。
3. 打赏，支持多种收款码。
4. 图片放大，使用原生 `<dialog>`。
5. canonical、Open Graph、Twitter Card 和文章 JSON-LD。

完整相关度算法、图片懒加载和明确不做项见第 1 节。

## 8. 验证方式

当前差异主要通过以下方式确认：

```bash
pnpm build
pnpm check:config export-theme-next-config-1793770166122.json
```

SEO 与分页检查：

```bash
curl -fsSL http://localhost:18090/archives/hello-halo \
  | rg '<link rel="canonical"|property="og:|name="twitter:|application/ld\+json"'
curl -fsSL http://localhost:18090/page/2 | rg 'canonical|og:url'
```

文章页应有 canonical、OG、Twitter Card 和 JSON-LD；分页页不应复用第一页的 canonical 或 `og:url`。

涉及侧栏布局的修改应额外用 Chrome Headless 或真实浏览器检查：

- 3、4、5 个社交账号下的两栏排列。
- 图标、名称和列基线是否对齐。
- 纯图标模式是否居中。
- 桌面与移动端侧栏。

## 9. 维护约定

- 新增或修复上游能力后，同步更新本文状态。
- 每次新增差异项或决定取舍时，同步更新第 1 节和第 3 节，明确属于“配置未接线”、“未实现”、“平台适配”还是“明确不做”。
- 不在 `settings.yaml` 中保留无法被模板或脚本消费的字段；宁可先不提供，也不要留下无效开关。
- 平台适配和明确不做项不要混入 P0/P1 实施清单。
- 上游升级时，先对比 `_config.yml`、`layout/` 和 `source/css/`，再更新本文。
- 与 Halo 平台强相关的替代方案记录在“平台适配差异”，不要混入缺陷清单。
