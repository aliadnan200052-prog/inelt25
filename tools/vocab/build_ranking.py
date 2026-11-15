"""
Build an approximate word-family frequency ranking for the vocabulary estimator.

Source of frequencies: the `wordfreq` package (Robyn Speer et al.), which
aggregates several large English corpora (Wikipedia, OpenSubtitles, SUBTLEX,
news, books via Google Books Ngrams, Reddit, Twitter, ...). This is NOT the
BNC/COCA family list of Paul Nation; it is an independent, reproducible
approximation of it, built here with documented rules.

Steps
1. Take the top 150,000 word forms from wordfreq (English).
2. Keep alphabetic forms that lemminflect's lexicon recognises (this drops
   most proper nouns, abbreviations and internet tokens), plus a fixed list of
   function words that lemminflect does not lemmatise.
3. Collapse inflections onto their lemma (Bauer & Nation level 2).
4. Collapse a small set of transparent derivations onto a base when the base
   is frequent enough (approximates level 3 of Bauer & Nation):
   -ly (adj->adv), -ness, -ity, -ment, -ion/-ation, -er/-or (agent), -able,
   -ful, -less, un-, non- ; plus re-, over-, under-, in-, dis-, mis-, pre-,
   out- only when the base is >=100x more frequent (reimpose -> impose,
   but not recall -> call). A short exception list blocks known false
   merges (business, station, partner, ...).
5. Rank families by summed frequency, write JSON.

Usage:  python build_ranking.py > ranking.json
"""
import json, re, sys
from collections import defaultdict
from wordfreq import top_n_list, word_frequency
from lemminflect import getAllLemmas

FUNCTION_WORDS = """a an the this that these those some any no every each either neither both all
half much many more most few less least other another such what which who whom whose
i me my mine myself you your yours yourself yourselves he him his himself she her hers herself
it its itself we us our ours ourselves they them their theirs themselves one ones
and or but nor so yet for because although though if unless whether while whereas since
as than then when where why how once till until
of in on at to from by with without within into onto upon about above below under over
across after before behind beside besides between beyond during except inside outside
near off out past round through throughout toward towards up down along among around
against via per despite like unlike
not there here also too very just only even still already yet ever never always often
can could may might must shall should will would ought
zero two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen
sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety
hundred thousand million billion first second third
yes no oh hello please thanks okay""".split()

DERIV = [  # (suffix, replacements to try for the base, required POS of base)
    ("ly",    ["", "le", "e"],            {"ADJ"}),
    ("ily",   ["y"],                      {"ADJ"}),
    ("ness",  [""],                       {"ADJ"}),
    ("iness", ["y"],                      {"ADJ"}),
    ("ity",   ["", "e"],                  {"ADJ"}),
    ("ment",  ["", "e"],                  {"VERB"}),
    ("ation", ["", "e", "ate"],           {"VERB"}),
    ("ion",   ["", "e"],                  {"VERB"}),
    ("er",    ["", "e", "DOUBLE"],        {"VERB"}),
    ("or",    ["", "e"],                  {"VERB"}),
    ("able",  ["", "e", "DOUBLE"],        {"VERB"}),
    ("ful",   [""],                       {"NOUN"}),
    ("less",  [""],                       {"NOUN"}),
]
PREFIXES = ["un", "non"]              # merged whenever the base is more frequent
STRICT_PREFIXES = ["re", "over", "under", "in", "im", "dis", "mis", "pre", "out"]
STRICT_RATIO = 100                     # base must be >=100x more frequent (avoids relate->late, recall->call)
NEVER_MERGE = {"letter", "business", "series", "corner", "station", "nation", "lesson",
               "mention", "fashion", "session", "mission", "motion", "potion", "lotion",
               "ration", "portion", "union", "onion", "opinion", "region", "religion",
               "million", "billion", "lion", "under", "uncle", "unit", "unity",
               "partner", "flower", "tension", "passion", "notion", "department"}
SUFFIX_RATIO = 0.25   # a derived form may be up to 4x as frequent as its base
                      # (development > develop) and still join the base family

def lemma_info(w):
    d = getAllLemmas(w)
    if not d:
        return None
    pos_order = ["VERB", "NOUN", "ADJ", "ADV", "AUX", "PROPN"]
    for p in pos_order:
        if p in d:
            return d[p][0], p
    p = next(iter(d))
    return d[p][0], p

def main():
    forms = top_n_list("en", 150000)
    fam_freq = defaultdict(float)
    fam_forms = defaultdict(set)
    lemma_pos = defaultdict(set)
    fw = set(FUNCTION_WORDS)
    for f in forms:
        if not re.fullmatch(r"[a-z]+", f) or (len(f) == 1 and f not in ("a", "i")):
            continue
        if f in fw:
            lem, pos = f, "FUNC"
        else:
            info = lemma_info(f)
            if not info:
                continue
            lem, pos = info
            if not re.fullmatch(r"[a-z]+", lem):
                continue
        fq = word_frequency(f, "en")
        fam_freq[lem] += fq
        fam_forms[lem].add(f)
        for p in (getAllLemmas(lem) or {}):
            lemma_pos[lem].add(p)
        if pos == "FUNC":
            lemma_pos[lem].add("FUNC")

    form_to_lemma = {f: l for l, fs in fam_forms.items() for f in fs if f != l}
    # derivational collapse (process least frequent first so chains resolve)
    parent = {}
    def find(x):
        while x in parent:
            x = parent[x]
        return x
    for lem in sorted(fam_freq, key=lambda x: fam_freq[x]):
        if lem in NEVER_MERGE or "FUNC" in lemma_pos[lem]:
            continue
        cands = []
        for suf, reps, need in DERIV:
            if lem.endswith(suf) and len(lem) - len(suf) >= 3:
                stem = lem[: -len(suf)]
                for r in reps:
                    if r == "DOUBLE":
                        if len(stem) >= 2 and stem[-1] == stem[-2]:
                            cands.append((stem[:-1], need, SUFFIX_RATIO))
                    else:
                        cands.append((stem + r, need, SUFFIX_RATIO))
        anyp = {"ADJ", "NOUN", "VERB", "ADV"}
        for pre in PREFIXES:
            if lem.startswith(pre):
                cands.append((lem[len(pre):], anyp, 1))
        for pre in STRICT_PREFIXES:
            if lem.startswith(pre):
                cands.append((lem[len(pre):], anyp, STRICT_RATIO))
        for base, need, *ratio in cands:
            ratio = ratio[0] if ratio else 1
            base = form_to_lemma.get(base, base)   # e.g. un+painted -> paint
            if len(base) >= 4 and base in fam_freq and base != lem \
               and (lemma_pos[base] & need) and fam_freq[base] > ratio * fam_freq[lem]:
                parent[lem] = base
                break

    families = defaultdict(lambda: {"freq": 0.0, "members": set()})
    for lem, fq in fam_freq.items():
        root = find(lem)
        families[root]["freq"] += fq
        families[root]["members"].add(lem)
        families[root]["members"].update(fam_forms[lem])

    ranked = sorted(families.items(), key=lambda kv: -kv[1]["freq"])
    out = []
    for i, (head, d) in enumerate(ranked[:25000], 1):
        out.append({"rank": i, "head": head, "pos": sorted(lemma_pos[head]),
                    "zipf": round(__import__("math").log10(d["freq"]) + 9, 2),
                    "members": sorted(d["members"])})
    json.dump(out, sys.stdout)

if __name__ == "__main__":
    main()
