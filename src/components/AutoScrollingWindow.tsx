import React, { useEffect, useRef } from 'react';
import { Message } from 'ai';


interface AutoScrollingWindowProps {
	messages?: Message[],
	style?: { flexGrow: number }
}

const AutoScrollingWindow = ({ children, messages, style }: AutoScrollingWindowProps) => {
	const messagesEndRef = useRef<HTMLDivElement>(null as HTMLDivElement);

	const scrollToLastMessage = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	};

	useEffect(() => {
		scrollToLastMessage();
	}, [messages]);

	return (
		<div style={{ position: 'relative' }}>
			{children}
			<div ref={messagesEndRef} />
		</div>
	);
};

export default AutoScrollingWindow;
