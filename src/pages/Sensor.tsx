import { useState, useEffect } from 'react';
import {
    Paper,
    Title,
    Stack,
    Grid,
    Card,
    Text,
    Badge,
    Button,
    Group,
    TextInput,
    Select,
    Switch,
    Divider,
    ActionIcon,
    Tooltip,
    Table,
    Progress,
    Timeline,
    Alert,
} from '@mantine/core';
import {
    IconRadar,
    IconPlug,
    IconPlugOff,
    IconRefresh,
    IconSearch,
    IconSettings,
    IconAlertCircle,
    IconCircleCheck,
    IconCircleX,
    IconActivity,
    IconAntenna,
    IconWifi,
    IconLocation,
    IconClock,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import axios from 'axios';

interface RFSensor {
    id: string;
    name: string;
    type: 'rf_scanner';
    status: 'online' | 'offline' | 'error';
    lastSeen: string;
    frequency_mhz?: number;
    power_dbm?: number;
    bandwidth_khz?: number;
    snr_db?: number;
    modulation?: string;
    signal_type?: string;
    confidence?: number;
    location?: { lat: number; lon: number; alt?: number };
    node_id?: string;
}

export default function Sensor() {
    const [sensors, setSensors] = useState<RFSensor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchSensors = async () => {
        try {
            // Use existing OpenTAKServer /api/markers endpoint
            const response = await axios.get('/api/markers', {
                params: {
                    per_page: 1000  // Get all markers, we'll filter client-side
                }
            });
            
            if (response.data && response.data.results) {
                // Filter for RF sensor markers (group_name === 'RF_Sensors')
                const rfMarkers = response.data.results
                    .filter((marker: any) => marker.group_name === 'RF_Sensors')
                    .map((marker: any) => ({
                        id: marker.uid,
                        name: marker.callsign || `RF Sensor ${marker.uid.substring(0, 8)}`,
                        type: 'rf_scanner' as const,
                        status: isMarkerOnline(marker.timestamp) ? 'online' as const : 'offline' as const,
                        lastSeen: marker.timestamp,
                        frequency_mhz: marker.detail?.rf_signal?.frequency_mhz,
                        power_dbm: marker.detail?.rf_signal?.power_dbm,
                        bandwidth_khz: marker.detail?.rf_signal?.bandwidth_khz,
                        snr_db: marker.detail?.rf_signal?.snr_db,
                        modulation: marker.detail?.rf_signal?.modulation,
                        signal_type: marker.detail?.rf_signal?.signal_type,
                        confidence: marker.detail?.rf_signal?.confidence,
                        location: marker.point ? {
                            lat: marker.point.latitude,
                            lon: marker.point.longitude,
                            alt: marker.point.hae
                        } : undefined,
                        node_id: marker.detail?.sensor?.node_id
                    }));
                
                setSensors(rfMarkers);
            }
        } catch (error) {
            console.error('Error fetching sensors:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to load RF sensors',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };
    
    const isMarkerOnline = (timestamp: string): boolean => {
        const now = new Date();
        const markerTime = new Date(timestamp);
        const diffMinutes = (now.getTime() - markerTime.getTime()) / (1000 * 60);
        return diffMinutes < 5; // Online if seen within last 5 minutes
    };

    useEffect(() => {
        fetchSensors();
    }, []);

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(() => {
                fetchSensors();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const getSensorIcon = () => IconAntenna;

    const getStatusColor = (status: RFSensor['status']) => {
        switch (status) {
            case 'online':
                return 'tacticalGreen';
            case 'offline':
                return 'gray';
            case 'error':
                return 'tacticalRed';
            default:
                return 'gray';
        }
    };

    const getStatusIcon = (status: RFSensor['status']) => {
        switch (status) {
            case 'online':
                return <IconCircleCheck size={16} />;
            case 'offline':
                return <IconCircleX size={16} />;
            case 'error':
                return <IconAlertCircle size={16} />;
            default:
                return <IconCircleX size={16} />;
        }
    };

    const getSignalStrength = (power_dbm?: number) => {
        if (!power_dbm) return 0;
        // Convert dBm (-100 to -40) to percentage (0-100)
        return Math.max(0, Math.min(100, ((power_dbm + 100) / 60) * 100));
    };

    const getSignalColor = (power_dbm?: number) => {
        const strength = getSignalStrength(power_dbm);
        if (strength > 70) return 'tacticalGreen';
        if (strength > 40) return 'tacticalOrange';
        return 'tacticalRed';
    };

    const filteredSensors = sensors.filter((sensor) => {
        const matchesSearch = sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            sensor.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            sensor.signal_type?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || sensor.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const onlineSensors = sensors.filter(s => s.status === 'online').length;
    const offlineSensors = sensors.filter(s => s.status === 'offline').length;
    const errorSensors = sensors.filter(s => s.status === 'error').length;

    const handleRefresh = () => {
        notifications.show({
            title: 'Refreshing Sensors',
            message: 'Scanning for available RF sensors...',
            color: 'tacticalCyan',
            autoClose: 2000,
        });
        fetchSensors();
    };

    return (
        <Stack gap="md">
            <Paper shadow="md" p="md" className="tactical-card">
                <Group justify="space-between" mb="md">
                    <Group>
                        <IconRadar size={32} className="text-glow-cyan" />
                        <Title order={2} className="text-glow-cyan">
                            RF Sensor Management
                        </Title>
                    </Group>
                    <Group>
                        <Badge
                            size="lg"
                            variant="light"
                            color="tacticalGreen"
                            leftSection={<IconCircleCheck size={14} />}
                        >
                            {onlineSensors} Online
                        </Badge>
                        <Badge
                            size="lg"
                            variant="light"
                            color="gray"
                            leftSection={<IconCircleX size={14} />}
                        >
                            {offlineSensors} Offline
                        </Badge>
                        {errorSensors > 0 && (
                            <Badge
                                size="lg"
                                variant="light"
                                color="tacticalRed"
                                leftSection={<IconAlertCircle size={14} />}
                            >
                                {errorSensors} Error
                            </Badge>
                        )}
                    </Group>
                </Group>

                <Grid gutter="md" mb="md">
                    <Grid.Col span={6}>
                        <TextInput
                            placeholder="Search sensors by name, ID, or signal type..."
                            leftSection={<IconSearch size={16} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.currentTarget.value)}
                            styles={{
                                input: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                    borderColor: 'rgba(100, 255, 218, 0.3)',
                                    color: '#e8eaed',
                                },
                            }}
                        />
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Select
                            placeholder="Filter by status"
                            value={filterStatus}
                            onChange={(value) => setFilterStatus(value || 'all')}
                            data={[
                                { value: 'all', label: 'All Sensors' },
                                { value: 'online', label: 'Online' },
                                { value: 'offline', label: 'Offline' },
                                { value: 'error', label: 'Error' },
                            ]}
                            styles={{
                                input: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                    borderColor: 'rgba(100, 255, 218, 0.3)',
                                    color: '#e8eaed',
                                },
                            }}
                        />
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Group gap="xs" justify="flex-end">
                            <Switch
                                label="Auto-refresh"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.currentTarget.checked)}
                                color="tacticalCyan"
                                size="sm"
                            />
                            <Tooltip label="Refresh Sensors">
                                <ActionIcon
                                    size="lg"
                                    variant="light"
                                    color="tacticalCyan"
                                    onClick={handleRefresh}
                                >
                                    <IconRefresh size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Grid.Col>
                </Grid>
            </Paper>

            <Alert
                icon={<IconAlertCircle size={16} />}
                title="RF Sensor Integration"
                color="tacticalBlue"
                variant="light"
            >
                Monitor RF spectrum activity from RavenGridSensor devices. Real-time detection and classification of RF signals across VLF to mmWave frequencies.
            </Alert>

            <Grid gutter="md">
                {filteredSensors.map((sensor) => {
                    const SensorIcon = getSensorIcon();
                    const signalStrength = getSignalStrength(sensor.power_dbm);
                    const signalColor = getSignalColor(sensor.power_dbm);
                    
                    return (
                        <Grid.Col key={sensor.id} span={4}>
                            <Card
                                shadow="sm"
                                padding="md"
                                className="tactical-card"
                                style={{
                                    borderColor: sensor.status === 'online' 
                                        ? 'rgba(100, 255, 218, 0.4)' 
                                        : 'rgba(136, 136, 136, 0.3)',
                                }}
                            >
                                <Group justify="space-between" mb="xs">
                                    <Badge
                                        size="sm"
                                        variant="light"
                                        color={getStatusColor(sensor.status)}
                                        leftSection={getStatusIcon(sensor.status)}
                                        className={sensor.status === 'online' ? 'status-online' : ''}
                                    >
                                        {sensor.status.toUpperCase()}
                                    </Badge>
                                    <SensorIcon size={24} className="text-glow-cyan" />
                                </Group>

                                <Text size="lg" fw={700} className="text-glow-cyan" mb="xs">
                                    {sensor.name}
                                </Text>
                                <Text size="xs" c="dimmed" mb="md">
                                    {sensor.node_id || sensor.id}
                                </Text>

                                <Stack gap="xs" mb="md">
                                    {sensor.frequency_mhz && (
                                        <Group justify="space-between">
                                            <Text size="sm" c="dimmed">Frequency:</Text>
                                            <Text size="sm" fw={600} className="text-glow-cyan">
                                                {sensor.frequency_mhz.toFixed(3)} MHz
                                            </Text>
                                        </Group>
                                    )}
                                    {sensor.signal_type && (
                                        <Group justify="space-between">
                                            <Text size="sm" c="dimmed">Signal Type:</Text>
                                            <Text size="sm" fw={600} style={{ maxWidth: '60%', textAlign: 'right' }}>
                                                {sensor.signal_type}
                                            </Text>
                                        </Group>
                                    )}
                                    {sensor.modulation && (
                                        <Group justify="space-between">
                                            <Text size="sm" c="dimmed">Modulation:</Text>
                                            <Text size="sm">{sensor.modulation}</Text>
                                        </Group>
                                    )}
                                    {sensor.power_dbm !== undefined && (
                                        <Stack gap={4}>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">Signal Strength:</Text>
                                                <Text size="sm" fw={600}>{sensor.power_dbm.toFixed(1)} dBm</Text>
                                            </Group>
                                            <Progress
                                                value={signalStrength}
                                                color={signalColor}
                                                size="sm"
                                            />
                                        </Stack>
                                    )}
                                    {sensor.snr_db !== undefined && (
                                        <Group justify="space-between">
                                            <Text size="sm" c="dimmed">SNR:</Text>
                                            <Text size="sm">{sensor.snr_db.toFixed(1)} dB</Text>
                                        </Group>
                                    )}
                                    {sensor.bandwidth_khz && (
                                        <Group justify="space-between">
                                            <Text size="sm" c="dimmed">Bandwidth:</Text>
                                            <Text size="sm">{sensor.bandwidth_khz.toFixed(1)} kHz</Text>
                                        </Group>
                                    )}
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Last Seen:</Text>
                                        <Text size="sm">{new Date(sensor.lastSeen).toLocaleString()}</Text>
                                    </Group>
                                </Stack>

                                <Divider mb="md" color="rgba(100, 255, 218, 0.2)" />

                                <Group gap="xs" justify="space-between">
                                    <Tooltip label="View on Map">
                                        <ActionIcon
                                            size="lg"
                                            variant="light"
                                            color="tacticalBlue"
                                            component="a"
                                            href={`/map?lat=${sensor.location?.lat}&lng=${sensor.location?.lon}`}
                                        >
                                            <IconLocation size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Signal Details">
                                        <ActionIcon
                                            size="lg"
                                            variant="light"
                                            color="tacticalCyan"
                                        >
                                            <IconActivity size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Sensor Settings">
                                        <ActionIcon
                                            size="lg"
                                            variant="light"
                                            color="tacticalPurple"
                                        >
                                            <IconSettings size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Card>
                        </Grid.Col>
                    );
                })}
            </Grid>

            {filteredSensors.length === 0 && !loading && (
                <Paper shadow="md" p="xl" className="tactical-card" ta="center">
                    <IconRadar size={48} className="text-glow-cyan" style={{ opacity: 0.5 }} />
                    <Text size="lg" c="dimmed" mt="md">
                        {searchQuery || filterStatus !== 'all'
                            ? 'No RF sensors found matching your criteria'
                            : 'No RF sensors detected. Send test signal from RavenGridSensor to begin.'}
                    </Text>
                    {!searchQuery && filterStatus === 'all' && (
                        <Text size="sm" c="dimmed" mt="xs">
                            Ensure RavenGridSensor is connected and publishing to RabbitMQ.
                        </Text>
                    )}
                </Paper>
            )}

            {loading && (
                <Paper shadow="md" p="xl" className="tactical-card" ta="center">
                    <Text size="lg" c="dimmed">
                        Loading RF sensors...
                    </Text>
                </Paper>
            )}
        </Stack>
    );
}
