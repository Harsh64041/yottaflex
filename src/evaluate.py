import os
import json
import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

SEED = 20261022
DB_URL = os.getenv("DATABASE_URL", "postgresql://admin:password123@localhost:5432/feedback_db")

def run_evaluation():
    engine = create_engine(DB_URL)
    # Strictly exclude ground_truth anomalies from model evaluation
    query = """
        SELECT review_id, text, sentiment_label 
        FROM reviews_responses 
        WHERE COALESCE(is_anomaly, FALSE) = FALSE;
    """
    df = pd.read_sql(query, engine)
    print(f"[ML EVAL] Loaded {len(df)} clean records (Ground-Truth anomalies excluded).")

    vectorizer = TfidfVectorizer(max_features=1500, ngram_range=(1, 2))
    X = vectorizer.fit_transform(df["text"].astype(str))
    y = df["sentiment_label"].astype(str)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=SEED, stratify=y
    )

    clf = LogisticRegression(random_state=SEED, max_iter=300)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)

    acc = round(accuracy_score(y_test, y_pred) * 100, 2)
    prec = round(precision_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)
    rec = round(recall_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)
    f1 = round(f1_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)

    report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    class_rows = []
    for label in ["Positive", "Negative", "Neutral", "Mixed"]:
        if label in report_dict:
            class_rows.append({
                "label": label,
                "precision": f"{report_dict[label]['precision']*100:.1f}%",
                "recall": f"{report_dict[label]['recall']*100:.1f}%",
                "f1": f"{report_dict[label]['f1-score']*100:.1f}%",
                "support": int(report_dict[label]['support'])
            })

    output = {
        "model_name": "TF-IDF + Logistic Regression (scikit-learn)",
        "seed": SEED,
        "test_sample_size": int(len(y_test)),
        "overall": {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1
        },
        "class_report": class_rows
    }

    with open("evaluation_metrics.json", "w") as f:
        json.dump(output, f, indent=2)

    # Also store in DB so backend server.js can read it directly
    pd.DataFrame([{"payload": json.dumps(output)}]).to_sql("ml_evaluation_results", engine, if_exists="replace", index=False)
    print(f"[ML EVAL COMPLETE] Real Accuracy: {acc}% | F1-Score: {f1}% (Saved to DB & evaluation_metrics.json)")

if __name__ == "__main__":
    run_evaluation()