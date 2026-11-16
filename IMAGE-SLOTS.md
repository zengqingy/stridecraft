# 图片槽位清单

默认数据位置：`src/js/store.js`。后台替换后，以当前浏览器保存的数据为准。

| 槽位 | 默认文件 / URL |
|---|---|
| 全站标志 | `assets/img/logo.svg` |
| 全站 favicon | `assets/img/favicon.svg` |
| 所有图片错误回退 | `assets/img/fallback.svg` |
| 首页氛围 hero | `https://picsum.photos/seed/stridecraft-home/1200/1400` |
| 理念氛围 philosophy | `https://picsum.photos/seed/stridecraft-philosophy/1200/800` |
| walker-01 / main（产品卡片、详情；前 3 款亦用于首页） | `assets/img/products/walker-01.svg` |
| walker-02 / main（产品卡片、详情；前 3 款亦用于首页） | `assets/img/products/walker-02.svg` |
| walker-03 / main（产品卡片、详情；前 3 款亦用于首页） | `assets/img/products/walker-03.svg` |
| walker-04 / main（产品卡片、详情；前 3 款亦用于首页） | `assets/img/products/walker-04.svg` |
| walker-05 / main（产品卡片、详情；前 3 款亦用于首页） | `assets/img/products/walker-05.svg` |
| walker-06 / main（产品卡片、详情；前 3 款亦用于首页） | `assets/img/products/walker-06.svg` |
| walker-07 / main（产品卡片、详情；前 3 款亦用于首页） | `assets/img/products/walker-07.svg` |
| walker-08 / main（产品卡片、详情；前 3 款亦用于首页） | `assets/img/products/walker-08.svg` |
| walker-09 / main（产品卡片、详情；前 3 款亦用于首页） | `assets/img/products/walker-09.svg` |
| walker-10 / main（产品卡片、详情；前 3 款亦用于首页） | `assets/img/products/walker-10.svg` |

所有产品 model 字段默认为空。Phase 2 以 Three.js 基础几何体显示助行器，SVG 仍作为画布后的 poster，加载失败时完全显示。首页特色区、10 款列表卡片与详情页复用对应产品 main 槽位；没有新增数据字段。首页氛围图片槽位保留供后台与备份使用，Phase 2 全屏文字 Hero 不渲染此照片。
所有产品 SVG 小于 8KB。氛围照片为固定 seed 的演示照片，不代表产品或品牌实拍。