import React, { useState, useEffect } from 'react';
import { Paper, Stack, ActionIcon, Tooltip, Group, Text, Divider, Badge } from '@mantine/core';
import {
    IconMapPin,
    IconCircle,
    IconRoute,
    IconPolygon,
    IconRectangle,
    IconRuler,
    IconTarget,
    IconFirstAidKit,
    IconAlertTriangle,
    IconFlag,
    IconUsers,
    IconSend,
    IconTrash,
    IconEdit,
    IconChevronLeft,
    IconChevronRight,
} from '@tabler/icons-react';

interface ATAKToolbarProps {
    position: 'left' | 'right';
    selectedTool: string;
    onToolSelect: (tool: string) => void;
    onClearAll: () => void;
}

export function ATAKToolbar({ position, selectedTool, onToolSelect, onClearAll }: ATAKToolbarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 10, y: window.innerHeight / 2 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const tools = [
        { id: 'marker', icon: IconMapPin, label: 'Self Marker', color: 'tacticalCyan' },
        { id: 'hostile', icon: IconTarget, label: 'Hostile Marker', color: 'tacticalRed' },
        { id: 'friendly', icon: IconUsers, label: 'Friendly Marker', color: 'tacticalGreen' },
        { id: 'casevac', icon: IconFirstAidKit, label: 'CASEVAC', color: 'tacticalRed' },
        { id: 'alert', icon: IconAlertTriangle, label: 'Alert', color: 'tacticalOrange' },
        { id: 'waypoint', icon: IconFlag, label: 'Waypoint', color: 'tacticalBlue' },
        { id: 'measure', icon: IconRuler, label: 'Measure Distance', color: 'tacticalCyan' },
        { id: 'line', icon: IconRoute, label: 'Draw Line', color: 'tacticalOrange' },
        { id: 'circle', icon: IconCircle, label: 'Draw Circle', color: 'tacticalCyan' },
        { id: 'polygon', icon: IconPolygon, label: 'Draw Polygon', color: 'tacticalGreen' },
        { id: 'rectangle', icon: IconRectangle, label: 'Draw Rectangle', color: 'tacticalBlue' },
        { id: 'send-cot', icon: IconSend, label: 'Send CoT', color: 'tacticalGreen' },
    ];

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setToolbarPosition({
                    x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 60)),
                    y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100)),
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
            x: e.clientX - toolbarPosition.x,
            y: e.clientY - toolbarPosition.y,
        });
    };

    return (
        <Paper
            shadow="xl"
            p="xs"
            className="tactical-card"
            style={{
                position: 'fixed',
                left: `${toolbarPosition.x}px`,
                top: `${toolbarPosition.y}px`,
                transform: 'translateY(-50%)',
                zIndex: isDragging ? 10000 : 1000,
                backgroundColor: 'rgba(10, 14, 20, 0.95)',
                border: '1px solid rgba(100, 255, 218, 0.4)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 30px rgba(100, 255, 218, 0.2)',
                maxHeight: '80vh',
                overflowY: 'auto',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                width: collapsed ? '50px' : 'auto',
                transition: 'width 0.3s ease',
            }}
        >
            <Stack gap="xs">
                <Group
                    justify="space-between"
                    onMouseDown={handleMouseDown}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    {!collapsed && (
                        <Text
                            size="xs"
                            fw={700}
                            className="text-glow-cyan"
                            style={{
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}
                        >
                            ATAK
                        </Text>
                    )}
                    <Tooltip label={collapsed ? "Expand" : "Collapse"}>
                        <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="tacticalCyan"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCollapsed(!collapsed);
                            }}
                        >
                            {collapsed ? <IconChevronRight size={14} /> : <IconChevronLeft size={14} />}
                        </ActionIcon>
                    </Tooltip>
                </Group>
                
                {!collapsed && (
                    <>
                        <Divider color="rgba(100, 255, 218, 0.3)" />
                        
                        {tools.map((tool) => (
                            <Tooltip key={tool.id} label={tool.label} position="right" withArrow>
                                <ActionIcon
                                    size="lg"
                                    variant={selectedTool === tool.id ? 'filled' : 'light'}
                                    color={tool.color as any}
                                    onClick={() => onToolSelect(tool.id)}
                                    className={selectedTool === tool.id ? 'status-active' : ''}
                                    style={{
                                        width: '100%',
                                    }}
                                >
                                    <tool.icon size={20} />
                                </ActionIcon>
                            </Tooltip>
                        ))}
                        
                        <Divider color="rgba(100, 255, 218, 0.3)" />
                        
                        <Tooltip label="Clear All" position="right" withArrow>
                            <ActionIcon
                                size="lg"
                                variant="light"
                                color="tacticalRed"
                                onClick={onClearAll}
                                style={{ width: '100%' }}
                            >
                                <IconTrash size={20} />
                            </ActionIcon>
                        </Tooltip>
                    </>
                )}
            </Stack>
        </Paper>
    );
}
