import React, { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import {Text, Center, Title, Divider, Paper, Flex, Switch, Space, ScrollArea, Badge, Grid, Group, RingProgress, ThemeIcon} from '@mantine/core';
import { IconCheck, IconX, IconAlertTriangle, IconCircleCheck, IconUsers, IconServer, IconRouter } from '@tabler/icons-react';
import { DonutChart } from '@mantine/charts';
import { parseISO, intervalToDuration, formatDuration } from 'date-fns';
import { versions } from '../../_versions';
import axios from '../../axios_config';
import { apiRoutes } from '../../apiRoutes';
import bytes_formatter from '../../bytes_formatter';
import '@mantine/charts/styles.css';
import {t} from "i18next";

export default function Dashboard() {
    const [tcpEnabled, setTcpEnabled] = useState(true);
    const [sslEnabled, setSslEnabled] = useState(true);
    const [uname, setUname] = useState({
        machine: '',
        node: '',
        release: '',
        system: '',
        version: '',
    });
    const [osRelease, setOsRelease] = useState({
        NAME: '',
        PRETTY_NAME: '',
        VERSION: '',
        VERSION_CODENAME: '',
    });
    const [ots, setOts] = useState({
        version: '',
        uptime: 0,
        start_time: '',
        python_version: '',
    });
    const [alerts, setAlerts] = useState({
        cot_router: false,
        tcp: false,
        ssl: false,
        online_euds: 0,
    });
    const [serverStatus, setServerStatus] = useState({
        cpu_percent: 0,
    });
    const [disk, setDisk] = useState({
        free: 0,
        used: 0,
        total: 0,
        percent: 0,
    });
    const [memory, setMemory] = useState({
        available: 0,
        free: 0,
        used: 0,
        total: 0,
        percent: 0,
    });
    const [uptime, setUptime] = useState({
        boot_time: '',
        uptime: 0,
    });

    useEffect(() => {
            axios.get(
                apiRoutes.status
            ).then(r => {
                if (r.status === 200) {
                    setAlerts({
                        cot_router: r.data.cot_router,
                        tcp: r.data.tcp,
                        ssl: r.data.ssl,
                        online_euds: r.data.online_euds,
                    });
                    setServerStatus({ cpu_percent: r.data.cpu_percent });
                    setDisk({
                        free: r.data.disk_usage.free,
                        used: r.data.disk_usage.used,
                        total: r.data.disk_usage.total,
                        percent: r.data.disk_usage.percent,
                    });
                    setMemory({
                        available: r.data.memory.available,
                        free: r.data.memory.free,
                        used: r.data.memory.used,
                        total: r.data.memory.total,
                        percent: r.data.memory.percent,
                    });
                    setOts({
                        version: r.data.ots_version,
                        uptime: r.data.ots_uptime,
                        start_time: parseISO(r.data.ots_start_time).toLocaleString(),
                        python_version: r.data.python_version,
                    });
                    setUptime({
                        uptime: r.data.system_uptime,
                        boot_time: r.data.system_boot_time,
                    });
                    setTcpEnabled(r.data.tcp);
                    setSslEnabled(r.data.ssl);
                    setUname(r.data.uname);
                    setOsRelease(r.data.os_release);
                }
            }).catch(err => {
                console.log(err);
            });
    }, []);

    return (
        <ScrollArea>
            <Center>
                <Title mb="xl" order={2}>{t('Situation Awareness Dashboard')}</Title>
            </Center>

            {/* Service Status Overview */}
            <Center mb="xl">
                <Paper shadow="xl" withBorder radius="md" p="xl" style={{ width: '90%' }}>
                    <Title order={3} mb="md">{t('Service Status')}</Title>
                    <Grid>
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <Paper withBorder p="md" radius="md">
                                <Group>
                                    <ThemeIcon 
                                        size="xl" 
                                        radius="md" 
                                        color={alerts.cot_router ? 'green' : 'red'}
                                    >
                                        {alerts.cot_router ? <IconCircleCheck size={28} /> : <IconX size={28} />}
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" color="dimmed">{t('CoT Router')}</Text>
                                        <Text size="lg" fw={700}>
                                            {alerts.cot_router ? t('Online') : t('Offline')}
                                        </Text>
                                    </div>
                                </Group>
                            </Paper>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <Paper withBorder p="md" radius="md">
                                <Group>
                                    <ThemeIcon 
                                        size="xl" 
                                        radius="md" 
                                        color={alerts.tcp ? 'green' : 'red'}
                                    >
                                        {alerts.tcp ? <IconCircleCheck size={28} /> : <IconX size={28} />}
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" color="dimmed">{t('TCP Service')}</Text>
                                        <Text size="lg" fw={700}>
                                            {alerts.tcp ? t('Running') : t('Stopped')}
                                        </Text>
                                    </div>
                                </Group>
                            </Paper>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <Paper withBorder p="md" radius="md">
                                <Group>
                                    <ThemeIcon 
                                        size="xl" 
                                        radius="md" 
                                        color={alerts.ssl ? 'green' : 'red'}
                                    >
                                        {alerts.ssl ? <IconCircleCheck size={28} /> : <IconX size={28} />}
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" color="dimmed">{t('SSL Service')}</Text>
                                        <Text size="lg" fw={700}>
                                            {alerts.ssl ? t('Running') : t('Stopped')}
                                        </Text>
                                    </div>
                                </Group>
                            </Paper>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <Paper withBorder p="md" radius="md" style={{ backgroundColor: alerts.online_euds > 0 ? 'rgba(64, 192, 87, 0.1)' : 'inherit' }}>
                                <Group>
                                    <ThemeIcon 
                                        size="xl" 
                                        radius="md" 
                                        color={alerts.online_euds > 0 ? 'green' : 'gray'}
                                    >
                                        <IconUsers size={28} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" color="dimmed">{t('Online EUDs')}</Text>
                                        <Text size="xl" fw={700} color={alerts.online_euds > 0 ? 'green' : 'dimmed'}>
                                            {alerts.online_euds}
                                        </Text>
                                    </div>
                                </Group>
                            </Paper>
                        </Grid.Col>
                    </Grid>
                </Paper>
            </Center>

            {/* System Resources */}
            <Center>
                <Title mb="xl" order={2}>{t('System Resources')}</Title>
            </Center>
            <Center mb="xl">
                <Flex direction={{ base: 'column', xs: 'row' }}>
                    <Paper withBorder shadow="xl" radius="md" p="xl" mr="md" mb="md">
                        <Center mb="md"><Title order={4}>{t('CPU Usage')}</Title></Center>
                        <Center>
                            <RingProgress
                                size={180}
                                thickness={16}
                                sections={[
                                    { value: serverStatus.cpu_percent, color: serverStatus.cpu_percent > 80 ? 'red' : serverStatus.cpu_percent > 60 ? 'yellow' : 'blue' }
                                ]}
                                label={
                                    <Center>
                                        <div>
                                            <Text fw={700} size="xl" ta="center">
                                                {serverStatus.cpu_percent.toFixed(1)}%
                                            </Text>
                                            <Text size="xs" ta="center" c="dimmed">
                                                {t('Used')}
                                            </Text>
                                        </div>
                                    </Center>
                                }
                            />
                        </Center>
                    </Paper>
                    <Paper withBorder shadow="xl" radius="md" p="xl" mr="md" mb="md">
                        <Center mb="md"><Title order={4}>{t('Disk Usage')}</Title></Center>
                        <Center>
                            <RingProgress
                                size={180}
                                thickness={16}
                                sections={[
                                    { value: disk.percent, color: disk.percent > 80 ? 'red' : disk.percent > 60 ? 'yellow' : 'blue' }
                                ]}
                                label={
                                    <Center>
                                        <div>
                                            <Text fw={700} size="xl" ta="center">
                                                {disk.percent.toFixed(1)}%
                                            </Text>
                                            <Text size="xs" ta="center" c="dimmed">
                                                {t('Used')}
                                            </Text>
                                        </div>
                                    </Center>
                                }
                            />
                        </Center>
                        <Center><Text fw={500} size="sm" c="dimmed">{t('Total')}: {`${bytes_formatter(disk.total)}`}</Text></Center>
                        <Center><Text fw={500} size="sm" c="dimmed">{t('Used')}: {`${bytes_formatter(disk.used)}`}</Text></Center>
                        <Center><Text fw={500} size="sm" c="green">{t('Free')}: {`${bytes_formatter(disk.free)}`}</Text></Center>
                    </Paper>
                    <Paper withBorder shadow="xl" radius="md" p="xl" mr="md" mb="md">
                        <Center mb="md"><Title order={4}>{t('Memory Usage')}</Title></Center>
                        <Center>
                            <RingProgress
                                size={180}
                                thickness={16}
                                sections={[
                                    { value: memory.percent, color: memory.percent > 80 ? 'red' : memory.percent > 60 ? 'yellow' : 'blue' }
                                ]}
                                label={
                                    <Center>
                                        <div>
                                            <Text fw={700} size="xl" ta="center">
                                                {memory.percent.toFixed(1)}%
                                            </Text>
                                            <Text size="xs" ta="center" c="dimmed">
                                                {t('Used')}
                                            </Text>
                                        </div>
                                    </Center>
                                }
                            />
                        </Center>
                        <Center><Text fw={500} size="sm" c="dimmed">{t('Total')}: {`${bytes_formatter(memory.total)}`}</Text></Center>
                        <Center><Text fw={500} size="sm" c="dimmed">{t('Used')}: {`${bytes_formatter(memory.used)}`}</Text></Center>
                        <Center><Text fw={500} size="sm" c="green">{t('Available')}: {`${bytes_formatter(memory.available)}`}</Text></Center>
                    </Paper>
                    <Paper shadow="xl" withBorder radius="md" p="xl" mr="md" mb="md">
                        <Center mb="md"><Title order={4}>{t('Uptime')}</Title></Center>
                        <Flex direction="column" gap="xs">
                            <div>
                                <Text size="xs" c="dimmed">{t('System Uptime')}</Text>
                                <Text fw={700} size="lg">{formatDuration(intervalToDuration({ start: 0, end: uptime.uptime * 1000 }))}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">{t('Boot Time')}</Text>
                                <Text fw={500}>{parseISO(uptime.boot_time).toLocaleString()}</Text>
                            </div>
                            <Divider my="xs" />
                            <div>
                                <Text size="xs" c="dimmed">{t('Server Uptime')}</Text>
                                <Text fw={700} size="lg" c="green">{formatDuration(intervalToDuration({ start: 0, end: ots.uptime * 1000 }))}</Text>
                            </div>
                        </Flex>
                    </Paper>
                </Flex>
            </Center>
            <Divider my="lg" />
            <Center>
                <Title mb="xl" order={2}>{t('Server Details')}</Title>
            </Center>
            <Center mb="xl">
                <Flex direction={{ base: 'column', xs: 'row' }}>
                    <Paper shadow="xl" withBorder radius="md" p="xl" mr="md" mb="md">
                        <Center mb="md"><Title order={4}>{t('System Info')}</Title></Center>
                        <Flex direction="column" gap="xs">
                            <div>
                                <Text size="xs" c="dimmed">{t('System')}</Text>
                                <Text fw={500}>{uname.system}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">{t('Release')}</Text>
                                <Text fw={500}>{uname.release}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">{t('Architecture')}</Text>
                                <Text fw={500}>{uname.machine}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">{t('Hostname')}</Text>
                                <Text fw={500}>{uname.node}</Text>
                            </div>
                        </Flex>
                    </Paper>
                    <Paper shadow="xl" withBorder radius="md" p="xl" mr="md" mb="md">
                        <Center mb="md"><Title order={4}>{t('OS Release')}</Title></Center>
                        <Flex direction="column" gap="xs">
                            <div>
                                <Text size="xs" c="dimmed">{t('Name')}</Text>
                                <Text fw={500}>{osRelease.NAME}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">{t('Pretty Name')}</Text>
                                <Text fw={500}>{osRelease.PRETTY_NAME}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">{t('Version')}</Text>
                                <Text fw={500}>{osRelease.VERSION}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">{t('Code Name')}</Text>
                                <Text fw={500}>{osRelease.VERSION_CODENAME}</Text>
                            </div>
                        </Flex>
                    </Paper>
                    <Paper shadow="xl" withBorder radius="md" p="xl" mr="md" mb="md">
                        <Center mb="md"><Title order={4}>{t('RavenGrid TAK Server')}</Title></Center>
                        <Flex direction="column" gap="xs">
                            <div>
                                <Text size="xs" c="dimmed">{t('Server Version')}</Text>
                                <Text fw={700} c="blue">{ots.version}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">{t('UI Version')}</Text>
                                <Text fw={500}>{versions.gitTag}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">{t('Python Version')}</Text>
                                <Text fw={500}>{ots.python_version}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">{t('Start Time')}</Text>
                                <Text fw={500}>{ots.start_time}</Text>
                            </div>
                        </Flex>
                    </Paper>
                </Flex>
            </Center>
        </ScrollArea>
    );
}
