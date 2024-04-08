'use client'

import React from 'react';
import Box from '@mui/material/Box';
import { Button, Grid, IconButton, InputAdornment, TextField } from '@mui/material';
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
		<Box sx={{
			maxWidth: 730,
			marginLeft: "auto",
			marginRight: "auto",
			backgroundColor: '#F0F0F0',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
			overflow: 'hidden',
			py: 3,
			mt: 6,
			gap: '5px',
			height: 'calc(92vh - 50px)',
		}}>
			<Grid container spacing={2} sx={{flexGrow: 1, overflow: 'auto'}}>
				<Grid item xs={12} className="messageContainer" sx={{display: 'flex'}}>
					<Box sx={{
						mt: -2,
						border: '2px solid #ddd',
						borderRadius: '5px',
						p: 1,
						overflowY: 'auto',
						flex: 1,
					}}>
						<Completion messages={messages} />
					</Box>
				</Grid>
			</Grid>
			<Grid
				container
				spacing={2}
				className="sendMessageContainer"
				sx={{maxWidth: '732px', mb: -3}}
			>
				<Grid item xs={12}>
					<Box sx={{border: '2px solid #ddd', borderRadius: '5px', p: 1}}>
						<TextField
							fullWidth
							id="user-input"
							label={!isLoading ? "Send a message..." : ""}
							multiline
							disabled={isLoading}
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
							value={input}
							onChange={handleInputChange}
							variant="outlined"
							sx={
								isLoading
									? {borderRadius: '5px', backgroundColor: '#F0F0F0'}
									: {borderRadius: '5px', backgroundColor: '#FAFAFA'}
							}
						/>
					</Box>
				</Grid>
				<Grid
					container
					sx={{
						display: 'flex',
						flexDirection: 'row',
						mt: 1,
						ml: 2
					}}
				>
					<Grid item xs={6} md={6}>
						<input
							type="file"
							id="file-input"
							style={{display: 'none'}}
							onChange={handleFileChange}
						/>
						<label htmlFor="file-input">
							<Button
								variant="outlined"
								color="primary"
								component="span"
								style={{minWidth: "120px"}}
							>
								Select File
							</Button>
						</label>
					</Grid>
					<Grid item xs={6} md={6} style={{display: 'flex', justifyContent: 'flex-end'}}>
						<Button
							variant="contained"
							color="primary"
							onClick={isLoading ? stop as () => void : reload as () => void}
							style={{minWidth: "120px"}}
							disabled={messages.length < 1}
						>
							{isLoading ? "Abort" : "Regenerate"}
						</Button>
					</Grid>
				</Grid>
			</Grid>
		</Box>
	);
}
