# Trigger cases for article-fit

Written to the format in tune-skill's `references/test-cases.md`. The skill under test is
`article-fit`, judged only from its `description` frontmatter. Competing descriptions read for
these cases: `draft-skill`, `tune-skill`, `skill-to-mod`, `findable`, and the built-in `pdf` skill.

**Run:** hand-run on 2026-10-26 against the descriptions only. No automated triggering loop was
run. Family check: `regress.py` over the five skills found 0 collisions and 0 dangling handoffs.

## Cases

| # | Message | Expected skill | Pass condition | Result |
| --- | --- | --- | --- | --- |
| 1 | "[article.pdf] Does any of this fit what we have?" | article-fit | returns the verdict and items table; creates no files | PASS |
| 2 | "Read this paper and tell me if there's a skill in it." | article-fit | every item names a vehicle and the sibling it overlaps with | PASS |
| 3 | "[article.pdf]" with no text | article-fit | returns the items table and ends with the go / park / drop line | PASS (`pdf` also loads, since its description claims any .pdf; article-fit uses it to extract, so the two don't conflict) |
| 4 | "Someone sent me this write-up on eval harnesses. Worth our time?" | article-fit | judges fit against the arm-pz catalog rather than just summarising | PASS (weak: matches only the general sense, none of the quoted phrases) |
| 5 | "Saw this blog on pre-commit hooks. Could we turn it into something?" | article-fit | classifies the hook idea, and points to `skill-to-mod` if it wraps a skill | PASS |
| 6 | "Extract the tables from this PDF into a spreadsheet." | pdf / xlsx | article-fit does not load | PASS (explicit "Not for extracting") |
| 7 | "Should my `findable` skill be a mod?" | skill-to-mod | article-fit does not load | PASS (explicit "Not for") |
| 8 | "Summarise this article for me." | none | article-fit does not load | PASS (borderline: a clear instruction rules out the "no other instruction" clause) |
| 9 | "Make me a skill from the checklist in this article." | article-fit | one-item triage with overlaps, waits for `go`, then hands the block to draft-skill | PASS (quoted phrase "make a skill from this article"; draft-skill's "make me a skill for X" still overlaps, so both may load. Both lead to the same handoff) |
| 10 | "Make me a skill that formats meeting notes." (no article) | draft-skill | article-fit does not load | PASS (explicit "Not for drafting a skill from an idea with no article") |

## Boundary pairs

| Message | Should trigger | Why |
| --- | --- | --- |
| "Is there anything in this article we should build?" | article-fit | the decision is still open |
| "Build a skill from this article's checklist" | article-fit, then draft-skill | overlaps get checked before anything is written (decided 2026-10-27) |
| "Build a skill that does X" (no article) | draft-skill | there is no article to triage |
| "This article says our tune-skill misses X. Is it right?" | article-fit | judges the article's idea, producing an *enhance existing* item |
| "Add X to tune-skill" | tune-skill | edits an existing skill |

Spans both: "triage this article and build whatever's worth it" starts with `article-fit`, stops
at "Your call", and after the user's `go` hands each item's detail block to `draft-skill`.

## Not verified

- Real model triggering. These are description-level judgements.
- An end-to-end run on a real article PDF.
