/**
 * RSVP endpoint for the engagement invitation.
 *
 * This is NOT part of the website - it runs on Google's servers and writes
 * every reply into the Google Sheet it is attached to. Setup: RSVP-SETUP.md
 */

var SHEET_NAME = 'RSVP';

/** How many messages the invitation's wishes wall shows, newest first. */
var MAX_MESSAGES = 60;

/** Put your email between the quotes to get a notification per reply. */
var NOTIFY_EMAIL = '';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);                      // two guests replying at once must not collide
  try {
    var data = JSON.parse(e.postData.contents);
    var name = String(data.name || '').slice(0, 120).trim();
    if (!name) return json_({ ok: false, error: 'name required' });

    var coming = data.attending === 'yes';
    var guests = coming ? Math.min(Math.max(parseInt(data.guests, 10) || 1, 1), 50) : 0;
    var message = String(data.message || '').slice(0, 1000).trim();
    var invitation = String(data.invitation || '').slice(0, 60);

    getSheet_().appendRow([
      new Date(),
      name,
      coming ? 'نعم' : 'لا',
      guests,
      message,
      invitation
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL,
        'رد جديد على الدعوة: ' + name,
        name + (coming ? ' سيحضر' : ' لن يستطيع الحضور') +
        (coming ? '\nعدد الأشخاص: ' + guests : '') +
        (message ? '\nالرسالة: ' + message : '') +
        '\nالدعوة: ' + invitation);
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Plain /exec answers a health check, so you can test the deploy in a browser.
 * /exec?action=messages feeds the wishes wall on the invitation.
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'messages') return json_(messages_());
  return json_({ ok: true, service: 'rsvp' });
}

/**
 * Newest messages first, skipping empty ones and any row you have marked in the
 * إخفاء column. Cached for a minute so a rush of guests cannot burn the quota.
 */
function messages_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('messages');
  if (hit) return JSON.parse(hit);

  var sheet = getSheet_();
  var last = sheet.getLastRow();
  var out = [];

  if (last > 1) {
    var rows = sheet.getRange(2, 1, last - 1, 7).getValues();
    for (var i = rows.length - 1; i >= 0 && out.length < MAX_MESSAGES; i--) {
      var message = String(rows[i][4] || '').trim();
      var hidden = String(rows[i][6] || '').trim();
      if (!message || hidden) continue;
      out.push({ name: String(rows[i][1] || '').trim(), message: message });
    }
  }

  var payload = { ok: true, messages: out };
  cache.put('messages', JSON.stringify(payload), 60);
  return payload;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['التاريخ', 'الاسم', 'الحضور', 'عدد الأشخاص', 'الرسالة', 'الدعوة', 'إخفاء']);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(5, 320);
  }
  /* older sheets predate the moderation column - add its header once */
  if (!String(sheet.getRange(1, 7).getValue()).trim()) {
    sheet.getRange(1, 7).setValue('إخفاء');
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
