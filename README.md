# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Kuyang300/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Kuyang300/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline browser web app that turns any photo and a caption into GTA-style
multi-panel cover art, exported as a PNG to share. Made for the make.fun
`gta6-cover-art-01` bounty. No Rockstar logo, artwork or font anywhere: the
lettering is Anton and Pacifico (SIL Open Font License, vendored under
`app/fonts/`), the photos are AI-made originals, and everything runs locally —
photos never leave the machine.

## Use it

```sh
node serve.ts
# open http://localhost:8080
```

1. Add your photos (or use the three samples already loaded).
2. Pick a layout: Vice Grid (2×2), Hero Strip, or Full Bleed with a tilted snapshot.
3. Pick a grade: Sunset, Neon Night, Vice Pink, Gold Hour, Noir.
4. Type a title, subtitle and badge.
5. Click a panel to select it, drag to pan, scroll to zoom. Export PNG at
   1080×1080, 1080×1350 or 1920×1080.

Undo/redo and Shuffle are in the export panel. `?shot=cover`,
`?shot=portrait`, `?shot=square` and `?shot=editor` render fixed scenes for
screenshots (see `shots.json`).

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored
`vendor/makefun-app.ts` library.

## License

MIT (see `LICENSE`). Fonts under the SIL Open Font License (`app/fonts/OFL.txt`).
