# RSVP setup (10 minutes, once)

The invitation is a static site on GitHub Pages, so it cannot store replies by
itself — GitHub only serves files, it never runs code for your visitors. Any key
that could write into your repository would be readable by every guest who opens
the page, so replies go to a free Google Sheet instead. You keep the data, and
nothing in the repo is secret.

**Until you finish step 5 the RSVP section stays hidden**, so no guest ever sees
a form that cannot submit.

---

## 1. Create the sheet

Go to <https://sheets.new> and name it something like `دعوة علي و دانية — الحضور`.

## 2. Open the script editor

In that sheet: **Extensions → Apps Script**. A new tab opens with an empty
`Code.gs` and a `myFunction` stub.

## 3. Paste the code

Delete everything in the editor, then paste the whole contents of
[`rsvp-apps-script.gs`](rsvp-apps-script.gs) from this repo. Save (⌘S / Ctrl+S).

Optional: to get an email for every reply, put your address in the quotes on the
`NOTIFY_EMAIL` line near the top.

## 4. Deploy it as a web app

1. **Deploy → New deployment**
2. Click the gear next to "Select type" → **Web app**
3. Description: anything, e.g. `rsvp`
4. **Execute as: Me**
5. **Who has access: Anyone** ← must be *Anyone*, not "Anyone with Google account"
6. **Deploy**, then **Authorize access** and approve the permissions
   (Google shows a "Google hasn't verified this app" warning because the script
   is your own — click *Advanced → Go to … (unsafe)* to continue)
7. Copy the **Web app URL**. It ends in `/exec`

Paste that URL into your browser — you should see `{"ok":true,"service":"rsvp"}`.

## 5. Put the URL into both pages

In `index.html` **and** `women.html`, find this line:

```js
var RSVP_ENDPOINT = '';
```

and paste your URL between the quotes:

```js
var RSVP_ENDPOINT = 'https://script.google.com/macros/s/AKfy…/exec';
```

## 6. Commit and push

Upload both files to GitHub as usual. The "تأكيد الحضور" section now appears on
the invitation, and replies land in the `RSVP` tab of your sheet:

| التاريخ | الاسم | الحضور | عدد الأشخاص | الرسالة | الدعوة |
|---|---|---|---|---|---|

---

## Gotcha when you edit the script later

Editing the code is **not** enough — the deployed version stays frozen. After any
change: **Deploy → Manage deployments → ✏️ (edit) → Version: New version → Deploy**.
The URL stays the same.

## Notes

- The sheet is private to your Google account. Guests can only add rows through
  the script; they cannot read anything.
- A guest who already replied sees "شكراً لكم، تم تسجيل ردكم" instead of the form
  on their next visit, with a "تعديل الرد" link if they want to reply again. This
  is stored in their own browser, so replying from a different phone adds a new
  row — expect the odd duplicate and sort by name in the sheet.
- Free Google quotas are far above what an invitation needs (thousands of
  submissions per day; the optional email notification is capped at 100/day).

## If you would rather not use Google

Any form endpoint that accepts a cross-origin POST works — e.g.
[Formspree](https://formspree.io) or [Basin](https://usebasin.com). Create a
form there, put its endpoint URL in `RSVP_ENDPOINT`, and replies arrive by email
and in their dashboard instead of a sheet. No other change is needed, though
Formspree's free tier caps monthly submissions.
