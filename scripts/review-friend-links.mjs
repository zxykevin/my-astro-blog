import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repo = process.env.GITHUB_REPOSITORY || "zxykevin/my-astro-blog";
const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const root = process.cwd();
const friendsPath = path.join(root, "src", "data", "friends.ts");

const labels = {
	name: "\u7f51\u7ad9\u540d\u79f0",
	url: "\u7f51\u7ad9\u94fe\u63a5",
	description: "\u4ecb\u7ecd",
	avatar: "\u5934\u50cf",
};

const requiredFields = {
	[labels.name]: "name",
	[labels.url]: "url",
	[labels.description]: "description",
	[labels.avatar]: "avatar",
};

function text(value) {
	return value;
}

function run(command, args, options = {}) {
	const output = execFileSync(command, args, {
		cwd: root,
		encoding: "utf8",
		stdio: options.stdio || ["ignore", "pipe", "pipe"],
		...options,
	});

	if (typeof output === "string") {
		return output.trim();
	}

	if (output == null) {
		return "";
	}

	return String(output).trim();
}

async function githubRequest(pathname, options = {}) {
	if (!githubToken) {
		throw new Error(
			text(
				"\u7f3a\u5c11 GITHUB_TOKEN \u6216 GH_TOKEN\uff0c\u65e0\u6cd5\u8bfb\u53d6\u548c\u66f4\u65b0 GitHub issue",
			),
		);
	}

	const response = await fetch(`https://api.github.com${pathname}`, {
		...options,
		headers: {
			accept: "application/vnd.github+json",
			authorization: `Bearer ${githubToken}`,
			"user-agent": "Mizuki friend-link reviewer",
			"x-github-api-version": "2022-11-28",
			...(options.headers || {}),
		},
	});

	if (!response.ok) {
		const details = await response.text();
		throw new Error(
			`GitHub API ${options.method || "GET"} ${pathname} returned HTTP ${
				response.status
			}: ${details}`,
		);
	}

	if (response.status === 204) {
		return null;
	}

	return response.json();
}

function parseIssueForm(body) {
	const result = {};
	const sections = body.split(/\r?\n### /).map((section) => section.trim());

	for (const section of sections) {
		const [rawLabel, ...valueLines] = section.split(/\r?\n/);
		if (!rawLabel) {
			continue;
		}

		const label = rawLabel.replace(/^###\s*/, "").trim();
		const key = requiredFields[label];
		if (!key) {
			continue;
		}

		const value = valueLines
			.join("\n")
			.replace(/^_No response_\s*$/i, "")
			.trim();
		result[key] = value;
	}

	return result;
}

function validateHttpsUrl(value, label) {
	let parsed;
	try {
		parsed = new URL(value);
	} catch {
		throw new Error(`${label} ${text("\u4e0d\u662f\u6709\u6548 URL")}`);
	}

	if (parsed.protocol !== "https:") {
		throw new Error(`${label} ${text("\u5fc5\u987b\u4f7f\u7528 HTTPS")}`);
	}

	return parsed.toString();
}

async function assertReachable(url, label) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 12000);

	try {
		const response = await fetch(url, {
			method: "GET",
			redirect: "follow",
			signal: controller.signal,
			headers: {
				"user-agent": "Mizuki friend-link reviewer",
			},
		});

		if (!response.ok) {
			throw new Error(
				`${label} ${text("\u8fd4\u56de HTTP")} ${response.status}`,
			);
		}
	} finally {
		clearTimeout(timeout);
	}
}

function readFriendsFile() {
	return fs.readFileSync(friendsPath, "utf8");
}

function hasExistingFriend(content, friend) {
	return (
		content.includes(`url: "${friend.url}"`) ||
		content.includes(`avatar: "${friend.avatar}"`) ||
		content.includes(`name: "${friend.name.replaceAll('"', '\\"')}"`)
	);
}

function appendFriend(content, friend) {
	const entry = `\t{
\t\tname: ${JSON.stringify(friend.name)},
\t\tavatar: ${JSON.stringify(friend.avatar)},
\t\tdescription: ${JSON.stringify(friend.description)},
\t\turl: ${JSON.stringify(friend.url)},
\t\tstatus: "friend",
\t},
`;

	const marker = "];";
	const markerIndex = content.indexOf(marker);
	if (markerIndex < 0) {
		throw new Error(
			text("\u6ca1\u6709\u627e\u5230 friends \u6570\u7ec4\u7ed3\u5c3e"),
		);
	}

	return `${content.slice(0, markerIndex)}${entry}${content.slice(markerIndex)}`;
}

function gitHasChanges() {
	return (
		run("git", ["status", "--porcelain", "--", "src/data/friends.ts"]) !==
		""
	);
}

async function listFriendIssues() {
	return githubRequest(
		`/repos/${repo}/issues?state=open&labels=friend-link&per_page=100`,
	);
}

async function commentIssue(issueNumber, body) {
	await githubRequest(`/repos/${repo}/issues/${issueNumber}/comments`, {
		method: "POST",
		body: JSON.stringify({ body }),
	});
}

async function closeIssue(issueNumber) {
	await githubRequest(`/repos/${repo}/issues/${issueNumber}`, {
		method: "PATCH",
		body: JSON.stringify({
			state: "closed",
			state_reason: "completed",
		}),
	});
}

async function addIssueLabel(issueNumber, label) {
	await githubRequest(`/repos/${repo}/issues/${issueNumber}/labels`, {
		method: "POST",
		body: JSON.stringify({ labels: [label] }),
	});
}

async function reviewIssue(issue) {
	const friend = parseIssueForm(issue.body || "");

	for (const [label, key] of Object.entries(requiredFields)) {
		if (!friend[key]) {
			throw new Error(
				`${text("\u7f3a\u5c11\u5fc5\u586b\u5b57\u6bb5\uff1a")}${label}`,
			);
		}
	}

	friend.url = validateHttpsUrl(friend.url, labels.url);
	friend.avatar = validateHttpsUrl(friend.avatar, labels.avatar);

	await assertReachable(friend.url, labels.url);
	await assertReachable(friend.avatar, labels.avatar);

	const current = readFriendsFile();
	if (hasExistingFriend(current, friend)) {
		await commentIssue(
			issue.number,
			text(
				"\u53cb\u94fe\u5df2\u5b58\u5728\uff0c\u81ea\u52a8\u5ba1\u6838\u4e0d\u518d\u91cd\u590d\u6dfb\u52a0\u3002",
			),
		);
		await closeIssue(issue.number);
		return false;
	}

	fs.writeFileSync(friendsPath, appendFriend(current, friend), "utf8");
	run("pnpm", ["prettier", "--write", "src/data/friends.ts"], {
		stdio: "inherit",
	});

	run("git", ["add", "src/data/friends.ts"], { stdio: "inherit" });
	run("git", ["commit", "-m", `chore: add friend link ${friend.name}`], {
		stdio: "inherit",
	});
	run("git", ["push"], { stdio: "inherit" });

	await commentIssue(
		issue.number,
		text(
			"\u81ea\u52a8\u5ba1\u6838\u901a\u8fc7\uff0c\u53cb\u94fe\u5df2\u6dfb\u52a0\u5e76\u63a8\u9001\u3002",
		),
	);
	await closeIssue(issue.number);
	return true;
}

async function main() {
	run("git", ["pull", "--ff-only"], { stdio: "inherit" });

	const issues = await listFriendIssues();
	if (issues.length === 0) {
		console.log("No friend-link issues to review.");
		return;
	}

	for (const issue of issues) {
		if (issue.pull_request) {
			continue;
		}

		if (gitHasChanges()) {
			throw new Error(
				text(
					"src/data/friends.ts \u6709\u672a\u63d0\u4ea4\u6539\u52a8\uff0c\u505c\u6b62\u81ea\u52a8\u5ba1\u6838\u3002",
				),
			);
		}

		try {
			await reviewIssue(issue);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			await commentIssue(
				issue.number,
				`${text("\u81ea\u52a8\u5ba1\u6838\u672a\u901a\u8fc7\uff1a")}${message}`,
			);
			await addIssueLabel(issue.number, "needs-review");
			console.error(`#${issue.number}: ${message}`);
		}
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
