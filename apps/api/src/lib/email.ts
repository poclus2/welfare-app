// Sender for every transactional email sent through Resend (promo codes,
// ambassador approvals, loyalty notifications). Resend only accepts senders
// on a verified domain — thewelfare.store is the one set up in Resend.
export const EMAIL_FROM = process.env.EMAIL_FROM || "The Welfare <contact@thewelfare.store>"
