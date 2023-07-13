'use client'

import './globals.css'
import {Inter} from 'next/font/google'
import React from "react";
import {NextAuthProvider} from "./providers";
import HeaderAppBar from "@/components/HeaderAppBar";

const inter = Inter({subsets: ['latin']})

export const metadata = {
    title: 'Sofos',
    description: 'ChatGPT Client',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <NextAuthProvider>
            <HeaderAppBar/>
            {children}
        </NextAuthProvider>
        </body>
        </html>
    )
}
