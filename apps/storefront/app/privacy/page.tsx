import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité - The Welfare Shop",
  description: "Comment The Welfare collecte, utilise et protège vos données personnelles.",
};

// Keep in sync with the code when a data flow changes: photo retention (api/src/jobs/purge-skin-scan-photos.ts),
// the service providers below, cookies and local storage.
const UPDATED = "20 octobre 2026";
const CONTACT = "contact@thewelfarecm.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg md:text-xl font-semibold text-[#2A2424]">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-[#2A2424]/80">{children}</div>
    </section>
  );
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <main className="bg-[#FDF8F7]">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-20 space-y-10">
        <header className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#B06068]">The Welfare</p>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-[#2A2424]">Politique de confidentialité</h1>
          <p className="text-sm text-[#2A2424]/50">Dernière mise à jour : {UPDATED}</p>
          <p className="text-[15px] leading-relaxed text-[#2A2424]/80">
            Cette page explique quelles données personnelles nous collectons lorsque vous utilisez le site
            thewelfarecm.com, pourquoi nous les utilisons, avec qui nous les partageons, combien de temps nous les
            gardons et comment exercer vos droits.
          </p>
        </header>

        <Section title="1. Qui est responsable de vos données ?">
          <p>
            The Welfare, Rue Hippodrome, Yaoundé, Cameroun.
            <br />
            Pour toute question sur vos données ou pour exercer vos droits :{" "}
            <a href={`mailto:${CONTACT}`} className="underline text-[#B06068]">{CONTACT}</a>.
          </p>
        </Section>

        <Section title="2. Les données que nous collectons">
          <List
            items={[
              <><strong>Votre compte</strong> : prénom, nom, numéro de téléphone (vérifié par un code envoyé sur WhatsApp), adresse e-mail et mot de passe (conservé sous forme chiffrée, jamais en clair).</>,
              <><strong>Vos commandes</strong> : produits achetés, montants, adresses et informations de livraison, historique de commandes et points de fidélité.</>,
              <><strong>Vos paiements</strong> : pour un paiement Mobile Money, le numéro utilisé et le statut de la transaction. Le paiement est traité par notre prestataire de paiement ; nous ne recevons pas vos codes secrets.</>,
              <><strong>Le Skin Coach IA</strong> : les 3 photos de votre visage, vos réponses au questionnaire (dont des informations de santé que vous choisissez de nous donner : sensibilité de la peau, allergies, grossesse ou allaitement), les éventuelles photos des produits que vous utilisez, et le diagnostic obtenu.</>,
              <><strong>Le programme ambassadrices</strong> : les informations de votre candidature (identité, coordonnées, ville, réseaux sociaux, audience, motivation) puis, si vous rejoignez le programme, votre code, vos ventes et vos commissions.</>,
              <><strong>L'assistant de discussion</strong> : les messages que vous lui écrivez.</>,
              <><strong>Votre navigation</strong> : pages consultées, type d'appareil et de navigateur, et un identifiant de mesure d'audience (voir la section 7).</>,
            ]}
          />
        </Section>

        <Section title="3. Pourquoi nous les utilisons">
          <List
            items={[
              "Créer et sécuriser votre compte, et vérifier votre numéro de téléphone.",
              "Traiter vos commandes, vos paiements et vos livraisons, et vous envoyer les e-mails et messages qui s'y rapportent.",
              "Établir votre diagnostic de peau et vous proposer une routine adaptée, en écartant les produits incompatibles avec les allergies ou la grossesse que vous déclarez.",
              "Gérer le programme ambassadrices : candidatures, suivi des ventes et des commissions.",
              "Répondre à vos questions via l'assistant de discussion et le service client.",
              "Mesurer l'audience du site et l'améliorer.",
              "Respecter nos obligations légales, notamment comptables.",
            ]}
          />
          <p>
            Les photos et les informations de santé du Skin Coach ne sont analysées qu'avec votre accord, donné par une
            case à cocher avant le scan. Sans cet accord, l'analyse n'a pas lieu.
          </p>
        </Section>

        <Section title="4. Avec qui nous les partageons">
          <p>Nous ne vendons pas vos données. Nous les confions uniquement aux prestataires nécessaires au service :</p>
          <List
            items={[
              <><strong>Hostinger</strong> : hébergement du site et de la base de données (serveurs en Lituanie, Union européenne).</>,
              <><strong>OpenRouter</strong> (États-Unis) et les fournisseurs de modèles d'intelligence artificielle auxquels il transmet les requêtes : analyse des photos et rédaction du diagnostic du Skin Coach, réponses de l'assistant de discussion.</>,
              <><strong>Tara</strong> (Dikalo SARL, Cameroun) : traitement des paiements MTN Mobile Money et Orange Money.</>,
              <><strong>PawaPay</strong> : versement des commissions des créatrices partenaires par Mobile Money.</>,
              <><strong>Zindua et WhatsApp</strong> : envoi des codes de vérification de votre numéro.</>,
              <><strong>Resend</strong> (États-Unis) : envoi des e-mails (confirmation de commande, réinitialisation de mot de passe…).</>,
              <><strong>PostHog</strong> (États-Unis) : mesure d'audience.</>,
              <><strong>Google Fonts</strong> : affichage des polices du site, ce qui transmet votre adresse IP à Google.</>,
              <>Nos boutiques physiques, pour préparer et remettre vos commandes.</>,
            ]}
          />
          <p>
            Certains de ces prestataires sont situés hors du Cameroun. Nous ne leur transmettons que les données
            nécessaires au service qu'ils nous rendent.
          </p>
        </Section>

        <Section title="5. Combien de temps nous les gardons">
          <List
            items={[
              <><strong>Photos du visage (Skin Coach)</strong> : supprimées automatiquement au plus tard 7 jours après le scan si le diagnostic n'est pas enregistré dans un compte, et au bout de 6 mois s'il l'est. Elles sont consultées par l'équipe et par la conseillère The Welfare à qui votre diagnostic est confié, pour relire la routine proposée. Le diagnostic lui-même (type de peau, scores, routine) reste consultable dans votre compte.</>,
              <><strong>Repères du visage (Skin Coach)</strong> : sur la photo de face, la position de quelques points du visage (front, nez, joues…) est calculée sur votre téléphone pour afficher l'analyse sur votre photo. Elle est conservée avec vos photos et supprimée en même temps qu'elles.</>,
              <><strong>Photos de vos produits et réponses au questionnaire</strong> : utilisées le temps de l'analyse, elles ne sont pas conservées par nos soins.</>,
              <><strong>Compte</strong> : tant que votre compte existe. Vous pouvez demander sa suppression à tout moment.</>,
              <><strong>Commandes et factures</strong> : pendant la durée imposée par nos obligations comptables (10 ans).</>,
              <><strong>Candidatures au programme ambassadrices</strong> : le temps de leur traitement et, pour les ambassadrices, pendant toute la durée du partenariat puis la durée comptable de leurs commissions.</>,
            ]}
          />
        </Section>

        <Section title="6. Vos droits">
          <p>
            Vous pouvez à tout moment demander à accéder à vos données, les faire corriger ou supprimer, vous opposer à
            leur utilisation ou retirer votre consentement (par exemple pour le Skin Coach). Écrivez-nous à{" "}
            <a href={`mailto:${CONTACT}`} className="underline text-[#B06068]">{CONTACT}</a> depuis l'adresse ou
            le numéro associé à votre compte ; nous vous répondons dans un délai de 30 jours.
          </p>
          <p>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez aussi saisir l'autorité camerounaise
            compétente en matière de protection des données personnelles.
          </p>
        </Section>

        <Section title="7. Cookies et stockage dans votre navigateur">
          <List
            items={[
              <><strong>Panier</strong> : un identifiant de panier, pour retrouver votre panier d'une visite à l'autre.</>,
              <><strong>Langue</strong> : la langue choisie (1 an).</>,
              <><strong>Code ambassadrice</strong> : si vous arrivez par le lien d'une ambassadrice, son code est gardé 30 jours pour lui attribuer la vente.</>,
              <><strong>Skin Coach</strong> : votre dernier diagnostic, pour l'afficher après la connexion à votre compte (sans les photos).</>,
              <><strong>Mesure d'audience (PostHog)</strong> : un identifiant aléatoire qui nous permet de compter les visites et de comprendre l'utilisation du site.</>,
            ]}
          />
          <p>Vous pouvez supprimer ces données à tout moment depuis les réglages de votre navigateur.</p>
        </Section>

        <Section title="8. Sécurité">
          <p>
            Vos données circulent de façon chiffrée (HTTPS). L'accès à nos serveurs et à l'administration du site est
            réservé aux personnes qui en ont besoin, et les mots de passe sont conservés sous forme chiffrée.
          </p>
        </Section>

        <Section title="9. Modifications">
          <p>
            Nous pouvons mettre à jour cette politique, par exemple quand nous ajoutons un service. La date de dernière
            mise à jour figure en haut de cette page.
          </p>
        </Section>

        <p className="pt-4 text-sm">
          <Link href="/" className="underline text-[#B06068]">Retour à la boutique</Link>
        </p>
      </article>
    </main>
  );
}
