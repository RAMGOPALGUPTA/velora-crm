# 🚀 Velora CRM

A modern, full-stack Customer Relationship Management (CRM) system built using the **MERN stack**. Velora CRM helps teams manage leads, track sales pipelines, and gain insights through a clean, data-driven dashboard.

Deploy at : https://velora-crm.vercel.app/

---

## 🌟 Overview

Velora CRM is designed as a **lightweight yet powerful alternative to complex CRM tools**. It focuses on simplicity, performance, and scalability while maintaining core enterprise features like authentication, role-based access, and analytics.

---

## ✨ Features

### 🔐 Authentication & Security

* JWT-based authentication
* Secure login & registration
* Role-based access control (Admin / Sales)

---

### 📇 Lead Management

* Create, update, delete leads
* Assign leads to users
* Track lead status:

  * New
  * Contacted
  * Negotiation
  * Closed

---

### 📊 Dashboard & Analytics

* Real-time lead statistics
* Status-wise breakdown
* Interactive charts for pipeline visualization

---

### 🔍 Smart Filtering & Search

* Search leads by name or email
* Filter leads by status
* Dynamic data updates

---

### 🧠 Advanced Frontend Architecture

* Context API for global state management
* Protected routes for secure navigation
* Modular component-based UI
* Axios API layer with interceptors

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* Axios
* React Router DOM
* Recharts
* React Hot Toast

### Backend

* Node.js
* Express.js
* MongoDB (Atlas)
* Mongoose
* JWT Authentication

---

## 📂 Project Structure

```
velora-crm/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.jsx
│   └── vite.config.js
│
└── .gitignore
```

---

## ⚙️ Installation & Setup

### 🔧 Backend Setup

```bash
cd backend
npm install
npm run dev
```

Create a `.env` file in backend:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

### 💻 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 API Endpoints

### Auth

* `POST /api/auth/register`
* `POST /api/auth/login`

### Leads

* `GET /api/leads`
* `POST /api/leads`
* `PUT /api/leads/:id`
* `DELETE /api/leads/:id`

### Analytics

* `GET /api/leads/stats`

---

## 🔐 Role-Based Access

| Role  | Permissions                 |
| ----- | --------------------------- |
| Admin | Full access (CRUD + delete) |
| Sales | Manage own leads only       |

---

## 📸 Screenshots

*Add screenshots of your dashboard here for better presentation.*

---

## 🚀 Future Enhancements

* Kanban board (drag & drop pipeline)
* AI-based lead scoring
* Email & WhatsApp integration
* Team performance analytics
* Notifications & reminders

---

## 🧠 Learnings

This project demonstrates:

* Full-stack development using MERN
* API design & integration
* Authentication & authorization
* Scalable frontend architecture
* Real-world product thinking

---

## 📌 Conclusion

Velora CRM is not just a project, but a **foundation for a scalable SaaS product**. It showcases how modern web technologies can be combined to build efficient, user-centric business tools.

---

## 👨‍💻 Author

**Ram Gopal Gupta**
B.Tech (Full Stack Development)
Chandigarh University

---

## ⭐ If you like this project

Give it a ⭐ on GitHub and share your feedback!
