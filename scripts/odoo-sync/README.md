# Synchro stock Odoo → site (Welfare)

Un programme (`odoo_sync.py`, compilé en `odoo_sync.exe`) à installer **sur le PC Odoo de chaque boutique**.
Il lit le stock vendable dans PostgreSQL et l'envoie toutes les 5 minutes à `https://api.thewelfarecm.com/odoo-sync`.
Odoo reste la source de vérité : le site (fiche produit, admin, IA) affiche le stock par boutique envoyé par ce programme.

## Ce qui change par rapport aux anciens scripts
- Nouvelle URL (`api.thewelfarecm.com`) et **toute la config dans `config.ini`** (plus rien en dur dans le code).
- Envoie la quantité **disponible** (en stock − réservé, jamais négative) de l'emplacement **et de ses sous-emplacements**.
- Envoie **tous les produits avec code-barres, y compris à 0** : un produit épuisé repasse à 0 sur le site.
- Réessaie en cas de coupure internet (3 essais), **journalise tout** dans `odoo_sync.log` (plus d'erreurs avalées en silence).
- Vérifie que l'emplacement de stock existe dans la base (sinon liste les emplacements disponibles).
- Intervalle 5 min (au lieu de 15). Le serveur n'écrit que ce qui a changé.
- Options `--dry-run` (lit Odoo, n'envoie rien) et `--once`.

## Installation sur un PC boutique
1. Copier `odoo_sync.exe` dans un dossier (ex. `C:\welfare-sync\`).
2. Y mettre le `config.ini` de **cette** boutique (modèles : `config.boutique1.ini` = Hippodrome, `config.boutique2.ini` = Playce, à renommer en `config.ini`). Ces fichiers contiennent le mot de passe et le jeton : ne pas les envoyer par mail ni les committer.
3. **Tester d'abord** : `odoo_sync.exe --dry-run`
   - doit afficher le nombre de produits lus, la liste des bases PostgreSQL du PC et un échantillon.
   - Boutique Playce : si `thewelfare` n'est pas la bonne base, choisir dans la liste affichée (le script de diagnostic utilisait `the-welfare-playce`) et corriger `name` dans `config.ini`.
4. Envoi réel unique : `odoo_sync.exe --once` → doit finir par `Sync OK`.
5. Remplacer l'ancien programme au démarrage : arrêter l'ancien `odoo_sync_boutiqueN.exe` (gestionnaire des tâches / nssm / tâche planifiée) et lancer le nouveau de la même façon (sans option = boucle infinie).

## Compiler l'exe
Depuis ce dossier, sur un PC avec Python 3.10+ (celui d'Odoo convient) :
```
pip install psycopg2-binary requests pyinstaller
pyinstaller --onefile --name odoo_sync odoo_sync.py
```
L'exe est dans `dist\odoo_sync.exe`.

## Vérifier que ça marche côté site
```
node scripts/odoo-sync/check-stock.mjs https://api.thewelfarecm.com <clé-publishable>
```
Affiche la date de dernière modification des variantes (doit être récente après une synchro) et les écarts entre le stock Odoo (b1+b2) et le stock Medusa.
Côté serveur : `docker logs welfare-api 2>&1 | grep "Odoo Sync" | tail`.
