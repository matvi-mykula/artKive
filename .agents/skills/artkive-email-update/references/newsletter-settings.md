# Newsletter settings

## Identity

- Sender name: Matvi Mykula
- Site name: Matvi Mykula
- Canonical site URL: https://www.matvi.dev
- Reply handling: use the authenticated Gmail address so replies reach Matvi directly

## Message classification

- Purpose: noncommercial creative updates about newly published artwork and music
- Selling: none
- Advertising or paid promotion: none
- Postal address in footer: not used for this noncommercial workflow
- Unsubscribe method: the recipient replies with `unsubscribe`
- Opt-out deadline: remove the recipient from future broadcasts within 10 business days

If the purpose changes to sales, commissions, paid events, sponsorships, or another commercial promotion, reassess the footer and sending requirements before drafting or sending.

## Canonical templates

- HTML: `../assets/newsletter-footer.html`
- Plain text: `../assets/newsletter-footer.txt`

Edit the templates when changing subscriber-facing wording. Keep operational settings in this file so the wording and workflow remain easy to audit.

## Subscriber data

- Private CSV: `C:\Users\mattp\.artkive\subscribers.csv`
- Repository policy: never copy subscriber data into this repository or commit it to Git
- Address comparison: case-insensitive
- Sendable status: `active`
- Required consent field: `consent_basis`
- Non-sendable statuses: `candidate`, `unsubscribed`, `bounced`

CSV columns:

- `email`: recipient address
- `name`: human-readable name when known
- `status`: lifecycle state
- `consent_basis`: how or when the person agreed to receive updates
- `source`: where the record originated
- `last_relevant_contact_at`: date of the Gmail interaction that suggested candidacy
- `notes`: brief review context; never treat this as proof of consent
