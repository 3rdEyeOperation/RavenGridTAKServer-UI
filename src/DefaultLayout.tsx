import React, { useEffect, useState } from 'react';
import {
    Badge,
    AppShell,
    Burger,
    Group,
    Image,
    Menu,
    rem,
    useComputedColorScheme,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconCheck,
    IconLogout,
    IconAlertTriangle,
    IconUser,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';
import Logo from './images/ots-logo.png';
import { AppContent } from './components/AppContent';
import axios from './axios_config';
import { apiRoutes } from './apiRoutes';
import Navbar from './components/Navbar/Navbar';
import { socket } from './socketio';
import {t} from "i18next";

export function DefaultLayout() {
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    const navigate = useNavigate();

    const [socketConnected, setSocketConnected] = useState(false);

    useEffect(() => {
        function onConnect() {
            setSocketConnected(true);
        }

        function onDisconnect() {
            setSocketConnected(false);
        }

        function onAlert(alert:any) {
            let message = `${alert.alert_type} from ${alert.callsign}`;
            let color = 'red';
            let icon = <IconAlertTriangle style={{ width: rem(20), height: rem(20) }} />;
            const alert_sound = new Audio('/alert.mp3');
            alert_sound.play();

            if (alert.cancel_time !== null) {
                message = `${alert.alert_type} from ${alert.callsign} canceled`;
                color = 'green';
                icon = <IconCheck style={{ width: rem(20), height: rem(20) }} />;
            }

            notifications.show({
                title: t('Alert'),
                message,
                color,
                icon,
            });
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('alert', onAlert);

        if (!socketConnected) {
            socket.connect();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('alert', onAlert);
        };
    }, []);

    const logout = () => {
        axios.post(
            apiRoutes.logout
        ).then(r => {
            if (r.status === 200) {
                localStorage.clear();
                navigate('/');
            }
        });
    };

    return (
        <AppShell
          header={{ height: 60 }}
          navbar={{
                width: 300,
                breakpoint: 'sm',
                collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
            }}
          padding="md"
        >
            <AppShell.Header pb={0} bg={computedColorScheme === 'light' ? 'rgba(10, 14, 20, 0.95)' : 'dark.8'} style={{ borderBottom: '1px solid rgba(100, 255, 218, 0.2)' }}>
                <Group justify="space-between" pr={5} h="100%">
                    <Group h="100%" w={300} gap="md">
                        <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" pl={5} color="cyan" />
                        <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" color="cyan" />
                        <Image src={Logo} h={50} w="auto" />
                        <Text 
                            size="xl" 
                            fw={700} 
                            className="text-glow-cyan"
                            style={{ 
                                textTransform: 'uppercase', 
                                letterSpacing: '2px',
                                fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}
                            visibleFrom="sm"
                        >
                            RavenGrid AI
                        </Text>
                    </Group>
                    <Group>
                        <Menu shadow="md" width={200} trigger="click-hover">
                            <Menu.Target>
                                <Badge autoContrast variant="light" size="md" color="tacticalCyan" style={{ cursor: 'pointer' }}>
                                    {localStorage.getItem('username')}
                                </Badge>
                            </Menu.Target>

                            <Menu.Dropdown style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(100, 255, 218, 0.3)' }}>
                                <Menu.Label style={{ color: '#64ffda' }}>RavenGrid TAK Server</Menu.Label>
                                <Menu.Divider style={{ borderColor: 'rgba(100, 255, 218, 0.2)' }} />
                                <Menu.Item
                                    leftSection={<IconUser size={14} />} onClick={() => {navigate('/profile')}}
                                    style={{ color: '#e8eaed' }}>
                                    {t("Profile")}
                                </Menu.Item>
                                <Menu.Item
                                  disabled={localStorage.getItem('loggedIn') !== 'true'}
                                  leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                                  onClick={() => {
                                        logout();
                                    }}
                                  style={{ color: '#e8eaed' }}
                                >
                                    {t("Log Out")}
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
            </AppShell.Header>
            <AppShell.Navbar pl="md" pr="md" bg={computedColorScheme === 'light' ? 'rgba(10, 14, 20, 0.95)' : 'dark.8'} style={{ borderRight: '1px solid rgba(100, 255, 218, 0.2)' }}>
                <Navbar />
            </AppShell.Navbar>
            <AppShell.Main bg={computedColorScheme === 'light' ? 'rgba(15, 23, 42, 1)' : 'dark.7'} style={{ 
                backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(100, 255, 218, 0.05) 0%, transparent 50%)',
            }}><AppContent /></AppShell.Main>
        </AppShell>
    );
}

export default DefaultLayout;
