
# YottaFlex — Real-Time AI Feedback & Sentiment Analytics Platform

## 📌 Overview

**YottaFlex** is a full-stack AI-powered feedback analysis and sentiment analytics platform designed to process large-scale customer feedback and support records.

The platform combines Natural Language Processing (NLP), machine learning evaluation, REST APIs, PostgreSQL, and an interactive React dashboard to analyze customer sentiment, identify feedback themes, and monitor sentiment trends.

It supports 50,000+ feedback and support records and provides an integrated pipeline for data generation, validation, and model evaluation.

## 🌐 Live Demo

 **Explore YottaFlex Live:**

[https://yottaflex-dashboard.onrender.com](https://yottaflex-dashboard.onrender.com)

The YottaFlex dashboard is publicly accessible. Open the link above to explore the deployed application.



##  Demo Login Credentials

Use the following credentials to access the YottaFlex dashboard:

| Field | Credentials |
|---|---|
| Username | `admin` |
| Password | `admin123` |




## ✨ Features

- **AI-Powered Sentiment Analysis:** Analyzes customer feedback and classifies sentiment using an NLP pipeline.
- **Theme Detection:** Identifies recurring topics and themes from customer feedback.
- **Large-Scale Data Processing:** Supports the generation and processing of 50,000+ records.
- **Interactive Dashboard:** Visualizes sentiment distribution, feedback trends, and analytics.
- **REST API Integration:** Provides backend APIs using Node.js and Express.js.
- **PostgreSQL Database:** Stores structured feedback and application data.
- **Data Validation:** Includes automated schema, integrity, and consistency checks.
- **Model Evaluation:** Measures sentiment and theme classification performance.
- **Reproducibility:** Uses SHA-256 checksums for pipeline integrity verification.
- **Cloud Deployment:** Supports deployment using Render.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js, REST APIs |
| Database | PostgreSQL |
| AI / ML | Python 3.12, NLP, Sentiment Analysis |
| Data Processing | Python, CSV, JSON |
| Validation | Custom Python Validation Scripts |
| Tools | Git, GitHub, VS Code |
| Deployment | Render |

## 📂 Project Structure

```text
Yotta_Flex/
│
├── backend/
│   └── Node.js and Express backend
│
├── frontend/
│   └── React and Vite frontend
│
├── exports/
│   └── CSV, JSON, and SQL export files
│
├── venv/
│   └── Python virtual environment
│
├── .env
├── .gitignore
│
├── BUILD_LOG.md
├── DECISIONS.md
├── DEMO_SCRIPT.md
│
├── evaluate.py
├── evaluation_metrics.json
├── generate_data.py
├── ground_truth.csv
│
├── manifest_run1.json
├── manifest_run2.json
│
├── package.json
├── requirements.txt
└── validate.py
```

##  Prerequisites

Make sure the following tools are installed:

- Node.js (v18 or later)
- npm
- Python (3.12 or later)
- PostgreSQL
- Git
- Code Editor (VS Code recommended)

##  Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Harsh64041/yottaflex.git

cd Yotta_Flex
```

### 2. Install Backend Dependencies

```bash
cd backend

npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend

npm install
```

### 4. Install Python Dependencies

Navigate to the project root:

```bash
cd ..

pip install -r requirements.txt
```

### 5. Configure Environment Variables

Create a `.env` file in the project root or backend directory according to the application's configuration.

Example:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
```

For the frontend, configure the API URL if required:

```env
VITE_API_URL=http://localhost:5000
```

**Important:** Replace the example values with your actual configuration. Never upload database credentials, API keys, or passwords to GitHub.

## 🧪 Data Generation & Validation

YottaFlex includes Python scripts for generating datasets, validating data integrity, and evaluating model performance.

Run the following commands from the project root:

### Generate Dataset

```bash
python generate_data.py
```

Generates the project dataset containing 50,000+ records.

### Validate Dataset

```bash
python validate.py
```

Checks schema consistency, data integrity, and validation requirements.

### Evaluate Model

```bash
python evaluate.py
```

Evaluates sentiment classification and theme detection performance.

**Note:** Run data generation only when you intend to create or reseed the dataset. Check the script configuration before running it against a shared database.

##  Running the Application

Start the backend and frontend in separate terminals.

### Start Backend

```bash
cd backend

npm start
```

### Start Frontend

```bash
cd frontend

npm run dev
```

Open the local URL displayed by the Vite development server in your browser.

## 📊 Model Performance & Evaluation

The project evaluation pipeline reports the following performance metrics:

| Evaluation Metric | Result |
|---|---:|
| Sentiment Accuracy | 95.73% |
| Sentiment Precision | 95.73% |
| Sentiment Recall | 95.73% |
| Sentiment F1 Score | 95.73% |
| Theme Accuracy | 96.00% |
| Theme F1 Score | 96.01% |
| Checksum Verification | Two-pass SHA-256 |

These are the reported project metrics. Run the evaluation scripts against the configured evaluation dataset to reproduce and verify the results.

## 🗄️ Database

YottaFlex uses PostgreSQL as its relational database.

Database integration supports:

- Structured feedback storage
- Relational data management
- Foreign-key relationships
- Database constraints
- Data consistency
- Backend database connectivity

Configure the PostgreSQL connection using the `DATABASE_URL` environment variable.

## ☁️ Deployment on Render

YottaFlex can be deployed using Render.

### 1. Database Deployment

- Create a PostgreSQL database on Render.
- Configure the database connection.
- Initialize the required database schema.
- Copy the database connection URL.

### 2. Backend Deployment

Create a new Web Service.

Configuration:

- Repository: YottaFlex GitHub Repository
- Root Directory: `backend`
- Runtime: Node.js
- Build Command: `npm install`
- Start Command: `npm start` (if configured in package.json)
- Environment Variable: `DATABASE_URL`

### 3. Frontend Deployment

Create a new Static Site.

Configuration:

- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variable: `VITE_API_URL`

Set `VITE_API_URL` to your deployed backend URL.

Ensure that backend CORS settings allow requests from the deployed frontend domain.

**Note:** Verify the actual backend entry point, npm scripts, and environment configuration in your repository before deployment.

## 🔐 Security & Best Practices

- Keep environment variables private.
- Never commit `.env` files.
- Validate incoming API requests.
- Use secure database connections.
- Implement appropriate authentication and authorization.
- Handle API errors properly.
- Maintain database integrity.
- Use Git for version control.

## 🔮 Future Enhancements

- Advanced NLP-based feedback classification.
- Multilingual sentiment analysis.
- AI-powered feedback summarization.
- Advanced customer behavior analytics.
- Improved dashboard visualizations.
- Automated feedback alerts.
- Real-time analytics enhancements.
- Scalable cloud infrastructure.

## 🤝 Contribution

Contributions, suggestions, and bug reports are welcome.

To contribute:

1. Fork the repository.
2. Create a new feature branch.
3. Make your changes.
4. Commit your changes.
5. Push the branch.
6. Submit a Pull Request.

## 📧 Contact & Support

**Developer:** Harsh Vardhan Sharma

**Institution:** SGSITS, Indore

**GitHub:** [Harsh64041](https://github.com/Harsh64041)

**Repository:** [YottaFlex](https://github.com/Harsh64041/yottaflex)

---

⭐ If you find this project interesting, consider giving it a star on GitHub!

**Built with ❤️ by Harsh Vardhan Sharma**
