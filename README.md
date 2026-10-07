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

## License

The code is licensed under the [MIT License](LICENSE).

The CV content in `content/` (texts, project descriptions, personal data) is © Tony Miasoedov, all rights reserved, and is **not** covered by the MIT License. If you reuse this project for your own CV, replace everything in `content/`.
