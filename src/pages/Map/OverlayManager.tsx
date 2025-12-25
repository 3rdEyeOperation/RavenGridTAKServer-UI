import React, { useState } from 'react';
import { Paper, Stack, Text, Switch, Group, Divider, Slider, ActionIcon, Collapse } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconLayersLinked } from '@tabler/icons-react';

interface OverlayManagerProps {
    onClose: () => void;
}

export function OverlayManager({ onClose }: OverlayManagerProps) {
    const [showWeather, setShowWeather] = useState(false);
    const [showTerrain, setShowTerrain] = useState(false);
    const [showMGRS, setShowMGRS] = useState(true);
    const [showTraffic, setShowTraffic] = useState(false);
    const [weatherOpacity, setWeatherOpacity] = useState(70);
    const [terrainOpacity, setTerrainOpacity] = useState(50);
    const [expandedWeather, setExpandedWeather] = useState(false);
    const [expandedTerrain, setExpandedTerrain] = useState(false);

    return (
        <Paper
            shadow="xl"
            p="md"
            className="tactical-card"
            style={{
                position: 'fixed',
                right: '350px',
                top: '80px',
                zIndex: 1001,
                backgroundColor: 'rgba(10, 14, 20, 0.95)',
                border: '1px solid rgba(100, 255, 218, 0.4)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 30px rgba(100, 255, 218, 0.2)',
                width: '300px',
                maxHeight: '80vh',
                overflowY: 'auto',
            }}
        >
            <Stack gap="md">
                <Group justify="space-between">
                    <Group gap="xs">
                        <IconLayersLinked size={18} color="#64ffda" />
                        <Text size="sm" fw={700} className="text-glow-cyan" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Overlay Manager
                        </Text>
                    </Group>
                </Group>

                <Divider color="rgba(100, 255, 218, 0.3)" />

                {/* Weather Overlay */}
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Group gap="xs">
                            <Switch
                                size="xs"
                                checked={showWeather}
                                onChange={(e) => setShowWeather(e.currentTarget.checked)}
                                color="tacticalCyan"
                            />
                            <Text size="xs" c="dimmed">Weather Radar</Text>
                        </Group>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => setExpandedWeather(!expandedWeather)}
                        >
                            {expandedWeather ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                        </ActionIcon>
                    </Group>
                    <Collapse in={expandedWeather && showWeather}>
                        <Stack gap="xs" pl="md">
                            <Text size="xs" c="dimmed">Opacity: {weatherOpacity}%</Text>
                            <Slider
                                value={weatherOpacity}
                                onChange={setWeatherOpacity}
                                color="tacticalCyan"
                                size="xs"
                                marks={[
                                    { value: 0, label: '0%' },
                                    { value: 50, label: '50%' },
                                    { value: 100, label: '100%' },
                                ]}
                            />
                        </Stack>
                    </Collapse>
                </Stack>

                <Divider color="rgba(100, 255, 218, 0.2)" />

                {/* Terrain Overlay */}
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Group gap="xs">
                            <Switch
                                size="xs"
                                checked={showTerrain}
                                onChange={(e) => setShowTerrain(e.currentTarget.checked)}
                                color="tacticalCyan"
                            />
                            <Text size="xs" c="dimmed">Terrain/DTED</Text>
                        </Group>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => setExpandedTerrain(!expandedTerrain)}
                        >
                            {expandedTerrain ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                        </ActionIcon>
                    </Group>
                    <Collapse in={expandedTerrain && showTerrain}>
                        <Stack gap="xs" pl="md">
                            <Text size="xs" c="dimmed">Opacity: {terrainOpacity}%</Text>
                            <Slider
                                value={terrainOpacity}
                                onChange={setTerrainOpacity}
                                color="tacticalGreen"
                                size="xs"
                                marks={[
                                    { value: 0, label: '0%' },
                                    { value: 50, label: '50%' },
                                    { value: 100, label: '100%' },
                                ]}
                            />
                        </Stack>
                    </Collapse>
                </Stack>

                <Divider color="rgba(100, 255, 218, 0.2)" />

                {/* MGRS Grid */}
                <Group justify="space-between">
                    <Group gap="xs">
                        <Switch
                            size="xs"
                            checked={showMGRS}
                            onChange={(e) => setShowMGRS(e.currentTarget.checked)}
                            color="tacticalCyan"
                        />
                        <Text size="xs" c="dimmed">MGRS Grid</Text>
                    </Group>
                </Group>

                <Divider color="rgba(100, 255, 218, 0.2)" />

                {/* Traffic */}
                <Group justify="space-between">
                    <Group gap="xs">
                        <Switch
                            size="xs"
                            checked={showTraffic}
                            onChange={(e) => setShowTraffic(e.currentTarget.checked)}
                            color="tacticalOrange"
                        />
                        <Text size="xs" c="dimmed">Traffic</Text>
                    </Group>
                </Group>
            </Stack>
        </Paper>
    );
}
