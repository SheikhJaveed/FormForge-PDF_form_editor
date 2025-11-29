# FormForge - Interactive PDF Editor

A full-stack web application that allows users to upload PDF documents, drag-and-drop interactive form fields (Text Inputs, Checkboxes) onto the pages, and download the resulting fillable PDF.

This project mimics functionality found in tools like Sejda or Adobe Acrobat, using **React (Vite)** for the UI and **pdf-lib** for PDF manipulation.

## 🚀 Features

*   **PDF Rendering:** View multi-page PDFs directly in the browser.
*   **Drag & Drop Editor:** Place text fields and checkboxes anywhere on the page.
*   **Smart Positioning:** Fields snap to the cursor and maintain position across different screen sizes (Scaling logic).
*   **Styling:** Fields match the UI (White background, no border) in the final downloaded PDF.
*   **Properties:** Rename fields, set fields as "Required", change font size, and adjust text alignment (Left/Center/Right).
*   **Cross-Page Support:** Drag fields from one page to another seamlessly.

## 🛠️ Tech Stack

### Frontend
*   **React.js** (Powered by **Vite**)
*   **react-pdf** (PDF Rendering)
*   **react-rnd** (Resizable & Draggable components)
*   **Axios** (API requests)
*   **Tailwind CSS** (Styling)

### Backend
*   **Node.js** (Runtime)
*   **Express.js** (Server)
*   **pdf-lib** (PDF modification library)
*   **Multer** (File upload handling)

---

## 📦 Installation & Setup

Follow these steps to run the application locally.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v14 or higher recommended)
*   Git

### 1. Backend Setup (Server)

Navigate to the server directory and install the required dependencies.

```bash
# 1. Open a terminal and navigate to the backend folder
cd backend

# 2. Initialize npm (if package.json is missing)
npm init -y

# 3. Install required packages
npm install express multer pdf-lib cors

# 4. Create the uploads directory (if it doesn't exist)
mkdir uploads

# 5. Start the server
node server.js
```
### 2. Frontend Setup 
```bash
# 1. Navigate to the frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Install core libraries (if not already in package.json)
npm install axios react-pdf react-rnd

# 4. Install styling libraries (Tailwind CSS)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 5. Start the Vite Development Server
npm run dev
```
### Project structure
```text
project-root/
│
├── frontend/                 # React + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── App.jsx         # Main Application Logic
│   │   ├── App.css         # Styling styles
│   │   └── main.jsx        # Entry point
│   ├── index.html          # HTML Entry (Vite)
│   ├── package.json
│   ├── vite.config.js      # Vite Configuration
│   └── tailwind.config.js
│
├── backend/                 # Node.js Backend
│   ├── uploads/            # Temp storage for uploaded PDFs
│   ├── server.js           # API Routes & PDF Logic
│   └── package.json
│
└── .gitignore
