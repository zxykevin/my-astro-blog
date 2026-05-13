/**
 * Fancybox handler.
 * Manages image lightbox initialization and cleanup.
 */

import {
	FANCYBOX_SELECTORS,
	getDefaultFancyboxConfig,
} from "../core/swup-config";

type FancyboxType = any;

export class FancyboxHandler {
	private Fancybox: FancyboxType | null = null;
	private boundSelectors: string[] = [];
	private initialized = false;

	async init(): Promise<void> {
		const hasImages = this.checkForImages();

		if (!hasImages) {
			return;
		}

		if (!this.Fancybox) {
			await this.loadFancybox();
		}

		if (this.boundSelectors.length > 0) {
			return;
		}

		this.bindImageSelectors();
		this.initialized = true;
	}

	private checkForImages(): boolean {
		return (
			document.querySelector(FANCYBOX_SELECTORS.albumImages) !== null ||
			document.querySelector(FANCYBOX_SELECTORS.albumLinks) !== null ||
			document.querySelector(FANCYBOX_SELECTORS.singleFancybox) !== null
		);
	}

	private async loadFancybox(): Promise<void> {
		const mod = await import("@fancyapps/ui");
		this.Fancybox = mod.Fancybox;
		await import("@fancyapps/ui/dist/fancybox/fancybox.css");
	}

	private bindImageSelectors(): void {
		if (!this.Fancybox) {
			return;
		}

		const commonConfig = getDefaultFancyboxConfig();

		this.Fancybox.bind(FANCYBOX_SELECTORS.albumImages, {
			...commonConfig,
			groupAll: true,
			Carousel: {
				transition: "slide",
				preload: 2,
			},
		});
		this.boundSelectors.push(FANCYBOX_SELECTORS.albumImages);

		this.Fancybox.bind(FANCYBOX_SELECTORS.albumLinks, {
			...commonConfig,
			source: (el: HTMLElement) =>
				el.getAttribute("data-src") || el.getAttribute("href"),
		});
		this.boundSelectors.push(FANCYBOX_SELECTORS.albumLinks);

		this.Fancybox.bind(FANCYBOX_SELECTORS.singleFancybox, commonConfig);
		this.boundSelectors.push(FANCYBOX_SELECTORS.singleFancybox);
	}

	cleanup(): void {
		if (!this.Fancybox) {
			return;
		}

		this.boundSelectors.forEach((selector) => {
			this.Fancybox.unbind(selector);
		});
		this.boundSelectors = [];
	}

	destroy(): void {
		this.cleanup();
		this.Fancybox = null;
		this.initialized = false;
	}

	isInitialized(): boolean {
		return this.initialized;
	}

	getBoundSelectors(): string[] {
		return [...this.boundSelectors];
	}
}

let globalFancyboxHandler: FancyboxHandler | null = null;

export function getFancyboxHandler(): FancyboxHandler {
	if (!globalFancyboxHandler) {
		globalFancyboxHandler = new FancyboxHandler();
	}
	return globalFancyboxHandler;
}

export async function initFancybox(): Promise<void> {
	const handler = getFancyboxHandler();
	await handler.init();
}

export function cleanupFancybox(): void {
	if (globalFancyboxHandler) {
		globalFancyboxHandler.cleanup();
	}
}
