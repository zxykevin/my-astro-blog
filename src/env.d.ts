/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
	readonly PUBLIC_COMMENTS_API_BASE_URL?: string;
	readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}
