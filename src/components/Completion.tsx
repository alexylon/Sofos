import React from "react";
import { Grid } from "@mui/material";
import Box from "@mui/material/Box";
import MarkdownText from "@/components/MarkdownText";
import AutoScrollingWindow from "@/components/AutoScrollingWindow";
import { CopyToClipboardButton } from '@/components/CopyToClipboardButton';
import { Message } from 'ai';


interface CompletionProps {
	messages?: Message[]
}

export default function Completion({ messages }: CompletionProps) {

	return (
		<AutoScrollingWindow style={{ flexGrow: 1 }} messages={messages}>
			<div style={{ minHeight: "auto", height: "auto" }}>
				{messages?.map((m: any) => (
					<div key={m.id}>
						{m.role === 'user'
							?
							<Grid item xs={12}>
								<Box sx={{
									borderRadius: '5px',
									mt: 1,
									pb: 1,
									pl: 2,
									pr: 2,
									mb: 1,
									backgroundColor: '#a9d3ea'
								}}
								>
									<Box sx={{
										display: 'flex',
										justifyContent: 'flex-end',
										mr: -1,
									}}
									>
										<CopyToClipboardButton value={m.content} color="#000000" />
									</Box>
									<Box sx={{
										mt: -4,
									}}
									>
										<>
											<MarkdownText>
												{m.content}
											</MarkdownText>
											{m?.experimental_attachments
												?.filter((attachment: any) =>
													attachment?.contentType?.startsWith('image/'),
												)
												.map((attachment: any, index: number) => (
													<Box
														key={`${m.id}-${index}`}
														component="img"
														sx={{
															maxHeight: 200,
															borderRadius: '5px',
															mr: 2,
														}}
														alt={attachment.name ?? `attachment-${index}`}
														src={attachment.url}
													/>
												))}
										</>
									</Box>
								</Box>
							</Grid>
							:
							<Grid item xs={12}>
								<Box sx={{
									borderRadius: '5px',
									pb: 1,
									pl: 2,
									pr: 2,
									mt: 1,
									mb: 1,
									backgroundColor: '#d5d5d5',
								}}>
									<Box sx={{
										display: 'flex',
										justifyContent: 'flex-end',
										mr: -1,
									}}
									>
										<CopyToClipboardButton value={m.content} color="#000000" />
									</Box>
									<Box sx={{
										mt: -3,
									}}
									>
										<MarkdownText>
											{m.content}
										</MarkdownText>
									</Box>
								</Box>
							</Grid>
						}
					</div>
				))}
			</div>
		</AutoScrollingWindow>
	)
}
