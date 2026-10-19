# Olivine School Dz — owner handoff

## Included

The site has Arabic, French and English content, a language switch that keeps the page anchored RTL, English/French/Turkish/Spanish/German programs, two color themes (Olivine green and luxury black), and a higher-contrast preference. It has a shared glossy visual system, responsive layouts, reduced-motion support, student accounts and a role-protected admin dashboard for publishing courses and school posts with images or videos. Published content appears in the homepage preview and the full journal at `/posts`, as well as in the student account panel.

The account database stores a display name, email, role, scrypt password hash, and session records. It does not store grades, health information, student records or enrollment inquiries. The inquiry form still prepares an email or WhatsApp message for the visitor to review and send; completing the form does not submit or confirm registration. Published content and uploaded media are stored in SQLite and `data/media/`.

## Before public launch

1. Verify the phone, email, address/map pin, social accounts and WhatsApp destination.
2. Confirm current courses, tutoring subjects/levels, schedules and prices. Unverified details are intentionally omitted.
3. Have a French and English reviewer approve the localized copy.
4. Ask the school for approved school photographs. The listed Instagram and Facebook profiles could not be inspected from the available browser tools, so no images were copied from them. The hero currently uses an Unsplash photo and needs an internet connection.
5. Create a school-controlled mailbox for administrators, register on the site with it, then run `node create-admin.cjs` and promote that exact email. For a new address, the command creates the admin and requests a unique strong password. Public signup cannot grant admin rights.
6. Copy `.env.example` to `.env`, set the admin notification address and SMTP credentials to enable real email delivery. Without SMTP credentials, publishing alerts are retained in the admin dashboard but no email is sent.
7. Add account email verification, password recovery, account deletion, HTTPS, durable database and media storage, backups, monitoring and a suitable privacy notice before accepting real public accounts. These account recovery and privacy features are not implemented yet.
8. Choose a Node host and persistent database/media strategy. Set the final canonical URL and Open Graph image URL. The site has not been deployed.
9. Add testimonials only when the school supplies genuine reviews and publication permission.

## Files

- `index.html` — site content, contact links, and the account dialog.
- `styles.css` — responsive layout, RTL/LTR handling, themes, and reduced-motion support.
- `premium.css` — shared visual polish, animation system and responsive refinements for the homepage and admin workspace.
- `locales.js` — Arabic/French/English copy, language, theme, contrast settings.
- `posts.html`, `posts.css`, `posts.js` — full public journal page, animated visual design, filters, search and media details.
- `script.js` — navigation, inquiry validation, localization-aware messages, and account UI.
- `serve.cjs` — Node.js server, account API and SQLite database initialization.
- `admin.html`, `admin.css`, `admin.js` — admin content dashboard.
- `create-admin.cjs` — local CLI to create or promote an admin account.
- `.env.example` — email notification configuration template; copy to `.env` for private credentials.
- `data/olivine.sqlite` — created at first server start; contains account data and is excluded by `.gitignore`.
- `data/media/` — admin-uploaded images and videos; excluded by `.gitignore`.
- `olivine-logo-original.jpg` — untouched supplied logo.
- `olivine-logo-display.jpg` — padded crop used in the page and favicon.

## Checks

Prior language, theme, inquiry and basic account logic had static/isolated checks. The admin dashboard, upload flow and SMTP delivery still need a full browser check after setting up the first admin and email provider. Test the language switch, themes, contrast, student registration/login, admin roles, draft/publish/hide/delete, image/video uploads and email notifications before public launch.
