# Brief de passation, Les Pizzas du Soleil (modifs)

> Document autonome pour démarrer une session de modification SANS le contexte de la conversation d'origine. Rédigé le 14/06/2026.

## 0. Objectif de la session de modif
Mettre à jour la démo avec les vraies infos de la cliente (Marie apporte des captures : **carte/menu à jour, prix, suppléments, et autres**) avant/juste après le RDV de signature. La démo est déjà construite et en ligne ; il s'agit surtout de remplacer du contenu placeholder par du réel, pas de recoder.

## 1. Identité du projet
- **Client** : pizzeria « Les Pizzas du Soleil » (ex-Pizza Bonici reprise), 7 avenue François Mitterrand, 31800 Saint-Gaudens.
- **Entité juridique** : SAS BD SYLHET (SIREN 981 535 388, SIRET 981 535 388 00012, APE 5610C). Présidente/DG : **Marie Natacha OREO épouse TOUPIN** (DG), Président Dimitri Toupin. 2e deal de Marie (déjà cliente Case Toupin).
- **Statut commercial** : contrat C-2026-008 (1490€ + 49€/mois) en cours de signature le 14/06/2026. Docs dans `05-archives-admin/pizzas-du-soleil-signature-2026-06-13/`.
- **Logo** : vrai logo HD fourni par Marie (soleil à lunettes), déjà intégré (navbar/footer/login + favicons + PWA + og). Servi via `src/components/Logo.jsx` → `/logo.png`.

## 2. Stack et commandes
- **React 19 + Vite 6 + Motion 12 + Lenis** (scroll fluide). localStorage pour panier/commandes/fidélité (pas de backend en démo ; prod = Firestore + Stripe).
- Dépendances : `lenis`, `motion`, `react`, `react-dom` ; dev `@vitejs/plugin-react`, `vite`.
- **Lancer en local** : `npm run dev --prefix 03-demos-prospects/les-pizzas-du-soleil` (ou preview tool `pizzas-du-soleil`, **port 5201**). Build : `npm run build`. 
- Après modif : `npm run build` pour vérifier, puis commit + push (voir §6).

## 3. Déploiement
- **Live** : https://les-pizzas-du-soleil.vercel.app
- **Repo GitHub** : `ninetechnologies/les-pizzas-du-soleil` (public, remote `origin`).
- **Vercel** : build `npm run build` → `dist`, SPA rewrite (toutes routes → `/`). **Auto-deploy sur push de la branche par défaut** (privilégier le push GitHub à `vercel --prod` qui plante par intermittence sur ECONNRESET).
- ⚠️ Règle Git workspace : commiter avec l'auteur par défaut de la machine (`ninetechnologies@outlook.fr`). NE PAS surcharger l'auteur. Un mauvais auteur = déploiement Vercel bloqué.
- Écran cuisine (KDS) : route `/cuisine`, login **soleil** / **cuisine31**.

## 4. Carte du code (ce qui est où)
Racine : `index.html`, `vite.config.js`, `vercel.json`, `package.json`.
```
src/
  main.jsx           Routage minimal : /cuisine -> CuisinePage (KDS), sinon App (site client)
  App.jsx            Ordre des sections : Navbar > Hero > Menu > Order > Reviews > Location > Footer (+ CartBubble, FloatingActions)
  data/menu.js       *** FICHIER CENTRAL DE CONTENU *** (voir §5) — la plupart des modifs se font ici
  styles/global.css  Palette + design tokens (variables --z-*)
  components/
    Navbar.jsx, Hero.jsx, Menu.jsx, Order.jsx (tunnel commande + SCHEDULE créneaux),
    Reviews.jsx, Location.jsx, Footer.jsx, Logo.jsx, CartBubble.jsx, FloatingActions.jsx,
    Kitchen.jsx (board KDS), CuisinePage.jsx (auth écran cuisine),
    TacosCustomizer.jsx (= LE customizer PIZZA, nom hérité du template, lit PIZZA_OPTIONS)
  hooks/useCart.jsx  Contexte panier
  lib/loyalty.js     Fidélité (tampons par téléphone)
  lib/orders.js      Store commandes (localStorage, partagé site <-> /cuisine)
public/
  images/pizzas/     Photos pizzas réelles (voir §5.4)
  images/ambiance/   enseigne, intérieur, galerie 1-4, video-resto.mp4
  images/menu/, images/*.jpg (burgers/tacos/kebab...) = RÉSIDUS du template grill-chicken/vorace, NON utilisés, à ignorer ou supprimer
  logo.png, favicons, icon-192/512, apple-touch-icon
```

## 5. CONTENU À METTRE À JOUR (tout est dans `src/data/menu.js`)
C'est le coeur de la session. Le fichier exporte des constantes consommées par les composants. Remplacer les valeurs placeholder par celles des captures de Marie.

### 5.1 La carte (placeholder pizza à remplacer par la vraie)
- `FEATURED` : 6 pizzas mises en avant (Hero/section vedette). Champs : `id, name, desc, price, image, signature/popular`.
- `CARTE` : tableau de catégories actuelles **placeholder** = `Les Signatures`, `Les Classiques`, `Les Gourmandes`, `Desserts maison`. Chaque item : `{ name, desc, price, img }`. **À remplacer intégralement par la vraie carte de Marie** (noms, descriptions, prix, catégories réelles).
- `PIZZA_DU_MOMENT` : encart « pizza du moment ».

### 5.2 Personnalisation (customizer)
- `PIZZA_OPTIONS` : `tailles` (actuellement Petite -15% / Normale, **TODO confirmer tailles + système de prix**) et `supplements` (liste + prix, **TODO confirmer avec Marie**).
- `TACOS_OPTIONS` : **shim de compatibilité** (viandes/sauces vides), il pointe `supplements: PIZZA_OPTIONS.supplements`. Ne pas le supprimer (Order.jsx et TacosCustomizer.jsx l'importent encore). Le vrai customizer pizza = `src/components/TacosCustomizer.jsx`.

### 5.3 Coordonnées, horaires, modes, réseaux
- `LOCATIONS` : 1 établissement. **`tel` = placeholder `05 61 94 33 29` (ancien Bonici), À CONFIRMER** + `telHref`. `rating`/`reviews` vides (Google). `mapsEmbed`/`mapsDir` ok (adresse réelle).
- `SERVICE_HOURS` (génère les créneaux dans Order.jsx) ET le `hours` de LOCATIONS : Mar-Jeu 11h-14h / 19h-22h, Ven-Sam 11h-14h / 19h-23h, Dim 19h-23h (soir), **Lundi fermé**. Confirmés Marie 09/06, mais re-confirmer si elle dit autre chose.
- `ORDER_MODES` : sur place / à emporter / livraison (ok).
- `SOCIAL` : `facebook`, `instagram`, `google` = **VIDES, à renseigner** (vrais liens).
- `BRAND` : nom, tagline « Pizzeria artisanale », city, signature, ownerFirstName Marie.

### 5.4 Photos
- Vraies photos disponibles dans `public/images/pizzas/` : `hero-mozza, blanche-pesto, orientale-merguez, norvegienne-saumon, margherita, chevre-miel, regina, 4-fromages, 4-formaggi, tartiflette, carbonara, cremosa, piccante, pistacchio, tartufo, compo-3pizzas, cookie-pistache`.
- Le `menu.js` référence les images via le helper `pi('nom.jpg')` => `/images/pizzas/nom.jpg`. Certaines pizzas du placeholder n'ont pas d'`img` (Végétarienne, Calzone, Campione, BBQ Poulet, desserts) => fallback. **Quand Marie donne ses vraies pizzas, faire correspondre chaque item à une vraie photo** (déposer les nouvelles dans `public/images/pizzas/` et câbler `img`/`image`).
- Memory : 4 vraies photos de Marie confirmées (mozza, blanche pesto, merguez, saumon), le reste = génériques à remplacer si Marie en fournit.

## 6. Palette / design (`src/styles/global.css`, variables `--z-*`)
Terre cuite/tomate `--z-green: #B23A1E` (primaire), `--z-red: #E0492C` (CTA tomate), `--z-gold: #F7A81E` (soleil/accents), `--z-cream: #FFF7EC` (fond), texte brun `--z-text: #2A1712`. (Les noms de variables `--z-green` etc. sont hérités du template, ne pas se fier au nom mais à la valeur.)

## 7. Pièges connus (gotchas)
- **TacosCustomizer.jsx = customizer pizza** (nom trompeur, hérité du template grill-chicken). Ne pas chercher un « PizzaCustomizer.jsx ».
- **public/images/menu/** + images burgers/kebab/tacos à la racine de `public/images/` = **résidus non utilisés** par la carte pizza. Source de confusion. À supprimer pour propreté (optionnel) mais ne RIEN casser : la carte pizza n'utilise que `/images/pizzas/` et `/images/ambiance/`.
- Le preview headless ne permet pas de tester son/scroll/transitions multi-étapes du tunnel ; valider visuellement dans un vrai Chrome.
- Après toute modif de contenu : `npm run build` doit passer, puis push (auto-deploy Vercel).

## 8. Checklist modif (quand les captures de Marie arrivent)
- [ ] Remplacer `CARTE` (catégories, noms, descriptions, prix réels) dans `menu.js`.
- [ ] Mettre à jour `FEATURED` (les vraies signatures de Marie).
- [ ] Confirmer/saisir `PIZZA_OPTIONS.tailles` (ex. Senior/Mega ? cm ?) + `supplements` (liste + prix réels).
- [ ] Saisir le vrai `tel` (LOCATIONS) + `telHref`.
- [ ] Renseigner `SOCIAL` (Facebook, Instagram, Google).
- [ ] Vérifier/ajuster horaires (`SERVICE_HOURS` + `LOCATIONS.hours`) si différents.
- [ ] Câbler les vraies photos (`public/images/pizzas/` + champs `img`/`image`).
- [ ] (Optionnel) Renseigner `rating`/`reviews` Google dans LOCATIONS + Reviews.jsx.
- [ ] (Optionnel) Nettoyer les assets résidus du template.
- [ ] `npm run build`, vérifier dans Chrome, commit (auteur par défaut), push → vérifier le déploiement Vercel.

## 9. Liens mémoire
Détails projet : memory `project_pizzas_du_soleil`. Template resto réutilisable : `reference_resto_template`. Contrat/numérotation : `reference_numerotation_documents`. Case Toupin (1er deal Marie) : `project_case_toupin`.
