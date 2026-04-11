import React, { useState, useEffect } from 'react';
import { Button, Group, LoadingOverlay, Stack, Title, Text, Badge } from '@mantine/core';
import { IconLayoutGrid, IconPlus, IconMinus } from '@tabler/icons-react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import axios from '../axios_config';
import { apiRoutes } from '../apiRoutes';
import { notifications } from '@mantine/notifications';
import { t } from 'i18next';
import './VideoWall.module.css';

interface VideoStream {
    path: string;
    hls_link: string;
    username: string;
    ready: boolean;
}

interface LayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
}

export default function VideoWall() {
    const [videoStreams, setVideoStreams] = useState<VideoStream[]>([]);
    const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [layout, setLayout] = useState<LayoutItem[]>([]);
    const [gridCols, setGridCols] = useState(12);
    const [rowHeight, setRowHeight] = useState(150);

    useEffect(() => {
        getVideoStreams();
    }, []);

    useEffect(() => {
        // Generate layout when selected streams change
        generateLayout();
    }, [selectedStreams]);

    function getVideoStreams() {
        setLoading(true);
        axios.get(apiRoutes.video_streams, { 
            params: { page: 1, per_page: 100 } 
        })
        .then((r: any) => {
            setLoading(false);
            if (r.status === 200) {
                setVideoStreams(r.data.results.filter((s: VideoStream) => s.ready));
            }
        })
        .catch((err: any) => {
            setLoading(false);
            console.log(err);
            notifications.show({
                title: t('Failed to get video streams'),
                message: err.response?.data?.error || err.message,
                color: 'red',
            });
        });
    }

    function generateLayout() {
        const numStreams = selectedStreams.length;
        if (numStreams === 0) {
            setLayout([]);
            return;
        }

        // Calculate optimal grid layout
        const cols = Math.ceil(Math.sqrt(numStreams));
        const rows = Math.ceil(numStreams / cols);
        const cellWidth = Math.floor(gridCols / cols);
        const cellHeight = 2;

        const newLayout: LayoutItem[] = selectedStreams.map((streamPath: string, index: number) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            return {
                i: streamPath,
                x: col * cellWidth,
                y: row * cellHeight,
                w: cellWidth,
                h: cellHeight,
                minW: 2,
                minH: 1,
            };
        });

        setLayout(newLayout);
    }

    function toggleStream(path: string) {
        setSelectedStreams((prev: string[]) => {
            if (prev.includes(path)) {
                return prev.filter((p: string) => p !== path);
            } else {
                return [...prev, path];
            }
        });
    }

    function selectAllStreams() {
        setSelectedStreams(videoStreams.map((s: VideoStream) => s.path));
    }

    function clearAllStreams() {
        setSelectedStreams([]);
    }

    const onLayoutChange = (newLayout: LayoutItem[]) => {
        setLayout(newLayout);
    };

    return (
        <>
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2, fixed: true }} />
            
            <Stack gap="md">
                <Group justify="space-between">
                    <Title order={2}>
                        <IconLayoutGrid size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {t('Video Wall')}
                    </Title>
                    <Badge size="lg" variant="light">
                        {selectedStreams.length} / {videoStreams.length} {t('streams')}
                    </Badge>
                </Group>

                <Group gap="sm">
                    <Button 
                        onClick={selectAllStreams}
                        leftSection={<IconPlus size={16} />}
                        disabled={selectedStreams.length === videoStreams.length}
                    >
                        {t('Select All')}
                    </Button>
                    <Button 
                        onClick={clearAllStreams}
                        leftSection={<IconMinus size={16} />}
                        color="red"
                        disabled={selectedStreams.length === 0}
                    >
                        {t('Clear All')}
                    </Button>
                </Group>

                {videoStreams.length === 0 ? (
                    <Text c="dimmed" ta="center" mt="xl">
                        {t('No video streams available. Add streams from the Video Streams page.')}
                    </Text>
                ) : (
                    <>
                        <Text size="sm" c="dimmed">
                            {t('Click on streams to add/remove from video wall:')}
                        </Text>
                        <Group gap="xs">
                            {videoStreams.map((stream: VideoStream) => (
                                <Button
                                    key={stream.path}
                                    onClick={() => toggleStream(stream.path)}
                                    variant={selectedStreams.includes(stream.path) ? 'filled' : 'outline'}
                                    size="compact-sm"
                                >
                                    {stream.path}
                                    {stream.username && ` (${stream.username})`}
                                </Button>
                            ))}
                        </Group>
                    </>
                )}

                {selectedStreams.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                        <Text size="sm" c="dimmed" mb="sm">
                            {t('Drag and resize video windows. Double-click to maximize.')}
                        </Text>
                        <GridLayout
                            className="video-wall-grid"
                            layout={layout}
                            cols={gridCols}
                            rowHeight={rowHeight}
                            width={1200}
                            onLayoutChange={onLayoutChange}
                            draggableHandle=".drag-handle"
                            isDraggable
                            isResizable
                            compactType="vertical"
                            preventCollision={false}
                        >
                            {selectedStreams.map((streamPath: string) => {
                                const stream = videoStreams.find((s: VideoStream) => s.path === streamPath);
                                if (!stream) return null;

                                return (
                                    <div key={streamPath} className="video-wall-item">
                                        <div className="drag-handle">
                                            <Text size="xs" fw={500} c="white">
                                                {stream.path}
                                            </Text>
                                            <Button
                                                size="compact-xs"
                                                color="red"
                                                onClick={() => toggleStream(streamPath)}
                                            >
                                                ✕
                                            </Button>
                                        </div>
                                        <iframe
                                            src={`${stream.hls_link}?jwt=${localStorage.getItem('token')}`}
                                            title={stream.path}
                                            style={{
                                                width: '100%',
                                                height: 'calc(100% - 30px)',
                                                border: 0,
                                            }}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                );
                            })}
                        </GridLayout>
                    </div>
                )}
            </Stack>
        </>
    );
}
