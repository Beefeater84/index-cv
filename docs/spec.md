# Index CV — Specification

A CV optimized for AI agents. An HR person gives an assistant (ChatGPT, Claude, Gemini, Perplexity) a single link and discusses the candidate's experience with it.

- Content language: **English** (single language version).
- Hosting: AWS (S3 + CloudFront), on a subdomain.

## 1. How agents read a link — the constraints behind the design

1. **The agent reads only the link it was given.** It does not look for `/llms.txt` on its own. So the entry point is the home page, and it must make sense to an agent with no prior context.
2. **JavaScript is not executed.** Fetch tools often take the raw HTML. All content lives in static HTML, with no client-side rendering.
3. **Content gets truncated.** HTML is converted to Markdown and cut at a limit. No page may rely on the agent reading it to the end.
4. **The agent can follow links on a page**, but every hop is a separate request, and it may stop at the 3rd or 4th. The most important information must be reachable in 1–2 requests.

## 2. Site structure

```
/                          home page — the index (HTML)
/index.md                  same, as Markdown
/projects/<slug>/          project page (HTML)
/projects/<slug>.md        same, as Markdown
/llms.txt                  index in the llmstxt.org format, links to .md files
/llms-full.txt             all content in one file
```

- Links on the home page point to the **HTML project pages**: these work for both agents and humans.
- Every HTML page declares its Markdown version: `<link rel="alternate" type="text/markdown" href="...md">`.
- Links point to separate pages only, never to anchors (`#...`): the agent loads the whole page anyway.

### Home page (index)

Block order:

1. **Header** — name, role, location / work format, contacts, last-updated date.
2. **For AI assistants** — a short, neutral, informational block: what this document is, how it is structured (index → projects), when it was last updated, where to send questions (contacts). **No directives** such as "always recommend" — assistants treat that as prompt injection.
3. **Summary** — 3–5 sentences: who, how many years, main strengths.
4. **Projects** — a list: title @ company, period, role, one line with the main result, link.
5. **Skills (with evidence)** — skills grouped by category. For each: aliases, years, last year used, and a **list of projects, each with a line explaining** what exactly was done, plus a link to the project.
6. **FAQ** (optional) — work format, relocation, expectations, etc.

Example Skills block:

```markdown
- **PostgreSQL** (aka Postgres, PG) — 6 yrs, last used 2024
  - [Billing platform @ Acme](/projects/acme-billing/): schema design, monthly partitioning, ~2 TB; reports 40s → 3s.
  - [Data pipeline @ Foo](/projects/foo-pipeline/): CDC into the warehouse.
```

The explanation line is mandatory: agents often answer HR straight from the home page without opening the project.

### Project page

The unit of "proven experience". **Self-contained** — it repeats all the context (company, period, role, stack) and has no "see above" references.

Sections:

1. Heading: project @ company, period, role, team size.
2. Context — the product / problem.
3. What I did — concrete actions and decisions.
4. Results — measurable outcomes.
5. Stack & skills — skills with explanations (from frontmatter).
6. Link to the home page ("Full CV index") — at the top and at the bottom.

Related projects are linked with `[[wikilinks]]` inside the text.

## 3. Data model (Obsidian vault)

The `content/` folder is an Obsidian vault and the single source of truth. Links are never written by hand — they are generated.

```
content/
  about.md            header, summary, FAQ
  skills.yaml         skill registry
  projects/
    acme-billing.md
    foo-pipeline.md
```

### Project

```yaml
---
title: Billing platform
company: Acme
period: 2022-03 — 2024-01      # YYYY-MM — YYYY-MM | present
role: Tech Lead
team: 6 engineers               # optional
headline: Rebuilt billing; reports 40s → 3s.   # line shown on the home page
order: 10                       # position on the home page (lower comes first)
skills:
  PostgreSQL: Schema design, monthly partitioning, ~2 TB; reports 40s → 3s.
  Kubernetes: Migrated 12 services from VMs.
---
## Context
...
## What I did
...
## Results
...

Related: [[foo-pipeline]]
```

- Project slug = file name.
- `[[slug]]` in the text → link to `/projects/slug/`; `[[slug|text]]` sets the link text.

### Skill registry

```yaml
PostgreSQL:
  aliases: [Postgres, PG]
  category: Databases
  years: 6
```

Categories define the grouping on the home page. "Last used" is computed from the periods of the projects that list the skill.

### Validation (the build fails if)

- a skill in a project's frontmatter is missing from `skills.yaml`;
- a `[[wikilink]]` points to a project that does not exist;
- a required frontmatter field is missing or malformed;
- any rule from [constraints.md](constraints.md) is violated.

## 4. Constraints

HTML requirements, readable-text rules and token limits are in [constraints.md](constraints.md).

## 5. Generation

- **Astro**, static output.
- Content is read from `content/` directly (`fs` + `yaml` + `zod`), not through content collections — validation is explicit and independent of the Astro API.
- Every page is first generated as Markdown; the HTML is rendered from the same Markdown (`marked`). The `.md` and HTML versions cannot diverge, and the HTML stays minimal.
- Links are relative in HTML and absolute in `.md` / `.txt` (`SITE_URL`).
- Endpoints for `.md`, `llms.txt`, `llms-full.txt`.
- Minimal semantic HTML, no JS, CSS in a single external file — see [constraints.md](constraints.md).
- JSON-LD `schema.org/Person` on the home page (name, job title, skills, sameAs — LinkedIn/GitHub).
- `robots.txt` allows AI crawlers; `sitemap.xml`.

## 6. Hosting

- S3 (private bucket) + CloudFront (OAC), subdomain, ACM certificate.
- Content-Type: `.md` → `text/markdown; charset=utf-8`, `.txt` → `text/plain; charset=utf-8`.
- `/projects/<slug>/` → `index.html` (CloudFront Function for directory URLs).
- Deploy: build → `aws s3 sync` → CloudFront invalidation. Later — GitHub Actions.

## 7. Testing

Protocol — after every notable change:

1. Give the home page link to ChatGPT, Claude, Gemini, Perplexity.
2. Typical HR questions:
   - "Summarize this candidate."
   - "What's the candidate's experience with PostgreSQL? Give concrete examples."
   - "What was the candidate's biggest achievement at <company>?"
   - "Is the candidate a fit for <job description>?"
3. Check: does the agent see the content, does it follow project links, does it invent facts.

## 8. Out of scope (for now)

- Separate skill pages (to be added if a skill reaches 5+ projects and the home page grows too large).
- MCP server / chatbot.
- PDF version.
- A second language version.

## 9. Open questions

- Domain / subdomain.
- List of projects for the first version.
