# CyberDrill -- Standard Operating Procedure

**Document ID:** CD-SOP-001
**Version:** 1.1
**Classification:** Internal -- Confidential
**Effective Date:** 2026-02-14
**Owner:** CyberDrill Development Team

---

## Table of Contents

1. [Objective & Scope](#1-objective--scope)
2. [System Architecture](#2-system-architecture)
3. [Simulation Lifecycle](#3-simulation-lifecycle)
4. [Data Privacy & Ethics Protocol](#4-data-privacy--ethics-protocol)
5. [Post-Drill Analysis](#5-post-drill-analysis)
6. [Revision History](#6-revision-history)

---

## 1. Objective & Scope

### 1.1 Objective

CyberDrill is an automated phishing and vishing simulation platform that functions as a controlled "fire drill" for corporate security. Its purpose is to:

- Measure organizational resilience against multi-channel social engineering attacks (email and voice).
- Provide employees with immediate, actionable feedback when they fail to identify a simulated attack.
- Generate quantifiable metrics that inform security awareness training programs.
- Establish a recurring assessment baseline without exposing the organization to real risk.

### 1.2 Scope

This SOP governs all activities related to the design, deployment, execution, and analysis of CyberDrill simulations. The following boundaries apply:

| In Scope | Out of Scope |
|---|---|
| AI-generated phishing emails targeting enrolled employees | Attacks against systems or infrastructure (penetration testing) |
| AI-generated vishing call scripts coordinated with email campaigns | Collection, storage, or exfiltration of actual user credentials |
| Cloned company login pages used solely for interaction capture | Simulation of malware delivery, payload execution, or exploitation |
| Post-interaction educational redirection ("Learning Moment") | Targeting of individuals not enrolled in the drill program |
| Aggregated, anonymized reporting to employer administrators | Disciplinary action based solely on drill results |

### 1.3 Authorization Requirements

No drill may be launched without:

1. Written authorization from an organizational stakeholder with appropriate authority (CISO, VP of Security, or equivalent).
2. Acknowledgment from the organization's legal counsel that the drill complies with local employment and privacy law.
3. A signed CyberDrill Engagement Agreement specifying target scope, timing windows, and escalation contacts.

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
+---------------------+        +------------------------+        +--------------------+
|   Employer Dashboard | -----> |  CyberDrill Core Engine | -----> |  Delivery Services |
|   (Campaign Mgmt)   |        |  (Orchestration Layer)  |        |  (Email + Voice)   |
+---------------------+        +------------------------+        +--------------------+
        |                               |                                  |
        v                               v                                  v
+------------------+           +----------------+              +--------------------+
| Page Capture     |           | AI Generation  |              | Employee Interaction|
| (SingleFile +    |           | Engine (LLM)   |              | Layer (Landing Page)|
|  ngrok Tunnel)   |           +----------------+              +--------------------+
+------------------+                                                    |
                                                                        v
                                                                +--------------------+
                                                                | Learning Moment    |
                                                                | + Result Reporting |
                                                                +--------------------+
```

### 2.2 Component Breakdown

#### 2.2.1 Employer Dashboard

- **Technology:** Web application (React frontend, REST/GraphQL API backend).
- **Function:** Campaign creation, target list management, scheduling, real-time monitoring, and report retrieval.
- **Login Page URL Input:** During campaign creation, the Employer Admin provides the URL of the organization's real login page (e.g., `https://sso.acmecorp.com/login`). This URL is used by the Page Capture Service (Section 2.2.3) to generate a pixel-perfect clone via SingleFile.
- **Access Control:** Role-based access control (RBAC) with MFA enforcement for all administrator accounts.

#### 2.2.2 CyberDrill Core Engine (Orchestration Layer)

- **Function:** Central coordinator that receives campaign parameters from the dashboard, dispatches requests to the AI Generation Engine, schedules delivery through email and voice services, and aggregates interaction data.
- **Queueing:** Asynchronous task queue (e.g., Celery/RabbitMQ or equivalent) manages campaign dispatch, retry logic, and rate limiting.
- **State Management:** Each campaign and each individual target maintains a finite state machine tracking progression through the simulation lifecycle (see Section 3).

#### 2.2.3 Page Capture Service (SingleFile + ngrok)

This component is responsible for cloning the target organization's login page and making it accessible to drill targets.

- **Capture Method -- SingleFile:**
  - [SingleFile](https://github.com/gildas-lormeau/SingleFile) is a browser extension (and CLI tool) that saves a complete web page -- including CSS, images, fonts, and inline JavaScript -- into a single, self-contained `.html` file.
  - When the Employer Admin submits a login page URL during campaign creation, the Core Engine invokes the SingleFile CLI (headless Chromium) to navigate to that URL and produce a faithful snapshot of the page.
  - The resulting `.html` file is a pixel-perfect replica of the original login page as rendered in the browser at capture time.

- **Post-Capture Modification:**
  - After the SingleFile capture, the Core Engine programmatically modifies the saved HTML file before hosting:
    1. **Form Action Rewrite:** All `<form>` `action` attributes are rewritten to point to the local CyberDrill submission handler endpoint (e.g., `/api/capture-event`). This ensures form submissions are intercepted locally rather than sent to the real authentication server.
    2. **Tracking Token Injection:** A hidden `<input>` field containing the per-target tracking token is injected into each form.
    3. **Credential Stripping Script Injection:** A JavaScript snippet is injected that intercepts the `submit` event, transmits only the tracking token and a `submitted: true` flag to the CyberDrill backend, clears all form field values, and then redirects the employee to the Learning Moment page. No credential data leaves the browser (see Section 4.1).
    4. **External Link Neutralization:** All hyperlinks and scripts that point back to the real organization's infrastructure are neutralized to prevent unintended traffic to production systems.

- **Hosting -- Local Server + ngrok Tunnel:**
  - The modified HTML file is served by a lightweight local HTTP server (e.g., Express.js, Flask, or a static file server) running on `localhost`.
  - An [ngrok](https://ngrok.com/) tunnel is established to expose the local server to the public internet via a unique HTTPS URL (e.g., `https://<random-subdomain>.ngrok-free.app`).
  - This ngrok URL becomes the phishing link embedded in the drill emails. Each campaign generates a fresh tunnel with a unique subdomain.
  - **Tunnel Lifecycle:** The ngrok tunnel is created at campaign launch and is automatically terminated at campaign close or after a configurable maximum duration (default: 72 hours), whichever comes first.
  - **ngrok Configuration:**
    - HTTPS is enforced (HTTP connections are rejected).
    - Request inspection/logging in the ngrok dashboard is disabled to prevent credential exposure at the tunnel layer.
    - The ngrok authtoken used is dedicated to CyberDrill operations and is rotated quarterly.

#### 2.2.4 AI Generation Engine

- **Technology:** Large Language Model (LLM) integration via API.
- **Function:** Generates two coordinated artifacts per target:
  1. **Phishing Email** -- contextually tailored using company name, industry vertical, and selected pretext scenario (e.g., IT password reset, HR benefits enrollment, executive impersonation).
  2. **Vishing Script** -- a follow-up phone call script designed to reinforce the email pretext and pressure the target into acting on the phishing link.
- **Guardrails:**
  - All generated content is reviewed against a content policy filter before delivery.
  - Generation prompts are templatized and versioned; free-form prompt injection by operators is prohibited.
  - Output is logged (content only, no credential data) for audit purposes.

#### 2.2.5 Delivery Services

- **Email Delivery:**
  - Dispatched via a dedicated mail transfer agent (MTA) with properly configured SPF, DKIM, and DMARC records for the simulation sending domain.
  - The sending domain is registered specifically for CyberDrill operations and is disclosed to the client organization's email security team to prevent unintended quarantine.
- **Voice Delivery:**
  - AI-synthesized or human-read vishing calls initiated through a telephony API (e.g., Twilio or equivalent).
  - Calls are placed within pre-approved time windows only.
  - All calls include a mechanism for the employee to opt out or report the call (e.g., "Press 9 to speak with your IT department").

#### 2.2.6 Employee Interaction Layer (Landing Page)

- **Function:** Serves the SingleFile-captured clone of the target organization's login page through the ngrok tunnel. The clone is:
  - Served over HTTPS via the ngrok tunnel URL (e.g., `https://<subdomain>.ngrok-free.app`).
  - Visually identical to the legitimate login page (pixel-perfect SingleFile capture) to test employee vigilance.
  - Functionally inert -- the injected JavaScript intercepts form submissions, triggers an **interaction event** on the local CyberDrill backend, but does NOT transmit, process, or persist any entered credentials (see Section 4).
- **Request Flow:**
  1. Employee clicks the phishing link containing the ngrok URL + tracking token.
  2. ngrok forwards the request through the tunnel to the local server.
  3. The local server serves the modified SingleFile HTML page.
  4. On form submission, the injected script sends only the tracking token and event flag to the local CyberDrill backend via the same tunnel, then redirects to the Learning Moment page.
- **Interaction Capture:** The system records only the following metadata:
  - Timestamp of page visit.
  - Timestamp of form submission (boolean: submitted yes/no).
  - Browser user-agent string (for aggregate analytics only).
- **Immediate Redirect:** Upon form submission, the employee is redirected to the Learning Moment page within 1 second.

#### 2.2.7 Learning Moment & Reporting Module

- Detailed in Section 5.

---

## 3. Simulation Lifecycle

### 3.1 Lifecycle Phases

```
[1. Campaign Creation] --> [2. Page Capture & Content Generation] --> [3. Delivery]
        --> [4. Employee Interaction] --> [5. Result Capture] --> [6. Reporting]
```

### 3.2 Phase Details

#### Phase 1: Campaign Creation

| Step | Actor | Action |
|------|-------|--------|
| 1.1 | Employer Admin | Logs into the CyberDrill Dashboard. |
| 1.2 | Employer Admin | Creates a new campaign: assigns a name, selects a pretext scenario, defines the target employee list (via CSV upload or directory integration), and sets the delivery window. |
| 1.3 | Employer Admin | Provides the URL of the organization's login page to be cloned (e.g., `https://sso.acmecorp.com/login`). |
| 1.4 | System | Validates target list against the authorized scope defined in the Engagement Agreement. Rejects any targets outside scope. Validates that the provided login page URL is reachable and belongs to the client organization's domain. |
| 1.5 | Employer Admin | Reviews campaign summary and confirms launch. |

#### Phase 2: Page Capture & Content Generation

| Step | Actor | Action |
|------|-------|--------|
| 2.1 | Core Engine | Invokes the SingleFile CLI (headless Chromium) to capture the login page URL provided by the Employer Admin. Produces a single self-contained `.html` file. |
| 2.2 | Core Engine | Modifies the captured HTML: rewrites form actions to the local CyberDrill handler, injects the credential-stripping JavaScript, and neutralizes external links (see Section 2.2.3). |
| 2.3 | Core Engine | Starts a local HTTP server to serve the modified HTML file, then establishes an ngrok tunnel to expose it via a public HTTPS URL. |
| 2.4 | Core Engine | Sends campaign parameters (company name, industry, pretext type) to the AI Generation Engine. |
| 2.5 | AI Engine | Generates a phishing email body and a coordinated vishing script. The phishing email body references the ngrok tunnel URL as the phishing link. |
| 2.6 | Core Engine | Runs generated content through the content policy filter. Rejects and regenerates any content that violates policy (e.g., threats of violence, discriminatory language). |
| 2.7 | Core Engine | Injects a unique, per-target tracking token as a query parameter on the ngrok phishing link URL. This token maps to the target's campaign ID -- not to any personal credential data. |

#### Phase 3: Delivery

| Step | Actor | Action |
|------|-------|--------|
| 3.1 | Email Service | Dispatches personalized phishing emails to each target within the defined delivery window. Delivery is staggered to avoid triggering bulk-send detection. |
| 3.2 | Voice Service | Initiates vishing calls at a configurable delay after email delivery (default: 30-60 minutes). Calls follow the AI-generated script. |
| 3.3 | Core Engine | Updates each target's state to `DELIVERED`. Logs delivery confirmation or failure. |

#### Phase 4: Employee Interaction

| Step | Actor | Action |
|------|-------|--------|
| 4.1 | Employee | Receives the phishing email. |
| 4.2 | Employee (Path A) | Ignores or reports the email. State updated to `NO_INTERACTION` or `REPORTED`. |
| 4.3 | Employee (Path B) | Clicks the phishing link. State updated to `LINK_CLICKED`. Landing page is rendered. |
| 4.4 | Employee (Path B cont.) | Submits the login form. State updated to `CREDENTIALS_SUBMITTED`. The system captures the submission event (metadata only, no credential content). |
| 4.5 | System | Sends a real-time notification to the Employer Dashboard indicating a credential submission event occurred. |
| 4.6 | System | Redirects the employee to the Learning Moment page. |

#### Phase 5: Result Capture

| Step | Actor | Action |
|------|-------|--------|
| 5.1 | Core Engine | Aggregates interaction metadata across all targets in the campaign. |
| 5.2 | Core Engine | Calculates key metrics: open rate, click-through rate, submission rate, report rate, mean time-to-click. |

#### Phase 6: Reporting

| Step | Actor | Action |
|------|-------|--------|
| 6.1 | System | Generates the Post-Drill Report (see Section 5.2). |
| 6.2 | Employer Admin | Accesses the report via the Dashboard. |
| 6.3 | System | Archives campaign data per the retention policy (see Section 4.3). |

---

## 4. Data Privacy & Ethics Protocol

### 4.1 No-Storage Policy for User Credentials

This is the most critical policy in the CyberDrill platform. It is enforced at multiple layers:

#### 4.1.1 Frontend Enforcement (SingleFile Page Modification)

- During the post-capture modification step (Section 2.2.3), the original form `action` attributes in the SingleFile HTML are rewritten to point to the local CyberDrill submission handler. The original authentication server endpoint is completely removed from the file.
- An injected JavaScript snippet intercepts the form `submit` event, fires an API call (routed through the ngrok tunnel to the local backend) containing only the tracking token and a boolean `submitted: true` flag, and then immediately clears all form field values from the DOM before any network transmission.
- The form fields are modified to include `autocomplete="off"` and are excluded from browser password managers.
- Because SingleFile produces a fully self-contained HTML file, there are no external script references that could bypass the injected credential-stripping logic.

#### 4.1.2 Backend Enforcement

- The submission endpoint accepts only the tracking token and the event flag. It does not accept, parse, or log any `username`, `password`, or equivalent field values.
- Request body validation at the API gateway layer rejects any payload containing credential-like field names. If such fields are present (e.g., due to a misconfiguration), the payload is dropped and an alert is raised to the engineering team.
- No raw HTTP request bodies are logged for this endpoint. Access logs record only the request method, path, status code, and tracking token.

#### 4.1.3 Infrastructure Enforcement (ngrok + Local Server)

- The landing page is served from a local HTTP server exposed only through the ngrok tunnel. The local server has no persistent storage for request data and no database connections.
- ngrok request inspection/logging is disabled at the tunnel configuration level to prevent credential data from appearing in the ngrok dashboard or ngrok's cloud infrastructure.
- The ngrok tunnel is automatically terminated at campaign close, rendering the phishing URL permanently inaccessible.
- Network egress from the local landing page service is restricted to the Core Engine API and the Learning Moment redirect URL only.
- The SingleFile HTML snapshots are stored locally only for the duration of the campaign and are deleted upon campaign close or tunnel termination.
- Quarterly third-party audits verify that no credential data exists in any log store, database, object store, or backup associated with the platform.

### 4.2 Ethics Framework: Training Tool, Not Surveillance Tool

CyberDrill is designed exclusively as a training instrument. The following controls prevent misuse as an employee surveillance or punitive tool:

| Principle | Implementation |
|---|---|
| **Anonymized Reporting by Default** | The Post-Drill Report presents aggregate statistics (e.g., "34% of the Sales department clicked the link"). Individual-level data is available only to the designated Drill Administrator and is access-logged. |
| **No Disciplinary Use Clause** | The Engagement Agreement includes a binding clause prohibiting the employer from using drill results as the sole basis for disciplinary action, termination, or performance review scoring. |
| **Employee Notification (Post-Drill)** | All targeted employees receive a post-drill notification within 48 hours of campaign conclusion informing them that a simulation occurred, regardless of whether they interacted with it. |
| **Opt-Out Mechanism** | Employees may opt out of future drills by submitting a request to their organization's HR or Security team. Opt-out lists are enforced at the campaign validation step (Phase 1, Step 1.3). |
| **Proportional Targeting** | Campaigns must target a minimum group size (default: 10 employees) to prevent drills from being used to single out individual employees. |
| **Content Boundaries** | AI-generated content must not exploit personal life events (e.g., health, family, bereavement). Pretext scenarios are limited to professional/business contexts. |

### 4.3 Data Retention & Disposal

| Data Category | Retention Period | Disposal Method |
|---|---|---|
| Campaign metadata (targets, states, timestamps) | 12 months from campaign close | Automated purge with cryptographic verification |
| AI-generated content (emails, scripts) | 12 months from campaign close | Automated purge |
| Interaction event logs (clicks, submissions) | 12 months from campaign close | Automated purge |
| SingleFile HTML snapshots | Deleted at campaign close | Automated deletion upon tunnel termination |
| ngrok tunnel configurations | Deleted at campaign close | Tunnel destroyed; authtoken rotated quarterly |
| Post-Drill Reports | 24 months from campaign close | Available for employer download; purged from platform after retention period |
| Credential data | **Never stored** | N/A -- no disposal required |

---

## 5. Post-Drill Analysis

### 5.1 The Learning Moment

The Learning Moment is an immediate educational intervention triggered when an employee submits credentials on the cloned login page.

#### 5.1.1 Content Structure

The Learning Moment page presents the following sections in order:

1. **Disclosure Banner:**
   > "This was a simulated phishing exercise conducted by your organization's security team. No data you entered was captured or stored."

2. **Red Flags You Missed:**
   A dynamically generated checklist specific to the pretext scenario used in the drill. Examples:
   - "The sender address was `it-support@[simulation-domain].com`, not your company's real IT domain."
   - "The email created artificial urgency ('Your account will be locked in 2 hours')."
   - "The login page URL was `https://[simulation-domain].com/login`, not your company's SSO portal."
   - "You received an unsolicited follow-up phone call pressuring you to act immediately."

3. **What You Should Have Done:**
   Actionable guidance tailored to the organization's reporting procedures (e.g., "Forward suspicious emails to `phishing@yourcompany.com`" or "Call the IT Help Desk at ext. 4400 to verify").

4. **Quick Training Module (Optional):**
   An embedded 2-minute interactive micro-training covering the specific attack vector used in the drill. Completion is tracked but not mandatory.

#### 5.1.2 Delivery Variants

| Employee Action | Learning Moment Delivery |
|---|---|
| Submitted credentials on landing page | Immediate redirect to Learning Moment page |
| Clicked link but did not submit | Learning Moment delivered via follow-up email within 24 hours |
| Did not interact with phishing email | Summary notification delivered post-drill (see Section 4.2) |
| Reported the email as suspicious | Positive reinforcement message acknowledging correct behavior |

### 5.2 Post-Drill Report

The Post-Drill Report is generated automatically at campaign close and made available to the Employer Admin via the Dashboard.

#### 5.2.1 Report Contents

**Executive Summary:**
- Campaign name, date range, pretext scenario used.
- Total targets, delivery success rate.
- Headline metrics: click-through rate, credential submission rate, report rate.
- Risk rating (Critical / High / Medium / Low) based on submission rate thresholds.

**Detailed Metrics:**

| Metric | Definition |
|---|---|
| Delivery Rate | Emails successfully delivered / Total targets |
| Open Rate | Emails opened (pixel tracking) / Emails delivered |
| Click-Through Rate (CTR) | Unique link clicks / Emails delivered |
| Submission Rate | Credential form submissions / Unique link clicks |
| Report Rate | Employees who reported the email as phishing / Emails delivered |
| Mean Time-to-Click | Average elapsed time between email delivery and first link click |
| Vishing Compliance Rate | Employees who followed vishing call instructions / Calls connected |

**Departmental Breakdown:**
- All metrics broken down by department or organizational unit.
- Comparison against previous drill results (if available) to show trend data.

**Risk Heatmap:**
- Visual representation of submission rates across departments.

**Recommendations:**
- AI-generated recommendations for targeted training based on observed weaknesses (e.g., "The Finance department exhibited a 52% submission rate. Recommend mandatory phishing awareness training for this group within 30 days.").

#### 5.2.2 Report Distribution

- Reports are accessible only to users with the `Drill Administrator` role.
- Reports may be exported as PDF or CSV.
- Reports are watermarked with the downloading user's identity and timestamp to maintain accountability.

---

## 6. Revision History

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-02-14 | CyberDrill Development Team | Initial release |
| 1.1 | 2026-02-14 | CyberDrill Development Team | Updated architecture to use SingleFile for login page capture and ngrok tunneling for landing page hosting |

---

**End of Document**
