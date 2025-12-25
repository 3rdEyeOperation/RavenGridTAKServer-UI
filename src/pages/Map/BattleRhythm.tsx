import React, { useState } from 'react';
import { Paper, Stack, Text, Group, Timeline, Badge, Divider, ActionIcon, ScrollArea } from '@mantine/core';
import { IconClock, IconCheck, IconAlertTriangle, IconFlag, IconChevronDown, IconChevronUp } from '@tabler/icons-react';

interface BattleRhythmProps {
    onClose: () => void;
}

interface Event {
    time: string;
    title: string;
    description: string;
    type: 'briefing' | 'report' | 'operation' | 'alert';
    completed: boolean;
}

export function BattleRhythm({ onClose }: BattleRhythmProps) {
    const [expanded, setExpanded] = useState(true);
    
    const events: Event[] = [
        { time: '06:00', title: 'Morning Briefing', description: 'Operational update and intel review', type: 'briefing', completed: true },
        { time: '08:00', title: 'Patrol Deployment', description: 'Team Alpha deployed to Sector North', type: 'operation', completed: true },
        { time: '12:00', title: 'SITREP Due', description: 'Situation Report from all units', type: 'report', completed: true },
        { time: '14:00', title: 'Current Time', description: 'Real-time operations ongoing', type: 'alert', completed: false },
        { time: '16:00', title: 'Intel Brief', description: 'Updated threat assessment', type: 'briefing', completed: false },
        { time: '18:00', title: 'Evening SITREP', description: 'End of day situation report', type: 'report', completed: false },
        { time: '20:00', title: 'Night Ops Begin', description: 'Transition to night operations', type: 'operation', completed: false },
        { time: '00:00', title: 'Midnight Brief', description: 'Night shift operational update', type: 'briefing', completed: false },
    ];

    const getEventIcon = (type: string, completed: boolean) => {
        if (completed) return <IconCheck size={16} />;
        switch (type) {
            case 'briefing': return <IconFlag size={16} />;
            case 'report': return <IconClock size={16} />;
            case 'operation': return <IconFlag size={16} />;
            case 'alert': return <IconAlertTriangle size={16} />;
            default: return <IconClock size={16} />;
        }
    };

    const getEventColor = (type: string, completed: boolean) => {
        if (completed) return 'tacticalGreen';
        if (type === 'alert') return 'tacticalRed';
        return 'tacticalCyan';
    };

    return (
        <Paper
            shadow="xl"
            p="md"
            className="tactical-card"
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '350px',
                zIndex: 1001,
                backgroundColor: 'rgba(10, 14, 20, 0.95)',
                border: '1px solid rgba(100, 255, 218, 0.4)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 30px rgba(100, 255, 218, 0.2)',
                width: '350px',
                maxHeight: expanded ? '500px' : '100px',
                transition: 'max-height 0.3s ease',
            }}
        >
            <Stack gap="md">
                <Group justify="space-between">
                    <Group gap="xs">
                        <IconClock size={20} color="#64ffda" />
                        <Text size="sm" fw={700} className="text-glow-cyan" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Battle Rhythm
                        </Text>
                    </Group>
                    <Group gap="xs">
                        <Badge size="sm" color="tacticalCyan" variant="light">
                            {new Date().toLocaleTimeString()}
                        </Badge>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
                        </ActionIcon>
                    </Group>
                </Group>

                {expanded && (
                    <>
                        <Divider color="rgba(100, 255, 218, 0.3)" />

                        <ScrollArea h={380} type="auto">
                            <Timeline
                                active={3}
                                bulletSize={24}
                                lineWidth={2}
                                color="tacticalCyan"
                                styles={{
                                    item: {
                                        marginBottom: '1rem',
                                    },
                                    itemBullet: {
                                        backgroundColor: 'rgba(10, 14, 20, 0.9)',
                                        border: '2px solid #64ffda',
                                    },
                                }}
                            >
                                {events.map((event, index) => (
                                    <Timeline.Item
                                        key={index}
                                        bullet={getEventIcon(event.type, event.completed)}
                                        color={getEventColor(event.type, event.completed)}
                                        title={
                                            <Group gap="xs">
                                                <Text size="xs" fw={700} c={getEventColor(event.type, event.completed)}>
                                                    {event.time}
                                                </Text>
                                                <Text size="xs" fw={600}>
                                                    {event.title}
                                                </Text>
                                            </Group>
                                        }
                                    >
                                        <Text size="xs" c="dimmed" mt={4}>
                                            {event.description}
                                        </Text>
                                        <Badge
                                            size="xs"
                                            color={event.completed ? 'tacticalGreen' : 'tacticalOrange'}
                                            variant="light"
                                            mt={4}
                                        >
                                            {event.completed ? 'Completed' : 'Pending'}
                                        </Badge>
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        </ScrollArea>
                    </>
                )}
            </Stack>
        </Paper>
    );
}
