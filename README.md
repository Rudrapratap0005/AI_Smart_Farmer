# 🌾 AI Smart Farmer

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=25&pause=1000&color=2E7D32&center=true&vCenter=true&width=700&lines=AI-Powered+Smart+Farming+Platform;Crop+Prediction+%7C+Weather+Intelligence+%7C+Smart+Recommendations;Built+with+Node.js+%7C+Express.js+%7C+MongoDB" alt="Typing SVG" />
</p>

<p align="center">
  <a href="https://github.com/Rudrapratap0005/AI_Smart_Farmer">
    <img src="https://img.shields.io/badge/GitHub-AI%20Smart%20Farmer-181717?style=for-the-badge&logo=github" />
  </a>
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Render-Deployed-46E3B7?style=for-the-badge&logo=render&logoColor=black" />
</p>

<p align="center">
  <b>Making agriculture smarter through AI-assisted crop decisions, weather intelligence, and personalized recommendations.</b>
</p>

---

## 🚀 Project Overview

**AI Smart Farmer** is a full-stack smart farming platform designed to help farmers make better agricultural decisions using technology.

The application combines:

* 🌱 Crop prediction
* 🌦️ Real-time weather information
* 🤖 AI-assisted agricultural recommendations
* 🔐 Secure authentication
* 👤 Personalized user profiles
* 📊 Farmer dashboard
* ☁️ MongoDB Atlas database
* 🌐 Cloud deployment

The goal is to provide useful farming information through a simple and responsive web interface.

---

## ✨ Key Features

| Feature                  | Description                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| 🌱 Crop Prediction       | Provides crop-related predictions based on available agricultural data |
| 🌦️ Weather Intelligence | Retrieves real-time weather information using OpenWeather API          |
| 🤖 Smart Recommendations | Provides personalized farming-related suggestions                      |
| 🔐 JWT Authentication    | Secure login and registration using JSON Web Tokens                    |
| 🔒 Password Security     | Password hashing using bcryptjs                                        |
| 🔵 Google Sign-In        | Authentication support through Firebase                                |
| 👤 User Profiles         | Profile management and customization                                   |
| 📊 Dashboard             | Centralized interface for farming information                          |
| 🗄️ MongoDB Atlas        | Cloud database for application data                                    |
| 📁 JSON Fallback         | Local JSON data support when required                                  |
| 📱 Responsive UI         | Designed to work across different screen sizes                         |
| 🚀 Deployment            | Application deployment supported through Render                        |

---

# 🧠 System Architecture

```text
                    ┌─────────────────────────┐
                    │        User             │
                    │   Farmer / Visitor      │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     Frontend UI         │
                    │ HTML • CSS • JavaScript  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    Express.js Server    │
                    │       Node.js           │
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
             ▼                   ▼                   ▼
      ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
      │    Auth     │    │ Crop / AI   │    │   Weather   │
      │ JWT/bcrypt  │    │ Prediction  │    │ OpenWeather │
      └──────┬──────┘    └──────┬──────┘    └─────────────┘
             │                  │
             └──────────┬───────┘
                        ▼
              ┌────────────────────┐
              │    Data Layer      │
              │ MongoDB + JSON     │
              └────────────────────┘
```

---

# 🔄 User Journey

```text
Visit Website
      │
      ▼
Create Account / Login
      │
      ▼
Authentication
      │
      ▼
Dashboard
      │
      ├──────────────► Weather Information
      │
      ├──────────────► Crop Prediction
      │
      ├──────────────► Smart Recommendations
      │
      └──────────────► Profile Management
```

---

# 🔐 Authentication & Security

Authentication is implemented using multiple technologies:

### JWT Authentication

```text
User Login
    ↓
Credentials Validation
    ↓
Password Verification
    ↓
JWT Token Generated
    ↓
Token Sent to Client
    ↓
Protected API Requests
    ↓
Middleware Verifies Token
```

### Security Technologies

* **JWT** — authentication tokens
* **bcryptjs** — password hashing
* **Firebase Authentication** — Google Sign-In
* **Express middleware** — protected route handling
* **Environment variables** — sensitive configuration

---

# 🌱 Crop Prediction

The crop prediction module uses agricultural prediction data to assist users in selecting suitable crops.

### Prediction Flow

```text
User Input
    ↓
Agricultural Parameters
    ↓
Prediction Processing
    ↓
Crop Result
    ↓
Recommendation
```

The project keeps prediction-related data inside:

```text
data/predictions.json
```

The structure can also be extended in the future to integrate a dedicated machine-learning model.

---

# 🌦️ Weather Intelligence

The application integrates the **OpenWeather API** to retrieve weather information.

```text
User Location
      ↓
Frontend Request
      ↓
Backend
      ↓
OpenWeather API
      ↓
Weather Data
      ↓
Dashboard
```

This can help users consider weather conditions while making farming decisions.

---

# 📊 Data Flow

```text
                    USER
                      │
                      ▼
                FRONTEND UI
                      │
                      ▼
                EXPRESS API
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
        AUTH        PREDICT     WEATHER
          │           │           │
          ▼           ▼           ▼
       MongoDB       JSON      OpenWeather
          │           │           │
          └───────────┼───────────┘
                      ▼
                  DASHBOARD
```

---

# 🛠️ Technology Stack

### Backend

<p>
<img src="https://skillicons.dev/icons?i=nodejs,express,mongodb" />
</p>

* Node.js
* Express.js
* Mongoose
* JWT
* bcryptjs
* CORS
* dotenv

### Frontend

<p>
<img src="https://skillicons.dev/icons?i=html,css,js" />
</p>

* HTML5
* CSS3
* JavaScript
* Responsive UI

### Authentication

<p>
<img src="https://skillicons.dev/icons?i=firebase" />
</p>

* JWT Authentication
* Firebase Authentication
* Google Sign-In
* bcryptjs

### Database

* MongoDB Atlas
* Mongoose
* JSON fallback data

### APIs

* OpenWeather API
* REST API architecture

### Deployment

* Render
* MongoDB Atlas

---

# 📁 Project Structure

```text
AI_Smart_Farmer/
│
├── data/
│   ├── predictions.json
│   └── users.json
│
├── models/
│   ├── CropData.js
│   └── User.js
│
├── public/
│   ├── css/
│   ├── js/
│   ├── pages/
│   ├── index.html
│   ├── Dashboard.html
│   ├── SignIn.html
│   ├── CreateAcc.html
│   ├── Profile.html
│   └── firebase.js
│
├── src/
│   ├── config/
│   ├── lib/
│   ├── middleware/
│   ├── routes/
│   └── app.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── render.yaml
└── server.js
```

---

# 🧩 Core Modules

### 1. Authentication Module

Handles:

* User registration
* User login
* Password hashing
* JWT token generation
* Protected routes
* Google authentication

### 2. Crop Prediction Module

Handles:

* Crop-related data
* Prediction processing
* Agricultural recommendations

### 3. Weather Module

Handles:

* Weather API requests
* Weather information
* Dashboard weather display

### 4. User Module

Handles:

* User data
* Profiles
* Personalization

### 5. Database Module

Handles:

* MongoDB connection
* Mongoose models
* User information
* Crop information

### 6. Frontend Module

Handles:

* User interface
* Dashboard
* Authentication pages
* Profile pages
* Responsive design

---

# 🔌 API Endpoints

## Authentication

### Register

```http
POST /api/auth/register
```

### Login

```http
POST /api/auth/login
```

### Health Check

```http
GET /health
```

Protected endpoints use:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# 🗄️ Database Layer

MongoDB Atlas is used as the primary cloud database.

### Main Models

```text
models/
│
├── User.js
└── CropData.js
```

### User Model

Stores user-related information required for authentication and profile management.

### CropData Model

Stores crop-related information used by the application's agricultural features.

---

# 📦 JSON Fallback

The project also maintains local JSON data:

```text
data/
├── predictions.json
└── users.json
```

This provides a lightweight fallback/data source for selected application functionality.

---

# 🖥️ Frontend Pages

The application contains multiple pages for different user workflows.

Important pages include:

```text
index.html
SignIn.html
CreateAcc.html
Dashboard.html
Profile.html
about.html
faq.html
```

Additional profile and sign-in related pages are also available inside the `public` directory.

---

# ⚙️ Installation

## 1. Clone Repository

```bash
git clone https://github.com/Rudrapratap0005/AI_Smart_Farmer.git
```

## 2. Enter Project

```bash
cd AI_Smart_Farmer
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Create Environment File

Create:

```text
.env
```

Add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENWEATHER_API_KEY=your_openweather_api_key
```

## 5. Start Development Server

```bash
npm run dev
```

## 6. Start Production Server

```bash
npm start
```

---

# 🚀 Deployment

The project includes:

```text
render.yaml
```

for deployment configuration.

### Deployment Flow

```text
GitHub Repository
       ↓
     Render
       ↓
Node.js Server
       ↓
MongoDB Atlas
       ↓
Live Application
```

---

# 📈 Project Evolution

### Current

* ✅ Full-stack web application
* ✅ Authentication
* ✅ JWT security
* ✅ Google Sign-In
* ✅ Crop prediction
* ✅ Weather integration
* ✅ User profiles
* ✅ Dashboard
* ✅ MongoDB Atlas
* ✅ Render deployment

### Future Improvements

* 🔮 Dedicated ML prediction model
* 📊 Advanced farming analytics
* 📍 Location-based recommendations
* 🌾 Soil analysis
* 📷 Plant disease detection
* 📱 Progressive Web App
* 🔔 Weather-based farming alerts
* 🧠 More advanced AI recommendations

---

# 🏆 GitHub Project Insights

### Repository Stats

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api/pin/?username=Rudrapratap0005&repo=AI_Smart_Farmer&show_owner=true&theme=default" />
</p>

### Contribution Activity

<p align="center">
  <img src="https://github-readme-activity-graph.vercel.app/graph?username=Rudrapratap0005&theme=github-compact&hide_border=true" />
</p>

### GitHub Achievements

<p align="center">
  <img src="https://github-profile-trophy.vercel.app/?username=Rudrapratap0005&theme=flat&no-frame=true&row=1&column=6" />
</p>

> These visual sections are dynamic and reflect GitHub activity rather than manually entered project numbers.

---

# 📊 Developer GitHub Stats

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=Rudrapratap0005&show_icons=true&hide_border=true&rank_icon=github" height="170" />
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=Rudrapratap0005&layout=compact&hide_border=true" height="170" />
</p>

---

# 👨‍💻 Contributors

| Contributor                                             | Role                   |
| ------------------------------------------------------- | ---------------------- |
| [Rudrapratap](https://github.com/Rudrapratap0005)       | Full-Stack Development |
| [Aadittyya Ranjan](https://github.com/aadittyaranjan09) | Project Contributor    |

---

# 🤝 Contributing

Contributions are welcome.

```bash
git checkout -b feature/your-feature
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

Then open a Pull Request.

---

# 🔮 Roadmap

```text
Authentication
      │
      ▼
User Dashboard
      │
      ▼
Weather Intelligence
      │
      ▼
Crop Prediction
      │
      ▼
Smart Recommendations
      │
      ▼
Advanced AI
      │
      ▼
Smart Farming Ecosystem
```

---

# 📜 License

This project is licensed under the **ISC License**.

---

# 🌟 Support

If you find this project useful:

⭐ Star the repository
🍴 Fork the repository
🐛 Report issues
💡 Suggest improvements

---

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=Rudrapratap0005&repo=AI_Smart_Farmer&label=Repository%20Views&color=brightgreen" />
</p>

<p align="center">
  <b>🌾 AI Smart Farmer — Technology for Smarter Agriculture</b>
</p>

<p align="center">
  Built with ❤️ using Node.js, Express.js, MongoDB and modern web technologies.
</p>
