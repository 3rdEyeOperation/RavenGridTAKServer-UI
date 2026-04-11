import React, { useState, useEffect } from 'react';
import { 
    Button, 
    Card, 
    Grid, 
    Group, 
    LoadingOverlay, 
    Stack, 
    Title, 
    Text, 
    Badge,
    SegmentedControl,
    ActionIcon,
    Tooltip
} from '@mantine/core';
import { 
    IconLayoutGrid, 
    IconMaximize,
    IconX,
} from '@tabler/icons-react';
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

export default function VideoWall() {
    const [videoStreams, setVideoStreams] = useState<VideoStream[]>([]);
    const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [gridLayout, setGridLayout] = useState<string>('2x2');
    const [maximizedStream, setMaximizedStream] = useState<string | null>(null);

    useEffect(() => {
        getVideoStreams();
    }, []);

    function getVideoStreams() {
        setLoading(true);
        axios.get(apiRoutes.video_streams, { 
            params: { page: 1, per_page: 100 } 
        })
        .then((res: any) => {
            setLoading(false);
            if (res.data && res.data.items) {
                setVideoStreams(res.data.items);
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

    function toggleStream(path: string) {
        setSelectedStreams((prev: string[]) => {
            if (prev.includes(path)) {
                // Remove if maximized
                if (maximizedStream === path) {
                    setMaximizedStream(null);
                }
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
        setMaximizedStream(null);
    }

    function getGridColumns(): number {
        switch (gridLayout) {
            case '1x1': return 1;
            case '2x2': return 2;
            case '3x3': return 3;
            case '4x4': return 4;
            default: return 2;
        }
    }

    function toggleMaximize(path: string) {
        setMaximizedStream(maximizedStream === path ? null : path);
    }

    return (
        <>
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2, fixed: true }} />
            
            <Stack gap="md">
                <Group justify="space-between" mb="md">
                    <Group>
                        <Title order={2}>
                            <IconLayoutGrid size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                            {t('Live View')}
                        </Title>
                        <Badge size="lg" variant="light">
                            {selectedStreams.length} / {videoStreams.length}
                        </Badge>
                    </Group>
                    
                    <Group gap="sm">
                        <SegmentedControl
                            value={gridLayout}
                            onChange={setGridLayout}
                            data={[
                                { label: '1×1', value: '1x1' },
                                { label: '2×2', value: '2x2' },
                                { label: '3×3', value: '3x3' },
                                { label: '4×4', value: '4x4' },
                            ]}
                            disabled={maximizedStream !== null}
                        />
                        <Button 
                            onClick={selectAllStreams}
                            size="sm"
                            variant="light"
                            disabled={selectedStreams.length === videoStreams.length}
                        >
                            {t('All')}
                        </Button>
                        <Button 
                            onClick={clearAllStreams}
                            size="sm"
                            variant="light"
                            color="red"
                            disabled={selectedStreams.length === 0}
                        >
                            {t('Clear')}
                        </Button>
                    </Group>
                </Group>

                {/* Camera Selection */}
                {videoStreams.length === 0 ? (
                    <Card withBorder p="xl" style={{ textAlign: 'center' }}>
                        <Text c="dimmed" size="sm">
                            {t('No cameras available. Add cameras from the Video Streams page.')}
                        </Text>
                    </Card>
                ) : (
                    <Card withBorder p="xs" mb="md">
                        <Group gap="xs">
                            {videoStreams.map((stream: VideoStream) => (
                                <Button
                                    key={stream.path}
                                    onClick={() => toggleStream(stream.path)}
                                    variant={selectedStreams.includes(stream.path) ? 'filled' : 'subtle'}
                                    size="xs"
                                    radius="md"
                                >
                                    {stream.path}
                                </Button>
                            ))}
                        </Group>
                    </Card>
                )}

                {/* Video Grid */}
                {selectedStreams.length > 0 && (
                    <Grid gutter="md">
                        {selectedStreams.slice(0, maximizedStream ? undefined : getGridColumns() * getGridColumns()).map((streamPath: string) => {
                            const stream = videoStreams.find((s: VideoStream) => s.path === streamPath);
                            if (!stream) return null;
                            if (maximizedStream && maximizedStream !== streamPath) return null;

                            const isMaximized = maximizedStream === streamPath;

                            return (
                                <Grid.Col 
                                    key={streamPath} 
                                    span={isMaximized ? 12 : { base: 12, sm: 6, md: 12 / getGridColumns() }}
                                >
                                    <Card withBorder p={0} className="camera-card">
                                        {/* Camera Header */}
                                        <Group justify="space-between" p="xs" className="camera-header">
                                            <Group gap="xs">
                                                <Badge size="sm" variant="dot" color="green">
                                                    {stream.path}
                                                </Badge>
                                                {stream.username && (
                                                    <Text size="xs" c="dimmed">
                                                        {stream.username}
                                                    </Text>
                                                )}
                                            </Group>
                                            <Group gap={4}>
                                                <Tooltip label={isMaximized ? t('Exit Fullscreen') : t('Fullscreen')}>
                                                    <ActionIcon 
                                                        variant="subtle" 
                                                        size="sm"
                                                        onClick={() => toggleMaximize(streamPath)}
                                                    >
                                                        <IconMaximize size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label={t('Remove')}>
                                                    <ActionIcon 
                                                        variant="subtle" 
                                                        size="sm" 
                                                        color="red"
                                                        onClick={() => toggleStream(streamPath)}
                                                    >
                                                        <IconX size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </Group>

                                        {/* Video Player */}
                                        <div style={{ position: 'relative', paddingBottom: isMaximized ? '56.25%' : '56.25%', height: 0 }}>
                                            <iframe
                                                src={`${stream.hls_link}?jwt=${localStorage.getItem('token')}`}
                                                title={stream.path}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 0,
                                                }}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    </Card>
                                </Grid.Col>
                            );
                        })}
                    </Grid>
                )}
            </Stack>
        </>
    );
}
