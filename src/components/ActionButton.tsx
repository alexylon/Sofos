import React from 'react';
import { IconButton } from '@mui/material';
import { UIMessage } from '@ai-sdk/react'
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import ReplayCircleFilledOutlinedIcon from '@mui/icons-material/ReplayCircleFilledOutlined';

interface SelectedImagesContainerProps {
	messages: UIMessage[],
	isLoading: boolean,
	reload: () => void,
	stop: () => void,
}

const ActionButton = ({ messages, isLoading, reload, stop }: SelectedImagesContainerProps) => {
	const isRegenerateButton = messages.length > 0 && messages[messages.length - 1].role !== 'assistant' && !isLoading;
	const isAbortButton = messages.length > 0 && isLoading;


	return (
		<>
			{
				(isRegenerateButton || isAbortButton) &&
					<IconButton
						edge="end"
						color="primary"
						onClick={isRegenerateButton ? reload as () => void : stop as () => void}
					>
					{isRegenerateButton
						? <ReplayCircleFilledOutlinedIcon
							sx={{
								height: '30px',
								width: '30px',
							}}
						/>
						: <StopCircleOutlinedIcon
							sx={{
								height: '30px',
								width: '30px',
								color: "red",
							}}
						/>
					}
					</IconButton>
			}
		</>
	);
};

export default ActionButton
