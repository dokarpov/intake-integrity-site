#!/usr/bin/env python3
"""Fail closed on likely secrets and organization-specific identifiers in publishable files."""
import pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
FILES = ("index.html", "decision-lab.html", "setup.html", "preview/index.html", "preview/operator.html", "preview/tokens.css", "preview/integrations.html", "mvp/index.html", "mvp/engine.mjs", "testing/integrity/index.html", "testing/integrity/engine.mjs", "testing/integrity/policy.mjs")
RULES = {
 "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"),
 "credential assignment": re.compile(r"(?i)(?:api[_-]?key|client[_-]?secret|access[_-]?token|password)\s*[:=]\s*['\\\"][^'\\\"]{8,}['\\\"]"),
 "authorization bearer": re.compile(r"(?i)authorization\s*[:=]\s*['\\\"]?bearer\s+[a-z0-9._-]{12,}"),
 "GitHub token": re.compile(r"gh[pousr]_[A-Za-z0-9_]{20,}"),
 "OpenAI key": re.compile(r"sk-(?:proj-)?[A-Za-z0-9_-]{20,}"),
 "legacy organization": re.compile(r"(?i)singularity|singular-226|skyeng|4dev"),
 "personal contact": re.compile(r"(?i)dokarpov@gmail\.com"),
 "legacy sample": re.compile(r"(?i)maria ivanova|artem ivanov|79991234567"),
}
bad = []
for name in FILES:
    path = ROOT / name
    if not path.is_file():
        bad.append((name, "missing required public file"))
        continue
    content = path.read_text(encoding="utf-8")
    for label, pattern in RULES.items():
        if pattern.search(content):
            bad.append((name, label))
for path, label in bad:
    print(f"BLOCK: {path}: {label}", file=sys.stderr)
if bad:
    sys.exit(1)
print("Public source scan passed. This does not audit Git history or prove absence of secrets.")
