const ALLOWED_ORIGIN = "https://yuulog.org";

function jsonResponse(body, init = {}) {
	const headers = new Headers(init.headers);
	headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
	headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
	headers.set("Access-Control-Allow-Headers", "Content-Type");
	headers.set("Cache-Control", "public, max-age=300");
	headers.set("Content-Type", "application/json; charset=utf-8");

	return new Response(JSON.stringify(body), {
		...init,
		headers,
	});
}

function failedResponse() {
	return jsonResponse({
		ok: false,
		views: null,
		visitors: null,
	});
}

function normalizePath(path) {
	if (!path || typeof path !== "string") {
		return "/";
	}

	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return normalizedPath;
}

function getStatsUrl(env) {
	const apiBaseUrl = env.UMAMI_API_URL.replace(/\/$/, "");
	const statsPath = apiBaseUrl.endsWith("/v1")
		? `/websites/${env.UMAMI_WEBSITE_ID}/stats`
		: `/api/websites/${env.UMAMI_WEBSITE_ID}/stats`;

	return new URL(`${apiBaseUrl}${statsPath}`);
}

export default {
	async fetch(request, env) {
		if (request.method === "OPTIONS") {
			return jsonResponse(null, { status: 204 });
		}

		if (request.method !== "GET") {
			return jsonResponse(
				{
					ok: false,
					views: null,
					visitors: null,
				},
				{ status: 405 },
			);
		}

		try {
			const requestUrl = new URL(request.url);
			const path = normalizePath(requestUrl.searchParams.get("path"));
			const umamiUrl = getStatsUrl(env);

			umamiUrl.searchParams.set("startAt", "0");
			umamiUrl.searchParams.set("endAt", Date.now().toString());

			if (path !== "/") {
				umamiUrl.searchParams.set("path", path);
			}

			const response = await fetch(umamiUrl, {
				headers: {
					Accept: "application/json",
					"x-umami-api-key": env.UMAMI_API_KEY,
				},
			});

			if (!response.ok) {
				return failedResponse();
			}

			const stats = await response.json();
			const views = Number(stats.pageviews);
			const visitors = Number(stats.visitors);

			if (!Number.isFinite(views) || !Number.isFinite(visitors)) {
				return failedResponse();
			}

			return jsonResponse({
				ok: true,
				views,
				visitors,
			});
		} catch {
			return failedResponse();
		}
	},
};
