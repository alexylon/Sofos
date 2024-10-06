
const withPWA = require('next-pwa')({
	dest: 'public',
	disable: process.env.NODE_ENV === 'development', // Disable PWA in development mode
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	trailingSlash: true,
	// distDir: 'out',
	// output: 'export',
};

module.exports = withPWA(nextConfig);
