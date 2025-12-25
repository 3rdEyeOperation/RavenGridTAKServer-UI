import React, { useState } from 'react';
import { Paper, Stack, Text, Button, TextInput, Textarea, Select, Group, Divider, Badge } from '@mantine/core';
import { IconSend, IconFlag, IconUsers, IconClock } from '@tabler/icons-react';

interface MissionPlanningProps {
    onClose: () => void;
    onSendMission: (mission: any) => void;
}

export function MissionPlanning({ onClose, onSendMission }: MissionPlanningProps) {
    const [missionName, setMissionName] = useState('');
    const [missionType, setMissionType] = useState<string | null>('patrol');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<string | null>('routine');

    const handleSend = () => {
        const mission = {
            name: missionName,
            type: missionType,
            description,
            priority,
            timestamp: new Date().toISOString(),
        };
        onSendMission(mission);
    };

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
                width: '350px',
                maxHeight: '80vh',
                overflowY: 'auto',
            }}
        >
            <Stack gap="md">
                <Text size="sm" fw={700} className="text-glow-cyan" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Mission Planning
                </Text>

                <Divider color="rgba(100, 255, 218, 0.3)" />

                <TextInput
                    label="Mission Name"
                    placeholder="Enter mission name"
                    value={missionName}
                    onChange={(e) => setMissionName(e.currentTarget.value)}
                    styles={{
                        label: { color: '#64ffda', fontSize: '0.75rem', fontWeight: 600 },
                        input: {
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(100, 255, 218, 0.3)',
                            color: '#e8eaed',
                        },
                    }}
                />

                <Select
                    label="Mission Type"
                    placeholder="Select type"
                    value={missionType}
                    onChange={setPriority}
                    data={[
                        { value: 'patrol', label: 'Patrol' },
                        { value: 'recon', label: 'Reconnaissance' },
                        { value: 'assault', label: 'Assault' },
                        { value: 'defense', label: 'Defense' },
                        { value: 'casevac', label: 'CASEVAC' },
                        { value: 'resupply', label: 'Resupply' },
                    ]}
                    styles={{
                        label: { color: '#64ffda', fontSize: '0.75rem', fontWeight: 600 },
                        input: {
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(100, 255, 218, 0.3)',
                            color: '#e8eaed',
                        },
                    }}
                />

                <Select
                    label="Priority"
                    placeholder="Select priority"
                    value={priority}
                    onChange={setPriority}
                    data={[
                        { value: 'routine', label: 'Routine' },
                        { value: 'priority', label: 'Priority' },
                        { value: 'immediate', label: 'Immediate' },
                        { value: 'flash', label: 'Flash' },
                    ]}
                    styles={{
                        label: { color: '#64ffda', fontSize: '0.75rem', fontWeight: 600 },
                        input: {
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(100, 255, 218, 0.3)',
                            color: '#e8eaed',
                        },
                    }}
                />

                <Textarea
                    label="Description"
                    placeholder="Enter mission details"
                    value={description}
                    onChange={(e) => setDescription(e.currentTarget.value)}
                    minRows={4}
                    styles={{
                        label: { color: '#64ffda', fontSize: '0.75rem', fontWeight: 600 },
                        input: {
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(100, 255, 218, 0.3)',
                            color: '#e8eaed',
                        },
                    }}
                />

                <Divider color="rgba(100, 255, 218, 0.3)" />

                <Group gap="xs">
                    <Badge leftSection={<IconClock size={12} />} color="tacticalCyan" variant="light">
                        {new Date().toLocaleTimeString()}
                    </Badge>
                    <Badge leftSection={<IconUsers size={12} />} color="tacticalGreen" variant="light">
                        Team Alpha
                    </Badge>
                </Group>

                <Group grow>
                    <Button
                        variant="light"
                        color="tacticalRed"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="filled"
                        color="tacticalGreen"
                        leftSection={<IconSend size={16} />}
                        onClick={handleSend}
                    >
                        Send CoT
                    </Button>
                </Group>
            </Stack>
        </Paper>
    );
}
