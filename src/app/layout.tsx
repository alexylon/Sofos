import './globals.css';
import { Inter } from 'next/font/google';
import React from 'react';
import { NextAuthProvider } from './providers';
import { Box } from '@mui/material';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
	title: 'sofos',
	description: 'GPT/Claude Client',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
		<head>
			<title>{metadata.title}</title>
			<meta name="description" content={metadata.description} />
			<link rel="manifest" href="/manifest.json" />
			<link rel="apple-touch-icon" href="/sigma.png" />
			<meta name="theme-color" content="#000000" />
		</head>
		<body className={inter.className}>
		<NextAuthProvider>
			<Box className="layoutContainer" sx={{ overflow: 'hidden', maxHeight: '97vh' }}>
				{/*<HeaderAppBar />*/}
				{children}
			</Box>
		</NextAuthProvider>
		</body>
		</html>
	);
}
