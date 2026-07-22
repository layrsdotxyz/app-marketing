#!/usr/bin/env bash
# Downloads webfonts and emits a fonts.css with every face inlined as a data: URI,
# so the published Artifact renders correctly under a CSP that blocks font CDNs.
set -euo pipefail
cd "$(dirname "$0")"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
mkdir -p woff
: > fonts.css

# ── Fontshare: Zodiak (display serif) + Switzer (body grotesque) ──────────────
curl -sS -m 30 -A "$UA" \
  "https://api.fontshare.com/v2/css?f%5B%5D=zodiak@400,700&f%5B%5D=switzer@400,500,700&display=swap" \
  -o fontshare.css

# ── Google: JetBrains Mono (data / terminal voice) ────────────────────────────
curl -sS -m 30 -A "$UA" \
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" \
  -o google.css

emit () {
  # $1 = source css, $2 = family override (empty = keep declared family)
  python3 - "$1" "$2" <<'PY'
import re, sys, base64, urllib.request, pathlib, hashlib

src, fam_override = sys.argv[1], sys.argv[2]
css = pathlib.Path(src).read_text()
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"}
out = []
cache = pathlib.Path("woff")

for block in re.findall(r"@font-face\s*\{[^}]*\}", css):
    m = re.search(r"url\((['\"]?)(\S+?\.woff2)\1\)", block)
    if not m:
        continue
    url = m.group(2)
    if url.startswith("//"):
        url = "https:" + url
    fam = fam_override or re.search(r"font-family:\s*['\"]?([^;'\"]+)", block).group(1).strip()
    wt = (re.search(r"font-weight:\s*([^;]+)", block) or [None, "400"])[1].strip()
    st = (re.search(r"font-style:\s*([^;]+)", block) or [None, "normal"])[1].strip()
    if st != "normal":
        continue
    key = cache / (hashlib.sha1(url.encode()).hexdigest()[:16] + ".woff2")
    if not key.exists():
        req = urllib.request.Request(url, headers=UA)
        key.write_bytes(urllib.request.urlopen(req, timeout=30).read())
    b64 = base64.b64encode(key.read_bytes()).decode()
    print(f"  · {fam} {wt} — {len(key.read_bytes())//1024} KB", file=sys.stderr)
    out.append(
        "@font-face{font-family:'%s';font-style:normal;font-weight:%s;font-display:swap;"
        "src:url(data:font/woff2;base64,%s) format('woff2')}" % (fam, wt, b64)
    )

sys.stdout.write("\n".join(out) + "\n")
PY
}

emit fontshare.css "" >> fonts.css
emit google.css ""    >> fonts.css

echo "---"
echo "fonts.css: $(wc -c < fonts.css) bytes"
grep -o "font-family:'[^']*';font-style:normal;font-weight:[^;]*" fonts.css | sed "s/font-family://;s/font-style:normal;font-weight:/ /"
