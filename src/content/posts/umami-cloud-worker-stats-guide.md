---
title: 用 Cloudflare Worker 给 Astro 博客接入 Umami 访客统计
published: 2026-05-12
description: 记录一次为 Astro 博客接入 Umami Cloud、Cloudflare Worker 代理、首页历史访客数和文章浏览量的完整过程，并总结几个容易踩坑的 API 路径问题。
tags: [Astro, Umami, Cloudflare Worker, 数据统计, 技术折腾]
category: 技术笔记
draft: false
---

# 用 Cloudflare Worker 给 Astro 博客接入 Umami 访客统计

今天给博客补上了 Umami 统计：页面访问由 Umami 脚本记录，统计读取则通过 Cloudflare Worker 做一层安全代理。这样前端既能显示首页历史访客数和文章页浏览量，又不会把 Umami API Key 暴露到浏览器里。

这篇文章记录完整接入过程。文中的域名、网站 ID 和密钥都使用占位符，照着做时请替换成自己的配置。

## 为什么要加 Worker 代理

Umami 的统计脚本本身可以直接放在网页里：

```html
<script
	defer
	src="https://cloud.umami.is/script.js"
	data-website-id="<YOUR_WEBSITE_ID>"
></script>
```

这段脚本只负责“记录访问”。如果想在自己的页面上显示统计数据，比如“历史访客数”或“当前文章浏览量”，就需要调用 Umami API。

问题在于：Umami Cloud API 需要 API Key。这个 Key 不能写进前端，否则任何人打开浏览器开发者工具都能看到。

所以结构变成这样：

```text
浏览器
  -> Cloudflare Worker
  -> Umami Cloud API
  -> Worker 返回安全裁剪后的统计结果
  -> 页面显示 views / visitors
```

前端只知道 Worker 地址，不知道 API Key。

## 第一步：在全站 Layout 加载 Umami 脚本

Astro 中可以用 `import.meta.env.PROD` 判断是否是生产环境。这样本地开发时不会加载统计脚本，也不会污染访问数据。

示例：

```astro
---
const isProduction = import.meta.env.PROD;
---

{
	isProduction && (
		<script
			is:inline
			defer
			src="https://cloud.umami.is/script.js"
			data-website-id="<YOUR_WEBSITE_ID>"
		></script>
	)
}
```

这里的 `data-website-id` 不是 API Key，但仍建议不要在文章里写自己的真实值。公开代码仓库中它通常不可避免会出现，写教程时用占位符即可。

## 第二步：准备 Cloudflare Worker 环境变量

在 Cloudflare Worker 里配置：

```text
Secrets:
UMAMI_API_KEY=<YOUR_UMAMI_API_KEY>

Variables:
UMAMI_API_URL=https://api.umami.is
UMAMI_WEBSITE_ID=<YOUR_WEBSITE_ID>
```

注意：`UMAMI_API_URL` 填 `https://api.umami.is`，不要填 `https://cloud.umami.is`。前者是 API 域名，后者是统计脚本和管理页面相关域名。

## 第三步：实现 Worker 统计代理

最终可用的 Umami Cloud stats endpoint 是：

```text
https://api.umami.is/v1/websites/<YOUR_WEBSITE_ID>/stats
```

Worker 里拼接时，可以兼容用户把 `UMAMI_API_URL` 写成 `https://api.umami.is/v1` 的情况，所以先去掉结尾的 `/v1`：

```js
const apiBase = env.UMAMI_API_URL.replace(/\/$/, "").replace(/\/v1$/, "");
const url = new URL(`${apiBase}/v1/websites/${env.UMAMI_WEBSITE_ID}/stats`);
```

认证头使用：

```js
{
	"x-umami-api-key": env.UMAMI_API_KEY
}
```

Worker 最后只返回前端需要的字段：

```json
{
	"ok": true,
	"views": 123,
	"visitors": 45
}
```

不要把 `rawStats`、请求头、API Key 或账户信息返回给前端。调试阶段可以临时返回上游状态码，但上线后要删掉。

## 第四步：读取 pageviews 和 visitors

Umami 的返回结构可能因版本不同略有差异。有的字段直接是数字，有的可能是对象：

```js
function num(value) {
	return Number(value?.value ?? value);
}

const views = num(stats.pageviews ?? stats.views);
const visitors = num(stats.visitors);
```

这样无论返回：

```json
{ "pageviews": 3, "visitors": 2 }
```

还是：

```json
{ "pageviews": { "value": 3 }, "visitors": { "value": 2 } }
```

都能正常解析。

## 第五步：给前端做一个通用 Stats 组件

前端组件只做三件事：

1. 读取当前 `window.location.pathname`
2. 请求 Worker：`<WORKER_URL>/?path=<CURRENT_PATH>`
3. 根据需要显示 `views` 或 `visitors`

示例：

```js
const url = new URL("<YOUR_WORKER_URL>");
url.searchParams.set("path", window.location.pathname || "/");

const response = await fetch(url, {
	headers: { Accept: "application/json" },
});
const data = await response.json();
```

首页使用 `visitors`，文章页使用 `views`。

## 第六步：首页显示历史访客数

站点统计卡片里新增一行：

```text
历史访客数  <visitors>
```

样式直接沿用原来的站点统计 widget：图标、字号、颜色和间距都保持一致，这样不会让统计功能像“硬塞进去”的外部模块。

移动端如果使用 drawer 或侧边栏折叠面板，需要确认站点统计组件也被加入移动端组件列表。我的做法是把站点统计放在移动端抽屉里的倒数第二个，刚好显示在友情链接之前：

```ts
drawer: [
	"profile",
	"announcement",
	"music-sidebar",
	"categories",
	"tags",
	"site-stats",
	"friend-links",
]
```

## 第七步：文章页显示当前文章浏览量

文章页可以在发布日期、分类、标签这些 meta 信息旁边追加浏览量：

```text
浏览量  <views>
```

关键点是查询路径要等于当前文章的真实 URL path，例如：

```text
/posts/example-post/
```

如果文章 permalink 有自定义规则，尽量用 `window.location.pathname`，不要手写 slug 拼接。这样以后改链接结构时，统计查询也不会跟着坏掉。

## 第八步：几个踩坑点

### 1. `cloud.umami.is` 和 `api.umami.is` 不是一回事

统计脚本来自：

```text
https://cloud.umami.is/script.js
```

API 请求使用：

```text
https://api.umami.is
```

把 API URL 写成 `cloud.umami.is` 会遇到 404 或 HTML 错误页。

### 2. Cloud API 的可用 stats 路径

这次最终确认可用的是：

```text
/v1/websites/<YOUR_WEBSITE_ID>/stats
```

不要拼成 self-hosted 风格的：

```text
/api/websites/<YOUR_WEBSITE_ID>/stats
```

也不要在 `https://api.umami.is` 后漏掉 `/v1`。

### 3. `startAt=0` 不一定是好主意

我最后使用站点创建附近的时间作为默认起点：

```js
const START_AT = Date.parse("2026-05-11T00:00:00.000Z");
```

实际使用时可以换成你的网站上线日期。这样历史统计范围更明确，也避免请求一个过大的时间跨度。

### 4. 调试信息要及时删掉

调试 Worker 时，可以临时返回：

```json
{
	"upstreamStatus": 200,
	"upstreamUrl": "...",
	"rawStats": {}
}
```

但上线后建议只返回：

```json
{
	"ok": true,
	"views": 3,
	"visitors": 2
}
```

统计数据本身通常不是敏感信息，但账户结构、上游返回原文和内部 URL 没必要长期暴露。

## 最终效果

接入完成后：

- Umami 脚本只在生产环境记录访问
- API Key 只存在 Worker Secret 里
- 首页能显示历史访客数
- 文章页能显示当前文章浏览量
- 本地开发不会污染统计
- 移动端也能看到站点统计面板

这套方案比较适合 Astro + Cloudflare Pages + Umami Cloud 的组合。核心原则很简单：记录访问可以放前端，读取统计要走服务端代理；公开教程和提交记录里，只写结构和占位符，不写自己的密钥与账户信息。
