import pandas as pd
import numpy as np
from faker import Faker
import random
import os
import logging
from sqlalchemy import create_engine, exc
from time import sleep

# --- PROFESSIONAL SETUP: LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Fixed Seed for Reproducibility
SEED = 20261022
fake = Faker(['en_US', 'hi_IN'])
Faker.seed(SEED)
random.seed(SEED)
np.random.seed(SEED)

SCALE = 1.0 # Testing scale
NUM_CUSTOMERS = int(5000 * SCALE)
NUM_REVIEWS_RESPONSES = int(50000 * SCALE)
NUM_SUPPORT_MSGS = int(20000 * SCALE)

# --- DATABASE CONNECTION ---
DB_URL = os.getenv("DATABASE_URL", "postgresql://admin:password123@db:5432/feedback_db")

def get_engine():
    """Retry logic to wait for PostgreSQL to boot up"""
    engine = create_engine(DB_URL)
    for i in range(15):
        try:
            with engine.connect():
                logger.info("Connected to PostgreSQL successfully!")
                return engine
        except exc.OperationalError:
            logger.warning(f"Database booting up, waiting 3 seconds... (Attempt {i+1}/15)")
            sleep(3)
    raise Exception("Database failed to start in time.")

def generate_master_data():
    logger.info("Generating Master Data...")
    customers = pd.DataFrame([{'customer_id': f"CUST-2026-{str(i).zfill(6)}", 'name': fake.name(), 'email': fake.email()} for i in range(1, NUM_CUSTOMERS + 1)])
    products = pd.DataFrame([{'product_id': f"PROD-{str(i+1).zfill(4)}", 'name': p, 'category': 'SaaS'} for i, p in enumerate(['Cloud Hosting', 'Payment Gateway', 'CRM Software', 'Analytics API', 'Email Service'])])
    channels = pd.DataFrame([{'channel_id': f"CHAN-{str(i+1).zfill(4)}", 'channel_name': c} for i, c in enumerate(['Web', 'Mobile App', 'API', 'Social Media', 'Email'])])
    themes = pd.DataFrame([{'theme_id': f"THEME-{str(i+1).zfill(6)}", 'theme_name': t} for i, t in enumerate(['Pricing', 'UI/UX', 'Performance', 'Customer Support', 'Downtime', 'Feature Request'])])
    sentiments = pd.DataFrame([{'label_id': f"LBL-{str(i+1).zfill(4)}", 'sentiment': s} for i, s in enumerate(['Positive', 'Neutral', 'Negative', 'Mixed'])])
    surveys = pd.DataFrame([{'survey_id': f"SUR-2026-{str(i).zfill(6)}", 'campaign_name': f"Campaign {i}", 'launch_date': fake.date_between(start_date='-1y', end_date='today')} for i in range(1, int(100 * SCALE) + 2)])
    return customers, products, channels, themes, sentiments, surveys

def generate_transactions(customers, products, channels, themes, sentiments, surveys):
    logger.info(f"Generating {NUM_REVIEWS_RESPONSES} Reviews and {NUM_SUPPORT_MSGS} Tickets...")
    texts = {
        'Positive': ["Great service!", "Bahut badhiya experience tha.", "Loved the new update."],
        'Negative': ["Terrible downtime.", "Worst support ever.", "Sarcastic: Oh brilliant, another bug.", "Pese barbaad."],
        'Neutral': ["It is okay.", "Standard service.", "No strong opinion.", "Theek hai."],
        'Mixed': ["UI is good but very slow.", "Fast support but expensive.", "Acha hai par mehenga hai."]
    }

    reviews_data = []
    for i in range(1, NUM_REVIEWS_RESPONSES + 1):
        is_review = random.choice([True, False])
        sentiment = sentiments.sample(1).iloc[0]['sentiment']
        surv_id = surveys.sample(1).iloc[0]['survey_id']
        reviews_data.append({
            'record_id': f"REV-2026-{str(i).zfill(6)}" if is_review else f"RESP-{surv_id}-{str(i).zfill(3)}",
            'customer_id': customers.sample(1).iloc[0]['customer_id'],
            'product_id': products.sample(1).iloc[0]['product_id'],
            'channel_id': channels.sample(1).iloc[0]['channel_id'],
            'type': 'Review' if is_review else 'SurveyResponse',
            'text': random.choice(texts[sentiment]),
            'sentiment_label': sentiment,
            'theme_id': themes.sample(1).iloc[0]['theme_id'],
            'created_at': fake.date_time_between(start_date="-1y", end_date="now")
        })
    df_reviews = pd.DataFrame(reviews_data)

    support_data = []
    for i in range(1, NUM_SUPPORT_MSGS + 1):
        support_data.append({
            'message_id': f"MSG-{str(random.randint(10000, 99999))}-{str(i).zfill(3)}",
            'customer_id': customers.sample(1).iloc[0]['customer_id'],
            'product_id': products.sample(1).iloc[0]['product_id'],
            'theme_id': themes.sample(1).iloc[0]['theme_id'],
            'issue_text': fake.sentence(),
            'status': random.choice(['Open', 'In Progress', 'Resolved', 'Closed']),
            'created_at': fake.date_time_between(start_date="-1y", end_date="now")
        })
    df_support = pd.DataFrame(support_data)
    
    actions = pd.DataFrame([{'action_id': f"ACT-2026-{str(i+1).zfill(6)}", 'theme_id': t['theme_id'], 'description': f"Investigate {t['theme_name']}", 'priority': 'High' if t['theme_name'] in ['Downtime', 'Performance'] else 'Medium'} for i, t in themes.iterrows()])
    
    return df_reviews, df_support, actions

def save_to_database(customers, products, channels, themes, sentiments, surveys, reviews, support, actions):
    engine = get_engine()
    logger.info("Pushing data to PostgreSQL Database...")
    try:
        customers.to_sql('customers', engine, if_exists='replace', index=False)
        products.to_sql('products', engine, if_exists='replace', index=False)
        channels.to_sql('channels', engine, if_exists='replace', index=False)
        themes.to_sql('themes', engine, if_exists='replace', index=False)
        sentiments.to_sql('sentiments', engine, if_exists='replace', index=False)
        surveys.to_sql('surveys', engine, if_exists='replace', index=False)
        reviews.to_sql('reviews_responses', engine, if_exists='replace', index=False)
        support.to_sql('support_messages', engine, if_exists='replace', index=False)
        actions.to_sql('action_items', engine, if_exists='replace', index=False)
        logger.info("Successfully populated PostgreSQL!")
    except Exception as e:
        logger.error(f"Database insertion failed: {e}")

def main():
    logger.info("Data Generator Started...")
    customers, products, channels, themes, sentiments, surveys = generate_master_data()
    reviews, support, actions = generate_transactions(customers, products, channels, themes, sentiments, surveys)
    
    save_to_database(customers, products, channels, themes, sentiments, surveys, reviews, support, actions)
    logger.info("Data Pipeline Execution Completed Successfully.")

if __name__ == "__main__":
    main()