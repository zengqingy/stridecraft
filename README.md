# Stridecraft 静态产品展示

纯 HTML / CSS / JS，8 个页面，无安装、构建或服务器依赖。入口为 index.html。

## 初学者使用步骤

1. 打开 index.html 浏览；管理入口在每页页脚。
2. admin.html 默认口令为 8888。口令仅是演示门禁，可从源代码看到，不保护数据。
3. 产品标签中编辑 JSON 里的文字后保存，刷新产品列表和对应详情页查看结果。保留字段名称、引号和逗号。
4. 图片标签可上传图片或替换地址；本地上传存入 IndexedDB。
5. 预订购买页提交后，在同一浏览器的管理页查看名单。不会发送邮件或同步给商家。
6. 备份标签导出包含图片的 JSON；导入会替换本机数据。导出必须能读取远程图片，否则会提示失败，不导出不完整文件。

数据保存在 localStorage 的 stridecraft_site_v1。管理登录保存在 sessionStorage。所有页面须处于相同站点来源；浏览器对直接打开 file:// 文件的存储和读取规则不同。发布到静态托管（例如 GitHub Pages）可获得一致的同源存储行为。本项目不包含服务器。清除浏览器数据会丢失咨询与上传图片，请先备份。

网站文字、价格、产品线稿及规格为演示内容，无医疗、认证或真实评价声明。产品尚未提供 GLB，Phase 2 已使用 Three.js 基础几何体显示概念助行器，并在画布后保留 SVG poster；GLB 加载失败或 WebGL 不可用时显示 poster。

图片完整清单见 [IMAGE-SLOTS.md](IMAGE-SLOTS.md)。开发约定见 [AGENTS.md](AGENTS.md)。

## 验证记录

使用 Chromium / Playwright 浏览器请求拦截读取本地文件（未启动本地服务器），同一测试来源运行八页：

- 八页所有已渲染图片 complete 且 naturalWidth > 0，无空 src、无未解决的损坏图片；远程不可用时使用 SVG 回退。
- 后台修改第一款产品名称后，产品列表和详情页均显示新名称。
- 表单提交测试咨询后，后台名单出现对应记录。
- 本地 SVG 与 IndexedDB 上传图均嵌入备份，并成功恢复为 IndexedDB 引用。测试使用本地氛围图替身；远程氛围图导出依赖目标站点允许跨域读取。
- 三个 JS 文件通过 node --check；无浏览器未捕获异常。

测试来源的演示改名与咨询已清理；测试浏览器为独立临时环境。未验证 file:// 模式（环境浏览器策略禁止），未部署 GitHub Pages。

## Phase 2：3D 与滚动叙事

首页顺序：全屏 Hero → 三步固定滚动 3D → 10 款产品网格 → 理念 → 页尾咨询 CTA。桌面模型由正面转到 45°、90°；手机与减少动态效果模式固定 45°，不固定滚动、不使用擦洗。减少动态效果模式也跳过 Hero 与卡片动画。

`src/js/viewer.js` 导出 `createViewer(canvas, modelPath, options)`，返回 `rotateTo(radians)`、`setColor(cssColor)` 与 `dispose()`。可选参数 angle、color、interactive。距离视口 200px 内初始化；离视口 900px 外释放，列表最多三个活跃 WebGL 上下文。被回收的画布保留 SVG，下一次进入观察区域时可重新初始化。详情页支持拖动、配色和按钮切换角度。GLB 路径继续来自原有 model 字段，数据形状与后台逻辑未改变。

运行库固定版本随 src/vendor 保存，不需要安装依赖。字体使用 Google Fonts 的 Noto Serif SC / Noto Sans SC，网络不可用时使用系统回退字体。

开发验证：已有 Playwright 与 Chromium 的环境中执行 `node tests/phase2.cjs`。测试通过浏览器拦截响应读取本地文件，不启动服务器；测试桌面固定、手机无固定、减少动态效果、基础几何体、GLB 404 回退、WebGL 不可用、三个上下文上限，以及后台改名/咨询回归。测试没有实际生产 GLB；未来真实模型还需检查材质、比例与外部纹理。store.js 与 src/admin.js 保持原样。

## Phase 3：视觉与无障碍

- 指定 liquid-glass 配方仅用于粘性导航、产品卡片悬停/键盘聚焦浮层、咨询表单卡片。Firefox/Safari 与不支持 backdrop-filter 的浏览器使用指定不透明背景回退。
- 三类原创 Lottie：折叠示意、咨询保存、空咨询名单。每个 JSON 小于 1KB，静态 SVG 回退均小于 250B。播放器为固定版本 @lottiefiles/dotlottie-web@0.44.0，经 jsDelivr CDN 按视口 200px 懒加载，使用 Canvas；播放器与 WASM 本身不计入动画素材大小。关闭屏幕外播放，不循环播放。
- 减少动态效果时不请求 Lottie CDN、不自动播放；运行时开启该偏好会销毁播放器并显示 SVG。GSAP 显示最终状态、无固定滚动，3D 无自动旋转。所有三维视图按需重绘，不持续运行渲染循环。
- 详情页支持拖动、双指缩放（相机距离 2–6）、双击/双触重置；另有键盘可用的观察角度与重置按钮。非详情画布保留竖向触摸滚动。画布有可访问名称与相邻说明。
- 所有交互元素使用 2px #5A6B4E 焦点框，偏移 3px；原生 details/summary 支持 Enter/Space。后台标签补齐 tabpanel 关系和方向键/Home/End 操作，存储与门禁逻辑未修改。非 Hero 图片懒加载。

### 实测结果与范围

Chromium / axe-core 4.10.3：八页 WCAG 2/2.1 A、AA 扫描零违规；另检查登录后后台标签。手动脚本覆盖键盘折叠面板、后台方向键、双指缩放、双击/双触重置、减少动态效果、三类状态图与 Phase 2 回归。

Lighthouse 12.8.2 首页移动端模拟：**Performance 94，Accessibility 100**。报告：[HTML](reports/lighthouse-phase3.html)、[指标摘要](reports/phase3-summary.json)。使用浏览器响应拦截读取仓库文件，无本地应用服务器；这不是已部署网站的生产基准。当前云浏览器的 Google Fonts 连接失败、CDN 证书不被信任，因此评分使用回退字体。未关闭 TLS 校验。

为验证实际 Lottie 播放，通过正常 TLS 校验下载同版本 CDN JS/WASM，再由测试拦截提供这些原始字节。三类动画的实际播放与减少动态效果静态回退均测试；环境中的浏览器直连 CDN 仍失败，部署后需确认目标网络可访问 CDN。没有网络时仍可使用 SVG 与文字反馈。

开发测试（测试工具独立于站点，无站点安装/构建步骤）：

```sh
AXE_PATH=/path/to/axe-core/axe.min.js CDN_ASSET_DIR=/path/to/verified-cdn-files node tests/phase3.cjs
LIGHTHOUSE_MODULE=/path/to/lighthouse/core/index.js node tests/lighthouse.cjs
```

CDN_ASSET_DIR 可选；提供时目录应含从固定 CDN 通过正常 TLS 校验取得的 index.js 和 dotlottie-player.wasm。测试需已有 Playwright、Chromium；Lighthouse 测试另需 Lighthouse。测试用来源与数据为独立临时浏览器，不修改真实用户数据。
