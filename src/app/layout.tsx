import './globals.css'
import { Inter } from 'next/font/google'
import React from "react";
import { NextAuthProvider } from "./providers";
import HeaderAppBar from "@/components/HeaderAppBar";
import { Box } from "@mui/material";

const inter = Inter({subsets: ['latin']})

export const metadata = {
	title: 'Sofos',
	description: 'GPT Client',
}

export default function RootLayout({children,}: { children: React.ReactNode }) {
	return (
		<html lang="en">
		<body className={inter.className}>
		<NextAuthProvider>
			<Box className="layoutContainer" sx={{overflow: 'hidden', maxHeight: '97vh'}}>
				<HeaderAppBar />
				{children}
			</Box>
		</NextAuthProvider>
		</body>
		</html>
	)
}
