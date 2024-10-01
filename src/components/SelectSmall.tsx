import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Model, SamplingParameter } from '@/types/types';

interface SelectSmallProps {
	options: Model[] | SamplingParameter[],
	handleChange: any,
	value: string | number,
}

export default function SelectSmall({ options, handleChange, value }: SelectSmallProps) {

	return (
		<FormControl sx={{ m: 1 }} size="small">
			<Select
				labelId="select-small-label"
				id="select-small"
				value={value}
				label="label"
				onChange={handleChange}
				variant="standard"
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
