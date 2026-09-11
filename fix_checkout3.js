const fs = require("fs");
const path = "apps/storefront/app/checkout/page.tsx";
let content = fs.readFileSync(path, "utf-8");

// 1. Add manualProvider state
if (!content.includes("const [manualProvider")) {
  content = content.replace(/const \[mobileNetwork, setMobileNetwork\] = useState\("SEN-WAVE"\);/, 
    `const [mobileNetwork, setMobileNetwork] = useState("SEN-WAVE");\n  const [manualProvider, setManualProvider] = useState<"orange" | "mtn">("orange");`);
}

// 2. Fix total calculations
const oldCalc = `const paymentFee = paymentMode === "pawapay" ? Math.round((totalAmount + livraisonFee) * 0.03) : 0;
  const total = Number(totalAmount || 0) + Number(livraisonFee || 0) + Number(paymentFee || 0);`;

const newCalc = `const activeLivraisonFee = step === 1 ? 0 : livraisonFee;
  const paymentFee = (paymentMode === "pawapay" && step === 2) ? Math.round((totalAmount + activeLivraisonFee) * 0.03) : 0;
  const total = Number(totalAmount || 0) + Number(activeLivraisonFee || 0) + Number(paymentFee || 0);`;
content = content.replace(oldCalc, newCalc);

// 3. Breakdown replacement
const breakdownSearchRegex = /<span className=\{\s*delivery\.mode === "retrait"\s*\?\s*"text-emerald-600 font-semibold"\s*:\s*""\s*\}>\s*\{\s*delivery\.mode === "retrait"\s*\?\s*"Gratuit"\s*:\s*`\$\{livraisonFee > 0 \? `\+\$\{formatPrice\(livraisonFee\)\} FCFA` : "Gratuit"\}`\s*\}\s*<\/span>\s*<\/div>\s*<div className="w-full h-px bg-\[#F4EAEB\]" \/>/g;

const breakdownReplace = `<span className={delivery.mode === "retrait" && step === 2 ? "text-emerald-600 font-semibold" : ""}>
                    {step === 1 ? "À calculer" : (delivery.mode === "retrait" ? "Gratuit" : \`\${livraisonFee > 0 ? \`+\${formatPrice(livraisonFee)} FCFA\` : "Gratuit"}\`)}
                  </span>
                </div>
                {paymentFee > 0 && step === 2 && (
                  <div className="flex justify-between text-sm text-[#2A2424]/60 mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Frais automatisé (3%)
                    </span>
                    <span>+{formatPrice(paymentFee)} FCFA</span>
                  </div>
                )}
                <div className="w-full h-px bg-[#F4EAEB]" />`;

if (content.match(breakdownSearchRegex)) {
  content = content.replace(breakdownSearchRegex, breakdownReplace);
} else {
  console.log("BREAKDOWN NOT MATCHED. Let's try alternative.");
}

// 4. Manual Payment UI
const manualPaymentRegex = /<button[\s\S]*?onClick=\{\(\) => setPaymentMode\("manuel"\)\}[\s\S]*?<\/button>/;

const manualPaymentReplace = `<button
                        onClick={() => setPaymentMode("manuel")}
                        className={\`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all \${
                          paymentMode === "manuel" ? "border-[#2A2424] bg-white" : "border-transparent hover:border-[#EDE0E0] bg-white/60"
                        }\`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Money className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#2A2424]">Paiement manuel (USSD)</p>
                          <p className="text-xs text-[#2A2424]/50">
                            Orange Money / MTN Mobile Money
                          </p>
                        </div>
                        <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all \${paymentMode === "manuel" ? "border-[#2A2424] bg-[#2A2424]" : "border-[#EDE0E0]"}\`}>
                          {paymentMode === "manuel" && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {paymentMode === "manuel" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden px-1"
                          >
                            <div className="pt-2 pb-4 text-xs bg-emerald-50/50 px-4 rounded-xl border border-emerald-100 mt-2 space-y-4">
                              <p className="text-[#2A2424] font-semibold text-sm">Instructions USSD :</p>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setManualProvider("orange")}
                                  className={\`flex-1 py-2 rounded-lg font-bold transition-all border-2 \${manualProvider === "orange" ? "bg-orange-500 border-orange-500 text-white shadow-md" : "border-orange-200 text-orange-600 bg-white"}\`}
                                >
                                  Orange Money
                                </button>
                                <button
                                  onClick={() => setManualProvider("mtn")}
                                  className={\`flex-1 py-2 rounded-lg font-bold transition-all border-2 \${manualProvider === "mtn" ? "bg-yellow-400 border-yellow-400 text-black shadow-md" : "border-yellow-200 text-yellow-700 bg-white"}\`}
                                >
                                  MTN MoMo
                                </button>
                              </div>

                              <div className="space-y-2 text-[#2A2424]/80 leading-relaxed bg-white p-3 rounded-lg border border-emerald-100/50">
                                <p><strong>1.</strong> Composez le <strong className="text-[#2A2424] text-[13px]">{manualProvider === "orange" ? "#150#" : "*126#"}</strong> via le bouton ci-dessous pour transférer le montant de <strong className="text-[#2A2424]">{formatPrice(total)} FCFA</strong>.</p>
                                <p><strong>2.</strong> Une fois le transfert effectué, cliquez sur <strong>"Confirmer ma commande"</strong>.</p>
                                <p><strong>3.</strong> Votre commande sera traitée dès vérification manuelle du dépôt.</p>
                              </div>

                              <a 
                                href={\`tel:\${manualProvider === "orange" ? "%23150%23" : "*126%23"}\`} 
                                className={\`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors shadow-sm \${manualProvider === "orange" ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-yellow-400 hover:bg-yellow-500 text-black"}\`}
                              >
                                Lancer le paiement (USSD) <Phone className="w-4 h-4" />
                              </a>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>`;

content = content.replace(manualPaymentRegex, manualPaymentReplace);

fs.writeFileSync(path, content);
console.log("Done applying fixes!");
