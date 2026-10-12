# Appointly — Modern Appointment Booking System

> **“Your Time, Your Choice.”**  
> A complete, responsive, modern web application for real-time appointment scheduling, built with vanilla HTML5, CSS3, and JavaScript.

---

## 1. Project Introduction

**Appointly** is an appointment scheduling web application designed with a clean, contemporary user interface and rock-solid validation logic. Built specifically for college mini-project demonstrations and real-world client scheduling prototypes, Appointly allows users to:
- Enter and validate their contact information.
- Select from multiple service offerings.
- Pick a date and browse real-time available time slots.
- Prevent duplicate double-booking of any date and time combination.
- View, search, filter, and cancel existing appointments.
- Keep data persistently saved across page reloads using browser `localStorage`.

---

## 2. Key Features

1. **Modern UI/UX Design:**
   - White and light lavender background with deep purple and indigo primary accents (`#6366f1` and `#7c3aed`).
   - Rounded cards, clean typography powered by *Inter* and *DM Sans*, soft shadows, and responsive grid layouts.
   - Floating live booking summary card previewing appointment details before submission.
   - Professional empty states, accessible contrast ratios, and toast notifications.

2. **Smart Form Validation:**
   - Full Name (required, trimmed, minimum 2 characters).
   - Email format verification via RFC-compliant regular expression.
   - 10-digit Phone Number validation with automatic non-digit filtering.
   - Minimum date guard preventing past calendar dates from being selected.
   - Past time guard preventing booking of time slots that have already passed today.
   - Real-time inline error messages and error summary alerts.

3. **Available Time Slot Selector:**
   - 9 standard slots (09:00 AM, 10:00 AM, 11:00 AM, 12:00 PM, 01:00 PM, 02:00 PM, 03:00 PM, 04:00 PM, 05:00 PM).
   - Time slots appear only after a valid date is selected.
   - Dynamically checks existing reservations: already booked slots are disabled and styled with a strikethrough/badge.
   - Highlights user-selected slot with purple gradient glow.

4. **Duplicate Booking Prevention (Anti-Collision Guard):**
   - Strictly enforces that only **one booking** can exist for any given date and time.
   - Evaluates storage state on submission; if a slot is taken, prompts the user and re-renders available slots.

5. **Appointment Management:**
   - Displays appointments in clean cards with reference IDs (e.g. `#APT-48201`).
   - Status badge automatically displays `Upcoming` or `Past` based on actual date and time comparison.
   - Real-time search by customer name, email address, or reference ID.
   - Quick filters: All, Upcoming, Past, or by Service category.
   - Sorting options: Date (Soonest first / Latest first) or Recently Booked.

6. **Safe Cancellation Flow:**
   - Confirmation modal with appointment summary before cancellation.
   - Instantly frees the time slot for new bookings.
   - Automatically updates appointment badges in the navigation bar and header.

7. **Storage Resilience:**
   - Stores structured JSON records in `localStorage`.
   - Handles corrupted or absent storage data gracefully with fallbacks and notifications.

---

## 3. Technology Stack

- **HTML5:** Semantic markup, accessibility attributes (`aria-live`, `aria-label`, `role`).
- **CSS3:** Custom properties (CSS variables), CSS Grid, Flexbox, smooth transitions, mobile-first responsive media queries.
- **Vanilla JavaScript (ES6+):** Zero third-party runtime dependencies. Event listeners, validation engine, dynamic DOM rendering, and date calculations.
- **Storage:** Browser `localStorage` API for client-side persistence.

---

## 4. File Structure

```
appointment-booking/
├── index.html        # Main HTML page structure, navigation, forms, modals
├── style.css         # Styling, purple/lavender design system, responsive rules
├── script.js         # Core application logic, validation, storage, slots & filtering
└── README.md         # Documentation, testing guide, and setup instructions
```

---

## 5. How to Run the Website

### Option A: Direct Browser Launch (Simplest)
1. Double-click or right-click `index.html`.
2. Choose **Open With** → Select your preferred browser (Google Chrome, Firefox, Safari, Edge).

### Option B: Local HTTP Server (Recommended)
You can run a lightweight local HTTP server using Python or Node.js:

```bash
# Using Python 3:
python3 -m http.server 8080

# Or using Node.js npx:
npx serve .
```
Then open your browser and navigate to: `http://localhost:8080`

---

## 6. Testing Scenarios & Verification Guide

Follow these steps to demonstrate every project requirement:

| # | Test Scenario | Steps to Execute | Expected Result |
|---|---|---|---|
| **1** | **Successful Booking** | Enter name "Alex Doe", valid email, 10-digit phone "9876543210", select "Dental Check-up", choose tomorrow's date, pick "11:00 AM", click "Confirm Appointment". | Success receipt modal appears; appointment card added to "My Appointments"; counter increases. |
| **2** | **Empty Required Fields** | Leave fields blank and click "Confirm Appointment". | Submission is blocked; inline error messages appear below missing fields; alert banner displays warning. |
| **3** | **Invalid Email Format** | Enter "alex@invalid" in the email field. | "Please enter a valid email address" error is displayed. |
| **4** | **Invalid Phone Number** | Enter "12345" (less than 10 digits). | "Phone number must contain exactly 10 digits" error is displayed. |
| **5** | **Past Appointment Date** | Attempt to select yesterday's date in the date picker. | Past dates are disabled by the HTML5 `min` attribute; manually typing a past date triggers "Appointment date cannot be in the past." |
| **6** | **Time Slot Not Selected** | Enter all details and pick a date, but do not click any time slot button. | "Please select an available time slot" error appears. |
| **7** | **Duplicate Booking Check** | Pick a date and time slot that has already been booked. | The button is disabled and marked "Booked". If forced, the collision guard rejects the submission. |
| **8** | **Cancel Appointment** | In "My Appointments", click "Cancel" on a booking card. | Confirmation modal opens; clicking "Yes, Cancel Slot" removes the card and frees that time slot immediately. |
| **9** | **Rebook Cancelled Slot** | Check the booking form for the date of the cancelled appointment. | The previously booked slot is now active and green ("Available"). |
| **10** | **Page Refresh Persistence** | Refresh the browser page (`Ctrl+R` or `Cmd+R`). | All saved appointments remain intact and counters retain their count. |
| **11** | **Responsive Layout** | Open Developer Tools (`F12`), toggle Device Toolbar (Mobile/Tablet view). | Form stacks into a single column; time slots adjust to 2 or 1 column; navigation remains clean and accessible. |

---

## 7. Storage Limitations & Backend Migration Path

### Client-Side LocalStorage Limitations
- **Per-Browser Scope:** Appointments saved in `localStorage` are stored strictly within the user's local web browser. They are not shared across different devices or separate browser sessions.
- **Data Clearing:** Clearing browser cookies and site data will reset the stored appointments.

### Production Backend Roadmap (Multi-User Scale)
To support multi-user scheduling across multiple devices:
1. **Backend Framework:** Node.js with Express.js or Python FastAPI.
2. **Database:** PostgreSQL or MySQL with a unique composite index:
   ```sql
   CREATE UNIQUE INDEX idx_unique_booking ON appointments (appointment_date, appointment_time);
   ```
3. **Concurrency Control:** Database transactions (e.g., `SELECT ... FOR UPDATE` or serializable isolation level) to guarantee that two simultaneous users cannot book the same millisecond slot.
4. **Authentication:** JWT or session-based authentication for user profiles.

---

## 8. Authors & Demonstration Notes

- **Project:** Appointly Appointment Booking System
- **Tagline:** “Your Time, Your Choice.”
- **Target:** College Mini-Project / Portfolio Showcase
- **Code Quality:** Pure vanilla JavaScript, semantic HTML5, zero external build tools required.
