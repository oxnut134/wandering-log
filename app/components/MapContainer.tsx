"use client";
import { Map, AdvancedMarker, Marker, useMap, Pin } from "@vis.gl/react-google-maps";
import { useState, useEffect, useCallback } from "react";

export default function MapContainer({ openedModalLocations, currentPosOfCamera, setCurrentPosOfCamera, visitedLocations, homeTrigger, onMarkerClick }: any) {
    const map = useMap();
    useEffect(() => {
        if (map && currentPosOfCamera && homeTrigger !== 0) {
            map.panTo(currentPosOfCamera);
            map.setZoom(15);
        }
    }, [homeTrigger, map]);
    return (
        <div style={{ height: "100vh", width: "100%" }}>
            <Map
                mapId="DEMO_MAP_ID"
                center={currentPosOfCamera}
                defaultZoom={15}
                gestureHandling={'greedy'}
                onCameraChanged={(ev) => setCurrentPosOfCamera(ev.detail.center)}

                disableDefaultUI={true}
                zoomControl={true}
            >
                <AdvancedMarker
                    position={currentPosOfCamera}
                    onClick={(ev: any) => {
                        console.log("ev:", ev);
                        const latLng = ev.detail?.latLng || ev.latLng;
                        const domEvent = ev.detail?.domEvent || ev.domEvent;
                        onMarkerClick(null, latLng, domEvent);
                    }} />

                {/* 過去の足跡も AdvancedMarker に揃える */}
                {visitedLocations.map((item: any) => {
                    const isCurrent = openedModalLocations.find(
                        (loc: any) => loc.id === item.id && loc.data?.isCurrentMarker
                    );
                    return (
                        <AdvancedMarker
                            key={item.id}
                            position={{
                                lat: Number(item.latitude),
                                lng: Number(item.longitude)
                            }}
                            onClick={(ev: any) => {
                                const latLng = ev.detail?.latLng || ev.latLng;
                                const domEvent = ev.detail?.domEvent || ev.domEvent;
                                onMarkerClick(item, latLng, domEvent)
                            }}
                        >
                            {isCurrent ? (
                                <Pin
                                    background={'#610fef'}
                                    glyphColor={'#dfd0d0'}
                                    glyph={'👣'}
                                />

                            ) : (
                                <Pin
                                    background={'#FBBC04'}
                                    glyphColor={'#000000'}
                                    glyph={'👣'}
                                />
                            )
                            }
                        </AdvancedMarker>
                    )
                })}
            </Map>
        </div>
    );
}
