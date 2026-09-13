# Rex Relax — 60-minute continuous editions

Twenty extended versions of the credited recordings. Each file contains one composition at its original playback speed, with overlapping musical repeats and gentle opening/closing fades. These are extended edits, not newly composed tracks.

| Recording | Artist | Original source |
|---|---|---|
| Acoustic Revelation | Indieteur | [Source](https://opengameart.org/content/revelation) |
| Lifewave Piano | The Cynic Project | [Source](https://opengameart.org/content/calm-ambient-3-lifewave-2k) |
| Peaceful Town | haruta | [Source](https://opengameart.org/content/peaceful-town-1) |
| Plains of Luminescence | vitalezzz | [Source](https://opengameart.org/content/plains-of-luminescence) |
| Another August | The Cynic Project | [Source](https://opengameart.org/content/another-august) |
| Gentle Piano | Wolfgang_ | [Source](https://opengameart.org/content/regret-short-emotional-piano) |
| Peaceful Ville | Bobjt | [Source](https://opengameart.org/content/peacefull-ville) |
| Pretty Jazz | Alex McCulloch / Pro Sensory | [Source](https://opengameart.org/content/pretty) |
| Frets & Strings | Alex McCulloch / Pro Sensory | [Source](https://opengameart.org/content/frets) |
| Classical Pop | Alex McCulloch / Pro Sensory | [Source](https://opengameart.org/content/classical-pop-instrumental) |
| Dream Melody | jkjkke | [Source](https://opengameart.org/content/mainmenu-music) |
| I Do Know | Memoraphile | [Source](https://opengameart.org/content/i-do-know) |
| Vaporware Piano | The Cynic Project | [Source](https://opengameart.org/content/calm-piano-1-vaporware) |
| Gone Fishin' Chill | iamoneabe | [Source](https://opengameart.org/content/gone-fishin-0) |
| November Snow | The Cynic Project | [Source](https://opengameart.org/content/november-snow) |
| Calm Journey | The Cynic Project | [Source](https://opengameart.org/content/calm-ambient-1-synthwave-4k) |
| Next to You | Joth | [Source](https://opengameart.org/content/next-to-you) |
| Near and Far | Joth | [Source](https://opengameart.org/content/near-and-far) |
| Sirens in Darkness | The Cynic Project | [Source](https://opengameart.org/content/sirens-in-darkness) |
| Fantasy Orchestra | Joth | [Source](https://opengameart.org/content/fantasy-orchestral-theme) |

The build recipe and original source SHA-256 values are in `scripts/rex-60min-masters.json`. Source-page licence links, where verified, are recorded in `docs/rex-60min-credits.json`.

## Build and verification

Run `npm ci`, then `npm run build`. The build fetches the hash-pinned source recordings and produces the twenty complete MP3 files in `orbit/rex-relax/music-60/`. It fails if a source changes or any recording is incomplete. There is no runtime fallback to the short originals.

Each output is 44.1-kHz stereo MP3 at 192 kbps, approximately 86.4 MB. The full collection is about 1.73 GB. The media is generated during the existing Vercel build, rather than stored as large Git blobs or uploaded into Wix storage.

The repeat period is aligned to 1152-sample MPEG-1 Layer III frames. Warmed encoder periods with the bit reservoir disabled are assembled into a complete recording, preserving sample continuity without repeating encoder padding. First and final sections carry separately rendered fades. A Xing seek table is written for seeking to the middle/end.

`node scripts/verify-rex-player.cjs` tests both Therapy Mode and Wix integration, including all twenty one-hour selections, pause/resume, seeking, end-of-session behaviour, and rejecting short files. `python scripts/verify-rex-masters.py` verifies all file hashes and durations, and decodes every distinct encoded period including both fades. `--full` decodes the repeated periods as well. Four full-length decode checks also passed during production (Acoustic Revelation, Lifewave Piano, Plains of Luminescence, Another August).

The five 90-minute guided sessions, prices, client storage and consent workflows remain unchanged.
