// ============================================================
// PDP READINESS ASSESSMENT TOOL — APPS SCRIPT BACKEND v2.0
// ------------------------------------------------------------
// Satu file — paste ke script.google.com (New Project), lalu
// Deploy > Web App > Execute as: Me > Who has access: Anyone.
//
// Menangani: autentikasi, sesi, profil, password, assessment,
// dan tetap kompatibel dengan Drive-sync receiver lama (type-based).
//
// Spreadsheet dibuat OTOMATIS pada pemanggilan pertama (nama:
// "peedeepee-data") dan ID-nya disimpan di Script Properties —
// jadi script ini berfungsi sebagai standalone project.
//
// Struktur sheet:
//   users       : id,email,passwordHash,salt,fullName,jobTitle,
//                 organization,industry,orgSize,role,createdAt,
//                 lastLoginAt,isActive,resetToken,resetExpiry
//   sessions    : sessionId,userId,email,createdAt,expiresAt,isActive
//   assessments : id,userId,orgName,createdAt,completedAt,status,
//                 totalScore,riskLevel,answers,result
//   audit_log   : timestamp,userId,email,action,detail
// ============================================================

const SHEETS = { USERS: 'users', SESSIONS: 'sessions', ASSESSMENTS: 'assessments', AUDIT: 'audit_log' };
const SESSION_TTL_HOURS = 24 * 7; // 7 hari
const RESET_TTL_MINUTES = 60;     // 1 jam
const DRIVE_FOLDER = 'peedeepee'; // untuk backward-compat drive sync

// ============================================================
// ROUTER + RESPONSE (CORS-friendly via ContentService JSON)
// ============================================================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    // Backward-compat: receiver lama mengirim {type,fileName,data} tanpa action
    if (!body.action && body.type) {
      return jsonResponse(handleDriveSave(body));
    }
    return jsonResponse(route(body.action, body));
  } catch (err) {
    return jsonResponse({ success: false, error: 'Server error: ' + err.message });
  }
}

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || 'ping';
  try {
    return jsonResponse(route(action, e.parameter || {}));
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function route(action, body) {
  switch (action) {
    case 'ping':            return { success: true, status: 'ok', version: '2.0' };
    case 'register':        return handleRegister(body);
    case 'login':           return handleLogin(body);
    case 'logout':          return handleLogout(body);
    case 'validateSession': return handleValidateSession(body);
    case 'getProfile':      return handleGetProfile(body);
    case 'updateProfile':   return handleUpdateProfile(body);
    case 'changePassword':  return handleChangePassword(body);
    case 'forgotPassword':  return handleForgotPassword(body);
    case 'resetPassword':   return handleResetPassword(body);
    case 'logoutAllOthers': return handleLogoutAllOthers(body);
    case 'deleteAccount':   return handleDeleteAccount(body);
    case 'saveAssessment':  return handleSaveAssessment(body);
    case 'getAssessments':  return handleGetAssessments(body);
    case 'deleteAssessment':return handleDeleteAssessment(body);
    case 'exportUserData':  return handleExportUserData(body);
    default: return { success: false, error: 'Unknown action: ' + action };
  }
}

// ============================================================
// SPREADSHEET BOOTSTRAP (standalone-safe)
// ============================================================
function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SS_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* recreate below */ }
  }
  const ss = SpreadsheetApp.create('peedeepee-data');
  props.setProperty('SS_ID', ss.getId());
  return ss;
}

function getOrCreateSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold').setBackground('#161820').setFontColor('#E8AC1A');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getUsersSheet() {
  return getOrCreateSheet(SHEETS.USERS, [
    'id','email','passwordHash','salt','fullName','jobTitle','organization',
    'industry','orgSize','role','createdAt','lastLoginAt','isActive','resetToken','resetExpiry'
  ]);
}
function getSessionsSheet() {
  return getOrCreateSheet(SHEETS.SESSIONS, ['sessionId','userId','email','createdAt','expiresAt','isActive']);
}
function getAssessmentsSheet() {
  return getOrCreateSheet(SHEETS.ASSESSMENTS, [
    'id','userId','orgName','createdAt','completedAt','status','totalScore','riskLevel','answers','result'
  ]);
}
function getAuditSheet() {
  return getOrCreateSheet(SHEETS.AUDIT, ['timestamp','userId','email','action','detail']);
}

// ============================================================
// SHEET HELPERS
// ============================================================
function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(function (row) {
    const obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function findRowByField(sheet, field, value) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIdx = headers.indexOf(field);
  if (colIdx === -1) return { row: null, rowIndex: -1 };
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]) === String(value)) {
      const obj = {};
      headers.forEach(function (h, j) { obj[h] = data[i][j]; });
      return { row: obj, rowIndex: i + 1 };
    }
  }
  return { row: null, rowIndex: -1 };
}

function updateRow(sheet, rowIndex, field, value) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIdx = headers.indexOf(field) + 1;
  if (colIdx > 0) sheet.getRange(rowIndex, colIdx).setValue(value);
}

function updateRowFields(sheet, rowIndex, updates) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Object.keys(updates).forEach(function (field) {
    const colIdx = headers.indexOf(field) + 1;
    if (colIdx > 0) sheet.getRange(rowIndex, colIdx).setValue(updates[field]);
  });
}

// ============================================================
// CRYPTO
// ============================================================
function generateSalt() { return Utilities.base64Encode(Utilities.getUuid() + Utilities.getUuid()); }
function hashPassword(password, salt) {
  const combined = password + salt + 'pdp_secret_2024';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, combined, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}
function generateSessionId() { return Utilities.base64EncodeWebSafe(Utilities.getUuid() + Utilities.getUuid()).replace(/=/g, ''); }
function generateResetToken() {
  // 6 karakter alfanumerik kapital — mudah disalin dari email
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let t = '';
  for (let i = 0; i < 6; i++) t += chars.charAt(Math.floor(Math.random() * chars.length));
  return t;
}

// ============================================================
// AUDIT
// ============================================================
function audit(userId, email, action, detail) {
  try {
    getAuditSheet().appendRow([new Date().toISOString(), userId || '', email || '', action, detail || '']);
  } catch (e) { /* never block on audit */ }
}

// ============================================================
// AUTH HANDLERS
// ============================================================
function handleRegister(body) {
  const email = (body.email || '').toLowerCase();
  if (!email || !body.password || !body.fullName || !body.organization) {
    return { success: false, error: 'Email, password, nama lengkap, dan organisasi wajib diisi' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: 'Format email tidak valid' };
  if (body.password.length < 8) return { success: false, error: 'Password minimal 8 karakter' };

  const sheet = getUsersSheet();
  if (findRowByField(sheet, 'email', email).row) return { success: false, error: 'Email sudah terdaftar' };

  const salt = generateSalt();
  const userId = Utilities.getUuid();
  const now = new Date().toISOString();

  sheet.appendRow([
    userId, email, hashPassword(body.password, salt), salt,
    body.fullName, body.jobTitle || '', body.organization, body.industry || '',
    body.orgSize || 'MEDIUM', 'USER', now, '', 'TRUE', '', ''
  ]);

  const session = createSession(userId, email);
  audit(userId, email, 'REGISTER', 'New user registered');

  return {
    success: true, message: 'Registrasi berhasil', sessionId: session.sessionId,
    user: {
      id: userId, email: email, fullName: body.fullName, jobTitle: body.jobTitle || '',
      organization: body.organization, industry: body.industry || '',
      orgSize: body.orgSize || 'MEDIUM', role: 'USER', lastLoginAt: now, createdAt: now
    }
  };
}

function handleLogin(body) {
  const email = (body.email || '').toLowerCase();
  if (!email || !body.password) return { success: false, error: 'Email dan password wajib diisi' };

  const sheet = getUsersSheet();
  const result = findRowByField(sheet, 'email', email);
  if (!result.row) return { success: false, error: 'Email atau password salah' };

  const user = result.row;
  if (String(user.isActive) !== 'TRUE') return { success: false, error: 'Akun tidak aktif. Hubungi administrator.' };

  if (hashPassword(body.password, user.salt) !== user.passwordHash) {
    audit(user.id, email, 'LOGIN_FAILED', 'Wrong password');
    return { success: false, error: 'Email atau password salah' };
  }

  updateRow(sheet, result.rowIndex, 'lastLoginAt', new Date().toISOString());
  const session = createSession(user.id, user.email);
  audit(user.id, user.email, 'LOGIN', 'Login successful');

  return {
    success: true, sessionId: session.sessionId,
    user: {
      id: user.id, email: user.email, fullName: user.fullName, jobTitle: user.jobTitle,
      organization: user.organization, industry: user.industry, orgSize: user.orgSize,
      role: user.role, lastLoginAt: user.lastLoginAt, createdAt: user.createdAt
    }
  };
}

function handleLogout(body) {
  if (!body.sessionId) return { success: true };
  const sheet = getSessionsSheet();
  const result = findRowByField(sheet, 'sessionId', body.sessionId);
  if (result.rowIndex > 0) {
    updateRow(sheet, result.rowIndex, 'isActive', 'FALSE');
    audit(result.row.userId, result.row.email, 'LOGOUT', '');
  }
  return { success: true };
}

function handleValidateSession(body) {
  if (!body.sessionId) return { success: false, error: 'No session' };
  const sessSheet = getSessionsSheet();
  const sessResult = findRowByField(sessSheet, 'sessionId', body.sessionId);
  if (!sessResult.row) return { success: false, error: 'Session tidak ditemukan' };

  const sess = sessResult.row;
  if (String(sess.isActive) !== 'TRUE') return { success: false, error: 'Session tidak aktif' };
  if (new Date() > new Date(sess.expiresAt)) {
    updateRow(sessSheet, sessResult.rowIndex, 'isActive', 'FALSE');
    return { success: false, error: 'Session expired' };
  }

  const userResult = findRowByField(getUsersSheet(), 'id', sess.userId);
  if (!userResult.row) return { success: false, error: 'User tidak ditemukan' };
  const u = userResult.row;
  if (String(u.isActive) !== 'TRUE') return { success: false, error: 'Akun tidak aktif' };

  return {
    success: true,
    user: {
      id: u.id, email: u.email, fullName: u.fullName, jobTitle: u.jobTitle,
      organization: u.organization, industry: u.industry, orgSize: u.orgSize,
      role: u.role, lastLoginAt: u.lastLoginAt, createdAt: u.createdAt
    }
  };
}

function createSession(userId, email) {
  const sessionId = generateSessionId();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_HOURS * 3600 * 1000);
  getSessionsSheet().appendRow([sessionId, userId, email, now.toISOString(), expires.toISOString(), 'TRUE']);
  return { sessionId: sessionId, expiresAt: expires.toISOString() };
}

// ============================================================
// PROFILE HANDLERS
// ============================================================
function handleGetProfile(body) {
  const auth = requireAuth(body.sessionId);
  if (!auth.success) return auth;
  return { success: true, user: auth.user };
}

function handleUpdateProfile(body) {
  const auth = requireAuth(body.sessionId);
  if (!auth.success) return auth;
  if (!body.fullName || !body.organization) return { success: false, error: 'Nama lengkap dan organisasi wajib diisi' };

  const sheet = getUsersSheet();
  const result = findRowByField(sheet, 'id', auth.userId);
  if (!result.row) return { success: false, error: 'User tidak ditemukan' };

  updateRowFields(sheet, result.rowIndex, {
    fullName: body.fullName, jobTitle: body.jobTitle || '',
    organization: body.organization, industry: body.industry || '', orgSize: body.orgSize || 'MEDIUM'
  });
  audit(auth.userId, result.row.email, 'UPDATE_PROFILE', 'Profile updated');
  return { success: true, message: 'Profil berhasil diperbarui' };
}

function handleChangePassword(body) {
  const auth = requireAuth(body.sessionId);
  if (!auth.success) return auth;
  if (!body.currentPassword || !body.newPassword) return { success: false, error: 'Password saat ini dan baru wajib diisi' };
  if (body.newPassword.length < 8) return { success: false, error: 'Password baru minimal 8 karakter' };

  const sheet = getUsersSheet();
  const result = findRowByField(sheet, 'id', auth.userId);
  if (!result.row) return { success: false, error: 'User tidak ditemukan' };

  const user = result.row;
  if (hashPassword(body.currentPassword, user.salt) !== user.passwordHash) {
    audit(auth.userId, user.email, 'CHANGE_PASSWORD_FAILED', 'Wrong current password');
    return { success: false, error: 'Password saat ini salah' };
  }
  if (body.currentPassword === body.newPassword) return { success: false, error: 'Password baru tidak boleh sama dengan lama' };

  const newSalt = generateSalt();
  updateRowFields(sheet, result.rowIndex, { passwordHash: hashPassword(body.newPassword, newSalt), salt: newSalt });
  invalidateAllSessions(auth.userId, body.sessionId);
  audit(auth.userId, user.email, 'CHANGE_PASSWORD', 'Password changed');
  return { success: true, message: 'Password berhasil diubah' };
}

function handleLogoutAllOthers(body) {
  const auth = requireAuth(body.sessionId);
  if (!auth.success) return auth;
  invalidateAllSessions(auth.userId, body.sessionId);
  audit(auth.userId, auth.email, 'LOGOUT_OTHERS', 'All other sessions invalidated');
  return { success: true, message: 'Semua sesi lain telah dikeluarkan' };
}

function handleForgotPassword(body) {
  const email = (body.email || '').toLowerCase();
  if (!email) return { success: false, error: 'Email wajib diisi' };

  const sheet = getUsersSheet();
  const result = findRowByField(sheet, 'email', email);
  // Selalu success untuk cegah email enumeration
  if (!result.row) return { success: true, message: 'Jika email terdaftar, kode reset telah dikirim' };

  const token = generateResetToken();
  updateRowFields(sheet, result.rowIndex, {
    resetToken: token, resetExpiry: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000).toISOString()
  });

  const devMode = PropertiesService.getScriptProperties().getProperty('DEV_MODE') === 'true';
  try {
    GmailApp.sendEmail(email, '[PDP Assessment] Kode Reset Password',
      'Kode reset password Anda: ' + token + '\n\nKode berlaku selama ' + RESET_TTL_MINUTES +
      ' menit.\n\nJika Anda tidak meminta reset, abaikan email ini.\n\n---\nPDP Readiness Assessment Tool\nPowered by XyberXecurity');
  } catch (e) {
    audit(result.row.id, email, 'FORGOT_PASSWORD', 'Email send failed: ' + e.message);
    if (devMode) return { success: true, devToken: token, message: 'DEV MODE: gunakan token ini' };
  }
  audit(result.row.id, email, 'FORGOT_PASSWORD', 'Reset token generated');
  const res = { success: true, message: 'Kode reset telah dikirim ke email Anda' };
  if (devMode) res.devToken = token;
  return res;
}

function handleResetPassword(body) {
  const email = (body.email || '').toLowerCase();
  if (!email || !body.token || !body.newPassword) return { success: false, error: 'Email, token, dan password baru wajib diisi' };
  if (body.newPassword.length < 8) return { success: false, error: 'Password minimal 8 karakter' };

  const sheet = getUsersSheet();
  const result = findRowByField(sheet, 'email', email);
  if (!result.row) return { success: false, error: 'Kode reset tidak valid' };

  const user = result.row;
  if (!user.resetToken || String(user.resetToken) !== String(body.token)) return { success: false, error: 'Kode reset tidak valid' };
  if (new Date() > new Date(user.resetExpiry)) return { success: false, error: 'Kode reset sudah kadaluarsa. Minta kode baru.' };

  const newSalt = generateSalt();
  updateRowFields(sheet, result.rowIndex, {
    passwordHash: hashPassword(body.newPassword, newSalt), salt: newSalt, resetToken: '', resetExpiry: ''
  });
  invalidateAllSessions(user.id, null);
  audit(user.id, email, 'RESET_PASSWORD', 'Password reset via token');
  return { success: true, message: 'Password berhasil direset. Silakan login.' };
}

function handleDeleteAccount(body) {
  const auth = requireAuth(body.sessionId);
  if (!auth.success) return auth;
  if (!body.confirmPassword) return { success: false, error: 'Konfirmasi password diperlukan' };

  const sheet = getUsersSheet();
  const result = findRowByField(sheet, 'id', auth.userId);
  if (!result.row) return { success: false, error: 'User tidak ditemukan' };
  if (hashPassword(body.confirmPassword, result.row.salt) !== result.row.passwordHash) {
    return { success: false, error: 'Password salah' };
  }

  updateRowFields(sheet, result.rowIndex, { isActive: 'FALSE' });
  invalidateAllSessions(auth.userId, null);
  audit(auth.userId, result.row.email, 'DELETE_ACCOUNT', 'Account deactivated');
  return { success: true, message: 'Akun berhasil dihapus' };
}

// ============================================================
// ASSESSMENT HANDLERS
// ============================================================
function handleSaveAssessment(body) {
  const auth = requireAuth(body.sessionId);
  if (!auth.success) return auth;
  const a = body.assessment;
  if (!a) return { success: false, error: 'Data assessment tidak ditemukan' };

  const sheet = getAssessmentsSheet();
  const existing = findRowByField(sheet, 'id', a.id);
  const r = body.result;
  const row = [
    a.id, auth.userId, a.orgName || '', a.createdAt || new Date().toISOString(),
    r ? new Date().toISOString() : '', r ? 'COMPLETED' : 'IN_PROGRESS',
    r ? Math.round(r.totalComplianceIndex) : '', r ? r.riskLevel : '',
    JSON.stringify(a.answers || {}), r ? JSON.stringify(r) : ''
  ];

  if (existing.rowIndex > 0) {
    sheet.getRange(existing.rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  return { success: true, assessmentId: a.id };
}

function handleGetAssessments(body) {
  const auth = requireAuth(body.sessionId);
  if (!auth.success) return auth;
  const mine = sheetToObjects(getAssessmentsSheet()).filter(function (a) { return a.userId === auth.userId; });
  return {
    success: true,
    assessments: mine.map(function (a) {
      return {
        id: a.id, orgName: a.orgName, createdAt: a.createdAt, completedAt: a.completedAt,
        status: a.status, totalScore: a.totalScore, riskLevel: a.riskLevel,
        answers: tryParse(a.answers, {}), result: tryParse(a.result, null)
      };
    })
  };
}

function handleDeleteAssessment(body) {
  const auth = requireAuth(body.sessionId);
  if (!auth.success) return auth;
  const sheet = getAssessmentsSheet();
  const result = findRowByField(sheet, 'id', body.assessmentId);
  if (!result.row) return { success: false, error: 'Assessment tidak ditemukan' };
  if (result.row.userId !== auth.userId) return { success: false, error: 'Tidak diizinkan' };
  sheet.deleteRow(result.rowIndex);
  audit(auth.userId, auth.email, 'DELETE_ASSESSMENT', body.assessmentId);
  return { success: true };
}

function handleExportUserData(body) {
  const auth = requireAuth(body.sessionId);
  if (!auth.success) return auth;
  const myAss = sheetToObjects(getAssessmentsSheet()).filter(function (a) { return a.userId === auth.userId; });
  audit(auth.userId, auth.email, 'EXPORT_DATA', 'User data exported');
  return {
    success: true,
    data: {
      profile: auth.user,
      assessments: myAss.map(function (a) {
        return {
          id: a.id, orgName: a.orgName, createdAt: a.createdAt, completedAt: a.completedAt,
          status: a.status, totalScore: a.totalScore, riskLevel: a.riskLevel
        };
      }),
      exportedAt: new Date().toISOString()
    }
  };
}

// ============================================================
// LEGACY DRIVE-SYNC (backward compatible dengan receiver lama)
// ============================================================
function handleDriveSave(body) {
  try {
    const map = { consent: 'consent-records', assessment: 'assessments', report: 'reports', export: 'exports' };
    const root = getDriveFolder(DRIVE_FOLDER);
    const sub = getDriveSubFolder(root, map[body.type] || 'exports');
    const content = JSON.stringify(body.data, null, 2);
    const existing = sub.getFilesByName(body.fileName);
    if (existing.hasNext()) existing.next().setContent(content);
    else sub.createFile(body.fileName, content, MimeType.PLAIN_TEXT);
    return { success: true, fileName: body.fileName };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
function getDriveFolder(name) {
  const f = DriveApp.getFoldersByName(name);
  return f.hasNext() ? f.next() : DriveApp.createFolder(name);
}
function getDriveSubFolder(root, name) {
  const s = root.getFoldersByName(name);
  return s.hasNext() ? s.next() : root.createFolder(name);
}

// ============================================================
// HELPERS
// ============================================================
function requireAuth(sessionId) {
  if (!sessionId) return { success: false, error: 'Session ID diperlukan' };
  const result = handleValidateSession({ sessionId: sessionId });
  if (!result.success) return result;
  return { success: true, userId: result.user.id, email: result.user.email, user: result.user };
}

function invalidateAllSessions(userId, exceptSessionId) {
  const sheet = getSessionsSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const userIdCol = headers.indexOf('userId');
  const sessionCol = headers.indexOf('sessionId');
  const isActiveCol = headers.indexOf('isActive') + 1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][userIdCol]) === String(userId)) {
      if (exceptSessionId && String(data[i][sessionCol]) === String(exceptSessionId)) continue;
      sheet.getRange(i + 1, isActiveCol).setValue('FALSE');
    }
  }
}

function tryParse(str, fallback) {
  try { return JSON.parse(str); } catch (e) { return fallback; }
}
