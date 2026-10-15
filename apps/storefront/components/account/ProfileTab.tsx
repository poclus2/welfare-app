"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, PencilSimple, Trash, CheckCircle, WarningCircle, X, CaretRight, House } from "@phosphor-icons/react";
import { sdk } from "@/lib/medusa";
import { useI18n } from "@/lib/i18n-context";
import { DISPLAY_FONT, SK, SectionTitle } from "@/components/account/account-ui";

// Declared outside the component: defined inside, the inputs were re-created on every keystroke
// (focus lost while typing)
function Field({ label, type = "text", value, onChange, required = false, disabled = false, list, placeholder }: {
  label: string; type?: string; value: string; onChange?: (v: string) => void; required?: boolean; disabled?: boolean; list?: string; placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-[12px] font-bold" style={{ color: SK.muted }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        disabled={disabled}
        list={list}
        placeholder={placeholder}
        className="h-[46px] rounded-[14px] px-3 text-[15px] font-normal outline-none focus:ring-2 disabled:opacity-100"
        style={{
          border: `1px solid ${disabled ? SK.lineSoft : SK.line}`,
          background: disabled ? SK.ground : SK.surface,
          color: SK.ink,
          ["--tw-ring-color" as any]: SK.accent,
        }}
      />
    </label>
  );
}

const emptyAddress = { first_name: "", last_name: "", address_1: "", address_2: "", city: "", postal_code: "", country_code: "CM", phone: "" };

export default function ProfileTab({
  customer,
  onUpdate,
  isCreator = false,
  onLogout,
  loyalty,
}: {
  customer: any;
  onUpdate: () => void;
  isCreator?: boolean;
  onLogout?: () => void;
  loyalty?: { tier: string; points: number };
}) {
  const { t, locale } = useI18n();
  // Customers who signed up with a phone number carry a made-up address (see /store/customers/me/email)
  const isPlaceholderEmail = String(customer?.email || "").toLowerCase().endsWith("@phone.thewelfarecm.com");
  const [newEmail, setNewEmail] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [formData, setFormData] = useState({ first_name: customer?.first_name || "", last_name: customer?.last_name || "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddress);

  useEffect(() => {
    sdk.client
      .fetch<any>("/store/delivery/cities", { method: "GET" })
      .then((res) => setCities((res?.cities || []).map((c: any) => c.name).filter(Boolean)))
      .catch(() => {});
  }, []);

  const countryName = (code: string) => {
    try {
      return new Intl.DisplayNames([locale === "en" ? "en" : "fr"], { type: "region" }).of(String(code).toUpperCase()) || String(code).toUpperCase();
    } catch {
      return String(code).toUpperCase();
    }
  };

  const flash = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sdk.client.fetch("/store/customers/me/email", { method: "POST", body: { email: newEmail } });
      flash("success", t("E-mail enregistré."));
      setNewEmail("");
      onUpdate();
    } catch (err: any) {
      flash("error", err.message || t("Une erreur est survenue."));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sdk.store.customer.update({ first_name: formData.first_name, last_name: formData.last_name });
      flash("success", t("Informations mises à jour."));
      setIsEditingInfo(false);
      onUpdate();
    } catch (err: any) {
      flash("error", err.message || t("Une erreur est survenue."));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAddressId) {
        await sdk.store.customer.updateAddress(editingAddressId, addressForm);
        flash("success", t("Adresse modifiée."));
      } else {
        await sdk.store.customer.createAddress(addressForm);
        flash("success", t("Nouvelle adresse ajoutée."));
      }
      setIsAddingAddress(false);
      setEditingAddressId(null);
      onUpdate();
    } catch (err: any) {
      flash("error", err.message || t("Erreur."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm(t("Voulez-vous supprimer cette adresse ?"))) return;
    setLoading(true);
    try {
      await sdk.store.customer.deleteAddress(id);
      flash("success", t("Adresse supprimée."));
      onUpdate();
    } catch (err: any) {
      flash("error", err.message || t("Erreur lors de la suppression."));
    } finally {
      setLoading(false);
    }
  };

  const openEditAddress = (addr: any) => {
    setAddressForm({
      first_name: addr.first_name || "",
      last_name: addr.last_name || "",
      address_1: addr.address_1 || "",
      address_2: addr.address_2 || "",
      city: addr.city || "",
      postal_code: addr.postal_code || "",
      country_code: addr.country_code || "CM",
      phone: addr.phone || "",
    });
    setEditingAddressId(addr.id);
    setIsAddingAddress(true);
  };

  const initials = `${(customer?.first_name || "").charAt(0)}${(customer?.last_name || "").charAt(0)}`.toUpperCase() || "W";
  const setAddr = (key: keyof typeof emptyAddress) => (v: string) => setAddressForm((f) => ({ ...f, [key]: v }));

  return (
    <div className="flex flex-col gap-[22px]">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className="p-4 rounded-[18px] flex items-center gap-3 text-[14px] font-semibold"
            style={message.type === "success" ? { background: "#EEF6F1", color: "#0B6B45" } : { background: "#FDECEC", color: "#9F1C12" }}
          >
            {message.type === "success" ? <CheckCircle weight="fill" className="w-5 h-5" /> : <WarningCircle weight="fill" className="w-5 h-5" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* identity */}
      <div className="flex items-center gap-4">
        <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white shrink-0" style={{ background: SK.accent, fontFamily: DISPLAY_FONT, fontSize: 28, fontWeight: 700 }}>
          {initials}
        </div>
        <div className="min-w-0">
          <SectionTitle as="h1" light={customer?.first_name || ""} bold={customer?.last_name ? `${customer.last_name.charAt(0).toUpperCase()}.` : ""} size={34} />
          {loyalty && <p className="mt-1.5 text-[14px]" style={{ color: SK.muted }}>{t(loyalty.tier)} · {loyalty.points.toLocaleString(locale === "en" ? "en-GB" : "fr-FR")} {t("points")}</p>}
        </div>
      </div>

      {/* personal information */}
      <div className="rounded-[26px] p-[18px] flex flex-col gap-3.5" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
        <div className="flex items-center justify-between">
          <h2 style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 700 }}>{t("Mes informations")}</h2>
          <button
            type="button"
            onClick={() => { setFormData({ first_name: customer?.first_name || "", last_name: customer?.last_name || "" }); setIsEditingInfo((v) => !v); }}
            className="h-10 px-3.5 rounded-full text-[13px] font-bold flex items-center gap-1.5"
            style={{ border: `1px solid ${SK.ink}`, color: SK.ink, background: SK.surface }}
          >
            {isEditingInfo ? t("Annuler") : <><PencilSimple weight="bold" className="w-3.5 h-3.5" /> {t("Modifier")}</>}
          </button>
        </div>
        <form onSubmit={handleUpdateInfo} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label={t("Prénom")} value={isEditingInfo ? formData.first_name : customer?.first_name || ""} onChange={(v) => setFormData((f) => ({ ...f, first_name: v }))} required disabled={!isEditingInfo} />
            <Field label={t("Nom")} value={isEditingInfo ? formData.last_name : customer?.last_name || ""} onChange={(v) => setFormData((f) => ({ ...f, last_name: v }))} required disabled={!isEditingInfo} />
          </div>
          <Field label={t("Téléphone · identifiant de connexion")} type="tel" value={customer?.phone || t("Non renseigné")} disabled />
          {!isPlaceholderEmail && <Field label={t("E-mail")} value={customer?.email || ""} disabled />}
          {isEditingInfo && (
            <button type="submit" disabled={loading} className="h-[52px] rounded-full text-[15px] font-bold disabled:opacity-70" style={{ background: SK.accent, color: "#FFFFFF" }}>
              {loading ? t("Enregistrement...") : t("Enregistrer")}
            </button>
          )}
        </form>
        {isPlaceholderEmail && (
          <form onSubmit={handleSaveEmail} className="flex flex-col gap-2 pt-1">
            <Field label={t("E-mail · pour recevoir vos confirmations")} type="email" value={newEmail} onChange={setNewEmail} required placeholder={t("Votre e-mail")} />
            <button type="submit" disabled={loading} className="self-start h-11 px-4 rounded-full text-[14px] font-bold disabled:opacity-70" style={{ background: SK.accent, color: "#FFFFFF" }}>
              {t("Enregistrer l'e-mail")}
            </button>
          </form>
        )}
      </div>

      {/* address book */}
      <div className="flex flex-col gap-3">
        <SectionTitle light={t("Carnet")} bold={t("d'adresses")} size={26} />

        {isAddingAddress ? (
          <form onSubmit={handleSaveAddress} className="rounded-[26px] p-[18px] flex flex-col gap-3" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold">{editingAddressId ? t("Modifier l'adresse") : t("Nouvelle adresse")}</h3>
              <button type="button" aria-label={t("Fermer")} onClick={() => setIsAddingAddress(false)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: `1px solid ${SK.line}` }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={t("Prénom")} value={addressForm.first_name} onChange={setAddr("first_name")} required />
              <Field label={t("Nom")} value={addressForm.last_name} onChange={setAddr("last_name")} required />
            </div>
            <Field label={t("Adresse")} value={addressForm.address_1} onChange={setAddr("address_1")} required />
            <Field label={t("Complément (optionnel)")} value={addressForm.address_2} onChange={setAddr("address_2")} />
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={t("Ville")} value={addressForm.city} onChange={setAddr("city")} list="profile-cities" required />
              <Field label={t("Code postal (optionnel)")} value={addressForm.postal_code} onChange={setAddr("postal_code")} />
            </div>
            <datalist id="profile-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            <Field label={t("Téléphone (optionnel)")} type="tel" value={addressForm.phone} onChange={setAddr("phone")} />
            <button type="submit" disabled={loading} className="h-[52px] rounded-full text-[15px] font-bold disabled:opacity-70" style={{ background: SK.accent, color: "#FFFFFF" }}>
              {loading ? t("Enregistrement...") : t("Enregistrer l'adresse")}
            </button>
          </form>
        ) : (
          <>
            {(customer?.addresses || []).length > 0 ? (
              customer.addresses.map((addr: any) => (
                <div key={addr.id} className="rounded-[22px] p-4 flex gap-3 items-start" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: addr.is_default_shipping ? SK.tint : SK.ground }}>
                    {addr.is_default_shipping ? <MapPin weight="fill" className="w-[18px] h-[18px]" style={{ color: SK.accent }} /> : <House className="w-[18px] h-[18px]" style={{ color: SK.muted }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-bold">{addr.first_name} {addr.last_name}</span>
                      {addr.is_default_shipping && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: SK.tint }}>{t("Par défaut")}</span>}
                    </div>
                    <p className="text-[14px] leading-relaxed" style={{ color: "#3F3331" }}>
                      {addr.address_1}{addr.address_2 ? `, ${addr.address_2}` : ""}<br />
                      {[addr.postal_code, addr.city].filter(Boolean).join(" ")}, {countryName(addr.country_code)}
                    </p>
                    {addr.phone && <p className="text-[13px]" style={{ color: SK.muted }}>{addr.phone}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => openEditAddress(addr)} aria-label={t("Modifier l'adresse")} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: `1px solid ${SK.line}`, background: SK.surface }}>
                      <PencilSimple className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteAddress(addr.id)} aria-label={t("Supprimer l'adresse")} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: `1px solid ${SK.line}`, background: SK.surface }}>
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[14px] rounded-[22px] p-4 text-center" style={{ color: SK.muted, background: SK.surface, border: `1px dashed ${SK.line}` }}>
                {t("Aucune adresse enregistrée.")}
              </p>
            )}
            <button
              onClick={() => { setAddressForm(emptyAddress); setEditingAddressId(null); setIsAddingAddress(true); }}
              className="h-[50px] rounded-full text-[14px] font-bold"
              style={{ border: `1px dashed ${SK.accent}`, background: SK.surface, color: SK.ink }}
            >
              + {t("Ajouter une adresse")}
            </button>
          </>
        )}
      </div>

      {/* links */}
      <div className="flex flex-col gap-2.5">
        {isCreator && (
          <Link href="/ambassadrices" className="h-[58px] px-[18px] rounded-[20px] flex items-center justify-between text-[15px] font-bold" style={{ background: SK.tint, color: SK.ink }}>
            {t("Espace créatrice")} <CaretRight className="w-4 h-4" />
          </Link>
        )}
        <Link href={`/account/reset-password${customer?.phone ? `?phone=${encodeURIComponent(customer.phone)}` : ""}`} className="h-[58px] px-[18px] rounded-[20px] flex items-center justify-between text-[15px] font-bold" style={{ background: SK.surface, border: `1px solid ${SK.lineSoft}`, color: SK.ink }}>
          {t("Changer mon mot de passe")} <CaretRight className="w-4 h-4" />
        </Link>
        {onLogout && (
          <button onClick={onLogout} className="h-[52px] rounded-full text-[15px] font-bold" style={{ border: `1px solid ${SK.line}`, background: SK.surface, color: SK.ink }}>
            {t("Se déconnecter")}
          </button>
        )}
      </div>
    </div>
  );
}
