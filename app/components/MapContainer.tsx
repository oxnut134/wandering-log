"use client";
import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { useState, useEffect, useCallback } from "react";

export default function MapContainer({ currentPosOfCamera, setCurrentPosOfCamera, history, homeTrigger,onMarkerClick }: any) {
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
                defaultCenter={currentPosOfCamera}
                defaultZoom={15}
                gestureHandling={'greedy'}
                onCameraChanged={(ev) => setCurrentPosOfCamera(ev.detail.center)}
            >
                {/* 中心ピン：クリックでモーダル起動 */}
                <Marker position={currentPosOfCamera} onClick={onMarkerClick} />

                {/* 過去の足跡 */}
                {history.map((item: any) => ( // 💡 混同を避けるため引数名を item に変更
                    <Marker
                        key={item.id}
                        position={{
                            // 💡 ログの通り 'latitude' と 'longitude' を数値に変換して使う
                            lat: Number(item.latitude),
                            lng: Number(item.longitude)
                        }}
                        label="👣"
                        // 💡 クリック時にデータを丸ごと渡す
                        onClick={() => onMarkerClick(item)}
                    />
                ))}
            </Map>
        </div>
    );
}
