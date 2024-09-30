'use client'

import * as React from 'react';
import { AppBar, Avatar, Box, Toolbar, Typography, Button, IconButton, Grid } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { signIn, signOut, useSession } from "next-auth/react"
import SelectSmall from '@/components/SelectSmall';

export default function HeaderAppBar({ options, handleChange, value }: any) {
	const { data: session, status } = useSession()
	const loading = status === "loading"
	const user = session?.user;

	return (
		<>
			<Grid container spacing={2} sx={{ position: 'fixed', top: 15, zIndex: 10 }}>
				<Box sx={{ flexGrow: 1 }}>
					<AppBar position="static">
						<Toolbar variant="dense">
							<IconButton size="large" edge="start" color="inherit" aria-label="menu">
								<MenuIcon />
							</IconButton>
							{/*<Typography component="div" sx={{ flexGrow: 1 }}>*/}
							{/*	{user ? user.email ?? user.name : "Not signed in"}*/}
							{/*</Typography>*/}
							{user ? (
								<>
									<SelectSmall options={options} handleChange={handleChange} value={value} />

									<Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
										<Avatar
											alt="avatar"
											src={user.image || undefined}
											sx={{ width: "30px", height: "30px" }}
										/>
										<Button color="inherit" onClick={(e) => {
											e.preventDefault();
											signOut().then();
										}}>
											Logout
										</Button>
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
