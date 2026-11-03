# Project Folder Structure Documentation

```
vocal-labs/
├── backend/                        # Node.js & Express REST API
│   ├── prisma/
│   │   ├── schema.prisma           # Relational schema (15 models)
│   │   └── seed.js                 # Database seeder with demo data
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # Prisma client singleton
│   │   ├── controllers/            # Controller layer
│   │   │   ├── auth.controller.js
│   │   │   ├── business.controller.js
│   │   │   ├── expense.controller.js
│   │   │   ├── fuel.controller.js
│   │   │   ├── mobile.controller.js
│   │   │   ├── report.controller.js
│   │   │   ├── travel.controller.js
│   │   │   └── voice.controller.js
│   │   ├── middleware/             # Auth & Error handling middleware
│   │   │   ├── auth.middleware.js  # JWT verification & ownership checks
│   │   │   └── errorHandler.js     # Standardized error responses
│   │   ├── routes/                 # Express route definitions
│   │   │   ├── auth.routes.js
│   │   │   ├── business.routes.js
│   │   │   ├── expense.routes.js
│   │   │   ├── fuel.routes.js
│   │   │   ├── mobile.routes.js
│   │   │   ├── report.routes.js
│   │   │   ├── travel.routes.js
│   │   │   └── voice.routes.js
│   │   ├── services/               # Business logic & AI processing
│   │   │   ├── ai.service.js       # Gemini API & NLP parser fallback
│   │   │   ├── conversation.service.js # Context retention & execution
│   │   │   ├── expense.service.js
│   │   │   ├── fuel.service.js
│   │   │   ├── mobile.service.js
│   │   │   ├── report.service.js
│   │   │   └── travel.service.js
│   │   ├── utils/
│   │   │   ├── auditLogger.js      # Audit log recorder
│   │   │   └── responseFormatter.js# Standard JSON responses
│   │   ├── app.js                  # Express app setup & static file serving
│   │   └── server.js               # Server bootstrap & DB connection
│   ├── tests/
│   │   └── all34Cases.test.js      # Complete test suite for all 34 required cases
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── frontend/                       # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── MetricCard.jsx      # Stat metric widget
│   │   │   ├── Navbar.jsx          # Header with business selector
│   │   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   │   └── VoiceAssistantModal.jsx # Global voice assistant modal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Authentication state & helpers
│   │   │   └── VoiceContext.jsx    # STT, TTS & query orchestration
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx   # Consolidated owner dashboard
│   │   │   ├── FuelStationPage.jsx # AJ'S FUEL STATION management
│   │   │   ├── LoginPage.jsx       # Owner authentication
│   │   │   ├── MobileShopPage.jsx  # AJ'S MOBILE SHOP inventory & sales
│   │   │   ├── ReportsPage.jsx     # Financial statements & export
│   │   │   ├── SettingsPage.jsx    # System health & voice settings
│   │   │   ├── TravelPage.jsx      # AJ'S TRAVEL fleet & trips
│   │   │   └── VoiceAssistantPage.jsx # Dedicated voice assistant page
│   │   ├── services/
│   │   │   └── api.js              # Axios instance with JWT interceptor
│   │   ├── App.jsx                 # Routing & protected layouts
│   │   ├── index.css               # Tailwind & custom voice animations
│   │   └── main.jsx
│   ├── dist/                       # Production frontend bundle
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── docs/                           # Comprehensive Documentation
│   ├── API_DOCUMENTATION.md        # Complete REST API reference
│   ├── DATABASE_SCHEMA.md          # Relational database schema & constraints
│   ├── PROJECT_STRUCTURE.md        # Architecture overview
│   └── TEST_REPORT.md              # 34/34 Test cases verification matrix
│
├── README.md                       # Master product documentation
└── package.json                    # Root script convenience orchestrator
```
