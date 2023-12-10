import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        VitePWA({
            workbox: {
                globPatterns: ["**/*"],
            },
            includeAssets: [
                "**/*",
            ],
            registerType: 'prompt',
            includeAssets: ['icon.png', 'icon-maskable.png'],
            manifest: {
                "name": "TowTackle",
                "short_name": "TowTackle",
                "theme_color": "#ffc501",
                "display": "standalone",
                "background_color": "#f7f7f7",
                "start_url": "/",
                "scope": "/",
                "description": "Welcome to TowTackle, the ultimate solution for simplified parking incident management!",
                "icons": [
                    {
                        "src": "icon.png",
                        "sizes": "1024x1024",
                        "type": "image/png"
                    },
                    {
                        "src": "icon-maskable.png",
                        "sizes": "512x512",
                        "type": "image/png",
                        "purpose": "maskable"
                    }
                ]
            },
        }),
    ],
});