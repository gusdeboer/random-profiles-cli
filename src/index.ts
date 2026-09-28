#!/usr/bin/env node

const API_KEY = process.env.RANDOM_PROFILES_API_KEY;
const BASE_URL = "https://random-profiles.com";

function usage() {
	console.log(`
random-profiles — generate fake user profiles and companies

Usage:
  random-profiles [options]

Profiles (default):
  --count <n>         Number of profiles (1-100, default 10)
  --gender <g>        Filter: male, female, non-binary
  --country <codes>   Filter: US,GB,DE,FR,AU,BR,JP,IN,NG (comma-separated)
  --min-age <n>       Minimum age
  --max-age <n>       Maximum age
  --fields <groups>   Field groups (comma-separated)
  --photo-size <n>    Photo size: 64, 128, 256, 512, 1024
  --photo-format <f>  Image format for photo URL: jpg (default) or webp
  --seed <n>          Deterministic results
  --format <f>        Output format: json (default), csv, table
  --uuid <id>         Get a single profile by UUID

Companies:
  --companies         Fetch companies instead of profiles
  --count <n>         Number of companies (1-100, default 10)
  --industry <name>   Filter by industry (Technology, Healthcare, Finance, etc.)
  --country <codes>   Filter: US,GB,DE,FR,AU,BR,JP,IN,NG (comma-separated)
  --size <brackets>   Filter: 1-10,11-50,51-200,201-500,501-1000,1001-5000,5000+
  --fields <groups>   Field groups (comma-separated)
  --logo-size <n>     Logo size in meta.logo_url: 64, 128, 256, 512, 1024 (default 1024)
  --logo-format <f>   Image format for meta.logo_url: jpg (default) or webp
  --seed <n>          Deterministic results
  --format <f>        Output format: json (default), csv
  --company-uuid <id> Get a single company by UUID

Images:
  --image <id>        Download a profile photo (UUID or "random")
  --size <n>          Image size: 64, 128, 256, 512, 1024 (default 1024)
  --output <path>     Save image to file (default: stdout)

Other:
  --usage             Show API key usage stats
  --key <key>         API key (or set RANDOM_PROFILES_API_KEY)
  --help              Show this help

Examples:
  random-profiles --count 5
  random-profiles --count 10 --country US,GB --gender female
  random-profiles --count 3 --fields name,email,phone --format table
  random-profiles --uuid a1b2c3d4-e5f6-7890-abcd-ef1234567890
  random-profiles --companies --count 5 --industry Technology
  random-profiles --companies --country US --size 201-500,501-1000 --fields name,industry,leadership,tech
  random-profiles --company-uuid 7d3063d3-b62b-41ef-8e60-f5b50dac8ee0
  random-profiles --image random --size 256 --output photo.jpg
  random-profiles --usage

Get a free API key at https://random-profiles.com
`);
}

function parseArgs(args: string[]): Record<string, string> {
	const result: Record<string, string> = {};
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === "--help" || arg === "-h") {
			result.help = "true";
		} else if (arg === "--usage") {
			result.usage = "true";
		} else if (arg === "--companies") {
			result.companies = "true";
		} else if (arg.startsWith("--") && i + 1 < args.length) {
			result[arg.slice(2)] = args[++i];
		}
	}
	return result;
}

async function apiRequest(
	path: string,
	key: string,
	params?: Record<string, string>,
): Promise<Response> {
	const url = new URL(path, BASE_URL);
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			if (v) url.searchParams.set(k, v);
		}
	}
	return fetch(url.toString(), {
		headers: { "X-API-Key": key },
	});
}

function formatTable(profiles: Record<string, unknown>[]): string {
	if (profiles.length === 0) return "No profiles found.";

	const name = (p: Record<string, unknown>) => {
		const n = p.name as Record<string, string> | undefined;
		return n ? `${n.first} ${n.last}` : "—";
	};

	const rows = profiles.map((p) => ({
		uuid: (p.uuid as string).slice(0, 8),
		name: name(p),
		email: (p.email as string) || "—",
		country:
			(p.address as Record<string, string>)?.country ||
			(p as Record<string, string>).nationality ||
			"—",
		gender: (p as Record<string, string>).gender || "—",
	}));

	const cols = Object.keys(rows[0]) as (keyof (typeof rows)[0])[];
	const widths = cols.map((c) =>
		Math.max(c.length, ...rows.map((r) => String(r[c]).length)),
	);

	const header = cols
		.map((c, i) => c.toUpperCase().padEnd(widths[i]))
		.join("  ");
	const sep = widths.map((w) => "—".repeat(w)).join("  ");
	const body = rows
		.map((r) => cols.map((c, i) => String(r[c]).padEnd(widths[i])).join("  "))
		.join("\n");

	return `${header}\n${sep}\n${body}`;
}

function formatCompanyTable(companies: Record<string, unknown>[]): string {
	if (companies.length === 0) return "No companies found.";

	const rows = companies.map((c) => {
		const location = c.location as Record<string, string> | undefined;
		return {
			uuid: (c.uuid as string).slice(0, 8),
			name: (c.name as string) || "—",
			industry: (c.industry as string) || "—",
			size: (c.size as string) || "—",
			country: location?.country || (c.country as string) || "—",
		};
	});

	const cols = Object.keys(rows[0]) as (keyof (typeof rows)[0])[];
	const widths = cols.map((col) =>
		Math.max(col.length, ...rows.map((r) => String(r[col]).length)),
	);

	const header = cols
		.map((col, i) => col.toUpperCase().padEnd(widths[i]))
		.join("  ");
	const sep = widths.map((w) => "—".repeat(w)).join("  ");
	const body = rows
		.map((r) =>
			cols.map((col, i) => String(r[col]).padEnd(widths[i])).join("  "),
		)
		.join("\n");

	return `${header}\n${sep}\n${body}`;
}

function formatCsv(profiles: Record<string, unknown>[]): string {
	if (profiles.length === 0) return "";

	function flatten(obj: unknown, prefix = ""): Record<string, string> {
		const result: Record<string, string> = {};
		if (obj && typeof obj === "object" && !Array.isArray(obj)) {
			for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
				const key = prefix ? `${prefix}.${k}` : k;
				if (v && typeof v === "object" && !Array.isArray(v)) {
					Object.assign(result, flatten(v, key));
				} else {
					result[key] = Array.isArray(v) ? v.join("; ") : String(v ?? "");
				}
			}
		}
		return result;
	}

	const flat = profiles.map((p) => flatten(p));
	const allKeys = [...new Set(flat.flatMap((r) => Object.keys(r)))];
	const header = allKeys.map((k) => `"${k}"`).join(",");
	const rows = flat
		.map((r) =>
			allKeys.map((k) => `"${(r[k] || "").replace(/"/g, '""')}"`).join(","),
		)
		.join("\n");

	return `${header}\n${rows}`;
}

async function main() {
	const args = parseArgs(process.argv.slice(2));

	if (args.help) {
		usage();
		process.exit(0);
	}

	const key = args.key || API_KEY;
	if (!key) {
		console.error(
			"Error: API key required. Use --key or set RANDOM_PROFILES_API_KEY",
		);
		console.error("Get a free key at https://random-profiles.com");
		process.exit(1);
	}

	if (args.usage) {
		const res = await apiRequest("/v1/usage", key);
		const data = await res.json();
		if (!res.ok) {
			console.error(JSON.stringify(data, null, 2));
			process.exit(1);
		}
		console.log(JSON.stringify(data, null, 2));
		return;
	}

	if (args.uuid) {
		const res = await apiRequest(`/v1/profiles/${args.uuid}`, key);
		const data = await res.json();
		if (!res.ok) {
			console.error(JSON.stringify(data, null, 2));
			process.exit(1);
		}
		console.log(JSON.stringify(data, null, 2));
		return;
	}

	if (args["company-uuid"]) {
		const res = await apiRequest(`/v1/companies/${args["company-uuid"]}`, key);
		const data = await res.json();
		if (!res.ok) {
			console.error(JSON.stringify(data, null, 2));
			process.exit(1);
		}
		console.log(JSON.stringify(data, null, 2));
		return;
	}

	if (args.companies) {
		const params: Record<string, string> = {};
		if (args.count) params.count = args.count;
		if (args.industry) params.industry = args.industry;
		if (args.country) params.country = args.country;
		if (args.size) params.size = args.size;
		if (args.fields) params.fields = args.fields;
		if (args["logo-size"]) params.logo_size = args["logo-size"];
		if (args["logo-format"]) params.logo_format = args["logo-format"];
		if (args.seed) params.seed = args.seed;

		const format = args.format || "json";
		if (format === "csv") {
			params.format = "csv";
			const res = await apiRequest("/v1/companies", key, params);
			if (!res.ok) {
				console.error(`Error ${res.status}: ${await res.text()}`);
				process.exit(1);
			}
			console.log(await res.text());
			return;
		}

		const res = await apiRequest("/v1/companies", key, params);
		const data = (await res.json()) as {
			companies?: Record<string, unknown>[];
		};
		if (!res.ok) {
			console.error(JSON.stringify(data, null, 2));
			process.exit(1);
		}

		const companies = data.companies || [];
		if (format === "table") {
			console.log(formatCompanyTable(companies));
		} else {
			console.log(JSON.stringify(data, null, 2));
		}
		return;
	}

	if (args.image) {
		const imagePath =
			args.image === "random"
				? "/v1/images/random"
				: `/v1/images/${args.image}`;
		const imageParams: Record<string, string> = {};
		if (args.size) imageParams.size = args.size;
		const res = await apiRequest(imagePath, key, imageParams);
		if (!res.ok) {
			const text = await res.text();
			console.error(`Error ${res.status}: ${text}`);
			process.exit(1);
		}
		const buffer = Buffer.from(await res.arrayBuffer());
		if (args.output) {
			const { writeFileSync } = await import("node:fs");
			writeFileSync(args.output, buffer);
			console.error(`Saved to ${args.output} (${buffer.length} bytes)`);
		} else {
			process.stdout.write(buffer);
		}
		return;
	}

	const params: Record<string, string> = {};
	if (args.count) params.count = args.count;
	if (args.gender) params.gender = args.gender;
	if (args.country) params.country = args.country;
	if (args["min-age"]) params.min_age = args["min-age"];
	if (args["max-age"]) params.max_age = args["max-age"];
	if (args.fields) params.fields = args.fields;
	if (args["photo-size"]) params.photo_size = args["photo-size"];
	if (args["photo-format"]) params.photo_format = args["photo-format"];
	if (args.seed) params.seed = args.seed;

	const res = await apiRequest("/v1/profiles", key, params);
	const data = (await res.json()) as { profiles?: Record<string, unknown>[] };

	if (!res.ok) {
		console.error(JSON.stringify(data, null, 2));
		process.exit(1);
	}

	const profiles = data.profiles || [];
	const format = args.format || "json";

	switch (format) {
		case "table":
			console.log(formatTable(profiles));
			break;
		case "csv":
			console.log(formatCsv(profiles));
			break;
		default:
			console.log(JSON.stringify(data, null, 2));
	}
}

main();
