import React from 'react';
import { Paper, Text, Stack, Group, Badge, SegmentedControl } from '@mantine/core';
import { IconWorldLatitude, IconWorldLongitude, IconCompass } from '@tabler/icons-react';

interface CoordinateDisplayProps {
    lat: number;
    lng: number;
    format: 'DD' | 'DMS' | 'MGRS';
    onFormatChange: (format: 'DD' | 'DMS' | 'MGRS') => void;
}

export function CoordinateDisplay({ lat, lng, format, onFormatChange }: CoordinateDisplayProps) {
    const formatCoordinate = () => {
        if (format === 'DD') {
            return {
                lat: `${lat.toFixed(6)}°`,
                lng: `${lng.toFixed(6)}°`,
            };
        } else if (format === 'DMS') {
            const latDMS = convertToDMS(lat, 'lat');
            const lngDMS = convertToDMS(lng, 'lng');
            return { lat: latDMS, lng: lngDMS };
        } else {
            // MGRS - simplified, would need full implementation
            return {
                lat: '18T WM 12345',
                lng: '67890',
            };
        }
    };

    const convertToDMS = (decimal: number, type: 'lat' | 'lng') => {
        const absolute = Math.abs(decimal);
        const degrees = Math.floor(absolute);
        const minutesFloat = (absolute - degrees) * 60;
        const minutes = Math.floor(minutesFloat);
        const seconds = ((minutesFloat - minutes) * 60).toFixed(2);
        
        const direction = type === 'lat' 
            ? (decimal >= 0 ? 'N' : 'S')
            : (decimal >= 0 ? 'E' : 'W');
            
        return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
    };

    const coords = formatCoordinate();

    return (
        <Paper
            shadow="xl"
            p="xs"
            className="tactical-card"
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                backgroundColor: 'rgba(10, 14, 20, 0.95)',
                border: '1px solid rgba(100, 255, 218, 0.4)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 30px rgba(100, 255, 218, 0.2)',
                minWidth: '400px',
            }}
        >
            <Stack gap="xs">
                <Group justify="space-between">
                    <Group gap="xs">
                        <IconWorldLatitude size={16} color="#64ffda" />
                        <Text size="xs" fw={600} c="tacticalCyan" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {coords.lat}
                        </Text>
                    </Group>
                    <Group gap="xs">
                        <IconWorldLongitude size={16} color="#64ffda" />
                        <Text size="xs" fw={600} c="tacticalCyan" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {coords.lng}
                        </Text>
                    </Group>
                </Group>
                <SegmentedControl
                    size="xs"
                    value={format}
                    onChange={(value) => onFormatChange(value as 'DD' | 'DMS' | 'MGRS')}
                    data={[
                        { label: 'DD', value: 'DD' },
                        { label: 'DMS', value: 'DMS' },
                        { label: 'MGRS', value: 'MGRS' },
                    ]}
                    color="tacticalCyan"
                    styles={{
                        root: {
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        },
                        label: {
                            color: '#e8eaed',
                            fontSize: '0.65rem',
                            padding: '2px 8px',
                        },
                    }}
                />
            </Stack>
        </Paper>
    );
}
