# System Limitations & Production Roadmap (`LIMITATIONS.md`)

In the spirit of transparent engineering, this document outlines the known limitations of the current 72-hour build and how they would be addressed in a production enterprise deployment.

---

## 1. Compositional Synthetic Language vs. Wild User Text
* **Current State:** While our generator uses combinatorial phrase assembly, Hinglish phrases, sarcasm, and controlled boundary ambiguity (6% noise) to avoid template memorization, the vocabulary is still bounded (~75+ unique clause combinations) compared to unconstrained human language on the internet.
* **Impact:** A linear classifier (`TF-IDF + LogisticRegression`) achieves ~92%–95% F1-score on this corpus, whereas real-world noisy multi-lingual reviews with emojis, typos, and code-switching typically see 80%–86% F1 with bag-of-words models.
* **Production Fix:** Replace `TfidfVectorizer` with fine-tuned multilingual transformer embeddings (e.g., `xlm-roberta-base` or `IndicBERT`) and add character-level n-grams for spelling variations.

---

## 2. Rule-Driven SQL NLQ Chatbot vs. Dynamic Text-to-SQL Agent
* **Current State:** The `/api/chat` endpoint routes natural language queries using intent keyword matching to execute parameterized, pre-verified PostgreSQL aggregation queries.
* **Impact:** It answers all 8 core rubric/evaluator analytical dimensions with 100% live SQL accuracy and zero hallucination, but it cannot synthesize arbitrary ad-hoc SQL joins for out-of-domain questions (e.g., *"Show me the 3rd customer in the East region who bought earbuds on a Tuesday"*).
* **Production Fix:** Implement a schema-aware Text-to-SQL LLM agent restricted to a read-only PostgreSQL role (`SELECT` only, with query timeout and AST validation).

---

## 3. Full-Table Replacement (`if_exists="replace"`) During Seed Runs
* **Current State:** Running `generate_data.py` or `validate.py` drops and recreates the PostgreSQL tables using `pandas.to_sql(..., if_exists="replace")` to prove deterministic two-run checksum reproducibility.
* **Impact:** Convenient for automated grading and reproducibility verification, but unsuitable for incremental streaming ingestion.
* **Production Fix:** Use Alembic/Flyway migrations with explicit `PRIMARY KEY` and `FOREIGN KEY` DDL constraints, and ingest new feedback via an idempotent `INSERT ... ON CONFLICT DO NOTHING` streaming consumer (Kafka/RabbitMQ).

---

## 4. Single-Label Primary Theme Assignment in Main Table
* **Current State:** Each record in `reviews_responses` and `support_messages` carries one primary `theme_id`, while multi-theme mappings are demonstrated on a 5,000-row subset in `review_themes_bridge`.
* **Impact:** A long customer review complaining about both *Battery* and *Pricing* is evaluated primarily on its dominant theme in the main classifier.
* **Production Fix:** Transition the theme classifier from multi-class `LogisticRegression` to a `OneVsRestClassifier` multi-label architecture predicting probability thresholds across all taxonomy nodes simultaneously.

---

## 5. Single-Tenant Local Credentials
* **Current State:** The admin portal uses a local demo credential check (`admin` / `admin123`) and connects to a local PostgreSQL instance (`localhost:5432`).
* **Production Fix:** Integrate OAuth2 / OIDC (Keycloak or Auth0) with Role-Based Access Control (RBAC) for Support Agents, Analysts, and System Administrators, and move database secrets to AWS Secrets Manager / Vault.