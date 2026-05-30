#Smart Todo App

A modern full-stack Todo Management application built using **Node.js, Express.js, MongoDB Atlas, HTML, CSS, and JavaScript**.

It helps users organize tasks efficiently with categories, priorities, due dates, progress tracking, and task filtering.

---
##Live Demo

🔗 https://to-do-list-dtvt.onrender.com

##Features

### Task Management
- Create new tasks
- Edit existing tasks
- Delete tasks
- Mark tasks as completed
- Add task descriptions
- Assign due dates
- Add tags to tasks

### Categories
- Create custom categories
- Assign colors and icons to categories
- Filter tasks by category

### Task Priorities
- 🔴 Urgent
- 🟠 High
- 🟡 Medium
- 🟢 Low

### Filters
- All Tasks
- Today's Tasks
- Pending Tasks
- Completed Tasks
- Overdue Tasks

### Search & Sort
- Search tasks by title, description, or tags
- Sort by:
  - Newest
  - Due Date
  - Priority

### Dashboard
- Progress Ring
- Completion Percentage
- Total Tasks Counter
- Completed Tasks Counter

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

### Development Tools
- Nodemon
- dotenv

---

## Project Structure

```text
To Do List - Full Stack/
│
├── models/
│   ├── Todo.js
│   └── Category.js
│
├── routes/
│   ├── todos.js
│   ├── categories.js
│   └── stats.js
│
├── public/
│   ├── index.html
│   ├── style.css
│   │
│   └── js/
│       ├── api.js
│       ├── ui.js
│       └── app.js
│
├── server.js
├── package.json
├── .env
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/your-username/opus-smart-todo.git
cd opus-smart-todo
```

### Install Dependencies

```bash
npm install
```

### Create Environment File

Create a `.env` file in the root directory:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

---

## Run the Application

Development Mode:

```bash
npm run dev
```

Production Mode:

```bash
npm start
```

Server runs at:

```text
http://localhost:5000
```

---

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account.
2. Create a cluster.
3. Create a database user.
4. Add your IP address to Network Access.
5. Copy the connection string.
6. Paste it into the `.env` file.

Example:

```env
MONGODB_URI=mongodb://username:password@cluster-url/database-name
```

---

## 📸 Screenshots

### Dashboard

- Sidebar Navigation
- Task Statistics
- Progress Ring
- Task Filters

### Task Management

- Create Task Modal
- Edit Task
- Delete Task
- Category Management

---

## Future Enhancements

- User Authentication
- Dark / Light Theme Toggle
- Drag & Drop Task Sorting
- Email Reminders
- Calendar View
- Cloud Sync
- Mobile App Version

---

## Learning Outcomes

This project helped in understanding:

- REST API development
- MongoDB Atlas integration
- Express.js routing
- CRUD operations
- Frontend and backend integration
- Environment variable management
- Full-stack application architecture

---

## Author

**Janvi Singh**

##License

This project is developed for educational and portfolio purposes.
