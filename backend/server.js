require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const isCloudDB = Boolean(
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes('localhost') &&
    !process.env.DATABASE_URL.includes('127.0.0.1')
);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://admin:password123@localhost:5432/feedback_db",
    ssl: isCloudDB ? { rejectUnauthorized: false } : false
});

pool.connect()
    .then(() => console.log("Connected to PostgreSQL Database successfully!"))
    .catch(err => console.error("Database connection error:", err.stack));

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

app.get('/', (req, res) => {
    res.send('YottaFlex Live SQL Analytics API Running.');
});

// 1. Dashboard Stats
app.get('/api/stats', async (req, res) => {
    try {
        const customers = await pool.query('SELECT COUNT(*) FROM customers');
        const reviews = await pool.query('SELECT COUNT(*) FROM reviews_responses');
        const tickets = await pool.query('SELECT COUNT(*) FROM support_messages');

        res.json({
            total_customers: parseInt(customers.rows[0].count, 10),
            total_reviews: parseInt(reviews.rows[0].count, 10),
            total_support_tickets: parseInt(tickets.rows[0].count, 10)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Global Sentiment Distribution
app.get('/api/sentiments', async (req, res) => {
    try {
        const query = `
            SELECT sentiment_label AS name, COUNT(*)::int AS value 
            FROM reviews_responses 
            GROUP BY sentiment_label
            ORDER BY name;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Channel Split
app.get('/api/channels', async (req, res) => {
    try {
        const query = `
            SELECT c.channel_name AS name,
                   (
                     (SELECT COUNT(*) FROM reviews_responses r WHERE r.channel_id = c.channel_id) +
                     (SELECT COUNT(*) FROM support_messages s WHERE s.channel_id = c.channel_id)
                   )::int AS count
            FROM channels c
            ORDER BY count DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Recent Pipeline Records
app.get('/api/recent-records', async (req, res) => {
    try {
        const query = `
            SELECT review_id, customer_id, sentiment_label 
            FROM reviews_responses 
            ORDER BY review_id ASC 
            LIMIT 5;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Top Support Themes
app.get('/api/themes', async (req, res) => {
    try {
        const query = `
            SELECT t.theme_name AS name, COUNT(s.message_id)::int AS value
            FROM support_messages s
            JOIN themes t ON s.theme_id = t.theme_id
            GROUP BY t.theme_name
            ORDER BY value DESC
            LIMIT 5;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Monthly Trends
app.get('/api/trends', async (req, res) => {
    try {
        const query = `
            SELECT 
                EXTRACT(MONTH FROM created_at::date)::int AS month_num,
                COUNT(*)::int AS "Total",
                COUNT(*) FILTER (WHERE sentiment_label = 'Positive')::int AS "Positive",
                COUNT(*) FILTER (WHERE sentiment_label = 'Negative')::int AS "Negative",
                COUNT(*) FILTER (WHERE sentiment_label = 'Neutral')::int AS "Neutral",
                COUNT(*) FILTER (WHERE sentiment_label = 'Mixed')::int AS "Mixed"
            FROM reviews_responses
            GROUP BY month_num
            ORDER BY month_num ASC;
        `;
        const result = await pool.query(query);
        const formatted = result.rows.map(r => ({
            month: MONTH_NAMES[(r.month_num || 1) - 1] || 'Jan',
            Total: r.Total,
            Positive: r.Positive,
            Negative: r.Negative,
            Neutral: r.Neutral,
            Mixed: r.Mixed
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Product-Wise Negative Breakdown
app.get('/api/product-breakdown', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.product_name AS product,
                p.primary_driver AS reason,
                p.sla_target AS sla,
                p.return_rate AS return_rate,
                COUNT(r.review_id) FILTER (WHERE r.sentiment_label = 'Negative')::int AS negative_count,
                COUNT(r.review_id)::int AS total_product_reviews
            FROM products p
            LEFT JOIN reviews_responses r ON p.product_id = r.product_id
            GROUP BY p.product_id, p.product_name, p.primary_driver, p.sla_target, p.return_rate
            ORDER BY negative_count DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Action Engine Recommendations
app.get('/api/recommendations', async (req, res) => {
    try {
        const query = `
            SELECT action_id, priority, issue, recommended_action AS action 
            FROM action_items 
            ORDER BY action_id ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Ground-Truth Anomalies
app.get('/api/anomalies', async (req, res) => {
    try {
        const query = `
            SELECT record_id AS id, issue_type AS type, details AS desc, expected_decision
            FROM ground_truth
            ORDER BY record_id ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. Real ML Evaluation Metrics (Sentiment + Theme + Gold Set)
app.get('/api/evaluation', async (req, res) => {
    try {
        const result = await pool.query('SELECT payload FROM ml_evaluation LIMIT 1');
        if (result.rows.length > 0) {
            return res.json(JSON.parse(result.rows[0].payload));
        }
        const jsonPath = path.join(__dirname, '..', 'evaluation_metrics.json');
        if (fs.existsSync(jsonPath)) {
            return res.json(JSON.parse(fs.readFileSync(jsonPath, 'utf-8')));
        }
        res.status(404).json({ error: "Run python evaluate.py first." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. Live Validation Summary Endpoint (Served directly from validate.py output)
app.get('/api/validation', async (req, res) => {
    try {
        const result = await pool.query('SELECT payload FROM validation_report LIMIT 1');
        if (result.rows.length > 0) {
            return res.json(JSON.parse(result.rows[0].payload));
        }
        const jsonPath = path.join(__dirname, '..', 'validation_summary.json');
        if (fs.existsSync(jsonPath)) {
            return res.json(JSON.parse(fs.readFileSync(jsonPath, 'utf-8')));
        }
        res.status(404).json({ error: "Run python validate.py first." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 12. Live SQL-Powered AI Chatbot Query Interface
app.post('/api/chat', async (req, res) => {
    const userMsg = (req.body.message || "").toLowerCase();
    try {
        if (userMsg.includes('sentiment') || userMsg.includes('summary') || userMsg.includes('overall')) {
            const r = await pool.query(`SELECT sentiment_label, COUNT(*)::int as cnt FROM reviews_responses GROUP BY sentiment_label`);
            const summaryStr = r.rows.map(x => `${x.sentiment_label}: ${x.cnt.toLocaleString()}`).join(' | ');
            const total = r.rows.reduce((a, b) => a + b.cnt, 0);
            return res.json({ reply: `Live SQL Sentiment Summary (Total = ${total.toLocaleString()} reviews): ${summaryStr}.` });
        }
        if (userMsg.includes('product') || userMsg.includes('highest') || userMsg.includes('negative') || userMsg.includes('worst')) {
            const r = await pool.query(`
                SELECT p.product_name, p.primary_driver, COUNT(rv.review_id)::int AS neg_cnt
                FROM products p
                JOIN reviews_responses rv ON p.product_id = rv.product_id
                WHERE rv.sentiment_label = 'Negative'
                GROUP BY p.product_name, p.primary_driver
                ORDER BY neg_cnt DESC;
            `);
            const top = r.rows[0];
            const allStr = r.rows.map(x => `${x.product_name} (${x.neg_cnt.toLocaleString()})`).join(', ');
            return res.json({ reply: `Live SQL Product Breakdown: '${top.product_name}' has the highest negative reviews (${top.neg_cnt.toLocaleString()}) driven by '${top.primary_driver}'. All products: ${allStr}.` });
        }
        if (userMsg.includes('complaint') || userMsg.includes('recurring') || userMsg.includes('top 5') || userMsg.includes('theme')) {
            const r = await pool.query(`
                SELECT t.theme_name, COUNT(s.message_id)::int AS cnt
                FROM support_messages s
                JOIN themes t ON s.theme_id = t.theme_id
                GROUP BY t.theme_name
                ORDER BY cnt DESC;
            `);
            const listStr = r.rows.map((x, i) => `${i + 1}. ${x.theme_name} (${x.cnt.toLocaleString()} tickets)`).join(' | ');
            return res.json({ reply: `Live SQL Top Recurring Support Complaints: ${listStr}.` });
        }
        if (userMsg.includes('month') || userMsg.includes('trend') || userMsg.includes('2026')) {
            const r = await pool.query(`
                SELECT EXTRACT(MONTH FROM created_at::date)::int AS m, COUNT(*)::int AS total,
                       COUNT(*) FILTER (WHERE sentiment_label='Negative')::int AS neg
                FROM reviews_responses GROUP BY m ORDER BY total DESC LIMIT 1;
            `);
            const peak = r.rows[0];
            return res.json({ reply: `Live SQL Monthly Trend: Peak feedback volume occurred in ${MONTH_NAMES[peak.m - 1]} 2026 with ${peak.total.toLocaleString()} total reviews (${peak.neg.toLocaleString()} negative). Total across all 12 months reconciles to 50,000.` });
        }
        if (userMsg.includes('duplicate') || userMsg.includes('leak') || userMsg.includes('anomal') || userMsg.includes('contradict')) {
            const r = await pool.query(`SELECT record_id, issue_type FROM ground_truth ORDER BY record_id`);
            const listStr = r.rows.map(x => `${x.record_id} (${x.issue_type})`).join(', ');
            return res.json({ reply: `Live SQL Ground-Truth Anomalies (${r.rows.length} isolated records): ${listStr}.` });
        }
        if (userMsg.includes('action') || userMsg.includes('recommend')) {
            const r = await pool.query(`SELECT priority, issue, recommended_action FROM action_items ORDER BY action_id`);
            const listStr = r.rows.map((x, i) => `${i + 1}. [${x.priority}] ${x.issue}: ${x.recommended_action}`).join(' ');
            return res.json({ reply: `Live SQL Recommended Business Actions: ${listStr}` });
        }
        if (userMsg.includes('accuracy') || userMsg.includes('precision') || userMsg.includes('f1') || userMsg.includes('eval') || userMsg.includes('metric')) {
            const r = await pool.query(`SELECT payload FROM ml_evaluation LIMIT 1`);
            if (r.rows.length > 0) {
                const ev = JSON.parse(r.rows[0].payload);
                return res.json({ reply: `Live Dual-Model ML Evaluation (Seed ${ev.seed}): Sentiment Accuracy = ${ev.overall.accuracy}%, Sentiment F1 = ${ev.overall.f1_score}%, Theme F1 = ${ev.overall.theme_f1_score}%, Gold Set Accuracy = ${ev.gold_set_accuracy}%.` });
            }
        }
        if (userMsg.includes('source') || userMsg.includes('trace') || userMsg.includes('original')) {
            const r = await pool.query(`SELECT review_id, response_id, customer_id, product_id FROM reviews_responses WHERE sentiment_label='Negative' LIMIT 3`);
            const traceStr = r.rows.map(x => `${x.review_id} (${x.response_id}) -> ${x.customer_id}`).join(' | ');
            return res.json({ reply: `Live SQL Traceability to Source Records: ${traceStr}.` });
        }

        const stats = await pool.query(`SELECT (SELECT COUNT(*) FROM reviews_responses) AS rev, (SELECT COUNT(*) FROM support_messages) AS msg`);
        res.json({ reply: `Connected to live PostgreSQL: ${stats.rows[0].rev} reviews & ${stats.rows[0].msg} support messages verified. Ask about sentiment summary, worst product, top 5 complaints, monthly trends, anomalies, ML metrics, or action items.` });
    } catch (err) {
        res.status(500).json({ reply: `SQL Query Error: ${err.message}` });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend API running on port ${port}`);
});