import './globals.css';
import { Inter } from 'next/font/google';
import React from 'react';
import { NextAuthProvider } from './providers';
import { Box } from '@mui/material';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Sofos',
	description: 'GPT/Claude Client',
};

interface RootLayoutProps {
	children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="en">
			<head>
				<link rel="manifest" href="/manifest.json" />
				<link rel="apple-touch-icon" href="/sigma.png" />
				<meta name="theme-color" content="#000000" />
				<title></title>
			</head>
		<body className={inter.className}>
		<NextAuthProvider>
			<Box className="layoutContainer" sx={{ overflow: 'hidden', maxHeight: '97vh' }}>
				{children}
			</Box>
		</NextAuthProvider>
		</body>
		</html>
	);
}
