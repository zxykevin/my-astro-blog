function initGlassCardEffects() {
	const isPostPage =
		document.body.classList.contains("is-post-page") ||
		window.location.pathname.startsWith("/posts/");

	const clearCardState = (card: HTMLElement) => {
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
			.querySelectorAll<HTMLElement>(
				".glass-card, .glass-card-soft, .glass-card-interactive",
			)
			.forEach(clearCardState);
		return;
	}

	const cards = document.querySelectorAll<HTMLElement>(
		".card-base, .card-base-transparent",
	);

	const shouldSkip = (card: HTMLElement) =>
		card.closest("#post-container") !== null ||
		card.closest("#card-toc") !== null ||
		card.matches("#post-container") ||
		card.matches("widget-layout[data-id='card-toc']") ||
		card.closest(".markdown-content") !== null;

	const isPostListCard = (card: HTMLElement) =>
		card.closest("#post-list-container") !== null;

	cards.forEach((card) => {
		if (shouldSkip(card)) {
			clearCardState(card);
			return;
		}

		card.classList.add(
			isPostListCard(card) ? "glass-card-soft" : "glass-card",
		);

		if (isPostListCard(card)) {
			card.classList.remove("glass-card-interactive");
			return;
		}

		card.classList.add("glass-card-interactive");

		if (card.dataset.glassFollowReady === "true") {
			return;
		}

		card.dataset.glassFollowReady = "true";

		card.addEventListener("pointermove", (event) => {
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
		});

		card.addEventListener("pointerleave", () => {
			card.style.setProperty("--card-mx", "50%");
			card.style.setProperty("--card-my", "50%");
			card.style.setProperty("--card-float-x", "0px");
			card.style.setProperty("--card-float-y", "0px");
		});
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initGlassCardEffects, {
		once: true,
	});
} else {
	initGlassCardEffects();
}

document.addEventListener("astro:page-load", initGlassCardEffects);
