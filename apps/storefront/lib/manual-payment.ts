// Merchant USSD codes for the manual Mobile Money payment, shared by the checkout and the order
// confirmation page so they can never drift apart.
export const MANUAL_PAYMENT = {
  orange: { label: "Orange Money", code: "#150*47*1089819#" },
  mtn: { label: "MTN MoMo", code: "*126*14*673464553#" },
} as const;

export type ManualProvider = keyof typeof MANUAL_PAYMENT;

/** tel: link that opens the dialer with the USSD code ("#" must be URL-encoded). */
export function ussdHref(provider: ManualProvider) {
  return `tel:${MANUAL_PAYMENT[provider].code.replace(/#/g, "%23")}`;
}
