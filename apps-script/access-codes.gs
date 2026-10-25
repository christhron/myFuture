/*
 * myFuture Nigeria — access-code checker (Google Apps Script)
 * Paste this into Extensions → Apps Script of a Google Sheet that has two tabs:
 *   Codes: code | max_uses | uses | note     (one row per code, header in row 1)
 *   Log:   timestamp | code | result          (header in row 1; rows are added automatically)
 * Deploy as a web app (Execute as: Me, Who has access: Anyone) and put the
 * /exec URL in accessCheckUrl in js/questions.js. See README.md.
 */
function doGet(e) {
  const code = normalise((e && e.parameter && e.parameter.code) || "");
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // one check at a time, so two students can't take the last use together
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const codes = book.getSheetByName("Codes");
    const rows = codes.getDataRange().getValues();
    let result = "unknown";
    for (let r = 1; r < rows.length; r++) {
      if (!code || normalise(rows[r][0]) !== code) continue;
      const max = Number(rows[r][1]) || 0;
      const uses = Number(rows[r][2]) || 0;
      if (uses >= max) { result = "used up"; break; }
      codes.getRange(r + 1, 3).setValue(uses + 1);
      result = "accepted";
      break;
    }
    book.getSheetByName("Log").appendRow([new Date(), code, result]);
    return reply({ ok: result === "accepted", result });
  } finally {
    lock.releaseLock();
  }
}

// Codes are matched ignoring case and spaces; long input is cut short to keep the log tidy.
function normalise(s) {
  return String(s).toUpperCase().replace(/\s+/g, "").slice(0, 40);
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
