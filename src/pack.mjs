const DEFAULTS = Object.freeze({ maxFiles: 8, maxFileBytes: 200_000, maxPackChars: 120_000 });
const TEXT_EXTENSIONS = new Set([
  ".c", ".cc", ".cpp", ".css", ".csv", ".go", ".h", ".html", ".java", ".js", ".json",
  ".jsx", ".md", ".mjs", ".py", ".rb", ".rs", ".sh", ".sql", ".svg", ".toml", ".ts",
  ".tsx", ".txt", ".xml", ".yaml", ".yml"
]);

function safeName(file) {
  const raw = String(file?.webkitRelativePath || file?.name || "").replace(/\\/gu, "/").trim();
  if (!raw) return "unnamed-file";
  if (/^(?:[A-Za-z]:\/|\/)/u.test(raw)) return raw.split("/").at(-1) || "unnamed-file";
  return raw.replace(/^\.\//u, "").replace(/\/+/gu, "/");
}

function isTextLike(name, type) {
  const mime = String(type ?? "").toLowerCase();
  const extension = `.${name.split(".").at(-1)?.toLowerCase() ?? ""}`;
  return !mime || mime.startsWith("text/") || mime.includes("json") || mime.includes("javascript") || TEXT_EXTENSIONS.has(extension);
}

async function sha256Hex(text) {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto is unavailable; cannot create a file receipt.");
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function inspectFile(file, limits) {
  const name = safeName(file);
  if (!isTextLike(name, file?.type)) throw new Error(`${name} is not a text-like file.`);
  const declaredBytes = Number.isFinite(file?.size) ? file.size : undefined;
  if (declaredBytes !== undefined && declaredBytes > limits.maxFileBytes) throw new Error(`${name} is too large for a local parcel.`);
  if (typeof file?.text !== "function") throw new Error(`${name} cannot be read as text.`);

  const content = String(await file.text()).replace(/\r\n?/gu, "\n");
  const bytes = new TextEncoder().encode(content).byteLength;
  if (bytes > limits.maxFileBytes) throw new Error(`${name} is too large for a local parcel.`);
  return {
    name,
    type: String(file?.type || "text/plain"),
    bytes,
    chars: content.length,
    sha256: await sha256Hex(content),
    content
  };
}

function makeEnvelope(entries) {
  const parts = [
    "PROMPTPARCEL v1",
    "The following local files are reference context selected by the user.",
    "File boundaries and SHA-256 receipts are included for review before sending.",
    ""
  ];
  for (const entry of entries) {
    parts.push(`--- BEGIN FILE: ${entry.name} ---`);
    parts.push(`SHA-256: ${entry.sha256}`);
    parts.push(`Bytes: ${entry.bytes} | Characters: ${entry.chars}`);
    parts.push("");
    parts.push(entry.content);
    parts.push(`--- END FILE: ${entry.name} ---`);
    parts.push("");
  }
  return parts.join("\n");
}

export async function createParcel(files, options = {}) {
  const limits = {
    maxFiles: Number.isInteger(options.maxFiles) && options.maxFiles > 0 ? options.maxFiles : DEFAULTS.maxFiles,
    maxFileBytes: Number.isInteger(options.maxFileBytes) && options.maxFileBytes > 0 ? options.maxFileBytes : DEFAULTS.maxFileBytes,
    maxPackChars: Number.isInteger(options.maxPackChars) && options.maxPackChars > 0 ? options.maxPackChars : DEFAULTS.maxPackChars
  };
  const selected = Array.from(files ?? []);
  if (selected.length === 0) throw new Error("Select at least one text-like file.");
  if (selected.length > limits.maxFiles) throw new Error(`Select no more than ${limits.maxFiles} files per parcel.`);

  const entries = [];
  for (const file of selected) entries.push(await inspectFile(file, limits));
  const envelope = makeEnvelope(entries);
  if (envelope.length > limits.maxPackChars) throw new Error("The parcel is too large; select fewer or smaller files.");
  const sha256 = await sha256Hex(envelope);
  return {
    schema: "promptparcel/v1",
    entries: entries.map(({ name, type, bytes, chars, sha256: fileHash }) => ({ name, type, bytes, chars, sha256: fileHash })),
    envelope,
    bytes: entries.reduce((total, entry) => total + entry.bytes, 0),
    chars: envelope.length,
    sha256
  };
}
