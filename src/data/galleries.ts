import type { ImageMetadata } from "astro";

import jpTravel001 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/001.jpg";
import jpTravel002 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/002.jpg";
import jpTravel003 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/003.jpg";
import jpTravel004 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/004.jpg";
import jpTravel005 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/005.jpg";
import jpTravel006 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/006.jpg";
import jpTravel007 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/007.jpg";
import jpTravel008 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/008.jpg";
import jpTravel009 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/009.jpg";
import jpTravel010 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/010.jpg";
import jpTravel011 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/011.jpg";
import jpTravel012 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/012.jpg";
import jpTravel013 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/013.jpg";
import jpTravel014 from "../assets/gallery/osaka-kyoto-uji-toyosato-numazu-tokyo-2026/014.jpg";

export interface GalleryPhoto {
	src: ImageMetadata;
	alt: string;
	caption: string;
	camera?: string;
}

export interface Gallery {
	slug: string;
	title: string;
	description: string;
	date: string;
	cover: ImageMetadata;
	location: string;
	tags: string[];
	photos: GalleryPhoto[];
}

export const galleries: Gallery[] = [
	{
		slug: "osaka-kyoto-uji-toyosato-numazu-tokyo-2026",
		title: "大阪→京都→宇治→丰乡→沼津→东京旅游",
		description:
			"从关西一路走到东京，把大阪、京都、宇治、丰乡、沼津与东京的旅途片段收进同一个相册。",
		date: "2026-02-05",
		cover: jpTravel001,
		location: "日本 大阪、京都、宇治、丰乡、沼津、东京",
		tags: ["日本旅行", "关西", "巡礼", "沼津", "东京"],
		photos: [
			{
				src: jpTravel001,
				alt: "大阪到东京旅途的第一张照片",
				caption: "旅程开始，先把抵达日本的第一眼收好。",
			},
			{
				src: jpTravel002,
				alt: "大阪与京都旅途照片",
				caption: "在城市之间移动，街道、车站和行李都成了旅途的一部分。",
			},
			{
				src: jpTravel003,
				alt: "京都旅行途中拍摄的照片",
				caption: "京都的步调慢下来，适合把光影一点点记住。",
			},
			{
				src: jpTravel004,
				alt: "京都清晨旅行照片",
				caption: "清晨出发，沿着计划好的路线继续往前走。",
			},
			{
				src: jpTravel005,
				alt: "宇治旅行与巡礼照片",
				caption: "来到宇治，河岸、街巷和作品记忆在这里重叠。",
			},
			{
				src: jpTravel006,
				alt: "丰乡旅途巡礼照片",
				caption: "去丰乡，把屏幕里熟悉的地点变成脚下真实的路。",
			},
			{
				src: jpTravel007,
				alt: "关西旅行路上的照片",
				caption: "路上的一瞬间，也有值得停下来看的风景。",
			},
			{
				src: jpTravel008,
				alt: "日本夜晚旅行照片",
				caption: "夜色落下之后，城市换了一种更安静的表情。",
			},
			{
				src: jpTravel009,
				alt: "沼津旅行与海边城市照片",
				caption: "向沼津靠近，海边小城的气息慢慢浮出来。",
			},
			{
				src: jpTravel010,
				alt: "沼津夜晚旅行照片",
				caption: "夜晚的沼津，把一天的路程轻轻收尾。",
			},
			{
				src: jpTravel011,
				alt: "东京旅行途中拍摄的照片",
				caption: "抵达东京，旅程的节奏重新变得密集起来。",
			},
			{
				src: jpTravel012,
				alt: "东京夜景与城市旅行照片",
				caption: "东京的夜晚很亮，也很适合做旅程的注脚。",
			},
			{
				src: jpTravel013,
				alt: "东京白天旅行照片",
				caption: "继续在东京移动，把最后几段行程慢慢走完。",
			},
			{
				src: jpTravel014,
				alt: "日本旅行收尾照片",
				caption: "旅途接近尾声，留下最后一段清晰的记忆。",
			},
		],
	},
];

export const getGalleryBySlug = (slug: string): Gallery | undefined =>
	galleries.find((gallery) => gallery.slug === slug);
