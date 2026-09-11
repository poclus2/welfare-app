const fs = require("fs");
const path = "apps/storefront/app/checkout/page.tsx";
let content = fs.readFileSync(path, "utf-8");

// 1. Rename cash to manuel
content = content.replace(/useState<"pawapay" \| "cash">/g, 'useState<"pawapay" | "manuel">');

// 2. Remove codFee and add paymentFee
content = content.replace(/const total = totalAmount \+ livraisonFee \+ codFee;/g, `const paymentFee = paymentMode === "pawapay" ? Math.round((totalAmount + livraisonFee) * 0.03) : 0;
  const total = Number(totalAmount || 0) + Number(livraisonFee || 0) + Number(paymentFee || 0);`);
content = content.replace(/const codFee = \(paymentMode === "cash" && settingsData\?.cod_fee\) \? settingsData\.cod_fee : 0;/g, '');

// 3. Fix livraisonFee logic
content = content.replace(/livraisonFee = currentShippingOption\.amount;/g, 'livraisonFee = Number(currentShippingOption.amount || 0);');
content = content.replace(/livraisonFee = store \? store\.price : 0;/g, 'livraisonFee = store ? Number(store.price || 0) : 0;');
content = content.replace(/livraisonFee = selectedCity\?\.fixed_price \|\| LIVRAISON_FEE;/g, 'livraisonFee = selectedCity?.fixed_price ? Number(selectedCity.fixed_price) : LIVRAISON_FEE;');
content = content.replace(/if \(hood\) livraisonFee = hood\.price;/g, 'if (hood) livraisonFee = Number(hood.price);');

// 4. Update UI labels
content = content.replace(/>Paiement en ligne<\/p>/g, '>Paiement automatisé (+3%)</p>');
content = content.replace(/>Mobile Money \(Wave, Orange, MTN\.\.\.\)<\/p>/g, '>Mobile Money direct (Wave, Orange, MTN...)</p>');
content = content.replace(/Paiement Cash<\/p>/g, 'Paiement manuel</p>');
content = content.replace(/setPaymentMode\("cash"\)/g, 'setPaymentMode("manuel")');
content = content.replace(/paymentMode === "cash"/g, 'paymentMode === "manuel"');

// Replace manual payment subtitle
content = content.replace(/\{delivery\.mode === "retrait" \? "Au retrait en magasin" : "À la livraison"\}/g, 'Transfert via code USSD (sans frais)');

// Add AnimatePresence box for manual instructions
// We find: {paymentMode === "manuel" && <Check className="w-3 h-3 text-white" />} </div> </button>
const manualCheckStr = `{paymentMode === "manuel" && <Check className="w-3 h-3 text-white" />}\n                      </div>\n                    </button>`;
const manualBox = `\n                    <AnimatePresence>
                      {paymentMode === "manuel" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden px-1"
                        >
                          <div className="pt-1 pb-3 text-[12px] text-[#2A2424]/60 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 mt-2">
                            <p className="mb-2 text-[#2A2424]"><strong>1.</strong> Effectuez le transfert du montant total de votre commande sur le compte Mobile Money suivant via le code USSD de votre opérateur.</p>
                            <p className="mb-2 text-[#2A2424]"><strong>2.</strong> Validez votre commande ci-dessous.</p>
                            <p className="text-[#2A2424]"><strong>3.</strong> Votre commande sera traitée dès réception de votre dépôt (Validation manuelle).</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>`;
content = content.replace(manualCheckStr, manualCheckStr + manualBox);

// 6. Add "Frais de transaction (3%)" in the breakdown
const totalRowStr = `<div className="flex justify-between">
                <span className="text-sm font-bold text-[#2A2424]">Total</span>`;
const breakdownPaymentFee = `{paymentFee > 0 && (
                  <div className="flex justify-between text-sm text-[#2A2424]/60 mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Frais de transaction (3%)
                    </span>
                    <span>+{formatPrice(paymentFee)} FCFA</span>
                  </div>
                )}
                <div className="w-full h-px bg-[#F4EAEB] mb-2.5" />
                `;
content = content.replace(totalRowStr, breakdownPaymentFee + totalRowStr);
// And remove the original <div className="w-full h-px bg-[#F4EAEB]" /> that's right above <div className="flex justify-between">
content = content.replace(/<div className="w-full h-px bg-\[#F4EAEB\]" \/>\s*\{paymentFee > 0 && \(/g, '{paymentFee > 0 && (');

fs.writeFileSync(path, content);
console.log("Done successfully!");
