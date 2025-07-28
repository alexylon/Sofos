import React, { useEffect, useState, useRef } from "react";
import { Grid, Box, Chip, Card } from "@mui/material";
import MarkdownText from "@/components/MarkdownText";
import AutoScrollingWindow from "@/components/AutoScrollingWindow";
import { CopyToClipboardButton } from '@/components/CopyToClipboardButton';
import { Attachment } from 'ai';
import { Message } from '@ai-sdk/react'
import { Model } from '@/types/types';
import { useMediaQuery } from 'react-responsive';


interface CompletionProps {
	messages?: Message[],
	models: Model[],
	isScrolling: boolean,
	autoScroll: () => void,
	setDistanceFromBottom: (n: number) => void,
	error?: Error,
}

export default function Completion({ messages, models, isScrolling, autoScroll, setDistanceFromBottom, error }: CompletionProps) {
	const isLastMessageFromUser = messages && messages.length > 0 && messages[messages.length - 1].role === 'user';
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerHeight, setContainerHeight] = useState<number | 'auto'>('auto');
	const isMobile = useMediaQuery({ maxWidth: 767 });

	useEffect(() => {
		const calculateDistance = () => {
			if (!containerRef.current) return;
			const windowHeight = window.innerHeight;
			const userMessages = containerRef.current.querySelectorAll('[data-role="user"]');
			const assistantMessages = containerRef.current.querySelectorAll('[data-role="assistant"]');

			if (userMessages.length > 0 && assistantMessages.length > 0) {
				const firstUserMessage = userMessages[0];
				const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
				const firstUserMessageRect = firstUserMessage.getBoundingClientRect();
				const lastAssistantMessageRect = lastAssistantMessage.getBoundingClientRect();
				const firstToLastUserMessageHeight = lastAssistantMessageRect.bottom - firstUserMessageRect.top;
				const offsetHeight = isMobile ? windowHeight + 165 : windowHeight - 170;

				if (isLastMessageFromUser && messages && messages.length > 1) {
					setContainerHeight(firstToLastUserMessageHeight + offsetHeight);
					autoScroll();
				}
			}
		};

		calculateDistance();
	}, [isLastMessageFromUser]);

	// Determine if the autoscroll button should be displayed by calculating the last assistant message distance from the bottom
	useEffect(() => {
		const calculateDistanceFromBottom = () => {
			if (containerRef.current) {
				const assistantMessages = containerRef.current.querySelectorAll('[data-role="assistant"]');
				const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];

				if (lastAssistantMessage) {
					const rect = lastAssistantMessage.getBoundingClientRect();
					const windowHeight = window.innerHeight;
					const distanceFromBottom = windowHeight - rect.bottom;

					setDistanceFromBottom(distanceFromBottom);
				}
			}
		};

		calculateDistanceFromBottom();

		const handleScroll = () => {
			calculateDistanceFromBottom();
		};

		window.addEventListener('scroll', handleScroll, true); // true for capture phase

		return () => {
			window.removeEventListener('scroll', handleScroll, true);
		};
	}, [messages]);


	return (
		<>
			<div
				ref={containerRef}
				style={{
					minHeight: typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight,
					height: 'auto',
				}}
			>
				{messages?.map((message: Message) => (
					<AutoScrollingWindow
						key={message.id}
						style={{ flexGrow: 1 }}
						isScrolling={isScrolling}
					>
						<div
							data-role={message.role}
						>
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
														// @ts-ignore
														message.annotations && message.annotations?.length > 0 && message.annotations[0].modelId
															// @ts-ignore
															? message.annotations[0].modelId
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
					</AutoScrollingWindow>
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
		</>
	)
}
