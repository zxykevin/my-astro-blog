# 星轨手札

这是我的个人博客，基于 Astro 与 Mizuki 主题改造，用来记录德国留学生活、日本旅行、动漫巡礼，以及 VPS / Linux / HarmonyOS 等技术折腾。

## 内容方向

- 德国留学：课程、租房、办手续、交通、日常生活和海外学习体验。
- 日本旅行：关西、关东、城市漫游、路线规划和旅行复盘。
- 动漫巡礼：把喜欢的作品放回真实地图里，记录车站、街角、海边和取景地。
- 技术笔记：VPS、Linux、自建服务、网络配置、HarmonyOS 和日常折腾。

## 本地运行

先进入项目目录：

```powershell
Set-Location G:\zxykevin\Documents\Mizuki
```

安装依赖：

```bash
pnpm install
```

启动开发预览：

```bash
pnpm dev
```

启动后终端会显示本地地址，通常是：

```text
http://localhost:4321/
```

## 打包构建

```bash
pnpm build
```

构建产物会生成到 `dist/` 目录。

## 写文章

文章放在：

```text
src/content/posts/
```

已有示例：

- `germany-student-daily.md`：德国留学日常
- `osaka-to-tokyo-anime-pilgrimage.md`：大阪到东京的日本巡礼路线
- `build-vps-node-from-zero.md`：从零搭建 VPS 节点

常用 frontmatter 示例：

```md
---
title: 文章标题
published: 2026-05-09
description: 文章简介
tags: [德国留学, 日本旅行, 技术笔记]
category: 德国留学
draft: false
---
```

## 站点配置

主要配置文件：

```text
src/config.ts
```

这里可以修改站点名称、导航栏、首页横幅文案、个人资料、评论、音乐播放器、侧边栏组件等。

## 许可说明

本博客代码基于 Mizuki / Astro 主题改造。仓库中保留的 `LICENSE` 与 `LICENSE.MIT` 是上游代码许可声明，用于满足开源许可要求；博客文章内容与个人图片素材不自动适用这些代码许可。
