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
                <Title mb="xl" order={2} style={{ color: '#64ffda', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>{t('Situation Awareness Dashboard')}</Title>
            </Center>

            {/* Active EUDs Overview */}
            <Center mb="xl">
                <Paper shadow="xl" withBorder radius="md" p="xl" style={{ 
                    width: '90%', 
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(100, 255, 218, 0.3)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <Title order={3} mb="md" style={{ color: '#64ffda', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Network Status')}</Title>
                    <Grid>
                        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                            <Paper withBorder p="xl" radius="md" style={{ 
                                backgroundColor: alerts.online_euds > 0 ? 'rgba(100, 255, 218, 0.1)' : 'rgba(15, 23, 42, 0.5)',
                                border: alerts.online_euds > 0 ? '2px solid rgba(100, 255, 218, 0.5)' : '1px solid rgba(100, 255, 218, 0.2)',
                                transition: 'all 0.3s ease'
                            }}>
                                <Group justify="center">
                                    <ThemeIcon 
                                        size={60}
                                        radius="md" 
                                        color={alerts.online_euds > 0 ? 'tacticalCyan' : 'gray'}
                                        style={{ backgroundColor: 'rgba(100, 255, 218, 0.2)' }}
                                    >
                                        <IconUsers size={40} />
                                    </ThemeIcon>
                                </Group>
                                <Center mt="md">
                                    <div>
                                        <Text size="xs" c="dimmed" ta="center" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Online EUDs')}</Text>
                                        <Text size="48px" fw={700} ta="center" style={{ 
                                            color: alerts.online_euds > 0 ? '#64ffda' : '#4a5568',
                                            fontFamily: '"JetBrains Mono", monospace'
                                        }}>
                                            {alerts.online_euds}
                                        </Text>
                                    </div>
                                </Center>
                            </Paper>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                            <Paper withBorder p="xl" radius="md" style={{ 
                                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid rgba(26, 127, 255, 0.3)'
                            }}>
                                <Group justify="center">
                                    <ThemeIcon 
                                        size={60}
                                        radius="md" 
                                        color="tacticalBlue"
                                        style={{ backgroundColor: 'rgba(26, 127, 255, 0.2)' }}
                                    >
                                        <IconServer size={40} />
                                    </ThemeIcon>
                                </Group>
                                <Center mt="md">
                                    <div>
                                        <Text size="xs" c="dimmed" ta="center" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Server Status')}</Text>
                                        <Text size="lg" fw={700} ta="center" style={{ color: '#64ffda' }}>
                                            {t('Running')}
                                        </Text>
                                        <Text size="xs" ta="center" style={{ color: '#8892a0', fontFamily: '"JetBrains Mono", monospace' }}>{formatDuration(intervalToDuration({ start: 0, end: ots.uptime * 1000 }))}</Text>
                                    </div>
                                </Center>
                            </Paper>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                            <Paper withBorder p="xl" radius="md" style={{ 
                                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid rgba(0, 227, 138, 0.3)'
                            }}>
                                <Group justify="center">
                                    <ThemeIcon 
                                        size={60}
                                        radius="md" 
                                        color="tacticalGreen"
                                        style={{ backgroundColor: 'rgba(0, 227, 138, 0.2)' }}
                                    >
                                        <IconRouter size={40} />
                                    </ThemeIcon>
                                </Group>
                                <Center mt="md">
                                    <div>
                                        <Text size="xs" c="dimmed" ta="center" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('System Status')}</Text>
                                        <Text size="lg" fw={700} ta="center" style={{ color: '#64ffda' }}>
                                            {t('Online')}
                                        </Text>
                                        <Text size="xs" ta="center" style={{ color: '#8892a0', fontFamily: '"JetBrains Mono", monospace' }}>{formatDuration(intervalToDuration({ start: 0, end: uptime.uptime * 1000 }))}</Text>
                                    </div>
                                </Center>
                            </Paper>
                        </Grid.Col>
                    </Grid>
                </Paper>
            </Center>

            {/* System Resources */}
            <Center>
                <Title mb="xl" order={2} style={{ color: '#64ffda', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>{t('System Resources')}</Title>
            </Center>
            <Center mb="xl">
                <Flex direction={{ base: 'column', xs: 'row' }}>
                    <Paper withBorder shadow="xl" radius="md" p="xl" mr="md" mb="md" style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        border: `2px solid ${serverStatus.cpu_percent > 80 ? 'rgba(239, 68, 68, 0.5)' : serverStatus.cpu_percent > 60 ? 'rgba(251, 191, 36, 0.5)' : 'rgba(100, 255, 218, 0.3)'}`,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <Center mb="md"><Title order={4} style={{ color: '#64ffda', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('CPU Usage')}</Title></Center>
                        <Center>
                            <RingProgress
                                size={180}
                                thickness={16}
                                sections={[
                                    { value: serverStatus.cpu_percent, color: serverStatus.cpu_percent > 80 ? 'red' : serverStatus.cpu_percent > 60 ? 'yellow' : 'tacticalCyan' }
                                ]}
                                label={
                                    <Center>
                                        <div>
                                            <Text fw={700} size="xl" ta="center" style={{ color: '#64ffda', fontFamily: '"JetBrains Mono", monospace' }}>
                                                {serverStatus.cpu_percent.toFixed(1)}%
                                            </Text>
                                            <Text size="xs" ta="center" c="dimmed" style={{ color: '#8892a0', textTransform: 'uppercase' }}>
                                                {t('Used')}
                                            </Text>
                                        </div>
                                    </Center>
                                }
                            />
                        </Center>
                    </Paper>
                    <Paper withBorder shadow="xl" radius="md" p="xl" mr="md" mb="md" style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        border: `2px solid ${disk.percent > 80 ? 'rgba(239, 68, 68, 0.5)' : disk.percent > 60 ? 'rgba(251, 191, 36, 0.5)' : 'rgba(26, 127, 255, 0.3)'}`,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <Center mb="md"><Title order={4} style={{ color: '#64ffda', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Disk Usage')}</Title></Center>
                        <Center>
                            <RingProgress
                                size={180}
                                thickness={16}
                                sections={[
                                    { value: disk.percent, color: disk.percent > 80 ? 'red' : disk.percent > 60 ? 'yellow' : 'tacticalBlue' }
                                ]}
                                label={
                                    <Center>
                                        <div>
                                            <Text fw={700} size="xl" ta="center" style={{ color: '#64ffda', fontFamily: '"JetBrains Mono", monospace' }}>
                                                {disk.percent.toFixed(1)}%
                                            </Text>
                                            <Text size="xs" ta="center" c="dimmed" style={{ color: '#8892a0', textTransform: 'uppercase' }}>
                                                {t('Used')}
                                            </Text>
                                        </div>
                                    </Center>
                                }
                            />
                        </Center>
                        <Center><Text fw={500} size="sm" style={{ color: '#8892a0', fontFamily: '"JetBrains Mono", monospace' }}>{t('Total')}: {`${bytes_formatter(disk.total)}`}</Text></Center>
                        <Center><Text fw={500} size="sm" style={{ color: '#8892a0', fontFamily: '"JetBrains Mono", monospace' }}>{t('Used')}: {`${bytes_formatter(disk.used)}`}</Text></Center>
                        <Center><Text fw={500} size="sm" style={{ color: '#64ffda', fontFamily: '"JetBrains Mono", monospace' }}>{t('Free')}: {`${bytes_formatter(disk.free)}`}</Text></Center>
                    </Paper>
                    <Paper withBorder shadow="xl" radius="md" p="xl" mr="md" mb="md" style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        border: `2px solid ${memory.percent > 80 ? 'rgba(239, 68, 68, 0.5)' : memory.percent > 60 ? 'rgba(251, 191, 36, 0.5)' : 'rgba(0, 227, 138, 0.3)'}`,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <Center mb="md"><Title order={4} style={{ color: '#64ffda', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Memory Usage')}</Title></Center>
                        <Center>
                            <RingProgress
                                size={180}
                                thickness={16}
                                sections={[
                                    { value: memory.percent, color: memory.percent > 80 ? 'red' : memory.percent > 60 ? 'yellow' : 'tacticalGreen' }
                                ]}
                                label={
                                    <Center>
                                        <div>
                                            <Text fw={700} size="xl" ta="center" style={{ color: '#64ffda', fontFamily: '"JetBrains Mono", monospace' }}>
                                                {memory.percent.toFixed(1)}%
                                            </Text>
                                            <Text size="xs" ta="center" c="dimmed" style={{ color: '#8892a0', textTransform: 'uppercase' }}>
                                                {t('Used')}
                                            </Text>
                                        </div>
                                    </Center>
                                }
                            />
                        </Center>
                        <Center><Text fw={500} size="sm" style={{ color: '#8892a0', fontFamily: '"JetBrains Mono", monospace' }}>{t('Total')}: {`${bytes_formatter(memory.total)}`}</Text></Center>
                        <Center><Text fw={500} size="sm" style={{ color: '#8892a0', fontFamily: '"JetBrains Mono", monospace' }}>{t('Used')}: {`${bytes_formatter(memory.used)}`}</Text></Center>
                        <Center><Text fw={500} size="sm" style={{ color: '#64ffda', fontFamily: '"JetBrains Mono", monospace' }}>{t('Available')}: {`${bytes_formatter(memory.available)}`}</Text></Center>
                    </Paper>
                    <Paper shadow="xl" withBorder radius="md" p="xl" mr="md" mb="md" style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(100, 255, 218, 0.3)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <Center mb="md"><Title order={4} style={{ color: '#64ffda', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Uptime')}</Title></Center>
                        <Flex direction="column" gap="xs">
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('System Uptime')}</Text>
                                <Text fw={700} size="lg" style={{ color: '#64ffda', fontFamily: '"JetBrains Mono", monospace' }}>{formatDuration(intervalToDuration({ start: 0, end: uptime.uptime * 1000 }))}</Text>
                            </div>
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Boot Time')}</Text>
                                <Text fw={500} style={{ color: '#b4bcc8', fontFamily: '"JetBrains Mono", monospace' }}>{parseISO(uptime.boot_time).toLocaleString()}</Text>
                            </div>
                            <Divider my="xs" style={{ borderColor: 'rgba(100, 255, 218, 0.2)' }} />
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Server Uptime')}</Text>
                                <Text fw={700} size="lg" style={{ color: '#64ffda', fontFamily: '"JetBrains Mono", monospace' }}>{formatDuration(intervalToDuration({ start: 0, end: ots.uptime * 1000 }))}</Text>
                            </div>
                        </Flex>
                    </Paper>
                </Flex>
            </Center>
            <Divider my="lg" style={{ borderColor: 'rgba(100, 255, 218, 0.2)' }} />
            <Center>
                <Title mb="xl" order={2} style={{ color: '#64ffda', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>{t('Server Details')}</Title>
            </Center>
            <Center mb="xl">
                <Flex direction={{ base: 'column', xs: 'row' }}>
                    <Paper shadow="xl" withBorder radius="md" p="xl" mr="md" mb="md" style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(100, 255, 218, 0.3)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <Center mb="md"><Title order={4} style={{ color: '#64ffda', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('System Info')}</Title></Center>
                        <Flex direction="column" gap="xs">
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('System')}</Text>
                                <Text fw={500} style={{ color: '#b4bcc8', fontFamily: '"JetBrains Mono", monospace' }}>{uname.system}</Text>
                            </div>
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Release')}</Text>
                                <Text fw={500} style={{ color: '#b4bcc8', fontFamily: '"JetBrains Mono", monospace' }}>{uname.release}</Text>
                            </div>
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Architecture')}</Text>
                                <Text fw={500} style={{ color: '#b4bcc8', fontFamily: '"JetBrains Mono", monospace' }}>{uname.machine}</Text>
                            </div>
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Hostname')}</Text>
                                <Text fw={500} style={{ color: '#64ffda', fontFamily: '"JetBrains Mono", monospace' }}>{uname.node}</Text>
                            </div>
                        </Flex>
                    </Paper>
                    <Paper shadow="xl" withBorder radius="md" p="xl" mr="md" mb="md" style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(26, 127, 255, 0.3)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <Center mb="md"><Title order={4} style={{ color: '#64ffda', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('OS Release')}</Title></Center>
                        <Flex direction="column" gap="xs">
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Name')}</Text>
                                <Text fw={500} style={{ color: '#b4bcc8', fontFamily: '"JetBrains Mono", monospace' }}>{osRelease.NAME}</Text>
                            </div>
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Pretty Name')}</Text>
                                <Text fw={500} style={{ color: '#b4bcc8', fontFamily: '"JetBrains Mono", monospace' }}>{osRelease.PRETTY_NAME}</Text>
                            </div>
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Version')}</Text>
                                <Text fw={500} style={{ color: '#b4bcc8', fontFamily: '"JetBrains Mono", monospace' }}>{osRelease.VERSION}</Text>
                            </div>
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Code Name')}</Text>
                                <Text fw={500} style={{ color: '#b4bcc8', fontFamily: '"JetBrains Mono", monospace' }}>{osRelease.VERSION_CODENAME}</Text>
                            </div>
                        </Flex>
                    </Paper>
                    <Paper shadow="xl" withBorder radius="md" p="xl" mr="md" mb="md" style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        border: '2px solid rgba(100, 255, 218, 0.4)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <Center mb="md"><Title order={4} style={{ color: '#64ffda', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('RavenGrid TAK Server')}</Title></Center>
                        <Flex direction="column" gap="xs">
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Server Version')}</Text>
                                <Text fw={700} style={{ color: '#64ffda', fontFamily: '"JetBrains Mono", monospace' }}>{ots.version}</Text>
                            </div>
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('UI Version')}</Text>
                                <Text fw={500} style={{ color: '#b4bcc8', fontFamily: '"JetBrains Mono", monospace' }}>{versions.gitTag}</Text>
                            </div>
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Python Version')}</Text>
                                <Text fw={500} style={{ color: '#b4bcc8', fontFamily: '"JetBrains Mono", monospace' }}>{ots.python_version}</Text>
                            </div>
                            <div>
                                <Text size="xs" style={{ color: '#8892a0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Start Time')}</Text>
                                <Text fw={500} style={{ color: '#b4bcc8', fontFamily: '"JetBrains Mono", monospace' }}>{ots.start_time}</Text>
                            </div>
                        </Flex>
                    </Paper>
                </Flex>
            </Center>
        </ScrollArea>
    );
}
