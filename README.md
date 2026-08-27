SWAP — Item-Trading Marketplace Web App
Welcome to SWAP, a modern, full-stack item-trading (barter) marketplace web application where users exchange items directly with each other without cash transactions. SWAP brings the traditional community barter system into the digital age with a clean, engaging. Commit 9

📋 Table of Contents
Project Overview

Key Architecture & Tech Stack

Core Features & User Flows

Database Schema Design

Security & Compliance

Project Structure

Getting Started Locally

Environment Variables

API Documentation Overview

Live Application

🚀 Project Overview
SWAP is designed to facilitate local, community-driven trading. Users list items from their personal Inventory, browse other users' public listings, make offers using their own inventory items, negotiate meetup details, and chat in real time.

The application is styled with a clean, uncluttered aesthetic using a vibrant orange (#F5921E) and white color palette, complete with smooth 3D-inspired interactive elements, responsive grids, and high-fidelity UI components.

🛠️ Key Architecture & Tech Stack
Frontend:

React / Vite for high-performance single-page application rendering.

Tailwind CSS for utility-first responsive styling, coupled with modern interactive elements and smooth micro-interactions.

Lucide React for consistent, crisp iconography.

Backend:

Node.js & Express REST API architecture.

Socket.io for low-latency WebSockets supporting real-time chat and live system notifications.

Database:

PostgreSQL for robust relational data modeling (handling complex links between users, inventory, listings, offers, chats, and moderation queues).

Authentication & Security:

Secure session-based cookies and JWT auth with bcrypt password hashing and strict rate limiting on sensitive endpoints.

File Storage:

Cloud object storage (S3-compatible / Cloudinary integration) optimized for secure image and video media uploads.

✨ Core Features & User Flows
1. Authentication & Account Management
Sign-Up & Verification: Collects email, username, real name, neighborhood-level location (e.g., Downtown Abu Dhabi), and secure password. Includes email verification flow.

Password Management: Secure token-based reset flows with strict expiration limits.

Account Deletion: Graceful teardown process with clear communication on what data is retained vs. permanently deleted.

2. Flexible Inventory System
Inventory Defaults: Users define a global visibility setting (Public or Private) for all new items.

Item-Level Overrides: Individual items can override the default inventory visibility (e.g., a private item in a public inventory, or vice versa).

Media Attachments: Support for photos and short videos showcasing item condition.

3. Listings & Discovery Engine
Category Filtering: Browse via category tabs (Electronics, Household Items, Clothing, Outdoors, Accessories).

Intelligent Feed: Users never see their own listings in the public search or browse feeds.

Social Actions: Star/favorite items for later, tap the like button for appreciation, or report inappropriate content instantly.

4. Barter Offers & Meetup Negotiation
Direct Offers: Propose one or more items from your inventory in exchange for another user's listing.

Offer Lifecycle: Listing owners can Accept, Reject, or Waitlist incoming offers.

Meetup Proposals: Once an offer is accepted, either party can propose a safe public meeting location and timestamp, complete with counter-proposal chains.

5. Real-Time Messaging & Notifications
1:1 Chat Threads: Private messaging tied directly to accepted trades.

Centralized Notifications: Real-time bell badge updates for offers, chat messages, meetup updates, and report outcomes.

6. Moderation & Admin System
Instant Reporting: Flagging a listing immediately hides it from the reporter's personal view and routes it to the admin moderation queue.

Secure Admin Escalation: Redeem single-use, hashed admin codes from user settings to grant administrator privileges securely.

Admin Dashboard: Review reported listings, dismiss reports, or unpublish content.

🗄️ Database Schema Design
The relational database is architected around key entities with foreign-key constraints:

users: Stores profile information, hashed credentials, neighborhood-level locations, default inventory visibility, and admin flags.

inventory_items: Manages user possessions, media arrays, categories, conditions, and visibility overrides.

listings: Connects inventory items to the public marketplace with custom titles, descriptions, and "Looking for" criteria.

admin_codes: Manages secure, single-use, hashed invitation keys for privilege escalation.

offers: Tracks barter proposals linking listing items to offered inventory items with statuses (pending, accepted, rejected, waitlisted).

meetup_proposals: Manages location and time coordination for agreed swaps with recursive counter-proposal support.

messages: Stores chat logs tied to active trade threads.

reports: Tracks flagged listings, reasons, and resolution states.

favorites & likes: Join tables for user interactions with listings.

notifications: Activity feed tracking system events per user.

🔒 Security & Compliance
Password Security: Stored strictly using strong salting and hashing algorithms (bcrypt/Argon2).

SQL Injection Prevention: Parameterized queries and ORM safety wrappers utilized across all database interactions.

Input Sanitization: Comprehensive validation on all text inputs, bios, and messages to mitigate XSS and script injection.

Authorization Enforcement: Strict middleware checks verifying ownership on profile edits, inventory mutations, chat reads, and admin route access.

Rate Limiting: Guardrails implemented against brute-force attacks on auth, password reset, and messaging endpoints.

📁 Project Structure
Plaintext
swap-marketplace/
├── client/                     # Frontend React application
│   ├── public/                 # Static assets & index HTML
│   ├── src/
│   │   ├── components/         # Reusable UI elements (Navbar, Cards, Modals)
│   │   ├── context/            # Auth & Socket Context providers
│   │   ├── pages/              # Route views (Home, Profile, Inventory, Chat, Admin)
│   │   ├── services/           # API integration clients
│   │   └── App.jsx             # Main router configuration
│   └── package.json
├── server/                     # Backend Express application
│   ├── config/                 # Database & environment configurations
│   ├── controllers/            # Route business logic handlers
│   ├── middleware/             # Auth, validation, & rate-limiting guards
│   ├── models/                 # Database schema definitions & queries
│   ├── routes/                 # API route endpoints
│   ├── sockets/                # Socket.io real-time event handlers
│   └── server.js               # Application entry point
├── .env.example                # Environment variables template
├── package.json                # Root dependencies & workspace scripts
└── README.md                   # Project documentation

🌐 Live Application
Deploy the application to the hosting provider of your choice after configuring the environment variables in `.env.example`.
"# Swop" 
 joel was here
