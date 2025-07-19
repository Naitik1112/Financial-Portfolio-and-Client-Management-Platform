# 💼 Financial Portfolio and Client Management Platform

A full-stack platform designed for **financial advisors** to seamlessly manage clients' mutual funds, fixed deposits, and insurance (life & general) portfolios from a centralized dashboard. It automates SIP deductions, handles taxation via FIFO redemption logic, and generates dynamic performance reports—eliminating the inefficiencies of Excel-based workflows.

---

## 🧩 Problem

Financial advisors often work with clients whose investments are spread across multiple institutions, each offering separate platforms. Due to this:

- Advisors rely on **manual Excel sheets** to track mutual funds, insurance, and debt funds.
- Generating client reports and calculating taxes becomes **error-prone and time-consuming**.
- There's **no way to group family clients** or automate SIPs and redemptions efficiently.
- As the client base scales, managing performance and data becomes chaotic.

---

## ✅ Solution

This platform solves the above by offering:

- 🔗 **Unified client dashboard** to track all investments.
- 🔁 **Automated SIP deductions** and redemptions using `node-cron` and **RabbitMQ** for async task execution.
- 📊 **Performance dashboards** with filtering options (weekly/monthly/yearly).
- 📄 **Dynamic PDF & Excel reports** with auto-email delivery using `Nodemailer`.
- 📦 **Redis caching** to handle large data sets (up to **34,000+ entries**).
- 👨‍👩‍👧‍👦 **Group management** to combine portfolios (e.g., family-based reports).
- 🧾 **Tax calculation** based on **FIFO logic** for redemptions.
- 🔒 **Insurance claim tracking** (life & general).
- 💰 **Fixed deposit management** with maturity tracking.

---

## 🚀 Features

### 🔍 Portfolio Management
- Mutual Funds, Debt Funds, Fixed Deposits
- Life & General Insurance policies
- Historical asset tracking and breakdowns

### 🔄 SIP & Redemption Automation
- Scheduled SIP deductions via `node-cron`
- FIFO-based redemption logic
- Asynchronous processing with `RabbitMQ`

### 📈 Dashboards & Analytics
- Interactive graphs using `Chart.js`
- Filters: Weekly, Monthly, Yearly

### 🧾 Taxation Support
- Tax computation during redemption

### 📑 Dynamic Report Generation
- Over 10 reports: valuation, grouped, taxation, cash flow, etc.
- PDF: `PDFKit` | Excel: `ExcelJS`
- Auto-sent to clients via `Nodemailer`

### 👨‍👩‍👧 Group & Family Management
- Combine portfolios under a single entity
- Generate grouped insights and reports

### 🛡️ Claim Management
- Life & General Insurance claim logs
- Request date, approved amount/date, status

---

## 🛠️ Tech Stack

| Component           | Technology         |
|---------------------|--------------------|
| Frontend            | React.js + MUI     |
| Backend             | Node.js, Express.js|
| Database            | MongoDB            |
| Caching             | Redis              |
| Scheduler           | node-cron          |
| Queue Processing    | RabbitMQ           |
| PDF Reports         | PDFKit             |
| Excel Reports       | ExcelJS            |
| Email Delivery      | Nodemailer         |
| Charting            | Chart.js           |

## 🔗 External APIs Used

The platform integrates the following external APIs to fetch and update mutual fund data:

- **Mutual Fund List API**  
  Used to retrieve the list of all mutual funds along with their corresponding AMFI codes.  
  ➤ `https://www.mfapi.in/`

- **Mutual Fund NAV API**  
  Used to fetch historical NAV data of a mutual fund using its AMFI code.  
  ➤ `https://api.mfapi.in/mf/{AMFI_CODE}`  
  Example: `https://api.mfapi.in/mf/145456`
  
  Used to fetch latest NAV data of a mutual fund using its AMFI code.  
  ➤ `https://api.mfapi.in/mf/{AMFI_CODE}/latest`  
  Example: `https://api.mfapi.in/mf/145456/latest`

---

## 🧠 Upcoming Features

- **SWP (Systematic Withdrawal Plan)**: Automate periodic withdrawals based on rules.
- **AI-based Investment Recommendations**: Based on client goals, risk, and historical data.
- **Client Notification System**: Notify via email/SMS on SIP due dates and redemptions.
- **Dockerization and CI/CD pipelining**: To Ensure Scalability.

---

## ⚙️ Setup Instructions

```bash
# Clone the repository
git clone https://github.com/your-repo/finance-management-platform.git

# Backend Setup
cd backend
npm install
npm start

# Frontend Setup
cd ../frontend
npm install
npm start
