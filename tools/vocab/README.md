# Vocabulary Size Estimator — data & verification

The app is `vocab.html` (served at `/vocab`). Everything runs in the browser; this folder
holds the reproducible data pipeline and the verification script.

| File | Purpose |
|---|---|
| `build_ranking.py` | Builds an approximate word-family frequency ranking from `wordfreq` + `lemminflect`. |
| `items.txt` | Hand-written item bank: word, part of speech, definition, example, Arabic gloss, AWL flag. Words were sampled at random from each band, then screened. |
| `pseudowords.txt` | Candidate made-up words. Rejected automatically if they appear in the corpus or lexicon, or are one letter from a common word. |
| `build_bank.py` | Assigns each item its band from the ranking and writes `js/vocab/bank.js`. |
| `test_engine.js` | Formula unit checks and a simulation study (bias, 95% CI coverage, stratification, pseudoword handling, resume). |

## Rebuild

```sh
python3 -m venv venv && ./venv/bin/pip install -r tools/vocab/requirements.txt
./venv/bin/python tools/vocab/build_ranking.py > tools/vocab/ranking.json   # ~2 MB, not committed
./venv/bin/python tools/vocab/build_bank.py tools/vocab/ranking.json > js/vocab/bank.js
node tools/vocab/test_engine.js
```

## Honest status

- The ranking is **not** the BNC/COCA list, the NGSL or the COCA list. It is an independent approximation built
  on the same principles, from `wordfreq` 3.1 data.
- The bank has 444 real words (38–51 per band) and 47 pseudowords.
- The estimator has been checked **only by simulation**. It has not been validated with real learners
  against an established test.
