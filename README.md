# reels

Tägliche Studio-Reels für @talfahrt.dev, Version 1.0.0.

- `render.mjs` rendert headless ein zufälliges Video aus dem Talfahrt Studio (gewichtet: Bänder vor Presse vor dem Rest).
- `check.sh` prüft Länge, Format, Ton und Dekodierbarkeit und schreibt ein Kontaktbild.
- `drop.sh` legt das fertige Video als einzige Datei auf den Branch `drop`, von dem Instagram es abholt. Der Branch wird jeden Tag ersetzt, das Repo wächst also nicht.
- `history.jsonl` hält fest, was wann gepostet wurde.
