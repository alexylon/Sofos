import React from 'react';
import '../styles/index.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Chat from '../components/Chat';
import { ChatProvider } from '@/context/ChatContext';

export default function App() {
	return (
		<ChatProvider>
			<Chat />
		</ChatProvider>
	);
}
