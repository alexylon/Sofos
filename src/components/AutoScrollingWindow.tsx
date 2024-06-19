import React, { useEffect, useRef } from 'react';
import { Message } from 'ai';


interface AutoScrollingWindowProps {
	messages?: Message[],
	style?: { flexGrow: number }
	children: React.ReactNode
}

const AutoScrollingWindow = ({ children, messages }: AutoScrollingWindowProps) => {
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const scrollToLastMessage = () => {
		if (messagesEndRef.current) {
			(messagesEndRef.current as HTMLDivElement).scrollIntoView({ behavior: "smooth" } as ScrollIntoViewOptions);
		}
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
