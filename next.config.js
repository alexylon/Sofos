/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['react', '@mui/material', 'openai', 'axios', 'react-markdown', 'react-syntax-highlighter'],
    env:{
        OPENAI_API_KEY : process.env.OPENAI_API_KEY,
    }
}

module.exports = nextConfig
