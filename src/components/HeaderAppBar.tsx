'use client'

import * as React from 'react';
import {AppBar, Avatar, Box, Toolbar, Typography, Button, IconButton} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import {signIn, signOut, useSession} from "next-auth/react"

export default function HeaderAppBar() {
    const {data: session, status} = useSession()
    const loading = status === "loading"

    return (
        <>
            {!session && (
                <Box sx={{flexGrow: 1}}>
                    <AppBar position="static">
                        <Toolbar variant="dense">
                            <IconButton
                                size="large"
                                edge="start"
                                color="inherit"
                                aria-label="menu"
                            >
                                <MenuIcon/>
                            </IconButton>
                            <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                                Sofos
                            </Typography>
                            <Typography component="div" sx={{flexGrow: 1}}>
                                Not signed in
                            </Typography>
                            <Button
                                color="inherit"
                                onClick={(e) => {
                                    e.preventDefault()
                                    signIn().then()
                                }}
                            >
                                Login
                            </Button>
                        </Toolbar>
                    </AppBar>
                </Box>
            )}
            {session?.user && (
                <Box sx={{flexGrow: 1}}>
                    <AppBar position="static">
                        <Toolbar variant="dense">
                            <IconButton
                                size="large"
                                edge="start"
                                color="inherit"
                                aria-label="menu"
                            >
                                <MenuIcon/>
                            </IconButton>
                            <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                                Sofos
                            </Typography>
                            <Typography component="div" sx={{flexGrow: 1}}>
                                {session.user.email ?? session.user.name}
                            </Typography>
                            <Avatar
                                alt="avatar"
                                src={session.user.image ? session.user.image : undefined}
                                sx={{width: "30px", height: "30px"}}
                            />
                            <Button
                                color="inherit"
                                onClick={(e) => {
                                    e.preventDefault()
                                    signOut().then()
                                }}
                            >
                                Logout
                            </Button>
                        </Toolbar>
                    </AppBar>
                </Box>
            )}
            <div>{!session && loading ? "loading..." : ""}</div>
        </>
    );
}
