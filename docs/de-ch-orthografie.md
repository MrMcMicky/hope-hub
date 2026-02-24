# Deutsch (Schweiz): Orthografie-Regel

Stand: 2026-02-24

## Verbindliche Regel

Für alle deutschen Fliesstexte in diesem Repo gelten Schweizer Schreibregeln mit echten Umlauten:

- korrekt: `ä`, `ö`, `ü`
- nicht erlaubt im Fliesstext: `ae`, `oe`, `ue` als Umlaut-Ersatz

Beispiele:

- `Geschützter Bereich` statt `Geschuetzter Bereich`
- `für` statt `fuer`
- `über` statt `ueber`
- `später` statt `spaeter`

## Geltungsbereich

Die Regel gilt für:

- `README.md`
- `docs/**/*.md`
- UI- und Microcopy-Texte in `src/app/**`
- Seed-/Demo-Texte in `src/lib/domain/**`

## Ausnahmen

Die Regel gilt nicht für technische Strings, die nicht frei formulierter Text sind:

- URLs
- Dateipfade
- Variablen-/Feldnamen
- ENV-Keys
- externe Bezeichner/IDs

## Qualitäts-Check vor Merge

Vor jedem Merge auf Umschreibungen prüfen und Treffer manuell bewerten:

```bash
rg -n --hidden \
  --glob '!.git' \
  --glob '!node_modules' \
  --glob '!.next' \
  --glob '!package-lock.json*' \
  -e '\b\w*(ae|oe|ue)\w*\b' \
  README.md docs src/app src/lib/domain
```

Wenn der Treffer ein deutscher Fliesstext ist: auf echte Umlaute korrigieren.
