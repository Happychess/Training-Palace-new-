# Training Palace

Eerste persoonlijke prototype: dagelijkse checklist, gevoelscheck en notities per datum.

## Starten

Geen installatie of betaalde dienst nodig. Vanuit deze map:

```sh
node tests/serve.cjs
```

Open de app via je lokale ontwikkelomgeving op poort 3003 (`PALACE_TEST_PORT` kan de poort wijzigen). De ontwikkelserver bedient ook de publieke Google-clientconfiguratie; een gewone statische server biedt deze route niet.

Gegevens worden lokaal in de browser opgeslagen, per kalenderdag. Geen account, serveropslag of synchronisatie. Onderaan Mijn dag staat één notitievak met een datumkiezer en ‘Vandaag opslaan’. Er is geen aparte dagboekpagina. Deze knop bewaart een dagoverzicht met stemming, een onafhankelijke kopie van de taken en hun vinkjes, dagboektekst en opslagtijd. ‘Vandaag bijwerken’ vervangt het overzicht van diezelfde datum bewust. Tussentijds blijven tekstwijzigingen als concept bewaard; ze veranderen een opgeslagen overzicht pas na bijwerken. In hetzelfde vak kun je onder ‘Je notities’ andere dagen teruglezen en alles exporteren. Voor eerdere datums kun je een stemming en taken achteraf aanvullen; gegevens van vandaag worden niet naar andere datums gekopieerd. Toekomstige datums bewaren planningsnotities, zonder fictieve stemming of afgevinkte taken. Het zijn notities, geen agenda-integratie, meldingen of herinneringen. Als die datum vandaag wordt, verschijnt de voorafgeschreven notitie bij de echte dagtaken. Bestaande losse dagboekteksten blijven behouden. Browsergegevens wissen verwijdert de opgeslagen gegevens. Gebruik voor een dagboek op een gedeeld toestel een eigen browserprofiel; opslag is niet versleuteld. Lettertypen worden via Google Fonts geladen, met systeemlettertypen als fallback.

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
node --test tests/calendar-google.test.cjs
node --test tests/nutrition.test.cjs
# In een aparte terminal, voor de browsertest:
node tests/serve.cjs
# Daarna (met Python Playwright en Chromium geïnstalleerd):
python tests/browser_smoke.py
python tests/journal_smoke.py
python tests/calendar_smoke.py
```

De browsertest gebruikt standaard poort 3003, instelbaar via `PALACE_TEST_URL`. Deze controleert gescheiden taak/vinkje-acties, ademhalingstimer, macroberekening, lokale foto-opslag, overname van maaltijdtotalen, workouts, dagelijkse herhaling en mobiele layout. Er worden geen AI-diensten aangeroepen.

## Vercel-preview

De vaste ontwikkelpreview is https://newtrainingpalace-git-develop-happychess.vercel.app (publiek toegankelijk zonder Vercel-account, op verzoek van de eigenaar). Gebruik dit adres voor dagelijks gebruik, zodat browseropslag bij hetzelfde domein blijft. Na een CLI-previewdeploy moet deze branch-alias naar de nieuwe preview wijzen; controleer dat het gedeelde adres zonder login HTTP 200 geeft. Bestaande gegevens op eerdere unieke preview-URL’s verhuizen niet automatisch mee.

Importeer deze repository in Vercel, kies `Other` als framework en gebruik de repository-root. `vercel.json` bouwt uitsluitend de zes webbestanden naar `dist/`; er zijn geen dependencies of secrets voor de app nodig. Gebruik `develop` voor previews.

Vercel Authentication is op verzoek van de eigenaar uitgeschakeld voor dit project. Behoud publieke toegang bij volgende deployments, tenzij de eigenaar anders vraagt. Notities, stemming, taken en foto’s blijven lokaal in de browser van elke bezoeker; ze worden niet als gedeelde gegevens gepubliceerd. De noindex-header is geen toegangsbeveiliging.

Dagboekgegevens horen bij de browser én het domein. Een nieuwe preview-URL neemt de gegevens van een eerdere URL niet over. Gebruik de tekstexport om notities veilig te bewaren.


## Agenda en Google Calendar

De Agenda-tab toont een maandraster, je lokale gedateerde notities en, na koppelen, afspraken uit één gekozen Google-agenda. Lokale notities kunnen vanuit Agenda op Mijn dag worden bewerkt. Dit is geen achtergrond-synchronisatie of herinneringsdienst.

Google gebruikt een browser OAuth-flow via Google Identity Services. Iedere bezoeker verleent zelf alleen leesrechten (`calendar.events.readonly` en `calendar.calendarlist.readonly`). Access tokens blijven uitsluitend in geheugen, afspraken worden niet in localStorage of serveropslag bewaard en na herladen is opnieuw koppelen nodig. Ontkoppelen wist de Google-afspraken en het token uit het geheugen. De Google-grant blijft behouden om andere koppelingen met dezelfde client niet in te trekken, net als in de bronimplementatie. De gebruiker kan expliciet de volledige toestemming intrekken via de link naar Google-accountinstellingen. Lokale notities blijven behouden. Er wordt niets aan Google gewijzigd. Geen serviceaccount of gedeelde persoonlijke agenda gebruiken.

Benodigde configuratie (nog niet aanwezig bij de eerste implementatie):

1. Gebruik een Google OAuth **webclient**, eventueel die uit het Chesstender-project als de eigenaar daar toegang toe heeft. De bestaande coaching-koppeling is inmiddels gevonden op branch `heropbouw`; zie de herkomst hieronder. De publieke app gebruikt uitsluitend browser-toestemming en neemt geen bestaande refresh tokens of Chesstenders-accounts over.
2. Schakel de [Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com) in voor het Google-project en configureer de OAuth-consentinstellingen. Als de app nog in testmodus staat, moeten de gebruikers als testgebruiker zijn toegevoegd.
3. Voeg de exacte JavaScript-origin `https://newtrainingpalace-git-develop-happychess.vercel.app` toe bij de OAuth-webclient. Voor lokale ontwikkeling kan de daadwerkelijk gebruikte localhost-origin worden toegevoegd. Gebruik de vaste preview-origin; een willekeurige nieuwe deployment-URL is niet automatisch toegestaan.
4. Zet de **publieke** client-ID in Vercel als `GOOGLE_CALENDAR_CLIENT_ID`, voor Preview, en deploy opnieuw. Er is geen client secret nodig voor deze browserflow. Lokaal kan dezelfde niet-geheime client-ID als procesvariabele voor `node tests/serve.cjs` worden ingesteld.
5. `GET /api/calendar-config` retourneert alleen deze publieke ID of `null`. Zonder configuratie blijft de Google-knop uitgeschakeld, maar werken de lokale agenda en notities. Geef je persoonlijke agenda niet publiek vrij om deze OAuth-koppeling te gebruiken.

Documentatie: [GIS token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model) en [Calendar events.list](https://developers.google.com/calendar/api/v3/reference/events/list).

De Google-aanmelding en API-antwoorden zijn met mocks getest (agenda kiezen, meerdere dagen, verlopen sessies en ontkoppelen). Een echte Google-koppeling is pas gevalideerd nadat een werkende clientconfiguratie en gebruikerstoestemming beschikbaar zijn.


### Hergebruik uit Happychess-Website-

Bron: [heropbouw, commit 16270541](https://github.com/Happychess/Happychess-Website-/tree/16270541ad23a8505376b5fc6edf885f7a7b3288), met de eerdere [coaching-koppeldocumentatie](https://github.com/Happychess/Happychess-Website-/blob/16270541ad23a8505376b5fc6edf885f7a7b3288/docs/COACHING-GOOGLE-CALENDAR.md).

`calendar-google.js` past de pure functies uit `lib/happychess-coaching/calendar/colors.ts` en `google.ts` aan voor deze kleinere app: veilige Google-kleuren met leesbaar contrast, evenementkleur boven agendakleur, volledige paginering met lusbeveiliging, verborgen agenda’s met minimaal leesrechten en veilige Google-links. Fouten geven geen gedeeltelijke agenda als volledig resultaat terug. Alleen de leesfuncties zijn overgenomen.

Het oude project gebruikte server-side OAuth met een ingelogd Chesstenders-account, versleutelde refresh tokens en lokale/database-opslag. Die account-/opslaglaag wordt hier niet gekopieerd; deze publieke app heeft geen eigen accounts. Ook Google-wijzigingen, lessenbeheer en database-migraties vallen niet onder deze overname.

Volgens de oorspronkelijke documentatie was het Google-project `chesstenders-calender`, met webclient ‘Chesstenders coding 2’ en consent-app in testmodus. De echte configuratiewaarden stonden uitsluitend in een genegeerd lokaal `.env.local`-bestand. In de geïnspecteerde Git-branch staat alleen `.env.example`; noch het Vercel-project `happy-chess` noch `newtrainingpalace` had Google Calendar-variabelen ingesteld tijdens deze controle. Daarom blijft de echte Google-aanmelding geblokkeerd tot de eigenaar de publieke client-ID en toegestane JavaScript-origin instelt. Geen secret of compleet .env-bestand in chat plaatsen.

Google-instellingen: [OAuth-clients van chesstenders-calender](https://console.cloud.google.com/auth/clients?project=chesstenders-calender). Voeg als JavaScript-origin toe: `https://newtrainingpalace-git-develop-happychess.vercel.app`. De browserflow gebruikt geen callback, client-secret of encryptiesleutel. De oude lokale callback kan naast de nieuwe origin blijven bestaan.
