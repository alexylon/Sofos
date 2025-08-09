import Box from '@mui/material/Box';

export default function PulsingDotSVG() {
	const minR = 4;  // radius in px
	const maxR = 7;

	return (
		<Box
			component="svg"
			width={maxR * 2}
			height={maxR * 2}
			viewBox={`0 0 ${maxR * 2} ${maxR * 2}`}
			sx={{
				display: 'inline-block',
				'& .dot': {
					animation: 'pulseR 1.2s ease-in-out infinite',
				},
				'@keyframes pulseR': {
					'0%': { r: `${minR}px`, opacity: 1 },
					'50%': { r: `${maxR}px`, opacity: 1 },
					'100%': { r: `${minR}px`, opacity: 1 },
				},
			}}
		>
			<circle className="dot" cx={maxR} cy={maxR} r={minR} fill="black" />
		</Box>
	);
}
