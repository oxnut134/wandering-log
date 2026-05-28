
"use client";
import { useState, useEffect, useRef } from 'react';
import { useMap } from "@vis.gl/react-google-maps";

export default function ModalLogs({ modal, initialLocationId, setInitialLocationId, updateModalElements, isFocused, onFocus, renderMe, setOpenedModalLocations, openedModalLocations, isGoogleView, setIsGoogleView, openedModalGoogle, setOpenedModalGoogle, onClose, onSave, isExisting, initialModalPosLogs, onFetchLogs, logs, isDraggingRef, setIsCommentRecordExist, setActiveGroupId, onSavingLocation, setOnSavingLocation }: any) {
    const map = useMap();

    const [gNewX, setGNewX] = useState<number | undefined>();
    const [localPos, setLocalPos] = useState<{ x: number, y: number } | null>(null);

    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log("openedModalLocations:", openedModalLocations)
    }, [openedModalLocations]);
    useEffect(() => {
        console.log("localPos:", localPos)
    }, [openedModalLocations]);


    useEffect(() => {
        handleUpdateGroupZIndex();
        return () => {
            document.removeEventListener('mousemove', () => { });
            document.removeEventListener('mouseup', () => { });
            document.removeEventListener('touchmove', () => { });
            document.removeEventListener('touchend', () => { });
        };
    }, []);

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


    useEffect(() => {
        if (initialModalPosLogs) {
            setLocalPos(initialModalPosLogs);
            if (modal.data.hasMovedEnough) {
                updateModalElements(modal.id, (dummy: any) => ({
                    ...dummy,
                    data: {
                        ...dummy.data,
                        hasMovedEnough: false
                    }
                }));
            }
        }
    }, [initialModalPosLogs]);

    useEffect(() => {
        setLocalPos({ x: modal.currentPos.x + 40, y: modal.currentPos.y + 40 });
        onFetchLogs();
    }, []);

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
            const by = (modalRef.current?.offsetHeight || 197) + 25;

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
                newY = ay + 10; // 下端固定
            }

            setLocalPos({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleMouseMove);
            document.removeEventListener('touchend', handleMouseUp);

        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleMouseMove, { passive: false });
        document.addEventListener('touchend', handleMouseUp);

    };
    const handleShowComments = async (logId: number, memoNo: any) => {
        if (!localPos) return;
        if (onSavingLocation) return;

        let existingComment = null;
        let commentId = "";
        let isExist: any;
        try {
            const res = await fetch(`/api/get_comments?log_id=${logId}`);
            const data = await res.json();
            if (data && data.length > 0) {
                commentId = data[0].id;
                existingComment = data[0].comment;
                isExist = true
            } else {
                isExist = false
            }
        } catch (error) {
            console.error("既存コメントの取得に失敗:", error);
        }

        setOpenedModalLocations((prev: any[]) => {
            return prev.map((m: any) => {
                if (m.id !== modal.id) return m;

                const currentComments = m.comments || [];
                if (currentComments.some((c: any) => c.logId === logId)) return m;

                return {
                    ...m,
                    comments: [
                        ...(m.comments || []),
                        {
                            id: commentId,
                            logId: logId,
                            isShowingComment: true,
                            comment: existingComment,
                            memoNo: memoNo,
                            isExistingComment: isExist,
                        }
                    ]
                };
            });
        });
    };
    if (!localPos) return;
    return (
        <>
            {modal.data.isShowingLogs ? (
                <div
                    ref={modalRef}
                    style={{
                        width: '15%',
                        minWidth: '180px',
                        position: 'absolute',
                        top: `${localPos.y - 15}px`,
                        left: `${localPos.x + 15}px`,
                        transform: 'translate(0, -100%)',
                        zIndex: modal.log?.zIndexValue || 1000,
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
                            borderBottom: '1px solid #ddd', userSelect: 'none', fontSize: '11px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'

                        }}
                        onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
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
                                log: {
                                    ...dummy.dummy,
                                    zIndexValue: nextZ,

                                }
                            }));

                            setActiveGroupId(modal.id);
                        }}

                    >
                        {modal.data.isNew ? "新規訪問先" : "既存訪問先"} (ドラッグ)
                    </div>

                    <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                        <h5 style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                            <strong>🚩 訪問履歴（全 {logs.length} 回）</strong>
                        </h5>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {logs.map((log: any, index: any) => (
                                <div
                                    key={log.id || index}
                                    onClick={() => handleShowComments(log.id, logs.length - index)}
                                    style={{
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        padding: '1px 0',

                                        borderBottom: '1px dashed #f0f0f0',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}>
                                    <span
                                        style={{ fontWeight: 'normal' }}
                                    >

                                        {(() => {
                                            const dateStr = String(log.visited_at);
                                            const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');

                                            if (isNaN(date.getTime())) return 'Invalid Date';

                                            return date.toLocaleString('ja-JP', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                timeZone: 'Asia/Tokyo'
                                            });
                                        })()}
                                    </span>

                                    <button
                                        onClick={() => handleShowComments(log.id, logs.length - index)}
                                        style={{ cursor: 'pointer', display: 'inline-block', width: '40px', height: '20px', lineHeight: '20px', textAlign: 'center', color: '#374151', fontSize: '10px' }}>#{logs.length - index}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={onClose}
                            style={{ margin: '5px 0 0 0', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '10px' }}>
                            閉じる
                        </button>
                    </div>

                </div>
            ) : (null)}
        </>
    );
}
