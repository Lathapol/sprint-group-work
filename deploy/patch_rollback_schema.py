#!/usr/bin/env python3
"""Add the WITHDRAWN enum value to a historical app schema for safe rollback reads."""
import re
import sys
from pathlib import Path

schema = Path(sys.argv[1])
text = schema.read_text(encoding="utf-8")
pattern = r"(enum\s+RequestState\s*\{)(.*?)(\n\})"
match = re.search(pattern, text, flags=re.S)
if not match:
    raise SystemExit("RequestState enum not found in historical Prisma schema")
body = match.group(2)
if re.search(r"^\s*WITHDRAWN\s*$", body, flags=re.M):
    print(f"{schema}: WITHDRAWN already present")
else:
    body = body.rstrip() + "\n  WITHDRAWN\n"
    text = text[:match.start(2)] + body + text[match.end(2):]
    schema.write_text(text, encoding="utf-8")
    print(f"{schema}: added WITHDRAWN")
