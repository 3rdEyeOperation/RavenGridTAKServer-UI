import { Center, Pagination, Table, TableData, useComputedColorScheme, Paper } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import axios from '../axios_config';
import { apiRoutes } from '../apiRoutes';
import {t} from "i18next";

export default function Alerts() {
    const [alerts, setAlerts] = useState<TableData>({
        caption: '',
        head: [t('Callsign'), t('Type'), t('Start Time'), t('Cancel Time')],
        body: [],
    });
    const [activePage, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    useEffect(() => {
        axios.get(
            apiRoutes.alerts,
            { params: {
                    page: activePage,
                } }
        ).then(r => {
            if (r.status === 200) {
                const tableData: TableData = {
                    caption: '',
                    head: [t('Callsign'), t('Type'), t('Start Time'), t('Cancel Time')],
                    body: [],
                };

                r.data.results.map((row:any) => {
                    if (tableData.body !== undefined) {
                        tableData.body.push([row.callsign, row.alert_type, row.start_time, row.cancel_time]);
                    }
                });

                setPage(r.data.current_page);
                setTotalPages(r.data.total_pages);
                setAlerts(tableData);
            }
});
}, [activePage]);
    return (
        <Paper
            p="xl"
            style={{
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(100, 255, 218, 0.2)',
            }}
        >
            <Table.ScrollContainer minWidth="100%">
                <Table 
                    stripedColor="rgba(100, 255, 218, 0.05)" 
                    highlightOnHoverColor="rgba(100, 255, 218, 0.1)" 
                    striped="odd" 
                    data={alerts} 
                    highlightOnHover 
                    withTableBorder 
                    mb="md"
                    style={{
                        border: '1px solid rgba(100, 255, 218, 0.2)',
                    }}
                />
            </Table.ScrollContainer>
            <Center><Pagination total={totalPages} value={activePage} onChange={setPage} withEdges /></Center>
        </Paper>
    );
}
