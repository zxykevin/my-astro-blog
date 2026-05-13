import { visit } from "unist-util-visit";

const LOCAL_IMAGE_PATTERN = /^(?:\.{1,2}\/|\/src\/|@\/).*\.(avif|gif|jpe?g|png|webp)$/i;
const MAX_MARKDOWN_IMAGE_WIDTH = 1600;

export function rehypeImageWidth() {
	const regex = / w-([0-9]+)%/;

	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			limitAstroMarkdownImage(node);

			if (
				node.tagName === "img" &&
				node.properties &&
				node.properties.alt
			) {
				const alt = node.properties.alt;
				const match = alt.match(regex);

				if (match) {
					const width = match[1];
					node.properties.alt = alt.replace(regex, "").trim();
					node.properties.style = `width: ${width}%; display: block; margin: 0 auto;`;
					// Remove width and height attributes if they were set by Astro optimization
					delete node.properties.width;
					delete node.properties.height;

					const figureChildren = [node];

					if (node.properties.title) {
						const figcaption = {
							type: "element",
							tagName: "figcaption",
							properties: {
								style: "text-align: center; margin-top: 0.5em; font-size: 0.9em; color: #666;",
							},
							children: [
								{
									type: "text",
									value: node.properties.title,
								},
							],
						};
						figureChildren.push(figcaption);
					}

					const figure = {
						type: "element",
						tagName: "figure",
						properties: {
							style: "margin: 1em 0;",
						},
						children: figureChildren,
					};

					if (parent && index !== undefined) {
						parent.children[index] = figure;
					}
				} else if (isLocalImage(node.properties.src)) {
					node.properties.width = Math.min(
						getNumericProperty(node.properties.width) ??
							MAX_MARKDOWN_IMAGE_WIDTH,
						MAX_MARKDOWN_IMAGE_WIDTH,
					);
				}
			}
		});
	};
}

function limitAstroMarkdownImage(node) {
	const imageData = node.properties?.__ASTRO_IMAGE_;
	if (node.tagName !== "img" || typeof imageData !== "string") {
		return;
	}

	try {
		const parsed = JSON.parse(imageData);
		if (isLocalImage(parsed.src)) {
			parsed.width = Math.min(
				getNumericProperty(parsed.width) ?? MAX_MARKDOWN_IMAGE_WIDTH,
				MAX_MARKDOWN_IMAGE_WIDTH,
			);
			delete parsed.height;
			node.properties.__ASTRO_IMAGE_ = JSON.stringify(parsed);
		}
	} catch {
		// Leave malformed image metadata untouched.
	}
}

function isLocalImage(src) {
	return typeof src === "string" && LOCAL_IMAGE_PATTERN.test(src);
}

function getNumericProperty(value) {
	if (typeof value === "number") {
		return value;
	}

	if (typeof value === "string") {
		const parsed = Number.parseInt(value, 10);
		return Number.isNaN(parsed) ? undefined : parsed;
	}

	return undefined;
}
