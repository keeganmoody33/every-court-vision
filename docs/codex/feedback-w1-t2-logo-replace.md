# Codex — Feedback W1-T2: Replace "EVERY" wordmark with logo `<img>`

> Source: user's analysis 2026-04-28. Preserved near-verbatim with envelope added for cloud-agent autonomy.

## Envelope

| | |
|---|---|
| **Repo** | `https://github.com/keeganmoody33/every-court-vision` |
| **Branch from** | `main` |
| **Branch to create** | `fix/overview-logo` |
| **PR target** | `main` |
| **Package manager** | `pnpm` only |

## Task

The Overview header shows the text **"EVERY"** in large bold letters as a wordmark. Replace it with an `<img>` tag pointing to the actual every.to logo asset.

**STEP 1:** Check if a logo asset already exists in `/public` or `/assets`. If yes, use it.

**STEP 2:** If no asset exists, add a placeholder:
```tsx
<img src="/every-logo.png" alt="Every" className="h-8 w-auto" />
```
And leave a TODO comment: `{/* REPLACE WITH ACTUAL LOGO ASSET */}`.

**Do NOT** fabricate or hotlink an external image.

## Allowed files

The Overview header/hero component only. Search for the JSX element rendering the large "EVERY" text to locate it.

## Do not touch

Navigation, layout files, data files, any other component.

## Acceptance

- The "EVERY" text element is replaced.
- Either a real asset renders OR a clearly marked placeholder `<img>` tag is in place.
- No layout shifts caused.

## Stop conditions

If the logo is rendered via CSS (`background-image`, `::before content`, etc.) rather than a text node, **stop and report** the implementation detail — do not guess at CSS.

## PR template

```
fix(brand): replace EVERY wordmark with logo asset

Per user feedback: the bold "EVERY" text in the Overview header was a
wordmark substitute. Replaced with the actual every.to logo asset
(or placeholder + TODO if no asset present).

## Test plan
- [x] /overview header renders logo (or placeholder)
- [x] no layout shift
- [x] alt text present for a11y
```
