/**
 * RF Spectrum Analyzer Component
 * Real-time military-grade spectrum visualization
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card, Text, Group, Badge, Stack, Select, Button, Tooltip } from '@mantine/core';
import { IconWaveSquare, IconZoomIn, IconZoomOut, IconRefresh } from '@tabler/icons-react';

interface SpectrumData {
    frequency_hz: number;
    power_dbm: number;
    timestamp: string;
}

interface RFSpectrumAnalyzerProps {
    data: SpectrumData[];
    minFreqMHz?: number;
    maxFreqMHz?: number;
    threshold?: number;
    onFrequencyClick?: (freq: number) => void;
}

export default function RFSpectrumAnalyzer({
    data,
    minFreqMHz = 88,
    maxFreqMHz = 6000,
    threshold = -80,
    onFrequencyClick
}: RFSpectrumAnalyzerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [zoom, setZoom] = useState(1);
    const [freqRange, setFreqRange] = useState<string>('full');
    const [hoveredFreq, setHoveredFreq] = useState<number | null>(null);
    const [hoveredPower, setHoveredPower] = useState<number | null>(null);
    
    // Predefined frequency ranges for military/tactical bands
    const frequencyRanges: Record<string, [number, number]> = {
        'full': [minFreqMHz, maxFreqMHz],
        'vhf': [30, 300],      // VHF Band
        'uhf': [300, 3000],    // UHF Band
        'shf': [3000, 30000],  // SHF Band
        'fm': [88, 108],       // FM Radio
        'cellular': [800, 2200], // Cellular
        'wifi': [2400, 5800],  // WiFi bands
        'tactical': [225, 400] // Military tactical radio
    };
    
    useEffect(() => {
        drawSpectrum();
    }, [data, zoom, freqRange, threshold]);
    
    const drawSpectrum = () => {
        const canvas = canvasRef.current;
        if (!canvas || data.length === 0) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        const padding = { top: 30, right: 40, bottom: 50, left: 60 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;
        
        // Clear canvas with dark background
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, width, height);
        
        // Get frequency range
        const [minFreq, maxFreq] = frequencyRanges[freqRange];
        
        // Filter data to frequency range
        const filteredData = data.filter(d => {
            const freqMHz = d.frequency_hz / 1e6;
            return freqMHz >= minFreq && freqMHz <= maxFreq;
        }).sort((a, b) => a.frequency_hz - b.frequency_hz);
        
        if (filteredData.length === 0) {
            ctx.fillStyle = '#64ffda';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('No data in selected frequency range', width / 2, height / 2);
            return;
        }
        
        // Calculate scales
        const minPower = Math.min(...filteredData.map(d => d.power_dbm), threshold);
        const maxPower = Math.max(...filteredData.map(d => d.power_dbm));
        const powerRange = maxPower - minPower;
        
        // Draw grid
        ctx.strokeStyle = 'rgba(100, 255, 218, 0.1)';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines (power levels)
        const powerSteps = 5;
        for (let i = 0; i <= powerSteps; i++) {
            const y = padding.top + (plotHeight / powerSteps) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + plotWidth, y);
            ctx.stroke();
            
            // Power labels
            const power = maxPower - (powerRange / powerSteps) * i;
            ctx.fillStyle = '#64ffda';
            ctx.font = '11px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${power.toFixed(0)} dBm`, padding.left - 5, y + 4);
        }
        
        // Vertical grid lines (frequencies)
        const freqSteps = 10;
        for (let i = 0; i <= freqSteps; i++) {
            const x = padding.left + (plotWidth / freqSteps) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + plotHeight);
            ctx.stroke();
            
            // Frequency labels
            const freq = minFreq + ((maxFreq - minFreq) / freqSteps) * i;
            ctx.fillStyle = '#64ffda';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(x, padding.top + plotHeight + 20);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(`${freq.toFixed(0)} MHz`, 0, 0);
            ctx.restore();
        }
        
        // Draw threshold line
        const thresholdY = padding.top + plotHeight - 
            ((threshold - minPower) / powerRange) * plotHeight;
        ctx.strokeStyle = 'rgba(255, 68, 68, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding.left, thresholdY);
        ctx.lineTo(padding.left + plotWidth, thresholdY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw spectrum data
        ctx.lineWidth = 2;
        
        // Create gradient for spectrum
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotHeight);
        gradient.addColorStop(0, '#ff4444');    // Strong signals - red
        gradient.addColorStop(0.3, '#ffaa00');  // Medium-strong - orange
        gradient.addColorStop(0.6, '#64ffda');  // Medium - cyan
        gradient.addColorStop(1, '#00aaff');    // Weak - blue
        
        // Draw filled area under curve
        ctx.beginPath();
        filteredData.forEach((point, idx) => {
            const freqMHz = point.frequency_hz / 1e6;
            const x = padding.left + ((freqMHz - minFreq) / (maxFreq - minFreq)) * plotWidth;
            const y = padding.top + plotHeight - ((point.power_dbm - minPower) / powerRange) * plotHeight;
            
            if (idx === 0) {
                ctx.moveTo(x, padding.top + plotHeight);
                ctx.lineTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.lineTo(
            padding.left + plotWidth,
            padding.top + plotHeight
        );
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Draw line
        ctx.strokeStyle = '#64ffda';
        ctx.lineWidth = 2;
        ctx.beginPath();
        filteredData.forEach((point, idx) => {
            const freqMHz = point.frequency_hz / 1e6;
            const x = padding.left + ((freqMHz - minFreq) / (maxFreq - minFreq)) * plotWidth;
            const y = padding.top + plotHeight - ((point.power_dbm - minPower) / powerRange) * plotHeight;
            
            if (idx === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // Highlight peaks (signals above threshold)
        filteredData.forEach(point => {
            if (point.power_dbm > threshold) {
                const freqMHz = point.frequency_hz / 1e6;
                const x = padding.left + ((freqMHz - minFreq) / (maxFreq - minFreq)) * plotWidth;
                const y = padding.top + plotHeight - ((point.power_dbm - minPower) / powerRange) * plotHeight;
                
                // Draw peak marker
                ctx.fillStyle = '#00ff88';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Glow effect
                ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        
        // Draw axes labels
        ctx.fillStyle = '#64ffda';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        
        // X-axis label
        ctx.fillText('Frequency (MHz)', width / 2, height - 5);
        
        // Y-axis label
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Power (dBm)', 0, 0);
        ctx.restore();
        
        // Title
        ctx.font = 'bold 16px monospace';
        ctx.fillText('RF Spectrum Analysis', width / 2, 20);
    };
    
    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const padding = { left: 60, right: 40 };
        const plotWidth = rect.width - padding.left - padding.right;
        
        const [minFreq, maxFreq] = frequencyRanges[freqRange];
        const clickedFreq = minFreq + ((x - padding.left) / plotWidth) * (maxFreq - minFreq);
        
        if (clickedFreq >= minFreq && clickedFreq <= maxFreq) {
            onFrequencyClick?.(clickedFreq * 1e6); // Convert to Hz
        }
    };
    
    const handleCanvasMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const padding = { top: 30, left: 60, right: 40, bottom: 50 };
        const plotWidth = rect.width - padding.left - padding.right;
        const plotHeight = rect.height - padding.top - padding.bottom;
        
        if (x >= padding.left && x <= padding.left + plotWidth &&
            y >= padding.top && y <= padding.top + plotHeight) {
            const [minFreq, maxFreq] = frequencyRanges[freqRange];
            const freq = minFreq + ((x - padding.left) / plotWidth) * (maxFreq - minFreq);
            setHoveredFreq(freq);
            
            // Find closest power value
            const filteredData = data.filter(d => {
                const freqMHz = d.frequency_hz / 1e6;
                return freqMHz >= minFreq && freqMHz <= maxFreq;
            });
            
            if (filteredData.length > 0) {
                const closest = filteredData.reduce((prev, curr) => {
                    const prevDiff = Math.abs(prev.frequency_hz / 1e6 - freq);
                    const currDiff = Math.abs(curr.frequency_hz / 1e6 - freq);
                    return currDiff < prevDiff ? curr : prev;
                });
                setHoveredPower(closest.power_dbm);
            }
        } else {
            setHoveredFreq(null);
            setHoveredPower(null);
        }
    };
    
    return (
        <Card 
            padding="lg" 
            style={{ 
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(100, 255, 218, 0.3)',
                backdropFilter: 'blur(10px)'
            }}
        >
            <Stack gap="md">
                <Group justify="space-between">
                    <Group gap="xs">
                        <IconWaveSquare size={24} color="#64ffda" />
                        <Text size="lg" fw={700} style={{ color: '#64ffda' }}>
                            Spectrum Analyzer
                        </Text>
                        {data.length > 0 && (
                            <Badge color="teal" variant="light">
                                {data.length} samples
                            </Badge>
                        )}
                    </Group>
                    
                    <Group gap="xs">
                        <Select
                            value={freqRange}
                            onChange={(value) => setFreqRange(value || 'full')}
                            data={[
                                { value: 'full', label: 'Full Spectrum' },
                                { value: 'vhf', label: 'VHF (30-300 MHz)' },
                                { value: 'uhf', label: 'UHF (300-3000 MHz)' },
                                { value: 'fm', label: 'FM Radio (88-108 MHz)' },
                                { value: 'cellular', label: 'Cellular (800-2200 MHz)' },
                                { value: 'wifi', label: 'WiFi (2.4-5.8 GHz)' },
                                { value: 'tactical', label: 'Tactical (225-400 MHz)' },
                            ]}
                            size="xs"
                            style={{ width: '200px' }}
                        />
                        
                        <Tooltip label="Zoom In">
                            <Button
                                size="xs"
                                variant="light"
                                color="teal"
                                onClick={() => setZoom(zoom * 1.2)}
                            >
                                <IconZoomIn size={16} />
                            </Button>
                        </Tooltip>
                        
                        <Tooltip label="Zoom Out">
                            <Button
                                size="xs"
                                variant="light"
                                color="teal"
                                onClick={() => setZoom(Math.max(1, zoom / 1.2))}
                            >
                                <IconZoomOut size={16} />
                            </Button>
                        </Tooltip>
                        
                        <Tooltip label="Reset">
                            <Button
                                size="xs"
                                variant="light"
                                color="teal"
                                onClick={() => setZoom(1)}
                            >
                                <IconRefresh size={16} />
                            </Button>
                        </Tooltip>
                    </Group>
                </Group>
                
                {hoveredFreq !== null && hoveredPower !== null && (
                    <Group gap="md">
                        <Text size="xs" c="dimmed">
                            Frequency: <span style={{ color: '#64ffda' }}>{hoveredFreq.toFixed(2)} MHz</span>
                        </Text>
                        <Text size="xs" c="dimmed">
                            Power: <span style={{ color: '#64ffda' }}>{hoveredPower.toFixed(1)} dBm</span>
                        </Text>
                    </Group>
                )}
                
                <canvas
                    ref={canvasRef}
                    style={{ 
                        width: '100%', 
                        height: '400px',
                        cursor: 'crosshair'
                    }}
                    onClick={handleCanvasClick}
                    onMouseMove={handleCanvasMove}
                    onMouseLeave={() => {
                        setHoveredFreq(null);
                        setHoveredPower(null);
                    }}
                />
                
                <Group gap="md" justify="center">
                    <Group gap="xs">
                        <div style={{ 
                            width: 16, 
                            height: 16, 
                            background: '#00ff88',
                            borderRadius: '50%'
                        }} />
                        <Text size="xs" c="dimmed">Active Signal</Text>
                    </Group>
                    
                    <Group gap="xs">
                        <div style={{ 
                            width: 16, 
                            height: 2, 
                            background: '#ff4444',
                            opacity: 0.5
                        }} />
                        <Text size="xs" c="dimmed">Threshold ({threshold} dBm)</Text>
                    </Group>
                    
                    <Group gap="xs">
                        <div style={{ 
                            width: 16, 
                            height: 16, 
                            background: 'linear-gradient(to bottom, #ff4444, #ffaa00, #64ffda, #00aaff)'
                        }} />
                        <Text size="xs" c="dimmed">Signal Strength</Text>
                    </Group>
                </Group>
            </Stack>
        </Card>
    );
}
