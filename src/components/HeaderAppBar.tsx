import * as React from 'react';
import { useRouter } from 'next/navigation'
import { useMediaQuery } from 'react-responsive';
import { AppBar, Box, Button, Grid, IconButton, Toolbar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MapsUgcOutlinedIcon from '@mui/icons-material/MapsUgcOutlined';
import { signIn, useSession } from "next-auth/react"
import SelectSmall from '@/components/SelectSmall';
import { Model, ReasoningEffort, SamplingParameter } from '@/types/types';
import { UIMessage } from '@ai-sdk/react'
import SideBar from '@/components/SideBar';

interface HeaderAppBarProps {
	models: Model[],
	handleModelChange: any,
	model: Model,
	samplingParameters: SamplingParameter[],
	handleSamplingParameterChange: any,
	samplingParameter: number,
	reasoningEfforts: ReasoningEffort[],
	reasoningEffort: string,
	handleReasoningEffortChange: any,
	messages: UIMessage[],
	setMessages: any,
	chatHistory: UIMessage[][],
	setChatHistory: any,
	currentChatIndex: number,
	setCurrentChatIndex: any,
	setModel: any,
	open: any,
	handleDrawerOpen: any,
	saveChatHistoryToLocalStorage: any,
	isDisabled: boolean,
	isLoading: boolean,
}

export default function HeaderAppBar({
										 models,
										 handleModelChange,
										 model,
										 samplingParameters,
										 handleSamplingParameterChange,
										 samplingParameter,
										 reasoningEfforts,
										 reasoningEffort,
										 handleReasoningEffortChange,
										 messages,
										 setMessages,
										 chatHistory,
										 setChatHistory,
										 currentChatIndex,
										 setCurrentChatIndex,
										 setModel,
										 open,
										 handleDrawerOpen,
										 saveChatHistoryToLocalStorage,
										 isDisabled,
										 isLoading,
									 }: HeaderAppBarProps) {
	const { data: session, status } = useSession()
	const loading = status === "loading"
	const user = session?.user;
	const router = useRouter();
	const isSmallScreen = useMediaQuery({ maxWidth: 420 });

	const handleStartNewChat = () => {
		setMessages([]);
		setCurrentChatIndex(-1);

		try {
			localStorage.setItem('sofosCurrentChatIndex', (-1).toString());
		} catch (error) {
			console.error('Error saving current chat index to localStorage:', error);
		}

		router.push('/new');
	};

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
											color={isLoading ? "primary" : "inherit"}
											aria-label="open drawer"
											onClick={(e) => {
												e.stopPropagation();

												if (!isLoading) {
													handleDrawerOpen();
												}
											}}
											sx={isSmallScreen
												? [
													{
														ml: -1,
														cursor: isLoading ? 'default' : 'pointer',
													},
													open && { display: 'none' },
												]
												: [
													{
														mr: 1,
														cursor: isLoading ? 'default' : 'pointer',
													},
													open && { display: 'none' },
												]
											}
										>
											<MenuIcon />
										</IconButton>
										<SelectSmall
											options={models}
											handleChange={handleModelChange}
											value={model.value}
											style={isSmallScreen
												? { marginRight: '0' }
												: { marginRight: '7px' }
											}
											disabled={isDisabled}
										/>
										<SelectSmall
											options={reasoningEfforts}
											handleChange={handleReasoningEffortChange}
											value={reasoningEffort}
											style={isSmallScreen
												? { marginRight: '0' }
												: { marginRight: '7px' }
											}
											disabled={isDisabled}
										/>
										<SelectSmall
											options={samplingParameters}
											handleChange={handleSamplingParameterChange}
											value={samplingParameter}
											style={isSmallScreen
												? { marginRight: '-7px' }
												: { marginRight: '3px' }
											}
											disabled={isDisabled}
										/>
										<Box sx={isSmallScreen
											? { ml: 'auto', mr: -1, display: 'flex' }
											: { ml: 'auto', display: 'flex' }
										}>
											{/*<Avatar*/}
											{/*	alt="avatar"*/}
											{/*	src={user.image || undefined}*/}
											{/*	sx={{ width: "30px", height: "30px" }}*/}
											{/*/>*/}
											<IconButton
												onClick={() => handleStartNewChat()}
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
											/>
					}
				</Box>
			</Grid>
			<div>{!user && loading ? "loading..." : ""}</div>
		</>
	);
}
