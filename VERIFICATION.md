# Verification record

Date: 2026-08-28
Version: v0.1.0

## Local commands

- `npm ci` — passed; 1 package audited, 0 vulnerabilities
- `npm test` — passed; 6 tests passed
- `npm run lint` — passed; 7 source files and manifest privacy policy checked
- `npm run typecheck` — passed; MV3 manifest and core parcel contract checked
- `npm run build` — passed; `dist/` generated
- `npm run smoke` — passed; 2 example files packed and `dist/` read back
- `npm run audit` — passed; 0 high-severity vulnerabilities
- `git diff --check` — passed

## Example scenario

Two local text files are selected. PromptParcel creates a bounded envelope with both contents, per-file SHA-256 receipts, and a parcel SHA-256. The user can copy it or insert it into the active AI composer; no send action occurs.

## Release artifact

`PromptParcel-v0.1.0.zip` SHA-256: `2b3dc70530cf67d149e6a1f49b35662067b97edbd620020df95f69f8f3250b1f`
