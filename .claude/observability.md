# Walkumentary – Monitoring, Logging & Observability Plan

_Last updated: 2025-06-24_

---

## 1. Objectives

1. **Performance insight** – know latencies for LLM and TTS calls.
2. **Cost control** – track tokens, characters and $ spent in real-time.
3. **Reliability** – raise alerts when budget / rate limits / latency SLOs are breached.
4. **Self-contained** – works on a laptop **and** in production (Render API + Vercel PWA) with **no external SaaS requirement**.

---

## 2. Data we capture

| Metric                              | Source                         | Redis key prefix        | Granularity |
|-------------------------------------|--------------------------------|-------------------------|-------------|
| Total requests per service          | `UsageTracker.record_api_usage`| `usage:hourly:` etc.    | Hourly / Daily / Monthly |
| Tokens / characters used            | "                             | "                      | "           |
| Cost (USD)                          | "                             | "                      | "           |
| Latency (ms) per request **NEW**    | time diff measured around API  | " ( `total_latency_ms` ) | "           |
| Cache hits per service              | `UsageTracker.record_cache_hit`| `cache_hits:`           | Daily        |

All counters are simple JSON blobs stored in Redis DB 0 with TTLs:
* hourly ⇒ 2 h, daily ⇒ 2 days, monthly ⇒ 35 days.

---

## 3. Backend API for metrics

### 3.1 Existing
* `GET /admin/usage?period=today` – detailed JSON cost report (daily / monthly).

### 3.2 New (to implement)
| Route | Response | Purpose |
|-------|----------|---------|
| `/admin/latency?period=today` | JSON incl. `total_latency_ms` & `avg_latency_ms` per service | feed React dashboard |
| `/admin/history?days=30` | Array of past daily usage docs | charts |
| `/admin/metrics` | Prometheus text format | Prometheus / Grafana scrape |

All `/admin/*` routes are protected by `get_current_active_user` **AND** `user.is_admin`.

---

## 4. Front-end Ops dashboard

Location: `frontend/src/components/admin/OpsDashboard.tsx` and page `/admin/monitoring`.

Features:
* **Cost Today** card – total USD + progress bar vs budget ($10).
* **Latency Today** card – average ms + total requests.
* **30-day Cost Chart** (Line chart via `react-chartjs-2`).
* Auto-refresh every 60 s.

The dashboard fetches:
```ts
const today  = await api.get('/admin/latency?period=today');
const history = await api.get('/admin/history?days=30');
```

Because `NEXT_PUBLIC_API_BASE_URL` is set per environment, the component works locally and on Vercel unchanged.

---

## 5. Alerting Strategy (optional but recommended)

### 5.1 Prometheus Rules (if you scrape `/admin/metrics`)
```yaml
- alert: MonthlyBudget80Percent
  expr: (walku_total_llm_cost_usd) > 8
  for: 1h
  labels: { severity: warning }
  annotations:
    summary: "80 % of monthly budget reached"

- alert: HighLatency
  expr: rate(walku_total_llm_latency_ms[5m]) / rate(walku_total_llm_requests[5m]) > 10000 # >10 s
  for: 5m
  labels: { severity: critical }
```

### 5.2 Log-based alerts
* All usage entries are logged via `logger.info("Usage recorded …")`. Render log drains (Datadog, Logtail, etc.) can trigger queries like `@level:ERROR` or `latency_ms>10000`.

---

## 6. Local Development Workflow

1. `docker compose up redis` (or `brew install redis && redis-server`).
2. `.env` contains `REDIS_URL=redis://localhost:6379/0` (already defaulted).
3. Run `uvicorn app.main:app --reload`; open `localhost:8000/docs`.
4. Visit `http://localhost:3000/admin/monitoring` – dashboard shows live metrics as you generate tours.

---

## 7. Deployment Notes

* **Render API** – exposes `/admin/*` over the same domain; mark route "Private Service" or protect via JWT.
* **Vercel Front-end** – static Next.js page; make sure `NEXT_PUBLIC_API_BASE_URL` points to Render.
* **Prometheus** – if you want hosted monitoring, add a scrape target to `https://api-domain/admin/metrics`.

---

## 8. Future Enhancements

* Per-user quota limits (tokens / cost) enforced in `UsageTracker._check_usage_limits`.
* 95/99-percentile latency stored with HDRHistogram or Prometheus histograms.
* Export metrics to Supabase table for long-term analytical queries (BigQuery / Metabase).

---

## 9. Implementation Phases & Checklist

| Phase | Goal | Tasks | Status |
|-------|------|-------|--------|
| **0** | Baseline (already in repo) | • `UsageTracker` stores tokens/cost per period<br/>• `/admin/usage` JSON endpoint<br/>• Log lines for each usage event | ✅ Completed |
| **1** | Latency Capture | □ Add `latency_ms` arg to `record_api_usage` & aggregate `total_latency_ms`<br/>□ Wrap GPT & TTS calls with `time.perf_counter()` and pass latency | ⬜ Pending |
| **2** | Metrics Endpoints | □ `/admin/latency?period=...` JSON<br/>□ `/admin/history?days=...` JSON<br/>□ `/admin/metrics` Prometheus format | ⬜ Pending |
| **3** | Front-end Ops Dashboard | □ `OpsDashboard.tsx` component<br/>□ `/admin/monitoring` page<br/>□ Charts via `react-chartjs-2`<br/>□ Protect route with `ProtectedRoute` + `is_admin` | ⬜ Pending |
| **4** | Alerting & External Scrape | □ Prometheus scrape config example<br/>□ Sample alert rules (latency, budget)<br/>□ Docs for Render log drains | ⬜ Pending |

Legend: ✅ done & merged ⬜ to-do / in progress.  When a row is finished, change ⬜ → ✅ and move on to the next phase.

_This plan keeps monitoring fully under our control while remaining deployment-agnostic._ 