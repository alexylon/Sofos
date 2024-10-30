'use client'

import * as React from 'react';
import { Drawer, IconButton, Typography } from '@mui/material';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import { signOut } from "next-auth/react"
import { Message } from 'ai';
import ClearIcon from '@mui/icons-material/Clear';
import Box from '@mui/material/Box';

interface SideBarProps {
	messages: Message[],
	setMessages: any,
	chatHistory: Message[][],
	setChatHistory: any,
	currentChatIndex: number,
	setCurrentChatIndex: any,
	setModel: any,
	open: any,
	handleStartNewChat: any,
	saveChatHistoryToLocalStorage: any,
}

const formattedDate = (dateString: Date | undefined): string => {
	if (!dateString) {
		return 'No Messages';
	}

	const date = new Date(dateString);
	const now = new Date();
	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);

	const isToday = date.toDateString() === now.toDateString();
	const isYesterday = date.toDateString() === yesterday.toDateString();

	const timeString = date.toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	});

	if (isToday) {
		return `Today ${timeString}`;
	} else if (isYesterday) {
		return `Yesterday ${timeString}`;
	}

	return date.toLocaleString('en-GB', {
		day: '2-digit',
		month: '2-digit',
		year: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	}).replace(/\//g, '.');
};

const SideBar = ({
					 setMessages,
					 chatHistory,
					 setChatHistory,
					 currentChatIndex,
					 setCurrentChatIndex,
					 setModel,
					 open,
					 handleStartNewChat,
					 saveChatHistoryToLocalStorage,
				 }: SideBarProps) => {
	const drawerWidth = 200;

	const DrawerHeader = styled('div')(({ theme }) => ({
		display: 'flex',
		alignItems: 'center',
		// necessary for content to be below app bar
		...theme.mixins.toolbar,
		justifyContent: 'center',
	}));

	const handleSelectChat = (chatIndex: number) => {
		setMessages(chatHistory[chatIndex]);
		setCurrentChatIndex(chatIndex);
		localStorage.setItem('sofosCurrentChatIndex', chatIndex.toString());

		const model = chatHistory[chatIndex][chatHistory[chatIndex].length - 1].name;

		if (model) {
			setModel(model);
			localStorage.setItem('sofosModel', model);
		}
	};

	const handleRemoveChat = (index: number) => {
		const updatedChats = chatHistory.filter((_, i) => i !== index);

		setChatHistory(updatedChats);
		saveChatHistoryToLocalStorage(updatedChats);

		if (index === currentChatIndex) {
			handleStartNewChat();
		}

		if (index < currentChatIndex) {
			setCurrentChatIndex(currentChatIndex - 1);
			localStorage.setItem('sofosCurrentChatIndex', (currentChatIndex - 1).toString());
		}
	};

	return (
		<Drawer
			sx={{
				width: drawerWidth,
				flexShrink: 0,
				'& .MuiDrawer-paper': {
					width: drawerWidth,
					boxSizing: 'border-box',
				},
			}}
			variant="persistent"
			anchor="left"
			open={open}
		>
			<DrawerHeader>
				<Typography
					align="center"
					fontWeight="bold"
					color="#7d7d7d"
				>
					Last 15 Chats
				</Typography>
			</DrawerHeader>
			<Divider />
			<List>
				{chatHistory.slice().reverse().map((chat, index) => {
					const chatIndex = chatHistory.length - 1 - index;
					const isSelected = chatIndex === currentChatIndex;

					return (
						<div key={index}>
							<ListItem disablePadding>
								<ListItemButton
									onClick={(e) => {
										e.preventDefault();
										handleSelectChat(chatIndex);
									}}
									sx={{
										height: '34px',
										backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.08)' : 'inherit',
									}}
								>
									<ListItemText
										primary={chat && chat.length > 0
											? formattedDate(chat[chat.length - 1]?.createdAt)
											: 'No Messages'}
										sx={{ color: '#7d7d7d' }}
									/>
								</ListItemButton>
								<IconButton
									sx={{
										position: 'absolute',
										right: 4,
										backgroundColor: 'rgba(255, 255, 255, 0.5)',
										height: '26px',
										width: '26px',
										border: '1px solid rgba(50, 50, 50, 0.12)',
										borderRadius: '4px',
									}}
									onClick={() => handleRemoveChat(chatIndex)}
								>
									<ClearIcon />
								</IconButton>
							</ListItem>
						</div>
					);
				})}
			</List>
			<Box sx={{ flexGrow: 1 }} />
			<Divider />
			<List>
				<ListItem key='logout' disablePadding>
					<ListItemButton
						onClick={(e) => {
							e.preventDefault();
							signOut().then();
						}}
					>
						<ListItemIcon>
							<LogoutOutlinedIcon />
						</ListItemIcon>
						<ListItemText primary='Log Out' sx={{ color: '#7d7d7d' }}/>
					</ListItemButton>
				</ListItem>
			</List>
		</Drawer>
	);
}

export default SideBar;
