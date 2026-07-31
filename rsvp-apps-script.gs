/**
 * RSVP endpoint for the engagement invitation.
 *
 * This is NOT part of the website - it runs on Google's servers and writes
 * every reply into the Google Sheet it is attached to. Setup: RSVP-SETUP.md
 */

var SHEET_NAME = 'RSVP';

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

/** Opening the /exec URL in a browser should answer, so you can test the deploy. */
function doGet() {
  return json_({ ok: true, service: 'rsvp' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['التاريخ', 'الاسم', 'الحضور', 'عدد الأشخاص', 'الرسالة', 'الدعوة']);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(5, 320);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
