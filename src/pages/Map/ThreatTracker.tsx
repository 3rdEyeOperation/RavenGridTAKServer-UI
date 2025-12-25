import React, { useState } from 'react';
import { Paper, Stack, Text, Group, Badge, Divider, ScrollArea, ActionIcon, Table, Select } from '@mantine/core';
import { IconShield, IconTarget, IconAlertCircle, IconChevronRight } from '@tabler/icons-react';

interface ThreatTrackerProps {
    onClose: () => void;
}

interface Threat {
    id: string;
    type: string;
    location: string;
    severity: 'high' | 'medium' | 'low';
    time: string;
    status: 'active' | 'monitoring' | 'neutralized';
}

export function ThreatTracker({ onClose }: ThreatTrackerProps) {
    const [filterLevel, setFilterLevel] = useState<string | null>('all');
    
    const threats: Threat[] = [
        { id: 'TH-001', type: 'Small Arms Fire', location: '18T WM 12345', severity: 'high', time: '14:23', status: 'active' },
        { id: 'TH-002', type: 'IED Suspected', location: '18T WM 45678', severity: 'high', time: '14:15', status: 'monitoring' },
        { id: 'TH-003', type: 'UAV Detected', location: '18T WM 78901', severity: 'medium', time: '14:10', status: 'monitoring' },
        { id: 'TH-004', type: 'Hostile Vehicle', location: '18T WM 23456', severity: 'medium', time: '13:55', status: 'monitoring' },
        { id: 'TH-005', type: 'Small Arms Fire', location: '18T WM 67890', severity: 'low', time: '13:40', status: 'neutralized' },
    ];

    const filteredThreats = filterLevel === 'all' 
        ? threats 
        : threats.filter(t => t.severity === filterLevel);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'tacticalRed';
            case 'medium': return 'tacticalOrange';
            case 'low': return 'tacticalGreen';
            default: return 'gray';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'tacticalRed';
            case 'monitoring': return 'tacticalOrange';
            case 'neutralized': return 'tacticalGreen';
            default: return 'gray';
        }
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
                border: '1px solid rgba(255, 71, 71, 0.4)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 30px rgba(255, 71, 71, 0.2)',
                width: '500px',
                maxHeight: '80vh',
            }}
        >
            <Stack gap="md">
                <Group justify="space-between">
                    <Group gap="xs">
                        <IconAlertCircle size={20} color="#ff4747" className="status-active" />
                        <Text size="sm" fw={700} style={{ color: '#ff4747', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Threat Tracker
                        </Text>
                    </Group>
                    <Badge size="lg" color="tacticalRed" className="status-active">
                        {threats.filter(t => t.status === 'active').length} Active
                    </Badge>
                </Group>

                <Divider color="rgba(255, 71, 71, 0.3)" />

                <Select
                    size="xs"
                    value={filterLevel}
                    onChange={setFilterLevel}
                    data={[
                        { value: 'all', label: 'All Threats' },
                        { value: 'high', label: 'High Priority' },
                        { value: 'medium', label: 'Medium Priority' },
                        { value: 'low', label: 'Low Priority' },
                    ]}
                    styles={{
                        input: {
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 71, 71, 0.3)',
                            color: '#e8eaed',
                        },
                    }}
                />

                <ScrollArea h={400} type="auto">
                    <Table
                        style={{
                            border: '1px solid rgba(255, 71, 71, 0.2)',
                        }}
                        styles={{
                            th: {
                                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                color: '#ff4747',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                borderBottom: '1px solid rgba(255, 71, 71, 0.3)',
                            },
                            td: {
                                color: '#e8eaed',
                                fontSize: '0.75rem',
                                borderBottom: '1px solid rgba(255, 71, 71, 0.1)',
                            },
                        }}
                    >
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>ID</Table.Th>
                                <Table.Th>Type</Table.Th>
                                <Table.Th>Location</Table.Th>
                                <Table.Th>Severity</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Time</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredThreats.map((threat) => (
                                <Table.Tr
                                    key={threat.id}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 71, 71, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <Table.Td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#ff4747' }}>
                                        {threat.id}
                                    </Table.Td>
                                    <Table.Td>{threat.type}</Table.Td>
                                    <Table.Td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>
                                        {threat.location}
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge size="xs" color={getSeverityColor(threat.severity)} variant="filled">
                                            {threat.severity.toUpperCase()}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            size="xs"
                                            color={getStatusColor(threat.status)}
                                            variant="light"
                                            className={threat.status === 'active' ? 'status-active' : ''}
                                        >
                                            {threat.status.toUpperCase()}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                        {threat.time}
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>

                <Divider color="rgba(255, 71, 71, 0.3)" />

                <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                        Last updated: {new Date().toLocaleTimeString()}
                    </Text>
                    <ActionIcon size="sm" variant="light" color="tacticalRed">
                        <IconChevronRight size={14} />
                    </ActionIcon>
                </Group>
            </Stack>
        </Paper>
    );
}
