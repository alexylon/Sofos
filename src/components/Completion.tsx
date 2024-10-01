import React from "react";
import { Grid, Box, Chip } from "@mui/material";
import MarkdownText from "@/components/MarkdownText";
import AutoScrollingWindow from "@/components/AutoScrollingWindow";
import { CopyToClipboardButton } from '@/components/CopyToClipboardButton';
import { Attachment, Message } from 'ai';
import { Model } from '@/types/types';


interface CompletionProps {
	messages?: Message[],
	models: Model[],
}

export default function Completion({ messages, models }: CompletionProps) {

	return (
		<AutoScrollingWindow style={{ flexGrow: 1 }} messages={messages}>
			<div style={{ minHeight: "auto", height: "auto" }}>
				{messages?.map((message: Message) => (
					<div key={message.id}>
						{message.role === 'user'
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
										<CopyToClipboardButton value={message.content} color="#000000" />
									</Box>
									<Box sx={{
										mt: -4,
									}}
									>
										<>
											<MarkdownText>
												{message.content}
											</MarkdownText>
											{message?.experimental_attachments
												?.filter((attachment:  Attachment | undefined) =>
													attachment?.contentType?.startsWith('image/'),
												)
												.map((attachment: any, index: number) => (
													<Box
														key={`${message.id}-${index}`}
														component="img"
														sx={{
															maxHeight: 200,
															maxWidth: {
																xs: 350, // On extra-small devices
																sm: 1280, // On small devices and up
															},
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
									<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
										<Box sx={{ display: 'flex', justifyContent: 'flex-start', pt: '10px' }}>
											<Chip
												label={
													message.annotations && message.annotations?.length > 0
														// @ts-ignore
														? models.find((model: string) => model.value === message.annotations[0].model)?.label
														: ''
												}
												variant="outlined"
												size="small"
												sx={{ fontSize: '0.70rem' }}
											/>
										</Box>
										<Box sx={{ display: 'flex', justifyContent: 'flex-end', mr: -1 }}>
											<CopyToClipboardButton value={message.content} color="#000000" />
										</Box>
									</Box>
									<Box sx={{
										mt: -2,
									}}
									>
										<MarkdownText>
											{message.content}
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
