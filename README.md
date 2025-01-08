# Property Viewer

This project is a demo application showcasing the interiors of properties for sale in an interactive 3D environment. Built with [Three.js](https://threejs.org/) and [TypeScript](https://www.typescriptlang.org/), it highlights features such as material customization, realistic lighting, and collision detection. The application is designed to provide a modern, configurable platform for exploring properties in real-time.

---

## Features

### Realistic Rendering
- **HDR Textures**: Supports high-dynamic-range (HDR) textures for enhanced realism.
- **Shadow Maps**: Implements shadow mapping for realistic lighting and shading effects.

### Customization Options
- **Material Editing**: Change materials of objects within the property (e.g., walls, furniture) in real-time.
- **Configurable Properties**: Adjust lights, materials, and environment properties via a JSON configuration file.

### Collision Detection
- Utilizes Three.js Octree for efficient collision detection and smooth navigation.

### Responsive Design
- Optimized for various screen sizes, ensuring a seamless experience across devices.
- Includes support for touch interactions on mobile and tablet devices.

---

## Installation

### Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/drgy/property-viewer.git
   cd property-viewer
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## Scripts
- **`npm run dev`**: Starts the development server.
- **`npm run build`**: Builds the project for production.
- **`npm run preview`**: Previews the production build locally.

---

## Technologies Used
- **Three.js**: 3D rendering engine.
- **TypeScript**: Programming language.
- **Vite**: Development and build tool.
