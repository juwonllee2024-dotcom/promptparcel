# Security

PromptParcel keeps the first version deliberately narrow:

- Files are read only after the user selects them in the popup.
- File contents stay in popup memory until the user copies or inserts the parcel.
- No network calls, cookies, history, clipboard reads, extension storage, analytics, or auto-submit exist.
- Only `activeTab`, `scripting`, and `clipboardWrite` are requested.
- Absolute local paths are never displayed in the receipt.

If you find a security issue, do not publish sensitive details in a public issue. Use GitHub's private vulnerability reporting for this repository when available, or contact `juwonllee2024-dotcom@users.noreply.github.com` with reproduction steps and affected version.
