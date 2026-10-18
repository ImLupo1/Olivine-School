# Olivine School Dz website

Arabic-first, responsive website for Olivine School Dz, with French and English translations, five color themes, local settings, SQLite-backed student/admin accounts, public courses and school updates, and an admin publishing dashboard. The inquiry form still prepares a WhatsApp or email message for the visitor to review and send.

## Prerequisites

- A current desktop or mobile browser.
- Node.js 24.15 or later. This project uses the built-in `node:sqlite` module, which is a release candidate in the Node 24 line. See the [Node.js SQLite documentation](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html).

## Run locally

From this folder:

```powershell
node serve.cjs
```

On Windows, you can also run `start-site.ps1` from PowerShell; it starts the server in that terminal window.

Open <http://localhost:4173>. Stop the server with `Ctrl+C`.

For a phone preview on the same private network, set `HOST=0.0.0.0` in `.env`, start the server, then open `http://<computer-LAN-address>:4173` on the phone. The current design uses responsive layouts, reduced-size hero image sources, lazy-loaded content media, and reduced-motion support.

There is no dependency installation or compile step. On first run the server creates `data/olivine.sqlite`; `.gitignore` excludes this database. It stores account names, email addresses, password hashes and sessions. Do not add real accounts on a public server until HTTPS, persistent protected database storage, backups, email verification, password recovery, account deletion and an appropriate privacy notice are configured.

The shareable project archive includes the site source, logos, and documentation. It excludes the local SQLite account database, `.env` secrets, and server logs. Extracted copies create a fresh database the first time the server runs.

## Editing

- **Logo:** Keep `olivine-logo-original.jpg` as the untouched source. The site uses `olivine-logo-display.jpg`, a padded crop. Replace the display file only with an owner-approved version.
- **Contact information:** Update `index.html`; update the WhatsApp destination in `script.js` if the school number changes.
- **Courses and descriptions:** Edit the cards, levels, FAQs and metadata in `index.html`. Keep service option values and `data-service` IDs stable for the form.
- **Translations:** Edit the Arabic/French/English text catalog and generated messages in `locales.js`. Language selection updates all page copy, metadata, and document direction, and is saved on the visitor's device.
- **Themes and settings:** Theme colors and the dialog are in `styles.css`, `premium.css`, `index.html`, and `locales.js`. Theme and contrast preferences stay in browser local storage.
- **Visual system:** `premium.css` gives the homepage and admin workspace the glossy Olivine journal style, responsive refinements and motion; it respects the device's reduced-motion preference.
- **Accounts:** Registration, login, logout and session lookup are handled by `serve.cjs`. Passwords are stored as scrypt hashes. The account area stores no student records. Email verification, password reset and account deletion are not implemented yet.
- **Student dashboard:** Signed-in students see recent published courses and updates in their account panel. Publicly published courses and posts appear on the homepage.
- **Posts journal:** Open `/posts` for the complete school journal. It combines published courses and posts, with category filters, search, media previews, detail dialogs, and the same language/theme preferences as the homepage.
- **Admin dashboard:** Open `/admin` after signing in with an admin account. From the dashboard, admins can publish or draft courses and posts, upload JPEG/PNG/WEBP images and MP4/WEBM videos (15 MB maximum), hide or delete content, and review email notifications. Admin APIs require an admin role and same-origin requests.
- **Create an admin:** Run `node create-admin.cjs` in this folder. Enter the administrator email and display name. If that email already has a student account, it will be promoted; otherwise enter a new password (minimum 12 characters). Public registration never grants admin access.
- **Recommended admin email:** First create a school-controlled mailbox used only by administrators. Register on the website using that email, then run `node create-admin.cjs` and enter the same address to promote the account. If it is a new account, the command asks for its password. Set `ADMIN_NOTIFICATION_EMAIL` in `.env` to that inbox if you want publishing notices there; SMTP sender credentials must also be configured for delivery.
- **Email notifications:** Copy `.env.example` to `.env`, set `ADMIN_NOTIFICATION_EMAIL`, and add SMTP host, port (implicit TLS on port 465), username, password, and optional sender address. The server loads `.env` at startup. Without SMTP credentials, notifications are kept in the dashboard but not emailed. Never commit `.env` or share SMTP credentials.
- **Uploads and storage:** Uploaded media and the SQLite database are stored in `data/`. Back up this directory and configure persistent storage before hosting. Restrict access to the server account and back up content files with the database.
- **Inquiry form:** The form validates locally and creates a WhatsApp or email link. It does not transmit, save or confirm an inquiry.
- **Testimonials:** Add only real reviews with permission from the reviewer and photo subject.
- **School photographs:** Instagram and Facebook could not be inspected through the available browser tools, so no images were copied from those accounts. The current hero image is from [Paulo Cristovam on Unsplash](https://unsplash.com/photos/students-in-a-classroom-appear-to-be-studying-lHodUX-jhFM) under the [Unsplash License](https://unsplash.com/license). Ask the school for approved photographs before launch.

## Public hosting

The account API needs a Node.js host and durable database storage across restarts. Static-only hosting cannot run this server. For example, GitHub Pages on GitHub Free requires a public repository and hosts the public site; it is suitable only for a brochure-only build without this account API. See [GitHub Pages plan requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

Choose a backend host only after confirming Node 24.15+, persistent storage or a managed database, HTTPS, backups and current pricing. No domain or hosting account has been configured.

## Verification notes

The site uses Node.js built-ins only. See [OWNER-HANDOFF.md](./OWNER-HANDOFF.md) for launch and privacy checks before public hosting.
