#!/usr/bin/env bash
# إصلاح GitHub remote (404). استخدام:  USERNAME=اسم_حسابك bash scripts/set-remote.sh
set -euo pipefail
: "${USERNAME:?ضع اسم حسابك: USERNAME=xxx bash scripts/set-remote.sh}"
REPO="${REPO:-jafr-heritage}"
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${USERNAME}/${REPO}.git"
git remote -v
echo "أنشئ المستودع ${USERNAME}/${REPO} على GitHub إن لم يكن موجوداً، ثم: git push -u origin main"
