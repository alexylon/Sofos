import React, { useRef } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import Completion from '@/components/Completion';
import { Message } from 'ai';
import { Model } from '@/types/types';

interface MessagesContainerProps {
	hasAttachments: boolean,
	messages: Message[],
	models: Model[],
	error?: any,
}

const MessagesContainer = ({ hasAttachments, messages, models, error }: MessagesContainerProps) => {
	const scrollableGridRef = useRef(null);

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
				item xs={12}
				sx={{
					height: hasAttachments
						? {
							xs: 'calc(89vh - 138px)', // On extra-small devices
							sm: 'calc(93vh - 142px)', // On small devices and up
						}
						: {
							xs: 'calc(89vh - 62px)', // On extra-small devices
							sm: 'calc(93vh - 65px)', // On small devices and up
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
						overflow: 'auto',
					}}>
						<Completion messages={messages} models={models} error={error} />
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
