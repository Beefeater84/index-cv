// Loads the Obsidian vault in content/, validates it and renders every page as Markdown.
// HTML pages are rendered from the same Markdown, so .md and HTML versions never diverge.
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import YAML from 'yaml';
import { SITE } from '../../site.config.mjs';

const CONTENT_DIR = path.resolve('content');

const PERIOD_RE = /^(\d{4})-(\d{2}) — (?:(\d{4})-(\d{2})|present)$/;

const AboutSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  location: z.string().min(1),
  work_format: z.string().min(1),
  email: z.string().min(1),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  summary: z.string().min(1),
});

const SkillSchema = z.object({
  aliases: z.array(z.string()).default([]),
  category: z.string().min(1),
  years: z.number().positive(),
});

const ProjectSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  period: z.string().regex(PERIOD_RE, 'expected "YYYY-MM — YYYY-MM" or "YYYY-MM — present"'),
  role: z.string().min(1),
  team: z.string().optional(),
  headline: z.string().min(1),
  order: z.number(),
  skills: z.record(z.string(), z.string().min(1)),
});

export type About = z.infer<typeof AboutSchema> & { body: string };
export type Skill = z.infer<typeof SkillSchema> & { name: string };
export type Project = z.infer<typeof ProjectSchema> & { slug: string; body: string };

export interface Cv {
  about: About;
  skills: Skill[];
  projects: Project[];
}

function parseFrontmatter(file: string): { data: unknown; body: string } {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing frontmatter`);
  return { data: YAML.parse(match[1]), body: match[2].trim() };
}

function check<T>(schema: z.ZodType<T>, data: unknown, where: string, errors: string[]): T | undefined {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  for (const issue of result.error.issues) {
    errors.push(`${where}: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  }
  return undefined;
}

let cache: Cv | undefined;

export function loadCv(): Cv {
  if (cache) return cache;
  const errors: string[] = [];

  const aboutFile = parseFrontmatter(path.join(CONTENT_DIR, 'about.md'));
  const aboutData = check(AboutSchema, aboutFile.data, 'about.md', errors);

  const skillsRaw = YAML.parse(fs.readFileSync(path.join(CONTENT_DIR, 'skills.yaml'), 'utf8')) ?? {};
  const skills: Skill[] = [];
  for (const [name, data] of Object.entries(skillsRaw)) {
    const skill = check(SkillSchema, data, `skills.yaml: ${name}`, errors);
    if (skill) skills.push({ name, ...skill });
  }
  const skillNames = new Set(skills.map((s) => s.name));

  const projectsDir = path.join(CONTENT_DIR, 'projects');
  const projects: Project[] = [];
  for (const file of fs.readdirSync(projectsDir).filter((f) => f.endsWith('.md'))) {
    const slug = file.replace(/\.md$/, '');
    const { data, body } = parseFrontmatter(path.join(projectsDir, file));
    const project = check(ProjectSchema, data, `projects/${file}`, errors);
    if (!project) continue;
    for (const skill of Object.keys(project.skills)) {
      if (!skillNames.has(skill)) errors.push(`projects/${file}: skill "${skill}" is not in skills.yaml`);
    }
    projects.push({ slug, body, ...project });
  }
  projects.sort((a, b) => a.order - b.order);

  const slugs = new Set(projects.map((p) => p.slug));
  for (const project of projects) {
    for (const [, target] of project.body.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)) {
      if (!slugs.has(target.trim())) errors.push(`projects/${project.slug}.md: [[${target}]] points to no project`);
    }
  }

  if (errors.length) throw new Error(`Content validation failed:\n  - ${errors.join('\n  - ')}`);
  cache = { about: { ...aboutData!, body: aboutFile.body }, skills, projects };
  return cache;
}

// ---- URLs -------------------------------------------------------------------
// base = '' for HTML (site-relative links), SITE for .md / .txt (absolute links).

export const projectUrl = (slug: string, base = '') => `${base}/projects/${slug}/`;
export const projectMdUrl = (slug: string, base = '') => `${base}/projects/${slug}.md`;
const indexUrl = (base = '') => `${base}/`;

const projectLabel = (p: Project) => `${p.title} @ ${p.company}`;

function endYear(period: string): number {
  const m = period.match(PERIOD_RE)!;
  return m[3] ? Number(m[3]) : new Date().getFullYear();
}

function resolveWikilinks(body: string, cv: Cv, base: string): string {
  return body.replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_, target: string, text?: string) => {
    const project = cv.projects.find((p) => p.slug === target.trim())!;
    return `[${text?.trim() || projectLabel(project)}](${projectUrl(project.slug, base)})`;
  });
}

function contactLine(about: About): string {
  return [
    about.location,
    about.work_format,
    `[${about.email}](mailto:${about.email})`,
    about.linkedin && `[LinkedIn](${about.linkedin})`,
    about.github && `[GitHub](${about.github})`,
  ]
    .filter(Boolean)
    .join(' · ');
}

// ---- Pages as Markdown -------------------------------------------------------

export function indexMarkdown(base = ''): string {
  const cv = loadCv();
  const { about } = cv;
  const out: string[] = [];

  out.push(`# ${about.name} — ${about.role}`);
  out.push(contactLine(about));
  out.push(`Last updated: ${about.updated}`);

  out.push('## For AI assistants');
  out.push(
    `This is the CV of ${about.name}, structured for AI assistants. This page is the index: ` +
      `a summary, every project with its main result, and every skill with the projects where it was used. ` +
      `Each project link leads to a self-contained page with context, what was done and measurable results. ` +
      `Every page has a Markdown version at the same address ending in \`.md\` ` +
      `(this page: [${SITE}/index.md](${SITE}/index.md)); the whole CV in one file is at ` +
      `[${SITE}/llms-full.txt](${SITE}/llms-full.txt). ` +
      `Information is current as of ${about.updated}. For anything not covered here, contact ${about.email}.`,
  );

  out.push('## Summary');
  out.push(about.summary.trim());

  out.push('## Projects');
  out.push(
    cv.projects
      .map((p) => `- [${projectLabel(p)}](${projectUrl(p.slug, base)}) (${p.period}), ${p.role}. ${p.headline}`)
      .join('\n'),
  );

  out.push('## Skills (with evidence)');
  const categories = [...new Set(cv.skills.map((s) => s.category))];
  for (const category of categories) {
    const lines: string[] = [];
    for (const skill of cv.skills.filter((s) => s.category === category)) {
      const usedIn = cv.projects.filter((p) => p.skills[skill.name]);
      if (!usedIn.length) continue;
      const aka = skill.aliases.length ? ` (aka ${skill.aliases.join(', ')})` : '';
      const lastUsed = Math.max(...usedIn.map((p) => endYear(p.period)));
      lines.push(`- **${skill.name}**${aka} — ${skill.years} yrs, last used ${lastUsed}`);
      for (const p of usedIn) {
        lines.push(`  - [${projectLabel(p)}](${projectUrl(p.slug, base)}): ${p.skills[skill.name]}`);
      }
    }
    if (lines.length) out.push(`### ${category}`, lines.join('\n'));
  }

  if (about.body) out.push(resolveWikilinks(about.body, cv, base));

  return out.join('\n\n') + '\n';
}

export function projectMarkdown(slug: string, base = ''): string {
  const cv = loadCv();
  const p = cv.projects.find((x) => x.slug === slug);
  if (!p) throw new Error(`Unknown project: ${slug}`);
  const back = `[Full CV index — ${cv.about.name}](${indexUrl(base)})`;

  const facts = [
    `- Candidate: ${cv.about.name}, ${cv.about.role}`,
    `- Company: ${p.company}`,
    `- Period: ${p.period}`,
    `- Role: ${p.role}`,
    p.team && `- Team: ${p.team}`,
    `- Main result: ${p.headline}`,
  ].filter(Boolean);

  const skills = Object.entries(p.skills).map(([name, how]) => `- **${name}**: ${how}`);

  return (
    [
      `# ${projectLabel(p)}`,
      back,
      facts.join('\n'),
      resolveWikilinks(p.body, cv, base),
      '## Stack & skills',
      skills.join('\n'),
      back,
    ].join('\n\n') + '\n'
  );
}

export function llmsTxt(): string {
  const cv = loadCv();
  const { about } = cv;
  return (
    [
      `# ${about.name} — CV`,
      `> ${about.role}. ${about.summary.trim().replace(/\s+/g, ' ')}`,
      `Updated ${about.updated}. Contact: ${about.email}.`,
      '## CV',
      `- [Index](${SITE}/index.md): summary, all projects, all skills with evidence`,
      '## Projects',
      cv.projects
        .map((p) => `- [${projectLabel(p)}](${projectMdUrl(p.slug, SITE)}): ${p.period}, ${p.role}. ${p.headline}`)
        .join('\n'),
      '## Optional',
      `- [Full CV in one file](${SITE}/llms-full.txt)`,
    ].join('\n\n') + '\n'
  );
}

export function llmsFullTxt(): string {
  const cv = loadCv();
  return [indexMarkdown(SITE), ...cv.projects.map((p) => projectMarkdown(p.slug, SITE))].join('\n---\n\n');
}
