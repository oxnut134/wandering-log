"use client";
import { useSession, signOut } from "next-auth/react"; // 🎯 NextAuthの機能をインポート
import { Map, AdvancedMarker, MapControl, Marker, useMap, Pin, ControlPosition } from "@vis.gl/react-google-maps";
import { useState, useEffect, useCallback, memo } from "react";
import HeaderMobile from "./HeaderMobile";
//import { useAppContext,} from "../context/AppContext";

declare const google: any;

function MapContainer({ initialLocationId, redMarkerPos, setRedMarkerPos, setInitialLocationId, setModalPos, updateModalElements, openedModalLocations, setOpenedModalLocations, currentPosOfCamera, setCurrentPosOfCamera, visitedLocations, setVisitedLocations, homeTrigger, onMarkerClick, currentZoom, setCurrentZoom, onCloseModalLocation }: any) {
    const map = useMap();
    const [startPos] = useState(currentPosOfCamera);
    //const [redMarkerPos, setRedMarkerPos] = useState(currentPosOfCamera);
    //const { currentPage, setCurrentPage } = useAppContext();
    const { data: session } = useSession();
    const [isDesktop, setIsDesktop] = useState(true);
    const userName = session?.user?.name || null;

    useEffect(() => {
        // 💡 画面幅が 768px 以上（パソコン・タブレット大画面）かどうかを監視
        const media = window.matchMedia('(min-width: 768px)');

        // 立ち上がった瞬間の本物のブラウザの画面幅を100%正確に同期
        setIsDesktop(media.matches);

        // 画面サイズが途中で変わった（ブラウザの横幅をグニグニ縮めた）時の検知イベント
        const listener = (e: MediaQueryListEvent) => {
            setIsDesktop(e.matches);
        };

        // 監視カメラのスタート
        media.addEventListener('change', listener);

        // メモリリーク防止のクリーンアップ
        //return () => media.removeEventListener('change', listener);
    }, []);


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
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>x;", x, " y:", y)

        // 💡 2. それでも取れなければ（{} の場合）、画面中央の数値を強制代入
        let xCheck
        let yCheck
        if (x === undefined) {
            //console.error("x is undefined or null in Yellow Marker")
            const projection = map.getProjection();
            const bounds = map.getBounds();

            if (projection && bounds) {
                // 地図の左上の緯度経度を取得
                const nw = new google.maps.LatLng(
                    bounds.getNorthEast().lat(),
                    bounds.getSouthWest().lng()
                );
                const nwPoint = projection.fromLatLngToPoint(nw)!;
                const clickPoint = projection.fromLatLngToPoint(latLng)!;
                const scale = Math.pow(2, map.getZoom()!);

                // 💡 これでマーカーの正確なピクセル座標が計算されます
                x = (clickPoint.x - nwPoint.x) * scale;
                y = (clickPoint.y - nwPoint.y) * scale;
                xCheck = x;
                yCheck = y;
            }
        }

        /*if (x === undefined || x === null) {
            //console.error("x is undefined or null in Red Marker")
            x = window.innerWidth / 2 - 130; // モーダル幅260の半分
            y = window.innerHeight / 2 - 160; // モーダル高さの半分
        }*/

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
        //setModalPos({ x, y });

        //Google情報取得
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
                // const dateNow=Date.now();
                // setInitialLocationId(dateNow)
                const d = new Date(); // 🎯 これだけで「今（なう）」のデータが確定！

                // 🕰️ あとは d から必要な時間データだけを抜き出して合算するだけ！
                const initialLocationId = (d.getHours() * 10000000) + (d.getMinutes() * 100000) + (d.getSeconds() * 1000) + d.getMilliseconds();
                const newModal = {
                    //id: place?.id || `new-${Date.now()}`, // 複数識別用のID
                    id: place?.id || initialLocationId, // 複数識別用のID newToNull
                    tempId: initialLocationId,
                    pos: { x: x, y: y },
                    currentPos: { x: x, y: y },
                    data: place || {
                        name: p.name,
                        comment: "",
                        latitude: latLng.lat(),
                        longitude: latLng.lng(),
                        isNew: true
                    },
                };
                setOpenedModalLocations((prev: any[]) => {
                    if (prev.find(m =>
                        m.id === newModal.id
                        || (m.data.latitude === newModal.data.latitude
                            && m.data.longitude === newModal.data.longitude)
                    )) {
                        return prev;
                    }
                    return [...prev, newModal];
                });

                /*setOpenedModalLocations((prev: any[]) => {
                    if (prev.find(m => m.id === newModal.id)) return prev;
                    return [...prev, newModal];
                });*/
                setOpenedModalLocations((prev: any[]) => {
                    return prev.map((m: any) =>
                        m.id === newModal.id
                            ? {
                                ...m,
                                data: {
                                    ...m.data,
                                    isCurrentMarker: m.data.isCurrentMarker ? false : true,
                                    isRedFootMark: true,
                                }
                            }
                            : m
                    );
                });


            } else {
                console.log("x;", x, " y:", y)
                const newModal = {
                    //id: place?.id || `new-${Date.now()}`, // 複数識別用のID newToNull
                    id: place?.id || initialLocationId, // 複数識別用のID newToNull
                    tempId: Date.now,
                    pos: { x: x, y: y },
                    currentPos: { x: x + 40, y: y + 40 },
                    data: place || { name: "取得できませんでした", comment: "", latitude: latLng.lat(), longitude: latLng.lng() },
                };
                setOpenedModalLocations((prev: any[]) => {
                    if (prev.find(m =>
                        m.id === newModal.id
                        || (m.data.latitude === newModal.data.latitude
                            && m.data.longitude === newModal.data.longitude)
                    )) {
                        return prev;
                    }
                    return [...prev, newModal];
                });
                //location marker on/off by foot mark toggle
                setOpenedModalLocations((prev: any[]) => {
                    return prev.map((m: any) =>
                        m.id === newModal.id
                            ? {
                                ...m,
                                data: {
                                    ...m.data,
                                    isCurrentMarker: m.data.isCurrentMarker ? false : true,
                                    isRedFootMark: true
                                }
                            }
                            : m
                    );
                });
            }
        });
    };
    const handleMarkerClick = async (place?: any, latLng?: any, domEvent?: any) => {
        // 💡 1. 理想の表示位置（クリックしたピクセル座標）を取得
        //let x = domEvent ? domEvent.clientX : window.innerWidth / 2;
        //let y = domEvent ? domEvent.clientY : window.innerHeight / 2;

        let x = domEvent?.clientX || domEvent?.touches?.[0]?.clientX;
        let y = domEvent?.clientY || domEvent?.touches?.[0]?.clientY;

        let xCheck
        let yCheck

        // 💡 2. それでも取れなければ（{} の場合）、画面中央の数値を強制代入
        if (x === undefined) {
            //console.error("x is undefined or null in Yellow Marker")
            const projection = map.getProjection();
            const bounds = map.getBounds();

            if (projection && bounds) {
                // 地図の左上の緯度経度を取得
                const nw = new google.maps.LatLng(
                    bounds.getNorthEast().lat(),
                    bounds.getSouthWest().lng()
                );
                const nwPoint = projection.fromLatLngToPoint(nw)!;
                const clickPoint = projection.fromLatLngToPoint(latLng)!;
                const scale = Math.pow(2, map.getZoom()!);

                // 💡 これでマーカーの正確なピクセル座標が計算されます
                x = (clickPoint.x - nwPoint.x) * scale;
                y = (clickPoint.y - nwPoint.y) * scale;
                xCheck = x;
                yCheck = y;
            }
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
        //setModalPos({ x, y });
        //let modal:any
        //const target = openedModalLocations.find((m: any) => m.data.google_place_id === place.id);
        //console.log("target>>>>>>>>>>>>>>>>>>>>>", target)

        //place.idとcurrentUserIdでnameとコメントを取得する
        console.log("place.id>>>>>>>>>>>>>>>>", place.id)
        try {
            const response = await fetch(`/api/get_location?id=${place.id}`, {
                method: "GET",
                cache: "no-store"
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn("⚠️ セッションが切れているか未ログインです");
                }
                throw new Error(`APIエラー: ステータスコード ${response.status}`);
            }
            console.log("response>>>>>>>>>>>>>>>>>", response)
            const locationArray = await response.json();

            let target: any
            if (locationArray && locationArray.length > 0) {
                target = locationArray[0]; // 🎯 先頭の1件を引っこ抜く

                console.log("🧬 Neonから直撃で取得した最新のピン:", target);

            } else { target = null }

            //const target: any = null;

            const newModal = {
                //id: place?.id || `new-${Date.now()}`, // 複数識別用のID
                id: place?.id || initialLocationId, // 複数識別用のID newToNull
                //pos: { x: x, y: y },
                pos: { x: x, y: y, xCheck: xCheck, yCheck: yCheck },
                currentPos: { x: x + 40, y: y + 40 },//<<<<<<<<<<<<<<<<<<<<<<<========targetLoc.が移動した位置に合わせて変化しないといけない
                /*data: place
                    ? { ...place, isNew: false } // 既存データ（に見えるが実は...）
                    : { name: "", comment: "", latitude: latLng.lat(), longitude: latLng.lng(), isNew: false }*/
                //data: place || { name: "", comment: "", latitude: latLng.lat(), longitude: latLng.lng() },
                data:
                //!target
                //? { ...place, isNew: false }
                //:
                {
                    id: target.id,
                    name: target?.name,
                    comment: target?.comment,
                    latitude: latLng.lat(),
                    longitude: latLng.lng(),
                    isNew: false  //isNewTrue
                },
            };

            // 💡 すでに同じIDのモーダルが開いていなければ追加
            setOpenedModalLocations((prev: any) => {
                if (prev.find((m: any) => m.id === newModal.id)) return prev;
                return [...prev, newModal];
            });

            //location marker on/off by foot mark toggle
            setOpenedModalLocations((prev: any[]) => {
                return prev.map((m: any) =>
                    m.id === newModal.id
                        ? {
                            ...m,
                            data: {
                                ...m.data,
                                isCurrentMarker: m.data.isCurrentMarker ? false : true,
                                isRedFootMark: false
                            }
                        }
                        : m
                );
            });


        } catch (error) {
            console.error("🚨 フロント側でのピン単眼鏡取得フェッチに失敗しました:", error);
            return null;
        }

    };
    //console.log("visitedLocations>>>>>>>>>>>>>>>",visitedLocations)
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
                mapTypeControl={isDesktop}
                gestureHandling={'greedy'}
                disableDefaultUI={false} // 💡 一旦すべて消す
                zoomControl={true}
                cameraControl={false}

            >

                {!isDesktop && (
                    <MapControl position={ControlPosition.TOP_LEFT}>
                        <HeaderMobile  />
                    </MapControl>
                )}

                <AdvancedMarker
                    position={startPos}
                    content={null}
                >
                    <div style={{ fontSize: '30px', transform: 'translateY(-15px)' }}>🚩</div>
                </AdvancedMarker>
                {/*<AdvancedMarker
                    zIndex={1000}
                    collisionBehavior="OPTIONAL_AND_HIDES_LOWER_PRIORITY"
                    position={currentPosOfCamera}
                    // 💡 あえて中身（children）を書かないことで、Google標準の赤ピンを召喚
                    onClick={(ev: any) => {
                        const latLng = ev.detail?.latLng || ev.latLng;
                        const domEvent = ev.detail?.domEvent || ev.domEvent;
                        handleRedMarkerClick(null, latLng, domEvent);
                    }}>
                    <Pin scale={0.9} />
                </AdvancedMarker>*/}

                <AdvancedMarker
                    zIndex={1000}
                    collisionBehavior="OPTIONAL_AND_HIDES_LOWER_PRIORITY"

                    // 🎯 解決の核心①：
                    // 地図の中心を動かす「currentPosOfCamera」を見に行くのを完全に辞め、
                    // 今新設した、赤マーカー専用の独立した箱「redMarkerPos」をバインドします！
                    position={redMarkerPos}

                    gmpDraggable={true}

                    onDragEnd={(ev: any) => {
                        const newLat = ev.latLng?.lat?.() || ev.detail?.latLng?.lat;
                        const newLng = ev.latLng?.lng?.() || ev.detail?.latLng?.lng;

                        if (newLat && newLng) {
                            console.log("📍 赤マーカーの移動完了:", newLat, newLng);

                            // 🎯 解決の核心②：
                            // 指を離した瞬間に、赤マーカーの「ピンの場所だけ」を上書きします！
                            // 地図の中心（Center）を動かすステートには1ミリも触らないため、
                            // 地図が勝手にググッと中央に移動するお節介な挙動は、100%物理的にピタッと停止します。
                            setRedMarkerPos({ lat: newLat, lng: newLng });
                        }
                    }}

                    onClick={(ev: any) => {
                        const latLng = ev.detail?.latLng || ev.latLng;
                        const domEvent = ev.detail?.domEvent || ev.domEvent;
                        handleRedMarkerClick(null, latLng, domEvent);
                    }}>
                    <Pin
                        scale={0.9}
                        borderColor={'black'}

                    />
                </AdvancedMarker>

                {/* 過去の足跡も AdvancedMarker に揃える */}
                {visitedLocations ? (visitedLocations.map((item: any) => {
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
                                handleMarkerClick(item, latLng, domEvent)
                            }}
                        >
                            {isCurrent ? (
                                <Pin
                                    background={'#07f813c0'}
                                    //background={'pink'}
                                    glyphColor={'#d4d0df'}
                                    borderColor={'black'}
                                    glyphText={'👣'}
                                />

                            ) : (
                                <Pin
                                    background={'#FBBC04'}
                                    glyphColor={'#000000'}
                                    borderColor={'black'}
                                    glyphText={'👣'}
                                />
                            )
                            }
                        </AdvancedMarker>
                    )
                })) : (null)}
            </Map>
        </div>
    );
}
export default memo(MapContainer);