# 🛡️ PrivacyShield — Enterprise API Data Loss Prevention

> **Prevent sensitive customer data leakage in APIs, microservices, and application logs with zero-knowledge inline masking.**

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-purple.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/Frontend-React_19_+_Vite-black.svg)](https://react.dev/)
[![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL_+_SQLite_WAL-3ECF8E.svg)](https://supabase.com/)
[![Zero Storage](https://img.shields.io/badge/Security-Zero--Plaintext_Storage-10B981.svg)](#zero-storage-guarantee)

---

## ⚡ Quick Start (1-Click Launch)

Run the unified server (starts the backend and serves the React dashboard at port 5000):

```bash
npm start
```
Or double-click `start.bat` on Windows.

Open your browser to:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## ☁️ Running on Supabase Online (PostgreSQL)

PrivacyShield features a **Dual-Database Architecture**:
- **Local Mode (Default):** Runs with zero configuration using embedded SQLite (WAL mode).
- **Online Cloud Mode:** Connects directly to **Supabase Online PostgreSQL** for cloud persistence!

### 3-Step Supabase Setup:

1. **Run the Schema in Supabase SQL Editor:**
   - Create a free project at [supabase.com](https://supabase.com).
   - In your Supabase dashboard, click **SQL Editor**.
   - Copy the entire contents of [`supabase_schema.sql`](./supabase_schema.sql) and paste it into the editor.
   - Click **Run**. This creates the `scans`, `scan_detections`, `detection_rules` tables, RLS security policies, and stored audit procedures!

2. **Connect via the UI or `.env`:**
   - **Option A (Via Dashboard UI):** Go to **Settings** > **Supabase Cloud Database** in the PrivacyShield dashboard. Enter your Project URL and API Key, test the connection, and click **Connect to Supabase Cloud**.
   - **Option B (Via `.env` file):**
     ```env
     PORT=5000
     SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_KEY=your-supabase-anon-or-service-role-key
     ```

3. **Verify Online Status:**
   The top header badge will change to **"Supabase Online"** (emerald pill), and all incoming scans, rules, and zero-storage audits will run on your cloud PostgreSQL database!

---

## 🎨 Design System & Visual Architecture

PrivacyShield has been designed with the aesthetics of top-tier cybersecurity SaaS platforms (Snyk, Vanta, Cloudflare, Stripe Workbench):

- **Color Palette:** Pure white primary canvas (`#FFFFFF`), light slate secondary surface (`#F8FAFC`), deep charcoal primary typography (`#111827`), brand purple (`#7C3AED` / `#4C1D95`), and obsidian black (`#09090B`).
- **Rainbow Metric Accents:** Controlled, tasteful rainbow accents for category indicators (Cyan `#06B6D4`, Emerald `#10B981`, Amber `#F59E0B`, Red `#EF4444`, Blue `#3B82F6`, Violet `#8B5CF6`).
- **Typography:**
  - Headings: `Space Grotesk`
  - Dashboard & Numbers: `Geist`
  - Body Text: `Inter`
  - Code & Payloads: `JetBrains Mono`
- **Iconography:** 100% Lucide React icons with uniform stroke width and sizing. Zero emoji icons or random Unicode symbols.
- **Selective Liquid Glass:** Applied to modal dialogs, floating status pills, and highlighted security badges.
- **Feature Cards Layout:** Exactly **three cards per row** on desktop with colored left accent stripes and subtle elevation hovers.

---

## 🎛️ Platform Modules & Navigation

| Module | Route / Tab | Description |
| :--- | :--- | :--- |
| **Overview** | `overview` | Bento-grid executive summary, 3x3 feature capabilities cards, threat breakdown, and quick launch. |
| **Scan & Mask Studio** | `scanner` | Developer tool with side-by-side JSON/text editors, masking selector, and terminal-style sanitized log preview. |
| **Security Analytics** | `analytics` | Threat severity distribution, category breakdown bars, and daily volume metrics. |
| **Audit History** | `history` | Searchable, filterable audit log of sanitized scans with deep-dive modal. |
| **Detection Policies** | `rules` | Inspection rule toggles and custom regular expression policy authoring. |
| **API Gateway Interceptor** | `simulator` | Reverse proxy simulation demonstrating inline request filtering before log sinks. |
| **Settings** | `settings` | Connect Supabase Online PostgreSQL, SQLite persistence controls, audit export, and database maintenance. |

---

## 🔒 Zero-Storage Guarantee

- **Application Logs:** The custom Express `privacyLogger` middleware intercepts incoming request bodies and automatically sanitizes them before outputting to `console.log` or disk.
- **Database (Supabase / SQLite):** The schema has no storage column for raw unmasked inputs. Only the sanitized content and detection counts are persisted.
- **Verification Stored Function:** Call `GET /api/history/verify-zero-leakage` or click **"Verify Zero-PII"** in the top navigation bar to run an audit directly on the database (via PostgreSQL regex or SQLite) and confirm zero unmasked customer records exist.

---

## 📡 Express API Reference

### 1. Scan and Sanitize Payload
`POST /api/scan`

**Request Body:**
```json
{
  "content": {
    "customer": "Eleanor Vance",
    "email": "eleanor.vance@example.com",
    "phone": "+1-555-019-2834",
    "card_number": "4111-2222-3333-4444",
    "ssn": "123-45-6789"
  },
  "maskingMode": "partial",
  "previewTitle": "Customer Order Ingestion"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "scanId": "3b29c9fe-a94f-4d3f-a39c-70e28151f122",
  "maskingMode": "partial",
  "sanitizedContent": "{\n  \"customer\": \"Eleanor Vance\",\n  \"email\": \"e*****e@example.com\",\n  \"phone\": \"***-***-2834\",\n  \"card_number\": \"****-****-****-4444\",\n  \"ssn\": \"***-**-6789\"\n}",
  "detectionsCount": 4,
  "riskScore": 78,
  "riskLevel": "CRITICAL",
  "processingTimeMs": 1.25,
  "zeroLeakageVerified": true,
  "database": "SUPABASE"
}
```

### 2. Database Controls & Supabase Configuration
- `GET /api/database/status`: Current database status (`SUPABASE` vs `SQLITE`).
- `POST /api/database/test-supabase`: Test credentials against online Supabase.
- `POST /api/database/configure-supabase`: Switch live runtime backend to Supabase.
- `GET /api/database/schema-sql`: Fetch the full `supabase_schema.sql`.

---

*PrivacyShield — Built with Precision for Enterprise Data Loss Prevention.*
