#!/usr/bin/env bash
# Pubblica il tree corrente su magiaslab/cruscotto-comune (branch main, history nuova).
# Uso: GITHUB_PAT=ghp_... ./scripts/publish-new-repo.sh
# Non tocca master di san-vincenzo-cruscotto.
set -euo pipefail

OWNER="${GITHUB_OWNER:-magiaslab}"
REPO="${GITHUB_REPO_NAME:-cruscotto-comune}"
DESC="Template open data per dashboard comunali italiane + minisito Cruscotto Comune"
HOMEPAGE="https://www.cruscottocomune.it"
TOKEN="${GITHUB_PAT:-${GH_TOKEN:-${GITHUB_TOKEN:-}}}"

if [[ -z "${TOKEN}" ]]; then
  echo "Serve GITHUB_PAT (scope repo) per creare/pushare ${OWNER}/${REPO}." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API="https://api.github.com"
AUTH=(-H "Authorization: Bearer ${TOKEN}" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28")

code="$(curl -sS -o /tmp/cc-repo.json -w "%{http_code}" "${AUTH[@]}" "${API}/repos/${OWNER}/${REPO}")"
if [[ "${code}" == "404" ]]; then
  echo "Creo ${OWNER}/${REPO}…"
  create_code="$(curl -sS -o /tmp/cc-create.json -w "%{http_code}" "${AUTH[@]}" -X POST "${API}/user/repos" \
    -d "$(python3 - <<PY
import json
print(json.dumps({
  "name": "${REPO}",
  "description": """${DESC}""",
  "homepage": "${HOMEPAGE}",
  "private": False,
  "has_issues": True,
  "has_projects": False,
  "has_wiki": False,
  "auto_init": False,
}))
PY
)")"
  if [[ "${create_code}" != "201" ]]; then
    echo "Creazione repo fallita (HTTP ${create_code}):" >&2
    cat /tmp/cc-create.json >&2
    exit 1
  fi
elif [[ "${code}" != "200" ]]; then
  echo "Impossibile leggere ${OWNER}/${REPO} (HTTP ${code}):" >&2
  cat /tmp/cc-repo.json >&2
  exit 1
else
  echo "Repo ${OWNER}/${REPO} già esistente."
fi

# Template repository + homepage
curl -sS -o /tmp/cc-patch.json "${AUTH[@]}" -X PATCH "${API}/repos/${OWNER}/${REPO}" \
  -d "$(python3 - <<PY
import json
print(json.dumps({
  "description": """${DESC}""",
  "homepage": "${HOMEPAGE}",
  "is_template": True,
  "has_wiki": False,
  "has_projects": False,
}))
PY
)" >/dev/null || true

STAGING="$(mktemp -d)"
cleanup() { rm -rf "${STAGING}"; }
trap cleanup EXIT

echo "Archivio tree corrente in history nuova…"
git archive HEAD | tar -x -C "${STAGING}"
cd "${STAGING}"
git init -q
git checkout -q -b main
git add -A
git -c user.name="Alessandro Cipriani" -c user.email="cipriani.alessandro@gmail.com" \
  commit -q -m "Initial: Cruscotto Comune template + minisito"

REMOTE="https://x-access-token:${TOKEN}@github.com/${OWNER}/${REPO}.git"
git remote add origin "${REMOTE}"
git push -u origin main
echo "Push ok → https://github.com/${OWNER}/${REPO}"
