---
id: 007
title: Upload real cover images for schools into Strapi
layer: data
kind: build
slice: every school has a coverImage served by Strapi
target: schooltest-api (upload + school.coverImage)
contract: C-SEARCH-SCHOOLS (coverImage populated)
status: DONE
depends_on: [001]
---
## Objective
User: "uplaod to strpai iamges od fschoiols". 311/312 schools have no coverImage. Generate
branded cover art per school (real image files, school name + brand palette — an honest
generated cover, recorded as seed content in DECISIONS.md) and persist each through the
real Strapi upload pipeline + school.coverImage relation.
## Files
- schooltest-api: new script (e.g. scripts/seed-school-covers.mjs or a bootstrap module run
  via strapi console) that: renders PNG covers (ImageMagick `convert` is available on host —
  verify, else pure-JS PNG), uploads via the upload plugin service, sets school.coverImage
  via strapi.documents('api::school.school').update.
## Steps
1. Generate 312 distinct PNGs (name + deterministic palette variant) into a temp dir.
2. Upload each via the real upload service; link to the school by documentId.
3. Verify via POST /api/search/schools: hits carry coverImage.url; files table grows by 312.
## Done criteria
- >=312 files rows; every school search hit has coverImage.url that serves 200 from the API;
  card covers render in the web UI (screenshot).
## Evidence
files=371 (312 new); files_related_mph field='coverImage' = 312; all 312 search hits carry
coverImage.url (1200x675 PNG); GET one uploaded cover -> 200 image/png. Auto-committed by the
external sweep as api 4a9dfa3. OP-36 in schooltest-api/.qa/DECISIONS.md.
