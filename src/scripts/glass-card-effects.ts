type GlassCardElement = HTMLElement & {
	__mizukiGlassPointerMove?: (event: PointerEvent) => void;
	__mizukiGlassPointerLeave?: () => void;
};

function initGlassCardEffects() {
	const isPostPage =
		document.body.classList.contains("is-post-page") ||
		window.location.pathname.startsWith("/posts/");

	const removeCardListeners = (card: GlassCardElement) => {
		if (card.__mizukiGlassPointerMove) {
			card.removeEventListener(
				"pointermove",
				card.__mizukiGlassPointerMove,
			);
		}
		if (card.__mizukiGlassPointerLeave) {
			card.removeEventListener(
				"pointerleave",
				card.__mizukiGlassPointerLeave,
			);
		}
		card.__mizukiGlassPointerMove = undefined;
		card.__mizukiGlassPointerLeave = undefined;
	};

	const clearCardState = (card: GlassCardElement) => {
		removeCardListeners(card);
		card.classList.remove(
			"glass-card",
			"glass-card-soft",
			"glass-card-interactive",
		);
		card.style.removeProperty("--card-mx");
		card.style.removeProperty("--card-my");
		card.style.removeProperty("--card-float-x");
		card.style.removeProperty("--card-float-y");
	};

	if (isPostPage) {
		document
			.querySelectorAll<GlassCardElement>(
				".glass-card, .glass-card-soft, .glass-card-interactive",
			)
			.forEach(clearCardState);
		return;
	}

	const cards = document.querySelectorAll<GlassCardElement>(
		".card-base, .card-base-transparent",
	);

	const isArticleCard = (card: HTMLElement) =>
		card.closest("#post-list-container") !== null;

	const shouldSkip = (card: HTMLElement) =>
		isArticleCard(card) ||
		card.closest("#post-container") !== null ||
		card.matches("#post-container") ||
		card.closest(".markdown-content") !== null;

	cards.forEach((card) => {
		if (shouldSkip(card)) {
			if (isArticleCard(card)) {
				removeCardListeners(card);
				card.classList.add("glass-card-soft");
				card.classList.remove("glass-card-interactive");
			} else {
				clearCardState(card);
			}
			return;
		}

		card.classList.add("glass-card", "glass-card-interactive");
		card.classList.remove("glass-card-soft");

		removeCardListeners(card);

		card.__mizukiGlassPointerMove = (event: PointerEvent) => {
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				return;
			}

			const rect = card.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			card.style.setProperty("--card-mx", `${(x / rect.width) * 100}%`);
			card.style.setProperty("--card-my", `${(y / rect.height) * 100}%`);
			card.style.setProperty(
				"--card-float-x",
				`${(x / rect.width - 0.5) * 7}px`,
			);
			card.style.setProperty(
				"--card-float-y",
				`${(y / rect.height - 0.5) * 7}px`,
			);
		};

		card.__mizukiGlassPointerLeave = () => {
			card.style.setProperty("--card-mx", "50%");
			card.style.setProperty("--card-my", "50%");
			card.style.setProperty("--card-float-x", "0px");
			card.style.setProperty("--card-float-y", "0px");
		};

		card.addEventListener("pointermove", card.__mizukiGlassPointerMove);
		card.addEventListener("pointerleave", card.__mizukiGlassPointerLeave);
	});
}

function observeGlassCardEffects() {
	const observerKey = "__mizukiGlassCardObserver";
	if (window[observerKey]) {
		return;
	}

	const observer = new MutationObserver(() => {
		initGlassCardEffects();
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	window[observerKey] = observer;
}

if (document.readyState === "loading") {
	document.addEventListener(
		"DOMContentLoaded",
		() => {
			initGlassCardEffects();
			observeGlassCardEffects();
		},
		{ once: true },
	);
} else {
	initGlassCardEffects();
	observeGlassCardEffects();
}

document.addEventListener("astro:page-load", initGlassCardEffects);
