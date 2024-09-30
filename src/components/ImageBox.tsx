import Box from '@mui/material/Box';
import React from 'react';

const ImageBox = ({ file, index, fileURL }: any) => {
	return (
		<Box
			key={`${file.name}-${index}`}
			sx={{
				height: 50,
				width: 50,
				overflow: 'hidden',
				borderRadius: '5px',
				mr: 1,
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
	);
};

export default ImageBox;
