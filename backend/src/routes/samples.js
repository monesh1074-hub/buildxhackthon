const express = require('express');
const router = express.Router();

/**
 * Synthetic Sample Payloads for Hackathon Demos
 * (100% synthetic, non-real demonstration data)
 */
const SAMPLES = [
  {
    id: 'ecommerce_checkout',
    name: 'E-Commerce Order & Payment Webhook',
    badge: 'Critical PII & Financial',
    category: 'JSON Payload',
    description: 'Incoming payment webhook containing credit card numbers, email, phone, and customer tokens.',
    data: {
      event_id: "evt_998127394812",
      event_type: "charge.completed",
      timestamp: "2026-11-04T12:00:00Z",
      customer: {
        id: "cust_synth_8921",
        full_name: "Eleanor Vance",
        email: "eleanor.vance@synthetic-corp.io",
        phone: "+1-555-019-2834",
        ip_address: "198.51.100.42"
      },
      payment_method: {
        type: "card",
        card_brand: "visa",
        card_number: "4111 2222 3333 4444",
        cvv: "382",
        expiration: "12/28",
        billing_address: {
          line1: "742 Evergreen Terrace",
          city: "Springfield",
          state: "OR",
          postal_code: "97477"
        }
      },
      transaction: {
        amount: 249.99,
        currency: "USD",
        auth_token: "api_key_synth_9982481029481029481029"
      }
    }
  },
  {
    id: 'support_ticket_pii',
    name: 'Customer Support Escalation Ticket',
    badge: 'Identity & PII Leak',
    category: 'Unstructured Text',
    description: 'An anxious customer ticket leaking their SSN, phone number, email, and personal notes.',
    data: `URGENT - Identity Verification Issue
Date: 2026-11-04
From: Marcus Brody <marcus.brody@testmail.com>
Phone: +1-202-555-0143

Hello Support Team,

I am locked out of my corporate pension portal. My account identity number was rejected multiple times.
For verification purposes, my US Social Security Number is 453-29-8812 and my registered contact email is marcus.brody@testmail.com.
If you need to call me back immediately, you can reach me directly on my cell at (202) 555-0143 or my backup office desk at 202-555-0199.
Please expedite unlocking my account as I have payroll deadlines approaching.

Best regards,
Marcus Brody`
  },
  {
    id: 'server_error_log',
    name: 'Production Application Crash Log',
    badge: 'Credential & Token Leak',
    category: 'Application Logs',
    description: 'Real-world log trace leaking API secrets, Bearer JWT, internal IP addresses, and user email.',
    data: `2026-11-04 12:15:33 [ERROR] [auth-service] Unhandled exception processing downstream auth callback:
Request URI: /v1/oauth/exchange
Client IP: 192.168.1.145
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
  X-API-KEY: AKIAIOSFODNN7EXAMPLE991823
Payload context:
  {"user_email": "dev-admin@internal-testing.org", "access_token": "secret_live_883920194820192830", "user_id": 9942}
Stack Trace:
  at AuthService.validateToken (C:\\app\\services\\auth.js:142:19)
  at Layer.handle [as handle_request] (C:\\app\\node_modules\\express\\lib\\router\\layer.js:95:5)
  at next (C:\\app\\node_modules\\express\\lib\\router\\route.js:137:13)`
  },
  {
    id: 'banking_wire_transfer',
    name: 'International SWIFT Wire Transfer',
    badge: 'Banking & Financial',
    category: 'Financial Record',
    description: 'Cross-border wire transfer instruction with IBAN, swift code, routing number, and personal emails.',
    data: {
      transfer_reference: "WIRE-2026-X8841",
      execution_date: "2026-11-04",
      originator: {
        name: "Samantha Wright",
        email: "samantha.wright@example-corp.co.uk",
        phone: "+44 20 7946 0912",
        iban: "GB29NWBK60161331926819",
        account_number: "601613319268"
      },
      beneficiary: {
        name: "Klaus Schmidt",
        email: "klaus.schmidt@berlin-tech.de",
        iban: "DE89370400440532013000",
        bank_name: "Deutsche Bundesbank",
        amount_eur: 15400.00
      },
      memo: "Consulting retainers Q4 - Authorized via token_live_77182930491820"
    }
  }
];

/**
 * GET /api/samples
 * Returns realistic synthetic customer records for testing
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: SAMPLES
  });
});

module.exports = router;

