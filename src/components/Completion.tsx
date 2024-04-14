import React from "react";
import { Grid } from "@mui/material";
import Box from "@mui/material/Box";
import MarkdownText from "@/components/MarkdownText";
import AutoScrollingWindow from "@/components/AutoScrollingWindow";


export default function Completion({messages}: any) {

	return (
		<AutoScrollingWindow style={{flexGrow: 1}} messages={messages}>
			<div style={{minHeight: "auto", height: "auto"}}>
				{messages.map((m: any) => (
					<div key={m.id}>
						{m.role === 'user'
							?
							<Grid item xs={12}>
								<Box sx={{
									borderRadius: '5px',
									mt: 1,
									pt: 1,
									pb: 1,
									pl: 2,
									pr: 2,
									mb: 1,
									backgroundColor: '#a9d3ea'
								}}>
									{m.content}
								</Box>
							</Grid>
							:
							<Grid item xs={12}>
								<Box sx={{
									borderRadius: '5px',
									pt: 1,
									pb: 1,
									pl: 2,
									pr: 2,
									mt: 1,
									mb: 1,
									backgroundColor: '#d5d5d5',
								}}>
									<MarkdownText>
										{m.content}
									</MarkdownText>
								</Box>
							</Grid>
						}
					</div>
				))}
			</div>
		</AutoScrollingWindow>
	)
}
