// ═══════════════════════════════════════════════════════════════════════════
// PDP Readiness Assessment Tool — Google Drive Receiver
// Paste file ini ke script.google.com (project baru)
// Deploy sebagai Web App: Execute as Me, Who has access: Anyone
// Copy URL hasil deploy ke VITE_APPS_SCRIPT_URL (.env.local + GitHub Secret)
// ═══════════════════════════════════════════════════════════════════════════

const FOLDER_NAME = 'peedeepee';

function getRootFolder() {
  const f = DriveApp.getFoldersByName(FOLDER_NAME);
  return f.hasNext() ? f.next() : DriveApp.createFolder(FOLDER_NAME);
}

function getSub(root, name) {
  const s = root.getFoldersByName(name);
  return s.hasNext() ? s.next() : root.createFolder(name);
}

const MAP = {
  consent: 'consent-records',
  assessment: 'assessments',
  report: 'reports',
  export: 'exports',
};

function doPost(e) {
  try {
    const { type, fileName, data } = JSON.parse(e.postData.contents);
    const folder = getSub(getRootFolder(), MAP[type] || 'exports');
    const content = JSON.stringify(data, null, 2);
    const existing = folder.getFilesByName(fileName);

    if (existing.hasNext()) {
      existing.next().setContent(content);
    } else {
      folder.createFile(fileName, content, MimeType.PLAIN_TEXT);
    }

    // Opsional: log ke spreadsheet terikat (jika script dibuat dari Sheets)
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('log') || ss.insertSheet('log');
      if (sheet.getLastRow() === 0) sheet.appendRow(['Time', 'Type', 'File']);
      sheet.appendRow([new Date().toLocaleString('id-ID'), type, fileName]);
    } catch (ignored) {}

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, fileName })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', folder: FOLDER_NAME })
  ).setMimeType(ContentService.MimeType.JSON);
}
