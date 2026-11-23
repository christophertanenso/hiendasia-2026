# Ticket registration backend

`Code.gs` is a Google Apps Script that lives inside the registration Google Sheet. It receives the form on
`register.html`, adds a row, emails the ticket, and sends the daily count. There is no other server.

## Set up (once, about ten minutes)

Do this signed in to the Google account that should own the data and send the tickets.

1. Create a new Google Sheet (https://sheets.new) and name it, for example, "HiEnd Asia 2026 registrations".
2. In the Sheet: **Extensions → Apps Script**. Delete the sample code, paste in all of `Code.gs`, and save.
3. In the toolbar pick the function **setup** and press **Run**. Google asks for permission to edit the Sheet,
   send email as you and run timers: allow it. This creates the `Registrations` and `Recipients` tabs and two timers.
4. **Deploy → New deployment → Web app**. Set *Execute as* **Me** and *Who has access* **Anyone**. Press **Deploy**
   and copy the **Web app URL** (it ends in `/exec`).
5. In this repo, paste that URL into `REGISTER_ENDPOINT` near the top of `build.py`, then rebuild and publish:

   ```bash
   python build.py
   ```

   Commit the generated pages and push. Until this is done the form answers "Registration is not open yet."
6. Check it: run **sendSampleTicket** in the Apps Script editor (a sample ticket arrives in your own inbox), then
   register once on the live page and confirm the row appears.

## Day to day

- **Who gets the daily email.** The `Recipients` tab, one address per row from row 2 down. It goes out at 9am
  Singapore time with yesterday's sign-ups and the total. No visitor details are in it.
- **The list.** The `Registrations` tab. Sort and filter freely; do not rename the tab or the header row.
  `Unsubscribed at` is filled when someone uses the unsubscribe link: leave those people out of any send.
  Honour WhatsApp "STOP" replies and emailed requests by typing a date in the same column.
- **Sending limit.** Google allows about 1,500 emails a day from a Workspace account (100 from free Gmail). When it
  is reached, people still register and still see their ticket on screen; their email goes out when the limit
  resets, and the daily email says how many are waiting.
- **Same email twice.** The same ticket is sent again (at most five times). No second row is added.

## At the door (check-in)

The QR code on every ticket (in the email and on the ticket screen) opens `in.html?t=HEA26-…` on the site. Any phone
camera can scan it; there is no app.

- **On a visitor's phone** the page just shows the ticket number. Nothing is recorded.
- **On a staff phone** the page asks once for the door PIN and keeps it on that phone. From then on, every scan checks the
  ticket in: a green **Admitted** screen with the name and visit number, amber **Already scanned** for a second scan
  within two minutes (not counted again), red **Not found** for a ticket that is not registered.
- **The record.** On the `Registrations` tab: `Check-ins` (how many visits), `First check-in`, `Last check-in`. The
  `Check-in log` tab has one row per visit.

**Setting the PIN.** In the Apps Script editor: **Project Settings → Script properties → Add script property**, name
`DOOR_PIN`, value a number of 6 digits or more. Give it to door staff only. Check-in stays off until it is set. To change it,
edit the property; staff phones then ask again. After 10 wrong PINs the door accepts none for 15 minutes.
The PIN never goes in `Code.gs`: this repo is public.

**After updating to this version**, run **setup** once more: it adds the three columns' headings and the `Check-in log` tab.
Existing rows are kept.

**Staff phone tips.** Scan with the normal camera app, tap the link. "Turn off door mode on this phone" at the bottom
removes the PIN from that phone.

## Changing things

- Change `Code.gs` in this repo first, test first (`npm test`, see `tests/README.md`), then paste the tested file into
  the Apps Script editor. Do not edit only in the editor: the web page shares its validation rules and QR code.
- Settings are in `CONFIG` at the top of `Code.gs`: sender name, reply-to address, report hour.
- After editing the code in the Apps Script editor: **Deploy → Manage deployments → Edit → Version: New version →
  Deploy**. The URL stays the same. Run **setup** again if you changed the report hour.
- If the consent wording on the form changes, add the new wording to `CONSENT_TEXT` under a new version and set
  `CONSENT_VERSION` to it, so each row records what that person agreed to.
- The QR code block between `// <qr>` and `// </qr>` is shared with the web page (`build.py` copies it in). Keep
  the two in step by editing it here and rebuilding.
