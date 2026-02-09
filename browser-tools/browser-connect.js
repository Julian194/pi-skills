#!/usr/bin/env node

/**
 * Shared helper: connect to Chrome on :9222, auto-starting if needed.
 * Usage: import { connect } from './browser-connect.js'
 *        const browser = await connect({ profile: true })
 */

import { spawn, execSync } from "node:child_process";
import puppeteer from "puppeteer-core";

const SCRAPING_DIR = `${process.env.HOME}/.cache/browser-tools`;
const CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9222;

async function tryConnect() {
	return puppeteer.connect({
		browserURL: `http://localhost:${PORT}`,
		defaultViewport: null,
	});
}

async function startChrome(useProfile) {
	execSync(`mkdir -p "${SCRAPING_DIR}"`, { stdio: "ignore" });

	// Remove locks from previous runs
	try {
		execSync(
			`rm -f "${SCRAPING_DIR}/SingletonLock" "${SCRAPING_DIR}/SingletonSocket" "${SCRAPING_DIR}/SingletonCookie"`,
			{ stdio: "ignore" },
		);
	} catch {}

	if (useProfile) {
		// Only sync the Default profile — not all profiles.
		// This avoids the profile picker dialog.
		const src = `${process.env.HOME}/Library/Application Support/Google/Chrome`;
		console.log("Syncing Default profile...");
		execSync(`mkdir -p "${SCRAPING_DIR}/Default"`, { stdio: "ignore" });
		execSync(
			`rsync -a --delete \
				--exclude='SingletonLock' \
				--exclude='SingletonSocket' \
				--exclude='SingletonCookie' \
				--exclude='Sessions/*' \
				--exclude='Current Session' \
				--exclude='Current Tabs' \
				--exclude='Last Session' \
				--exclude='Last Tabs' \
				"${src}/Default/" "${SCRAPING_DIR}/Default/"`,
			{ stdio: "pipe" },
		);
		// Copy top-level files needed for Chrome to run (Local State, etc.)
		execSync(
			`rsync -a \
				--exclude='Profile *' \
				--exclude='Default' \
				--exclude='System Profile' \
				--exclude='Guest Profile' \
				--exclude='Crashpad' \
				--exclude='GraphiteDawnCache' \
				--exclude='GrShaderCache' \
				--exclude='ShaderCache' \
				--exclude='BrowserMetrics*' \
				--include='Local State' \
				--include='*/' \
				--exclude='*' \
				"${src}/" "${SCRAPING_DIR}/"`,
			{ stdio: "pipe" },
		);
		// Patch Local State to only know about Default profile
		try {
			const lsPath = `${SCRAPING_DIR}/Local State`;
			const ls = JSON.parse(
				execSync(`cat "${lsPath}"`, { encoding: "utf-8" }),
			);
			if (ls.profile?.info_cache) {
				// Keep only Default
				const defaultInfo = ls.profile.info_cache.Default;
				if (defaultInfo) {
					ls.profile.info_cache = { Default: defaultInfo };
					ls.profile.last_used = "Default";
				}
			}
			execSync(`cat > "${lsPath}"`, {
				input: JSON.stringify(ls),
				stdio: ["pipe", "ignore", "ignore"],
			});
		} catch {}
	}

	spawn(
		CHROME_BIN,
		[
			`--remote-debugging-port=${PORT}`,
			`--user-data-dir=${SCRAPING_DIR}`,
			"--profile-directory=Default",
			"--no-first-run",
			"--no-default-browser-check",
		],
		{ detached: true, stdio: "ignore" },
	).unref();

	// Wait for Chrome to be ready
	for (let i = 0; i < 30; i++) {
		try {
			const browser = await tryConnect();
			await browser.disconnect();
			return true;
		} catch {
			await new Promise((r) => setTimeout(r, 500));
		}
	}
	return false;
}

/**
 * Connect to Chrome, auto-starting if not running.
 * @param {Object} opts
 * @param {boolean} opts.profile - Use user's Chrome profile (cookies, logins)
 * @returns {Promise<import('puppeteer-core').Browser>}
 */
export async function connect(opts = {}) {
	// Try connecting to existing instance
	try {
		return await tryConnect();
	} catch {}

	// Not running — start it
	const useProfile = opts.profile !== false; // default: true
	console.log(
		`Starting Chrome on :${PORT}${useProfile ? " with profile" : ""}...`,
	);
	const ok = await startChrome(useProfile);
	if (!ok) {
		throw new Error("Failed to start Chrome");
	}

	return tryConnect();
}
