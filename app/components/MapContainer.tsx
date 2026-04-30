"use client";
import { Map, AdvancedMarker, Marker, useMap, Pin, ControlPosition } from "@vis.gl/react-google-maps";
import { useState, useEffect, useCallback } from "react";
declare const google: any;

export default function MapContainer({ setModalPos, openedModalLocations, setOpenedModalLocations, currentPosOfCamera, setCurrentPosOfCamera, visitedLocations, homeTrigger, onMarkerClick, currentZoom, setCurrentZoom }: any) {
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

            //console.log("🚀 自作API発動: ズームを維持して移動完了");
        }
    }, [homeTrigger, map]); // 💡 ボタンが押された時（homeTrigger変化時）だけ動く

    const handleRedMarkerClick = (place?: any, latLng?: any, domEvent?: any) => {
        // 💡 1. 理想の表示位置（クリックしたピクセル座標）を取得
        //let x = domEvent ? domEvent.clientX : window.innerWidth / 2;
        //let y = domEvent ? domEvent.clientY : window.innerHeight / 2;
        if (!map || !(window as any).google) return;

        let x = domEvent?.clientX || domEvent?.touches?.[0]?.clientX;
        let y = domEvent?.clientY || domEvent?.touches?.[0]?.clientY;

        // 💡 2. それでも取れなければ（{} の場合）、画面中央の数値を強制代入
    
        if (x === undefined || x === null) {
            x = window.innerWidth / 2 - 130; // モーダル幅260の半分
            y = window.innerHeight / 2 - 160; // モーダル高さの半分
        }

        // 💡 2. ブラウザとモーダルのサイズ定義（ax, ay, bx, by）
        const ax = window.innerWidth;
        const ay = window.innerHeight;
        const bx = 260; // モーダルの幅
        const by = 320; // モーダルの高さ（おおよそ）

        if (x < 0) {
            x = 0; // 左端固定
        } else if (x + bx > ax) {
            x = ax - bx - 30; // 右端固定
        }

        if (y < by) {
            y = by + 60; // 上端固定 (transformの影響を考慮)
        } else if (y > ay) {
            y = ay; // 下端固定
        }

        // 💡 4. 安全が確認された座標を State に保存
        setModalPos({ x, y });

        const service = new google.maps.places.PlacesService(map as any);
        const latNum = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
        const lngNum = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
        service.nearbySearch({
            location: {
                lat: latNum,
                lng: lngNum
            },
            rankBy: google.maps.places.RankBy.DISTANCE,
            type: 'establishment',
        }, (results: any, status: any) => {
            if (status === "OK" && results && results[0]) {
                const p = results[0];
                const include = p.types.includes("establishment") || p.types.includes("point_of_interest");
                const ignore = p.types.includes("political") || p.types.includes("locality");
                //💡 クリックした位置と、見つかった場所の位置
                const clickPos = new google.maps.LatLng(latNum, lngNum);
                const placePos = p.geometry.location;

                // 💡 距離（メートル）を計算
                const distance = google.maps.geometry.spherical.computeDistanceBetween(clickPos, placePos);
                if (!include || ignore || distance > 10) { p.name = "取得できませんでした。" }
                const newModal = {
                    id: place?.id || `new-${Date.now()}`, // 複数識別用のID
                    pos: { x: x, y: y },
                    currentPos: { x: x + 40, y: y + 40 },
                    data: place || {
                        name: p.name,
                        comment: "",
                        latitude: latLng.lat(),
                        longitude: latLng.lng(),
                        isNew: true
                    },
                };
                setOpenedModalLocations((prev: any[]) => {
                    if (prev.find(m => m.id === newModal.id)) return prev;
                    return [...prev, newModal];
                });
            } else {
                const newModal = {
                    id: place?.id || `new-${Date.now()}`, // 複数識別用のID
                    pos: { x: x, y: y },
                    currentPos: { x: x + 40, y: y + 40 },
                    data: place || { name: "取得できませんでした", comment: "", latitude: latLng.lat(), longitude: latLng.lng() },
                };
                setOpenedModalLocations((prev: any[]) => {
                    if (prev.find(m => m.id === newModal.id)) return prev;
                    return [...prev, newModal];
                });
            }
        });
    };

    return (
        <div style={{ height: "100vh", width: "100%" }}>
            <Map
                mapId="DEMO_MAP_ID"
                center={currentPosOfCamera}
                //defaultCenter={currentPosOfCamera}
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
                        handleRedMarkerClick(null, latLng, domEvent);
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
                                    glyphText={'👣'}
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
