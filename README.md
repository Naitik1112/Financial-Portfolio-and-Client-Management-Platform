# Financial-Portfolio-and-Client-Management-Platform

A comprehensive finance management solution built for finance firms to manage clients' mutual funds, insurance, debt funds, and generate detailed reports. The platform automates SIP deductions, provides insightful dashboards, and supports smart group and claim management.

---

## 🚀 Features

### ✅ Core Functionalities
- **Client Portfolio Management**:
  - Track Mutual Funds, Debt Funds, and Insurance policies.
  - View detailed asset breakdown and historical data.

- **Automated SIP Handling**:
  - SIP amounts automatically deducted using `node-cron` scheduler.

- **Report Generation**:
  - Generate customized **PDF** and **Excel** reports using **PDFKit** and **ExcelJS**.
  - Reports can be emailed to clients using **Nodemailer**.

- **Performance Dashboards**:
  - Visual analytics using **Chart.js** and **MUI**.
  - Monthly, quarterly, yearly filters for insights.

- **Redis Caching**:
  - Cache large datasets (~14,000 entries) to improve performance.

- **Redemption Logic**:
  - FIFO-based (First-In, First-Out) unit deduction, aligned with industry-standard logic.

### 👨‍👩‍👧‍👦 Group Management
- Admin can group users (e.g., same family) to manage and generate combined reports.

### 📑 General Insurance Claim Tracking
- Store and manage claim request dates, amounts, and approved dates and amounts.

---

## 🛠️ Tech Stack

| Component         | Technology           |
|------------------|----------------------|
| Frontend         | React.js (MUI)       |
| Backend          | Node.js, Express.js  |
| Database         | MongoDB              |
| Caching          | Redis                |
| PDF Generation   | PDFKit               |
| Excel Generation | ExcelJS              |
| Email            | Nodemailer           |
| Charts           | Chart.js             |
| Scheduler        | node-cron            |

---

## 🧠 Upcoming Features

- **SWP (Systematic Withdrawal Plan)**:
  - Automate periodic withdrawals based on user preferences.

- **Smart Recommendations**:
  - AI-based system to suggest the most suitable investment options for brokers/firms based on client's historical data, risk profile, and goals.

---

## 📦 Setup Instructions

```bash
# Clone the repo
git clone https://github.com/your-repo/finance-management-platform.git

# Backend Setup
cd backend
npm install
npm start

# Frontend Setup
cd ../frontend
npm install
npm start
