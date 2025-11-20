# Frontend Folder Structure

## Overview
This document describes the organized folder structure of the frontend application.

## Directory Structure

```
src/
├── pages/                    # Page components (top-level routes)
│   ├── Login.tsx            # Login page
│   └── Dashboard.tsx        # Main dashboard page
│
├── components/              # Reusable components
│   ├── cards/               # Card components
│   │   └── AnalyticsCards.tsx
│   │
│   ├── dashboards/          # Dashboard-specific components
│   │   ├── ApproverDashboard.tsx
│   │   └── FinanceDashboard.tsx
│   │
│   ├── layout/              # Layout components
│   │   └── Layout.tsx       # Main layout with header/nav
│   │
│   ├── modals/              # Modal components
│   │   └── LogoutModal.tsx
│   │
│   ├── requests/            # Request-related components
│   │   ├── RequestDetail.tsx
│   │   ├── RequestForm.tsx
│   │   └── RequestList.tsx
│   │
│   ├── table/               # Table components
│   │   └── DataTable.tsx
│   │
│   └── columns/             # Table column definitions
│       └── index.tsx
│
├── context/                 # React Context providers
│   └── AuthContext.tsx
│
├── services/                # API services and utilities
│   └── api.ts
│
├── App.tsx                  # Main app component with routing
├── index.tsx                # Entry point
└── index.css                # Global styles
```

## Organization Principles

1. **Pages**: Top-level route components that represent full pages
2. **Components**: Reusable UI components organized by feature/type
   - **cards**: Card-based UI components
   - **dashboards**: Dashboard-specific views
   - **layout**: Layout and navigation components
   - **modals**: Modal/dialog components
   - **requests**: Request management components
   - **table**: Table and data display components
   - **columns**: Table column definitions

## Import Paths

- Pages: `../pages/PageName`
- Components: `../components/category/ComponentName`
- Context: `../context/ContextName`
- Services: `../services/serviceName`

