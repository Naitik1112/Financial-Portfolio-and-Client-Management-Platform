import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr'; // Import the SVGR plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr() // Add the SVGR plugin to handle ReactComponent SVG imports
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://financial-portfolio-and-client.onrender.com', // Change this to match your backend's port
        changeOrigin: true,
        secure: false
      }
    }
  }
});
