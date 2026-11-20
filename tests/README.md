# Tests for ticket registration

These tests cover the free-ticket registration: the form (`register.html` in eight languages), the backend
(`apps-script/Code.gs`) and the pages `build.py` generates. Nothing needs installing beyond Node 22, Python 3
and Chrome.

```bash
npm test
```

| Command | What it runs | Time |
| --- | --- | --- |
| `npm test` | Everything below | about 10 seconds |
| `npm run test:fast` | Backend, validation and QR code only (no browser, no build) | under a second |
| `npm run test:mutation` | Breaks the code 43 ways and checks the tests notice each one | about 5 minutes |

The same `npm test` runs on GitHub for every pull request and every push to `main` (`.github/workflows/test.yml`).

## What is covered

| File | Cases | What it protects |
| --- | --- | --- |
| `validate.test.js` | 45 | The rules for name, email, mobile number and attendance type. One function, used by both the form and the backend. |
| `backend.test.js` | 101 | What the backend does with a submission: the Sheet row, the ticket email, duplicates, the resend limit, the daily sending limit, unsubscribe, the daily count email, and safety against spreadsheet formulas and HTML in names. |
| `qr.test.js` | 30 | The ticket QR code reads back as the ticket number (checked by an independent reader and against the segno library), and the PNG in the email is a valid image of it. |
| `build.test.js` | 262 | Every language has a complete register page; consent wording on the page is word for word what the backend records; the old "no tickets needed" copy is gone everywhere; the privacy notice keeps its promises; the form asks for nothing beyond the agreed fields. |
| `browser.test.js` | 89 | The real page in headless Chrome talking to the real backend code: errors, the ticket screen, coming back to a saved ticket, campaign tags, the door QR sign, languages, 320px phones. |

The backend runs for real in these tests. Only Google's own services (Sheet, Gmail, timers) are replaced, by
`helpers/gas-mock.js`. What they cannot cover is Google itself: the deployed script's permissions, and how the
ticket email looks in real inboxes. Check those by hand after each deployment (`sendSampleTicket`, then one real
registration).

**The tests never touch the real Sheet.** The test server rewrites the form's endpoint on every page it serves,
whatever `REGISTER_ENDPOINT` is set to, and blocks every request to an outside host.

## Changing the form: test first

1. Write the test for the new behaviour, in the file from the table that fits.
2. Run `npm test` and watch that test fail, for the reason you expect. A new test that passes straight away is
   not testing the change.
3. Change the code (`apps-script/Code.gs`, `register.tpl.html`, `i18n/*.json`, `build.py`), run `python build.py`,
   and run `npm test` until everything passes.
4. For a behaviour that matters (consent, privacy, who sees a ticket), add a line to `MUTATIONS` in `mutation.js`
   that breaks it, and run `npm run test:mutation <part of its name>` to see it caught.

Things that must change together, and which test tells you if they did not:

- **Consent wording.** `reg.consent` in `i18n/en.json` and `CONSENT_TEXT` in `Code.gs` (under a new
  `CONSENT_VERSION`), plus the seven translations and the privacy notice. `build.test.js` fails if the page and
  the backend disagree.
- **Validation rules or the QR code.** Edit the marked block in `Code.gs`, rebuild, then paste `Code.gs` into
  Apps Script and deploy a new version. `build.test.js` fails if the pages carry an older copy.
- **A new field.** `build.test.js` lists the agreed fields and fails on any other; update that list, the privacy
  notice and the Sheet columns together.
- **Generated pages.** `build.test.js` fails if the committed pages are older than their sources. It runs
  `build.py` to find out, so after that failure the pages are fresh: review and commit them.

## Watching the browser tests

```bash
node tests/helpers/server.js
```

Open the printed address in Chrome. The scenarios run in a frame; results appear in the console. Add
`?only=success` (any scenario name from `browser/harness.html`) to run one.
