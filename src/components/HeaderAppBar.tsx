'use client'

import * as React from 'react';
import { AppBar, Avatar, Box, Toolbar, Button, Grid, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { signIn, signOut, useSession } from "next-auth/react"
import SelectSmall from '@/components/SelectSmall';
import { Model, SamplingParameter } from '@/types/types';
import { useRouter } from 'next/navigation'

interface HeaderAppBarProps {
	models: Model[],
	handleModelChange: any,
	model: string,
	samplingParameters: SamplingParameter[],
	handleSamplingParameterChange: any,
	samplingParameter: number,
}

export default function HeaderAppBar({
										 models,
										 handleModelChange,
										 model,
										 samplingParameters,
										 handleSamplingParameterChange,
										 samplingParameter,
									 }: HeaderAppBarProps) {
	const { data: session, status } = useSession()
	const loading = status === "loading"
	const user = session?.user;
	const router = useRouter();

	return (
		<>
			<Grid container spacing={2} sx={{ position: 'fixed', top: 15, zIndex: 10 }}>
				<Box sx={{ flexGrow: 1 }}>
					<AppBar position="static">
						<Toolbar variant="dense">
							{/*<IconButton size="large" edge="start" color="inherit" aria-label="menu">*/}
							{/*	<MenuIcon />*/}
							{/*</IconButton>*/}
							{/*<Typography component="div" sx={{ flexGrow: 1 }}>*/}
							{/*	{user ? user.email ?? user.name : "Not signed in"}*/}
							{/*</Typography>*/}
							{user ? (
								<>
									<IconButton
										sx={{ mr: 1 }}
										onClick={(e) => {
											e.preventDefault();
											signOut().then();
										}}
									>
										<LogoutOutlinedIcon
											sx={{
												height: '26px',
												width: '26px',
												color: 'white',
											}}
										/>
									</IconButton>
									<SelectSmall options={models} handleChange={handleModelChange} value={model} style={{marginRight: '5px'}} />
									<SelectSmall options={samplingParameters} handleChange={handleSamplingParameterChange} value={samplingParameter} />
									<Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
										{/*<Avatar*/}
										{/*	alt="avatar"*/}
										{/*	src={user.image || undefined}*/}
										{/*	sx={{ width: "30px", height: "30px" }}*/}
										{/*/>*/}
										<IconButton
											onClick={() => router.push('/new')}
										>
											<ReplayOutlinedIcon
												sx={{
													height: '26px',
													width: '26px',
													color: 'white',
												}}
											/>
										</IconButton>
									</Box>
								</>
							) : (
								<Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
									<Button color="inherit" onClick={(e) => {
										e.preventDefault();
										signIn().then();
									}}>
										Login
									</Button>
								</Box>
							)}
						</Toolbar>
					</AppBar>
				</Box>
			</Grid>
			<div>{!user && loading ? "loading..." : ""}</div>
		</>
	);
}
