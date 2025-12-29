# BeyondChats Article Scraper & Enhancer

A full-stack application that scrapes articles from BeyondChats blog, enhances them using AI (Groq LLM), and displays both original and enhanced versions in a responsive React frontend.

## 🌐 Live Demo

**Live Application:** [https://beyondchats-ocbd.onrender.com](https://beyondchats-ocbd.onrender.com)

**API Endpoint:** [https://beyondchats-ocbd.onrender.com/api/articles](https://beyondchats-ocbd.onrender.com/api/articles)

---

## 📋 Project Overview

This project fulfills the BeyondChats Full Stack Developer Intern assignment with three phases:

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Scrape articles from BeyondChats blog, store in database, create CRUD APIs | ✅ Complete |
| **Phase 2** | NodeJS script to search Google, scrape references, enhance with LLM, publish | ✅ Complete |
| **Phase 3** | React frontend to display original and enhanced articles | ✅ Complete |

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BeyondChats Article Scraper                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │     │   Backend    │     │   Scraper    │     │  External    │
│   (React)    │     │  (Express)   │     │  (Node.js)   │     │  Services    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │  HTTP/REST         │                    │                    │
       │◄──────────────────►│                    │                    │
       │                    │                    │                    │
       │                    │  SQLite            │                    │
       │                    │◄────────┐          │                    │
       │                    │         │          │                    │
       │                    │    ┌────┴────┐     │                    │
       │                    │    │Database │     │                    │
       │                    │    │(SQLite) │     │                    │
       │                    │    └─────────┘     │                    │
       │                    │                    │                    │
       │                    │◄───────────────────┤ Store Articles     │
       │                    │                    │                    │
       │                    │                    │───────────────────►│
       │                    │                    │  Scrape BeyondChats│
       │                    │                    │                    │
       │                    │                    │───────────────────►│
       │                    │                    │  Google Search     │
       │                    │                    │                    │
       │                    │                    │───────────────────►│
       │                    │                    │  Scrape References │
       │                    │                    │                    │
       │                    │                    │───────────────────►│
       │                    │                    │  Groq LLM API      │
       │                    │                    │                    │
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────┘

1. SCRAPING PHASE
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │ BeyondChats │ ───► │   Scraper   │ ───► │  Backend    │
   │    Blog     │      │  (Puppeteer)│      │    API      │
   └─────────────┘      └─────────────┘      └──────┬──────┘
                                                    │
                                                    ▼
                                             ┌─────────────┐
                                             │   SQLite    │
                                             │  Database   │
                                             └─────────────┘

2. ENHANCEMENT PHASE
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Google    │ ◄─── │   Scraper   │ ───► │  Reference  │
   │   Search    │      │             │      │  Websites   │
   └─────────────┘      └──────┬──────┘      └─────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │  Groq LLM   │
                        │    API      │
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │  Enhanced   │
                        │  Articles   │
                        └─────────────┘

3. DISPLAY PHASE
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   React     │ ◄─── │  Backend    │ ◄─── │   SQLite    │
   │  Frontend   │      │    API      │      │  Database   │
   └─────────────┘      └─────────────┘      └─────────────┘
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Axios |
| **Backend** | Node.js, Express, TypeScript, SQLite, better-sqlite3 |
| **Scraper** | Node.js, TypeScript, Puppeteer, Groq SDK |
| **LLM** | Groq API (Llama 3.1 8B) |
| **Testing** | Jest, fast-check (property-based testing) |

---

## 📁 Project Structure

```
beyondchats-article-scraper/
├── backend/                 # Express.js REST API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Error handling
│   │   ├── db/              # Database setup & migrations
│   │   └── utils/           # Logger utility
│   └── package.json
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── api/             # API client
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx          # Main app component
│   └── package.json
│
├── scraper/                 # Article scraper & enhancer
│   ├── src/
│   │   ├── services/        # Scraping & LLM services
│   │   ├── config/          # Configuration
│   │   ├── types/           # TypeScript types
│   │   └── index.ts         # Main entry point
│   └── package.json
│
└── README.md
```

---

## 🚀 Local Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Chrome/Chromium (for Puppeteer)

### 1. Clone the Repository

```bash
git clone https://github.com/anjali04853/BeyondChats.git
cd BeyondChats
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install scraper dependencies
cd scraper && npm install && cd ..
```

### 3. Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=3001
NODE_ENV=development
```

**Scraper** (`scraper/.env`):
```env
# API Configuration
API_BASE_URL=http://localhost:3001/api

# Puppeteer Configuration
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000

# Groq LLM Configuration (Free API)
GROQ_API_KEY=your_groq_api_key_here
LLM_MODEL=llama-3.1-8b-instant

# Logging
LOG_LEVEL=info
```

> 💡 Get a free Groq API key at [console.groq.com](https://console.groq.com)

### 4. Start the Backend

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:3001`

### 5. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 6. Run the Scraper

```bash
cd scraper
npm run dev
```

This will:
1. Scrape 5 articles from BeyondChats blog
2. Store them in the database
3. Search Google for reference articles
4. Enhance articles using Groq LLM
5. Store enhanced versions

---

## 📡 API Endpoints

### Articles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/articles` | Get all articles (paginated) |
| `GET` | `/api/articles/:id` | Get article by ID |
| `POST` | `/api/articles` | Create new article |
| `PUT` | `/api/articles/:id` | Update article |
| `DELETE` | `/api/articles/:id` | Delete article |
| `GET` | `/api/articles/:id/enhanced` | Get enhanced version |

### Enhanced Articles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/enhanced-articles` | Get all enhanced articles |
| `GET` | `/api/enhanced-articles/:id` | Get enhanced article by ID |
| `POST` | `/api/enhanced-articles` | Create enhanced article |

### Example Response

```json
{
  "articles": [
    {
      "id": 1,
      "title": "AI in Healthcare: Hype or Reality?",
      "content": "...",
      "author": "Simran Jain",
      "publication_date": "2025-03-25",
      "source_url": "https://beyondchats.com/blogs/...",
      "created_at": "2025-12-29T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

## ✨ Features

### Phase 1: Web Scraping & CRUD APIs
- ✅ Scrapes 5 oldest articles from BeyondChats blog
- ✅ Extracts title, content, author, publication date
- ✅ Stores in SQLite database
- ✅ Full CRUD REST API

### Phase 2: AI Enhancement
- ✅ Searches article titles on Google
- ✅ Fetches first 2 blog/article links (excludes beyondchats.com)
- ✅ Scrapes reference article content
- ✅ Enhances articles using Groq LLM (Llama 3.1)
- ✅ Adds citations to reference articles
- ✅ Publishes enhanced articles via API

### Phase 3: React Frontend
- ✅ Responsive, professional UI with Tailwind CSS
- ✅ Article list with pagination
- ✅ Article detail view
- ✅ Toggle between Original and Enhanced versions
- ✅ Side-by-side comparison view
- ✅ Mobile-first design

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend && npm test

# Scraper tests
cd scraper && npm test

# Frontend tests
cd frontend && npm test
```

---

## 📸 Screenshots

### Article List View
Browse all scraped articles in a clean, responsive grid layout with pagination. Each article card displays the title, excerpt, author, and publication date.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BeyondChats Articles                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ AI in Healthcare │  │ What If AI       │  │ What If AI       │          │
│  │ Hype or Reality? │  │ Recommends Wrong │  │ Recommends Wrong │          │
│  │                  │  │ Medicine – Who's │  │ Medicine – Who's │          │
│  │ Explainable AI   │  │ to Blame?        │  │ Responsible?     │          │
│  │ is definitely... │  │                  │  │                  │          │
│  │                  │  │ Introduction:    │  │ Introduction:    │          │
│  │ Simran Jain      │  │ The Unspoken...  │  │ The Unspoken...  │          │
│  │ Mar 25, 2025     │  │                  │  │                  │          │
│  │                  │  │ Simran Jain      │  │ Simran Jain      │          │
│  │                  │  │ Mar 24, 2025     │  │ Mar 24, 2025     │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                                │
│  │ Your website     │  │ Will AI          │                                │
│  │ needs a          │  │ Understand the   │                                │
│  │ receptionist     │  │ Complexities of  │                                │
│  │                  │  │ Patient Care?    │                                │
│  │ So true! Not     │  │                  │                                │
│  │ having an        │  │ Very well        │                                │
│  │ interactive...   │  │ written. But I   │                                │
│  │                  │  │ feel it's only...│                                │
│  │ pankaj           │  │                  │                                │
│  │ Mar 25, 2025     │  │ Simran Jain      │                                │
│  │                  │  │ Apr 3, 2025      │                                │
│  └──────────────────┘  └──────────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Article Detail with Original/Enhanced Toggle
View individual articles with the ability to toggle between the original BeyondChats version and the AI-enhanced version using Groq LLM. Features include:
- Original article content from BeyondChats
- Enhanced version with improved formatting and content
- Author and publication date information
- Link to original source
- Side-by-side comparison capability

![Article Detail](https://raw.githubusercontent.com/anjali04853/BeyondChats/main/screenshots/article-detail.png)

---

## 🔧 Configuration Options

### Scraper Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:3001/api` | Backend API URL |
| `PUPPETEER_HEADLESS` | `true` | Run browser in headless mode |
| `PUPPETEER_TIMEOUT` | `30000` | Page load timeout (ms) |
| `GROQ_API_KEY` | - | Groq API key for LLM |
| `LLM_MODEL` | `llama-3.1-8b-instant` | LLM model to use |

---

## 📝 Development Notes

- The scraper uses Puppeteer for web scraping to handle JavaScript-rendered content
- Google search results are filtered to exclude beyondchats.com and return only blog/article links
- Groq's free tier provides fast inference with Llama models
- SQLite is used for simplicity; can be replaced with PostgreSQL for production
- Property-based tests ensure correctness across many input variations

---

## 👤 Author

**Anjali Verma**

---

## 📄 License

This project is created for the BeyondChats Full Stack Developer Intern assignment.

**GitHub Repository:** [https://github.com/anjali04853/BeyondChats.git](https://github.com/anjali04853/BeyondChats.git)
