/**
 * Fancybox handler.
 * Loads the viewer, binds image selectors, and upgrades previews from the
 * already-loaded thumbnail to the larger source after the overlay is open.
 */

import {
	FANCYBOX_SELECTORS,
	getDefaultFancyboxConfig,
} from "../core/swup-config";

type FancyboxType = any;
type FancyboxInstanceType = any;
type FancyboxSlideType = any;

const FANCYBOX_CLICK_SELECTOR =
	`${FANCYBOX_SELECTORS.albumImages}, ${FANCYBOX_SELECTORS.albumLinks}, ${FANCYBOX_SELECTORS.singleFancybox}`;
const ARTICLE_IMAGE_LINK_SELECTOR = ".custom-md a, #post-cover a";

export class FancyboxHandler {
	private Fancybox: FancyboxType | null = null;
	private boundSelectors: string[] = [];
	private initialized = false;
	private clickController: AbortController | null = null;
	private preloadedUrls = new Set<string>();
	private preparedTriggers = new WeakSet<HTMLElement>();

	async init(): Promise<void> {
		const hasImages = this.checkForImages();

		if (!hasImages) {
			return;
		}

		if (!this.Fancybox) {
			await this.loadFancybox();
		}

		this.markImageLinks();
		this.bindInstantPreviewCapture();

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

		this.unbindImageSelectors();
		const instantPreviewConfig = this.getInstantPreviewConfig();

		this.Fancybox.bind(FANCYBOX_SELECTORS.albumImages, {
			...instantPreviewConfig,
			groupAll: true,
			Carousel: {
				transition: "slide",
				preload: 1,
			},
		});
		this.boundSelectors.push(FANCYBOX_SELECTORS.albumImages);

		this.Fancybox.bind(FANCYBOX_SELECTORS.albumLinks, {
			...instantPreviewConfig,
			source: (el: HTMLElement) =>
				el.getAttribute("data-src") || el.getAttribute("href"),
		});
		this.boundSelectors.push(FANCYBOX_SELECTORS.albumLinks);

		this.Fancybox.bind(
			FANCYBOX_SELECTORS.singleFancybox,
			instantPreviewConfig,
		);
		this.boundSelectors.push(FANCYBOX_SELECTORS.singleFancybox);
	}

	private unbindImageSelectors(): void {
		if (!this.Fancybox) {
			return;
		}

		this.boundSelectors.forEach((selector) => {
			this.Fancybox.unbind(selector);
		});
		this.boundSelectors = [];
	}

	private bindInstantPreviewCapture(): void {
		if (this.clickController) {
			return;
		}

		this.clickController = new AbortController();
		document.addEventListener(
			"click",
			(event) => {
				const target = event.target as Element | null;
				const trigger = this.getClickTrigger(target);

				if (!trigger) {
					return;
				}

				event.preventDefault();
				event.stopPropagation();
				this.prepareInstantPreview(trigger);
				this.preloadAroundTrigger(trigger);

				if (this.openInstantPreview(trigger)) {
					event.stopImmediatePropagation();
				}
			},
			{ capture: true, signal: this.clickController.signal },
		);
	}

	private markImageLinks(): void {
		document
			.querySelectorAll<HTMLElement>(
				`${FANCYBOX_CLICK_SELECTOR}, ${ARTICLE_IMAGE_LINK_SELECTOR}`,
			)
			.forEach((trigger) => {
				if (this.isArticleLinkWithoutImage(trigger)) {
					return;
				}

				trigger.setAttribute("data-no-swup", "");

				const anchor =
					trigger instanceof HTMLAnchorElement
						? trigger
						: trigger.closest<HTMLAnchorElement>("a");

				anchor?.setAttribute("data-no-swup", "");
			});
	}

	private getClickTrigger(target: Element | null): HTMLElement | null {
		const articleImageLink = target?.closest<HTMLElement>(
			ARTICLE_IMAGE_LINK_SELECTOR,
		);

		if (
			articleImageLink &&
			!this.isArticleLinkWithoutImage(articleImageLink)
		) {
			return articleImageLink;
		}

		return (
			target?.closest<HTMLElement>(FANCYBOX_CLICK_SELECTOR) ?? null
		);
	}

	private isArticleLinkWithoutImage(trigger: HTMLElement): boolean {
		return (
			trigger instanceof HTMLAnchorElement &&
			!trigger.querySelector("img")
		);
	}

	private getInstantPreviewConfig() {
		const commonConfig = getDefaultFancyboxConfig();

		return {
			...commonConfig,
			on: {
				...commonConfig.on,
				ready: (api: FancyboxInstanceType) => {
					this.upgradeActiveSlide(api);
					this.preloadNeighborSlides(api);
				},
				"Carousel.change": (api: FancyboxInstanceType) => {
					this.upgradeActiveSlide(api);
					this.preloadNeighborSlides(api);
				},
				"Carousel.contentReady": (
					api: FancyboxInstanceType,
					_carousel: unknown,
					slide: FancyboxSlideType,
				) => {
					this.upgradeSlide(slide);
					this.preloadNeighborSlides(api);
				},
			},
		};
	}

	private openInstantPreview(trigger: HTMLElement): boolean {
		if (!this.Fancybox) {
			return false;
		}

		const group = this.getPreviewGroup(trigger);
		const startIndex = group.indexOf(trigger);

		if (startIndex === -1) {
			return false;
		}

		const slides = group.map((item) => {
			this.prepareInstantPreview(item);
			const image = this.getTriggerImage(item);
			const instantSrc = this.getInstantSrc(image, item);

			return {
				src: instantSrc,
				type: "image",
				thumb: instantSrc,
				triggerEl: item,
				caption: item.dataset.caption || image?.alt || "",
			};
		});

		this.Fancybox.show(slides, {
			...this.getInstantPreviewConfig(),
			startIndex,
			triggerEl: trigger,
			Carousel: {
				transition: "slide",
				preload: 1,
			},
		});

		return true;
	}

	private getPreviewGroup(trigger: HTMLElement): HTMLElement[] {
		const groupName = trigger.getAttribute("data-fancybox");

		if (groupName) {
			return Array.from(
				document.querySelectorAll<HTMLElement>(
					`[data-fancybox="${CSS.escape(groupName)}"]`,
				),
			);
		}

		if (
			trigger instanceof HTMLAnchorElement &&
			trigger.matches(ARTICLE_IMAGE_LINK_SELECTOR) &&
			trigger.querySelector("img")
		) {
			return Array.from(
				document.querySelectorAll<HTMLElement>(
					ARTICLE_IMAGE_LINK_SELECTOR,
				),
			).filter((item) => item.querySelector("img"));
		}

		if (trigger.matches(FANCYBOX_SELECTORS.albumImages)) {
			return Array.from(
				document.querySelectorAll<HTMLElement>(
					FANCYBOX_SELECTORS.albumImages,
				),
			);
		}

		return [trigger];
	}

	private prepareInstantPreview(trigger: HTMLElement): void {
		if (this.preparedTriggers.has(trigger)) {
			return;
		}

		const image = this.getTriggerImage(trigger);
		const instantSrc = this.getInstantSrc(image, trigger);
		const fullSrc = this.getFullSrc(trigger, image);

		if (!instantSrc) {
			return;
		}

		if (fullSrc && !trigger.dataset.fullSrc) {
			trigger.dataset.fullSrc = fullSrc;
		}

		trigger.setAttribute("data-no-swup", "");
		trigger.dataset.instantSrc = instantSrc;
		trigger.setAttribute("data-src", instantSrc);

		const anchor =
			trigger instanceof HTMLAnchorElement
				? trigger
				: trigger.closest<HTMLAnchorElement>("a");
		anchor?.setAttribute("data-no-swup", "");

		if (!trigger.getAttribute("data-thumb")) {
			trigger.setAttribute("data-thumb", instantSrc);
		}

		this.preparedTriggers.add(trigger);
	}

	private getTriggerImage(trigger: HTMLElement): HTMLImageElement | null {
		if (trigger instanceof HTMLImageElement) {
			return trigger;
		}

		return trigger.querySelector<HTMLImageElement>("img");
	}

	private getInstantSrc(
		image: HTMLImageElement | null,
		trigger: HTMLElement,
	): string {
		return (
			image?.currentSrc ||
			image?.src ||
			trigger.dataset.instantSrc ||
			trigger.dataset.src ||
			trigger.getAttribute("href") ||
			""
		);
	}

	private getFullSrc(
		trigger: HTMLElement,
		image: HTMLImageElement | null,
	): string {
		return (
			trigger.dataset.fullSrc ||
			trigger.dataset.src ||
			trigger.getAttribute("href") ||
			image?.src ||
			image?.currentSrc ||
			""
		);
	}

	private upgradeActiveSlide(api: FancyboxInstanceType): void {
		const slide = api?.getSlide?.();

		if (slide) {
			this.upgradeSlide(slide);
		}
	}

	private upgradeSlide(slide: FancyboxSlideType): void {
		const trigger = this.getSlideTrigger(slide);
		const fullSrc = trigger?.dataset.fullSrc;

		if (!fullSrc || slide.__mizukiFullSrc === fullSrc) {
			return;
		}

		slide.__mizukiFullSrc = fullSrc;
		this.preloadImage(fullSrc, () => {
			const preview = this.getSlideImage(slide);

			if (!preview || preview.src === fullSrc) {
				return;
			}

			preview.classList.add("is-upgrading");
			preview.src = fullSrc;
			preview.removeAttribute("srcset");
			window.setTimeout(() => {
				preview.classList.remove("is-upgrading");
			}, 180);
		});
	}

	private preloadNeighborSlides(api: FancyboxInstanceType): void {
		const carousel = api?.getCarousel?.();
		const slides = carousel?.getSlides?.() || carousel?.slides || [];
		const page = carousel?.page ?? carousel?.getPage?.()?.index ?? 0;

		[page - 1, page + 1].forEach((index) => {
			const slide = slides[index];
			const trigger = this.getSlideTrigger(slide);
			const fullSrc = trigger?.dataset.fullSrc;

			if (fullSrc) {
				this.preloadImage(fullSrc);
			}
		});
	}

	private preloadAroundTrigger(trigger: HTMLElement): void {
		const group = this.getPreviewGroup(trigger);
		const index = group.indexOf(trigger);

		if (index === -1) {
			return;
		}

		[index - 1, index + 1].forEach((neighborIndex) => {
			const neighbor = group[neighborIndex];

			if (!neighbor) {
				return;
			}

			this.prepareInstantPreview(neighbor);
			const fullSrc = this.getFullSrc(
				neighbor,
				this.getTriggerImage(neighbor),
			);

			if (fullSrc) {
				this.preloadImage(fullSrc);
			}
		});
	}

	private getSlideTrigger(
		slide: FancyboxSlideType | undefined,
	): HTMLElement | null {
		return (
			slide?.triggerEl ||
			slide?.delegateEl ||
			slide?.thumbEl ||
			null
		);
	}

	private getSlideImage(
		slide: FancyboxSlideType,
	): HTMLImageElement | null {
		return (
			slide?.htmlEl?.querySelector?.("img") ||
			slide?.el?.querySelector?.("img") ||
			null
		);
	}

	private preloadImage(src: string, onload?: () => void): void {
		if (!src) {
			return;
		}

		if (this.preloadedUrls.has(src)) {
			onload?.();
			return;
		}

		const image = new Image();
		image.decoding = "async";
		image.onload = () => {
			this.preloadedUrls.add(src);
			onload?.();
		};
		image.src = src;
	}

	cleanup(): void {
		if (!this.Fancybox) {
			return;
		}

		this.boundSelectors.forEach((selector) => {
			this.Fancybox.unbind(selector);
		});
		this.boundSelectors = [];
		this.clickController?.abort();
		this.clickController = null;
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
