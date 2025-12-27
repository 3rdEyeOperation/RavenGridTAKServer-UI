/**
 * RavenGrid RF Sensor Map Component
 * Military-grade RF detection visualization on tactical map
 */

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, Badge, Text, Group, Stack, Progress, Button, Tooltip } from '@mantine/core';
import { IconRadar, IconLocation, IconActivity } from '@tabler/icons-react';
import { RFDetection, generateCoTFromRFDetection, sendCoTToServer } from '../utils/rfCoTGenerator';

interface RFSensorMapProps {
    sensors: Array<{
        id: string;
        name: string;
        location: { lat: number; lon: number; alt?: number };
        status: 'online' | 'offline';
        lastDetection?: RFDetection;
    }>;
    detections: RFDetection[];
    onSensorClick?: (sensorId: string) => void;
    onDetectionClick?: (detection: RFDetection) => void;
}

// Custom icon for RF sensors
const createSensorIcon = (status: string) => {
    const color = status === 'online' ? '#64ffda' : '#666';
    return L.divIcon({
        html: `
            <div style="
                position: relative;
                width: 40px;
                height: 40px;
            ">
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 30px;
                    height: 30px;
                    background: rgba(15, 23, 42, 0.95);
                    border: 2px solid ${color};
                    border-radius: 50%;
                    box-shadow: 0 0 20px ${color};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
                        <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
                        <path d="M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0"></path>
                        <path d="M12 4l0 3"></path>
                        <path d="M12 17l0 3"></path>
                        <path d="M4 12l3 0"></path>
                        <path d="M17 12l3 0"></path>
                    </svg>
                </div>
                ${status === 'online' ? `
                    <div class="pulse-ring" style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 40px;
                        height: 40px;
                        border: 2px solid ${color};
                        border-radius: 50%;
                        animation: pulse 2s infinite;
                    "></div>
                ` : ''}
            </div>
        `,
        className: 'rf-sensor-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
};

// Custom icon for RF detections
const createDetectionIcon = (detection: RFDetection) => {
    const getSignalColor = () => {
        if (detection.signal_type.includes('Jamming')) return '#ff4444';
        if (detection.signal_type.includes('Radar')) return '#ffaa00';
        if (detection.signal_type.includes('Tactical')) return '#64ffda';
        if (detection.confidence > 0.8) return '#00ff88';
        return '#00aaff';
    };
    
    const color = getSignalColor();
    const size = Math.min(40, Math.max(20, detection.power_dbm + 100)); // Scale by power
    
    return L.divIcon({
        html: `
            <div style="
                position: relative;
                width: ${size}px;
                height: ${size}px;
            ">
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: ${size * 0.6}px;
                    height: ${size * 0.6}px;
                    background: ${color};
                    border-radius: 50%;
                    opacity: 0.8;
                    box-shadow: 0 0 ${size}px ${color};
                    animation: signal-pulse 1.5s infinite;
                "></div>
            </div>
        `,
        className: 'rf-detection-icon',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2]
    });
};

// Detection coverage circle color based on signal type
const getDetectionColor = (signalType: string): string => {
    if (signalType.includes('Jamming')) return '#ff4444';
    if (signalType.includes('Radar')) return '#ffaa00';
    if (signalType.includes('Tactical')) return '#64ffda';
    return '#00aaff';
};

// Auto-center map on sensors
function MapCenterController({ sensors }: { sensors: RFSensorMapProps['sensors'] }) {
    const map = useMap();
    
    useEffect(() => {
        if (sensors.length > 0) {
            const bounds = L.latLngBounds(
                sensors.map(s => [s.location.lat, s.location.lon])
            );
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [sensors, map]);
    
    return null;
}

export default function RFSensorMap({ 
    sensors, 
    detections, 
    onSensorClick, 
    onDetectionClick 
}: RFSensorMapProps) {
    const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
    const [sendingCoT, setSendingCoT] = useState(false);
    
    const handleSendCoT = async (detection: RFDetection) => {
        setSendingCoT(true);
        try {
            const cotEvent = generateCoTFromRFDetection(detection);
            const success = await sendCoTToServer(cotEvent);
            
            if (success) {
                // Notification handled by parent component
                console.log('CoT sent successfully for detection:', detection);
            }
        } catch (error) {
            console.error('Failed to send CoT:', error);
        } finally {
            setSendingCoT(false);
        }
    };
    
    // Default center if no sensors
    const defaultCenter: [number, number] = [38.8977, -77.0365]; // Washington DC
    const center: [number, number] = sensors.length > 0
        ? [sensors[0].location.lat, sensors[0].location.lon]
        : defaultCenter;
    
    return (
        <div style={{ position: 'relative', height: '600px', width: '100%' }}>
            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    50% {
                        opacity: 0.3;
                        transform: translate(-50%, -50%) scale(1.2);
                    }
                }
                
                @keyframes signal-pulse {
                    0%, 100% {
                        opacity: 0.8;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    50% {
                        opacity: 0.4;
                        transform: translate(-50%, -50%) scale(1.3);
                    }
                }
                
                .leaflet-container {
                    background: #0a0e1a !important;
                    border-radius: 8px;
                    border: 1px solid rgba(100, 255, 218, 0.3);
                }
                
                .leaflet-popup-content-wrapper {
                    background: rgba(15, 23, 42, 0.98) !important;
                    border: 1px solid rgba(100, 255, 218, 0.4);
                    box-shadow: 0 0 30px rgba(100, 255, 218, 0.3);
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                }
                
                .leaflet-popup-content {
                    color: #e2e8f0 !important;
                    margin: 12px;
                }
                
                .leaflet-popup-tip {
                    background: rgba(15, 23, 42, 0.98) !important;
                    border: 1px solid rgba(100, 255, 218, 0.4);
                }
            `}</style>
            
            <MapContainer
                center={center}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    opacity={0.3}
                />
                
                <MapCenterController sensors={sensors} />
                
                {/* RF Sensors */}
                {sensors.map(sensor => (
                    <Marker
                        key={sensor.id}
                        position={[sensor.location.lat, sensor.location.lon]}
                        icon={createSensorIcon(sensor.status)}
                        eventHandlers={{
                            click: () => {
                                setSelectedSensor(sensor.id);
                                onSensorClick?.(sensor.id);
                            }
                        }}
                    >
                        <Popup>
                            <Card padding="xs" style={{ background: 'transparent', border: 'none' }}>
                                <Stack gap="xs">
                                    <Group gap="xs">
                                        <IconRadar size={20} color="#64ffda" />
                                        <Text size="sm" fw={700} style={{ color: '#64ffda' }}>
                                            {sensor.name}
                                        </Text>
                                    </Group>
                                    
                                    <Badge
                                        color={sensor.status === 'online' ? 'teal' : 'gray'}
                                        variant="light"
                                    >
                                        {sensor.status.toUpperCase()}
                                    </Badge>
                                    
                                    <Group gap="xs">
                                        <IconLocation size={16} />
                                        <Text size="xs">
                                            {sensor.location.lat.toFixed(6)}, {sensor.location.lon.toFixed(6)}
                                        </Text>
                                    </Group>
                                    
                                    {sensor.lastDetection && (
                                        <>
                                            <Text size="xs" c="dimmed">Last Detection:</Text>
                                            <Text size="xs">
                                                {sensor.lastDetection.signal_type} @ {' '}
                                                {(sensor.lastDetection.frequency_hz / 1e6).toFixed(2)} MHz
                                            </Text>
                                        </>
                                    )}
                                </Stack>
                            </Card>
                        </Popup>
                        
                        {/* Sensor coverage circle */}
                        {sensor.status === 'online' && (
                            <Circle
                                center={[sensor.location.lat, sensor.location.lon]}
                                radius={5000} // 5km detection range
                                pathOptions={{
                                    color: '#64ffda',
                                    fillColor: '#64ffda',
                                    fillOpacity: 0.05,
                                    weight: 1,
                                    opacity: 0.3,
                                    dashArray: '10, 10'
                                }}
                            />
                        )}
                    </Marker>
                ))}
                
                {/* RF Detections */}
                {detections.map((detection, idx) => (
                    <React.Fragment key={`detection-${idx}`}>
                        <Marker
                            position={[detection.location.lat, detection.location.lon]}
                            icon={createDetectionIcon(detection)}
                            eventHandlers={{
                                click: () => onDetectionClick?.(detection)
                            }}
                        >
                            <Popup>
                                <Card padding="xs" style={{ background: 'transparent', border: 'none' }}>
                                    <Stack gap="xs">
                                        <Group gap="xs">
                                            <IconActivity size={20} color={getDetectionColor(detection.signal_type)} />
                                            <Text size="sm" fw={700} style={{ color: '#64ffda' }}>
                                                {detection.signal_type}
                                            </Text>
                                        </Group>
                                        
                                        <Badge
                                            color={detection.confidence > 0.7 ? 'teal' : 'yellow'}
                                            variant="light"
                                        >
                                            {(detection.confidence * 100).toFixed(0)}% Confidence
                                        </Badge>
                                        
                                        <Stack gap={4}>
                                            <Text size="xs">
                                                <strong>Frequency:</strong> {(detection.frequency_hz / 1e6).toFixed(3)} MHz
                                            </Text>
                                            <Text size="xs">
                                                <strong>Power:</strong> {detection.power_dbm.toFixed(1)} dBm
                                            </Text>
                                            <Text size="xs">
                                                <strong>Bandwidth:</strong> {(detection.bandwidth_hz / 1e3).toFixed(1)} kHz
                                            </Text>
                                            <Text size="xs">
                                                <strong>Classification:</strong> {detection.classification}
                                            </Text>
                                            {detection.bearing && (
                                                <Text size="xs">
                                                    <strong>Bearing:</strong> {detection.bearing.toFixed(0)}°
                                                </Text>
                                            )}
                                        </Stack>
                                        
                                        <Progress 
                                            value={detection.confidence * 100} 
                                            size="xs" 
                                            color="teal"
                                            styles={{
                                                root: { backgroundColor: 'rgba(100, 255, 218, 0.1)' }
                                            }}
                                        />
                                        
                                        <Button
                                            size="xs"
                                            variant="light"
                                            color="teal"
                                            loading={sendingCoT}
                                            onClick={() => handleSendCoT(detection)}
                                        >
                                            Send to TAK
                                        </Button>
                                    </Stack>
                                </Card>
                            </Popup>
                        </Marker>
                        
                        {/* Detection coverage circle */}
                        <Circle
                            center={[detection.location.lat, detection.location.lon]}
                            radius={(detection.bandwidth_hz / 1000) * 10} // Bandwidth-based radius
                            pathOptions={{
                                color: getDetectionColor(detection.signal_type),
                                fillColor: getDetectionColor(detection.signal_type),
                                fillOpacity: 0.1,
                                weight: 2,
                                opacity: 0.5
                            }}
                        />
                        
                        {/* Line from sensor to detection if bearing available */}
                        {detection.bearing !== undefined && (
                            <Polyline
                                positions={[
                                    [detection.location.lat, detection.location.lon],
                                    // Calculate end point based on bearing
                                    [
                                        detection.location.lat + Math.cos(detection.bearing * Math.PI / 180) * 0.05,
                                        detection.location.lon + Math.sin(detection.bearing * Math.PI / 180) * 0.05
                                    ]
                                ]}
                                pathOptions={{
                                    color: getDetectionColor(detection.signal_type),
                                    weight: 2,
                                    opacity: 0.6,
                                    dashArray: '5, 10'
                                }}
                            />
                        )}
                    </React.Fragment>
                ))}
            </MapContainer>
        </div>
    );
}
