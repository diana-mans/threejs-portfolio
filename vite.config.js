import { defineConfig } from 'vite';

export default defineConfig({
	base: '/threejs-portfolio/', // замените на ваше имя репозитория
	build: {
		outDir: 'dist',
		assetsDir: 'assets',
	},
	server: {
		port: 3000,
	},
});
