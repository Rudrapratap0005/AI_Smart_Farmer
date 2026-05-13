# 🌾 AI Smart Farmer

An AI-powered web application that helps farmers make smarter agricultural decisions through crop predictions, real-time weather data, and personalized recommendations.

![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-v5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)

---

## 📌 About

AI Smart Farmer is a full-stack web application that combines weather intelligence with AI-based crop prediction to assist farmers in planning their agricultural activities. The platform provides personalized dashboards, crop recommendations, and weather-aware insights based on the user's location and soil conditions.

---

## ✨ Features

- **User Authentication** — Secure registration and login with JWT tokens and bcrypt password hashing
- **Google Sign-In** — Social authentication via Firebase
- **Real-Time Weather** — Live weather data powered by OpenWeather API
- **AI Crop Predictions** — Smart crop suggestions based on environmental conditions
- **Personalized Dashboard** — View predictions, weather info, and account details
- **Profile Customization** — Multiple profile templates to choose from
- **Dual Storage** — MongoDB Atlas as primary database with local JSON fallback
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, Express.js v5, Mongoose v9 |
| **Frontend** | HTML5, CSS3, JavaScript |
| **Database** | MongoDB Atlas (with JSON fallback) |
| **Auth** | JWT, bcryptjs, Firebase Auth |
| **API** | OpenWeather API |
| **Deployment** | Render |

---

## 📁 Project Structure

```
AI_Smart_Farmer/
├── data/                   # Local JSON storage (fallback)
│   ├── predictions.json
│   └── users.json
├── models/                 # Mongoose schemas
│   ├── CropData.js
│   └── User.js
├── public/                 # Frontend files
│   ├── css/                # Stylesheets
│   ├── js/                 # Client-side scripts
│   ├── pages/              # Additional pages
│   ├── index.html          # Landing page
│   ├── Dashboard.html      # User dashboard
│   ├── SignIn.html         # Login page
│   ├── CreateAcc.html      # Registration page
│   └── ...                 # Other HTML pages & assets
├── src/                    # Backend source
│   ├── config/             # DB & env configuration
│   ├── lib/                # Utility libraries
│   ├── middleware/          # Auth middleware
│   ├── routes/             # API & auth routes
│   └── app.js              # Express app setup
├── .env                    # Environment variables
├── server.js               # Entry point
├── package.json
└── render.yaml             # Render deployment config
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- [OpenWeather API](https://openweathermap.org/api) key

### Installation

```bash
# Clone the repository
git clone https://github.com/Rudrapratap0005/AI_Smart_Farmer.git
cd AI_Smart_Farmer

# Install dependencies
npm install
```

### Configure Environment

Create or update the `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
OPENWEATHER_API_KEY=your_api_key
```

### Run the App

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

The app will be available at `http://localhost:5000`

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Create a new account | No |
| `POST` | `/api/auth/login` | Login & get JWT token | No |
| `GET` | `/health` | Server health check | No |

> Protected routes require a JWT token in the `Authorization: Bearer <token>` header.

---

## 🌐 Deployment

This project is configured for **Render** deployment with the included `render.yaml`:

1. Fork this repo to your GitHub
2. Connect to [Render](https://render.com/) and create a new Blueprint
3. Set `MONGO_URI` in environment variables
4. Deploy — `JWT_SECRET` is auto-generated, `NODE_VERSION` defaults to 20

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m "Add YourFeature"`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

---

## 📄 License

Licensed under the **ISC License**.

---

## 👥 Team

- **Rudrapratap** — [@Rudrapratap0005](https://github.com/Rudrapratap0005)
- **Aadittya Ranjan** — [@aadittyaranjan09](https://github.com/aadittyaranjan09)


