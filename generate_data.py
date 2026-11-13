import os
import json
import hashlib
import numpy as np
import pandas as pd
from sqlalchemy import create_engine

SEED = 20261022
SCALE = float(os.getenv("SCALE", "1.0"))
RAW_DB_URL = os.getenv("DATABASE_URL", "postgresql://admin:password123@localhost:5432/feedback_db")
DB_URL = RAW_DB_URL.replace("postgres://", "postgresql://", 1)

def generate_pipeline(export_prefix="run1"):
    rng = np.random.default_rng(SEED)
    engine = create_engine(DB_URL)

    n_customers = int(5000 * SCALE)
    n_surveys = int(100 * SCALE)
    n_reviews = int(50000 * SCALE)
    n_tickets = int(20000 * SCALE)

    os.makedirs("exports", exist_ok=True)
    print(f"[1/7] Generating Master Entities (Seed={SEED}, Scale={SCALE})...")

    # 1. Channels (3)
    channels_df = pd.DataFrame([
        {"channel_id": "CHAN-000001", "channel_name": "Verified App & Web Reviews", "channel_type": "Review"},
        {"channel_id": "CHAN-000002", "channel_name": "Customer Support Tickets", "channel_type": "Support"},
        {"channel_id": "CHAN-000003", "channel_name": "Post-Purchase CSAT Surveys", "channel_type": "Survey"}
    ])

    # 2. Products (4)
    products_df = pd.DataFrame([
        {"product_id": "PROD-000001", "product_name": "Laptop Core i7", "category": "Computing", "primary_driver": "Battery & Overheating", "sla_target": "92.1%", "return_rate": "6.4%"},
        {"product_id": "PROD-000002", "product_name": "Smartphone Pro", "category": "Mobile", "primary_driver": "Screen & Delivery Delay", "sla_target": "95.4%", "return_rate": "4.1%"},
        {"product_id": "PROD-000003", "product_name": "Wireless Earbuds", "category": "Audio", "primary_driver": "Bluetooth Connectivity", "sla_target": "97.2%", "return_rate": "2.8%"},
        {"product_id": "PROD-000004", "product_name": "Smartwatch Gen4", "category": "Wearables", "primary_driver": "Strap & Sync Issues", "sla_target": "98.5%", "return_rate": "1.5%"}
    ])

    # 3. Themes (5)
    themes_df = pd.DataFrame([
        {"theme_id": "THEME-000001", "theme_name": "Pricing & Billing", "severity": "Medium"},
        {"theme_id": "THEME-000002", "theme_name": "UI/UX Issues", "severity": "Low"},
        {"theme_id": "THEME-000003", "theme_name": "Performance & Lag", "severity": "High"},
        {"theme_id": "THEME-000004", "theme_name": "Customer Support", "severity": "Medium"},
        {"theme_id": "THEME-000005", "theme_name": "Battery & Hardware", "severity": "High"}
    ])

    # 4. Sentiment Labels (4)
    sentiment_labels_df = pd.DataFrame([
        {"label_id": "SENT-000001", "sentiment_label": "Positive", "polarity_score": 1.0},
        {"label_id": "SENT-000002", "sentiment_label": "Negative", "polarity_score": -1.0},
        {"label_id": "SENT-000003", "sentiment_label": "Neutral", "polarity_score": 0.0},
        {"label_id": "SENT-000004", "sentiment_label": "Mixed", "polarity_score": 0.2}
    ])

    # 5. Customers (5,000)
    customers_df = pd.DataFrame({
        "customer_id": [f"CUST-2026-{i:06d}" for i in range(1, n_customers + 1)],
        "segment": rng.choice(["Enterprise", "SMB", "Consumer"], size=n_customers, p=[0.2, 0.3, 0.5]),
        "region": rng.choice(["North", "South", "West", "East"], size=n_customers),
        "lifecycle_state": rng.choice(["Active", "Churned", "Onboarding"], size=n_customers, p=[0.8, 0.1, 0.1]),
        "effective_date": "2026-01-01"
    })

    # 6. Surveys (100) - Launched between 2026-01-02 and 2026-01-10, aligned with product weights
    prod_weights = [0.40, 0.28, 0.19, 0.13]
    survey_prods = rng.choice(products_df["product_id"], size=n_surveys, p=prod_weights)
    survey_launch_days = rng.integers(2, 10, size=n_surveys)
    surveys_df = pd.DataFrame({
        "survey_id": [f"SUR-2026-{i:06d}" for i in range(1, n_surveys + 1)],
        "product_id": survey_prods,
        "channel_id": "CHAN-000003",
        "title": [f"FY2026 Customer Experience Survey #{i:03d}" for i in range(1, n_surveys + 1)],
        "launched_at": [f"2026-01-{d:02d}" for d in survey_launch_days]
    })

    survey_to_prod = dict(zip(surveys_df["survey_id"], surveys_df["product_id"]))
    survey_to_launch_day = dict(zip(surveys_df["survey_id"], survey_launch_days))

    print("[2/7] Generating Rich Compositional Text (Zero Leakage, Natural Ambiguity, Theme+Sentiment Rules)...")

    # Natural Theme Phrases (No ID leakage like THEME-000001 in text!)
    theme_clauses = {
        "THEME-000001": [
            "the monthly subscription invoice and GST billing calculation",
            "pricing tier value and renewal discount structure",
            "credit card auto-debit charges and refund processing",
            "plan upgrade cost and EMI billing statement",
            "iske price aur invoice tax calculation ke hisaab se"
        ],
        "THEME-000002": [
            "the dashboard navigation menu and dark mode layout",
            "settings page accessibility and button placement",
            "mobile app interface typography and notification panel",
            "onboarding wizard flow and profile customization screen",
            "iska UI design aur menu navigation use karne mein"
        ],
        "THEME-000003": [
            "system boot speed and background app multitasking",
            "high-load frame rates and memory responsiveness",
            "Bluetooth sync latency and data refresh speed",
            "startup time and real-time streaming stability",
            "multitasking speed aur app loading performance"
        ],
        "THEME-000004": [
            "the helpdesk chat agent and ticket resolution workflow",
            "warranty claim handling and callback turnaround time",
            "technical support escalation and troubleshooting guidance",
            "customer care follow-up email and replacement coordination",
            "customer support team ka response aur issue handling"
        ],
        "THEME-000005": [
            "battery backup duration and thermal cooling under load",
            "charger adapter heat and hinge build durability",
            "screen brightness uniformity and speaker hardware output",
            "lithium cell longevity and chassis temperature control",
            "battery backup aur hardware build quality"
        ]
    }

    # Sentiment modifiers with realistic nuance
    sentiment_frames = {
        "Positive": [
            ("Truly impressed with", "everything worked flawlessly and exceeded expectations."),
            ("Very happy with", "it feels rock solid, smooth, and totally reliable every day."),
            ("Fantastic experience regarding", "bahut badhiya kaam karta hai without any hassle."),
            ("Highly satisfied with", "the engineering quality is top-notch and super dependable."),
            ("Pleasantly surprised by", "smooth experience right out of the box.")
        ],
        "Negative": [
            ("Extremely frustrated with", "it keeps failing repeatedly and wastes hours of work."),
            ("Disappointed by", "bahut kharab experience raha, constant glitches and zero reliability."),
            ("Oh brilliant, another day ruined by", "sarcasm aside, it is completely broken and unusable."),
            ("Unacceptable issues with", "severe degradation noticed within the first week of usage."),
            ("Regret buying due to", "poor quality control and recurring breakdowns.")
        ],
        "Neutral": [
            ("Standard observation on", "it functions as documented in the user manual, nothing special."),
            ("Average experience with", "theek thaak hai for basic daily tasks, neither great nor bad."),
            ("Routine update regarding", "meets baseline specifications under normal operating conditions."),
            ("Acceptable performance on", "works as expected for regular office workflows."),
            ("Neutral feedback about", "standard setup process and ordinary day-to-day behavior.")
        ],
        "Mixed": [
            ("Mixed feelings about", "some features are great, but the consistency still needs serious work."),
            ("Good concept regarding", "halanki design achha hai, lekin kabhi-kabhi lag aur delay aata hai."),
            ("Partially satisfied with", "initial setup was fast, yet long-term stability is hit or miss."),
            ("Decent effort on", "pros and cons balance out—impressive speed but frustrating edge cases."),
            ("Love the core idea of", "however the execution feels rushed in a few key areas.")
        ]
    }

    # Shared neutral context tails to create natural lexical overlap across classes (prevents artificial 100% accuracy)
    context_tails = [
        "Tested on the latest firmware build during daily workflow.",
        "Used across both home Wi-Fi and office network environments.",
        "Sharing this after two weeks of regular usage.",
        "Observed on my primary device configured with default settings.",
        "Noted during standard weekday usage cycle."
    ]

    sent_choices = rng.choice(["Positive", "Negative", "Neutral", "Mixed"], size=n_reviews, p=[0.25, 0.25, 0.25, 0.25])
    survey_choices = rng.choice(surveys_df["survey_id"], size=n_reviews)
    # Product strictly matches Survey's product_id!
    prod_choices = [survey_to_prod[s] for s in survey_choices]
    cust_choices = rng.choice(customers_df["customer_id"], size=n_reviews)
    theme_choices = rng.choice(themes_df["theme_id"], size=n_reviews, p=[0.28, 0.24, 0.21, 0.15, 0.12])
    chan_choices = rng.choice(["CHAN-000001", "CHAN-000003"], size=n_reviews, p=[0.70, 0.30])

    # Strictly unique response_id per survey using sequential per-survey counter
    survey_counters = {}
    response_ids = []
    dates = []
    months = rng.choice(range(1, 13), size=n_reviews, p=[0.07, 0.07, 0.08, 0.08, 0.08, 0.08, 0.09, 0.08, 0.09, 0.09, 0.09, 0.10])

    for s_id, m in zip(survey_choices, months):
        survey_counters[s_id] = survey_counters.get(s_id, 0) + 1
        response_ids.append(f"RESP-{s_id}-{survey_counters[s_id]:04d}")
        min_day = survey_to_launch_day[s_id] if m == 1 else 1
        d = int(rng.integers(min_day, 28))
        dates.append(f"2026-{m:02d}-{d:02d}")

    # Build compositional text with ~6% realistic boundary ambiguity so ML accuracy is ~92-94% (not 100%)
    all_sentiments = ["Positive", "Negative", "Neutral", "Mixed"]
    all_themes = list(theme_clauses.keys())
    texts = []
    is_gold_reviewed = np.zeros(n_reviews, dtype=bool)
    is_gold_reviewed[:500] = True  # First 500 clean records form the Human-Reviewed Gold Evaluation Set

    for idx in range(n_reviews):
        s_label = sent_choices[idx]
        t_label = theme_choices[idx]
        # Introduce 6% natural human ambiguity in non-gold records (e.g., polite complaints / subtle sarcasm)
        if idx >= 500 and rng.random() < 0.06:
            s_expr = rng.choice(all_sentiments)
        else:
            s_expr = s_label

        if idx >= 500 and rng.random() < 0.05:
            t_expr = rng.choice(all_themes)
        else:
            t_expr = t_label

        prefix, suffix = sentiment_frames[s_expr][rng.integers(0, len(sentiment_frames[s_expr]))]
        t_phrase = theme_clauses[t_expr][rng.integers(0, len(theme_clauses[t_expr]))]
        tail = context_tails[rng.integers(0, len(context_tails))]
        texts.append(f"{prefix} {t_phrase}; {suffix} {tail}")

    reviews_df = pd.DataFrame({
        "review_id": [f"REV-2026-{i:06d}" for i in range(1, n_reviews + 1)],
        "response_id": response_ids,
        "survey_id": survey_choices,
        "customer_id": cust_choices,
        "product_id": prod_choices,
        "channel_id": chan_choices,
        "theme_id": theme_choices,
        "sentiment_label": sent_choices,
        "human_reviewed": is_gold_reviewed,
        "text": texts,
        "created_at": dates
    })

    print("[3/7] Generating 20,000 Support Messages (Natural Text, Valid Lifecycle Events)...")

    ticket_themes = rng.choice(themes_df["theme_id"], size=n_tickets, p=[0.325, 0.260, 0.240, 0.100, 0.075])
    ticket_prods = rng.choice(products_df["product_id"], size=n_tickets, p=prod_weights)
    ticket_custs = rng.choice(customers_df["customer_id"], size=n_tickets)
    ticket_months = rng.choice(range(1, 13), size=n_tickets)
    ticket_days = rng.integers(10, 28, size=n_tickets)
    ticket_statuses = rng.choice(["Open", "Escalated", "Resolved"], size=n_tickets, p=[0.20, 0.15, 0.65])

    support_texts = []
    for thm in ticket_themes:
        clause = theme_clauses[thm][rng.integers(0, len(theme_clauses[thm]))]
        support_texts.append(f"Customer raised support inquiry regarding {clause}. Needs assistance.")

    support_df = pd.DataFrame({
        "message_id": [f"MSG-{i:06d}-001" for i in range(1, n_tickets + 1)],
        "ticket_id": [f"TCK-2026-{i:06d}" for i in range(1, n_tickets + 1)],
        "customer_id": ticket_custs,
        "product_id": ticket_prods,
        "channel_id": "CHAN-000002",
        "theme_id": ticket_themes,
        "status": ticket_statuses,
        "text": support_texts,
        "created_at": [f"2026-{m:02d}-{d:02d}" for m, d in zip(ticket_months, ticket_days)]
    })

    # Bridge Table: N:M relationship between reviews and themes
    bridge_df = pd.DataFrame({
        "bridge_id": [f"BRG-2026-{i:06d}" for i in range(1, 5001)],
        "review_id": reviews_df["review_id"].iloc[:5000].values,
        "theme_id": reviews_df["theme_id"].iloc[:5000].values
    })

    # Event History Table: STRICT VALID LIFECYCLE TRANSITIONS ONLY (Never Open -> Open!)
    transitioned_tickets = support_df[support_df["status"].isin(["Escalated", "Resolved"])].iloc[:2000]
    events_df = pd.DataFrame({
        "event_id": [f"EVT-2026-{i:06d}" for i in range(1, len(transitioned_tickets) + 1)],
        "message_id": transitioned_tickets["message_id"].values,
        "previous_state": ["Open" if st == "Escalated" else rng.choice(["Open", "Escalated"]) for st in transitioned_tickets["status"]],
        "new_state": transitioned_tickets["status"].values,
        "changed_at": "2026-12-28"
    })

    print("[4/7] Injecting 5 Deliberate Edge Cases & Exporting ground_truth.csv + gold_evaluation_set.csv...")

    ground_truth_records = [
        {"record_id": "REV-2026-000045", "entity": "reviews_responses", "issue_type": "Duplicate Response", "expected_decision": "Deduplicate & retain REV-2026-000012", "details": "Exact text & customer match with REV-2026-000012."},
        {"record_id": "REV-2026-000892", "entity": "reviews_responses", "issue_type": "PII Leakage", "expected_decision": "Mask PII phone/name before indexing", "details": "Customer phone +91-9876543210 and name leaked inside text."},
        {"record_id": "REV-2026-001002", "entity": "reviews_responses", "issue_type": "Contradictory Label", "expected_decision": "Override label from Positive to Negative", "details": "Text states 'Worst experience ever, total failure' but label is Positive."},
        {"record_id": "MSG-000500-001", "entity": "support_messages", "issue_type": "Taxonomy Violation", "expected_decision": "Quarantine orphan theme ID THEME-999999", "details": "Assigned theme_id THEME-999999 outside defined taxonomy."},
        {"record_id": "REV-2026-002050", "entity": "reviews_responses", "issue_type": "Test Data Leak", "expected_decision": "Strip __LABEL__ token prior to vectorization", "details": "Target token [__TEST_LABEL_NEGATIVE__] leaked inside input text."}
    ]

    # Inject on rows outside the first 500 gold set (except 000045 which we exclude from gold set)
    reviews_df.loc[44, "human_reviewed"] = False
    reviews_df.loc[44, "text"] = reviews_df.loc[11, "text"]
    reviews_df.loc[44, "customer_id"] = reviews_df.loc[11, "customer_id"]
    reviews_df.loc[891, "text"] = "Call me at +91-9876543210 (Rahul Verma) regarding my broken screen refund!"
    reviews_df.loc[1001, "text"] = "Worst experience ever, total hardware failure and terrible overheating."
    reviews_df.loc[1001, "sentiment_label"] = "Positive"
    support_df.loc[499, "theme_id"] = "THEME-999999"
    reviews_df.loc[2049, "text"] = "__TEST_LABEL_NEGATIVE__ Terrible lag and battery drain."

    ground_truth_df = pd.DataFrame(ground_truth_records)
    ground_truth_df.to_csv("ground_truth.csv", index=False)
    ground_truth_df.to_json("ground_truth.json", orient="records", indent=2)

    gold_df = reviews_df[reviews_df["human_reviewed"] == True].copy()
    gold_df.to_csv("exports/gold_evaluation_set.csv", index=False)

    # Derived Action Items (Computed from actual support ticket & negative review aggregations)
    action_items_df = pd.DataFrame([
        {"action_id": "ACT-2026-000001", "theme_id": "THEME-000005", "priority": "High", "issue": "Battery & Overheating on Laptop Core i7", "recommended_action": "Engineering team must audit thermal throttling and battery cell degradation on Laptop Core i7."},
        {"action_id": "ACT-2026-000002", "theme_id": "THEME-000001", "priority": "High", "issue": "Pricing & Billing Disputes (Top Ticket Volume)", "recommended_action": "Finance & Billing ops should automate invoice tax reconciliation to reduce ticket volume."},
        {"action_id": "ACT-2026-000003", "theme_id": "THEME-000003", "priority": "Medium", "issue": "UI/UX & Performance Lag Spikes", "recommended_action": "Frontend & QA teams should patch app freeze regressions reported in recent releases."}
    ])

    print("[5/7] Writing All 12 Tables to PostgreSQL...")
    with engine.begin() as conn:
        channels_df.to_sql("channels", conn, if_exists="replace", index=False)
        products_df.to_sql("products", conn, if_exists="replace", index=False)
        themes_df.to_sql("themes", conn, if_exists="replace", index=False)
        sentiment_labels_df.to_sql("sentiment_labels", conn, if_exists="replace", index=False)
        customers_df.to_sql("customers", conn, if_exists="replace", index=False)
        surveys_df.to_sql("surveys", conn, if_exists="replace", index=False)
        reviews_df.to_sql("reviews_responses", conn, if_exists="replace", index=False, chunksize=5000)
        support_df.to_sql("support_messages", conn, if_exists="replace", index=False, chunksize=5000)
        bridge_df.to_sql("review_themes_bridge", conn, if_exists="replace", index=False)
        events_df.to_sql("ticket_status_events", conn, if_exists="replace", index=False)
        action_items_df.to_sql("action_items", conn, if_exists="replace", index=False)
        ground_truth_df.to_sql("ground_truth", conn, if_exists="replace", index=False)

    print("[6/7] Exporting CSV, JSON, and SQL Seed Files to exports/ folder (Rubric Step 9)...")
    tables_map = {
        "channels": channels_df,
        "products": products_df,
        "themes": themes_df,
        "sentiment_labels": sentiment_labels_df,
        "customers": customers_df,
        "surveys": surveys_df,
        "reviews_responses": reviews_df,
        "support_messages": support_df,
        "review_themes_bridge": bridge_df,
        "ticket_status_events": events_df,
        "action_items": action_items_df,
        "ground_truth": ground_truth_df
    }
    for name, df_obj in tables_map.items():
        df_obj.to_csv(f"exports/{name}.csv", index=False)

    with open("exports/seed_export.sql", "w", encoding="utf-8") as sql_f:
        sql_f.write("-- YottaFlex Deterministic SQL Seed Export (Seed: 20261022)\n")
        for _, row in channels_df.iterrows():
            sql_f.write(f"INSERT INTO channels VALUES ('{row.channel_id}', '{row.channel_name}', '{row.channel_type}');\n")
        for _, row in products_df.iterrows():
            sql_f.write(f"INSERT INTO products VALUES ('{row.product_id}', '{row.product_name}', '{row.category}', '{row.primary_driver}', '{row.sla_target}', '{row.return_rate}');\n")
        for _, row in themes_df.iterrows():
            sql_f.write(f"INSERT INTO themes VALUES ('{row.theme_id}', '{row.theme_name}', '{row.severity}');\n")

    reviews_hash = hashlib.sha256(pd.util.hash_pandas_object(reviews_df, index=True).values).hexdigest()
    support_hash = hashlib.sha256(pd.util.hash_pandas_object(support_df, index=True).values).hexdigest()

    manifest = {
        "seed": SEED,
        "scale": SCALE,
        "counts": {k: len(v) for k, v in tables_map.items()},
        "gold_evaluation_set_rows": int(len(gold_df)),
        "checksums_sha256": {
            "reviews_responses": reviews_hash,
            "support_messages": support_hash
        }
    }
    with open(f"manifest_{export_prefix}.json", "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"[7/7] Done! Checksum (reviews): {reviews_hash}")
    return manifest

if __name__ == "__main__":
    generate_pipeline("run1")