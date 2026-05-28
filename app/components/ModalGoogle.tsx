"use client";
import { useState, useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
declare const google: any;

export default function ModalGoogle({ modal, initialLocationId, setInitialLocationId, isFocused, onFocus, updateModalElements, isFocusedGoogle, onFocusGoogle, setOpenedModalLocations, openedModalLocations, isGoogleView, setIsGoogleView, openedModalGoogle, setOpenedModalGoogle, onClose, onSave, isExisting, initialModalPosGoogle, onFetchLogs, logs, onSaveSuccess, setOnSaving, setActiveGroupId, onSavingLocation, setOnSavingLocation }: any) {
    const map = useMap();

    const [gNewX, setGNewX] = useState<number | undefined>();
    const [localPos, setLocalPos] = useState<{ x: number, y: number } | null>(null);
    const service = new google.maps.places.PlacesService(map);

    useEffect(() => {
        console.log("openedModalLocations:", openedModalLocations)
    }, [openedModalLocations]);
    useEffect(() => {
        console.log("localPos:", localPos)
    }, [openedModalLocations]);


    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', () => { });
            document.removeEventListener('mouseup', () => { });
            document.removeEventListener('touchmove', () => { });
            document.removeEventListener('touchend', () => { });
        };
    }, []);


    useEffect(() => {
        if (initialModalPosGoogle) {
            setLocalPos(initialModalPosGoogle);
            if (modal.data.hasMovedEnough) {
                updateModalElements(modal.id, (dummy: any) => ({
                    ...dummy,
                    data: {
                        ...dummy.data,
                        hasMovedEnough: false
                    }
                }));
            }

        } else {
            setLocalPos({ x: modal.currentPos.x - 80, y: modal.currentPos.y + 40 });
        }
    }, [initialModalPosGoogle]);

    const handleUpdateGroupZIndex = () => {
        const allValues = openedModalLocations.flatMap((m: any) => [
            Number(m.locations?.zIndexValue) || 1000,
            Number(m.google?.zIndexValue) || 1000,
            Number(m.log?.zIndexValue) || 1000,
            ...(m.comments || []).map((c: any) => Number(c.zIndexValue) || 1000)
        ]);
        const nextZ = Math.max(1000, ...allValues) + 1;
        updateModalElements(modal.id, (dummy: any) => ({
            ...dummy,
            locations: {
                ...dummy.locations,
                zIndexValue: nextZ,
            },
            google: {
                ...dummy.google,
                zIndexValue: nextZ,
            },
            log: {
                ...dummy.log,
                zIndexValue: nextZ,
            },
            comments: (dummy.comments || []).map((c: any) => ({
                ...c,
                zIndexValue: nextZ,
            })),
        }));
    };


    const xRef = useRef<number | undefined>(undefined);
    const yRef = useRef<number | undefined>(undefined);
    let gAx: any, gBx: any;

    const handleMouseDown = (e: any) => {
        if (!e.touches && e.button !== 0) return;
        if (!localPos) return;
        e.stopPropagation();


        onFocus();
        handleUpdateGroupZIndex();


        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const startX = clientX - localPos.x;
        const startY = clientY - localPos.y;

        const handleMouseMove = (moveEvent: any) => {
            const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const moveY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

            let newX = moveX - startX;
            let newY = moveY - startY;

            xRef.current = newX;
            yRef.current = newY;

            const ax = window.innerWidth;
            const ay = window.innerHeight;
            const bx = 260;
            const by = 260;

            setGNewX(newX);
            gAx = ax;
            gBx = bx;

            // 境界線ガード・ロジック (Mmyu < Bmyu => Mbyu = 0)
            if (newX < 0) {
                newX = -10; // 左端固定
            } else if (newX + bx > ax) {
                newX = ax - bx + 10; // 右端固定
            }

            if (newY < by) {
                newY = by + 0; // 上端固定
            } else if (newY > ay) {
                newY = ay + 10//下端固定
            }

            setLocalPos({ x: newX, y: newY });
        };

        const handleMouseUp = (upE: any) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleMouseMove);
            document.removeEventListener('touchend', handleMouseUp);


        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleMouseMove, { passive: false }); // 💡 passive: false が重要
        document.addEventListener('touchend', handleMouseUp);
    };


    const reflectGoogleData = async () => {
        setIsGoogleView(false);

        const payloadLocation = {
            id: modal.id,
            name: modal.googleData.name,
            comment: modal.data.comment,
            latitude: modal.data.latitude,
            longitude: modal.data.longitude,
        };

        let savedData: any;
        let res = await fetch("/api/save_location_without_log_update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadLocation)
        });
        if (res.ok) {
            savedData = await res.json();
            setOpenedModalLocations((prev: any) =>
                prev.map((m: any) =>
                    m.id === modal.id
                        ? {
                            ...m,
                            id: savedData.id,
                            data: {
                                ...m.data,
                                pos: m.pos,
                                id: savedData.id,
                                isNew: false,
                            }
                        }
                        : m
                )
            );
            setTimeout(() => {
                if (onSaveSuccess) onSaveSuccess();
            }, 100);

            onFetchLogs();

        }

        const payload = {
            location_id: savedData.id,
            google_place_id: modal.googleData.place_id,
            name: modal.googleData.name,
            category: modal.googleData.category,
            address: modal.googleData.address

        };
        res = await fetch("/api/save_place", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const savedData: any = await res.json();
            setTimeout(() => {
                if (onSaveSuccess) onSaveSuccess();
            }, 100);

            updateModalElements(modal.id, (dummy: any) => ({
                ...dummy,
                id: savedData.id,
                data: {
                    ...dummy.data,
                    name: modal.googleData.name,
                }
            }));
        } else {
            onFetchLogs();
        }

        return;

    }


    const close = (e: React.MouseEvent) => {
        onClose();
    };
    const closeGoogleView = () => {
        setIsGoogleView(false);
    };
    if (!localPos) return;
    return (
        <>
            {modal?.googleData?.isShowingGoogle ? (
                <>
                    <div
                        style={{
                            width: '15%',
                            minWidth: '180px',
                            position: 'absolute',
                            top: `${localPos.y - 15}px`,
                            left: `${localPos.x + 15}px`,
                            transform: 'translate(0, -100%)',
                            zIndex: modal.google?.zIndexValue || 1000,
                            border: isFocused ? '3px solid #ff4444' : '1px solid #ccc',
                            boxShadow: isFocused ? '0 10px 30px rgba(0,0,0,0.2)' : 'none',
                            backgroundColor: 'white',
                            padding: '10px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            WebkitUserSelect: 'none',
                            userSelect: 'none',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            onMouseDown={handleMouseDown}
                            onContextMenu={(e) => e.preventDefault()}
                            onTouchStart={handleMouseDown}
                            style={{
                                touchAction: 'none',
                                background: '#f3f4f6', padding: '8px 12px', cursor: 'move',
                                borderBottom: '1px solid #ddd', userSelect: 'none', fontSize: '10px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'

                            }}
                            onDoubleClick={(e) => {
                                if (!isFocused) return;
                                e.preventDefault();
                                const allValues = openedModalLocations.flatMap((m: any) => [
                                    Number(m.locations?.zIndexValue) || 1000,
                                    Number(m.google?.zIndexValue) || 1000,
                                    Number(m.log?.zIndexValue) || 1000,
                                    ...(m.comments || []).map((c: any) => Number(c.zIndexValue) || 1000)
                                ]);
                                const nextZ = Math.max(1000, ...allValues) + 1;
                                updateModalElements(modal.id, (dummy: any) => ({
                                    ...dummy,
                                    google: {
                                        ...dummy.google,
                                        zIndexValue: nextZ,

                                    }
                                }));

                                setActiveGroupId(modal.id);

                            }}

                        >
                            {modal.data.isNew ? "新規訪問先" : "既存訪問先"} (ドラッグ)

                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                margin: '5px 0 0px 0',
                                fontSize: '12px',
                                marginBottom: '2px'
                            }}>
                                <strong>{modal?.googleData?.name}</strong>
                            </div>

                            <div style={{
                                fontSize: '12px',
                                marginBottom: '2px'
                            }}>
                                <strong>{modal?.googleData?.address}</strong>

                            </div>


                            <button
                                style={{ width: '100%', height: '4vh', margin: '0 0 2px 0', padding: '10px', borderRadius: '6px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => {
                                    if (modal?.googleData?.url) {
                                        window.open(modal.googleData.url, '_blank', 'noreferrer');
                                    }
                                }} >
                                詳細情報
                            </button>
                            <button
                                style={{ width: '100%', height: '4vh', margin: '0 0 2px 0', padding: '10px', borderRadius: '6px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => {
                                    if (modal?.googleData?.website) {
                                        window.open(modal.googleData.website, '_blank', 'noreferrer');
                                    }
                                }} >
                                ウェブサイト
                            </button>
                            <button
                                style={{ width: '100%', height: '4vh', padding: '10px', borderRadius: '6px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={reflectGoogleData}

                            >
                                この名称を反映
                            </button>
                        </div>
                        <div>
                            <button
                                onClick={onClose}
                                style={{ margin: '10px 0 0px 0', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                                閉じる
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                null
            )}

        </>
    );
}
