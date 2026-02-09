#!/usr/bin/env node

import { connect } from "./browser-connect.js";

const useProfile = process.argv.includes("--profile");
const noProfile = process.argv.includes("--no-profile");

if (process.argv[2] && !["--profile", "--no-profile"].includes(process.argv[2])) {
	console.log("Usage: browser-start.js [--profile | --no-profile]");
	console.log("\nOptions:");
	console.log("  --profile     Copy your Default Chrome profile (cookies, logins) [default]");
	console.log("  --no-profile  Fresh profile (no cookies)");
	process.exit(1);
}

try {
	const browser = await connect({ profile: !noProfile });
	console.log("✓ Chrome ready on :9222");
	await browser.disconnect();
} catch (e) {
	console.error("✗", e.message);
	process.exit(1);
}
