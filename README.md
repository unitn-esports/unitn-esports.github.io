# unitn-esports.github.io
Github pages repository per il sito dell'associazione

## Updating the Calendar and Deployment

1. Get your Google Calendar ID:
	- In Google Calendar go to Settings → select the calendar → "Integrate calendar" → copy the "Calendar ID" (looks like `abcd1234@group.calendar.google.com`) or use the public iCal address.
2. Embed the calendar:
	- Open `index.html` and find the iframe in the Calendar section.
	- Replace `your_calendar_id` in the iframe `src` with your calendar ID. Example:
	  `https://calendar.google.com/calendar/embed?src=abcd1234%40group.calendar.google.com&ctz=Europe%2FRome`
3. Subscribe / Download links:
	- The site automatically builds the Google Calendar and .ics links from the iframe `src`. If you replace the `src` the buttons will point to the correct calendar.
4. Make the calendar public (optional):
	- If you want anyone to see events on the embedded calendar, make it public in Google Calendar settings. For private calendars consider using authenticated APIs (not implemented here).
5. Update contact and social links:
	- Replace `your.email@university.edu` in `index.html` and the placeholder social URLs in the Social section with your real addresses.
6. Deploy to GitHub Pages:
	- Commit and push your changes to the repository branch (usually `main` or `master`).
	- In the GitHub repo settings → Pages, select the branch and root folder as the publishing source.
	- Wait a minute and visit `https://<your-username>.github.io/<repo-name>` to see the site live.

If you'd like, I can also:
- Wire the contact form to Netlify Forms or Formspree
- Add multiple calendars in the embed
- Replace placeholders with your actual links

## Editing translations (i18n)

Translations are stored in `i18n.json` at the repository root. To add or modify strings:

- Open `i18n.json` and edit the `en` and `it` objects. Keys map to the `data-i18n` attributes in `index.html`.
- To add a new translatable element, add a `data-i18n="path.to.key"` attribute to the HTML element, then add the corresponding key/value under both locales in `i18n.json`.
- For input placeholders use `data-i18n-placeholder` with the matching key found under the `ph` object (e.g. `contact.ph.name`).

Note: The site loads `i18n.json` at runtime (works when deployed to GitHub Pages or served via a web server). If you open `index.html` via `file://` in the browser, some browsers may block fetching `i18n.json`. For local testing, serve the folder with a simple static server, for example using Python:

```powershell
python -m http.server 8000
# then open http://localhost:8000
```


