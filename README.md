# Training Palace

Eerste persoonlijke prototype: dagelijkse checklist, gevoelscheck en dagboek.

## Starten

Geen installatie of betaalde dienst nodig. Vanuit deze map:

```sh
python3 -m http.server 3000 --bind 0.0.0.0
```

Open de app via je lokale ontwikkelomgeving op poort 3000.

Gegevens worden lokaal in de browser opgeslagen, per kalenderdag. Geen account, serveropslag of synchronisatie. Het dagboek heeft een tekstexport. Browsergegevens wissen verwijdert de opgeslagen gegevens. Gebruik voor een dagboek op een gedeeld toestel een eigen browserprofiel; opslag is niet versleuteld. Lettertypen worden via Google Fonts geladen, met systeemlettertypen als fallback.

Dit prototype bevat nog geen macrocalculator, trainingsschema of contentplanning.

## Vercel-preview

Importeer deze repository in Vercel, kies `Other` als framework en gebruik de repository-root. `vercel.json` bouwt uitsluitend de drie webbestanden naar `dist/`; er zijn geen dependencies of secrets voor de app nodig. Gebruik `develop` voor previews.

Een preview-URL is niet vanzelf privé. Activeer Vercel Authentication onder Settings → Deployment Protection voor previews, en controleer in een uitgelogde browser dat de app afgeschermd is voordat je de link privé noemt. Publiceer deze versie niet als onbeveiligde productieomgeving wanneer je privétoegang wilt. De noindex-header voorkomt geen toegang.

Dagboekgegevens horen bij de browser én het domein. Een nieuwe preview-URL neemt de gegevens van een eerdere URL niet over. Gebruik de tekstexport om notities veilig te bewaren.
