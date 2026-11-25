# reels

Tägliche Studio-Reels für @talfahrt.dev, Version 1.2.0.

- `render.mjs` rendert headless ein Video aus dem Talfahrt Studio. Mit `VARIANT=<id>` eine feste Variante aus `variants.json`, sonst ein zufälliges Preset (gewichtet: Bänder, Presse und Klingen vor dem Rest). `PREVIEW=1` rendert schnell in 720p30.
- `variants.json` enthält die kuratierten Varianten (Studio-Preset plus Einstellungen, Szene und Hashtags für die Caption, Feiertags-Varianten).
- `plan.json` ist der Indien-Test ab 25.11.2026: vier Uhrzeiten (A 09:41, B 12:41, C 14:41, D 16:41 deutscher Zeit, in Indien 4,5 Stunden später) und wechselnde Varianten. Am 4.12. wählt die tägliche Aufgabe die beste Uhrzeit und die drei besten Varianten und schreibt sie nach `result`.
- `check.sh` prüft Länge, Format, Ton und Dekodierbarkeit und schreibt ein Kontaktbild.
- `drop.sh` legt das fertige Video als einzige Datei auf den Branch `drop`, von dem Instagram es abholt. Der Branch wird jeden Tag ersetzt, das Repo wächst also nicht.
- `history.jsonl` hält fest, was wann gepostet wurde (mit Uhrzeit, Slot und Variante).
- `stats.jsonl` sammelt bei jedem Lauf die Zahlen der Reels der letzten zehn Tage (Aufrufe, Reichweite, Wiedergabezeit, Absprungrate), daraus kommen die 24-Stunden-Werte für die Auswertung.
