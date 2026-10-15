# Training Palace

Eerste persoonlijke prototype: dagelijkse checklist, gevoelscheck en dagboek.

## Starten

Geen installatie of betaalde dienst nodig. Vanuit deze map:

```sh
python3 -m http.server 3000 --bind 0.0.0.0
```

Open de app via je lokale ontwikkelomgeving op poort 3000.

Gegevens worden lokaal in de browser opgeslagen, per kalenderdag. Geen account, serveropslag of synchronisatie. Onder Mijn dag staat een dagboekvak met ‘Vandaag opslaan’. Deze knop bewaart een dagoverzicht met stemming, een onafhankelijke kopie van de taken en hun vinkjes, dagboektekst en opslagtijd. ‘Vandaag bijwerken’ vervangt het overzicht van diezelfde datum bewust. Tussentijds blijven tekstwijzigingen als concept bewaard; ze veranderen een opgeslagen overzicht pas na bijwerken. In Dagboek kun je opgeslagen dagen kiezen, teruglezen en exporteren inclusief stemming en taken. Bestaande losse dagboekteksten blijven behouden. Browsergegevens wissen verwijdert de opgeslagen gegevens. Gebruik voor een dagboek op een gedeeld toestel een eigen browserprofiel; opslag is niet versleuteld. Lettertypen worden via Google Fonts geladen, met systeemlettertypen als fallback.

## Dagelijkse taken

Klik op het losse vinkje om een taak af te vinken; klik op de taaktekst om details te openen. De ademhalingsoefeningen hebben een pauzeerbare timer. De thuisworkout biedt twee niveaus met aanpasbare sets/herhalingen en opgeslagen setvinkjes. De huishoudtaak is bewerkbaar en keert dagelijks terug met een leeg vinkje. Bestaande dagboekgegevens blijven behouden.

Elke maaltijd begint met één beschrijving en een optionele foto. ‘Schat mijn maaltijd’ herkent een kleine lijst Nederlandse voedingsmiddelen, aantallen en gewichten (bijvoorbeeld ‘2x eitjes, met spek en een witte botherham’). Ontbrekende gewichten krijgen zichtbare standaardporties; de gebruiker kan deze achter een uitklap aanpassen. Dit is een lokale woordenlijst met rekenregels, geen AI. Onbekende ingrediënten worden gemeld en blokkeren een nieuwe schatting, zodat geen onvolledige maaltijd als totaal wordt opgeslagen. Laag/hoog past −15%/+15% toe; ‘Basis’ voegt geen marge toe. Dit zijn grove schattingen, geen betrouwbaarheidsintervallen of persoonlijke voedingsdoelen. Calorieën worden berekend als 4 × eiwit + 4 × koolhydraten + 9 × vet; verpakkingwaarden kunnen hiervan afwijken (onder andere vezels). Gewogen porties en het eigen productetiket hebben de voorkeur. Het dagtotaal telt alleen geregistreerde maaltijden op.

Foto’s worden verkleind en lokaal in IndexedDB opgeslagen, los van dagboek/checklist in localStorage. De camera-invoer werkt op ondersteunende mobiele browsers via HTTPS. JPG, PNG en WebP worden ondersteund; HEIC moet eerst omgezet worden. Een nieuwe browser of domeinnaam heeft geen toegang tot de eerdere lokale gegevens. Er is nog geen contentplanning.

## Geen betaalde AI-koppeling

Er zijn geen externe AI-aanroepen en geen API-sleutels nodig. Foto’s worden uitsluitend lokaal bewaard en niet automatisch herkend. Een ChatGPT-abonnement omvat geen OpenAI API-gebruik.

Onder ‘Liever door AI laten schatten?’ opent een link ChatGPT met de maaltijdomschrijving en de lage/hoge voorkeur. De gebruiker verstuurt de opdracht daar zelf en voegt eventueel zelf de foto toe. Een kopieerknop biedt een alternatief wanneer voorinvullen niet beschikbaar is. Het antwoord kan als JSON of gelabelde Nederlandse macro’s teruggeplakt worden. Deze invoer vervangt de ingrediëntenlijst en voegt geen tweede marge toe. Onder ‘Zelf macro’s invullen’ is ook handmatige invoer beschikbaar. Je kunt daarna nog laag of hoog kiezen. Er is geen automatische ChatGPT-abonnementsintegratie.

## Controles

```sh
node --check app.js
node --test tests/nutrition.test.cjs
# In een aparte terminal, voor de browsertest:
node tests/serve.cjs
# Daarna (met Python Playwright en Chromium geïnstalleerd):
python tests/browser_smoke.py
python tests/journal_smoke.py
```

De browsertest gebruikt standaard poort 3003, instelbaar via `PALACE_TEST_URL`. Deze controleert gescheiden taak/vinkje-acties, ademhalingstimer, macroberekening, lokale foto-opslag, overname van maaltijdtotalen, workouts, dagelijkse herhaling en mobiele layout. Er worden geen AI-diensten aangeroepen.

## Vercel-preview

Importeer deze repository in Vercel, kies `Other` als framework en gebruik de repository-root. `vercel.json` bouwt uitsluitend de vier webbestanden naar `dist/`; er zijn geen dependencies of secrets voor de app nodig. Gebruik `develop` voor previews.

Een preview-URL is niet vanzelf privé. Activeer Vercel Authentication onder Settings → Deployment Protection voor previews, en controleer in een uitgelogde browser dat de app afgeschermd is voordat je de link privé noemt. Publiceer deze versie niet als onbeveiligde productieomgeving wanneer je privétoegang wilt. De noindex-header voorkomt geen toegang.

Dagboekgegevens horen bij de browser én het domein. Een nieuwe preview-URL neemt de gegevens van een eerdere URL niet over. Gebruik de tekstexport om notities veilig te bewaren.
