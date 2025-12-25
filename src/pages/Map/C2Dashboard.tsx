import React, { useState, useEffect } from 'react';
import { Paper, Stack, Text, Group, Badge, Divider, Progress, Grid, RingProgress, ActionIcon, ScrollArea } from '@mantine/core';
import { IconUsers, IconAlertTriangle, IconTarget, IconShield, IconActivity, IconChevronDown, IconChevronUp } from '@tabler/icons-react';

interface C2DashboardProps {
    contacts: number;
    onClose: () => void;
}

export function C2Dashboard({ contacts, onClose }: C2DashboardProps) {
    const [expanded, setExpanded] = useState(true);
    const [friendlyForces, setFriendlyForces] = useState(0);
    const [hostileForces, setHostileForces] = useState(0);
    const [unknownForces, setUnknownForces] = useState(0);
    const [readinessLevel, setReadinessLevel] = useState(85);
    const [position, setPosition] = useState({ x: 70, y: 88 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Simulate force categorization
        setFriendlyForces(Math.floor(contacts * 0.7));
        setHostileForces(Math.floor(contacts * 0.2));
        setUnknownForces(Math.floor(contacts * 0.1));
    }, [contacts]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y,
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    return (
        <Paper
            shadow="xl"
            className="tactical-card"
            onMouseDown={handleMouseDown}
            style={{
                position: 'fixed',
                top: `${position.y}px`,
                left: `${position.x}px`,
                zIndex: isDragging ? 10000 : 999,
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                backgroundColor: 'rgba(10, 14, 20, 0.95)',
                border: '1px solid rgba(100, 255, 218, 0.4)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 30px rgba(100, 255, 218, 0.2)',
                width: expanded ? '400px' : '280px',
                transition: 'width 0.3s ease',
            }}
        >
            <Stack gap="md" p="md">
                <Group justify="space-between">
                    <Group gap="xs">
                        <IconActivity size={20} color="#64ffda" className="status-active" />
                        <Text size="sm" fw={700} className="text-glow-cyan" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                            C2 Dashboard
                        </Text>
                    </Group>
                    <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </ActionIcon>
                </Group>

                <Divider color="rgba(100, 255, 218, 0.3)" />

                {/* Force Status */}
                <Stack gap="xs">
                    <Text size="xs" fw={600} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Force Status
                    </Text>
                    <Grid gutter="xs">
                        <Grid.Col span={4}>
                            <Stack gap={4} align="center">
                                <RingProgress
                                    size={60}
                                    thickness={6}
                                    sections={[{ value: 100, color: 'tacticalGreen' }]}
                                    label={
                                        <Text size="xs" fw={700} style={{ textAlign: 'center', color: '#00e38a' }}>
                                            {friendlyForces}
                                        </Text>
                                    }
                                />
                                <Text size="xs" c="tacticalGreen" fw={500}>FRIENDLY</Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Stack gap={4} align="center">
                                <RingProgress
                                    size={60}
                                    thickness={6}
                                    sections={[{ value: 100, color: 'tacticalRed' }]}
                                    label={
                                        <Text size="xs" fw={700} style={{ textAlign: 'center', color: '#ff4747' }}>
                                            {hostileForces}
                                        </Text>
                                    }
                                />
                                <Text size="xs" c="tacticalRed" fw={500}>HOSTILE</Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Stack gap={4} align="center">
                                <RingProgress
                                    size={60}
                                    thickness={6}
                                    sections={[{ value: 100, color: 'tacticalOrange' }]}
                                    label={
                                        <Text size="xs" fw={700} style={{ textAlign: 'center', color: '#ff9721' }}>
                                            {unknownForces}
                                        </Text>
                                    }
                                />
                                <Text size="xs" c="tacticalOrange" fw={500}>UNKNOWN</Text>
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Stack>

                <Divider color="rgba(100, 255, 218, 0.2)" />

                {/* Readiness Level */}
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text size="xs" fw={600} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Readiness
                        </Text>
                        <Badge size="sm" color={readinessLevel > 75 ? 'tacticalGreen' : readinessLevel > 50 ? 'tacticalOrange' : 'tacticalRed'}>
                            {readinessLevel}%
                        </Badge>
                    </Group>
                    <Progress
                        value={readinessLevel}
                        size="md"
                        radius="xs"
                        color={readinessLevel > 75 ? 'tacticalGreen' : readinessLevel > 50 ? 'tacticalOrange' : 'tacticalRed'}
                        styles={{
                            root: {
                                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                border: '1px solid rgba(100, 255, 218, 0.2)',
                            },
                        }}
                    />
                </Stack>

                {expanded && (
                    <>
                        <Divider color="rgba(100, 255, 218, 0.2)" />

                        {/* Active Operations */}
                        <Stack gap="xs">
                            <Text size="xs" fw={600} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Active Operations
                            </Text>
                            <ScrollArea h={120} type="auto">
                                <Stack gap="xs">
                                    <Paper p="xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(100, 255, 218, 0.2)' }}>
                                        <Group justify="space-between">
                                            <Text size="xs" fw={600} c="tacticalCyan">OP THUNDER</Text>
                                            <Badge size="xs" color="tacticalGreen">Active</Badge>
                                        </Group>
                                        <Text size="xs" c="dimmed" mt={4}>Patrol Sector Alpha</Text>
                                    </Paper>
                                    <Paper p="xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(100, 255, 218, 0.2)' }}>
                                        <Group justify="space-between">
                                            <Text size="xs" fw={600} c="tacticalCyan">OP GUARDIAN</Text>
                                            <Badge size="xs" color="tacticalOrange">Pending</Badge>
                                        </Group>
                                        <Text size="xs" c="dimmed" mt={4}>Recon Mission Bravo</Text>
                                    </Paper>
                                    <Paper p="xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(100, 255, 218, 0.2)' }}>
                                        <Group justify="space-between">
                                            <Text size="xs" fw={600} c="tacticalCyan">OP SENTINEL</Text>
                                            <Badge size="xs" color="tacticalGreen">Active</Badge>
                                        </Group>
                                        <Text size="xs" c="dimmed" mt={4}>Defense Position Charlie</Text>
                                    </Paper>
                                </Stack>
                            </ScrollArea>
                        </Stack>

                        <Divider color="rgba(100, 255, 218, 0.2)" />

                        {/* Alerts */}
                        <Stack gap="xs">
                            <Group justify="space-between">
                                <Text size="xs" fw={600} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Recent Alerts
                                </Text>
                                <Badge size="xs" color="tacticalRed" className="status-active">
                                    2 New
                                </Badge>
                            </Group>
                            <Stack gap={4}>
                                <Group gap="xs">
                                    <IconAlertTriangle size={14} color="#ff4747" />
                                    <Text size="xs" c="tacticalRed">Contact report - Grid 18T WM 12345</Text>
                                </Group>
                                <Group gap="xs">
                                    <IconAlertTriangle size={14} color="#ff9721" />
                                    <Text size="xs" c="tacticalOrange">CASEVAC requested - Sector Bravo</Text>
                                </Group>
                            </Stack>
                        </Stack>
                    </>
                )}
            </Stack>
        </Paper>
    );
}
