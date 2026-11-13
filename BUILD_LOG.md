# YottaFlex — 72-Hour Engineering Build Log (`BUILD_LOG.md`)

Chronological engineering log documenting schema design, synthetic data generation, bug fixes, rubric audits, and full-stack reconciliation during the 72-hour challenge.

---

## Phase 1: Schema Architecture & Baseline Generator (Hours 0 – 18)
* **Objective:** Establish the PostgreSQL relational foundation and deterministic Python synthesis script.
* **Key Deliverables:**
  - Designed 12 relational tables covering all required entities: `customers`, `products`, `channels`, `surveys`, `reviews_responses`, `support_messages`, `themes`, `sentiment_labels`, `action_items`, `review_themes_bridge`, `ticket_status_events`, and `ground_truth`.
  - Implemented `generate_data.py` using `numpy.random.default_rng(20261022)` and parameterized `SCALE=1.0` to generate 5,000 customers, 100 surveys, 50,000 reviews/responses, and 20,000 support messages.
  - Built initial Express.js backend (`backend/server.js`) and React + Tailwind CSS + Recharts dashboard (`src/App.jsx`).

---

## Phase 2: Full-Stack Analytical Modules & UI Expansion (Hours 19 – 42)
* **Objective:** Expose business decisions, product-level breakdowns, monthly trends, and interactive querying on the dashboard.
* **Key Deliverables & Fixes:**
  - Added **Product-Wise Negative Breakdown** bar chart and root-cause SLA/return-rate diagnostics.
  - Built **Interactive Monthly Trends** (`Jan`–`Dec` + `Total` selector) with full-year trajectory visualization.
  - Added **Action Engine** (`action_items`) and **Ground-Truth Anomalies Detected** table (`ground_truth`).
  - Implemented the floating **YottaFlex SQL AI Engine** chat interface with quick-query pills.
  - **Bug Fix (`42703: column "theme" does not exist`):** Normalized `support_messages` to join `themes` on `s.theme_id = t.theme_id` rather than querying a non-existent `theme` column.
  - Upgraded layout to a `max-w-[1600px]` widescreen 12-column grid with zero-latency `framer-motion` scroll reveals.

---

## Phase 3: Deep Rubric Audit & Mathematical Reconciliation (Hours 43 – 62)
* **Objective:** Audit the entire data package and API layer against strict rubric acceptance criteria and eliminate all synthetic/UI discrepancies.
* **Audit Issues Identified & Resolved:**
  1. **Eliminated Hardcoded Fallback Mismatches:**
     - *Issue:* Earlier fallback arrays in `server.js` had monthly trends summing to 63,800 (vs. 50,000 reviews) and product negative counts summing to 7,710 (vs. ~12,500 global negatives).
     - *Fix:* Removed hardcoded fallbacks and rewrote `/api/trends`, `/api/product-breakdown`, `/api/channels`, `/api/themes`, and `/api/chat` to run 100% live PostgreSQL `COUNT(*) FILTER (WHERE ...)` aggregations.
  2. **Fixed 100% Memorization & Label Leakage in Text Synthesis:**
     - *Issue:* Using 16 static template strings caused `LogisticRegression` to memorize templates (`100.0%` accuracy) and leaked `[Ref:...]` / `THEME-...` tags into text.
     - *Fix:* Built a compositional grammar combining sentiment frames, natural domain phrases per theme, shared neutral context tails, Hinglish/sarcasm, and a controlled 6% boundary ambiguity rate. Removed all ID tags from text, yielding a realistic **~92%–95% F1-score**.
  3. **Added Dual-Model Evaluation (Sentiment + Theme) & Gold Set:**
     - *Issue:* Only sentiment was evaluated by `evaluate.py`.
     - *Fix:* Upgraded `evaluate.py` to train and evaluate both a 4-class **Sentiment Classifier** and a 5-class **Theme Classifier**, plus a 500-row human-reviewed gold evaluation set (`exports/gold_evaluation_set.csv`).
  4. **Guaranteed 100% Unique `response_id` & Strict 6-Digit IDs:**
     - *Issue:* Modulo arithmetic (`i % 500`) caused `response_id` collisions, and anomaly IDs used 5 digits (`REV-2026-00045`).
     - *Fix:* Implemented per-survey sequential counters (`RESP-SUR-2026-000001-0001`) so all 50,000 `response_id` values are unique, and standardized all anomaly IDs to 6 digits (`REV-2026-000045`, `REV-2026-000892`, `REV-2026-001002`, `MSG-000500-001`, `REV-2026-002050`).
  5. **Enforced Survey-Product Alignment, Date Ordering & Lifecycle Rules:**
     - *Fix:* Linked `review.product_id` directly to `survey.product_id`, constrained `review.created_at >= survey.launched_at`, and restricted `ticket_status_events` to valid forward transitions (`previous_state != new_state`).

---

## Phase 4: Environment Stabilization & Final Packaging (Hours 63 – 72)
* **Environment & Build Fixes:**
  - Installed and aligned Python 3.12 Windows virtual environment packages (`sqlalchemy`, `psycopg`, `psycopg-binary`, `pyarrow`, `pandas`, `numpy`, `scipy`, `scikit-learn`).
  - Resolved Vite OXC JSX parse error on line 741 of `src/App.jsx` by replacing raw `>=` inside JSX text.
  - Automated CSV exports for all 12 tables and SQL seed export (`exports/seed_export.sql`).
  - Wired live `validation_summary.json` (`validate.py`) and `evaluation_metrics.json` (`evaluate.py`) payloads into PostgreSQL and the React dashboard.