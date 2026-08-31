const fs = require('fs');
let c = fs.readFileSync('apps/storefront/app/checkout/page.tsx', 'utf8');

c = c.replace(
  /{formatPrice\(LIVRAISON_FEE\)} FCFA/g,
  '{livraisonFee > 0 ? `+${formatPrice(livraisonFee)} FCFA` : "Gratuit"}'
);

const oldCitySelect = `<select
                              value={delivery.city}
                              onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#EDE0E0] focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] text-sm text-[#2A2424] bg-white outline-none transition-all"
                            >
                              {CAMEROON_CITIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>`;

const newCitySelect = `<select
                              value={delivery.city}
                              onChange={(e) => { setDelivery({ ...delivery, city: e.target.value }); setDeliveryNeighborhood(""); }}
                              className="w-full px-4 py-3 rounded-xl border border-[#EDE0E0] focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] text-sm text-[#2A2424] bg-white outline-none transition-all"
                            >
                              {citiesData.length > 0 ? citiesData.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                              )) : CAMEROON_CITIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>`;
c = c.replace(oldCitySelect, newCitySelect);

// insert neighborhood right after the country div
c = c.replace('</select>\r\n                          </div>\r\n                        </div>\r\n                        <div>',
`</select>
                          </div>
                        </div>

                        {/* Quartier (Dynamic) */}
                        {citiesData.find(c => c.name === delivery.city)?.has_neighborhoods && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-3"
                          >
                            <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Quartier</label>
                            <select
                              value={deliveryNeighborhood}
                              onChange={(e) => setDeliveryNeighborhood(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-[#EDE0E0] focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] text-sm text-[#2A2424] bg-white outline-none transition-all"
                            >
                              <option value="">Sélectionnez un quartier</option>
                              {citiesData.find(c => c.name === delivery.city)?.neighborhoods?.map((h: any) => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                              ))}
                            </select>
                            {deliveryErrors.neighborhood && <p className="text-[10px] text-red-500 mt-1">{deliveryErrors.neighborhood}</p>}
                          </motion.div>
                        )}
                        
                        {/* ETA display */}
                        {eta && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            Délai estimé : {eta}
                          </div>
                        )}
                        <div>`);
// also support \n instead of \r\n
c = c.replace('</select>\n                          </div>\n                        </div>\n                        <div>',
`</select>
                          </div>
                        </div>

                        {/* Quartier (Dynamic) */}
                        {citiesData.find(c => c.name === delivery.city)?.has_neighborhoods && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-3"
                          >
                            <label className="block text-xs font-semibold text-[#2A2424]/60 mb-1.5">Quartier</label>
                            <select
                              value={deliveryNeighborhood}
                              onChange={(e) => setDeliveryNeighborhood(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-[#EDE0E0] focus:border-[#C08A8E] focus:ring-2 focus:ring-[#F4EAEB] text-sm text-[#2A2424] bg-white outline-none transition-all"
                            >
                              <option value="">Sélectionnez un quartier</option>
                              {citiesData.find(c => c.name === delivery.city)?.neighborhoods?.map((h: any) => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                              ))}
                            </select>
                            {deliveryErrors.neighborhood && <p className="text-[10px] text-red-500 mt-1">{deliveryErrors.neighborhood}</p>}
                          </motion.div>
                        )}
                        
                        {/* ETA display */}
                        {eta && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            Délai estimé : {eta}
                          </div>
                        )}
                        <div>`);

const oldStores = `{STORES.map((store) => (
                          <button
                            key={store.id}
                            onClick={() => setDelivery({ ...delivery, store: store.id })}
                            className={\`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 \${
                              delivery.store === store.id
                                ? "border-[#2A2424] bg-[#2A2424]/5"
                                : "border-[#EDE0E0] hover:border-[#C08A8E]/50"
                            }\`}
                          >
                            <div className={\`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 \${delivery.store === store.id ? "bg-[#2A2424]" : "bg-[#F4EAEB]"}\`}>
                              {store.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#2A2424]">{store.name}</p>
                              <p className="text-xs text-[#2A2424]/50 mt-0.5">{store.address}</p>
                              <p className="text-[10px] text-[#C08A8E] font-semibold mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {store.hours}
                              </p>
                              <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                                Retrait gratuit
                              </p>
                            </div>
                            <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all \${delivery.store === store.id ? "border-[#2A2424] bg-[#2A2424]" : "border-[#EDE0E0]"}\`}>
                              {delivery.store === store.id && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        ))}`;

const newStores = `{pickupPointsData.map((store: any) => (
                          <button
                            key={store.id}
                            onClick={() => setDelivery({ ...delivery, store: store.id })}
                            className={\`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 \${
                              delivery.store === store.id
                                ? "border-[#2A2424] bg-[#2A2424]/5"
                                : "border-[#EDE0E0] hover:border-[#C08A8E]/50"
                            }\`}
                          >
                            <div className={\`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 \${delivery.store === store.id ? "bg-[#2A2424]" : "bg-[#F4EAEB]"}\`}>
                              <Storefront className={\`w-5 h-5 \${delivery.store === store.id ? "text-white" : "text-[#C08A8E]"}\`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#2A2424]">{store.name}</p>
                              <p className="text-xs text-[#2A2424]/50 mt-0.5">{store.address}</p>
                              <p className="text-[10px] text-[#C08A8E] font-semibold mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {store.opening_hours || "Ouvert"}
                              </p>
                              <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                                {store.price === 0 ? "Gratuit" : \`+ \${store.price} FCFA\`}
                              </p>
                            </div>
                            <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all \${delivery.store === store.id ? "border-[#2A2424] bg-[#2A2424]" : "border-[#EDE0E0]"}\`}>
                              {delivery.store === store.id && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        ))}
                        {pickupPointsData.length === 0 && <p className="text-sm text-gray-500 italic">Aucun point de retrait disponible.</p>}`;

c = c.replace(oldStores, newStores);
fs.writeFileSync('apps/storefront/app/checkout/page.tsx', c, 'utf8');
