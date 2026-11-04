# 🛡️ PrivacyShield — Enterprise API Data Loss Prevention

> **Prevent sensitive customer data leakage in APIs, microservices, and application logs with zero-knowledge inline masking.**

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-purple.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/Frontend-React_19_+_Vite-black.svg)](https://react.dev/)
[![Design System](https://img.shields.io/badge/Design-Light_SaaS_+_Geist_+_Space_Grotesk-7C3AED.svg)](#)
[![Database](https://img.shields.io/badge/Database-SQLite_WAL-blue.svg)](https://sqlite.org/)
[![Zero Storage](https://img.shields.io/badge/Security-Zero--Plaintext_Storage-10B981.svg)](#zero-storage-guarantee)

---

## 🚀 Quick Start (1-Click Launch)

Run the unified server (starts the backend and serves the React dashboard at port 5000):

```bash
npm start
```
Or double-click `start.bat` on Windows.

Open your browser to:
👉 **[http://localhost:5000](http://localhost:5000)**

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
| **Settings** | `settings` | System architecture specs, SQLite WAL persistence controls, audit export, and database maintenance. |

---

## 🔒 Zero-Storage Guarantee

- **Application Logs:** The custom Express `privacyLogger` middleware intercepts incoming request bodies and automatically sanitizes them before outputting to `console.log` or disk.
- **SQLite Database:** The SQLite schema has no storage column for raw unmasked inputs. Only the sanitized content and detection counts are persisted.
- **Verification Endpoint:** Call `GET /api/history/verify-zero-leakage` or click **"Verify Zero-PII"** in the top navigation bar to audit the SQLite database directly and confirm zero unmasked customer records exist.

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
  "zeroLeakageVerified": true
}
```

### 2. API Gateway Simulator
`POST /api/scan/simulate-api-gateway`

### 3. Telemetry & Analytics
`GET /api/stats`

### 4. Audit History
`GET /api/history?search=&riskLevel=ALL&limit=50`

### 5. Verify Zero-Storage Proof
`GET /api/history/verify-zero-leakage`

### 6. Inspection Policies
- `GET /api/rules`
- `PATCH /api/rules/:id/toggle`
- `POST /api/rules`
- `DELETE /api/rules/:id`

---

*PrivacyShield — Built with Precision for Enterprise Data Loss Prevention.*
