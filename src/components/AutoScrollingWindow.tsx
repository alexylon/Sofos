import React, { useEffect, useRef } from 'react';


const AutoScrollingWindow = ({children, messages}: any) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToLastMessage = () => {
		messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
	};

	useEffect(() => {
		scrollToLastMessage();
	}, [messages]);

	return (
		<div style={{position: 'relative'}}>
			{children}
			<div ref={messagesEndRef} />
		</div>
	);
};

export default AutoScrollingWindow;
