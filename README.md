# Suhaim Soft ERP - Wholesale Pharmacy Management

A modern, responsive, and comprehensive Enterprise Resource Planning (ERP) application designed specifically for Wholesale Pharmacy operations.

## Key Features

* **Dashboard & Analytics:** Real-time business metrics, net profit calculations, and recent activity timelines.
* **Inventory Management:** Track stock levels, low-stock alerts, and comprehensive product cataloging with dynamic categorization.
* **Sales & POS:** Process orders, generate invoices, track payment status, and manage the checkout cart seamlessly.
* **Procurement Hub:** Manage supplier purchases, debit notes, order tracking, and stock intake.
* **Expenses Tracking:** Log overheads, utilities, and maintain a detailed ledger of all business outgoings.
* **Cash Book Flow:** Monitor all cash inflows (sales) and outflows (purchases, expenses) with automated balance calculations.
* **Role-based Access Control (RBAC):** Secure login portal supporting Administrators, Managers, and Accountants with restricted module access.

## Tech Stack

* **Frontend:** React, Tailwind CSS, Lucide Icons, Vite
* **State Management:** React Context API (AuthContext)
* **Routing:** React Router DOM
* **Charts & Visualizations:** Recharts
* **Backend:** Node.js, Express (API structure built in)

## Folder Structure

```text
whole-sale-pharcmcy/
├── backend/                  # Node.js/Express API Server
│   ├── config/               # Database and environment configurations
│   ├── controllers/          # Request handlers and business logic
│   ├── middleware/           # Express middlewares (auth, validation)
│   ├── models/               # Mongoose database schemas
│   ├── routes/               # API route definitions
│   ├── services/             # Reusable business logic and external APIs
│   └── utils/                # Helper functions and utilities
├── frontend/                 # React UI Application
│   ├── public/               # Static assets (icons, favicons)
│   └── src/
│       ├── assets/           # Images and media
│       ├── components/       # Reusable React components (modals, tables)
│       ├── context/          # React Context (Auth)
│       ├── pages/            # Main views (Dashboard, Login)
│       └── services/         # API integration methods
└── README.md
```

## Getting Started

1. Clone the repository
2. Run `npm install` in both the `frontend` and `backend` directories.
3. Start the development server using `npm run dev` in the `frontend` directory.

## License

&copy; Suhaim Soft ERP. All rights reserved.
