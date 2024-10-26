'use client'

import * as React from 'react';
import { AppBar, Box, Button, Grid, IconButton, Toolbar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MapsUgcOutlinedIcon from '@mui/icons-material/MapsUgcOutlined';
import { signIn, useSession } from "next-auth/react"
import SelectSmall from '@/components/SelectSmall';
import { Model, SamplingParameter } from '@/types/types';
import { useRouter } from 'next/navigation'
import { Message } from 'ai';
import SideBar from '@/components/SideBar';

interface HeaderAppBarProps {
	models: Model[],
	handleModelChange: any,
	model: string,
	samplingParameters: SamplingParameter[],
	handleSamplingParameterChange: any,
	samplingParameter: number,
	messages: Message[],
	setMessages: any,
	chatHistory: Message[][],
	setChatHistory: any,
	currentChatIndex: number,
	setCurrentChatIndex: any,
	setModel: any,
	open: any,
	handleDrawerOpen: any,
}

const saveChatHistoryToLocalStorage = (chatHistory: Message[][]) => {
	if (chatHistory) {
		localStorage.setItem(
			'sofosChatHistory',
			JSON.stringify(chatHistory, (key, value) => {
				if (key === 'createdAt' && value instanceof Date) {
					return value.toISOString();
				}
				return value;
			})
		);
	}
};

export default function HeaderAppBar({
										 models,
										 handleModelChange,
										 model,
										 samplingParameters,
										 handleSamplingParameterChange,
										 samplingParameter,
										 messages,
										 setMessages,
										 chatHistory,
										 setChatHistory,
										 currentChatIndex,
										 setCurrentChatIndex,
										 setModel,
										 open,
										 handleDrawerOpen,
									 }: HeaderAppBarProps) {
	const { data: session, status } = useSession()
	const loading = status === "loading"
	const user = session?.user;
	const router = useRouter();

	const handleStartNewChat = (isRemoveChat: boolean) => {
		if (!isRemoveChat && currentChatIndex === -1) {
			createChat();
		}

		setMessages([]);
		setCurrentChatIndex(-1);
		localStorage.setItem('sofosMessages', JSON.stringify([]));
		localStorage.setItem('sofosCurrentChatId', (-1).toString());

		router.push('/new');
	};

	const createChat = () => {
		if (messages.length > 0) {
			// Save last 15 chats
			setChatHistory((prevChatHistory: Message[][]) => {
				const updatedChatHistory = [...prevChatHistory, messages].slice(-15);
				saveChatHistoryToLocalStorage(updatedChatHistory);

				return updatedChatHistory;
			});
		}
	}

	return (
		<>
			<Grid container spacing={2} sx={{ position: 'fixed', top: 15, zIndex: 10 }}>
				<Box sx={{ flexGrow: 1 }}>
					<AppBar position="static">
						<Toolbar variant="dense">
							{user
								? (
									<>
										<IconButton
											color="inherit"
											aria-label="open drawer"
											onClick={(e) => {
												e.stopPropagation(); // Prevent ClickAwayListener from triggering
												handleDrawerOpen();
											}}
											sx={[
												{
													mr: 2,
												},
												open && { display: 'none' },
											]}
										>
											<MenuIcon />
										</IconButton>
										<SelectSmall
											options={models}
											handleChange={handleModelChange}
											value={model}
											style={{ marginRight: '5px' }}
										/>
										{!model.startsWith('o1') &&
										  <SelectSmall
											options={samplingParameters}
											handleChange={handleSamplingParameterChange}
											value={samplingParameter}
										  />
										}
										<Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
											{/*<Avatar*/}
											{/*	alt="avatar"*/}
											{/*	src={user.image || undefined}*/}
											{/*	sx={{ width: "30px", height: "30px" }}*/}
											{/*/>*/}
											<IconButton
												onClick={() => handleStartNewChat(false)}
											>
												<MapsUgcOutlinedIcon
													sx={{
														height: '26px',
														width: '26px',
														color: 'white',
													}}
												/>
											</IconButton>
										</Box>
									</>
								)
								: (
									<Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
										<Button color="inherit" onClick={(e) => {
											e.preventDefault();
											signIn().then();
										}}>
											Login
										</Button>
									</Box>
								)}
						</Toolbar>
					</AppBar>
					{user &&
					  <SideBar
						messages={messages}
						setMessages={setMessages}
						chatHistory={chatHistory}
						setChatHistory={setChatHistory}
						currentChatIndex={currentChatIndex}
						setCurrentChatIndex={setCurrentChatIndex}
						setModel={setModel}
						open={open}
						handleStartNewChat={handleStartNewChat}
						saveChatHistoryToLocalStorage={saveChatHistoryToLocalStorage}
						createChat={createChat}
					  />
					}
				</Box>
			</Grid>
			<div>{!user && loading ? "loading..." : ""}</div>
		</>
	);
}
