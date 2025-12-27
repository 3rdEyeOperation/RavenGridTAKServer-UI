/**
 * RavenGrid RF Sensor - CoT Message Generator
 * Generates Cursor on Target messages for RF detection events
 * Compatible with TAK Server without modifying core server code
 */

export interface RFDetection {
    sensor_id: string;
    sensor_name: string;
    timestamp: string;
    frequency_hz: number;
    power_dbm: number;
    bandwidth_hz: number;
    signal_type: string;
    classification: string;
    confidence: number;
    location: {
        lat: number;
        lon: number;
        alt?: number;
    };
    bearing?: number;
    metadata?: Record<string, any>;
}

export interface CoTEvent {
    uid: string;
    type: string;
    how: string;
    time: string;
    start: string;
    stale: string;
    point: {
        lat: number;
        lon: number;
        hae: number;
        ce: number;
        le: number;
    };
    detail: {
        contact?: {
            callsign: string;
        };
        remarks?: string;
        link?: Array<{
            uid: string;
            relation: string;
            type: string;
        }>;
        sensor?: {
            fov?: number;
            range?: number;
            azimuth?: number;
            elevation?: number;
        };
        rf_signal?: {
            frequency_mhz: number;
            power_dbm: number;
            bandwidth_khz: number;
            signal_type: string;
            classification: string;
            confidence: number;
            modulation?: string;
            snr_db?: number;
        };
    };
}

/**
 * Signal type to CoT type mapping
 * Military-grade classifications
 */
const SIGNAL_TYPE_MAP: Record<string, string> = {
    // Friendly communications
    'FM Broadcast': 'a-f-G-E-V-R',  // Friendly Ground Equipment Radio
    'WiFi 2.4GHz': 'a-f-G-E-W-C',   // Friendly Ground Equipment WiFi/Comms
    'WiFi 5GHz': 'a-f-G-E-W-C',
    'Bluetooth': 'a-f-G-E-W-C',
    
    // Cellular/Commercial
    'Cellular': 'a-n-G-E-C',        // Neutral Ground Equipment Cellular
    'TV Broadcast': 'a-n-G-E-V-T',  // Neutral Ground Equipment Video Television
    
    // Tactical/Military
    'Tactical Radio': 'a-f-G-E-V-M', // Friendly Ground Equipment Voice Military
    'SATCOM': 'a-f-G-E-S',           // Friendly Ground Equipment SATCOM
    
    // Unknown/Suspicious
    'Unknown': 'a-u-G-E-S',          // Unknown Ground Equipment Sensor
    'Jamming': 'a-h-G-E-S-J',        // Hostile Ground Equipment Sensor Jammer
    
    // Radar
    'Radar': 'a-u-G-E-S-R',          // Unknown Ground Equipment Sensor Radar
    'Search Radar': 'a-u-G-E-S-R-S', // Unknown Ground Equipment Sensor Radar Search
    'Track Radar': 'a-u-G-E-S-R-T',  // Unknown Ground Equipment Sensor Radar Track
};

/**
 * Generate CoT message UID
 */
function generateUID(detection: RFDetection): string {
    const timestamp = new Date(detection.timestamp).getTime();
    const freqMhz = (detection.frequency_hz / 1e6).toFixed(2);
    return `RF-${detection.sensor_id.substring(0, 8)}-${freqMhz}-${timestamp}`;
}

/**
 * Get CoT type based on signal classification
 */
function getCoTType(detection: RFDetection): string {
    return SIGNAL_TYPE_MAP[detection.signal_type] || 'a-u-G-E-S';
}

/**
 * Calculate stale time (when marker should disappear)
 * RF detections are ephemeral - default 5 minutes
 */
function calculateStaleTime(timestamp: string, ttlMinutes: number = 5): string {
    const date = new Date(timestamp);
    date.setMinutes(date.getMinutes() + ttlMinutes);
    return date.toISOString();
}

/**
 * Generate human-readable remarks for the RF detection
 */
function generateRemarks(detection: RFDetection): string {
    const freqMhz = (detection.frequency_hz / 1e6).toFixed(3);
    const bwKhz = (detection.bandwidth_hz / 1e3).toFixed(1);
    
    let remarks = `RF Detection: ${detection.signal_type}\n`;
    remarks += `Frequency: ${freqMhz} MHz\n`;
    remarks += `Power: ${detection.power_dbm.toFixed(1)} dBm\n`;
    remarks += `Bandwidth: ${bwKhz} kHz\n`;
    remarks += `Classification: ${detection.classification}\n`;
    remarks += `Confidence: ${(detection.confidence * 100).toFixed(0)}%\n`;
    remarks += `Sensor: ${detection.sensor_name}`;
    
    if (detection.bearing !== undefined) {
        remarks += `\nBearing: ${detection.bearing.toFixed(0)}°`;
    }
    
    return remarks;
}

/**
 * Generate a CoT Event from RF Detection
 */
export function generateCoTFromRFDetection(detection: RFDetection): CoTEvent {
    const uid = generateUID(detection);
    const cotType = getCoTType(detection);
    const time = new Date(detection.timestamp).toISOString();
    const stale = calculateStaleTime(detection.timestamp);
    
    const event: CoTEvent = {
        uid: uid,
        type: cotType,
        how: 'm-g',  // machine generated
        time: time,
        start: time,
        stale: stale,
        point: {
            lat: detection.location.lat,
            lon: detection.location.lon,
            hae: detection.location.alt || 0,
            ce: 25.0,  // Circular error (meters) - RF sensors have moderate positional accuracy
            le: 100.0  // Linear error (meters)
        },
        detail: {
            contact: {
                callsign: `${detection.signal_type} ${(detection.frequency_hz / 1e6).toFixed(1)}MHz`
            },
            remarks: generateRemarks(detection),
            rf_signal: {
                frequency_mhz: detection.frequency_hz / 1e6,
                power_dbm: detection.power_dbm,
                bandwidth_khz: detection.bandwidth_hz / 1e3,
                signal_type: detection.signal_type,
                classification: detection.classification,
                confidence: detection.confidence,
                modulation: detection.metadata?.modulation,
                snr_db: detection.metadata?.snr_db
            }
        }
    };
    
    // Add sensor link
    if (detection.sensor_id) {
        event.detail.link = [{
            uid: detection.sensor_id,
            relation: 'p-p',  // parent-child relationship
            type: 'a-f-G-E-S'  // Sensor equipment
        }];
    }
    
    // Add sensor orientation if bearing is provided
    if (detection.bearing !== undefined) {
        event.detail.sensor = {
            azimuth: detection.bearing,
            fov: 15,  // Field of view in degrees
            range: 5000  // Detection range in meters (5km default)
        };
    }
    
    return event;
}

/**
 * Generate CoT for RF Sensor (the sensor itself, not detection)
 */
export function generateSensorCoT(sensor: {
    id: string;
    name: string;
    location: { lat: number; lon: number; alt?: number };
    status: string;
    frequency_range?: { min_hz: number; max_hz: number };
}): CoTEvent {
    const time = new Date().toISOString();
    const stale = calculateStaleTime(time, 30); // Sensors stay visible for 30 minutes
    
    return {
        uid: sensor.id,
        type: 'a-f-G-E-S',  // Friendly Ground Equipment Sensor
        how: 'm-g',
        time: time,
        start: time,
        stale: stale,
        point: {
            lat: sensor.location.lat,
            lon: sensor.location.lon,
            hae: sensor.location.alt || 0,
            ce: 10.0,
            le: 10.0
        },
        detail: {
            contact: {
                callsign: sensor.name
            },
            remarks: `RavenGrid RF Sensor\nStatus: ${sensor.status}\nCapability: RF Detection & Classification`,
            sensor: {
                fov: 360,  // RF sensors typically have 360° coverage
                range: 10000,  // 10km detection range
            }
        }
    };
}

/**
 * Convert CoT Event to XML format for TAK Server
 */
export function cotToXML(event: CoTEvent): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<event version="2.0" uid="${event.uid}" type="${event.type}" `;
    xml += `how="${event.how}" time="${event.time}" start="${event.start}" stale="${event.stale}">\n`;
    
    // Point
    xml += `  <point lat="${event.point.lat}" lon="${event.point.lon}" `;
    xml += `hae="${event.point.hae}" ce="${event.point.ce}" le="${event.point.le}" />\n`;
    
    // Detail
    xml += '  <detail>\n';
    
    if (event.detail.contact) {
        xml += `    <contact callsign="${escapeXML(event.detail.contact.callsign)}" />\n`;
    }
    
    if (event.detail.remarks) {
        xml += `    <remarks>${escapeXML(event.detail.remarks)}</remarks>\n`;
    }
    
    if (event.detail.rf_signal) {
        const rf = event.detail.rf_signal;
        xml += '    <rf_signal ';
        xml += `frequency_mhz="${rf.frequency_mhz}" `;
        xml += `power_dbm="${rf.power_dbm}" `;
        xml += `bandwidth_khz="${rf.bandwidth_khz}" `;
        xml += `signal_type="${escapeXML(rf.signal_type)}" `;
        xml += `classification="${escapeXML(rf.classification)}" `;
        xml += `confidence="${rf.confidence}"`;
        if (rf.modulation) xml += ` modulation="${escapeXML(rf.modulation)}"`;
        if (rf.snr_db !== undefined) xml += ` snr_db="${rf.snr_db}"`;
        xml += ' />\n';
    }
    
    if (event.detail.sensor) {
        const sensor = event.detail.sensor;
        xml += '    <sensor ';
        if (sensor.fov !== undefined) xml += `fov="${sensor.fov}" `;
        if (sensor.range !== undefined) xml += `range="${sensor.range}" `;
        if (sensor.azimuth !== undefined) xml += `azimuth="${sensor.azimuth}" `;
        if (sensor.elevation !== undefined) xml += `elevation="${sensor.elevation}" `;
        xml += '/>\n';
    }
    
    if (event.detail.link) {
        event.detail.link.forEach(link => {
            xml += `    <link uid="${link.uid}" relation="${link.relation}" type="${link.type}" />\n`;
        });
    }
    
    xml += '  </detail>\n';
    xml += '</event>';
    
    return xml;
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Send CoT message to TAK Server via API
 */
export async function sendCoTToServer(event: CoTEvent): Promise<boolean> {
    try {
        // Use TAK Server's CoT injection endpoint
        const response = await fetch('/api/cot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml',
            },
            body: cotToXML(event)
        });
        
        return response.ok;
    } catch (error) {
        console.error('Failed to send CoT to server:', error);
        return false;
    }
}

/**
 * Batch send multiple CoT events
 */
export async function sendBatchCoT(events: CoTEvent[]): Promise<number> {
    let successCount = 0;
    
    for (const event of events) {
        const success = await sendCoTToServer(event);
        if (success) successCount++;
    }
    
    return successCount;
}
