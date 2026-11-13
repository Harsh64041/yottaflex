import os
import json
import pandas as pd
from sqlalchemy import create_engine
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

SEED = 20261022
RAW_DB_URL = os.getenv("DATABASE_URL", "postgresql://admin:password123@localhost:5432/feedback_db")
DB_URL = RAW_DB_URL.replace("postgres://", "postgresql://", 1)

def run_real_evaluation():
    engine = create_engine(DB_URL)
    reviews_df = pd.read_sql("SELECT review_id, text, sentiment_label, theme_id, human_reviewed FROM reviews_responses", engine)
    themes_df = pd.read_sql("SELECT theme_id, theme_name FROM themes", engine)
    theme_map = dict(zip(themes_df["theme_id"], themes_df["theme_name"]))

    gt_df = pd.read_csv("ground_truth.csv")
    excluded_ids = set(gt_df["record_id"].tolist())

    clean_df = reviews_df[~reviews_df["review_id"].isin(excluded_ids)].copy()
    clean_df["theme_name"] = clean_df["theme_id"].map(theme_map)

    vectorizer = TfidfVectorizer(max_features=1500, ngram_range=(1, 2))
    X = vectorizer.fit_transform(clean_df["text"])

    # 1. SENTIMENT CLASSIFICATION EVALUATION
    y_sent = clean_df["sentiment_label"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_sent, test_size=0.20, random_state=SEED, stratify=y_sent
    )
    clf_sent = LogisticRegression(random_state=SEED, max_iter=300)
    clf_sent.fit(X_train, y_train)
    y_pred = clf_sent.predict(X_test)

    acc = round(accuracy_score(y_test, y_pred) * 100, 2)
    prec = round(precision_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)
    rec = round(recall_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)
    f1 = round(f1_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)

    # 2. THEME CLASSIFICATION EVALUATION (Rubric requirement: sentiment/theme metrics are measurable)
    y_thm = clean_df["theme_name"]
    Xt_train, Xt_test, yt_train, yt_test = train_test_split(
        X, y_thm, test_size=0.20, random_state=SEED, stratify=y_thm
    )
    clf_thm = LogisticRegression(random_state=SEED, max_iter=300)
    clf_thm.fit(Xt_train, yt_train)
    yt_pred = clf_thm.predict(Xt_test)

    theme_acc = round(accuracy_score(yt_test, yt_pred) * 100, 2)
    theme_f1 = round(f1_score(yt_test, yt_pred, average="weighted", zero_division=0) * 100, 2)

    # 3. HUMAN-REVIEWED GOLD SET EVALUATION
    gold_sub = clean_df[clean_df["human_reviewed"] == True]
    X_gold = vectorizer.transform(gold_sub["text"])
    gold_acc = round(accuracy_score(gold_sub["sentiment_label"], clf_sent.predict(X_gold)) * 100, 2)

    report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    class_rows = []
    for label in ["Positive", "Negative", "Neutral", "Mixed"]:
        if label in report_dict:
            class_rows.append({
                "label": label,
                "precision": f"{report_dict[label]['precision']*100:.1f}%",
                "recall": f"{report_dict[label]['recall']*100:.1f}%",
                "f1": f"{report_dict[label]['f1-score']*100:.1f}%",
                "support": int(report_dict[label]["support"])
            })

    eval_payload = {
        "model_name": "TF-IDF + Logistic Regression (Dual Sentiment & Theme Classifier)",
        "seed": SEED,
        "test_sample_size": int(len(y_test)),
        "gold_set_size": int(len(gold_sub)),
        "gold_set_accuracy": gold_acc,
        "ground_truth_excluded": len(excluded_ids),
        "overall": {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "theme_accuracy": theme_acc,
            "theme_f1_score": theme_f1
        },
        "class_report": class_rows
    }

    with open("evaluation_metrics.json", "w") as f:
        json.dump(eval_payload, f, indent=2)

    with engine.begin() as conn:
        pd.DataFrame([{"payload": json.dumps(eval_payload)}]).to_sql("ml_evaluation", conn, if_exists="replace", index=False)

    print("=== REAL ML EVALUATION COMPLETE (SENTIMENT + THEME) ===")
    print(json.dumps(eval_payload["overall"], indent=2))

if __name__ == "__main__":
    run_real_evaluation()