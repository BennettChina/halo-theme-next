# 旧主题配置迁移说明

本文记录旧版 `theme-next` 导出配置迁移到当前 Halo 2.26+ / Thymeleaf 模板的检查方法和验证结果。

## 1. 检查与迁移

使用仓库内的配置检查脚本对比导出 JSON 与当前 `settings.yaml`：

```bash
# 只检查
pnpm check:config export-theme-next-config-1793770166122.json

# 检查并输出补齐默认值后的配置
pnpm check:config export-theme-next-config-1793770166122.json \
  --migrate /tmp/theme-next-config-migrated.json
```

检查内容：

- 配置分组和字段是否仍被 `settings.yaml` 声明。
- 已移除或暂未实现的旧字段。
- 新版本新增、但旧配置中不存在的字段，以及 Halo 会补上的默认值。
- 已移除的自定义菜单字段是否仍被保留（`basic.menu.type`、`basic.menu.custom_menu`）。

退出码：

- `0`：没有阻断问题。
- `1`：存在类型错误、缺失分组，或使用 `--strict` 时存在警告。

迁移脚本只补齐默认值，不会删除旧字段，也不会自动创建 Halo 菜单项。导出文件中可能包含邮箱、备案号等站点信息，不建议提交到公开仓库。

## 2. 2026-11-04 导出的线上配置

检查对象：`export-theme-next-config-1793770166122.json`（主题版本 `1.0.0-beta.3`）。

结论：**旧配置可以导入，但自定义菜单字段会被忽略，需要改用 Halo 菜单。**

| 项目          | 结果                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 配置分组      | `basic`、`sidebar`、`footer`、`post`、`other`、`third` 均存在                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 阻断错误      | 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 已移除字段    | `basic.favicon`、`basic.menu.type`、`basic.menu.custom_menu`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Halo 自动补齐 | `post.index_image=1`、`post.index_content="html"`、`other.motion.enabled=1`，以及 2026-11-05 新增的 `basic.index_with_subtitle=0`、`basic.creative_commons.language=""`、`sidebar.toc.number=1`、`sidebar.toc.expand_all=0`、`footer.beian.gongan_icon_url=""`、`post.read_more_btn=1`、`post.post_navigation="left"`、`post.tag_icon=0`、`post.share={enabled:0}`、`post.reward={enabled:0,comment:"...",wechatpay:"",alipay:"",paypal:"",bitcoin:""}`、`post.related={enabled:0,count:3}`、`post.reading_stats={enabled:0,word_count:1,read_time:1,wpm:300}`、`post.post_meta.item_text=1`、`post.post_meta.another_day=1`、`post.tagcloud={min:12,max:30,amount:200}`、`other.codeblock={copy_button:{enable:0,style:"default"},fold:{enable:0,height:500},language:0}`、`other.reading_progress={enable:0,start_at:"left",position:"top"}`、`other.back2top={enable:1,sidebar:1,scrollpercent:1}`、`other.image_zoom={enabled:0}`、`other.seo={enable_metadata:true,enable_structured_data:true}` |
| 菜单迁移      | 旧自定义菜单内容需在 Console 的“菜单”中重建                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

字段说明：

- `basic.favicon` 是旧版遗留字段，旧模板从未读取；Halo 通过 `DefaultFaviconHeadProcessor` 自动注入系统设置的 favicon，主题不再重复输出。
- `sidebar.avatar.url` 继续支持自定义头像地址，留空时回退到 `site.logo`。
- `sidebar.avatar.rounded` 和 `sidebar.avatar.rotated` 已接入模板与样式，现在会实际控制头像圆角和悬浮旋转。
- 旧配置中这两项均为 `0`，迁移后头像为方形且不旋转；如需保持旧版编译 CSS 的观感，请在主题设置中将两项改为开启。
- 自定义菜单已移除，图库、瞬间、友联入口需要在 Console → 菜单中重建，并在“基础设置 → 菜单设置”中选择该菜单。
- `sidebar.social.icons_only` 已迁移到 `sidebar.social_icons.icons_only`；同时新增 `sidebar.social_icons.enable` 和 `sidebar.social_icons.transition`，对应上游 `social_icons` 配置。新默认值为显示图标和名称、关闭过渡，即上游默认观感。
- `post.follow_me.icons_only` 已移除；Follow me 按上游行为始终显示账号名称。图片项继续支持原来的 `type: img` + `img_url`，同时新增上游规则：地址以 `.png` 或 `.jpg` 结尾时自动作为图片项处理。
- 社交账号、文章底部社交账号、页脚版权图标和菜单 `icon_class` 已改为图标选择器，值以 SVG 字符串保存；旧配置中的 Font Awesome class 仍可正常显示，无需立即迁移。
- 社交账号列表只显示账号名称，避免旧 Font Awesome 编码被 Iconify 预览组件当作文本渲染；图标可在展开的编辑项中选择和预览。
- `post.tag_icon` 默认关闭；开启后在文章底部每个标签前显示图标。
- `post.share` 默认关闭；开启后使用浏览器 Web Share API，不支持时复制文章链接。
- `other.codeblock` 默认关闭复制和折叠。只增强未经 Shiki 插件处理的代码块；Shiki 代码块继续使用插件自带的复制、折叠和语言名。
- `other.reading_progress` 默认关闭；`start_at` 控制左右起点，`position` 控制顶部或底部。
- `other.back2top` 默认开启侧栏返回顶部并显示滚动百分比；`sidebar=0` 时显示在页面右下角，`scrollpercent=0` 时隐藏百分比。
- `post.reward` 默认关闭；开启后需要至少填写一个收款码才会渲染打赏组件。
- `post.related` 默认关闭；开启后按首个标签推荐，没有标签时回退首个分类。
- `post.reading_stats` 默认关闭；字数与阅读时长由浏览器估算，`wpm` 默认 300。
- `other.image_zoom` 默认关闭；开启后点击正文图片使用原生对话框放大。已安装灯箱插件时应关闭。
- `other.seo` 默认开启元数据和结构化数据；如果插件已经输出 canonical、Open Graph 或 JSON-LD，请关闭对应开关。Halo 注入的 title 和 description 不会被主题重复输出。

## 3. 实机回归

已在 Halo `2.27.2` 中导入该配置并验证：

| 页面                                               | 结果                           |
| -------------------------------------------------- | ------------------------------ |
| `/`、`/page/2`                                     | 200                            |
| `/archives`、`/archives/:slug`、`/archives/page/2` | 200                            |
| `/categories`、`/categories/:slug`                 | 200                            |
| `/tags`、`/tags/:slug`                             | 200                            |
| `/authors/:name`                                   | 200                            |
| `/links`、`/photos`、`/moments` 及详情页           | 200                            |
| 四套 scheme 首页桌面/移动端                        | 无横向溢出，动画结束后布局正常 |

同时确认：

- 自定义站点标题、二级标题、Halo 菜单、社交链接、备案、版权、Creative Commons 均正常渲染。
- 侧边头像可读取自定义地址并回退到 `site.logo`；`rounded=1/0` 分别输出圆形/方形，`rotated=1/0` 分别启停悬浮旋转。
- 搜索插件和评论插件资源正常注入。
- 首页正文 HTML、文章元信息、目录和侧栏统计正常输出。
- 浏览器控制台无未处理异常。

## 4. 升级操作建议

1. 在 Halo Console 中安装新主题包并启用。
2. 使用 `pnpm check:config` 检查导出的旧配置。
3. 在主题设置中确认站点标题、菜单、首页正文模式、动画和主题色。
4. 在 Console → 菜单中创建包含 `/photos`、`/moments`、`/links` 的菜单，并在主题设置中选择它。
5. 运行 smoke 检查：

```bash
HALO_URL=http://localhost:8090 \
SMOKE_ROUTES='/page/2,/authors/admin,/photos,/moments,/links' \
pnpm smoke
```
