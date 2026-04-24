import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const defaultProxyTarget = 'http://127.0.0.1:5000';

const resolveProxyTarget = (value = '') => {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    return defaultProxyTarget;
  }

  try {
    const url = new URL(normalizedValue);

    if (url.hostname === 'localhost') {
      url.hostname = '127.0.0.1';
    }

    return url.toString().replace(/\/$/, '');
  } catch (_error) {
    return normalizedValue.replace(/\/$/, '');
  }
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = resolveProxyTarget(env.VITE_PROXY_TARGET);

  return {
    plugins: [react()],
    publicDir: 'public',
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: []
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        }
      }
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/admin': {
          target: proxyTarget,
          changeOrigin: true
        },
        '/media': {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
