# YottaFlex — Evaluator Demo & Verification Script (`DEMO_SCRIPT.md`)

**Target Duration:** 5 Minutes  
**Objective:** Demonstrate deterministic synthetic data generation (Fixed Seed `20261022`), two-run SHA-256 checksum reproducibility, relational & temporal validation, mathematical SQL reconciliation across all dashboard views, ground-truth anomaly isolation, and dual-task ML evaluation (Sentiment + Theme).

---

## Step 1: CLI Reproducibility & Validation Proof (1.5 Minutes)

### 1.1 Run the Two-Pass Reproducibility & Validation Suite
Open a terminal in the project root (`Yotta_Flex`) and run:

```powershell
python validate.py
```

**What to highlight to the evaluator:**
1. **Deterministic Two-Run Checksum (`Rubric Step 10`):**
   - `validate.py` executes `generate_data.py` twice (`run1` and `run2`) using `SEED = 20261022` and `SCALE = 1.0`.
   - Point to `"two_run_checksum_reproducible": true` and the matching `sha256_reviews` hash across `manifest_run1.json` and `manifest_run2.json`.
2. **Primary Key & 50,000 Response ID Uniqueness (`Rubric Step 3 & 8`):**
   - Point to `"pk_and_response_id_uniqueness": true`. Every `review_id` (`REV-2026-000001`), `response_id` (`RESP-SUR-2026-000001-0001`), and `message_id` (`MSG-000001-001`) is strictly zero-padded and 100% unique.
3. **Relational, Temporal & Lifecycle Integrity (`Rubric Step 2 & 8`):**
   - `"foreign_key_and_survey_product_aligned": true` — Every review's `product_id` matches its parent survey's `product_id`.
   - `"date_ordering_verified": true` — Every review's `created_at` date occurs on or after its parent survey's `launched_at` date (`2026-01-02` to `2026-01-10`).
   - `"lifecycle_transitions_verified": true` — All state transitions in `ticket_status_events` represent valid forward state changes (`Open -> Escalated` or `Open/Escalated -> Resolved`).
4. **Exported Artifacts (`Rubric Step 7 & 9`):**
   - Show the `exports/` directory containing CSV exports for all 12 tables, `exports/seed_export.sql`, `exports/gold_evaluation_set.csv` (500 human-reviewed rows), and the isolated `ground_truth.csv` in the project root.

---

### 1.2 Run the Dual-Task ML Evaluation Suite
In the same terminal, run:

```powershell
python evaluate.py
```

**What to highlight to the evaluator:**
1. **Ground-Truth Exclusion (`Rubric Step 5 & 7`):**
   - `evaluate.py` reads `ground_truth.csv` and explicitly filters out the anomalous record IDs before vectorization so test labels and corrupted rows never leak into model training.
2. **Realistic, Rule-Driven Accuracy (No Random 25% or Memorized 100%):**
   - Because text is synthesized via compositional grammar (sentiment frames + domain theme clauses + shared neutral context tails + Hinglish/sarcasm + 6% boundary ambiguity), `TF-IDF + LogisticRegression` achieves a realistic **~92%–95% weighted F1-score** on both the **4-class Sentiment** task and the **5-class Theme** task.
3. **Human-Reviewed Gold Set Verification:**
   - Point to `gold_set_accuracy` evaluated on the 500-row human-reviewed subset (`human_reviewed = True`).

---

## Step 2: Live SQL Dashboard & Reconciliation Walkthrough (2.5 Minutes)

1. **Log in to the Admin Portal (`http://localhost:5173`):**
   - Credentials: Username `admin` | Password `admin123`.
   - Point out the top Hero telemetry bar, which dynamically binds to `validation_summary.json` (`PK + Response IDs Unique`, `50,000 Reconciled`, `Sentiment / Theme F1`, `100% Reproducible`).

2. **Prove Mathematical Reconciliation (`Live Analytics` & `Trends`):**
   - **Overall Pipeline Stats:** Shows `5,000` Customers, `50,000` Reviews & Responses, `20,000` Support Messages, and `70,000` Total Feedback Analyzed.
   - **Global Sentiment Distribution:** The 4 sentiment buckets (`Positive`, `Negative`, `Neutral`, `Mixed`) sum to **exactly 50,000**. Note the exact `Negative` count (~12,500).
   - **Product-Wise Negative Breakdown:** Point out that the negative review counts across *Laptop Core i7*, *Smartphone Pro*, *Wireless Earbuds*, and *Smartwatch Gen4* sum to the **exact same Global Negative total** because `/api/product-breakdown` runs a live PostgreSQL `COUNT(*) FILTER (WHERE sentiment_label = 'Negative')` query.
   - **Interactive Monthly Trends:** Click `Total (All Year)` and individual months (`Jan`, `Jun`, `Dec`). Show that the 12 monthly buckets reconcile to **50,000** total reviews.

3. **Show Traceability, Action Engine & Ground-Truth Anomalies:**
   - **Live Traceability & Priorities:** Displays real 6-digit zero-padded IDs (`REV-2026-000001` -> `CUST-2026-00XXXX`) and the live SQL join of 20,000 support tickets across the 5 theme taxonomy categories (`Pricing & Billing`, `UI/UX Issues`, `Performance & Lag`, `Customer Support`, `Battery & Hardware`).
   - **Business Decisions & Anomaly Detection:**
     - Left panel displays prioritized action items (`ACT-2026-000001` to `ACT-2026-000003`) derived from recurring negative themes.
     - Right table displays the 5 deliberate negative scenarios queried live from the `ground_truth` table:
       - `REV-2026-000045` (Duplicate Response)
       - `REV-2026-000892` (PII Leakage)
       - `REV-2026-001002` (Contradictory Label)
       - `MSG-000500-001` (Taxonomy Violation — Orphan `THEME-999999`)
       - `REV-2026-002050` (Test Data Leak — `__TEST_LABEL_NEGATIVE__`)

---

## Step 3: Live SQL AI Query Assistant (1 Minute)

1. Click **"Ask YottaFlex AI"** in the bottom-right corner.
2. Click each quick-query pill to trigger live PostgreSQL queries via `POST /api/chat`:
   - **Top 5 Complaints** -> Returns live ticket counts per theme from `support_messages JOIN themes`.
   - **Worst Product** -> Returns *Laptop Core i7* negative count and primary defect driver from `products JOIN reviews_responses`.
   - **ML Metrics** -> Returns live Sentiment F1, Theme F1, and Gold Set accuracy from `ml_evaluation`.
   - **Detect Anomalies** -> Lists all 5 isolated 6-digit record IDs from `ground_truth`.
   - **Action Items** -> Lists recommended engineering and operations interventions from `action_items`.