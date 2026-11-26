# yt – lange YouTube-Videos (Version 1.4.1)

Einstündige, ruhige „satisfying“ Videos im Querformat 1920×1080 aus dem Talfahrt Studio 3.5 (ruhiger Klang), für Wiedergabestunden im YouTube-Partnerprogramm. Zweimal pro Woche rendert eine geplante Aufgabe ein neues Video und lädt es öffentlich auf @talfahrt-dev hoch.

- `pool.json`: Szenen mit Gewicht, Studio-Einstellungen und englischem Kapitelnamen, dazu die Farbpaletten.
- `plan.mjs`: wählt Szenen, bis die Ziellänge erreicht ist (keine Szene zweimal hintereinander, keine Maschine dreimal, eine starke Szene zuerst). Die Längen kommen aus dem Studio selbst. Etwa jede dritte Szene bekommt eine gemeinfreie Melodie, die mit jedem Treffer einen Ton weiterspielt (im Dezember auch Jingle Bells und Stille Nacht).
- `segments.mjs`: rendert die Szenen hochkant (1080×1920, 30 Bilder/s, ohne Höhenlinien), überspringt fertige; mit `WORKERS=2 WORKER=0|1` teilen sich zwei Prozesse die Arbeit.
- `land.sh`: macht aus einer Szene ein Querformat-Stück (Kammer links, Logo, Zähler und Fortschritt rechts, je 1 s Blende, Lautheit −16 LUFS).
- `build.sh` und `meta.py`: setzen alles zu `long.mp4` zusammen und schreiben `meta.json` (Titel, Beschreibung mit Kapiteln, Tags).
- `run.sh`: alles in einem, mit zwei Render-Prozessen; setzt nach einem Abbruch fort. Fortschritt in `run.log`.
- `drop.sh`: legt das fertige Video in Teilen bis 90 MB auf den Branch `yt-drop` (wird jedes Mal ersetzt) und gibt die Raw-URLs aus.
- `history.jsonl`: was wann hochgeladen wurde.

Rendern dauert etwa 2 bis 2,5 Stunden je Stunde Video (zwei Kerne), Zusammensetzen etwa 30 Minuten.
