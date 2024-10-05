import { Box, Card } from '@mui/material';
import React from 'react';

const ImageBox = ({ file, index, fileURL }: any) => {
	return (
		<Card
			sx={{
				height: 50,
				width: 50,
				borderRadius: '12px',
				mr: '4px',
				mb: '-6px',
				display: 'inline-block',
				overflow: 'hidden',
			}}
		>
			<Box
				sx={{
					height: 50,
					width: 50,
					overflow: 'hidden',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<Box
					component="img"
					sx={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
					}}
					alt={file.name ?? `attachment-${index}`}
					src={fileURL}
				/>
			</Box>
		</Card>
	);
};

export default ImageBox;
