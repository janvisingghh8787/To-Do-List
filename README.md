# Smart Todo App

A modern full-stack Todo Management application built using **FastAPI, MongoDB Atlas, HTML, CSS, and JavaScript**.

The application helps users organize tasks efficiently with categories, priorities, due dates, progress tracking, filtering, and real-time statistics.

---

##Live Demo

🔗 https://your-render-url.onrender.com

---

##Features

### Task Management

* Create new tasks
* Edit existing tasks
* Delete tasks
* Mark tasks as completed
* Add task descriptions
* Assign due dates
* Add tags to tasks

### Categories

* Create custom categories
* Assign colors and icons to categories
* Filter tasks by category

### Task Priorities

* 🔴 Urgent
* 🟠 High
* 🟡 Medium
* 🟢 Low

### Filters

* All Tasks
* Today's Tasks
* Pending Tasks
* Completed Tasks
* Overdue Tasks

### Search & Sort

* Search tasks by title, description, or tags
* Sort by:

  * Newest
  * Due Date
  * Priority

### Dashboard

* Progress Tracking
* Completion Percentage
* Total Tasks Counter
* Completed Tasks Counter
* Category Statistics

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript

### Backend

* FastAPI
* Uvicorn

### Database

* MongoDB Atlas
* Beanie ODM
* Motor

### Configuration

* Pydantic Settings
* Python Dotenv

---

## Project Structure

```text
To Do List - Full Stack/
│
├── models/
│   ├── todo.py
│   ├── category.py
│   └── __init__.py
│
├── routers/
│   ├── todos.py
│   ├── categories.py
│   └── stats.py
│
├── static/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── api.js
│   │   ├── ui.js
│   │   └── app.js
│   │
│   └── index.html
│
├── config.py
├── database.py
├── main.py
├── requirements.txt
├── .env
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/janvisingghh8787/To-Do-List.git
cd To-Do-List
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Virtual Environment

#### Windows

```bash
venv\Scripts\activate
```

#### Linux / macOS

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

##Environment Variables

Create a `.env` file:

```env
MONGODB_URL=your_mongodb_connection_string
DB_NAME=smart_todo
```

---

##Run the Application

Development Mode:

```bash
uvicorn main:app --reload
```

Application:

```text
http://127.0.0.1:8000
```

Swagger API Documentation:

```text
http://127.0.0.1:8000/docs
```

ReDoc Documentation:

```text
http://127.0.0.1:8000/redoc
```

---

##Deployment

The application can be deployed using:

* Render
* Railway
* Azure App Service
* AWS EC2

Example Render Start Command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## Screenshots

### Dashboard

* Task Overview
* Progress Tracking
* Category Statistics

### Task Management

* Create Task
* Edit Task
* Delete Task
* Category Management

---

##Future Enhancements

* User Authentication
* Dark / Light Theme
* Drag & Drop Tasks
* Email Reminders
* Calendar View
* Mobile Responsive Improvements
* User Accounts & Cloud Sync

---

##Learning Outcomes

This project helped strengthen knowledge in:

* FastAPI Development
* REST API Design
* MongoDB Atlas Integration
* Beanie ODM
* CRUD Operations
* Frontend & Backend Integration
* Environment Variable Management
* Full-Stack Application Architecture
* Deployment & Cloud Hosting

---

##Author

**Janvi Singh**

Bachelor of Technology (BTech) in Computer Science.

---

##License

This project is developed for educational and portfolio purposes.

