import React, { ReactElement, useEffect, useState, useRef } from 'react';
import { renderToString } from 'react-dom/server';
import { LayersControl, MapContainer, ScaleControl, TileLayer, useMap, WMSTileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'react-leaflet-fullscreen/styles.css';
import 'leaflet.marker.slideto';
import 'leaflet-rotatedmarker';
import { Divider, Drawer, Image, Paper, Table, Text, useComputedColorScheme, ActionIcon, Group, Tooltip, Badge, Stack, Switch, SegmentedControl, Button, Collapse, Grid } from '@mantine/core';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { IconX, IconRuler, IconMapPin, IconCircle, IconRoute, IconCrosshair, IconStack2, Icon3dCubeSphere, IconTarget, IconCurrentLocation, IconChevronLeft, IconChevronRight, IconPolygon, IconRectangle, IconSquare, IconPencil, IconTrash, IconEdit, IconSend, IconUsers, IconMapSearch, IconCompass, IconAlertTriangle, IconFirstAidKit, IconBuildingCommunity, IconFlag, IconCamera, IconVideo, IconSettings, IconLayersLinked, IconPlus, IconMinus, IconMap2, IconWorldLatitude, IconWorldLongitude, IconLocation, IconClock, IconActivity, IconShield } from '@tabler/icons-react';
import * as milsymbol from 'milsymbol';
import { useDisclosure } from '@mantine/hooks';
import GreatCircle from './GreatCircle';
import { apiRoutes } from '@/apiRoutes';
import { socket } from '@/socketio';
import classes from './Map.module.css';
import 'leaflet.fullscreen';
import 'leaflet.fullscreen/Control.FullScreen.css';
import 'leaflet.heat';
import Arrow from './Arrow';
import Video from './Video';
import { ATAKToolbar } from './ATAKToolbar';
import { CoordinateDisplay } from './CoordinateDisplay';
import { MissionPlanning } from './MissionPlanning';
import { C2Dashboard } from './C2Dashboard';
import { ThreatTracker } from './ThreatTracker';
import { BattleRhythm } from './BattleRhythm';

export default function Map() {
    const [markers, setMarkers] = useState<{ [uid: string]: L.Marker }>({});
    const [circles, setCircles] = useState<{ [uid: string]: L.Circle }>({});
    const [rbLines, setRBLines] = useState<{ [uid: string]: L.Polyline }>({});
    const [fovs, setFovs] = useState<{ [uid: string]: L.Polygon }>({});
    const [haveMapState, setHaveMapState] = useState(false);
    const [opened, { open, close }] = useDisclosure(false);
    const [drawerTitle, setDrawerTitle] = useState('');
    const [detailRows, setDetailRows] = useState<ReactElement[]>([]);
    const [positionRows, setPositionRows] = useState<ReactElement[]>([]);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showRadialMenu, setShowRadialMenu] = useState(false);
    const [radialMenuPosition, setRadialMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const [selectedTool, setSelectedTool] = useState<string>('none');
    const [measureMode, setMeasureMode] = useState(false);
    const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);
    const [linePoints, setLinePoints] = useState<L.LatLng[]>([]);
    const [polygonPoints, setPolygonPoints] = useState<L.LatLng[]>([]);
    const [drawMode, setDrawMode] = useState<'none' | 'marker' | 'circle' | 'line' | 'polygon' | 'rectangle' | 'hostile' | 'friendly' | 'waypoint' | 'alert' | 'casevac'>('none');
    const [showADSB, setShowADSB] = useState(true);
    const [mapStyle, setMapStyle] = useState<'satellite' | 'terrain' | 'dark' | 'tactical'>('satellite');
    const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [coordinateFormat, setCoordinateFormat] = useState<'DD' | 'DMS' | 'MGRS'>('DD');
    const [showMissionPanel, setShowMissionPanel] = useState(false);
    const [showC2Dashboard, setShowC2Dashboard] = useState(true);
    const [showThreatTracker, setShowThreatTracker] = useState(false);
    const [showBattleRhythm, setShowBattleRhythm] = useState(false);
    const [tempMarker, setTempMarker] = useState<L.Marker | null>(null);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [heatmapType, setHeatmapType] = useState<'rf_signals' | 'rf_power' | 'threat'>('rf_signals');
    const mapRef = useRef<L.Map | null>(null);
    const measureLayerRef = useRef<L.LayerGroup>(new L.LayerGroup());
    const drawLayerRef = useRef<L.LayerGroup>(new L.LayerGroup());
    const measureLineRef = useRef<L.Polyline | null>(null);
    const drawLineRef = useRef<L.Polyline | null>(null);
    const heatmapLayerRef = useRef<any>(null);
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    const eudsLayer = new L.LayerGroup();
    const rbLinesLayer = new L.LayerGroup();
    const markersLayer = new L.LayerGroup();
    const fovsLayer = new L.LayerGroup();

    // Helper function to convert decimal degrees to DMS format
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

    // Handle tool selection
    const handleToolSelect = (tool: string) => {
        setSelectedTool(tool);
        
        // Clear temp marker when switching tools
        if (tempMarker && mapRef.current) {
            mapRef.current.removeLayer(tempMarker);
            setTempMarker(null);
        }
        
        // Reset all modes first
        setMeasureMode(false);
        setDrawMode('none');
        setLinePoints([]);
        setPolygonPoints([]);
        
        // Handle tool selection logic
        if (tool === 'measure') {
            setMeasureMode(true);
            setMeasurePoints([]);
            notifications.show({
                title: 'Measure Mode Active',
                message: 'Click points on map. Right-click to finish.',
                color: 'tacticalCyan',
                autoClose: 3000,
            });
        } else if (tool === 'marker') {
            setDrawMode('marker');
            notifications.show({
                title: 'Self Marker Mode',
                message: 'Click map to place your position marker',
                color: 'tacticalCyan',
                autoClose: 3000,
            });
        } else if (tool === 'hostile') {
            setDrawMode('hostile');
            notifications.show({
                title: 'Hostile Marker Mode',
                message: 'Click map to mark hostile contact',
                color: 'tacticalRed',
                autoClose: 3000,
            });
        } else if (tool === 'friendly') {
            setDrawMode('friendly');
            notifications.show({
                title: 'Friendly Marker Mode',
                message: 'Click map to mark friendly unit',
                color: 'tacticalGreen',
                autoClose: 3000,
            });
        } else if (tool === 'waypoint') {
            setDrawMode('waypoint');
            notifications.show({
                title: 'Waypoint Mode',
                message: 'Click map to place navigation waypoint',
                color: 'tacticalBlue',
                autoClose: 3000,
            });
        } else if (tool === 'alert') {
            setDrawMode('alert');
            notifications.show({
                title: 'Alert Mode',
                message: 'Click map to place alert marker',
                color: 'tacticalOrange',
                autoClose: 3000,
            });
        } else if (tool === 'casevac') {
            setDrawMode('casevac');
            notifications.show({
                title: 'CASEVAC Mode',
                message: 'Click map to request medical evacuation',
                color: 'tacticalRed',
                autoClose: 3000,
            });
        } else if (tool === 'circle') {
            setDrawMode('circle');
            notifications.show({
                title: 'Circle Mode',
                message: 'Click map to draw circle (1km radius)',
                color: 'tacticalCyan',
                autoClose: 3000,
            });
        } else if (tool === 'line') {
            setDrawMode('line');
            notifications.show({
                title: 'Line Mode',
                message: 'Click points. Right-click to finish.',
                color: 'tacticalOrange',
                autoClose: 3000,
            });
        } else if (tool === 'polygon') {
            setDrawMode('polygon');
            notifications.show({
                title: 'Polygon Mode',
                message: 'Click vertices (min 3). Right-click to complete.',
                color: 'tacticalGreen',
                autoClose: 3000,
            });
        } else if (tool === 'rectangle') {
            setDrawMode('rectangle');
            notifications.show({
                title: 'Rectangle Mode',
                message: 'Click two opposite corners',
                color: 'tacticalBlue',
                autoClose: 3000,
            });
        } else if (tool === 'send-cot') {
            setShowMissionPanel(!showMissionPanel);
        }
    };

    // Handle clear all
    const handleClearAll = () => {
        measureLayerRef.current.clearLayers();
        drawLayerRef.current.clearLayers();
        setMeasurePoints([]);
        setLinePoints([]);
        setPolygonPoints([]);
        measureLineRef.current = null;
        drawLineRef.current = null;
        setMeasureMode(false);
        setDrawMode('none');
        setSelectedTool('none');
        if (tempMarker && mapRef.current) {
            mapRef.current.removeLayer(tempMarker);
            setTempMarker(null);
        }
        if (mapRef.current) {
            mapRef.current.closePopup();
        }
        notifications.show({
            title: 'Cleared',
            message: 'All tactical graphics removed',
            color: 'tacticalRed',
            autoClose: 2000,
        });
    };

    // Fetch sensor heatmap data
    const fetchHeatmapData = async () => {
        try {
            const response = await axios.get('/api/markers', {
                params: { per_page: 1000, group_name: 'RF_Sensors' }
            });
            
            if (response.data && response.data.results) {
                const heatPoints: any[] = [];
                
                response.data.results.forEach((marker: any) => {
                    if (marker.point && marker.point.lat && marker.point.lon) {
                        let intensity = 0.5; // default
                        
                        // Calculate intensity based on type
                        if (heatmapType === 'rf_signals') {
                            // More signals = hotter
                            intensity = 0.8;
                        } else if (heatmapType === 'rf_power') {
                            // Higher power = hotter (convert dbm to 0-1 scale)
                            const powerDbm = marker.power_dbm || -100;
                            intensity = Math.min(1, Math.max(0, (powerDbm + 100) / 50));
                        } else if (heatmapType === 'threat') {
                            // Threat level based on signal type or frequency
                            if (marker.signal_type?.includes('Jammer') || marker.signal_type?.includes('Hostile')) {
                                intensity = 1.0;
                            } else if (marker.signal_type?.includes('Drone')) {
                                intensity = 0.7;
                            } else {
                                intensity = 0.3;
                            }
                        }
                        
                        heatPoints.push([marker.point.lat, marker.point.lon, intensity]);
                    }
                });
                
                setHeatmapData(heatPoints);
                updateHeatmapLayer(heatPoints);
            }
        } catch (error) {
            console.error('Failed to fetch heatmap data:', error);
        }
    };

    // Update heatmap layer
    const updateHeatmapLayer = (data: any[]) => {
        if (!mapRef.current) return;
        
        // Remove existing heatmap layer
        if (heatmapLayerRef.current) {
            mapRef.current.removeLayer(heatmapLayerRef.current);
        }
        
        if (data.length > 0 && showHeatmap) {
            // @ts-ignore - leaflet.heat types
            heatmapLayerRef.current = (L as any).heatLayer(data, {
                radius: 25,
                blur: 35,
                maxZoom: 17,
                max: 1.0,
                gradient: heatmapType === 'threat' 
                    ? {0.0: 'green', 0.5: 'yellow', 0.75: 'orange', 1.0: 'red'}
                    : {0.0: 'blue', 0.5: 'cyan', 0.75: 'yellow', 1.0: 'red'}
            }).addTo(mapRef.current);
        }
    };

    // Effect to fetch heatmap data when enabled or type changes
    useEffect(() => {
        if (showHeatmap) {
            fetchHeatmapData();
            const interval = setInterval(fetchHeatmapData, 10000); // Update every 10s
            return () => clearInterval(interval);
        } else if (heatmapLayerRef.current && mapRef.current) {
            mapRef.current.removeLayer(heatmapLayerRef.current);
            heatmapLayerRef.current = null;
        }
    }, [showHeatmap, heatmapType]);

    function formatDrawer(eud:any, point:any) {
        const detail_rows:ReactElement[] = [];
        const position_rows:ReactElement[] = [];

        if (eud !== null) {
            Object.keys(eud).map((key, index) => {
                if (key !== 'point' && key !== 'last_point' && key !== 'icon' && key !== 'zmist' && key !== 'eud' && key !== 'data_packages') {
                    let value = eud[key];
                    if (eud[key] === true) {
                        value = 'True';
                    } else if (eud[key] === false) {
                        value = 'False';
                    }
                    detail_rows.push(
                        <Table.Tr>
                            <Table.Td><Text fw={700}>{key}</Text></Table.Td>
                            <Table.Td>{value}</Table.Td>
                        </Table.Tr>
                    );
                } else if (key === 'icon' && eud[key] !== null) {
                    detail_rows.push(
                        <Table.Tr>
                            <Table.Td><Text fw={700}>{key}</Text></Table.Td>
                            <Table.Td><Image src={eud[key].bitmap} w="auto" fit="contain" /></Table.Td>
                        </Table.Tr>
                    );
                } else if ((key === 'point' || key === 'last_point') && eud[key] !== null) {
                    Object.keys(eud[key]).map((point_key, point_index) => {
                        position_rows.push(
                            <Table.Tr>
                                <Table.Td><Text fw={700}>{point_key}</Text></Table.Td>
                                <Table.Td>{eud[key][point_key]}
                                </Table.Td>
                            </Table.Tr>
                        );
                        return null;
                    });
                } else if (key === 'zmist' && eud[key] !== null) {
                    Object.keys(eud[key]).map((zmist_key, zmist_index) => {
                        detail_rows.push(
                            <Table.Tr>
                                <Table.Td><Text fw={700}>{zmist_key}</Text></Table.Td>
                                <Table.Td>{eud[key][zmist_key]}</Table.Td>
                            </Table.Tr>
                        );
                    });
                    return null;
                }
            });

            setDetailRows(detail_rows);
            setPositionRows(position_rows);
        }

        if (point !== null) {
            Object.keys(point).map((point_key, point_index) => {
                position_rows.push(
                    <Table.Tr>
                        <Table.Td><Text fw={700}>{point_key}</Text></Table.Td>
                        <Table.Td>{point[point_key]}</Table.Td>
                    </Table.Tr>
                );

                return null;
            });
            setPositionRows(position_rows);
        }

        return null;
    }

    function handleFov(point:any) {
        if (!point) return;

        const uid = point.device_uid;

        let fov;
        if (Object.hasOwn(fovs, uid)) {
            fov = fovs[uid];
        }
        if (point.fov !== null) {
            let angle1 = point.azimuth - point.fov / 2;
            if (angle1 < 0) angle1 = 360 + angle1;

            let angle2 = point.azimuth + point.fov / 2;
            if (angle2 === 360) angle2 = 0;
            else if (angle2 > 360) angle2 -= 360;

            const p1 = GreatCircle.destination(point.latitude, point.longitude, angle1, 100, 'M');
            const p2 = GreatCircle.destination(point.latitude, point.longitude, angle2, 100, 'M');

            if (!fov) {
                fov = L.polygon(
                    [[point.latitude, point.longitude], [p1.LAT, p1.LON], [p2.LAT, p2.LON]],
                    { color: 'gray' }
                );
                fovsLayer.addLayer(fov);
                fovs[uid] = fov;
                setFovs(fovs);
            } else {
                fovs[uid].setLatLngs([[point.latitude, point.longitude],
                    [p1.LAT, p1.LON], [p2.LAT, p2.LON]]);
            }
        }
    }

    function addEud(eud:any) {
        let className = classes.disconnected;
        if (eud.last_status === 'Connected') {
            className = classes.connected;
            handleFov(eud.last_point);
        } else if (Object.hasOwn(fovs, eud.uid)) {
            fovs[eud.uid].remove();
            delete fovs[eud.uid];
            setFovs(fovs);
        }

        let type = 'a-f-G-U-C';
        if (eud.last_point !== null) type = eud.last_point.type;
        else if (Object.hasOwn(eud, 'type')) type = eud.type;

        let icon = L.divIcon({
            html: renderToString(<Arrow fillColor={eud.team_color} className={className} />),
            iconSize: [40, 40],
            iconAnchor: [12, 24],
            popupAnchor: [7, -20],
            tooltipAnchor: [-4, -20],
            className,
        });

        // Video streams, most likely OpenTAK ICU
        if (type === 'b-m-p-s-p-loc') {
            icon = L.divIcon({
                html: renderToString(<Video />),
                iconSize: [40, 40],
                iconAnchor: [12, 24],
                popupAnchor: [7, -20],
                tooltipAnchor: [-4, -20],
                className: classes.connected,
            });
        }

        const { uid } = eud;

        if (Object.hasOwn(markers, uid)) {
            markers[uid].setIcon(icon);
            markers[uid].on('click', (e) => {
                setDrawerTitle(eud.callsign);
                formatDrawer(eud, null);
                open();
            });
        } else {
            const marker = L.marker(
                [999, 999],

                { icon, rotationOrigin: 'center center' });

            if (eud.last_point !== null) marker.setLatLng([eud.last_point.latitude, eud.last_point.longitude]);

            marker.on('click', (e) => {
                setDrawerTitle(eud.callsign);
                formatDrawer(eud, null);
                open();
            });

            marker.bindTooltip(eud.callsign, {
                opacity: 0.7,
                permanent: true,
                direction: 'bottom',
                offset: [12, 35],
            });

            if (eud.last_point !== null && eud.last_point.azimuth !== null) {
                marker.setRotationAngle(eud.last_point.azimuth - 90); //Rotate 90 degrees counter-clockwise because the icon points to the east
            } else if (eud.last_point !== null && eud.last_point.course !== null) {
                marker.setRotationAngle(eud.last_point.course);
            }

            eudsLayer.addLayer(marker);
            markers[eud.uid] = marker;
            setMarkers(markers);
        }
    }

    function MapClickHandler() {
        const map = useMap();
        
        useMapEvents({
            mousemove: (e) => {
                setCurrentCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
                
                // Show temporary marker for placement tools
                if (['marker', 'hostile', 'friendly', 'waypoint', 'alert', 'casevac'].includes(drawMode)) {
                    if (tempMarker) {
                        tempMarker.setLatLng(e.latlng);
                    } else {
                        const icon = L.divIcon({
                            className: 'tactical-marker-temp',
                            html: `<div style="background: rgba(100, 255, 218, 0.5); width: 20px; height: 20px; border-radius: 50%; border: 2px solid #64ffda; box-shadow: 0 0 15px #64ffda;"></div>`,
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        });
                        const marker = L.marker(e.latlng, { icon }).addTo(map);
                        setTempMarker(marker);
                    }
                } else if (tempMarker) {
                    map.removeLayer(tempMarker);
                    setTempMarker(null);
                }
            },
            click: (e) => {
                if (measureMode) {
                    const newPoints = [...measurePoints, e.latlng];
                    setMeasurePoints(newPoints);
                    
                    // Add marker at click point
                    const marker = L.circleMarker(e.latlng, {
                        radius: 5,
                        fillColor: '#64ffda',
                        color: '#0a0e14',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 1
                    });
                    measureLayerRef.current.addLayer(marker);
                    
                    // Update or create polyline
                    if (newPoints.length > 1) {
                        // Remove old line if exists
                        if (measureLineRef.current) {
                            measureLayerRef.current.removeLayer(measureLineRef.current);
                        }
                        
                        // Calculate total distance
                        const totalDistance = newPoints.reduce((acc, point, i) => {
                            if (i === 0) return 0;
                            return acc + point.distanceTo(newPoints[i - 1]);
                        }, 0);
                        
                        // Create new polyline
                        const line = L.polyline(newPoints, {
                            color: '#64ffda',
                            weight: 3,
                            opacity: 0.8,
                            dashArray: '10, 5'
                        });
                        
                        // Add popup at the last point showing total distance
                        const popup = L.popup({
                            closeButton: true,
                            autoClose: false,
                            closeOnClick: false
                        })
                        .setLatLng(e.latlng)
                        .setContent(`<div style="color: #64ffda; font-family: 'JetBrains Mono', monospace; background: #0a0e14; padding: 8px; border-radius: 4px;">
                            <strong style="color: #00e38a;">TOTAL DISTANCE</strong><br>
                            <span style="font-size: 16px; font-weight: bold;">${(totalDistance / 1000).toFixed(3)} km</span><br>
                            <span style="font-size: 12px;">${totalDistance.toFixed(0)} meters</span><br>
                            <span style="font-size: 10px; color: #888;">Points: ${newPoints.length}</span>
                        </div>`)
                        .openOn(map);
                        
                        measureLayerRef.current.addLayer(line);
                        measureLineRef.current = line;
                        
                        // Show notification for segment distance if more than 2 points
                        if (newPoints.length > 2) {
                            const segmentDist = e.latlng.distanceTo(newPoints[newPoints.length - 2]);
                            notifications.show({
                                title: 'Segment Added',
                                message: `+${(segmentDist / 1000).toFixed(3)} km`,
                                color: 'tacticalCyan',
                                autoClose: 2000,
                            });
                        }
                    }
                } else if (drawMode === 'marker') {
                    // Clear temp marker
                    if (tempMarker) {
                        map.removeLayer(tempMarker);
                        setTempMarker(null);
                    }
                    
                    const marker = L.marker(e.latlng, {
                        icon: L.divIcon({
                            className: 'tactical-marker',
                            html: '<div style="background: #64ffda; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #0a0e14; box-shadow: 0 0 15px #64ffda;"></div>',
                            iconSize: [16, 16],
                            iconAnchor: [8, 8]
                        }),
                        draggable: true
                    });
                    
                    const popup = L.popup()
                        .setContent(`<div style="color: #64ffda; font-family: 'JetBrains Mono', monospace; background: #0a0e14; padding: 8px; border-radius: 4px;">
                            <strong style="color: #00e38a;">SELF MARKER</strong><br>
                            <strong>Lat:</strong> ${e.latlng.lat.toFixed(6)}<br>
                            <strong>Lon:</strong> ${e.latlng.lng.toFixed(6)}<br>
                            <button id="delete-${Date.now()}" style="margin-top: 4px; background: #ff4747; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>
                        </div>`)
                        .on('add', function() {
                            const deleteBtn = document.querySelector(`[id^="delete-"]`);
                            if (deleteBtn) {
                                deleteBtn.addEventListener('click', () => {
                                    drawLayerRef.current.removeLayer(marker);
                                    map.closePopup();
                                    notifications.show({
                                        title: 'Marker Deleted',
                                        message: 'Marker removed from map',
                                        color: 'tacticalRed',
                                        autoClose: 2000,
                                    });
                                });
                            }
                        });
                    
                    marker.bindPopup(popup).openPopup();
                    drawLayerRef.current.addLayer(marker);
                    
                    notifications.show({
                        title: 'Self Marker Placed',
                        message: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
                        color: 'tacticalCyan',
                        autoClose: 2000,
                    });
                } else if (drawMode === 'hostile') {
                    if (tempMarker) {
                        map.removeLayer(tempMarker);
                        setTempMarker(null);
                    }
                    
                    const marker = L.marker(e.latlng, {
                        icon: L.divIcon({
                            className: 'tactical-marker-hostile',
                            html: '<div style="background: #ff4747; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #0a0e14; box-shadow: 0 0 20px #ff4747; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">H</div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        }),
                        draggable: true
                    });
                    
                    const popup = L.popup()
                        .setContent(`<div style="color: #ff4747; font-family: 'JetBrains Mono', monospace; background: #0a0e14; padding: 8px; border-radius: 4px;">
                            <strong style="color: #ff4747;">⚠ HOSTILE CONTACT</strong><br>
                            <strong>Lat:</strong> ${e.latlng.lat.toFixed(6)}<br>
                            <strong>Lon:</strong> ${e.latlng.lng.toFixed(6)}<br>
                            <strong>Type:</strong> Unknown<br>
                            <button onclick="this.closest('.leaflet-popup').remove()" style="margin-top: 4px; background: #ff4747; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>
                        </div>`);
                    
                    marker.bindPopup(popup).openPopup();
                    drawLayerRef.current.addLayer(marker);
                    
                    notifications.show({
                        title: 'Hostile Marker Placed',
                        message: 'Hostile contact marked',
                        color: 'tacticalRed',
                        autoClose: 2000,
                    });
                } else if (drawMode === 'friendly') {
                    if (tempMarker) {
                        map.removeLayer(tempMarker);
                        setTempMarker(null);
                    }
                    
                    const marker = L.marker(e.latlng, {
                        icon: L.divIcon({
                            className: 'tactical-marker-friendly',
                            html: '<div style="background: #00e38a; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #0a0e14; box-shadow: 0 0 20px #00e38a; display: flex; align-items: center; justify-content: center; color: #0a0e14; font-weight: bold; font-size: 12px;">F</div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        }),
                        draggable: true
                    });
                    
                    const popup = L.popup()
                        .setContent(`<div style="color: #00e38a; font-family: 'JetBrains Mono', monospace; background: #0a0e14; padding: 8px; border-radius: 4px;">
                            <strong style="color: #00e38a;">✓ FRIENDLY UNIT</strong><br>
                            <strong>Lat:</strong> ${e.latlng.lat.toFixed(6)}<br>
                            <strong>Lon:</strong> ${e.latlng.lng.toFixed(6)}<br>
                            <strong>Status:</strong> Active<br>
                            <button onclick="this.closest('.leaflet-popup').remove()" style="margin-top: 4px; background: #ff4747; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>
                        </div>`);
                    
                    marker.bindPopup(popup).openPopup();
                    drawLayerRef.current.addLayer(marker);
                    
                    notifications.show({
                        title: 'Friendly Marker Placed',
                        message: 'Friendly unit marked',
                        color: 'tacticalGreen',
                        autoClose: 2000,
                    });
                } else if (drawMode === 'waypoint') {
                    if (tempMarker) {
                        map.removeLayer(tempMarker);
                        setTempMarker(null);
                    }
                    
                    const marker = L.marker(e.latlng, {
                        icon: L.divIcon({
                            className: 'tactical-marker-waypoint',
                            html: '<div style="background: #1a7fff; width: 18px; height: 18px; clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); border: 2px solid #0a0e14; box-shadow: 0 0 20px #1a7fff;"></div>',
                            iconSize: [18, 18],
                            iconAnchor: [9, 9]
                        }),
                        draggable: true
                    });
                    
                    const popup = L.popup()
                        .setContent(`<div style="color: #1a7fff; font-family: 'JetBrains Mono', monospace; background: #0a0e14; padding: 8px; border-radius: 4px;">
                            <strong style="color: #1a7fff;">📍 WAYPOINT</strong><br>
                            <strong>Lat:</strong> ${e.latlng.lat.toFixed(6)}<br>
                            <strong>Lon:</strong> ${e.latlng.lng.toFixed(6)}<br>
                            <button onclick="this.closest('.leaflet-popup').remove()" style="margin-top: 4px; background: #ff4747; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>
                        </div>`);
                    
                    marker.bindPopup(popup).openPopup();
                    drawLayerRef.current.addLayer(marker);
                    
                    notifications.show({
                        title: 'Waypoint Placed',
                        message: 'Navigation waypoint marked',
                        color: 'tacticalBlue',
                        autoClose: 2000,
                    });
                } else if (drawMode === 'alert') {
                    if (tempMarker) {
                        map.removeLayer(tempMarker);
                        setTempMarker(null);
                    }
                    
                    const marker = L.marker(e.latlng, {
                        icon: L.divIcon({
                            className: 'tactical-marker-alert',
                            html: '<div style="background: #ff9721; width: 22px; height: 22px; clip-path: polygon(50% 0%, 100% 100%, 0% 100%); border: 2px solid #0a0e14; box-shadow: 0 0 25px #ff9721; display: flex; align-items: center; justify-content: center; color: #0a0e14; font-weight: bold; font-size: 16px;">!</div>',
                            iconSize: [22, 22],
                            iconAnchor: [11, 11]
                        }),
                        draggable: true
                    });
                    
                    const popup = L.popup()
                        .setContent(`<div style="color: #ff9721; font-family: 'JetBrains Mono', monospace; background: #0a0e14; padding: 8px; border-radius: 4px;">
                            <strong style="color: #ff9721;">⚠ ALERT</strong><br>
                            <strong>Lat:</strong> ${e.latlng.lat.toFixed(6)}<br>
                            <strong>Lon:</strong> ${e.latlng.lng.toFixed(6)}<br>
                            <strong>Priority:</strong> Medium<br>
                            <button onclick="this.closest('.leaflet-popup').remove()" style="margin-top: 4px; background: #ff4747; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>
                        </div>`);
                    
                    marker.bindPopup(popup).openPopup();
                    drawLayerRef.current.addLayer(marker);
                    
                    notifications.show({
                        title: 'Alert Placed',
                        message: 'Alert marker placed',
                        color: 'tacticalOrange',
                        autoClose: 2000,
                    });
                } else if (drawMode === 'casevac') {
                    if (tempMarker) {
                        map.removeLayer(tempMarker);
                        setTempMarker(null);
                    }
                    
                    const marker = L.marker(e.latlng, {
                        icon: L.divIcon({
                            className: 'tactical-marker-casevac',
                            html: '<div style="background: #ff4747; width: 24px; height: 24px; border-radius: 4px; border: 3px solid white; box-shadow: 0 0 25px #ff4747; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">+</div>',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        }),
                        draggable: true
                    });
                    
                    const popup = L.popup()
                        .setContent(`<div style="color: #ff4747; font-family: 'JetBrains Mono', monospace; background: #0a0e14; padding: 8px; border-radius: 4px;">
                            <strong style="color: #ff4747;">🚑 CASEVAC</strong><br>
                            <strong>Lat:</strong> ${e.latlng.lat.toFixed(6)}<br>
                            <strong>Lon:</strong> ${e.latlng.lng.toFixed(6)}<br>
                            <strong>Priority:</strong> IMMEDIATE<br>
                            <strong>Status:</strong> Pending<br>
                            <button onclick="this.closest('.leaflet-popup').remove()" style="margin-top: 4px; background: #ff4747; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>
                        </div>`);
                    
                    marker.bindPopup(popup).openPopup();
                    drawLayerRef.current.addLayer(marker);
                    
                    notifications.show({
                        title: 'CASEVAC Requested',
                        message: 'Medical evacuation point marked',
                        color: 'tacticalRed',
                        autoClose: 3000,
                    });
                } else if (drawMode === 'circle') {
                    const circle = L.circle(e.latlng, {
                        radius: 1000,
                        color: '#64ffda',
                        fillColor: '#64ffda',
                        fillOpacity: 0.2,
                        weight: 2
                    });
                    
                    const popup = L.popup()
                        .setContent(`<div style="color: #64ffda; font-family: 'JetBrains Mono', monospace; background: #0a0e14; padding: 8px; border-radius: 4px;">
                            <strong style="color: #00e38a;">CIRCLE</strong><br>
                            <strong>Radius:</strong> 1000 m<br>
                            <strong>Center:</strong> ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}
                        </div>`);
                    
                    circle.bindPopup(popup).openPopup();
                    drawLayerRef.current.addLayer(circle);
                    
                    notifications.show({
                        title: 'Circle Drawn',
                        message: 'Radius: 1000m',
                        color: 'tacticalCyan',
                        autoClose: 2000,
                    });
                } else if (drawMode === 'line') {
                    const newLinePoints = [...linePoints, e.latlng];
                    setLinePoints(newLinePoints);
                    
                    // Add marker at click point
                    const marker = L.circleMarker(e.latlng, {
                        radius: 5,
                        fillColor: '#ff9721',
                        color: '#0a0e14',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 1
                    });
                    drawLayerRef.current.addLayer(marker);
                    
                    // Update or create polyline
                    if (newLinePoints.length > 1) {
                        // Remove old line if exists
                        if (drawLineRef.current) {
                            drawLayerRef.current.removeLayer(drawLineRef.current);
                        }
                        
                        // Create new polyline
                        const line = L.polyline(newLinePoints, {
                            color: '#ff9721',
                            weight: 3,
                            opacity: 0.8
                        });
                        
                        drawLayerRef.current.addLayer(line);
                        drawLineRef.current = line;
                        
                        notifications.show({
                            title: 'Line Extended',
                            message: `${newLinePoints.length} points`,
                            color: 'tacticalOrange',
                            autoClose: 2000,
                        });
                    }
                } else if (drawMode === 'polygon') {
                    const newPolygonPoints = [...polygonPoints, e.latlng];
                    setPolygonPoints(newPolygonPoints);
                    
                    // Add marker at click point
                    const marker = L.circleMarker(e.latlng, {
                        radius: 5,
                        fillColor: '#00e38a',
                        color: '#0a0e14',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 1
                    });
                    drawLayerRef.current.addLayer(marker);
                    
                    if (newPolygonPoints.length >= 3) {
                        // Show temp polygon
                        const tempPolygon = L.polygon(newPolygonPoints, {
                            color: '#00e38a',
                            fillColor: '#00e38a',
                            fillOpacity: 0.2,
                            weight: 2,
                            dashArray: '5, 5'
                        });
                        drawLayerRef.current.addLayer(tempPolygon);
                        
                        notifications.show({
                            title: 'Polygon Point Added',
                            message: `${newPolygonPoints.length} vertices. Right-click to complete.`,
                            color: 'tacticalGreen',
                            autoClose: 2000,
                        });
                    }
                } else if (drawMode === 'rectangle') {
                    if (polygonPoints.length === 0) {
                        // First corner
                        setPolygonPoints([e.latlng]);
                        const marker = L.circleMarker(e.latlng, {
                            radius: 6,
                            fillColor: '#1a7fff',
                            color: '#0a0e14',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 1
                        });
                        drawLayerRef.current.addLayer(marker);
                        
                        notifications.show({
                            title: 'Rectangle Started',
                            message: 'Click opposite corner',
                            color: 'tacticalBlue',
                            autoClose: 2000,
                        });
                    } else {
                        // Second corner - complete rectangle
                        const bounds = L.latLngBounds([polygonPoints[0], e.latlng]);
                        const rectangle = L.rectangle(bounds, {
                            color: '#1a7fff',
                            fillColor: '#1a7fff',
                            fillOpacity: 0.2,
                            weight: 2
                        });
                        
                        const popup = L.popup()
                            .setContent(`<div style="color: #1a7fff; font-family: 'JetBrains Mono', monospace; background: #0a0e14; padding: 8px; border-radius: 4px;">
                                <strong style="color: #1a7fff;">RECTANGLE</strong><br>
                                <strong>Area:</strong> ${(rectangle.getBounds().toBBoxString())}<br>
                            </div>`);
                        
                        rectangle.bindPopup(popup).openPopup();
                        drawLayerRef.current.addLayer(rectangle);
                        
                        // Reset for next rectangle
                        setPolygonPoints([]);
                        setDrawMode('none');
                        setSelectedTool('none');
                        
                        notifications.show({
                            title: 'Rectangle Completed',
                            message: 'Rectangle drawn successfully',
                            color: 'tacticalBlue',
                            autoClose: 2000,
                        });
                    }
                }
            },
            contextmenu: (e) => {
                // Right-click handler for completing polygons
                if (drawMode === 'polygon' && polygonPoints.length >= 3) {
                    const polygon = L.polygon(polygonPoints, {
                        color: '#00e38a',
                        fillColor: '#00e38a',
                        fillOpacity: 0.2,
                        weight: 2
                    });
                    
                    // Calculate approximate area using bounds
                    const bounds = polygon.getBounds();
                    const sw = bounds.getSouthWest();
                    const ne = bounds.getNorthEast();
                    const widthKm = sw.distanceTo(L.latLng(sw.lat, ne.lng)) / 1000;
                    const heightKm = sw.distanceTo(L.latLng(ne.lat, sw.lng)) / 1000;
                    const approxArea = widthKm * heightKm;
                    
                    const popup = L.popup()
                        .setContent(`<div style="color: #00e38a; font-family: 'JetBrains Mono', monospace; background: #0a0e14; padding: 8px; border-radius: 4px;">
                            <strong style="color: #00e38a;">POLYGON</strong><br>
                            <strong>Vertices:</strong> ${polygonPoints.length}<br>
                            <strong>Approx Area:</strong> ${approxArea.toFixed(3)} km²<br>
                        </div>`);
                    
                    polygon.bindPopup(popup).openPopup();
                    drawLayerRef.current.addLayer(polygon);
                    
                    // Reset
                    setPolygonPoints([]);
                    setDrawMode('none');
                    setSelectedTool('none');
                    
                    notifications.show({
                        title: 'Polygon Completed',
                        message: `${polygonPoints.length} vertices, ${approxArea.toFixed(3)} km²`,
                        color: 'tacticalGreen',
                        autoClose: 2000,
                    });
                } else if (drawMode === 'line' && linePoints.length >= 2) {
                    // Complete line drawing on right-click
                    setLinePoints([]);
                    drawLineRef.current = null;
                    setDrawMode('none');
                    setSelectedTool('none');
                    
                    notifications.show({
                        title: 'Line Completed',
                        message: 'Line drawing finished',
                        color: 'tacticalOrange',
                        autoClose: 2000,
                    });
                } else if (measureMode && measurePoints.length >= 2) {
                    // Complete measurement
                    setMeasureMode(false);
                    setMeasurePoints([]);
                    measureLineRef.current = null;
                    setSelectedTool('none');
                    
                    notifications.show({
                        title: 'Measurement Completed',
                        message: 'Measurement saved',
                        color: 'tacticalCyan',
                        autoClose: 2000,
                    });
                }
            }
        });
        return null;
    }

    function MapContext() {
        const map = useMap();
        const fullscreenControlRef = useRef<L.Control.Fullscreen | null>(null);
        
        useEffect(() => {
            mapRef.current = map;
            
            // Add ESC key handler to cancel drawing modes
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    setMeasureMode(false);
                    setDrawMode('none');
                    setSelectedTool('none');
                    setMeasurePoints([]);
                    setLinePoints([]);
                    setPolygonPoints([]);
                    
                    if (tempMarker) {
                        map.removeLayer(tempMarker);
                        setTempMarker(null);
                    }
                    
                    notifications.show({
                        title: 'Tool Cancelled',
                        message: 'Drawing mode cancelled',
                        color: 'gray',
                        autoClose: 1500,
                    });
                }
            };
            
            document.addEventListener('keydown', handleKeyDown);
            
            const fullscreenControl = L.control.fullscreen();
            fullscreenControlRef.current = fullscreenControl;
            map.addControl(fullscreenControl);
            map.addLayer(measureLayerRef.current);
            map.addLayer(drawLayerRef.current);
            
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }, [map]);

        // Handle ADS-B toggle - show/hide aircraft markers
        useEffect(() => {
            if (!mapRef.current) return;
            
            Object.entries(markers).forEach(([uid, marker]) => {
                // Check if this marker is an ADS-B aircraft
                // We can identify it by checking if it has mil_std_2525c with Air battle dimension
                const markerElement = marker.getElement();
                const isADSB = markerElement?.querySelector('svg')?.innerHTML?.includes('air') || 
                               uid.startsWith('ICAO-'); // Common ADS-B UID pattern
                
                if (isADSB && mapRef.current) {
                    if (showADSB) {
                        if (!mapRef.current.hasLayer(marker)) {
                            marker.addTo(markersLayer);
                        }
                    } else {
                        if (mapRef.current.hasLayer(marker)) {
                            mapRef.current.removeLayer(marker);
                        }
                    }
                }
            });
        }, [showADSB]);

        useEffect(() => {
            map.addLayer(eudsLayer);
            map.addLayer(rbLinesLayer);
            map.addLayer(markersLayer);
            map.addLayer(fovsLayer);

            function onPointEvent(point: any) {
                const { uid } = point;
                if (Object.hasOwn(markers, uid)) {
                    // filter out values of 999999
                    if (point.longitude <= 180) {
                        // @ts-expect-error trust me bro
                        markers[uid].slideTo([point.latitude, point.longitude],
                            { duration: 1500, keepAtCenter: false });
                        if (point.azimuth !== null) {
                            markers[uid].setRotationAngle(point.azimuth - 90);
                        } else {
                            markers[uid].setRotationAngle(point.course);
                        }
                        formatDrawer(null, point);
                    }
                }

                // Update the FOV polygon if there is one
                handleFov(point);
            }

            function onCaseEvac(value: any) {
                const { uid } = value;
                const marker = L.marker([value.point.latitude, value.point.longitude]);
                marker.bindTooltip(value.title, {
                    opacity: 0.7,
                    permanent: true,
                    direction: 'bottom',
                    offset: [12, 35],
                });

                marker.on('click', (e) => {
                    setDrawerTitle(value.title);
                    formatDrawer(value, null);
                    open();
                });

                marker.setIcon(L.icon({
                    iconUrl: value.icon.bitmap,
                    shadowUrl: value.icon.shadow,
                    iconAnchor: [12, 24],
                    popupAnchor: [7, -20],
                    tooltipAnchor: [-7, -15],
                }));

                if (Object.hasOwn(markers, uid)) {
                    // @ts-expect-error trust me bro
                    markers[uid].slideTo([value.point.latitude, value.point.longitude],
                        { duration: 2000, keepAtCenter: false });
                } else {
                    marker.addTo(markersLayer);
                }
                markers[uid] = marker;
                setMarkers(markers);
            }

            function onRBLine(value: any) {
                const { uid } = value;
                if (Object.hasOwn(rbLines, uid)) {
                    map.removeLayer(rbLines[uid]);
                }
                const start_point = [value.point.latitude, value.point.longitude];
                const end_point = [value.end_latitude, value.end_longitude];
                rbLines[uid] = L.polyline([start_point, end_point], {
                    color: `#${value.color_hex.slice(2)}`,
                    weight: value.stroke_weight,
                }).addTo(rbLinesLayer);
                setRBLines(rbLines);
            }

            function onMarker(value: any) {
                const { uid } = value;

                if (Object.hasOwn(value, 'iconset_path') &&
                    value.iconset_path !== null &&
                    value.iconset_path.includes('COT_MAPPING_SPOTMAP')) {
                        if (Object.hasOwn(circles, uid)) {
                            map.removeLayer(circles[uid]);
                        }
                        const circle = L.circle(
                            [value.point.latitude, value.point.longitude],
                            { radius: 5, color: `#${value.color_hex.slice(2)}` }
                        );
                        circle.bindTooltip(value.callsign, {
                            opacity: 0.7,
                            permanent: true,
                            direction: 'bottom',
                        });
                        circle.on('click', (e) => {
                            setDrawerTitle(value.callsign);
                            formatDrawer(value, null);
                            open();
                        });
                        circles[uid] = circle;
                        setCircles(circles);
                        circle.addTo(map);
                } else {
                    let marker = L.marker([value.point.latitude, value.point.longitude]);
                    if (Object.hasOwn(markers, uid)) {
                        marker = markers[uid];
                    }

                    marker.bindTooltip(value.callsign, {
                        opacity: 0.8,
                        permanent: false,
                        direction: 'top',
                        offset: [0, -10],
                        className: 'tactical-tooltip',
                    });

                    marker.on('click', (e) => {
                        setDrawerTitle(value.callsign);
                        formatDrawer(value, null);
                        open();
                    });

                    if (value.mil_std_2525c !== null && value.icon === null) {
                        const options: any = { size: 25, direction: undefined };
                        if (value.point !== null && value.point.azimuth !== null) {
                            options.direction = value.point.azimuth;
                        } else if (value.point !== null && value.point.course !== null) {
                            options.direction = value.point.course;
                        }
                        
                        // Apply tactical theme colors based on affiliation
                        const affiliation = value.mil_std_2525c.charAt(1); // Extract affiliation character
                        if (affiliation === 'f') {
                            options.fillColor = '#64FFDA'; // tacticalCyan for friendly
                            options.iconColor = '#64FFDA';
                        } else if (affiliation === 'h') {
                            options.fillColor = '#FF6B6B'; // tacticalRed for hostile
                            options.iconColor = '#FF6B6B';
                        } else if (affiliation === 'n') {
                            options.fillColor = '#51CF66'; // tacticalGreen for neutral
                            options.iconColor = '#51CF66';
                        } else if (affiliation === 'u') {
                            options.fillColor = '#FFB84D'; // tacticalOrange for unknown
                            options.iconColor = '#FFB84D';
                        }
                        
                        const symbol = new milsymbol.default.Symbol(value.mil_std_2525c, options);
                        marker.setIcon(L.divIcon({
                            className: '',
                            html: symbol.asSVG(),
                            iconAnchor: new L.Point(symbol.getAnchor().x, symbol.getAnchor().y),
                            tooltipAnchor: [0, -15],
                        }));
                    } else if (value.icon !== null) {
                        marker.setIcon(L.icon({
                            iconUrl: value.icon.bitmap,
                            shadowUrl: value.icon.shadow,
                            iconAnchor: [12, 24],
                            popupAnchor: [7, -20],
                            tooltipAnchor: [-7, -15],
                        }));
                    } else {
                        marker.setIcon(L.icon({
                            iconUrl: '/map_icons/marker-icon.png',
                            shadowUrl: '/map_icons/marker-shadow.png',
                            iconAnchor: [12, 24],
                            popupAnchor: [7, -20],
                            tooltipAnchor: [-4, -10],
                        }));
                    }

                    // Check if this is an ADS-B aircraft (battle_dimension === 'A' for Air)
                    const isADSB = value.battle_dimension === 'A' || 
                                   (value.type && value.type.includes('-A-'));
                    
                    if (Object.hasOwn(markers, uid)) {
                        // @ts-expect-error trust me bro
                        markers[uid].slideTo([value.point.latitude, value.point.longitude],
                            { duration: 2000, keepAtCenter: false });
                        
                        // Show/hide based on ADS-B toggle
                        if (isADSB) {
                            if (showADSB) {
                                if (!map.hasLayer(markers[uid])) {
                                    markers[uid].addTo(markersLayer);
                                }
                            } else {
                                if (map.hasLayer(markers[uid])) {
                                    map.removeLayer(markers[uid]);
                                }
                            }
                        }
                    } else {
                        // Only add to map if it's not ADS-B or if ADS-B toggle is on
                        if (!isADSB || showADSB) {
                            marker.addTo(markersLayer);
                        }
                    }
                    markers[uid] = marker;
                    setMarkers(markers);
                }
            }

            function onEud(value: any) {
                addEud(value);
            }

            if (!haveMapState) {
                axios.get(
                    apiRoutes.mapState
                ).then(r => {
                    if (r.status === 200) {
                        r.data.euds.map((eud: any, index: any) => {
                            addEud(eud);
                            return null;
                        });
                        r.data.markers.map((marker: any, index: any) => {
                            onMarker(marker);
                            return null;
                        });
                        r.data.rb_lines.map((rb_line: any, index: any) => {
                            onRBLine(rb_line);
                            return null;
                        });
                        r.data.casevacs.map((casevac: any, index: any) => {
                            onCaseEvac(casevac);
                            return null;
                        });
                    }
                }).catch(err => {
                    console.log(err);
                    notifications.show({
                        message: 'Failed to get map state',
                        color: 'red',
                        icon: <IconX />,
                    });
                });
                setHaveMapState(true);
            }

            socket.on('point', onPointEvent);
            socket.on('rb_line', onRBLine);
            socket.on('marker', onMarker);
            socket.on('eud', onEud);
            socket.on('casevac', onCaseEvac);

            return () => {
                socket.off('point', onPointEvent);
                socket.off('rb_line', onRBLine);
                socket.off('marker', onMarker);
                socket.off('eud', onEud);
                socket.off('casevac', onCaseEvac);

                // janky fix for duplicate fullscreen buttons
                const elementsToRemove =
                    fullscreenControlRef.current?.getContainer()?.getElementsByClassName('leaflet-control-zoom-fullscreen') ?? [];
                for (let i = 0; i < elementsToRemove.length; i++) {
                    elementsToRemove[i].remove();
                }
            };
        }, []);

        return null;
    }

    return (
        <>
            {/* Active Tool Indicator (Top Center) */}
            {(selectedTool !== 'none' || measureMode || drawMode !== 'none') && (
                <Paper
                    shadow="xl"
                    p="sm"
                    className="tactical-card"
                    style={{
                        position: 'fixed',
                        top: '5.5rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        backgroundColor: 'rgba(10, 14, 20, 0.95)',
                        border: '2px solid rgba(100, 255, 218, 0.6)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 0 30px rgba(100, 255, 218, 0.4)',
                        minWidth: '300px',
                        animation: 'pulse 2s ease-in-out infinite',
                    }}
                >
                    <Group justify="space-between" align="center">
                        <Group gap="xs">
                            <Badge
                                size="lg"
                                variant="filled"
                                color="tacticalCyan"
                                className="status-active"
                                leftSection={<IconActivity size={14} />}
                            >
                                TOOL ACTIVE
                            </Badge>
                            <Text size="sm" fw={700} className="text-glow-cyan" style={{ textTransform: 'uppercase' }}>
                                {measureMode ? 'Measuring Distance' : 
                                 drawMode === 'marker' ? 'Self Marker' :
                                 drawMode === 'hostile' ? 'Hostile Marker' :
                                 drawMode === 'friendly' ? 'Friendly Marker' :
                                 drawMode === 'waypoint' ? 'Waypoint' :
                                 drawMode === 'alert' ? 'Alert' :
                                 drawMode === 'casevac' ? 'CASEVAC' :
                                 drawMode === 'circle' ? 'Circle' :
                                 drawMode === 'line' ? 'Line Drawing' :
                                 drawMode === 'polygon' ? 'Polygon Drawing' :
                                 drawMode === 'rectangle' ? 'Rectangle' :
                                 selectedTool}
                            </Text>
                        </Group>
                        <Tooltip label="Press ESC to cancel">
                            <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="gray"
                                onClick={() => {
                                    setMeasureMode(false);
                                    setDrawMode('none');
                                    setSelectedTool('none');
                                    setMeasurePoints([]);
                                    setLinePoints([]);
                                    setPolygonPoints([]);
                                    if (tempMarker && mapRef.current) {
                                        mapRef.current.removeLayer(tempMarker);
                                        setTempMarker(null);
                                    }
                                }}
                            >
                                <IconX size={14} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                    <Text size="xs" c="dimmed" mt="xs">
                        {measureMode && 'Click points on map. Right-click to finish measurement.'}
                        {drawMode === 'marker' && 'Click on map to place your position marker.'}
                        {drawMode === 'hostile' && 'Click on map to mark hostile contact.'}
                        {drawMode === 'friendly' && 'Click on map to mark friendly unit.'}
                        {drawMode === 'waypoint' && 'Click on map to place navigation waypoint.'}
                        {drawMode === 'alert' && 'Click on map to place alert marker.'}
                        {drawMode === 'casevac' && 'Click on map to request medical evacuation.'}
                        {drawMode === 'circle' && 'Click on map to draw 1km radius circle.'}
                        {drawMode === 'line' && 'Click to add points. Right-click to finish line.'}
                        {drawMode === 'polygon' && 'Click vertices (minimum 3). Right-click to complete polygon.'}
                        {drawMode === 'rectangle' && 'Click two opposite corners to draw rectangle.'}
                    </Text>
                </Paper>
            )}

            {/* Right Side Status Panel */}
            <Paper
                shadow="xl"
                className="tactical-card"
                style={{
                    position: 'fixed',
                    top: '5.5rem',
                    right: showSidebar ? '10px' : '-400px',
                    width: '400px',
                    maxHeight: 'calc(100vh - 6rem)',
                    overflowY: 'auto',
                    zIndex: 1000,
                    backgroundColor: 'rgba(10, 14, 20, 0.95)',
                    border: '1px solid rgba(100, 255, 218, 0.4)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 0 30px rgba(100, 255, 218, 0.2)',
                    transition: 'right 0.3s ease-in-out',
                }}
            >
                <Stack gap="md" p="md">
                    <Group justify="space-between">
                        <Badge 
                            size="lg" 
                            variant="light" 
                            color="tacticalGreen"
                            className="status-online"
                            leftSection={<IconTarget size={14} />}
                        >
                            {Object.keys(markers).length} Contacts
                        </Badge>
                        <Tooltip label={showSidebar ? "Hide Panel" : "Show Panel"}>
                            <ActionIcon 
                                size="lg"
                                variant="light"
                                color="tacticalCyan"
                                onClick={() => setShowSidebar(!showSidebar)}
                            >
                                {showSidebar ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
                            </ActionIcon>
                        </Tooltip>
                    </Group>

                    <Divider color="rgba(100, 255, 218, 0.3)" />

                    {/* Coordinate Display */}
                    {currentCoords && (
                        <>
                            <Stack gap="xs">
                                <Text size="xs" fw={700} className="text-glow-cyan" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Coordinates
                                </Text>
                                <Group gap="xs" justify="space-between">
                                    <Group gap="xs">
                                        <IconWorldLatitude size={16} color="#64ffda" />
                                        <Text size="sm" fw={500}>
                                            {coordinateFormat === 'DD' 
                                                ? `${currentCoords.lat.toFixed(6)}°` 
                                                : coordinateFormat === 'DMS' 
                                                    ? convertToDMS(currentCoords.lat, 'lat')
                                                    : '18T WM 12345'}
                                        </Text>
                                    </Group>
                                </Group>
                                <Group gap="xs" justify="space-between">
                                    <Group gap="xs">
                                        <IconWorldLongitude size={16} color="#64ffda" />
                                        <Text size="sm" fw={500}>
                                            {coordinateFormat === 'DD' 
                                                ? `${currentCoords.lng.toFixed(6)}°` 
                                                : coordinateFormat === 'DMS' 
                                                    ? convertToDMS(currentCoords.lng, 'lng')
                                                    : '67890'}
                                        </Text>
                                    </Group>
                                </Group>
                                <SegmentedControl
                                    size="xs"
                                    value={coordinateFormat}
                                    onChange={(value: any) => setCoordinateFormat(value)}
                                    data={[
                                        { label: 'DD', value: 'DD' },
                                        { label: 'DMS', value: 'DMS' },
                                        { label: 'MGRS', value: 'MGRS' },
                                    ]}
                                    color="tacticalCyan"
                                />
                            </Stack>
                            <Divider color="rgba(100, 255, 218, 0.3)" />
                        </>
                    )}

                    {/* ATAK Tools */}
                    <Stack gap="xs">
                        <Text size="xs" fw={700} className="text-glow-cyan" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                            ATAK Tools
                        </Text>
                        <Group gap="xs" wrap="wrap">
                            <Tooltip label="Self Marker">
                                <ActionIcon
                                    size="lg"
                                    variant={selectedTool === 'marker' ? 'filled' : 'light'}
                                    color="tacticalCyan"
                                    onClick={() => handleToolSelect('marker')}
                                >
                                    <IconMapPin size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Hostile Marker">
                                <ActionIcon
                                    size="lg"
                                    variant={selectedTool === 'hostile' ? 'filled' : 'light'}
                                    color="tacticalRed"
                                    onClick={() => handleToolSelect('hostile')}
                                >
                                    <IconTarget size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Friendly Marker">
                                <ActionIcon
                                    size="lg"
                                    variant={selectedTool === 'friendly' ? 'filled' : 'light'}
                                    color="tacticalGreen"
                                    onClick={() => handleToolSelect('friendly')}
                                >
                                    <IconUsers size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="CASEVAC">
                                <ActionIcon
                                    size="lg"
                                    variant={selectedTool === 'casevac' ? 'filled' : 'light'}
                                    color="tacticalRed"
                                    onClick={() => handleToolSelect('casevac')}
                                >
                                    <IconFirstAidKit size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Alert">
                                <ActionIcon
                                    size="lg"
                                    variant={selectedTool === 'alert' ? 'filled' : 'light'}
                                    color="tacticalOrange"
                                    onClick={() => handleToolSelect('alert')}
                                >
                                    <IconAlertTriangle size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Waypoint">
                                <ActionIcon
                                    size="lg"
                                    variant={selectedTool === 'waypoint' ? 'filled' : 'light'}
                                    color="tacticalBlue"
                                    onClick={() => handleToolSelect('waypoint')}
                                >
                                    <IconFlag size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Measure Distance">
                                <ActionIcon
                                    size="lg"
                                    variant={selectedTool === 'measure' ? 'filled' : 'light'}
                                    color="tacticalCyan"
                                    onClick={() => handleToolSelect('measure')}
                                >
                                    <IconRuler size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Draw Line">
                                <ActionIcon
                                    size="lg"
                                    variant={selectedTool === 'line' ? 'filled' : 'light'}
                                    color="tacticalOrange"
                                    onClick={() => handleToolSelect('line')}
                                >
                                    <IconRoute size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Draw Circle">
                                <ActionIcon
                                    size="lg"
                                    variant={selectedTool === 'circle' ? 'filled' : 'light'}
                                    color="tacticalCyan"
                                    onClick={() => handleToolSelect('circle')}
                                >
                                    <IconCircle size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Draw Polygon">
                                <ActionIcon
                                    size="lg"
                                    variant={selectedTool === 'polygon' ? 'filled' : 'light'}
                                    color="tacticalGreen"
                                    onClick={() => handleToolSelect('polygon')}
                                >
                                    <IconPolygon size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Draw Rectangle">
                                <ActionIcon
                                    size="lg"
                                    variant={selectedTool === 'rectangle' ? 'filled' : 'light'}
                                    color="tacticalBlue"
                                    onClick={() => handleToolSelect('rectangle')}
                                >
                                    <IconRectangle size={18} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Clear All">
                                <ActionIcon
                                    size="lg"
                                    variant="light"
                                    color="tacticalRed"
                                    onClick={handleClearAll}
                                >
                                    <IconTrash size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Stack>

                    <Divider color="rgba(100, 255, 218, 0.3)" />

                    <Stack gap="xs">
                        <Text size="xs" fw={700} className="text-glow-cyan" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                            C2 Dashboard
                        </Text>
                        {showC2Dashboard && (
                            <>
                                <Grid gutter="xs">
                                    <Grid.Col span={6}>
                                        <Paper p="xs" style={{ backgroundColor: 'rgba(100, 255, 218, 0.1)', border: '1px solid rgba(100, 255, 218, 0.3)' }}>
                                            <Stack gap={4} align="center">
                                                <IconUsers size={20} color="#4ade80" />
                                                <Text size="xl" fw={700} c="tacticalGreen">
                                                    {Math.floor(Object.keys(markers).length * 0.7)}
                                                </Text>
                                                <Text size="xs" c="dimmed">Friendly</Text>
                                            </Stack>
                                        </Paper>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Paper p="xs" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                            <Stack gap={4} align="center">
                                                <IconTarget size={20} color="#ef4444" />
                                                <Text size="xl" fw={700} c="tacticalRed">
                                                    {Math.floor(Object.keys(markers).length * 0.2)}
                                                </Text>
                                                <Text size="xs" c="dimmed">Hostile</Text>
                                            </Stack>
                                        </Paper>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Paper p="xs" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                                            <Stack gap={4} align="center">
                                                <IconAlertTriangle size={20} color="#fbbf24" />
                                                <Text size="xl" fw={700} c="tacticalOrange">
                                                    {Math.floor(Object.keys(markers).length * 0.1)}
                                                </Text>
                                                <Text size="xs" c="dimmed">Unknown</Text>
                                            </Stack>
                                        </Paper>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Paper p="xs" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                            <Stack gap={4} align="center">
                                                <IconShield size={20} color="#3b82f6" />
                                                <Text size="xl" fw={700} c="tacticalBlue">85%</Text>
                                                <Text size="xs" c="dimmed">Readiness</Text>
                                            </Stack>
                                        </Paper>
                                    </Grid.Col>
                                </Grid>
                                <Button
                                    variant="subtle"
                                    size="xs"
                                    color="tacticalCyan"
                                    onClick={() => setShowC2Dashboard(false)}
                                >
                                    Hide Dashboard
                                </Button>
                            </>
                        )}
                        {!showC2Dashboard && (
                            <Button
                                variant="light"
                                color="tacticalCyan"
                                fullWidth
                                leftSection={<IconActivity size={16} />}
                                onClick={() => setShowC2Dashboard(true)}
                            >
                                Show C2 Dashboard
                            </Button>
                        )}
                    </Stack>

                    <Divider color="rgba(100, 255, 218, 0.3)" />

                    <Stack gap="xs">
                        <Text size="xs" fw={700} className="text-glow-cyan" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                            C2 Panels
                        </Text>
                        <Button
                            variant="light"
                            color="tacticalRed"
                            fullWidth
                            leftSection={<IconAlertTriangle size={16} />}
                            onClick={() => setShowThreatTracker(!showThreatTracker)}
                        >
                            Threat Tracker
                        </Button>
                        <Button
                            variant="light"
                            color="tacticalBlue"
                            fullWidth
                            leftSection={<IconClock size={16} />}
                            onClick={() => setShowBattleRhythm(!showBattleRhythm)}
                        >
                            Battle Rhythm
                        </Button>
                    </Stack>

                    <Divider color="rgba(100, 255, 218, 0.3)" />

                    <Stack gap="xs">
                        <Text size="xs" fw={700} className="text-glow-cyan" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                            RF Sensor Heatmap
                        </Text>
                        <Switch 
                            label="Show Heatmap"
                            checked={showHeatmap}
                            onChange={(e) => setShowHeatmap(e.currentTarget.checked)}
                            color="tacticalCyan"
                            description="Visualize sensor data density"
                        />
                        {showHeatmap && (
                            <SegmentedControl
                                size="xs"
                                value={heatmapType}
                                onChange={(value: any) => setHeatmapType(value)}
                                data={[
                                    { label: 'Signals', value: 'rf_signals' },
                                    { label: 'Power', value: 'rf_power' },
                                    { label: 'Threats', value: 'threat' },
                                ]}
                                color="tacticalCyan"
                            />
                        )}
                    </Stack>

                    <Divider color="rgba(100, 255, 218, 0.3)" />

                    <Stack gap="xs">
                        <Text size="xs" fw={700} className="text-glow-cyan" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Tools
                        </Text>
                        <Button
                            variant="light"
                            color="tacticalGreen"
                            fullWidth
                            leftSection={<IconSend size={16} />}
                            onClick={() => setShowMissionPanel(!showMissionPanel)}
                        >
                            Mission Planning
                        </Button>
                    </Stack>

                    <Divider color="rgba(100, 255, 218, 0.3)" />

                    <Group gap="xs" align="center" justify="space-between">
                        <Text size="xs" c="dimmed">ADS-B Aircraft:</Text>
                        <Switch 
                            size="xs"
                            checked={showADSB}
                            onChange={(e) => setShowADSB(e.currentTarget.checked)}
                            color="tacticalCyan"
                        />
                    </Group>
                </Stack>
            </Paper>

            {/* Mission Planning Panel */}
            {showMissionPanel && (
                <MissionPlanning
                    onClose={() => setShowMissionPanel(false)}
                    onSendMission={(mission) => {
                        console.log('Sending mission:', mission);
                        notifications.show({
                            title: 'Mission Sent',
                            message: `${mission.name} sent to team`,
                            color: 'tacticalGreen',
                            autoClose: 3000,
                        });
                        setShowMissionPanel(false);
                    }}
                />
            )}

            {/* Threat Tracker */}
            {showThreatTracker && (
                <ThreatTracker onClose={() => setShowThreatTracker(false)} />
            )}

            {/* Battle Rhythm */}
            {showBattleRhythm && (
                <BattleRhythm onClose={() => setShowBattleRhythm(false)} />
            )}

            {/* Sidebar Toggle Button (when sidebar is hidden) */}
            {!showSidebar && (
                <ActionIcon
                    size="lg"
                    variant="filled"
                    color="tacticalCyan"
                    className="status-active"
                    style={{
                        position: 'fixed',
                        top: '6rem',
                        right: '10px',
                        zIndex: 1000,
                        boxShadow: '0 0 20px rgba(100, 255, 218, 0.5)',
                    }}
                    onClick={() => setShowSidebar(true)}
                >
                    <IconChevronLeft size={18} />
                </ActionIcon>
            )}

            <Drawer
              radius="md"
              position="right"
              opened={opened}
              onClose={close}
              title={drawerTitle}
              overlayProps={{ backgroundOpacity: 0 }}
              shadow="xl"
              styles={{
                content: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(100, 255, 218, 0.3)',
                },
                header: {
                    backgroundColor: 'rgba(10, 14, 20, 0.95)',
                    borderBottom: '1px solid rgba(100, 255, 218, 0.3)',
                },
                body: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                },
              }}
            >
                <Divider label="Details" labelPosition="left" color="rgba(100, 255, 218, 0.5)" />
                <Table>
                    {detailRows}
                </Table>
                <Divider label="Position" labelPosition="left" color="rgba(100, 255, 218, 0.5)" />
                <Table>
                    {positionRows}
                </Table>
            </Drawer>
            <Paper 
                shadow="xl" 
                radius="md" 
                p="md" 
                withBorder
                className="tactical-card tactical-paper"
                style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(100, 255, 218, 0.2)',
                }}
            >
                <MapContainer
                  center={[10, 0]}
                  zoom={3}
                  scrollWheelZoom
                  style={{ height: 'calc(100vh - 10rem)', width: '100%', zIndex: 90 }}
                >
                    <MapContext />
                    <MapClickHandler />
                    <ScaleControl position="bottomleft" />
                    <LayersControl>
                        {/* Dark Tactical Maps */}
                        <LayersControl.BaseLayer name="Dark Matter (Tactical)" checked={mapStyle === 'dark'}>
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                              zIndex={0}
                              minZoom={0}
                              maxZoom={20}
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="ESRI Dark Gray Canvas" checked={mapStyle === 'tactical'}>
                            <TileLayer
                              attribution='Tiles &copy; Esri'
                              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                              zIndex={0}
                              minZoom={0}
                              maxZoom={16}
                            />
                        </LayersControl.BaseLayer>
                        
                        {/* Standard Maps */}
                        <LayersControl.BaseLayer name="OSM">
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              zIndex={0}
                              minZoom={0}
                              maxZoom={20}
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Google Streets">
                            <TileLayer url="http://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" zIndex={0} minZoom={0} maxZoom={20} />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Google Hybrid" checked={mapStyle === 'satellite'}>
                            <TileLayer url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}&s=Ga" zIndex={0} minZoom={0} maxZoom={20} />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Google Terrain" checked={mapStyle === 'terrain'}>
                            <TileLayer url="http://mt1.google.com/vt/lyrs=p&amp;x={x}&amp;y={y}&amp;z={z}" zIndex={0} minZoom={0} maxZoom={20} />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="ESRI World Imagery (Clarity) Beta">
                            <TileLayer url="http://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" minZoom={0} maxZoom={20} />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="ESRI World Topo">
                            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" minZoom={0} maxZoom={20} />
                        </LayersControl.BaseLayer>
                    </LayersControl>
                    
                    {/* Tactical Overlays */}
                    <LayersControl position="topright">
                        <LayersControl.Overlay name="MGRS Grid Reference">
                            <TileLayer
                              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}"
                              pane="overlayPane"
                              opacity={0.6}
                            />
                        </LayersControl.Overlay>
                        <LayersControl.Overlay name="Google Street View Coverage">
                            <TileLayer
                              url="https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i{z}!2i{x}!3i{y}!2i9!3x1!2m8!1e2!2ssvv!4m2!1scc!2s*211m3*211e2*212b1*213e2*212b1*214b1!4m2!1ssvl!2s*211b0*212b1!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e0"
                              pane="overlayPane"
                            />
                        </LayersControl.Overlay>
                        <LayersControl.Overlay name="Weather Radar">
                            <WMSTileLayer
                              url="http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi"
                              params={{
                                layers: 'nexrad-n0r-900913',
                                format: 'image/png',
                                transparent: true }}
                              attribution="Weather data © 2012 IEM Nexrad"
                              pane="overlayPane"
                            />
                        </LayersControl.Overlay>
                        <LayersControl.Overlay name="Google Roads Overlay">
                            <TileLayer url="http://mt1.google.com/vt/lyrs=h&amp;x={x}&amp;y={y}&amp;z={z}" pane="overlayPane" />
                        </LayersControl.Overlay>
                        <LayersControl.Overlay name="Google Terrain Overlay">
                            <TileLayer url="http://mt1.google.com/vt/lyrs=t&amp;x={x}&amp;y={y}&amp;z={z}" pane="overlayPane" />
                        </LayersControl.Overlay>
                    </LayersControl>
                </MapContainer>
            </Paper>
        </>
    );
}
