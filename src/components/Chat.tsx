'use client'

import React from 'react';
import Box from '@mui/material/Box';
import { Button, Grid, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import Completion from "@/components/Completion";
import { TextareaAutosize } from "@mui/base";
import { useChat } from 'ai/react'
import { useSession } from "next-auth/react"
import SendIcon from '@mui/icons-material/Send';


export default function Chat() {
	const {
		input,
		isLoading,
		handleInputChange,
		handleSubmit,
		messages,
		reload,
		setInput,
		stop
	} = useChat();

	const {data: session} = useSession();

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files.length > 0) {
			readFileContent(event.target.files[0]).then(content => {
				setInput(input + " " + content);
				// Resetting the value allows to select the same file again
				event.target.value = '';
			}).catch(error => {
				// handle error
				console.error(error);
			});
		}
	};

	const readFileContent = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = (event) => {
				resolve(event?.target?.result as string);
			};

			reader.onerror = (event) => {
				reject(new Error("Error reading file: " + event?.target?.error));
			};

			reader.readAsText(file);
		});
	};

	if (!session) {
		return (
			<>

			</>
		)
	}

	return (
		<Box
			className="chatContainer"
			sx={{
				maxWidth: 730,
				marginLeft: "auto",
				marginRight: "auto",
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				overflow: 'hidden',
				mt: '40px',
				pb: 6,
				height: {
					xs: 'calc(86vh - 60px)', // On extra-small devices
					sm: 'calc(94vh - 60px)', // On small devices and up
				},
				position: 'relative',
			}}>
			<Grid
				className="messageContainer"
				container
				sx={{
					width: '100%',
				}}
			>
				<Grid
					item xs={12}
					sx={{
						height: {
							xs: 'calc(86vh - 60px)', // On extra-small devices
							sm: 'calc(94vh - 60px)', // On small devices and up
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
							<Completion messages={messages} />
						</Box>
						:
						<Box sx={{
							mt: 15,
						}}>
							<Typography
								variant="h2"
								component="h2"
								color="#D1D5DB"
								align="center"
								fontWeight="bold"
							>
								Sofos
							</Typography>
						</Box>
					}
				</Grid>
			</Grid>
			<Grid className="actionButton" item xs={6} md={6}>
				<Box sx={{display: 'flex', justifyContent: 'center'}}>
					{messages.length > 0 &&
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={isLoading ? stop as () => void : reload as () => void}
                        sx={{
							width: "180px",
							height: "30px",
							position: 'absolute',
							bottom: 52,
							backgroundColor: '#fafafa',
							borderColor: '#bfbfbf',
							':hover': {
								backgroundColor: '#fafafa',
								borderColor: '#000000',
							},
						}}
                        disabled={messages.length < 1}
                      >
						  {isLoading ? "Abort" : "Regenerate"}
                      </Button>
					}
				</Box>
			</Grid>
			<Grid
				className="sendMessageContainer"
				container
				sx={{width: '100%'}}
			>
				<Box
					sx={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
					}}>
					<Grid item xs={12}>
						<Box sx={{p: 1}}>
							<TextField
								fullWidth
								id="user-input"
								label={!isLoading && !input ? "Send a message..." : ""}
								multiline
								disabled={isLoading}
								size="small"
								value={input}
								onChange={handleInputChange}
								variant="outlined"
								InputLabelProps={{shrink: false}}
								InputProps={{
									inputComponent: TextareaAutosize,
									inputProps: {
										minRows: 1,
										maxRows: 10,
										style: {resize: 'none'},
										onKeyDown: (event) => {
											if (event.key === 'Enter' && !event.shiftKey) {
												// Prevent default action
												event.preventDefault();

												if (!input?.trim()) {
													return;
												}

												// Create synthetic FormEvent for TypeScript compatibility
												const formEvent: React.FormEvent<HTMLFormElement> = event as unknown as React.FormEvent<HTMLFormElement>;

												handleSubmit(formEvent);
											}
										},
									},
									endAdornment: !isLoading && (
										<InputAdornment position="end">
											<IconButton
												edge="end"
												color="primary"
												onClick={(event: any) => {
													if (!!input?.trim()) {
														handleSubmit(event);
													}
												}}
											>
												<SendIcon />
											</IconButton>
										</InputAdornment>
									),
								}}
								sx={
									isLoading
										? {borderRadius: '5px', backgroundColor: '#F0F0F0'}
										: {borderRadius: '5px', backgroundColor: '#FAFAFA'}
								}
							/>
						</Box>
					</Grid>
				</Box>
			</Grid>
		</Box>
	);
}
