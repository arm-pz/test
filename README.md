# article-fit

An agent skill that reads an article PDF (a blog post, paper or vendor write-up) and judges whether its ideas fit the arm-pz ecosystem: as a new skill, agent, mod, workflow, hook or connector, or as a change to a skill that already exists. It returns a ranked list of actionable items and builds nothing until you pick.

Install: `npx skills add arm-pz/article-fit --skill article-fit`

Ask it things like:

- "[article.pdf] Does any of this fit what we have?"
- "Read this paper and tell me if there's a skill in it."
- "Make a skill from the checklist in this article."
- Or drop the PDF with no message.

## What you get

| Section | Contents |
|---|---|
| Verdict | Strong, partial or no fit, with a two-to-three-sentence summary |
| Actionable items | Up to about 7, each with a vehicle, value, effort, confidence and overlaps |
| Item details | A sketch, a boundary line and example requests for each item: the input `draft-skill` takes |
| Not pursuing | Ideas left out, and why |
| Your call | Reply `go 1, 3`, `park` or `drop` |

On `go`, skill items go to `draft-skill` and *enhance existing* items go to `tune-skill`.

## Not for

Extracting or editing PDFs (use a PDF skill), drafting a skill from an idea with no article behind it (`draft-skill`), tuning an existing skill (`tune-skill`), or deciding whether an existing skill should become a mod (`skill-to-mod`). All three are arm-pz repos and install the same way.

## Install

```
npx skills add arm-pz/article-fit --skill article-fit
```

Or copy `skills/article-fit/` into your agent's skills directory (for example `.claude/skills/`). With Claude Code plugins, `.claude-plugin/plugin.json` makes the repo installable as a plugin.

## Structure

```
article-fit/
├── README.md
├── LICENSE
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── article-fit/
│       └── SKILL.md        # workflow, vehicle table, output format, ecosystem notes
└── tests/
    └── trigger-cases.md    # trigger cases and boundary pairs, hand-run
```
