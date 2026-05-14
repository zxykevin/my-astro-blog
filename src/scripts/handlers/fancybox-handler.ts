/**
 * Fancybox 处理器
 * 管理图片灯箱的初始化和清理
 */

import {
	FANCYBOX_SELECTORS,
	getDefaultFancyboxConfig,
} from "../core/swup-config";

// Fancybox 模块类型
type FancyboxType = any;

/**
 * Fancybox 处理器类
 * 负责图片灯箱的按需加载和管理
 */
export class FancyboxHandler {
	private Fancybox: FancyboxType | null = null;
	private boundSelectors: string[] = [];
	private initialized = false;

	/**
	 * 初始化 Fancybox
	 * 按需加载 Fancybox 模块和样式
	 */
	async init(): Promise<void> {
		const hasImages = this.checkForImages();

		if (!hasImages) {
			return;
		}

		// 按需加载 Fancybox 模块
		if (!this.Fancybox) {
			await this.loadFancybox();
		}

		// 避免重复初始化
		if (this.boundSelectors.length > 0) {
			return;
		}

		this.bindImageSelectors();
		this.initialized = true;
	}

	/**
	 * 检查页面是否有需要 Fancybox 的图片
	 */
	private checkForImages(): boolean {
		return (
			document.querySelector(FANCYBOX_SELECTORS.albumImages) !== null ||
			document.querySelector(FANCYBOX_SELECTORS.albumLinks) !== null ||
			document.querySelector(FANCYBOX_SELECTORS.galleryImages) !== null ||
			document.querySelector(FANCYBOX_SELECTORS.singleFancybox) !== null
		);
	}

	private normalizeLightboxSources(): void {
		document
			.querySelectorAll<HTMLImageElement>(".custom-md img, #post-cover img")
			.forEach((img) => {
				const source = this.getOptimizedImageSource(img);
				if (source) {
					img.setAttribute("data-src", source);
				}
			});

		document
			.querySelectorAll<HTMLElement>("[data-fancybox]")
			.forEach((element) => {
				const image = element.querySelector("img");
				const currentSource = element.getAttribute("data-src");
				const optimizedSource = image
					? this.getOptimizedImageSource(image)
					: null;

				if (
					optimizedSource &&
					(!currentSource || this.isOriginalImageSource(currentSource))
				) {
					element.setAttribute("data-src", optimizedSource);
				}
			});
	}

	private getOptimizedImageSource(img: HTMLImageElement): string | null {
		return this.getMappedLightboxSource(
			img.currentSrc || img.getAttribute("src"),
		);
	}

	private isOriginalImageSource(src: string): boolean {
		return !src.includes("/_astro/");
	}

	private getMappedLightboxSource(src: string | null): string | null {
		if (!src) {
			return null;
		}

		const imageMap = (window as any).__mizukiLightboxImageMap as
			| Record<string, string>
			| undefined;

		return imageMap?.[src] || src;
	}

	/**
	 * 加载 Fancybox 模块和样式
	 */
	private async loadFancybox(): Promise<void> {
		const mod = await import("@fancyapps/ui");
		this.Fancybox = mod.Fancybox;
		await import("@fancyapps/ui/dist/fancybox/fancybox.css");
	}

	/**
	 * 绑定图片选择器
	 */
	private bindImageSelectors(): void {
		if (!this.Fancybox) {
			return;
		}

		const commonConfig = getDefaultFancyboxConfig();
		this.normalizeLightboxSources();

		// 绑定相册/文章图片
		this.Fancybox.bind(FANCYBOX_SELECTORS.albumImages, {
			...commonConfig,
			source: (el: HTMLImageElement) => {
				return el.getAttribute("data-src") || this.getOptimizedImageSource(el);
			},
			groupAll: true,
			Carousel: {
				transition: "slide",
				preload: 2,
			},
		});
		this.boundSelectors.push(FANCYBOX_SELECTORS.albumImages);

		// 绑定相册链接
		this.Fancybox.bind(FANCYBOX_SELECTORS.albumLinks, {
			...commonConfig,
			source: (el: any) => {
				return el.getAttribute("data-src") || el.getAttribute("href");
			},
		});
		this.boundSelectors.push(FANCYBOX_SELECTORS.albumLinks);

		// Bind gallery page images without URL hash updates.
		this.Fancybox.bind(FANCYBOX_SELECTORS.galleryImages, {
			...commonConfig,
			Hash: false,
			source: (el: HTMLElement) => {
				return el.getAttribute("data-src");
			},
		});
		this.boundSelectors.push(FANCYBOX_SELECTORS.galleryImages);

		// 绑定单独的 fancybox 图片
		this.Fancybox.bind(FANCYBOX_SELECTORS.singleFancybox, commonConfig);
		this.boundSelectors.push(FANCYBOX_SELECTORS.singleFancybox);
	}

	/**
	 * 清理 Fancybox 绑定
	 * 在页面切换前调用
	 */
	cleanup(): void {
		if (!this.Fancybox) {
			return;
		}

		this.boundSelectors.forEach((selector) => {
			this.Fancybox.unbind(selector);
		});
		this.boundSelectors = [];
	}

	/**
	 * 完全销毁 Fancybox
	 */
	destroy(): void {
		this.cleanup();
		this.Fancybox = null;
		this.initialized = false;
	}

	/**
	 * 获取初始化状态
	 */
	isInitialized(): boolean {
		return this.initialized;
	}

	/**
	 * 获取已绑定的选择器列表
	 */
	getBoundSelectors(): string[] {
		return [...this.boundSelectors];
	}
}

// 创建全局实例
let globalFancyboxHandler: FancyboxHandler | null = null;

/**
 * 获取全局 Fancybox 处理器实例
 */
export function getFancyboxHandler(): FancyboxHandler {
	if (!globalFancyboxHandler) {
		globalFancyboxHandler = new FancyboxHandler();
	}
	return globalFancyboxHandler;
}

/**
 * 初始化 Fancybox（便捷函数）
 */
export async function initFancybox(): Promise<void> {
	const handler = getFancyboxHandler();
	await handler.init();
}

/**
 * 清理 Fancybox（便捷函数）
 */
export function cleanupFancybox(): void {
	if (globalFancyboxHandler) {
		globalFancyboxHandler.cleanup();
	}
}
