'use client'

import * as React from 'react';
import {AppBar, Avatar, Box, Toolbar, Typography, Button, IconButton, Grid} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import {signIn, signOut, useSession} from "next-auth/react"

export default function HeaderAppBar() {
    const {data: session, status} = useSession()
    const loading = status === "loading"
	const user = session?.user;

	return (
		<>
			<Grid container spacing={2} sx={{position: 'fixed', top: 15, zIndex: 10}}>
				<Box sx={{flexGrow: 1}}>
					<AppBar position="static">
						<Toolbar variant="dense">
							<IconButton size="large" edge="start" color="inherit" aria-label="menu">
								<MenuIcon />
							</IconButton>
							<Typography variant="h6" component="div" sx={{flexGrow: 1}}>
								sofos
							</Typography>
							<Typography component="div" sx={{flexGrow: 1}}>
								{user ? user.email ?? user.name : "Not signed in"}
							</Typography>
							{user ? (
								<>
									<Avatar
										alt="avatar"
										src={user.image || undefined}
										sx={{width: "30px", height: "30px"}}
									/>
									<Button color="inherit" onClick={(e) => {
										e.preventDefault();
										signOut().then();
									}}>
										Logout
									</Button>
								</>
							) : (
								<Button color="inherit" onClick={(e) => {
									e.preventDefault();
									signIn().then();
								}}>
									Login
								</Button>
							)}
						</Toolbar>
					</AppBar>
				</Box>
			</Grid>
			<div>{!user && loading ? "loading..." : ""}</div>
		</>
	);
}
