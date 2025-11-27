'use client';

import React from 'react';
import Box from '@mui/material/Box';
import { IconButton, useTheme } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HeaderAppBar from '@/components/HeaderAppBar';
import MessagesContainer from '@/components/MessagesContainer';
import SendMessageContainer from '@/components/SendMessageContainer';
import { useSession } from 'next-auth/react';
import { grey } from '@/theme/theme';
import { useChatContext } from '@/context/ChatContext';

const Chat: React.FC = () => {
	const { data: session } = useSession();
	const user = session?.user;
	const theme = useTheme();

	const {
		scrollToBottom,
		handleDrawerClose,
	} = useChatContext();

	return (
		<div onClick={handleDrawerClose}>
			<HeaderAppBar />
			{user && (
				<Box
					className="chatContainer chat-area"
					sx={{
						maxWidth: 1200,
						marginLeft: "auto",
						marginRight: "auto",
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						overflow: 'hidden',
						mt: '40px',
						pb: 5,
						height: {
							xs: 'calc(91vh - 60px)',
							sm: 'calc(94vh - 60px)',
						},
						position: 'relative',
					}}
				>
					<MessagesContainer />
					<IconButton
						edge="end"
						onClick={scrollToBottom}
						sx={{
							height: '45px',
							width: '45px',
							mr: 2,
							bottom: 70,
							position: 'absolute',
							left: '50%',
							transform: 'translateX(-50%)',
							color: theme.palette.mode === 'dark' ? grey[250] : grey[100],
						}}
					>
						<ArrowDownwardIcon
							sx={{
								height: '45px',
								width: '45px',
								backgroundColor: 'rgba(82, 82, 82, 0.7)',
								borderRadius: '50%',
								padding: '10px',
								border: '1px solid #7d7d7d',
								'&:hover': {
									backgroundColor: 'rgba(64, 64, 64, 0.7)',
								},
							}}
						/>
					</IconButton>
					<SendMessageContainer />
				</Box>
			)}
		</div>
	);
};

export default Chat;
