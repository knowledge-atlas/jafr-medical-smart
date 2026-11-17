#!/usr/bin/env python3
"""يبني my-jafr-app-FINAL-OWNER-UNLOCK-READY.zip من المجلد الحالي، ويستبعد الملفات غير اللازمة."""
import os, sys, zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(ROOT), "my-jafr-app-FINAL-OWNER-UNLOCK-READY.zip")
SKIP_DIRS = {"node_modules", "android", "ios", ".expo", "_backup_old", "dist", "build", ".git"}
SKIP_SUFFIX = (".bak",)
SKIP_CONTAINS = (".bak-", "prebuild.log")

def skip(rel):
    parts = rel.split(os.sep)
    if any(p in SKIP_DIRS for p in parts[:-1]):
        return True
    name = parts[-1]
    return name.endswith(SKIP_SUFFIX) or any(c in name for c in SKIP_CONTAINS) or name == ".env" or name.startswith("diff ===")

count = 0
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for d, dirs, files in os.walk(ROOT):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
        for f in files:
            full = os.path.join(d, f)
            rel = os.path.relpath(full, ROOT)
            if skip(rel) or full == OUT:
                continue
            z.write(full, os.path.join("my-jafr-app-FINAL", rel))
            count += 1
print(f"تم: {OUT}  ({count} ملفاً)")
