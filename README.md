# 🚛 TransitOps – Smart Transport Operations Platform

A modern Transport Operations Management System built to digitize fleet operations, vehicle management, driver allocation, trip scheduling, maintenance, fuel tracking, and operational analytics.

> Developed for the Hackathon.

---

## 📖 Overview

TransitOps helps logistics companies replace spreadsheets and manual logbooks with a centralized platform for managing transport operations.

The platform provides:

- Vehicle Management
- Driver Management
- Trip Planning & Dispatch
- Maintenance Tracking
- Fuel & Expense Management
- Operational Dashboard
- Reports & Analytics

---

# 🚀 Tech Stack

## Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Chart.js
- Lucide React

## Backend

- Node.js
- Express.js
- Prisma ORM
- JWT Authentication

## Database

- PostgreSQL

---

# 📁 Project Structure

```
TransitOps/

├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── utils/
│   │   └── app.js
│   │
│   └── package.json
│
└── README.md
```

---

# ✨ Features

## Authentication

- Login
- JWT Authentication
- Role-Based Access Control

---

## Dashboard

- Active Vehicles
- Available Vehicles
- Vehicles In Maintenance
- Active Trips
- Pending Trips
- Drivers On Duty
- Fleet Utilization
- Fuel Cost Summary

---

## Vehicle Management

- Register Vehicle
- Update Vehicle
- Delete Vehicle
- Vehicle Status
- Vehicle Capacity
- Vehicle Documents

---

## Driver Management

- Driver Profiles
- License Information
- Safety Score
- Driver Status
- License Expiry Tracking

---

## Trip Management

- Create Trip
- Assign Vehicle
- Assign Driver
- Cargo Validation
- Trip Lifecycle

```
Draft
↓

Dispatched
↓

Completed

or

Cancelled
```

---

## Maintenance

- Maintenance Requests
- Service Logs
- Vehicle Status Updates
- Maintenance History

---

## Fuel & Expense

- Fuel Logs
- Maintenance Cost
- Toll Expenses
- Operational Cost

---

## Reports

- Fleet Utilization
- Fuel Efficiency
- Vehicle ROI
- Cost Analysis
- CSV Export
- PDF Export *(Optional)*

---

# 📊 Dashboard Analytics

- Fleet Utilization
- Active Trips
- Vehicle Status Distribution
- Fuel Consumption
- Operational Cost
- Vehicle ROI

---

# 👥 User Roles

## Admin

- Manage Users
- Dashboard
- Full System Access

---

## Fleet Manager

- Vehicle Management
- Trip Management
- Maintenance
- Reports

---

## Safety Officer

- Driver Management
- License Monitoring
- Safety Score

---

## Financial Analyst

- Fuel Logs
- Expenses
- Reports
- ROI

---

# 🗄️ Database Schema

## Users

- id
- name
- email
- password
- role

---

## Vehicles

- id
- registrationNumber
- vehicleName
- type
- capacity
- odometer
- acquisitionCost
- status

---

## Drivers

- id
- name
- licenseNumber
- licenseCategory
- expiryDate
- safetyScore
- contactNumber
- status

---

## Trips

- id
- vehicleId
- driverId
- source
- destination
- cargoWeight
- plannedDistance
- actualDistance
- fuelConsumed
- status

---

## Maintenance

- id
- vehicleId
- description
- startDate
- endDate
- cost
- status

---

## Fuel Logs

- id
- vehicleId
- liters
- cost
- date

---

## Expenses

- id
- vehicleId
- category
- amount
- date

---

# 🔒 Business Rules

- Vehicle Registration Number must be unique.
- Retired or In Maintenance vehicles cannot be assigned.
- Driver with expired license cannot be assigned.
- Driver already on trip cannot be assigned.
- Vehicle already on trip cannot be assigned.
- Cargo weight must not exceed vehicle capacity.
- Dispatch automatically changes Vehicle and Driver status.
- Completing trip restores availability.
- Maintenance automatically changes vehicle status.

---

# 📈 KPIs

- Active Vehicles
- Available Vehicles
- Vehicles in Maintenance
- Drivers On Duty
- Active Trips
- Pending Trips
- Fleet Utilization
- Operational Cost

---

# 🛠️ Installation

## Clone Repository

```bash
git clone https://github.com/your-username/transitops.git
```

---

## Frontend

```bash
cd client

npm install

npm run dev
```

---

## Backend

```bash
cd server

npm install

npx prisma generate

npx prisma migrate dev

npm run dev
```

---

## Environment Variables

Create a `.env` file inside the server folder.

```env
DATABASE_URL=

JWT_SECRET=

PORT=5000
```

---

# 📌 Future Enhancements

- Email Notifications
- QR Code Vehicle Tracking
- Document Upload
- Live GPS Tracking
- Dark Mode
- Mobile Responsive Improvements
- Advanced Reports

---

# 👨‍💻 Team

Developed during the Hackathon.

---

# 📄 License

MIT License