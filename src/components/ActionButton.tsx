import { Button, Grid, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import CancelIcon from '@mui/icons-material/Cancel';
import ReplayIcon from '@mui/icons-material/Replay';
import React from 'react';
import { Message } from 'ai';

interface SelectedImagesContainerProps {
	hasImages: boolean,
	messages: Message[],
	isLoading: boolean,
	reload: any,
	stop: any,
}

const ActionButton = ({ hasImages, messages, isLoading, reload, stop }: SelectedImagesContainerProps) => {


	return (
		<>
			{!hasImages &&
              <Grid className="actionButton" item xs={6} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
					{messages.length > 0 &&
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={
							isLoading
								? <CancelIcon sx={{ color: "red", mt: 0 }} />
								: <ReplayIcon color="primary" />
						}
                        onClick={isLoading ? stop as () => void : reload as () => void}
                        sx={{
							width: "180px",
							height: "30px",
							position: 'absolute',
							bottom: 77,
							backgroundColor: '#fafafa',
							borderColor: '#bfbfbf',
							':hover': {
								backgroundColor: '#fafafa',
								borderColor: '#000000',
							},
						}}
                        disabled={messages.length < 1}
                      >
						  {isLoading
							  ?
							  <Typography
								  color="red"
								  sx={{
									  userSelect: 'none',
								  }}
							  >
								  Abort
							  </Typography>
							  :
							  <Typography
								  sx={{
									  userSelect: 'none',
								  }}
							  >
								  Regenerate
							  </Typography>
						  }
                      </Button>
					}
                </Box>
              </Grid>
			}
		</>
	);
};

export default ActionButton
