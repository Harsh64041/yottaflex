
# YottaFlex – Real-Time AI Feedback & Sentiment Analytics Platform

## Overview

**YottaFlex** is a full-stack, AI-powered feedback analysis and sentiment analytics platform designed to process large-scale customer feedback and support records.

The platform integrates Natural Language Processing (NLP), machine learning evaluation, REST APIs, PostgreSQL, and an interactive React dashboard to analyze customer sentiment, identify recurring feedback themes, and monitor sentiment trends.

YottaFlex supports **50,000+ feedback and support records** and provides an integrated pipeline for data generation, validation, and model evaluation.

## Live Demo

**Live Application:** [https://yottaflex-dashboard.onrender.com](https://yottaflex-dashboard.onrender.com)

The dashboard is publicly accessible. Use the following demo credentials to explore the application.

### Demo Credentials

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

## Key Features

- **AI-Powered Sentiment Analysis:** Analyzes customer feedback and classifies sentiment using an NLP pipeline.
- **Theme Detection:** Identifies recurring topics and patterns in customer feedback.
- **Large-Scale Data Processing:** Supports the generation and processing of 50,000+ records.
- **Interactive Dashboard:** Visualizes sentiment distribution, feedback trends, and analytical insights.
- **REST API Integration:** Provides backend services through Node.js and Express.js.
- **PostgreSQL Database:** Stores structured feedback and application data.
- **Data Validation:** Performs automated schema, integrity, and consistency checks.
- **Model Evaluation:** Measures sentiment classification and theme detection performance.
- **Reproducibility:** Uses SHA-256 checksums for pipeline integrity verification.
- **Cloud Deployment:** Supports deployment through Render.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js, REST APIs |
| Database | PostgreSQL |
| AI / Machine Learning | Python 3.12, NLP, Sentiment Analysis |
| Data Processing | Python, CSV, JSON |
| Validation | Custom Python Validation Scripts |
| Development Tools | Git, GitHub, VS Code |
| Deployment | Render |

## Project Structure

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

## Prerequisites

Ensure the following tools and technologies are installed:

- Node.js (v18 or later)
- npm
- Python (3.12 or later)
- PostgreSQL
- Git
- Visual Studio Code (recommended)

## Installation and Setup

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

Navigate to the project root directory:

```bash
cd ..
pip install -r requirements.txt
```

### 5. Configure Environment Variables

Create a `.env` file in the project root or backend directory, depending on the application's configuration.

Add the following environment variables:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
```

For the frontend, configure the backend API URL if required:

```env
VITE_API_URL=http://localhost:5000
```

**Important:** Replace the example values with your actual configuration. Never commit database credentials, API keys, passwords, or other sensitive information to GitHub.

## Data Generation and Validation

YottaFlex includes Python scripts for generating datasets, validating data integrity, and evaluating model performance.

Run the following commands from the project root directory.

### 1. Generate Dataset

```bash
python generate_data.py
```

Generates the project dataset containing 50,000+ records.

### 2. Validate Dataset

```bash
python validate.py
```

Checks schema consistency, data integrity, and validation requirements.

### 3. Evaluate Model Performance

```bash
python evaluate.py
```

Evaluates sentiment classification and theme detection performance.

**Note:** Run the data generation script only when you intend to create or reseed the dataset. Review its configuration before executing it against a shared database.

## Running the Application

Start the backend and frontend independently using separate terminal sessions.

### Start the Backend

```bash
cd backend
npm start
```

### Start the Frontend

```bash
cd frontend
npm run dev
```

Once both services are running, open the local URL displayed by the Vite development server in your browser.

## Model Performance and Evaluation

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

These represent the reported project evaluation results. The evaluation scripts can be executed against the configured evaluation dataset to reproduce and verify the metrics.

## Database

YottaFlex uses **PostgreSQL** as its relational database management system.

Database integration supports:

- Structured feedback storage.
- Relational data management.
- Foreign-key relationships.
- Database constraints.
- Data consistency and integrity.
- Backend database connectivity.

Configure the PostgreSQL connection using the `DATABASE_URL` environment variable.

## Deployment on Render

YottaFlex supports cloud deployment using Render.

### 1. Database Deployment

- Create a PostgreSQL database on Render.
- Configure the database connection.
- Initialize the required database schema.
- Obtain the database connection URL.

### 2. Backend Deployment

Create a new Web Service on Render with the following configuration:

| Setting | Configuration |
|---|---|
| Repository | YottaFlex GitHub Repository |
| Root Directory | `backend` |
| Runtime | Node.js |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Environment Variable | `DATABASE_URL` |

### 3. Frontend Deployment

Create a new Static Site on Render with the following configuration:

| Setting | Configuration |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Environment Variable | `VITE_API_URL` |

Set `VITE_API_URL` to the deployed backend URL.

Ensure that the backend CORS configuration allows requests from the deployed frontend domain.

**Note:** Verify the backend entry point, npm scripts, and environment configuration in the repository before deployment.

## Security and Best Practices

- Keep environment variables and credentials private.
- Never commit `.env` files to version control.
- Validate incoming API requests.
- Use secure database connections.
- Implement appropriate authentication and authorization.
- Handle API errors appropriately.
- Maintain database integrity and consistency.
- Follow Git version control best practices.

## Future Enhancements

- Advanced NLP-based feedback classification.
- Multilingual sentiment analysis.
- AI-powered feedback summarization.
- Advanced customer behavior analytics.
- Enhanced dashboard visualizations.
- Automated feedback alerts.
- Real-time analytics improvements.
- Scalable cloud infrastructure.

## Contribution Guidelines

Contributions, suggestions, and bug reports are welcome.

To contribute:

1. Fork the repository.
2. Create a new feature branch.
3. Implement your changes.
4. Commit your changes.
5. Push the branch to your fork.
6. Submit a Pull Request.

## Contact and Support

**Developer:** Harsh Vardhan Sharma

**Institution:** SGSITS, Indore

**GitHub Profile:** [Harsh64041](https://github.com/Harsh64041)

**Project Repository:** [YottaFlex](https://github.com/Harsh64041/yottaflex)

---

If you find this project useful or interesting, consider giving the repository a star.

**Developed by Harsh Vardhan Sharma**
