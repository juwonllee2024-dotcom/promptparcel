import { insertIntoActiveComposer } from "./src/inject.mjs";
import { createParcel } from "./src/pack.mjs";

const fileInput = document.querySelector("#file-input");
const chooseButton = document.querySelector("#choose-button");
const selectionStatus = document.querySelector("#selection-status");
const fileList = document.querySelector("#file-list");
const parcelPanel = document.querySelector("#parcel-panel");
const receiptFiles = document.querySelector("#receipt-files");
const receiptSize = document.querySelector("#receipt-size");
const receiptHash = document.querySelector("#receipt-hash");
const copyButton = document.querySelector("#copy-button");
const insertButton = document.querySelector("#insert-button");
const actionStatus = document.querySelector("#action-status");
let currentParcel = null;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
}

function setActionStatus(message, error = false) {
  actionStatus.textContent = message;
  actionStatus.className = `action-status${error ? " error" : ""}`;
}

function renderFiles(parcel) {
  fileList.replaceChildren();
  for (const entry of parcel.entries) {
    const row = document.createElement("div");
    row.className = "file-row";
    const glyph = document.createElement("span");
    glyph.className = "file-glyph";
    glyph.textContent = "▧";
    const meta = document.createElement("div");
    meta.className = "file-meta";
    const name = document.createElement("div");
    name.className = "file-name";
    name.textContent = entry.name;
    const detail = document.createElement("div");
    detail.className = "file-detail";
    detail.textContent = `${formatBytes(entry.bytes)} · ${entry.chars.toLocaleString()} chars`;
    meta.append(name, detail);
    const hash = document.createElement("span");
    hash.className = "file-hash";
    hash.textContent = entry.sha256.slice(0, 8);
    row.append(glyph, meta, hash);
    fileList.append(row);
  }
}

function renderParcel(parcel) {
  currentParcel = parcel;
  renderFiles(parcel);
  parcelPanel.hidden = false;
  receiptFiles.textContent = `${parcel.entries.length} file${parcel.entries.length === 1 ? "" : "s"}`;
  receiptSize.textContent = `${parcel.chars.toLocaleString()} characters`;
  receiptHash.textContent = parcel.sha256;
  copyButton.disabled = false;
  insertButton.disabled = false;
  setActionStatus("Receipt ready. Review it, then choose where it goes.");
}

async function readSelectedFiles() {
  currentParcel = null;
  parcelPanel.hidden = true;
  copyButton.disabled = true;
  insertButton.disabled = true;
  const files = Array.from(fileInput.files ?? []);
  if (files.length === 0) {
    fileList.replaceChildren();
    selectionStatus.textContent = "Nothing selected. Files are read only after you choose them.";
    return;
  }

  chooseButton.disabled = true;
  selectionStatus.textContent = `Reading ${files.length} file${files.length === 1 ? "" : "s"} locally…`;
  try {
    const parcel = await createParcel(files);
    renderParcel(parcel);
    selectionStatus.textContent = `${files.length} selected. No file path is sent or stored.`;
  } catch (error) {
    fileList.replaceChildren();
    selectionStatus.textContent = error instanceof Error ? error.message : "Could not read selected files.";
    setActionStatus("Parcel not created.", true);
  } finally {
    chooseButton.disabled = false;
  }
}

async function copyParcel() {
  if (!currentParcel) return;
  try {
    await navigator.clipboard.writeText(currentParcel.envelope);
    setActionStatus("Copied. Paste the parcel into the AI tab when ready.");
  } catch {
    setActionStatus("Copy blocked by the browser. Use Insert into AI tab instead.", true);
  }
}

async function insertParcel() {
  if (!currentParcel) return;
  insertButton.disabled = true;
  setActionStatus("Finding the current AI composer…");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active browser tab found.");
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: insertIntoActiveComposer,
      args: [currentParcel.envelope]
    });
    const result = injection?.result;
    if (!result?.ok) throw new Error(result?.reason ?? "No editable AI composer found on this tab.");
    setActionStatus("Inserted into the composer. Review it, then press Send yourself.");
  } catch (error) {
    setActionStatus(error instanceof Error ? error.message : "Could not insert into this tab.", true);
  } finally {
    insertButton.disabled = false;
  }
}

chooseButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", readSelectedFiles);
copyButton.addEventListener("click", copyParcel);
insertButton.addEventListener("click", insertParcel);
