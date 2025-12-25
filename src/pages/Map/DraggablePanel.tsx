import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { Paper } from '@mantine/core';

interface DraggablePanelProps {
    children: ReactNode;
    initialX?: number;
    initialY?: number;
    style?: React.CSSProperties;
    className?: string;
    [key: string]: any;
}

export function DraggablePanel({
    children,
    initialX = 10,
    initialY = 80,
    style,
    className = '',
    ...otherProps
}: DraggablePanelProps) {
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start drag if clicking on the header area (first 40px)
        const rect = panelRef.current?.getBoundingClientRect();
        if (rect && e.clientY - rect.top <= 40) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
            e.preventDefault();
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;

                // Keep panel within viewport bounds
                const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 0);
                const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 0);

                setPosition({
                    x: Math.max(0, Math.min(newX, maxX)),
                    y: Math.max(0, Math.min(newY, maxY)),
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

    return (
        <Paper
            ref={panelRef}
            className={`${className} ${isDragging ? 'dragging' : ''}`}
            style={{
                ...style,
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                zIndex: isDragging ? 10000 : (style?.zIndex || 1000),
            }}
            onMouseDown={handleMouseDown}
            {...otherProps}
        >
            {children}
        </Paper>
    );
}
