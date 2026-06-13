# AI-Powered Resume Screening & Candidate Ranking System 🚀

An AI-driven web application designed to help recruiters automatically screen resumes and rank candidates based on how closely their skills and experience match a given job description.
The system minimizes repetitive manual work, improves screening efficiency, and supports fair, data-driven hiring decisions while keeping humans in control.

---

## 📌 Problem Statement

Recruiters often receive a large number of resumes for a single job opening. Openings in some companies often get hundred of resumes which takes a lot of time to manually checking every resume. 
Manually reviewing each resume is:
- Time-consuming
- Prone to human bias
- Inefficient for bulk hiring
  
This project solves the problem by using AI to analyze resumes, extract skills, and rank candidates based on job relevance.

---

## 💡 Solution Overview

The system allows recruiters to:
1. Enter job details (title, description, experience, location)
2. Upload multiple resumes (PDF / DOCX)
3. Automatically extract skills from resumes
4. Match candidate skills with job requirements
5. Rank candidates based on a match score
6. View results and make final decisions

AI is used only as a **decision-support tool** — final hiring decisions remain with humans.

---

## ✨ Key Features

- AI-based resume screening
- Skill extraction from job descriptions and resumes
- Job-skill matching and relevance scoring
- Candidate ranking based on match percentage
- Support for multiple resume uploads
- Clean and user-friendly interface
- Human-in-the-loop decision making

---

## 🧠 Google Technologies Used

- **Google Gemini API**  
  Used for AI-based skill extraction and semantic analysis of job descriptions and resumes.

- **Google AI Studio**  
  Used to create and manage the Gemini API key and test AI prompts.

- **Google Cloud–Ready Architecture**  
  Backend designed to be deployed on Google Cloud services.

---

## 🏗️ System Architecture

**Frontend (Client Side):**
- React.js
- TypeScript
- Tailwind CSS
- Zustand (state management)

**Backend (Server Side):**
- Node.js
- Express.js
- REST APIs

**AI Layer:**
- Google Gemini API (Generative Language API)

**Data Flow:**
Frontend → Backend → Gemini API → Backend → Frontend

---

## 🔄 Process Flow

1. Recruiter enters job details  
2. Job description is stored  
3. Recruiter uploads candidate resumes  
4. Resume text is extracted  
5. AI extracts skills from job and resumes  
6. Skills are matched and scored  
7. Candidates are ranked  
8. Results are displayed for decision-making  

---

## 🖥️ Tech Stack

| Layer        | Technology |
|--------------|------------|
| Frontend     | React, TypeScript, Tailwind CSS |
| Backend      | Node.js, Express |
| AI           | Google Gemini API |
| State Mgmt   | Zustand |
| API Format   | REST (JSON) |

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Node.js (v18 or later)
- npm or bun
- Git
- Google Gemini API key

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/skill-match-ai.git
cd skill-match-ai
```

---

### 2️⃣ Install Frontend Dependencies

```bash
npm install
```

---

### 3️⃣ Setup Backend

```bash
cd backend
npm install

```
#### Create a .env file inside backend/:

```bash
GEMINI_API_KEY=your_api_key_here
PORT=5000
```

---

### 4️⃣ Start Backend Server

```bash
node server.js
```

#### Backend runs at

```bash
http://localhost:5000
```

---

### 4️⃣ Start Backend Server

```bash
npm run dev
```

#### Frontend runs at:

```bash
Frontend runs at:
```

---

## 📄 License

This project is developed for educational and hackathon purposes.




