import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Model, ReasoningEffort, SamplingParameter } from '@/types/types';
import { ReactNode } from 'react';

interface SelectSmallProps {
	options: Model[] | SamplingParameter[] | ReasoningEffort[];
	handleChange: (event: SelectChangeEvent<string | number>, child: ReactNode) => void;
	value: string | number;
	style?: React.CSSProperties;
	disabled?: boolean;
}

export default function SelectSmall({ options, handleChange, value, style, disabled }: SelectSmallProps) {

	return (
		<FormControl size="small">
			<Select
				labelId="select-small-label"
				id="select-small"
				value={value}
				label="label"
				onChange={handleChange}
				variant="standard"
				style={style}
				disabled={disabled}
				sx={{
					'&:before': {
						borderBottom: 'none',
					},
					'&:hover:not(.Mui-disabled):before': {
						borderBottom: 'none',
					},
					'& .MuiSelect-select': {
						color: 'white',
					},
					'& .MuiSelect-select.Mui-selected': {
						color: 'white',
					},
					'& .MuiSelect-select:hover': {
						color: 'white',
					},
					'& .MuiSelect-icon': {
						color: 'white',
						right: '2px',
					},
					'&.Mui-disabled': {
						'& .MuiSelect-select': {
							color: 'grey',
						},
						'& .MuiSelect-icon': {
							display: 'none',
						},
						'&:before': {
							borderBottom: 'none',
						},
					},
				}}
			>
				{options.map((option: any, index: number) => (
					<MenuItem key={index} value={option.value}>
						{option.label}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}
