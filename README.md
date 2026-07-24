# WebRTC Realtime Screen Sharing System

A high-performance, real-time peer-to-peer (P2P) screen sharing application built with **ASP.NET Core 10 Web API**, **SignalR**, and **Vue 3 (Vite + Tailwind CSS + Pinia)**.

> ⚡ **Architecture Highlight**: Video stream data is transmitted **strictly via WebRTC P2P** direct peer connections. SignalR is exclusively used for WebRTC signaling (SDP offers/answers and ICE candidates) and presence management. No video bytes pass through the backend server.

---

## 🌟 Key Features

- **Sharer Role**:
  - WebRTC `getDisplayMedia()` screen capture (Entire Screen / Application Window).
  - High-frame-rate local live preview.
  - Multi-viewer concurrent P2P broadcasting.
- **Viewer Role**:
  - Live Dashboard grid of active sharers.
  - Automatic P2P connection bootstrapping upon join.
  - Low-latency real-time video playback.
- **Security & Network**:
  - JWT Authentication (Bearer Token).
  - LAN HTTPS support via `mkcert` (required by modern browsers for `getDisplayMedia`).
  - WebRTC P2P ICE candidate queueing & negotiation fallback.

---

## 🛠️ Technology Stack

### Backend
- **ASP.NET Core 10 Web API**
- **SignalR Hub** (WebRTC Signaling & Presence)
- **Entity Framework Core 10** (SQL Server / LocalDB)
- **JWT Authentication**

### Frontend
- **Vue 3 (Composition API + TypeScript)**
- **Vite 6** (with HTTPS development server)
- **Tailwind CSS v3** & **Lucide Icons**
- **Pinia** (State Management)
- **SignalR JS Client** & **Native WebRTC (RTCPeerConnection)**

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **.NET 10 SDK** installed.
- **Node.js (v18+) & npm** installed.
- **SQL Server Express / LocalDB** (`(localdb)\MSSQLLocalDB`).
- **mkcert** (Optional for local LAN SSL certificates).

### 2. Database Setup
Run EF Core migrations or start the application (the API automatically migrates and seeds demo users on startup):

```bash
cd Backend/src/WebRtcScreenShare.Api
dotnet run --launch-profile lan
```

### 3. Demo User Accounts

| Role | Username | Password |
|---|---|---|
| **Sharer 1** | `sharer1` | `password123` |
| **Sharer 2** | `sharer2` | `password123` |
| **Viewer 1** | `viewer1` | `password123` |
| **Viewer 2** | `viewer2` | `password123` |

---

## 🔒 SSL Certificate Setup (LAN HTTPS)

Browsers require **HTTPS** (or `localhost`) to enable `navigator.mediaDevices.getDisplayMedia()`. For LAN access across multiple devices:

```bash
# Install local CA and generate certificates in certs/ directory
mkcert -install
mkcert -pkcs12 -pfx-file certs/cert.pfx -pfx-pass changeit localhost 127.0.0.1 192.168.2.3
mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost 127.0.0.1 192.168.2.3
```

---

## 🏃 Running the Application

### 1. Run Backend Server
```bash
cd Backend/src/WebRtcScreenShare.Api
dotnet run --launch-profile lan
# Listens on https://192.168.2.3:5001 and http://192.168.2.3:5000
```

### 2. Run Frontend Server
```bash
cd frontend
npm install
npm run dev:lan
# Listens on https://192.168.2.3:5173
```

---

## 📁 Repository Structure

```
.
├── Backend/                       # ASP.NET Core 10 Solution
│   └── src/
│       ├── WebRtcScreenShare.Api/           # SignalR Hub & Controllers
│       ├── WebRtcScreenShare.Application/   # Use Cases & DTOs
│       ├── WebRtcScreenShare.Domain/        # Entities & Interfaces
│       └── WebRtcScreenShare.Infrastructure/# EF Core ApplicationDbContext
├── frontend/                      # Vue 3 Frontend App
│   ├── src/
│   │   ├── components/            # VideoCard, Navbar, ShareButton
│   │   ├── composables/           # useSignalR, useWebRtcSharer, useWebRtcViewer
│   │   ├── stores/                # Pinia streamStore & authStore
│   │   └── views/                 # LoginView, SharerView, ViewerDashboard
│   └── vite.config.ts             # Vite HTTPS Config
├── certs/                         # Local SSL certificates (gitignored)
└── .gitignore                     # Git exclusion rules
```

---

## 📜 License
MIT License.
