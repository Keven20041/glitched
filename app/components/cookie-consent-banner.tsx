"use client";

import { useState } from "react";

type CookieConsent = "essential" | "all" | null;

type CookieConsentBannerProps = {
	initialConsent: string | null;
};

const COOKIE_NAME = "glitched-cookie-consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

const normalizeConsent = (value: string | null): CookieConsent => {
	if (value === "essential" || value === "all") {
		return value;
	}

	return null;
};

const writeConsentCookie = (value: Exclude<CookieConsent, null>, persistent: boolean) => {
	const cookieValue = encodeURIComponent(value);
	const lifetime = persistent ? `; max-age=${COOKIE_MAX_AGE}` : "";
	document.cookie = `${COOKIE_NAME}=${cookieValue}; path=/${lifetime}; samesite=lax`;
};

export default function CookieConsentBanner({ initialConsent }: CookieConsentBannerProps) {
	const [consent, setConsent] = useState<CookieConsent>(() => normalizeConsent(initialConsent));

	if (consent) {
		return null;
	}

	return (
		<section className="cookie-banner" aria-label="Cookie consent banner" role="dialog" aria-live="polite">
			<div className="cookie-banner-copy">
				<p className="cookie-banner-kicker">Cookie control</p>
				<h2>Keep your session and preferences ready.</h2>
				<p>
					We use essential cookies for sign-in and checkout flows. You can allow all cookies or keep only the
					essentials.
				</p>
			</div>
			<div className="cookie-banner-actions">
				<button
					type="button"
					className="cookie-banner-button ghost"
					onClick={() => {
						writeConsentCookie("essential", false);
						setConsent("essential");
					}}
				>
					Essential only
				</button>
				<button
					type="button"
					className="cookie-banner-button"
					onClick={() => {
						writeConsentCookie("all", true);
						setConsent("all");
					}}
				>
					Accept all
				</button>
			</div>
		</section>
	);
}
