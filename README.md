# Layrs marketing origin

Dependency-free production source for `https://layrs.xyz`.

Open `index.html` directly for local development. There is no application server,
framework runtime, client router, analytics SDK, wallet code, or form handler on this
origin.

## Source

| File | Purpose |
|---|---|
| `index.html` | Semantic landing-page markup |
| `styles.css` | Tokenized light/dark design system |
| `site.js` | Redaction and progressive-reveal behavior |
| `layrs-mark.svg` | Current-color vector mark |
| `fonts-inlined.css` | Self-contained Zodiak, Switzer and JetBrains Mono faces |
| `fetch-fonts.sh` | Rebuilds the optional font bundle from documented sources |

## Commands

```bash
npm run check
npm test
npm run build
```

`npm run build` creates an allowlisted, immutable `dist/` artifact. It never copies
repository metadata, scripts, tests or historical assets into the public bundle.

## Design invariants

- `.mark` uses animated `background-size` and `box-decoration-break: clone`.
- `.redact` remains a real button with hover, focus and click/tap behavior.
- `.foot-grid nav a` and the ledger child combinators remain scoped.
- Components use CSS custom-property tokens instead of direct colors.
- Reduced-motion and keyboard behavior are release requirements.
- Yellow is a fill, never light-theme text.

## Hosting

The artifact is deployed to a private `layrsv2` S3 origin behind the dedicated
`layrs.xyz` CloudFront distribution. Cloudflare points the apex to that distribution.
Amplify is not used. Security headers are attached through the generation-v2
CloudFront response-headers policy.

Ready-to-install GitHub Actions definitions live under `deployment/github-actions/`.
They must be promoted to `.github/workflows/` by a repository credential with GitHub's
`workflow` permission; the current automation PAT cannot add or update workflow files.
