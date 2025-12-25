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
    IconSensor,
    IconPlug,
    IconPlugOff,
    IconRefresh,
    IconSearch,
    IconSettings,
    IconAlertCircle,
    IconCircleCheck,
    IconCircleX,
    IconActivity,
    IconTemperature,
    IconDroplet,
    IconWind,
    IconGauge,
    IconLocation,
    IconClock,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface Sensor {
    id: string;
    name: string;
    type: 'temperature' | 'humidity' | 'motion' | 'pressure' | 'location' | 'environmental';
    status: 'online' | 'offline' | 'error';
    lastSeen: string;
    value: string | number;
    unit: string;
    battery?: number;
    location?: { lat: number; lng: number };
}

export default function Sensor() {
    const [sensors, setSensors] = useState<Sensor[]>([
        {
            id: 'SEN-001',
            name: 'Perimeter Sensor Alpha',
            type: 'motion',
            status: 'online',
            lastSeen: '2 min ago',
            value: 'Active',
            unit: '',
            battery: 87,
        },
        {
            id: 'SEN-002',
            name: 'Weather Station Bravo',
            type: 'environmental',
            status: 'online',
            lastSeen: '1 min ago',
            value: 24.5,
            unit: '°C',
            battery: 92,
        },
        {
            id: 'SEN-003',
            name: 'Pressure Sensor Charlie',
            type: 'pressure',
            status: 'offline',
            lastSeen: '15 min ago',
            value: 1013,
            unit: 'hPa',
            battery: 45,
        },
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [autoRefresh, setAutoRefresh] = useState(true);

    const getSensorIcon = (type: Sensor['type']) => {
        switch (type) {
            case 'temperature':
                return IconTemperature;
            case 'humidity':
                return IconDroplet;
            case 'motion':
                return IconActivity;
            case 'pressure':
                return IconGauge;
            case 'location':
                return IconLocation;
            case 'environmental':
                return IconWind;
            default:
                return IconSensor;
        }
    };

    const getStatusColor = (status: Sensor['status']) => {
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

    const getStatusIcon = (status: Sensor['status']) => {
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

    const filteredSensors = sensors.filter((sensor) => {
        const matchesSearch = sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            sensor.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || sensor.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const onlineSensors = sensors.filter(s => s.status === 'online').length;
    const offlineSensors = sensors.filter(s => s.status === 'offline').length;
    const errorSensors = sensors.filter(s => s.status === 'error').length;

    const handleRefresh = () => {
        notifications.show({
            title: 'Refreshing Sensors',
            message: 'Scanning for available sensors...',
            color: 'tacticalCyan',
            autoClose: 2000,
        });
        // TODO: Implement actual sensor refresh
    };

    const handleConnect = (sensorId: string) => {
        notifications.show({
            title: 'Connecting',
            message: `Establishing connection to ${sensorId}...`,
            color: 'tacticalBlue',
            autoClose: 2000,
        });
        // TODO: Implement actual sensor connection
    };

    const handleDisconnect = (sensorId: string) => {
        notifications.show({
            title: 'Disconnecting',
            message: `Disconnecting from ${sensorId}...`,
            color: 'tacticalOrange',
            autoClose: 2000,
        });
        // TODO: Implement actual sensor disconnection
    };

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(() => {
                // TODO: Implement auto-refresh logic
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    return (
        <Stack gap="md">
            <Paper shadow="md" p="md" className="tactical-card">
                <Group justify="space-between" mb="md">
                    <Group>
                        <IconSensor size={32} className="text-glow-cyan" />
                        <Title order={2} className="text-glow-cyan">
                            Sensor Management
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
                            placeholder="Search sensors..."
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
                title="Sensor Integration"
                color="tacticalBlue"
                variant="light"
            >
                Connect and monitor various sensors in real-time. Configure sensor parameters, view telemetry data, and receive alerts when thresholds are exceeded.
            </Alert>

            <Grid gutter="md">
                {filteredSensors.map((sensor) => {
                    const SensorIcon = getSensorIcon(sensor.type);
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
                                    ID: {sensor.id}
                                </Text>

                                <Stack gap="xs" mb="md">
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Current Value:</Text>
                                        <Text size="sm" fw={600}>
                                            {sensor.value} {sensor.unit}
                                        </Text>
                                    </Group>
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Last Seen:</Text>
                                        <Text size="sm">{sensor.lastSeen}</Text>
                                    </Group>
                                    {sensor.battery !== undefined && (
                                        <Stack gap={4}>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">Battery:</Text>
                                                <Text size="sm" fw={600}>{sensor.battery}%</Text>
                                            </Group>
                                            <Progress
                                                value={sensor.battery}
                                                color={
                                                    sensor.battery > 50 
                                                        ? 'tacticalGreen' 
                                                        : sensor.battery > 20 
                                                        ? 'tacticalOrange' 
                                                        : 'tacticalRed'
                                                }
                                                size="sm"
                                            />
                                        </Stack>
                                    )}
                                </Stack>

                                <Divider mb="md" color="rgba(100, 255, 218, 0.2)" />

                                <Group gap="xs" justify="space-between">
                                    {sensor.status === 'online' ? (
                                        <Button
                                            variant="light"
                                            color="tacticalRed"
                                            fullWidth
                                            leftSection={<IconPlugOff size={16} />}
                                            onClick={() => handleDisconnect(sensor.id)}
                                        >
                                            Disconnect
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="light"
                                            color="tacticalGreen"
                                            fullWidth
                                            leftSection={<IconPlug size={16} />}
                                            onClick={() => handleConnect(sensor.id)}
                                        >
                                            Connect
                                        </Button>
                                    )}
                                    <Tooltip label="Configure Sensor">
                                        <ActionIcon
                                            size="lg"
                                            variant="light"
                                            color="tacticalBlue"
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

            {filteredSensors.length === 0 && (
                <Paper shadow="md" p="xl" className="tactical-card" ta="center">
                    <Text size="lg" c="dimmed">
                        No sensors found matching your criteria
                    </Text>
                </Paper>
            )}
        </Stack>
    );
}
