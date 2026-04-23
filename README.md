# random-profiles

Generate fake user profiles and companies from the command line. Powered by the [Random Profiles API](https://random-profiles.com).

## Install

```bash
npm install -g random-profiles
```

Or use directly with npx:

```bash
npx -y random-profiles --count 5
```

## Setup

Get a free API key at [random-profiles.com](https://random-profiles.com), then:

```bash
export RANDOM_PROFILES_API_KEY=rp_your_key_here
```

Or pass it inline:

```bash
npx -y random-profiles --key rp_your_key --count 5
```

## Usage

```bash
# Get 10 random profiles (default)
random-profiles

# Get 5 US female profiles
random-profiles --count 5 --country US --gender female

# Get profiles as a table
random-profiles --count 5 --format table

# Get profiles as CSV
random-profiles --count 20 --format csv > profiles.csv

# Only specific fields
random-profiles --count 5 --fields name,email,phone

# Small photo URLs
random-profiles --count 5 --photo-size 128

# Deterministic results
random-profiles --count 5 --seed 42

# Get a single profile by UUID
random-profiles --uuid a1b2c3d4-e5f6-7890-abcd-ef1234567890

# Download a random profile photo
random-profiles --image random --size 256 --output photo.jpg

# Download a specific profile photo by UUID
random-profiles --image a1b2c3d4-e5f6-7890-abcd-ef1234567890 --output avatar.jpg

# Pipe image to another command
random-profiles --image random --size 128 | imgcat

# Check your usage
random-profiles --usage
```

## Companies

```bash
# 10 random fake companies (default)
random-profiles --companies

# 5 Technology companies from the US
random-profiles --companies --count 5 --industry Technology --country US

# Mid-size healthcare or finance companies in the UK
random-profiles --companies --country GB --industry Healthcare --size 201-500,501-1000

# Only specific groups
random-profiles --companies --count 10 --fields name,industry,leadership,tech,financial

# CSV export
random-profiles --companies --count 50 --format csv > companies.csv

# Compact table
random-profiles --companies --count 10 --format table

# Deterministic
random-profiles --companies --count 3 --seed 42

# Single company by UUID
random-profiles --company-uuid 7d3063d3-b62b-41ef-8e60-f5b50dac8ee0
```

## Field Groups

**Profiles**: name, email, phone, identity, bio, social, physical, job, address, financial, network, documents, vehicle, contact, digital, interests, education, photo, relationships, meta

**Companies**: name, industry, size, location, contact, social, financial, tech, leadership, legal, operations, product, relationships, meta

The `relationships` group exposes the cross-resource graph: profiles have `company_uuid` and `colleague_uuids`, companies have `employee_uuids`. Hydrate with `--uuid` / `--company-uuid`.

## Output Formats

| Format | Description |
|--------|-------------|
| `json` | Pretty-printed JSON (default) |
| `csv` | CSV with flattened nested fields |
| `table` | Compact table with key fields |

## Profile Options

| Option | Description |
|--------|-------------|
| `--count <n>` | Number of profiles (1-100, default 10) |
| `--gender <g>` | Filter: male, female, non-binary |
| `--country <codes>` | Filter: US,GB,DE,FR,AU,BR,JP,IN,NG (comma-separated) |
| `--min-age <n>` | Minimum age filter |
| `--max-age <n>` | Maximum age filter |
| `--fields <groups>` | Field groups to return (comma-separated) |
| `--photo-size <n>` | Photo size: 64, 128, 256, 512, 1024 |
| `--photo-format <f>` | Image format for photo URL: jpg (default) or webp |
| `--seed <n>` | Seed for deterministic results |
| `--format <f>` | Output: json, csv, table |
| `--uuid <id>` | Get a single profile |

## Company Options

| Option | Description |
|--------|-------------|
| `--companies` | Fetch companies instead of profiles |
| `--count <n>` | Number of companies (1-100, default 10) |
| `--industry <name>` | Filter by industry (Technology, Healthcare, Finance, etc.) |
| `--country <codes>` | Filter: US,GB,DE,FR,AU,BR,JP,IN,NG (comma-separated) |
| `--size <brackets>` | Filter: 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5000+ |
| `--fields <groups>` | Field groups to return (comma-separated) |
| `--logo-size <n>` | Logo size in meta.logo_url: 64, 128, 256, 512, 1024 |
| `--logo-format <f>` | Image format for meta.logo_url: jpg (default) or webp |
| `--seed <n>` | Seed for deterministic results |
| `--format <f>` | Output: json, csv, table |
| `--company-uuid <id>` | Get a single company |

## Shared Options

| Option | Description |
|--------|-------------|
| `--image <id>` | Download a profile photo (UUID or `random`) |
| `--size <n>` | Image size: 64, 128, 256, 512, 1024 |
| `--output <path>` | Save image to file (default: stdout) |
| `--usage` | Show API key usage stats |
| `--key <key>` | API key (or set RANDOM_PROFILES_API_KEY) |

## See also

- [`random-profiles-types`](https://www.npmjs.com/package/random-profiles-types) — TypeScript types for the API response shapes, if you're calling the API directly from TypeScript.
- [`random-profiles-mcp`](https://www.npmjs.com/package/random-profiles-mcp) — MCP server for AI agents (Claude, Cursor, etc.).

## License

MIT
