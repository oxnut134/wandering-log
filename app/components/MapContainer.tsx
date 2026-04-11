"use client";
import { Map, AdvancedMarker, Marker, useMap, Pin, ControlPosition } from "@vis.gl/react-google-maps";
import { useState, useEffect, useCallback } from "react";

export default function MapContainer({ openedModalLocations, currentPosOfCamera, setCurrentPosOfCamera, visitedLocations, homeTrigger, onMarkerClick, currentZoom, setCurrentZoom }: any) {
    const map = useMap();
    const [startPos] = useState(currentPosOfCamera);


    useEffect(() => {
        if (map && currentPosOfCamera && homeTrigger !== 0) {
            map.panTo(currentPosOfCamera);
            //map.setZoom(15);
        }
        // }, [homeTrigger, map]);

        //   useEffect(() => {
        if (map && currentPosOfCamera && homeTrigger !== 0) {
            // 💡 1. 今のズーム値を一時的にメモ
            const currentZoom = map.getZoom();

            // 💡 2. 座標だけを移動させる
            map.panTo(currentPosOfCamera);

            // 💡 3. メモしておいたズーム値を即座に再設定して「固定」する
            if (currentZoom !== undefined) {
                map.setZoom(currentZoom);
            }

            console.log("🚀 自作API発動: ズームを維持して移動完了");
        }
    }, [homeTrigger, map]); // 💡 ボタンが押された時（homeTrigger変化時）だけ動く


    return (
        <div style={{ height: "100vh", width: "100%" }}>
            <Map
                mapId="DEMO_MAP_ID"
                center={currentPosOfCamera}
                zoom={currentZoom}
                // 💡 【重要】これがないと、ボタンを押しても地図がズームしません
                onZoomChanged={(ev) => {
                    setCurrentZoom(ev.detail.zoom);
                }}

                onCameraChanged={(ev) => setCurrentPosOfCamera(ev.detail.center)}

                // 💡 指でのズームを「禁止」したいなら、ここを false にします

                gestureHandling={'greedy'}
                disableDefaultUI={false} // 💡 一旦すべて消す
                zoomControl={true}
                cameraControl={false}
            >

                <AdvancedMarker
                    position={startPos}
                    content={null}
                >
                    <div style={{ fontSize: '30px', transform: 'translateY(-15px)' }}>🚩</div>
                </AdvancedMarker>
                <AdvancedMarker
                    zIndex={1000}
                    collisionBehavior="OPTIONAL_AND_HIDES_LOWER_PRIORITY"
                    position={currentPosOfCamera}
                    // 💡 あえて中身（children）を書かないことで、Google標準の赤ピンを召喚
                    onClick={(ev: any) => {
                        const latLng = ev.detail?.latLng || ev.latLng;
                        const domEvent = ev.detail?.domEvent || ev.domEvent;
                        onMarkerClick(null, latLng, domEvent);
                    }}
                />
                {/* 過去の足跡も AdvancedMarker に揃える */}
                {visitedLocations.map((item: any) => {
                    const isCurrent = openedModalLocations.find(
                        (loc: any) => loc.id === item.id && loc.data?.isCurrentMarker
                    );
                    return (
                        <AdvancedMarker
                            key={item.id}
                            clickable={true}
                            position={{
                                lat: Number(item.latitude),
                                lng: Number(item.longitude)
                            }}
                            onClick={(ev: any) => {
                                //alert("タップされました！");
                                const latLng = ev.detail?.latLng || ev.latLng;
                                const domEvent = ev.detail?.domEvent || ev.domEvent;
                                //alert("座標: " + JSON.stringify(latLng));
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
