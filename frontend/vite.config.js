import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Allow JSX in .js files
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split large vendor libraries into separate chunks
          if (id.includes('node_modules')) {
            // Heavy export libraries - load only when needed
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('jspdf')) return 'vendor-jspdf';
            if (id.includes('html2canvas')) return 'vendor-html2canvas';
            
            // Core React ecosystem (keep together to avoid circular deps)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            
            // Charts library
            if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
            
            // Maps (separate from react to avoid circular)
            if (id.includes('leaflet')) return 'vendor-maps';
            
            // Firebase
            if (id.includes('firebase') || id.includes('@firebase')) return 'vendor-firebase';
            
            // Socket.IO
            if (id.includes('socket.io-client')) return 'vendor-socket';
            
            // HTTP client
            if (id.includes('axios')) return 'vendor-http';
            
            // State management
            if (id.includes('zustand')) return 'vendor-state';
            
            // Other vendor code (keep separate)
            return 'vendor-other';
          }
        },
      },
    },
  },
});
