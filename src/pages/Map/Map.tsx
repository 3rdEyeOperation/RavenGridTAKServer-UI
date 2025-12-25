import React, { ReactElement, useEffect, useState, useRef } from 'react';
import { renderToString } from 'react-dom/server';
import { LayersControl, MapContainer, ScaleControl, TileLayer, useMap, WMSTileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'react-leaflet-fullscreen/styles.css';
import 'leaflet.marker.slideto';
import 'leaflet-rotatedmarker';
import { Divider, Drawer, Image, Paper, Table, Text, useComputedColorScheme, ActionIcon, Group, Tooltip, Badge, Stack, Switch, SegmentedControl, Button, Collapse } from '@mantine/core';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { IconX, IconRuler, IconMapPin, IconCircle, IconRoute, IconCrosshair, IconStack2, Icon3dCubeSphere, IconTarget, IconCurrentLocation, IconChevronLeft, IconChevronRight, IconPolygon, IconRectangle, IconSquare, IconPencil, IconTrash, IconEdit, IconSend, IconUsers, IconMapSearch, IconCompass, IconAlertTriangle, IconFirstAidKit, IconBuildingCommunity, IconFlag, IconCamera, IconVideo, IconSettings, IconLayersLinked, IconPlus, IconMinus, IconMap2, IconWorldLatitude, IconWorldLongitude, IconLocation, IconClock, IconActivity } from '@tabler/icons-react';
import * as milsymbol from 'milsymbol';
import { useDisclosure } from '@mantine/hooks';
import GreatCircle from './GreatCircle';
import { apiRoutes } from '@/apiRoutes';
import { socket } from '@/socketio';
import classes from './Map.module.css';
import 'leaflet.fullscreen';
import 'leaflet.fullscreen/Control.FullScreen.css';
import Arrow from './Arrow';
import Video from './Video';
import { ATAKToolbar } from './ATAKToolbar';
import { CoordinateDisplay } from './CoordinateDisplay';
import { OverlayManager } from './OverlayManager';
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
    const [drawMode, setDrawMode] = useState<'none' | 'marker' | 'circle' | 'line' | 'polygon' | 'rectangle'>('none');
    const [showTrails, setShowTrails] = useState(false);
    const [mapStyle, setMapStyle] = useState<'satellite' | 'terrain' | 'dark' | 'tactical'>('satellite');
    const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [coordinateFormat, setCoordinateFormat] = useState<'DD' | 'DMS' | 'MGRS'>('DD');
    const [showMissionPanel, setShowMissionPanel] = useState(false);
    const [showOverlayManager, setShowOverlayManager] = useState(false);
    const [showC2Dashboard, setShowC2Dashboard] = useState(true);
    const [showThreatTracker, setShowThreatTracker] = useState(false);
    const [showBattleRhythm, setShowBattleRhythm] = useState(false);
    const mapRef = useRef<L.Map | null>(null);
    const measureLayerRef = useRef<L.LayerGroup>(new L.LayerGroup());
    const drawLayerRef = useRef<L.LayerGroup>(new L.LayerGroup());
    const measureLineRef = useRef<L.Polyline | null>(null);
    const drawLineRef = useRef<L.Polyline | null>(null);
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    const eudsLayer = new L.LayerGroup();
    const rbLinesLayer = new L.LayerGroup();
    const markersLayer = new L.LayerGroup();
    const fovsLayer = new L.LayerGroup();

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
                    const marker = L.marker(e.latlng, {
                        icon: L.divIcon({
                            className: 'tactical-marker',
                            html: '<div style="background: #64ffda; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #0a0e14; box-shadow: 0 0 15px #64ffda;"></div>',
                            iconSize: [16, 16],
                            iconAnchor: [8, 8]
                        })
                    });
                    
                    const popup = L.popup()
                        .setContent(`<div style="color: #64ffda; font-family: 'JetBrains Mono', monospace; background: #0a0e14; padding: 8px; border-radius: 4px;">
                            <strong style="color: #00e38a;">MARKER</strong><br>
                            <strong>Lat:</strong> ${e.latlng.lat.toFixed(6)}<br>
                            <strong>Lon:</strong> ${e.latlng.lng.toFixed(6)}
                        </div>`);
                    
                    marker.bindPopup(popup).openPopup();
                    drawLayerRef.current.addLayer(marker);
                    
                    notifications.show({
                        title: 'Marker Placed',
                        message: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
                        color: 'tacticalCyan',
                        autoClose: 2000,
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
            const fullscreenControl = L.control.fullscreen();
            fullscreenControlRef.current = fullscreenControl;
            map.addControl(fullscreenControl);
            map.addLayer(measureLayerRef.current);
            map.addLayer(drawLayerRef.current);
        }, [map]);

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
                        opacity: 0.7,
                        permanent: true,
                        direction: 'bottom',
                        offset: [12, 35],
                    });

                    marker.on('click', (e) => {
                        setDrawerTitle(value.callsign);
                        formatDrawer(value, null);
                        open();
                    });

                    if (value.mil_std_2525c !== null && value.icon === null) {
                        const options = { size: 25, direction: undefined };
                        if (value.point !== null && value.point.azimuth !== null) {
                            options.direction = value.point.azimuth;
                        } else if (value.point !== null && value.point.course !== null) {
                            options.direction = value.point.course;
                        }
                        const symbol = new milsymbol.default.Symbol(value.mil_std_2525c, options);
                        marker.setIcon(L.divIcon({
                            className: '',
                            html: symbol.asSVG(),
                            iconAnchor: new L.Point(symbol.getAnchor().x, symbol.getAnchor().y),
                            tooltipAnchor: [-13, -13],
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
            {/* ATAK-Style Toolbar (Left Side) */}
            <ATAKToolbar
                position="left"
                selectedTool={selectedTool}
                onToolSelect={(tool) => {
                    setSelectedTool(tool);
                    // Handle tool selection logic
                    if (tool === 'measure') {
                        setMeasureMode(true);
                        setDrawMode('none');
                    } else if (['marker', 'circle', 'line', 'polygon', 'rectangle'].includes(tool)) {
                        setDrawMode(tool as any);
                        setMeasureMode(false);
                    } else if (tool === 'send-cot') {
                        setShowMissionPanel(!showMissionPanel);
                    }
                }}
                onClearAll={() => {
                    measureLayerRef.current.clearLayers();
                    drawLayerRef.current.clearLayers();
                    setMeasurePoints([]);
                    setLinePoints([]);
                    measureLineRef.current = null;
                    drawLineRef.current = null;
                    setMeasureMode(false);
                    setDrawMode('none');
                    setSelectedTool('none');
                    if (mapRef.current) {
                        mapRef.current.closePopup();
                    }
                    notifications.show({
                        title: 'Cleared',
                        message: 'All tactical graphics removed',
                        color: 'tacticalRed',
                        autoClose: 2000,
                    });
                }}
            />

            {/* Right Side Status Panel */}
            <Paper
                shadow="xl"
                className="tactical-card"
                style={{
                    position: 'fixed',
                    top: '5.5rem',
                    right: showSidebar ? '10px' : '-320px',
                    width: '320px',
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

                    <Stack gap="xs">
                        <Text size="xs" fw={700} className="text-glow-cyan" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                            C2 Panels
                        </Text>
                        <Button
                            variant="light"
                            color="tacticalCyan"
                            fullWidth
                            leftSection={<IconActivity size={16} />}
                            onClick={() => setShowC2Dashboard(!showC2Dashboard)}
                        >
                            C2 Dashboard
                        </Button>
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
                            Tools
                        </Text>
                        <Button
                            variant="light"
                            color="tacticalBlue"
                            fullWidth
                            leftSection={<IconLayersLinked size={16} />}
                            onClick={() => setShowOverlayManager(!showOverlayManager)}
                        >
                            Overlay Manager
                        </Button>
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

                    <Stack gap="xs">
                        <Text size="xs" fw={700} className="text-glow-cyan" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Map Style
                        </Text>
                        <SegmentedControl
                            size="xs"
                            value={mapStyle}
                            onChange={(value) => setMapStyle(value as any)}
                            data={[
                                { label: 'Satellite', value: 'satellite' },
                                { label: 'Terrain', value: 'terrain' },
                                { label: 'Dark', value: 'dark' },
                                { label: 'Tactical', value: 'tactical' }
                            ]}
                            color="tacticalCyan"
                            orientation="vertical"
                            styles={{
                                root: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                },
                                label: {
                                    color: '#e8eaed',
                                    fontSize: '0.7rem',
                                    padding: '8px 12px',
                                }
                            }}
                        />
                    </Stack>

                    <Divider color="rgba(100, 255, 218, 0.3)" />

                    <Group gap="xs" align="center" justify="space-between">
                        <Text size="xs" c="dimmed">Track History:</Text>
                        <Switch 
                            size="xs"
                            checked={showTrails}
                            onChange={(e) => setShowTrails(e.currentTarget.checked)}
                            color="tacticalCyan"
                        />
                    </Group>
                </Stack>
            </Paper>

            {/* Coordinate Display (Bottom Center) */}
            {currentCoords && (
                <CoordinateDisplay
                    lat={currentCoords.lat}
                    lng={currentCoords.lng}
                    format={coordinateFormat}
                    onFormatChange={setCoordinateFormat}
                />
            )}

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

            {/* Overlay Manager Panel */}
            {showOverlayManager && (
                <OverlayManager onClose={() => setShowOverlayManager(false)} />
            )}

            {/* C2 Dashboard */}
            {showC2Dashboard && (
                <C2Dashboard
                    contacts={Object.keys(markers).length}
                    onClose={() => setShowC2Dashboard(false)}
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
