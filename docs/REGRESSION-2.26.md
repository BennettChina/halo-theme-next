# Halo 2.26 回归测试记录

- 测试日期：2026-11-05
- 主题版本：`1.0.0`
- 测试包：`dist/theme-halo-next-1.0.0.zip`
- 结论：Halo `2.26.0`、`2.26.1` 回归通过，`theme.yaml` 最低兼容版本可保持 `>=2.26.0`。未发现需要修改 Thymeleaf 模板或运行时 JavaScript 的兼容性问题。

## 1. 测试环境

| 项目          | 配置                                                  |
| ------------- | ----------------------------------------------------- |
| Halo `2.26.0` | `halohub/halo:2.26.0`，独立干净实例，本地端口 `18092` |
| Halo `2.26.1` | `halohub/halo:2.26.1`，独立干净实例，本地端口 `18091` |
| 主题安装方式  | Console 上传 ZIP，安装、启用并重载                    |
| Links         | `2.5.0`                                               |
| Photos        | `2.1.2`                                               |
| Moments       | `1.19.0`                                              |
| 浏览器检查    | Chrome Headless + CDP，桌面和移动端视口               |
| 自动化检查    | `pnpm smoke`，真实 Halo HTTP 请求                     |

两个实例均为全新 Halo 数据目录，未复用开发实例数据。

## 2. 安装与布局契约

| 检查项              | Halo `2.26.0`             | Halo `2.26.1`             |
| ------------------- | ------------------------- | ------------------------- |
| ZIP 上传安装        | 通过                      | 通过                      |
| 主题启用            | 通过                      | 通过                      |
| 主题重载            | 通过                      | 通过                      |
| 同版本 ZIP 覆盖升级 | 通过                      | 通过                      |
| 主题状态            | `READY`                   | `READY`                   |
| `pageLayout.state`  | `SUPPORTED`               | `SUPPORTED`               |
| `pageLayout.reason` | `LayoutTemplateSupported` | `LayoutTemplateSupported` |
| 模板异常            | 无                        | 无                        |

主题在 `2.26.0` 和 `2.26.1` 中都能识别 `templates/layout.html` 的 `html(head, content)` 契约，Halo 插件页面可以使用主题布局。

## 3. 测试数据

Halo `2.26.1` 使用完整回归数据：

- 15 篇文章：`Hello Halo` 与 `reg-post-01` 至 `reg-post-14`，覆盖首页多页分页。
- 多级分类：父分类 `reg-parent`、子分类 `reg-child`。
- 三级菜单：父菜单、子菜单、孙菜单。
- 菜单图标 annotation。
- Links、Photos、Moments 插件数据：`reg-link`、`reg-photo`、`reg-moment`，并分别建立分组和标签。

Halo `2.26.0` 使用核心内容和空插件状态，重点验证最低声明版本的主题安装、布局契约和基础路由。

## 4. 核心路由

Halo `2.26.0` 与 `2.26.1` 均返回 `200`，页面无模板异常：

| 路由                                | 结果           |
| ----------------------------------- | -------------- |
| `/`                                 | 200            |
| `/page/2`                           | 200            |
| `/archives`                         | 200            |
| `/archives/hello-halo`              | 200            |
| `/archives/reg-post-01`             | 200            |
| `/categories`                       | 200            |
| `/categories/reg-parent`            | 200            |
| `/categories/reg-child`             | 200            |
| `/tags`                             | 200            |
| `/tags/halo`                        | 200            |
| `/authors/admin`                    | 200            |
| `/about`                            | 200            |
| `/privacy-policy`                   | 200            |
| 不存在的页面（`Accept: text/html`） | 404 主题错误页 |

分类列表正确输出子分类嵌套结构，三级菜单正确递归渲染。

## 5. 插件页面

| 插件    | 版本     | 路由                            | Halo `2.26.1` | Halo `2.26.0` 空状态 |
| ------- | -------- | ------------------------------- | ------------- | -------------------- |
| Links   | `2.5.0`  | `/links`                        | 200           | 200                  |
| Links   | `2.5.0`  | `/links?group=reg-link-group`   | 200           | 未覆盖分组           |
| Photos  | `2.1.2`  | `/photos`                       | 200           | 200                  |
| Photos  | `2.1.2`  | `/photos?group=reg-photo-group` | 200           | 未覆盖分组           |
| Photos  | `2.1.2`  | `/photos/reg-photo`             | 200           | 无数据               |
| Moments | `1.19.0` | `/moments`                      | 200           | 200                  |
| Moments | `1.19.0` | `/moments?tag=NexT`             | 200           | 未覆盖标签           |
| Moments | `1.19.0` | `/moments/reg-moment`           | 200           | 无数据               |

`2.26.0` 验证了三个插件的安装、启用和空状态列表页，说明插件路由和主题布局可以正常工作。完整插件数据、分组和详情页在 `2.26.1` 验证。

## 6. Scheme、侧栏与暗色模式

Halo `2.26.1` 上遍历四套 scheme 和左右侧栏，每次保存配置并重载主题：

| Scheme | 左侧栏 | 右侧栏 | 首页 | 文章页 | 模板异常 |
| ------ | ------ | ------ | ---- | ------ | -------- |
| Muse   | 通过   | 通过   | 200  | 200    | 无       |
| Mist   | 通过   | 通过   | 200  | 200    | 无       |
| Pisces | 通过   | 通过   | 200  | 200    | 无       |
| Gemini | 通过   | 通过   | 200  | 200    | 无       |

每种组合都确认：

- 页面输出对应的 `scheme-<Name>` 类名。
- 暗色模式输出 `color-scheme-auto`。
- 主题配置保存、主题重载和静态资源请求成功。
- 首页和文章页无模板异常。

## 7. 浏览器检查

使用 Chrome Headless + CDP 检查首页和文章页：

- 桌面和移动端视口均无横向溢出。
- 图片加载失败数量为 0。
- 菜单渲染 11 项，包含 2 层嵌套子菜单。
- 文章页 TOC、相关文章和 Halo 评论组件正常渲染。
- 控制台唯一的资源 404 是站点未配置 favicon 时的 `/favicon.ico`，属于 Halo 站点设置，不是主题模板问题。

截图保存在测试机 `/tmp/halo226-home-desktop.png`、`/tmp/halo226-home-mobile.png` 和 `/tmp/halo226-post-desktop.png`，未纳入仓库。

## 8. 自动化 smoke

Halo `2.26.1` 上执行：

```bash
HALO_URL=http://localhost:18091 \
SMOKE_ROUTES='/page/2,/archives/reg-post-01,/tags/halo,/categories/default,/authors/admin,/about,/privacy-policy,/links,/photos,/moments' \
SMOKE_MAX_LINKS=50 \
pnpm smoke
```

结果：检查页面 22 个、静态资源 9 个，全部通过。

补充说明：直接请求不存在的路由且不发送 `Accept: text/html` 时，Halo 返回 JSON 404；带上 HTML Accept 头后主题错误页正常渲染。这是 Halo 的内容协商行为，不是主题缺陷。

## 9. 已知限制

- Halo `2.26.0` 使用插件空状态数据验证列表页，详情页和分组数据在 `2.26.1` 覆盖。
- 标签、分类、作者和归档的空列表状态未全部覆盖。
- 搜索插件全链路、评论开启/关闭组合和自定义 permalink 仍需扩大回归范围。
- 全站逐页截图对比尚未接入 CI，目前依赖人工抽查和 `pnpm smoke`。
- 站点未配置 favicon 时浏览器会请求 `/favicon.ico` 并得到 404，需在 Halo 系统设置中配置站点图标。

## 10. 结论

本次回归没有发现 Halo `2.26.0` 或 `2.26.1` 特有的模板、路由、插件或资源兼容性缺陷。`theme.yaml` 最低兼容版本可以声明为 `>=2.26.0`，无需针对 2.26.x 增加模板分支。
