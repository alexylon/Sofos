import * as React from 'react';
import { AppBar, Box, Button, Grid, IconButton, Toolbar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MapsUgcOutlinedIcon from '@mui/icons-material/MapsUgcOutlined';
import { signIn, useSession } from "next-auth/react"
import SelectSmall from '@/components/SelectSmall';
import { Model, ModelType, ReasoningEffort, SamplingParameter } from '@/types/types';
import { useRouter } from 'next/navigation'
import { Message } from '@ai-sdk/react'
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
	hybridParameters: SamplingParameter[],
	handleHybridParameterChange: any,
	hybridParameter: number,
	messages: Message[],
	setMessages: any,
	chatHistory: Message[][],
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
										 hybridParameters,
										 handleHybridParameterChange,
										 hybridParameter,
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

	const handleStartNewChat = () => {
		setMessages([]);
		setCurrentChatIndex(-1);
		localStorage.setItem('sofosCurrentChatIndex', (-1).toString());

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
											sx={[
												{
													mr: 2,
													cursor: isLoading ? 'default' : 'pointer',
												},
												open && { display: 'none' },
											]}
										>
											<MenuIcon />
										</IconButton>
										<SelectSmall
											options={models}
											handleChange={handleModelChange}
											value={model.value}
											style={{ marginRight: '5px' }}
											disabled={isDisabled}
										/>
										{model.type === ModelType.REASONING &&
										  <SelectSmall
												options={reasoningEfforts}
												handleChange={handleReasoningEffortChange}
												value={reasoningEffort}
												disabled={isDisabled}
											/>
										}
										{model.type === ModelType.STANDARD &&
										  <SelectSmall
												options={samplingParameters}
												handleChange={handleSamplingParameterChange}
												value={samplingParameter}
												disabled={isDisabled}
											/>
										}
										{model.type === ModelType.HYBRID &&
										  <SelectSmall
												options={hybridParameters}
												handleChange={handleHybridParameterChange}
												value={hybridParameter}
												disabled={isDisabled}
											/>
										}
										<Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
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
