import React from "react";
import { Grid, Box, Chip, Card } from "@mui/material";
import MarkdownText from "@/components/MarkdownText";
import AutoScrollingWindow from "@/components/AutoScrollingWindow";
import { CopyToClipboardButton } from '@/components/CopyToClipboardButton';
import { Attachment, Message } from 'ai';
import { Model } from '@/types/types';


interface CompletionProps {
	messages?: Message[],
	models: Model[],
	error?: any,
}

export default function Completion({ messages, models, error }: CompletionProps) {

	return (
		<AutoScrollingWindow style={{ flexGrow: 1 }} messages={messages}>
			<div style={{ minHeight: "auto", height: "auto" }}>
				{messages?.map((message: Message) => (
					<div key={message.id}>
						{message.role === 'user'
							?
							<Grid item xs={12}>
								<Box sx={{
									borderRadius: '13px',
									mt: 1,
									pb: 1,
									pl: 2,
									pr: 2,
									mb: 1,
									backgroundColor: '#a9d3ea',
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
												?.filter((attachment: Attachment | undefined) =>
													attachment?.contentType?.startsWith('image/'),
												)
												.map((attachment: any, index: number) => (
													<Card
														key={`${message.id}-image-${index}`}
														sx={{
															maxHeight: 200,
															borderRadius: '13px',
															mr: 2,
															mb: 1,
															display: 'inline-block',
															overflow: 'hidden',
														}}
													>
														<Box
															component="img"
															sx={{
																maxHeight: 200,
																width: 'auto',
																height: 'auto',
																maxWidth: {
																	xs: 350, // On extra-small devices
																	sm: 1280, // On small devices and up
																},
															}}
															alt={attachment.name ?? `attachment-${index}`}
															src={attachment.url}
														/>
													</Card>
												))}
											<Box sx={{ display: 'flex', flexDirection: 'row' }}>
												{message?.experimental_attachments
													?.filter((attachment: Attachment | undefined) =>
														!attachment?.contentType?.startsWith('image/'),
													)
													.map((attachment: any, index: number) => (
														<Box key={`${message.id}-file-${index}`} sx={{ display: 'flex' }}>
															<Card
																sx={{
																	maxWidth: 300,
																	height: 35,
																	position: 'relative',
																	display: 'flex',
																	alignItems: 'center',
																	paddingRight: '10px',
																	mr: 1,
																	mb: 1,
																	backgroundColor: '#a9eae0',
																	borderRadius: '13px',
																}}
															>
																<Box
																	sx={{
																		overflow: 'hidden',
																		textOverflow: 'ellipsis',
																		whiteSpace: 'nowrap',
																		ml: 1,
																		color: '#707070',
																	}}
																>
																	{attachment.name}
																</Box>
															</Card>
														</Box>
													))}
											</Box>
										</>
									</Box>
								</Box>
							</Grid>
							:
							<Grid item xs={12}>
								<Box sx={{
									borderRadius: '13px',
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
														? models.find((model: string) => model.value === message.annotations[0].modelValue)?.label
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
				{error && (
					<Grid item xs={12}>
						<Box sx={{
							borderRadius: '13px',
							pb: 1,
							pl: 2,
							pr: 2,
							mt: 1,
							mb: 1,
							backgroundColor: '#eaa9a9',
						}}>
							<Box sx={{
								pt: 2,
								pb: 1,
							}}
							>
								{error.toString()}
							</Box>
						</Box>
					</Grid>
				)}
			</div>
		</AutoScrollingWindow>
	)
}
