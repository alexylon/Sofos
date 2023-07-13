'use client'

import {useSession, signIn, signOut} from "next-auth/react"
import {Button} from "@mui/material";
import Box from "@mui/material/Box";

export default function Login() {
    const {data: session} = useSession()
    if (session) {
        return (
            <>
                {/*<Box sx={{pt: "100px"}}>*/}
                    Signed in as {session?.user?.email} <br/>
                    <Button variant={"outlined"} onClick={() => signOut()}>Sign out</Button>
                {/*</Box>*/}
            </>
        )
    }

    return (
        <>
            <Box sx={{mt: "20px"}}>
                Not signed in <br/>
                <Button variant={"outlined"} onClick={() => signIn()}>Sign in</Button>
            </Box>
        </>
    )
}
