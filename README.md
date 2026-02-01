#TimeSheet
A basic timesheet application created by using MEAN stack(Angular js,Node.js,Mongo DB)
This README is designed for the **sibyct/Timesheet** repository, based on the project's tech stack (MEAN: MongoDB, Express, Angular, Node.js) and its purpose as a basic time management tool.

---

# ⏰ Timesheet Management System

A simple, lightweight timesheet application designed to help individuals and teams track their daily work hours, manage project tasks, and generate reports. Built using the **MEAN stack**, this application provides a seamless experience from the database to the user interface.

## 🚀 Features

* **User Authentication:** Secure login and registration for employees and managers.
* **Time Tracking:** Log daily work hours with project-specific details.
* **Dashboard:** Visual summary of weekly and monthly hours worked.
* **Management View:** Admins can view and review timesheets submitted by team members.
* **Responsive Design:** Fully functional on both desktop and mobile browsers.

## 🛠️ Tech Stack

* **Frontend:** [AngularJS](https://angularjs.org/) (Client-side logic and UI)
* **Backend:** [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/) (RESTful API)
* **Database:** [MongoDB](https://www.mongodb.com/) (NoSQL database for flexible data storage)
* **Styling:** CSS3 & Bootstrap

## 📥 Installation & Setup

Follow these steps to get the project running locally:

### 1. Prerequisites

Ensure you have the following installed:

* [Node.js](https://nodejs.org/en/download/) (v12+ recommended)
* [MongoDB](https://www.mongodb.com/try/download/community) (running locally or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) URI)

### 2. Clone the Repository

```bash
git clone https://github.com/sibyct/Timesheet.git
cd Timesheet

```

### 3. Install Dependencies

```bash
npm install

```

### 4. Configure Environment

Create a configuration file (or update `config.js` if present) to include your MongoDB connection string:

```javascript
// Example Connection
mongodb://localhost:27017/timesheet_db

```

### 5. Run the Application

```bash
node server.js

```

The application will be available at `http://localhost:3000` (or the port specified in your environment).

## 📂 Project Structure

```text
├── public/             # Frontend Angular files (Controllers, Views, Services)
├── models/             # Mongoose schemas for MongoDB
├── routes/             # Express API routes
├── server.js           # Entry point for the Node.js server
└── package.json        # Dependencies and scripts

```

## 📝 Roadmap

* [ ] Implement PDF/Excel export for timesheet reports.
* [ ] Add Email notifications for timesheet approvals.
* [ ] Transition to Angular 2+ (Modern Angular).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

---

*Created with ❤️ by [sibyct*](https://github.com/sibyct)
