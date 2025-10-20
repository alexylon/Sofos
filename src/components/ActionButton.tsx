import React from 'react';
import { IconButton, useTheme } from '@mui/material';
import { UIMessage } from '@ai-sdk/react';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import ReplayCircleFilledOutlinedIcon from '@mui/icons-material/ReplayCircleFilledOutlined';

interface ActionButtonProps {
	messages: UIMessage[];
	isLoading: boolean;
	reload: () => void;
	stop: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ messages, isLoading, reload, stop }) => {
	const theme = useTheme();
	const hasMessages = messages.length > 0;
	const lastMessage = hasMessages ? messages[messages.length - 1] : null;
	const isRegenerateButton = hasMessages && lastMessage?.role !== 'assistant' && !isLoading;
	const isAbortButton = hasMessages && isLoading;

	if (!isRegenerateButton && !isAbortButton) {
		return null;
	}

	return (
		<IconButton
			edge="end"
			onClick={isRegenerateButton ? reload : stop}
		>
			{isRegenerateButton ? (
				<ReplayCircleFilledOutlinedIcon
					sx={{
						height: '30px',
						width: '30px',
						color: theme.palette.text.primary,
					}}
				/>
			) : (
				<StopCircleOutlinedIcon
					sx={{
						height: '30px',
						width: '30px',
						color: 'red',
					}}
				/>
			)}
		</IconButton>
	);
};

export default ActionButton;
