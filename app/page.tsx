"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import MapContainer from "./components/MapContainer";
import ModalLocation from "./components/ModalLocation";
import ModalGoogle from "./components/ModalGoogle";
import ModalLogs from "./components/ModalLogs";
import ModalComments from "./components/ModalComments";
import Header from "./components/Header";
import { useMap } from "@vis.gl/react-google-maps";

declare const google: any;

import { useForm } from "react-hook-form";
import axios from "../lib/axios";
import { useAppContext, AppProvider } from "./context/AppContext";


export default function WanderingLog() {
    //const map = useMap();

    const [currentPosOfCamera, setCurrentPosOfCamera] = useState<any>(null);
    const [currentPosOfMe, setCurrentPosOfMe] = useState<any>(null);
    const [redMarkerPos, setRedMarkerPos] = useState<any>(null);
    const [visitedLocations, setVisitedLocations] = useState([]);
    const [homeTrigger, setHomeTrigger] = useState(0);
    const [modalPos, setModalPos] = useState({})
    const [openedModalLocations, setOpenedModalLocations] = useState<any[]>([]);
    //  setOpenedModalLocations.currentPos: corrent coodinate value of left-bottom corner of the ModalLocation
    //  setOpenedModalLocations.pos:        original coodinate value of left-bottom corner of the ModalLocation

    //const [openedModalGoogle, setOpenedModalGoogle] = useState<any[]>([]);
    const [isGoogleView, setIsGoogleView] = useState(false);
    //const [currentMarker, setCurrentMarker] = useState(false);
    //const [isModalLogsView, setIsModalLogsView] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(15);
    const [moveDist, setMoveDist] = useState({ x: 0, y: 0 });
    const [dummy, setDummy] = useState(false);
    const [isCommentRecordExist, setIsCommentRecordExist] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
    //const [activeGroupGoogleId, setActiveGroupGoogleId] = useState<number | null>(null);
    //const [activeGroupLocationId, setActiveGroupLocationId] = useState<number | null>(null);
    //const [recordDeleted, isRecordDeleted] = useState(false);
    const [clickedModalId, setClickedModalId] = useState<number | null>(null)
    const { currentPage, setCurrentPage } = useAppContext();
    const { currentUserId, setCurrentUserId } = useAppContext();
    const [authChecking, setAuthChecking] = useState(true);
    const [initialLocationId, setInitialLocationId] = useState()
    const [onSavingLocation, setOnSavingLocation] = useState(false);

    // const [redMarkerPos, setRedMarkerPos] = useState({
    //     lat: null,
    //     lng: null
    // });
    //   useEffect(() => {
    //       setCurrentPage("map");
    //   }, []);

    // 💡 app/page.tsx 内の自動ログインチェック（WanderingLog内）
    useEffect(() => {
        // 🎯 宛先を NextAuth 純正の自動セッションチェック窓口へ変更！
        fetch('/api/auth/session')
            .then((res) => {
                if (!res.ok) throw new Error('Unauthorized');
                return res.json();
            })
            .then((data) => {
                // 🔓 ログイン中：セッションデータの中に本物のユーザー名が入っています
                if (data?.user?.name) {
                    setCurrentUserId(data.user.id); // 共通状態（名前）をセット
                    setAuthChecking(false);      // ローディングを解除して地図画面へ！
                } else {
                    // 🔒 ゲスト状態（セッションが空っぽ）ならログイン画面へ
                    window.location.href = "/login";
                }
            })
            .catch((err) => {
                console.error("🚨 認証チェックエラー:", err);
                window.location.href = "/login";
            });
    }, []);


    const renderMe = () => {
        setDummy(prev => !prev);
    };
    const refreshHistory = useCallback(async () => {

        const res = await fetch("/api/get_locations_and_places");//default:GET
        const data = await res.json();
        //console.log("data:>>>>>>>>>>>>>>", data);
        setVisitedLocations(data);


        setTimeout(() => {
            setCurrentPosOfCamera((prev: any) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    lat: prev.lat + 0.00001,
                    lng: prev.lng + 0.00001
                }
            });
        }, 200);

    }, []);

    useEffect(() => {
        console.log("visitedLocations : ", visitedLocations);
    }, [visitedLocations]);

    useEffect(() => {
        console.log("openedModalLocations in page.tsx:", openedModalLocations)
    }, [openedModalLocations]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
            //const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; //起動後現在地からスタート
            const coords = { lat: 35.67133, lng: 139.76534 };//起動後、銀座ライオン前からスタート
            //console.log("coords:", coords);
            setCurrentPosOfCamera(coords);
            setCurrentPosOfMe(coords);
            setRedMarkerPos(coords);
        });
        refreshHistory();
    }, [refreshHistory]);


    const updateCurrentPos = (id: any, newPos: any) => {
        setOpenedModalLocations(prev => prev.map(m =>
            m.id === id ? { ...m, currentPos: newPos } : m // 👈 スプレッド構文で currentPos だけ上書き
        ));
    };
    const updatedPos = (id: any, newPos: any) => {
        console.log("id:", id, " pos.x:", newPos.x, "pos.y:", newPos.y)
        setOpenedModalLocations(prev => prev.map(m =>
            m.id === id ? { ...m, pos: newPos } : m // 👈 スプレッド構文で pos だけ上書き
        ));
    };




    //original
    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const nowPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        //lat: 35.67133,
                        //lng: 139.76534,
                    };
                    // 地図のカメラだけを今の場所に移動させる
                    setCurrentPosOfCamera(nowPos);
                    setRedMarkerPos(nowPos);
                    setHomeTrigger(prev => prev + 1); // カメラ移動を発火
                    //console.log("📍 ナウの場所へ移動:", nowPos);
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
            setRedMarkerPos({
                lat: currentPosOfMe.lat,
                lng: currentPosOfMe.lng
            });
            setHomeTrigger(Date.now());
        }
    };

    /*const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const nowPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    
                    // 🎯 解決の核心①：地図のカメラを現在地に移動
                    setCurrentPosOfCamera(nowPos);
                    
                    // 🎯 解決の核心②：切り離した「赤マーカー専用の箱」も、同時に現在地へワープさせる！
                    setRedMarkerPos(nowPos);
                    
                    setHomeTrigger(prev => prev + 1); // カメラ移動を発火
                },
                () => { console.log("位置情報の取得に失敗しました"); },
                { enableHighAccuracy: true }
            );
        }
    };

    const handleHome = () => {
        if (currentPosOfMe) {
            const homePos = {
                lat: currentPosOfMe.lat,
                lng: currentPosOfMe.lng
            };
            
            // 🎯 解決の核心③：地図のカメラをマイホームに移動
            setCurrentPosOfCamera(homePos);
            
            // 🎯 解決の核心④：切り離した「赤マーカー専用の箱」も、同時にマイホームへ引き戻す！
            setRedMarkerPos(homePos);
            
            setHomeTrigger(Date.now());
        }
    };*/

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
    const onFetchLogs = async (id: number | string) => {

        console.log("<<<<<<<<<<<<<<<< onFech id:", id, " >>>>>>>>>>>>>>>>>")
        // 💡 文字列 ID（new-123など）の場合は履歴がないのでスキップ
        //if (typeof id === 'string' && id.startsWith('new-')) return;
        if (id === initialLocationId) return; //newToNull

        try {
            const res = await fetch(`/api/get_visited_logs?location_id=${id}`);
            if (res.ok) {
                const data = await res.json();

                await new Promise<void>((resolve) => {
                    setOpenedModalLocations(prev => {
                        const next = prev.map(m => m.id === id ? { ...m, logs: data } : m);
                        resolve(); // 🏆 書き換え完了の合図！ここで初めて関門のロックが外れます
                        return next;
                    });
                });
                // console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",data)
                // // ✅ 特定の ID のモーダルだけ、logs プロパティを更新
                // setOpenedModalLocations(prev => prev.map(m =>
                //     m.id === id ? { ...m, logs: data } : m
                // ));
            }
        } catch (error) {
            console.error("❌ 履歴取得失敗:", error);
        }
    };

    const updateModalElements = ((targetId: any, updater: any) => {
        setOpenedModalLocations((prev: any) =>
            prev.map((m: any) => m.id === targetId ? updater(m) : m)
        )

    })

    return (
        <AppProvider>
            <APIProvider
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}
                libraries={['places', 'geometry']}
                language={'jp'}
                region={'jp'}
            >
                <div className="fixed top-2.5 left-50 w-[40%] bg-transparent z-50 pointer-events-none">
                    <div className="pointer-events-auto">
                        <Header />
                    </div>
                </div>
                <MapContainer
                    currentPosOfCamera={currentPosOfCamera}
                    setCurrentPosOfCamera={setCurrentPosOfCamera}
                    visitedLocations={visitedLocations}
                    setVisitedLocations={setVisitedLocations}
                    initialLocationId={initialLocationId}
                    setInitialLocationId={setInitialLocationId}
                    //onRedMarkerClick={handleRedMarkerClick}
                    //onMarkerClick={handleMarkerClick}
                    homeTrigger={homeTrigger}
                    openedModalLocations={openedModalLocations}
                    setOpenedModalLocations={setOpenedModalLocations}
                    currentZoom={currentZoom}
                    setCurrentZoom={setCurrentZoom}
                    setModalPos={setModalPos}
                    redMarkerPos={redMarkerPos}
                    setRedMarkerPos={setRedMarkerPos}
                />
                <button
                    onClick={handleCurrentLocation}
                    style={{
                        position: 'fixed', bottom: '260px', right: '7px', // 🏠より少し上に配置
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
                        position: 'fixed', bottom: '200px', right: '7px',
                        width: '45px', height: '45px', borderRadius: '50%',
                        backgroundColor: 'white', border: 'none', fontSize: '24px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 1000
                    }}
                >
                    🏠
                </button>

                {openedModalLocations.map((modal, index: number) => {
                    const isFocused = activeGroupId === modal.id
                    return (
                        //<React.Fragment key={`group-${modal.id}`}>
                        <React.Fragment key={`group-${modal.tempId || modal.id}`}>
                            <ModalLocation
                                key={`location-${modal.id}`}
                                //key={index}
                                modal={modal}
                                initialLocationId={initialLocationId}
                                setInitialLocationId={setInitialLocationId}
                                updateModalElements={updateModalElements}
                                isFocused={isFocused}
                                //handleFocused={handleFocused}
                                onFocus={() => {
                                    setActiveGroupId(modal.id)
                                }}
                                clickedModalId={clickedModalId}
                                setClickedModalId={setClickedModalId}
                                //maxZ={maxZ}
                                //groupZ={groupZ}
                                initialModalPos={modal.currentPos}
                                //initialModalPos={modal.pos}
                                openedModalLocations={openedModalLocations}
                                setOpenedModalLocations={setOpenedModalLocations}
                                openedModalGoogle={modal.data}
                                updateCurrentPos={(newPos: any) => updateCurrentPos(modal.id, newPos)}
                                updatePos={(newPos: any) => updatedPos(modal.id, newPos)}
                                isGoogleView={modal.data.isShowingGoogle}
                                setIsGoogleView={setIsGoogleView}
                                logs={modal.logs || []}
                                onSaveSuccess={refreshHistory}
                                //isExisting={typeof modal.id === 'number' || !modal.id.startsWith('new-')}
                                isExisting={modal.id !== initialLocationId}  //newToNull
                                onFetchLogs={() => onFetchLogs(modal.id)}
                                moveDist={moveDist}
                                setMoveDist={setMoveDist}
                                setActiveGroupId={setActiveGroupId}
                                onSavingLocation={onSavingLocation}
                                setOnSavingLocation={setOnSavingLocation}
                                onCloseModalLocation={() => {
                                    setOpenedModalLocations(prev =>
                                        prev.filter(record => record.id !== modal.id)

                                    );

                                }}
                                onClose={() => {
                                    setOpenedModalLocations(prev => prev.filter(m => m.id !== modal.id));
                                }}
                                //setOpenedModalGoogle={setOpenedModalGoogle}
                                setOpenedModalGoogle={(newData: any) => {
                                    setOpenedModalLocations(prev => prev.map(m =>
                                        m.id === modal.id ? { ...m, data: newData } : m
                                    ));
                                }}
                                setCurrentMarker={() => {
                                    if (modal.data.isRedFootMark) return;
                                    //console.log("in setCurrentMaker");
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
                            <ModalGoogle
                                key={`google-${modal.id}`}
                                modal={modal}
                                //groupZ={groupZ}
                                initialLocationId={initialLocationId}
                                setInitialLocationId={setInitialLocationId}
                                updateModalElements={updateModalElements}
                                isFocused={activeGroupId === modal.id}
                                onFocus={() => setActiveGroupId(modal.id)}
                                clickedModalId={clickedModalId}
                                setClickedModalId={setClickedModalId}
                                setActiveGroupId={setActiveGroupId}
                                setOpenedModalLocations={setOpenedModalLocations}
                                openedModalLocations={openedModalLocations}
                                onSavingLocation={onSavingLocation}
                                setOnSavingLocation={setOnSavingLocation}

                                initialModalPosGoogle={
                                    modal.data.hasMovedEnough ?
                                        {
                                            x: modal.currentPos.x - 80,
                                            y: modal.currentPos.y + 40,
                                        }
                                        : null
                                }

                                openedModalGoogle={modal.data}
                                //isGoogleView={isGoogleView}
                                isGoogleView={modal.data.isShowingGoogle}

                                setIsGoogleView={setIsGoogleView}

                                // 💡 1. このモーダル専用の履歴データを渡す（未取得なら空配列）
                                logs={modal.logs || []}

                                // 💡 2. 履歴を取りに行く関数（idを添えて親に頼む）
                                onFetchLogs={() => onFetchLogs(modal.id)}
                                onClose={() => {
                                    //console.log("On closing");
                                    // 💡 親の配列をまるごと更新（イミュータビリティを保つ）
                                    setOpenedModalLocations((prev: any[]) => {
                                        return prev.map((m: any) =>
                                            m.id === modal.id
                                                ? {
                                                    ...m,
                                                    googleData: {
                                                        ...m.googleData, // addmark1
                                                        isShowingGoogle: false
                                                    }
                                                }
                                                : m
                                        );
                                    });

                                }}

                            />
                            <ModalLogs
                                key={`log-${modal.id}`}
                                modal={modal}
                                //groupZ={groupZ}
                                updateModalElements={updateModalElements}
                                initialLocationId={initialLocationId}
                                setInitialLocationId={setInitialLocationId}
                                isFocused={activeGroupId === modal.id}
                                onFocus={() => setActiveGroupId(modal.id)}
                                clickedModalId={clickedModalId}
                                setClickedModalId={setClickedModalId}
                                setActiveGroupId={setActiveGroupId}
                                renderMe={renderMe}
                                openedModalLocations={openedModalLocations}
                                setOpenedModalLocations={setOpenedModalLocations}
                                setIsCommentRecordExist={setIsCommentRecordExist}
                                onSavingLocation={onSavingLocation}
                                setOnSavingLocation={setOnSavingLocation}

                                //isDraggingRef={isDraggingRef}
                                initialModalPosLogs={
                                    modal.data.hasMovedEnough ?
                                        {
                                            x: modal.currentPos.x + 40,
                                            y: modal.currentPos.y + 40
                                        }
                                        : null
                                }
                                //resetMoveFlag={() => resetMoveFlag(modal.id)}
                                openedModalGoogle={modal.data}
                                //isGoogleView={isGoogleView}
                                isGoogleView={modal.data.isShowingGoogle}

                                setIsGoogleView={setIsGoogleView}

                                // 💡 1. このモーダル専用の履歴データを渡す（未取得なら空配列）
                                logs={modal.logs || []}

                                // 💡 2. 履歴を取りに行く関数（idを添えて親に頼む）
                                onFetchLogs={() => onFetchLogs(modal.id)}

                                onSavigSuccess="onSavigSuccess"
                                onClose={() => {
                                    //console.log("On closing");
                                    // 💡 親の配列をまるごと更新（イミュータビリティを保つ）
                                    setOpenedModalLocations((prev: any[]) => {
                                        return prev.map((m: any) =>
                                            m.id === modal.id ? {
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
                            />
                            {modal.comments
                                ?.filter((c: any) => c.isShowingComment)
                                ?.map((c: any, index: number) => (
                                    c.isShowingComment && (
                                        <ModalComments
                                            key={`comment-${c.logId}`}
                                            updateModalElements={updateModalElements}
                                            initialLocationId={initialLocationId}
                                            setInitialLocationId={setInitialLocationId}
                                            logs={modal.logs || []}// dummy just for test 
                                            comment={c}
                                            logId={c.logId}
                                            commentId={c.id}
                                            modal={modal}// これで親(Location)の座標に追従できる
                                            //groupZ={groupZ}
                                            isFocused={activeGroupId === modal.id}
                                            onFocus={() => setActiveGroupId(modal.id)}
                                            clickedModalId={clickedModalId}
                                            setClickedModalId={setClickedModalId}
                                            setActiveGroupId={setActiveGroupId}
                                            initialPos={c.pos}
                                            onFetchLogs={() => onFetchLogs(modal.id)}
                                            openedModalLocations={openedModalLocations}
                                            setOpenedModalLocations={setOpenedModalLocations}
                                            onSaveSuccess={refreshHistory}
                                            isCommentRecordExist={isCommentRecordExist}

                                            onClose={() => {
                                                setOpenedModalLocations(prev =>
                                                    prev.map(loc =>
                                                        loc.id === modal.id
                                                            ? {
                                                                ...loc,
                                                                comments: loc.comments.filter((item: any) =>
                                                                    item.logId !== c.logId)
                                                            }
                                                            : loc
                                                    )
                                                );
                                            }}
                                            initialModalPosComments={
                                                modal.data.hasMovedEnough ?
                                                    {
                                                        //x: modal.currentPos.x + 80 + 40 * (index),
                                                        //y: modal.currentPos.y + 80 + 40 * (index)
                                                        x: modal.currentPos.x + 40 * (2+index),
                                                        y: modal.currentPos.y + 40 * (2+index)
                                                    }
                                                    : null
                                            }
                                        />
                                    )
                                ))}
                        </React.Fragment>
                    )
                })
                }
            </APIProvider>
        </AppProvider>
    );
}
