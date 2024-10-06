import React from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import ReplayIcon from '@mui/icons-material/Replay';
import { Message } from 'ai';

interface SelectedImagesContainerProps {
	messages: Message[],
	isLoading: boolean,
	reload: any,
	stop: any,
}

const ActionButton = ({ messages, isLoading, reload, stop }: SelectedImagesContainerProps) => {
	const isRegenerateButton = messages.length > 0 && messages[messages.length - 1].role !== 'assistant' && !isLoading;
	const isAbortButton = messages.length > 0 && isLoading;


	return (
		<>
			<Grid className="actionButton" item xs={6} md={6}>
				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					{(isRegenerateButton || isAbortButton) &&
											<Button
												variant="outlined"
												color="primary"
												size="small"
												startIcon={isRegenerateButton ? <ReplayIcon color="primary" /> : <CancelIcon sx={{ color: "red", mt: 0 }} />}
												onClick={isRegenerateButton ? reload as () => void : stop as () => void}
												sx={{
							width: "135px",
							height: "26px",
							borderRadius: '13px',
							position: 'absolute',
							bottom: 75,
							backgroundColor: '#fafafa',
							borderColor: '#bfbfbf',
							':hover': {
								backgroundColor: '#fafafa',
								borderColor: '#000000',
							},
						}}
												disabled={messages.length < 1}
											>
												<Typography
													sx={{
							  color: isRegenerateButton ? 'primary' : 'red',
							  userSelect: 'none',
							  fontSize: '14px',
						  }}
												>
							{isRegenerateButton ? 'Regenerate' : 'Abort'}
												</Typography>
											</Button>
					}
				</Box>
			</Grid>
		</>
	);
};

export default ActionButton
