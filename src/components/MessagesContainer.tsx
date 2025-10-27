import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import Completion from '@/components/Completion';
import { UIMessage } from '@ai-sdk/react'
import { ChatStatus } from 'ai';

interface MessagesContainerProps {
	hasAttachments: boolean,
	messages: UIMessage[],
	messagesEndRef: React.RefObject<HTMLDivElement>,
	scrollContainerRef: React.RefObject<HTMLDivElement>,
	status:  ChatStatus,
	error?: Error,
}

const MessagesContainer = ({
							   hasAttachments,
							   messages,
							   messagesEndRef,
							   scrollContainerRef,
							   status,
							   error,
						   }: MessagesContainerProps) => {
	const scrollableGridRef = scrollContainerRef;

	return (
		<Grid
			className="messages-container"
			container
			sx={{
				width: '100%',
			}}
		>
			<Grid
				ref={scrollableGridRef}
				id="messages-scroll-container"
				item xs={12}
				sx={{
					height: hasAttachments
						? {
							xs: 'calc(85vh - 138px)', // On extra-small devices
							sm: 'calc(90vh - 142px)', // On small devices and up
						}
						: {
							xs: 'calc(85vh - 62px)', // On extra-small devices
							sm: 'calc(90vh - 65px)', // On small devices and up
						},
					overflow: 'auto',
					width: '100%',
					'&::-webkit-scrollbar': {
						display: 'none', // Hide scrollbar for WebKit browsers
					},
					scrollbarWidth: 'none', // Hide scrollbar for Firefox
					msOverflowStyle: 'none', // Hide scrollbar for IE 10+
				}}
			>
				{messages.length
					?
					<Box sx={{
						p: 1,
						flex: 1,
					}}>
						<Completion
							messages={messages}
							messagesEndRef={messagesEndRef}
							scrollContainerRef={scrollableGridRef}
							status={status}
							error={error}
						/>
					</Box>
					:
					<Box sx={{
						mt: 25,
					}}>
						<Typography
							variant="h2"
							component="h2"
							color="#D1D5DB"
							align="center"
							fontWeight="bold"
							sx={{
								userSelect: 'none',
							}}
						>
							sofos
						</Typography>
					</Box>
				}
			</Grid>
		</Grid>
	);
};

export default MessagesContainer;
