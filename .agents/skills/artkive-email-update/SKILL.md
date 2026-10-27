---
name: artkive-email-update
description: Draft or send Matvi Mykula newsletter announcements for newly published artwork or songs on matvi.dev. Use for ArtKive mailing-list updates; do not use for unrelated Gmail messages.
---

# ArtKive email updates

Create concise, personal announcements that point readers to a newly published work or song on `https://www.matvi.dev`.

Before composing an announcement, read [newsletter settings](references/newsletter-settings.md). Append the canonical HTML or plain-text footer from `assets/` without paraphrasing it. Replace documented template variables at draft time.

## Subscriber list

- Read the private CSV configured in the newsletter settings; never copy it into the repository or an email body.
- Treat `candidate` as a review state, not permission to send.
- Include only rows whose `status` is `active` and whose `consent_basis` is non-empty.
- Exclude `unsubscribed`, `bounced`, and every unknown status.
- Deduplicate addresses case-insensitively before reporting the recipient count.
- When someone opts out, set their status to `unsubscribed`; retain the record so they are not accidentally re-added by a later Gmail scan.

## Sending boundary

- Draft by default.
- Send only when the user's current request explicitly says to send. A prior request to draft or configure this workflow is not authorization to send.
- Before sending, report the subject, destination URL, and active-recipient count.
- Put the authenticated sender in `To` and subscribers in `Bcc`; never expose subscriber addresses to one another.
- Do not send if the subscriber source is unavailable or no consented active recipients remain.

## Footer rules

- Use `assets/newsletter-footer.html` for HTML mail and `assets/newsletter-footer.txt` for plain-text mail.
- Replace `{{CURRENT_YEAR}}` with the current four-digit year.
- Keep the unsubscribe instruction clear and visually readable.
- These messages are noncommercial creative updates. Do not add sales language, prices, commission solicitations, paid-event promotion, or advertising.
- If the user later asks to promote something commercial, pause and revise the footer and compliance settings before drafting or sending.
