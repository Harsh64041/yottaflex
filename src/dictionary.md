# Data Dictionary

## 1. Customer
*   `customer_id` (PK): String, Required, Format: CUST-2026-XXXXXX, Unique.
*   `name`, `email`, `region`: String, Required.

## 2. Product
*   `product_id` (PK): String, Required, Format: PROD-XXXX.
*   `name`, `category`: String, Required.

## 3. Channel
*   `channel_id` (PK): String, Required, Format: CHAN-XXXX.
*   `channel_name`: Enum (Web, Mobile App, API, Social Media, Email), Required.

## 4. Survey
*   `survey_id` (PK): String, Required, Format: SUR-2026-XXXXXX.
*   `campaign_name`, `launch_date`: String/Date, Required.

## 5. Theme & 6. SentimentLabel (Taxonomies)
*   `theme_id` (PK): String, Format: THEME-XXXXXX.
*   `label_id` (PK): String, Format: LBL-XXXX.

## 7. Review & 8. SurveyResponse (Combined Transaction Table)
*   `record_id` (PK): String, Format: REV-2026-XXXXXX ya RESP-<survey-id>-XXX.
*   `customer_id` (FK), `product_id` (FK), `channel_id` (FK): String, Required.
*   `type`: Enum (Review, SurveyResponse).
*   `text`: String, Required (Contains mixed, multilingual, sarcasm).
*   `sentiment_label` (FK): String.
*   `theme_id` (FK): String.

## 9. SupportMessage
*   `message_id` (PK): String, Format: MSG-<ticket-id>-XXX.
*   `customer_id` (FK), `product_id` (FK), `theme_id` (FK): String, Required.
*   `issue_text`: String, Required.
*   `status`: Enum (Open, In Progress, Resolved, Closed).

## 10. ActionItem
*   `action_id` (PK): String, Format: ACT-2026-XXXXXX.
*   `theme_id` (FK): String, Required.
*   `description`: String, Required.
*   `priority`: Enum (High, Medium, Low).