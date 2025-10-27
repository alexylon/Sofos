'use client'

import * as React from 'react';
import { Drawer, IconButton, Typography, useTheme } from '@mui/material';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import { signOut } from "next-auth/react"
import { UIMessage } from '@ai-sdk/react'
import ClearIcon from '@mui/icons-material/Clear';
import Box from '@mui/material/Box';
import { STORAGE_KEYS } from '@/components/utils/constants';
import { indexedDBStorage } from '@/components/utils/indexedDBStorage';
import { grey } from '@/theme/theme';

interface SideBarProps {
	messages: UIMessage[];
	setMessages: (messages: UIMessage[]) => void;
	chatHistory: UIMessage[][];
	setChatHistory: (history: UIMessage[][]) => void;
	currentChatIndex: number;
	setCurrentChatIndex: (index: number) => void;
	setModel: (model: string) => void;
	open: boolean;
	handleStartNewChat: () => void;
	saveChatHistory: (history: UIMessage[][]) => void;
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
					 saveChatHistory,
				 }: SideBarProps) => {
	const theme = useTheme();
	const isDarkMode = theme.palette.mode === 'dark';
	const drawerWidth = 200;
	// @ts-ignore
	let chatListBackground = theme.palette.background.paper;

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

		void indexedDBStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_INDEX, chatIndex);

		// @ts-ignore
		const model = chatHistory[chatIndex][chatHistory[chatIndex].length - 1].name;

		if (model) {
			setModel(model);

			void indexedDBStorage.setItem(STORAGE_KEYS.MODEL, model);
		}
	};

	const handleRemoveChat = (index: number) => {
		const updatedChats = chatHistory.filter((_, i) => i !== index);

		setChatHistory(updatedChats);
		void saveChatHistory(updatedChats);

		if (index === currentChatIndex) {
			handleStartNewChat();
		}

		if (index < currentChatIndex) {
			setCurrentChatIndex(currentChatIndex - 1);

			void indexedDBStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_INDEX, currentChatIndex - 1);
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
					// @ts-ignore
					backgroundColor: theme.palette.background.paper,
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
					color={theme.palette.text.secondary}
				>
					Last 20 Chats
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
										backgroundColor: isSelected
											? isDarkMode
											? grey[850] : grey[200]
											: chatListBackground,
									}}
								>
									<ListItemText
										primary={chat && chat.length > 0
											?
											// @ts-ignore
											formattedDate(chat[chat.length - 1]?.createdAt)
											: 'No Messages'}
										sx={{ color: theme.palette.text.secondary }}
									/>
								</ListItemButton>
								<IconButton
									sx={{
										position: 'absolute',
										right: 4,
										height: '26px',
										width: '26px',
									}}
									onClick={() => handleRemoveChat(chatIndex)}
								>
									<ClearIcon sx={{ height: '26px', width: '26px', color: theme.palette.text.secondary, backgroundColor: 'transparent' }}/>
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
							<LogoutOutlinedIcon
								sx={{ height: '26px', width: '26px', color: theme.palette.text.secondary, backgroundColor: theme.palette.background.paper }}
							/>
						</ListItemIcon>
						<ListItemText primary='Log Out' sx={{ color: theme.palette.text.secondary }}/>
					</ListItemButton>
				</ListItem>
			</List>
		</Drawer>
	);
}

export default SideBar;
