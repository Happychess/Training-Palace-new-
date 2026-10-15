# Training Palace

Eerste persoonlijke prototype: dagelijkse checklist, gevoelscheck en dagboek.

## Starten

Geen installatie of betaalde dienst nodig. Vanuit deze map:

```sh
python3 -m http.server 3000 --bind 0.0.0.0
```

Open de app via je lokale ontwikkelomgeving op poort 3000.

Gegevens worden lokaal in de browser opgeslagen, per kalenderdag. Geen account, serveropslag of synchronisatie. Het dagboek heeft een tekstexport. Browsergegevens wissen verwijdert de opgeslagen gegevens. Gebruik voor een dagboek op een gedeeld toestel een eigen browserprofiel; opslag is niet versleuteld. Lettertypen worden via Google Fonts geladen, met systeemlettertypen als fallback.

## Dagelijkse taken

Klik op het losse vinkje om een taak af te vinken; klik op de taaktekst om details te openen. De ademhalingsoefeningen hebben een pauzeerbare timer. De thuisworkout biedt twee niveaus met aanpasbare sets/herhalingen en opgeslagen setvinkjes. De huishoudtaak is bewerkbaar en keert dagelijks terug met een leeg vinkje. Bestaande dagboekgegevens blijven behouden.

Elke maaltijd heeft een omschrijving, invoer uit een kleine indicatieve voedingslijst of eigen etiketwaarden per 100 g, en een lage/hoge rekenmarge (−15%/+15%). Dit zijn grove schattingen, geen betrouwbaarheidsintervallen of persoonlijke voedingsdoelen. Calorieën worden berekend als 4 × eiwit + 4 × koolhydraten + 9 × vet; verpakkingwaarden kunnen hiervan afwijken (onder andere vezels). Gewogen porties en het eigen productetiket hebben de voorkeur. Het dagtotaal telt alleen geregistreerde maaltijden op.

Foto’s worden verkleind en lokaal in IndexedDB opgeslagen, los van dagboek/checklist in localStorage. De camera-invoer werkt op ondersteunende mobiele browsers via HTTPS. JPG, PNG en WebP worden ondersteund; HEIC moet eerst omgezet worden. Een nieuwe browser of domeinnaam heeft geen toegang tot de eerdere lokale gegevens. Er is nog geen contentplanning.

## Optionele fotoanalyse op Vercel

Zonder API-sleutel werken handmatige macroregistratie en lokale foto-opslag. De knop voor automatische fotoanalyse blijft dan uitgeschakeld. Een gewone statische Python-server voert de API-route niet uit.

1. Controleer eerst Vercel Authentication / Deployment Protection voor de bedoelde omgeving. De API-route heeft zelf geen accountlogin en hoort net als de app achter die beveiliging te staan.
2. Voeg via Vercel → Settings → Environment Variables een **server-side** `MACRO_VISION_API_KEY` toe met een OpenAI API-sleutel, uitsluitend voor de gewenste beveiligde omgeving. Geen sleutel in Git, browsercode of chat zetten. OpenAI API-gebruik wordt apart afgerekend en valt niet onder een ChatGPT-abonnement.
3. Deploy opnieuw. `api/estimate-meal.js` is een Vercel Node-functie zonder extra dependencies. `GET /api/estimate-meal` meldt alleen of de koppeling geconfigureerd is; een live analyse kan alsnog mislukken door bijvoorbeeld quota of sleutelrechten.
4. De gebruiker klikt expliciet op ‘Schat macro’s uit foto’. Alleen dan worden de foto en maaltijdomschrijving naar OpenAI (`gpt-4.1-mini`) gestuurd. Het antwoord is een voorstel met porties, macro’s per 100 g en onzekerheden. De gebruiker kan porties wijzigen en moet bevestigen voordat dit de huidige maaltijd vervangt. Lage/hoge marge wordt daarna toegepast.

De externe OpenAI-koppeling is niet live gevalideerd zonder sleutel. Succes- en foutafhandeling worden getest met gesimuleerde providerantwoorden.

## Controles

```sh
node --check app.js
node --test tests/estimate-meal.test.cjs
# In een aparte terminal, voor de browsertest:
node tests/serve.cjs
# Daarna (met Playwright geïnstalleerd):
python tests/browser_smoke.py
```

`tests/browser_smoke.py` vereist Python Playwright en Chromium en test tegen een lokale webserver die ook de Node API-route uitvoert (standaard poort 3003, instelbaar via `PALACE_TEST_URL`). De test verifieert taak/vinkje-scheiding, ademhalingstimer, macroberekening, foto-opslag, een gemockte fotoschatting, workouts, dagelijkse herhaling en mobiele layout. De browser-succestest doet geen betaalde API-aanroepen.

## Vercel-preview

Importeer deze repository in Vercel, kies `Other` als framework en gebruik de repository-root. `vercel.json` bouwt uitsluitend de drie webbestanden naar `dist/`; er zijn geen dependencies of secrets voor de app nodig. Gebruik `develop` voor previews.

Een preview-URL is niet vanzelf privé. Activeer Vercel Authentication onder Settings → Deployment Protection voor previews, en controleer in een uitgelogde browser dat de app afgeschermd is voordat je de link privé noemt. Publiceer deze versie niet als onbeveiligde productieomgeving wanneer je privétoegang wilt. De noindex-header voorkomt geen toegang.

Dagboekgegevens horen bij de browser én het domein. Een nieuwe preview-URL neemt de gegevens van een eerdere URL niet over. Gebruik de tekstexport om notities veilig te bewaren.
