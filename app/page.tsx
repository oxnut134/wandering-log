"use client";
import { useState, useEffect, useCallback } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import MapContainer from "./components/MapContainer";
import ModalLocation from "./components/ModalLocation";
import ModalGoogle from "./components/ModalGoogle";
import ModalLogs from "./components/ModalLogs";

export default function WanderingLog() {

    const [currentPosOfCamera, setCurrentPosOfCamera] = useState<any>(null);
    const [currentPosOfMe, setCurrentPosOfMe] = useState<any>(null);
    const [visitedLocations, setvisitedLocations] = useState([]);
    // const [isModalOpen, setIsModalOpen] = useState(false);
    // const [openedModalGoogle, setopenedModalGoogle] = useState<any>({});
    const [homeTrigger, setHomeTrigger] = useState(0);
    const [modalPos, setModalPos] = useState({})
    const [openedModalLocations, setOpenedModalLocations] = useState<any[]>([]);
    const [openedModalGoogle, setOpenedModalGoogle] = useState<any[]>([]);
    const [isGoogleView, setIsGoogleView] = useState(false);
    const [currentMarker, setCurrentMarker] = useState(false);
    const [isModalLogsView, setIsModalLogsView] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(15);


    const refreshHistory = useCallback(async () => {
        const res = await fetch("/api/wandering_where");//default:GET
        const data = await res.json();
        //console.log("data:", data);
        setvisitedLocations(data);
    }, []);
    useEffect(() => {
        console.log("visitedLocations : ", visitedLocations);
    }, [visitedLocations]);

    useEffect(() => {
        console.log("openedModalLocations:", openedModalLocations)
    }, [openedModalLocations]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            console.log("coords:", coords);
            setCurrentPosOfCamera(coords);
            setCurrentPosOfMe(coords);
        });
        refreshHistory();
    }, [refreshHistory]);

    const handleMarkerClick = (place?: any, latLng?: any, domEvent?: any) => {
        // 💡 1. 理想の表示位置（クリックしたピクセル座標）を取得
        //let x = domEvent ? domEvent.clientX : window.innerWidth / 2;
        //let y = domEvent ? domEvent.clientY : window.innerHeight / 2;

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

        const newModal = {
            id: place?.id || `new-${Date.now()}`, // 複数識別用のID
            pos: { x: x, y: y },
            currentPos: { x: x + 40, y: y + 40 },
            data: place || { name: "", comment: "", latitude: latLng.lat(), longitude: latLng.lng() },
        };

        // 💡 すでに同じIDのモーダルが開いていなければ追加
        setOpenedModalLocations(prev => {
            if (prev.find(m => m.id === newModal.id)) return prev;
            return [...prev, newModal];
        });

    };

    const updatedCurrentPos = (id: any, newPos: any) => {
        setOpenedModalLocations(prev => prev.map(m =>
            m.id === id ? { ...m, currentPos: newPos } : m // 👈 スプレッド構文で currentPos だけ上書き
        ));
    };
    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const nowPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    // 地図のカメラだけを今の場所に移動させる
                    setCurrentPosOfCamera(nowPos);
                    setHomeTrigger(prev => prev + 1); // カメラ移動を発火
                    console.log("📍 ナウの場所へ移動:", nowPos);
                },
                () => { console.log("位置情報の取得に失敗しました"); },
                { enableHighAccuracy: true }
            );
        }
    };

    const handleHome = () => {
        if (currentPosOfMe) {
            // 💡 状態を更新することで、MapContainer 側の Map コンポーネントが再描画されます
            setCurrentPosOfCamera({
                lat: currentPosOfMe.lat,
                lng: currentPosOfMe.lng
            });
            setHomeTrigger(Date.now());
        }
    };

    if (!currentPosOfCamera) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-gray-500">
                <div className="flex flex-col items-center gap-2">
                    {/* スピナー（くるくる）を足すと、より「不沈」なUIになります */}
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="text-lg font-medium">現在地確認中...</p>
                </div>
            </div>
        );
    }
    const fetchLogsForModal = async (id: number | string) => {
        // 💡 文字列 ID（new-123など）の場合は履歴がないのでスキップ
        if (typeof id === 'string' && id.startsWith('new-')) return;


        try {
            const res = await fetch(`/api/visited_log?location_id=${id}`);
            if (res.ok) {
                const data = await res.json();
                // ✅ 特定の ID のモーダルだけ、logs プロパティを更新
                setOpenedModalLocations(prev => prev.map(m =>
                    m.id === id ? { ...m, logs: data } : m
                ));
            }
        } catch (error) {
            console.error("❌ 履歴取得失敗:", error);
        }
    };
    console.log("openedModalLocations:::", openedModalLocations)
    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string} libraries={['places']}>
            <MapContainer
                currentPosOfCamera={currentPosOfCamera}
                setCurrentPosOfCamera={setCurrentPosOfCamera}
                visitedLocations={visitedLocations}
                onMarkerClick={handleMarkerClick}
                homeTrigger={homeTrigger}
                openedModalLocations={openedModalLocations}
                currentZoom={currentZoom}
                setCurrentZoom={setCurrentZoom}
            />
            <button
                onClick={handleCurrentLocation}
                style={{
                    position: 'fixed', bottom: '210px', right: '7px', // 🏠より少し上に配置
                    width: '45px', height: '45px', borderRadius: '50%',
                    backgroundColor: 'white', border: 'none', fontSize: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 1000
                }}
            >
                📍  {/* または🎯 や 🧭 */}
            </button>
            {/* Homeボタン */}
            <button
                onClick={handleHome}
                style={{
                    position: 'fixed', bottom: '150px', right: '7px',
                    width: '45px', height: '45px', borderRadius: '50%',
                    backgroundColor: 'white', border: 'none', fontSize: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 1000
                }}
            >
                🏠
            </button>
            <button onClick={() => setCurrentZoom(prev => prev + 1)}>＋</button>
            <button onClick={() => setCurrentZoom(prev => prev - 1)}>ー</button>

            {openedModalLocations.map((modal) => (
                <ModalLocation
                    key={modal.id}
                    modal={modal}
                    initialModalPos={modal.pos}
                    setOpenedModalLocations={setOpenedModalLocations}
                    openedModalGoogle={modal.data}
                    onPosUpdate={(newPos: any) => updatedCurrentPos(modal.id, newPos)}
                    //isGoogleView={isGoogleView}
                    isGoogleView={modal.data.isShowingGoogle}
                    //isGoogleView={modal.data?.isShowingGoogle || false}
                    setIsGoogleView={setIsGoogleView}
                    // 💡 1. このモーダル専用の履歴データを渡す（未取得なら空配列）
                    logs={modal.logs || []}
                    onSaveSuccess={refreshHistory}
                    isExisting={typeof modal.id === 'number' || !modal.id.startsWith('new-')}
                    // 💡 2. 履歴を取りに行く関数（idを添えて親に頼む）
                    onFetchLogs={() => fetchLogsForModal(modal.id)}

                    onCloseModalLocation={() => {
                        setOpenedModalLocations(prev =>
                            prev.filter(record => record.id !== modal.id)

                        );

                    }}
                    onClose={() => {
                        setOpenedModalLocations(prev => prev.filter(m => m.id !== modal.id));
                    }}
                    setopenedModalGoogle={(newData: any) => {
                        setOpenedModalLocations(prev => prev.map(m =>
                            m.id === modal.id ? { ...m, data: newData } : m
                        ));
                    }}
                    setCurrentMarker={() => {
                        console.log("in setCurrentMaker");
                        setOpenedModalLocations((prev: any[]) => {
                            return prev.map((m: any) =>
                                m.id === modal.id
                                    ? {
                                        ...m,
                                        data: {
                                            ...m.data,
                                            isCurrentMarker: m.data.isCurrentMarker ? false : true,
                                        }
                                    }
                                    : m
                            );
                        });

                    }}
                />
            ))}
            {openedModalLocations.map((modal) => (
                <ModalGoogle
                    key={modal.id}
                    modal={modal}
                    initialModalPosGoogle={modal.currentPos}
                    openedModalGoogle={modal.data}
                    //isGoogleView={isGoogleView}
                    isGoogleView={modal.data.isShowingGoogle}

                    setIsGoogleView={setIsGoogleView}

                    // 💡 1. このモーダル専用の履歴データを渡す（未取得なら空配列）
                    logs={modal.logs || []}

                    // 💡 2. 履歴を取りに行く関数（idを添えて親に頼む）
                    onFetchLogs={() => fetchLogsForModal(modal.id)}
                    onClose={() => {
                        console.log("On closing");
                        // 💡 親の配列をまるごと更新（イミュータビリティを保つ）
                        setOpenedModalLocations((prev: any[]) => {
                            return prev.map((m: any) =>
                                m.id === modal.id
                                    ? {
                                        ...m,
                                        data: {
                                            ...m.data,
                                            isShowingGoogle: false
                                        }
                                    }
                                    : m
                            );
                        });

                    }}


                    setopenedModalGoogle={(newData: any) => {
                        setOpenedModalLocations(prev => prev.map(m =>
                            m.id === modal.id ? { ...m, data: newData } : m
                        ));
                    }}
                />
            ))}
            {openedModalLocations.map((modal) => (
                <ModalLogs
                    key={modal.id}
                    modal={modal}
                    openedModalLocations={openedModalLocations}
                    initialModalPosGoogle={modal.currentPos}
                    openedModalGoogle={modal.data}
                    //isGoogleView={isGoogleView}
                    isGoogleView={modal.data.isShowingGoogle}

                    setIsGoogleView={setIsGoogleView}

                    // 💡 1. このモーダル専用の履歴データを渡す（未取得なら空配列）
                    logs={modal.logs || []}

                    // 💡 2. 履歴を取りに行く関数（idを添えて親に頼む）
                    onFetchLogs={() => fetchLogsForModal(modal.id)}
                    onClose={() => {
                        console.log("On closing");
                        // 💡 親の配列をまるごと更新（イミュータビリティを保つ）
                        setOpenedModalLocations((prev: any[]) => {
                            return prev.map((m: any) =>
                                m.id === modal.id
                                    ? {
                                        ...m,
                                        data: {
                                            ...m.data,
                                            isShowingLogs: false
                                        }
                                    }
                                    : m
                            );
                        });

                    }}
                    setopenedModalGoogle={(newData: any) => {
                        setOpenedModalLocations(prev => prev.map(m =>
                            m.id === modal.id ? { ...m, data: newData } : m
                        ));
                    }}
                />
            ))}
        </APIProvider>
    );
}
