import React, { useEffect, useRef } from 'react';


interface AutoScrollingWindowProps {
	style?: { flexGrow: number }
	isScrolling: boolean,
	children: React.ReactNode
}

const AutoScrollingWindow = ({ children, isScrolling }: AutoScrollingWindowProps) => {
	const messagesEndRef = useRef<HTMLDivElement | null>(null);


	const scrollToLastMessage = () => {
		if (messagesEndRef.current) {
			(messagesEndRef.current as HTMLDivElement).scrollIntoView({ behavior: "smooth" } as ScrollIntoViewOptions);
		}
	};

	useEffect(() => {
		if (isScrolling) {
			scrollToLastMessage();
		}
	}, [isScrolling]);

	return (
		<div style={{ position: 'relative' }}>
			{children}
			<div ref={messagesEndRef} />
		</div>
	);
};

export default AutoScrollingWindow;
