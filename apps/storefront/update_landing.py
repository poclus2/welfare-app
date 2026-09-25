import re

file_path = r"C:\Users\LENOVO\Documents\Harestech\welfare-platform\apps\storefront\components\ambassadrices\landing.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Form modifications
# 1. State update
content = content.replace(
    'const [form, setForm] = useState({ firstName:"", lastName:"", email:"", phone:"", instagram:"", tiktok:"", youtube:"", followers:"", content:"", motivation:"", other:"" });',
    'const [form, setForm] = useState({ firstName:"", lastName:"", email:"", phone:"", instagram:"", tiktok:"", youtube:"", followers:"", content:"", motivation:"", other:"", country:"", city:"", media_kit_url:"" });'
)

# 2. URL and Body update
content = content.replace(
    'fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"}/store/ambassador-applications`, {',
    'fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"}/store/creator-applications`, {'
)

content = content.replace(
    '''            content_type: form.content,
            motivation: form.motivation,
          })''',
    '''            content_type: form.content,
            motivation: form.motivation,
            country: form.country,
            city: form.city,
            media_kit_url: form.media_kit_url,
          })'''
)

# 3. Success message update
content = content.replace(
    '{t("Notre équipe étudie votre profil et vous contacte sous 48h par email avec votre lien d\'affiliation.")}',
    '{t("Notre équipe examine votre candidature et vous contacte sous 7 jours ouvrés.")}'
)

# 4. Add country/city fields
old_phone_block = '''        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Téléphone WhatsApp")}</label>
          <input name="phone" value={form.phone} onChange={set} placeholder="+221 77 000 00 00" className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all duration-200" />
        </div>
      </div>'''

new_phone_block = '''        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Téléphone WhatsApp")}</label>
          <input name="phone" value={form.phone} onChange={set} placeholder="+221 77 000 00 00" className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all duration-200" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Pays *")}</label>
          <input name="country" value={form.country} onChange={set} placeholder="Sénégal" required className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all duration-200" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Ville *")}</label>
          <input name="city" value={form.city} onChange={set} placeholder="Dakar" required className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all duration-200" />
        </div>
      </div>'''

content = content.replace(old_phone_block, new_phone_block)

# 5. Add media kit field and update motivation label
old_motivation_block = '''      <div className="mt-2">
        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Pourquoi rejoindre The Welfare ? *")}</label>
        <textarea name="motivation" value={form.motivation} onChange={set} required rows={4}
          placeholder={t("Partagez votre passion pour la K-Beauty, votre rapport avec votre communauté, pourquoi The Welfare vous correspond...")}
          className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all resize-none" />
      </div>'''

new_motivation_block = '''      <div className="mt-2">
        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Pourquoi souhaitez-vous rejoindre le programme Créateurs Partenaires The Welfare ? *")}</label>
        <textarea name="motivation" value={form.motivation} onChange={set} required rows={4}
          placeholder={t("Partagez votre passion pour la K-Beauty, votre rapport avec votre communauté, pourquoi The Welfare vous correspond...")}
          className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all resize-none" />
      </div>

      <div className="mt-2">
        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A2424]/45 mb-2">{t("Pièce jointe (Media Kit, stats, portfolio)")}</label>
        <p className="text-xs text-[#2A2424]/40 mb-3">{t("Facultatif — Collez un lien Google Drive, Notion, Linktree ou similaire")}</p>
        <input name="media_kit_url" value={form.media_kit_url} onChange={set} placeholder="https://drive.google.com/..." className="w-full bg-[#F8F5F2] border border-[#EDE0E0] rounded-xl px-4 py-3.5 text-sm text-[#2A2424] outline-none focus:border-[#E5B6B9] focus:bg-white transition-all duration-200" />
      </div>'''

content = content.replace(old_motivation_block, new_motivation_block)

# 6. Text Replacements (Regex to respect word boundaries and case, avoiding Component Names)

replacements = [
    (r'(?<![a-zA-Z])Programme Ambassadrices(?![a-zA-Z])', 'Programme Créateurs Partenaires'),
    (r'(?<![a-zA-Z])Devenir Ambassadrice(?![a-zA-Z])', 'Rejoindre le Programme'),
    (r'(?<![a-zA-Z])Ambassadrices(?![a-zA-Z])', 'Créatrices Partenaires'),
    (r'(?<![a-zA-Z])ambassadrices(?![a-zA-Z])', 'créatrices partenaires'),
    (r'(?<![a-zA-Z])Ambassadrice(?![a-zA-Z])', 'Créatrice Partenaire'),
    (r'(?<![a-zA-Z])ambassadrice(?![a-zA-Z])', 'créatrice partenaire'),
    (r'(?<![a-zA-Z])Ambassadeur(?![a-zA-Z])', 'Créateur Partenaire'),
    (r'(?<![a-zA-Z])ambassadeur(?![a-zA-Z])', 'créateur partenaire')
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modification complete.")
