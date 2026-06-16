# Effinic — Team research brief

**Date:** June 2026  
**Purpose:** Single shareable summary of market research, product status, competitors, gaps, and recommended strategy for Sahil / Effinic.

---

## 1. Executive summary

| Track | Status | Recommendation |
|-------|--------|----------------|
| **Workflow app** (tasks, rota, incidents, nurse PIN) | Rebuild ~5hrs → demo-ready; 2 pilots at £120/mo on legacy Laravel | **Lead with this.** Proven pain, paying users. |
| **Comparison marketplace** (Go Compare for dental supplies) | Not built; data is the blocker, not UI | **Do not clone Dentago.** Only pursue with supplier deals or as workflow add-on (reorder), not standalone scrape project. |

**Market:** UK dental procurement comparison is **crowded but immature** — no clear winner. Dentago and Toothpick are the only real tech comparison plays; buying groups still own most “savings” narrative.

**Tom’s position:** Don’t work for free. Comparison POC = paid (~£1–2k). Full rebuild / founding engineer = written equity + cash terms, not vague “long run” commitment.

---

## 2. The two products (don’t mix them)

### Phase 1 — Workflow tool (live today on Laravel)

Clinical ops: daily tasks, incidents, rota, staff, templates, photos, manager dashboard, CQC-style reporting on legacy app.

- **Legacy:** Laravel on Hostinger, ~2 paying pilots (£120/mo each)
- **Rebuild:** Next.js + Supabase at `effinic/` — multi-practice, platform admin, nurse kiosk PIN, session lock, PWA
- **Docs:** `docs/roles-and-login.md`, design spec in `docs/superpowers/specs/`

### Phase 2 — Comparison site (Sahil’s original vision, not built)

Dental supply price comparison across Henry Schein, Kent Express, Dental Sky, etc.

- **Tech is easy** (search, filters, side-by-side) — **data is hard**
- Public prices ≠ contract/login prices clinics actually pay
- Dentago already built this; Toothpick entering UK with funding

---

## 3. Workflow rebuild — status vs legacy

### What’s done (parity or better)

- Daily tasks, incidents, rota (draft/publish), staff, surgeries, templates
- Manager email login + nurse practice URL → PIN → surgery
- Session lock (13:15 / 18:00), morning/end-of-day sign-off
- Task photos (Supabase), task history + CSV, reports (weekly charts + CSV)
- Multi-practice + `/platform` admin (create practice, invite manager)
- PWA (manager + per-practice nurse manifest)
- 85 unit tests, CI, E2E (7/8 with seed on remote Supabase)

### Intentionally missing / deferred

- Stock module
- CQC printable report page (charts + CSV instead)
- Compliance PDF upload (URL link only on templates)
- Staff training/expiry fields
- Template edit UI, staff edit UI (APIs exist)
- Rota AM/PM UI, drag-and-drop
- Profile / clinic logo upload
- Pilot data migration from Hostinger MySQL

### Gaps vs legacy (if pilots care)

| Gap | Impact |
|-----|--------|
| CQC report page | Medium — owners who relied on printable compliance report |
| Compliance PDF on templates | Low–medium — URL only |
| Dashboard widgets (compliance %, stock alerts) | Low — new dashboard is counts + breakdowns |
| Stock | Low per Sahil — “wasn’t really used” |

### Pre-prod before real pilots

- `CRON_SECRET` on Supabase edge function
- Cloudflare WAF on nurse auth routes
- Migrate pilot data or fresh start per clinic

---

## 4. Comparison market — competitors (verified links)

### Direct competition (live price compare / marketplace)

| Company | URL | Notes |
|---------|-----|-------|
| **Dentago** | https://www.dentago.co.uk/ | Free compare + one cart; Pro £299/mo. Closest to Sahil’s vision. |
| **Toothpick** | https://toothpick.com | Marketplace + **finance** (clinic credit). ~$8.5M funded. UK launch 2026, app-first. |
| **Dental Ordering Group** | https://dental.ordering.group/ | Pre-launch 2026; site was returning errors; claims 56-practice pilot. |

### Adjacent (not pure comparison)

| Company | URL | Model |
|---------|-----|-------|
| **Dentstock** | https://dentstock.co.uk/ | **GPO** — negotiates rates; “comparison shopping doesn’t matter” |
| **Piqqer** | https://piqqer.com | White-label procurement for dental **groups** |
| **Edge** | https://mydentaledge.com | Invoice audit — “did you overpay?” (closed beta) |
| **Denven** | https://www.denven.com | Inventory + multi-supplier quotes |

### Buying groups (discounts, not tech)

| Group | URL | Threat to comparison app |
|-------|-----|--------------------------|
| **Samera Alliance** | https://samera.co.uk/service/buying-group/ | Medium — free, 15+ partners |
| **DPL** | https://www.dplgroup.org.uk/ | Low–medium |
| **NDS / Wrights** | https://www.ndspecialists.uk/referring-dentists/buying-group/ | Low — single-supplier rebates |

**GPO = Group Purchasing Organisation** — bulk negotiated discounts, not live SKU comparison.

**Head-to-head for comparison site:** basically **Dentago + Toothpick** only.

---

## 5. Dentago deep dive (key intel)

### Company

- **dentago.co.uk** — domain ~April 2026, very new
- Claims **Dentago Ltd** (UK); not verified on Companies House / ICO at time of research
- **No public founders, funding, or traction metrics**
- Marketing: 22k products, 6 suppliers; `/customers` = 3 unverified case studies
- **Own notes (public GitHub):** ~1 signed client (Karuna Giri, NHS, Apr 2026), ~7 clinics / ~2 verified, **£0 GMV**, ~0% email reply rate

### How they get data (not just scraping)

1. **Clinic connects supplier portal logins** (encrypted) → fetch **negotiated** prices  
2. **Supplier CSV / catalogue uploads**  
3. **Public scrape** as fallback (HS, Dental Sky, DD partly working; Kent broken in main path)

Stack: Next.js, Prisma, Supabase, Vercel, Playwright `basket-worker` — same family as our rebuild.

### Public GitHub (major finding)

**Repo:** https://github.com/mercierhlc/dentago (public)

- Full app + scraper scripts (`hs-import-all-skus`, `refresh-all-public-supplier-prices`, etc.)
- Agent-orchestrated build (`WORKFLOW.md`, 262 `specs/`, `agent-orchestrator.ts`)
- Sales: call debrief, EU outreach drafts (not sent), Instantly/warming playbooks
- **2,194 email blast** referenced; weak replies
- Last commit **May 2026** — may be paused; site still live

**Takeaway:** Scraping **can work for an MVP** but is **fragile + ops-heavy**. Dentago is build-heavy, traction-light — not proof the category is won, but proof you shouldn’t underestimate engineering time.

---

## 6. Data sourcing (comparison site)

| Source | Reality |
|--------|---------|
| Weekly/monthly scrape | OK for **indicative** prices; not contract prices |
| Supplier APIs | **None public** for UK dental wholesalers (HS, Kent Express, etc.) |
| Partnership / PunchOut / EDI | Best long-term; slow sales cycle |
| Manual CSV | POC only; someone must maintain it |
| Clinic invoice / crowdsource | Messy but honest |

**Suppliers (UK):** Henry Schein, Dental Sky, Kent Express, DD Group, Wrights, DHB — clinics often have 2–3 accounts.

---

## 7. Strategic gaps & wedges

### Comparison site

**Don’t compete on:** another search box + weekly scrape.

**Possible wedges:**

- **Workflow + reorder** — nurse/stock request → manager approve → reorder (inside Effinic)
- **Quote-request** for CapEx / specialty (not live catalogue)
- **Partner / link** to Dentago for actual purchase
- **Invoice audit** angle (like Edge) — upload bills, flag overspend

### Workflow app

**Easy wins for pilots:**

- Practice URL / QR on Staff page
- Print today’s task list per surgery
- Template + staff edit UI (APIs exist)
- Duplicate rota week

**Skip unless asked:** holidays/HR module (they use payroll tools), stock (Sahil said unused).

### Platform admin

Keep `/platform` — env-gated, create practices + invite managers. Don’t rely on manual Supabase for normal ops.

---

## 8. GTM (outreach, SEO, GEO)

### Mass email (Apollo/Clay/GMaps + Instantly)

**Can work if tight; fails if spray-and-pray.**

- Target **practice managers** at **Ltd companies** (PECR: sole traders need consent)
- **500–1k verified** > 5k scraped emails
- Expect **1–3% reply**; Dentago’s own ops showed **~0%** on 2k blast
- AI personalization: one real line > five generic paragraphs
- Phone follow-up helps in dental

### SEO / GEO

- **SEO:** medium-term (compliance, task management keywords) — 6–12 months
- **GEO** (AI search): low priority now — tiny category

**Recommendation:** Sahil’s network + 2 pilots + targeted outbound first; mass email as supplement after >1% reply on test batch.

---

## 9. Deal / equity (Tom ↔ Sahil)

### What we agreed was fair

| Scope | Terms |
|-------|--------|
| **Comparison POC** | **Paid** fixed scope ~**£1–2k**, ~1–2 weeks — not equity |
| **Workflow rebuild** | **Much larger** — meaningful **cash** OR **written equity deal** (%, vesting, role, hours, milestones) |
| **Founding engineer ask** | Requires: equity % + 4yr/1yr cliff, cash or salary date, technical ownership, hours/week, exit terms — else stay **contractor** |

### Do not

- Mix comparison + workflow in one unpaid scope
- Commit as co-founder without paper
- Build comparison because Dentago “looks weak” (they’re weak on **traction**, not on **engineering**)

### Sahil context

- Bootstrapped, majority shareholder, 2 pilots at £120/mo (not 4–5)
- Legacy likely £2–4k Fiverr build; Fiverr dev for small Laravel fixes
- Competitors: Dentago (UK compare), Toothpick (funded, UK 2026), Dentstock (GPO)

---

## 10. Questions for Sahil (call checklist)

**Product**

1. Join flow OK? Platform → invite manager → staff + PIN kiosk?
2. OK to ship without stock, CQC page, PDF upload, training fields?
3. Keep `/platform` or manual Supabase only?
4. Nurses on own phones or tablet only?
5. How important is mobile / photos from phones?
6. PWA now or later? Bottom nav on mobile?
7. Reports: weekly chart + CSV enough vs old CQC report?
8. Dashboard minimal OK vs legacy widgets?
9. Top nav vs left sidebar?

**Comparison / strategy**

10. Why us vs Dentago / Toothpick / buying groups?
11. Where does pricing data come from — supplier intros?
12. Phase 2 comparison paused until workflow pilots move?

**Commercial**

13. Timeline to leave Laravel?
14. Paid rebuild vs equity / founding engineer — budget and terms?
15. Who owns prod (Supabase/Vercel)?
16. Data migration or fresh per clinic?
17. Who supports bugs post-launch?

---

## 11. One-liners for the team

**Workflow:**  
> “We have 2 paying pilots and a rebuild that matches daily ops in ~5 hours of build time. Ship workflow, migrate data, harden security — that’s the business.”

**Comparison:**  
> “Dentago gives comparison away free and spent months on supplier scrapers (public on GitHub). Toothpick has funding. Our wedge isn’t another catalogue — it’s workflow + reorder inside the practice, unless Sahil brings supplier deals.”

**Dentago:**  
> “Serious POC, ~1 real client, solo founder, agent-built — beatable on traction, not on ignoring data work.”

**Tom:**  
> “Paid for POCs. Founding engineer only with written terms. Don’t out-scrape Mercier; out-execute on workflow pilots.”

---

## 12. References

| Resource | Location |
|----------|----------|
| Roles & login | `docs/roles-and-login.md` |
| Design spec | `docs/superpowers/specs/2026-06-12-effinic-rebuild-design.md` |
| Pre-prod hardening | `docs/superpowers/plans/2026-06-12-pre-prod-hardening.md` |
| Demo script | `docs/demo-script.md` |
| Dentago (competitor) | https://www.dentago.co.uk/ |
| Dentago (public code) | https://github.com/mercierhlc/dentago |
| Legacy Laravel (reference) | Hostinger / `public_html/admin/` |

---

*Internal team doc — update as pilots, deals, or competitor landscape change.*
