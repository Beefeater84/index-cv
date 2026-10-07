# Index CV

CV structured for AI agents: an HR person gives an assistant one link and discusses the candidate's experience with it.

- [docs/spec.md](docs/spec.md) — design and data model
- [docs/constraints.md](docs/constraints.md) — HTML, text and token limits

## Writing content

`content/` is an Obsidian vault:

- `about.md` — header, summary, FAQ
- `skills.yaml` — skill registry (aliases, category, years)
- `projects/*.md` — one note per project; `skills` in frontmatter, `[[slug]]` links between projects

## Commands

```sh
npm install
npm run dev      # local preview
npm run build    # build to dist/ + check constraints
npm run check    # check constraints on existing dist/
```

`SITE_URL` sets the public URL (default `https://cv.example.com`).
