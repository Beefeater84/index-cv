# Constraints

Hard rules for every published page. They are checked at build time. If a rule is violated, the build fails — except for items marked "warning".

Why: an agent loads a page, converts the HTML to text and truncates it at a limit (see [spec.md](spec.md), section 1). Anything that is not readable text either wastes that limit or gets in the way of the conversion.

## 1. Minimal HTML

- **No JavaScript.** The only `<script>` is the JSON-LD on the home page.
- **CSS is a single external file** (`/style.css`, ≤ 5 KB). No `<style>` in pages and no `style="..."` attributes. Agents do not load CSS, so moving it out of the HTML costs them nothing.
- **Semantic tags only:** `h1–h3`, `p`, `ul/ol/li`, `a`, `strong/em`, `time`, `header/main/footer`, `section`. No layout `div` wrappers and no extra classes.
- **No** icon fonts, inline SVG, images in content, trackers, cookie banners or widgets.
- Minimal navigation: none on the home page; on a project page, a single "Full CV index" link at the top and at the bottom.

### Raw HTML limits

| Page | HTML size | Text share* |
|---|---|---|
| Home | ≤ 40 KB | ≥ 50 % |
| Project | ≤ 30 KB | ≥ 60 % |

\* Bytes of readable text / bytes of HTML. Lower on the home page because of the JSON-LD. Only checked for HTML ≥ 10 KB: on small pages the `<head>` dominates and the ratio says nothing.

## 2. Readable text

- **All content is text in the HTML.** Nothing in images, `title` tooltips, hidden blocks (`display:none`, `hidden`), accordions or tabs.
- **Complete sentences with specifics:** who did what, how, with what measurable result. Each line must make sense out of context.
- **Self-contained pages:** every page repeats its own context (company, period, role). No "see above" or "as mentioned".
- **Unambiguous dates:** `2022-03 — 2024-01`, `present`. Not "2 years ago".
- **Abbreviations** are expanded on first use on each page, except widely known ones (SQL, API, AWS).
- **Link text describes the target:** `Billing platform @ Acme`, not "here" or "more".
- **Lists instead of tables** for content: tables survive conversion to text poorly. Exception — short fact tables (2–3 columns).
- **Emoji and decorative symbols carry no meaning.** If dropping a symbol loses information, write it in words.
- **Important things first:** the first ~1k tokens of each page hold the key facts (home: who, role, summary; project: company, period, role, main result).

## 3. Token limit when read

Counted the way an agent reads: HTML → Markdown (turndown) → token count (`js-tiktoken`, `o200k_base`, as an approximation for all models).

| Page | Limit |
|---|---|
| Home | ≤ 4,000 tokens |
| Project | ≤ 6,000 tokens |
| `.md` versions | same limits as the HTML original |
| `llms.txt` | ≤ 4,000 tokens |
| `llms-full.txt` | warning above 40,000 tokens |

The limits leave a wide margin below typical fetch-tool truncation (roughly 10–30k tokens), so each page is guaranteed to be read in full.

## 4. Build-time check

After `astro build`, a script walks `dist/` and prints a table for every page: HTML size, text share, token count and status. The build fails if any limit from sections 1 and 3 is exceeded or forbidden elements are found (`<script>` other than JSON-LD, `<style>`, `style=`, `<img>`, `<svg>`, `<iframe>`, `<div>`).
