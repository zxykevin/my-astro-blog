export interface GalleryPhoto {
	src: string;
	alt: string;
	caption: string;
	camera?: string;
}

export interface Gallery {
	slug: string;
	title: string;
	description: string;
	date: string;
	cover: string;
	location: string;
	tags: string[];
	photos: GalleryPhoto[];
}

export const galleries: Gallery[] = [
	{
		slug: "numazu-2026",
		title: "沼津 2026",
		description:
			"把海风、车站与熟悉的街角收进相册。这里先放一组静态示例，等照片补齐后就能直接展示。",
		date: "2026-04-12",
		cover: "/images/gallery/numazu/cover.webp",
		location: "日本 静冈县 沼津市",
		tags: ["日本旅行", "沼津", "巡礼"],
		photos: [
			{
				src: "/images/gallery/numazu/001.webp",
				alt: "沼津街景照片",
				caption: "午后的街角与海边小城的慢节奏。",
				camera: "Add camera info",
			},
			{
				src: "/images/gallery/numazu/002.webp",
				alt: "沼津旅途照片",
				caption: "从车站出发，把喜欢的作品坐标一点点连起来。",
			},
		],
	},
];

export const getGalleryBySlug = (slug: string): Gallery | undefined =>
	galleries.find((gallery) => gallery.slug === slug);
