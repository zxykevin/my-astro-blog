import type { ImageMetadata } from "astro";

import numazu001 from "../assets/gallery/numazu-2026/001.jpg";
import numazu002 from "../assets/gallery/numazu-2026/002.jpg";
import numazuCover from "../assets/gallery/numazu-2026/cover.jpg";

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
		slug: "numazu-2026",
		title: "沼津 2026",
		description:
			"把海风、车站与熟悉的街角收进相册。这里先放一组静态示例，之后替换为真实旅途照片即可。",
		date: "2026-04-12",
		cover: numazuCover,
		location: "日本 静冈县 沼津市",
		tags: ["日本旅行", "沼津", "巡礼"],
		photos: [
			{
				src: numazu001,
				alt: "沼津街景与旅途记忆",
				caption: "午后的街角与海边小城的慢节奏。",
				camera: "待补充拍摄设备",
			},
			{
				src: numazu002,
				alt: "沼津巡礼路上的风景",
				caption: "从车站出发，把喜欢的作品坐标一点点连起来。",
			},
		],
	},
];

export const getGalleryBySlug = (slug: string): Gallery | undefined =>
	galleries.find((gallery) => gallery.slug === slug);
