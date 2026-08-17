// Stub mailer. No SMTP credentials are configured yet.
//
// TODO: once real SMTP/email-service credentials are available, replace the body of
// sendQuoteEmail() with a real nodemailer transport (or another provider's SDK). The
// call signature below is the contract the rest of the app relies on — keep it stable
// so server/routes/builder.js does not need to change when real sending is wired up.

async function sendQuoteEmail({ to, name, pdfPath, publicId }) {
  if (!to) {
    console.log(`[mailer] No email address on file for quote ${publicId} — skipping send.`);
    return { sent: false, reason: 'no-recipient' };
  }
  console.log(`[mailer] (stub) Would email quote PDF to ${to} (name: ${name || 'n/a'}, file: ${pdfPath})`);
  return { sent: false, reason: 'not-configured' };
}

module.exports = { sendQuoteEmail };
