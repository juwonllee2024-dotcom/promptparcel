# Contributing

PromptParcel is a small, local-first Chrome extension. Keep its data boundary obvious.

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run smoke
npm run audit
```

Every behavior change needs a focused test. Do not add network calls, persistent file storage, broad host permissions, silent truncation, or automatic message sending without a documented design review and explicit maintainer approval.

For provider-specific composer support, add a deterministic DOM fixture and preserve a safe error when the target UI is not recognized.
