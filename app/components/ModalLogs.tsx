
"use client";
import { useState, useEffect, useRef } from 'react';
import { useMap } from "@vis.gl/react-google-maps";

export default function ModalLogs({ modal, initialLocationId, setInitialLocationId, updateModalElements, isFocused, onFocus, renderMe, setOpenedModalLocations, openedModalLocations, isGoogleView, setIsGoogleView, openedModalGoogle, setOpenedModalGoogle, onClose, onSave, isExisting, initialModalPosLogs, onFetchLogs, logs, isDraggingRef, setIsCommentRecordExist, setActiveGroupId,onSavingLocation, setOnSavingLocation }: any) {
    const map = useMap();

    const [gNewX, setGNewX] = useState<number | undefined>();
    //const [isDragging, setIsDragging] = useState(false);
    const [localPos, setLocalPos] = useState<{ x: number, y: number } | null>(null);
    //console.log(" =====modal.data.localPosLogs:", modal.data.localPosLogs);

    useEffect(() => {
        console.log("openedModalLocations:", openedModalLocations)
    }, [openedModalLocations]);
    useEffect(() => {
        console.log("localPos:", localPos)
    }, [openedModalLocations]);


    // ModalComments.tsx の中に追加
    useEffect(() => {

        // 💡 コンポーネントが消える（閉じられる）瞬間に実行される
        return () => {
            // 万が一ドラッグ中に閉じられた場合でも、イベントを強制解除する
            // ※本当は handleMouseMove を関数外に出すのが理想ですが、まずはこれで「幽霊」を消せます
            document.removeEventListener('mousemove', () => { });
            document.removeEventListener('mouseup', () => { });
            document.removeEventListener('touchmove', () => { });
            document.removeEventListener('touchend', () => { });
            //console.log("👻 幽霊退治完了: モーダル消滅に伴いイベントを破棄しました");
        };
    }, []);
    useEffect(() => {
        if (initialModalPosLogs) {
            // 追従後、位置を更新
            setLocalPos(initialModalPosLogs);
            if (modal.data.hasMovedEnough) {
                updateModalElements(modal.id, (dummy: any) => ({
                    ...dummy,
                    data: {
                        ...dummy.data,
                        hasMovedEnough: false // 役割終了のためリセット
                    }
                }));
            }


        } /*else if (!localPos) {
            //  初回マウント時、初期位置セット
            setLocalPos({ x: modal.currentPos.x + 40, y: modal.currentPos.y + 40 });
            setOpenedModalLocations((prev: any[]) => {
                return prev.map((m: any) =>
                    m.id === modal.id  // 👈 modalId（または id）で自分を探す
                        ? {
                            ...m,
                            currentPos: { x: modal.currentPos.x + 40, y: modal.currentPos.y + 40 },
                        }
                        : m
                );
            });
        }*/
    }, [initialModalPosLogs]); // 💡 initialModalPosLogs の変化（親の大きな移動）を監視

    useEffect(() => {
        //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>done")
        
        setLocalPos({ x: modal.currentPos.x+40, y: modal.currentPos.y+40 });
        
        /*setOpenedModalLocations((prev: any[]) => {
            return prev.map((m: any) =>
                m.id === modal.id  // 👈 modalId（または id）で自分を探す
                    ? {
                        ...m,
                        currentPos: { x: modal.currentPos.x + 40, y: modal.currentPos.y + 40 },
                    }
                    : m
            );
        });*/
        onFetchLogs();
    }, []);

    const xRef = useRef<number | undefined>(undefined);
    const yRef = useRef<number | undefined>(undefined);

    let gAx: any, gBx: any;

    const handleMouseDown = (e: any) => {
        if (!e.touches && e.button !== 0) return;

        //setIsDragging(true);
        if (!localPos) return;
        //console.log("🖱️ 子の handleDown が呼ばれた！");
        e.stopPropagation();

        onFocus();



        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const startX = clientX - localPos.x;
        const startY = clientY - localPos.y;

        const handleMouseMove = (moveEvent: any) => {
            const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const moveY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

            // 💡 3. moveEvent (ブラウザの生イベント) を使って計算
            //let newX = moveEvent.clientX - startX;
            //let newY = moveEvent.clientY - startY;
            let newX = moveX - startX;
            let newY = moveY - startY;

            xRef.current = newX;
            yRef.current = newY;
            //console.log("✈️ 代入成功 (Ref):", xRef.current);

            const ax = window.innerWidth;
            const ay = window.innerHeight;
            const bx = 260; // モーダル幅
            const by = 170;// モーダル高

            //gNewX=newX;
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
                newY = by - 10; // 上端固定 (transformの影響を考慮)
            } else if (newY > ay) {
                newY = ay + 10; // 下端固定
            }

            // 監査ログ（これで数値が出るようになります）
            //console.log("✈️ 移動中監査:", { newX, newY });
            //modal.data.localPosLogs = { x: newX, y: newY };

            setLocalPos({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            //modal.data.hasMovedEnough=false;//<<=====追従後の子モーダルを開放
            //setIsDragging(false);
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
    const handleShowComments = async (logId: number, memoNo: any) => { // 💡 async に変更
        if (!localPos) return;
        if (onSavingLocation) return;

        // 1. 💡 まず、DBから既存のコメントがあるか取ってくる
        let existingComment = null;
        let commentId = "";
        let isExist: any;
        try {
            const res = await fetch(`/api/get_comments?log_id=${logId}`);
            const data = await res.json();
            // 配列の0番目にコメントがあれば取得
            if (data && data.length > 0) {
                commentId = data[0].id;
                existingComment = data[0].comment;
                isExist = true
            } else {
                isExist = false
            }
            console.log("comments:", data)
        } catch (error) {
            console.error("既存コメントの取得に失敗:", error);
        }

        // 2. 💡 取得したコメントを含めて State を更新
        setOpenedModalLocations((prev: any[]) => {
            console.log("activeComment generated with comment:", existingComment);
            return prev.map((m: any) => {
                if (m.id !== modal.id) return m;

                const currentComments = m.comments || [];
                if (currentComments.some((c: any) => c.logId === logId)) return m;

                return {
                    ...m,
                    comments: [
                        ...(m.comments || []), // addmark1
                        {
                            id: commentId,
                            logId: logId,
                            isShowingComment: true,
                            comment: existingComment,
                            memoNo: memoNo,
                            // 💡 ここで初期値を注入！
                            isExistingComment: isExist,
                            //pos: { x: localPos.x + 40, y: localPos.y + 40 }
                        }
                    ]
                };
            });
        });
    };
    //console.log("localPos>>>>>>>>>>>>>>>>",localPos)
    if (!localPos) return;
    return (
        <>
            {modal.data.isShowingLogs ? (
                <div
                    style={{
                        width: '15%',
                        minWidth: '180px',
                        position: 'absolute',
                        //top: `${localPos.y - 15}px`, // 少し余裕を持たせる
                        //left: `${localPos.x + 15}px`,
                        top: `${localPos.y - 15}px`, // 少し余裕を持たせる
                        left: `${localPos.x + 15}px`,
                        transform: 'translate(0, -100%)',
                        zIndex: modal.log?.zIndexValue,
                        //zIndex: (isFocused && modal.log?.rightClick) ? modal.log.zIndexValueRight : (isFocused ? modal.zIndexValue : null),
                        //zIndex: modal.log?.rightClick ? modal.log.zIndexValueRight : modal.zIndexValue,
                        //zIndex: modal.zIndexValue,
                        //zIndex: isFocused ? 2000 : 1000,
                        border: isFocused ? '3px solid #ff4444' : '1px solid #ccc',
                        boxShadow: isFocused ? '0 10px 30px rgba(0,0,0,0.2)' : 'none',
                        //zIndex: modal.zIndex || 100,
                        backgroundColor: 'white',
                        padding: '10px', // 12pxから16pxへ。余白に呼吸を持たせる
                        borderRadius: '10px',
                        //boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                        fontSize: '13px', // 小さすぎず読みやすいサイズ
                        WebkitUserSelect: 'none',//文字選択なし/iPhone
                        userSelect: 'none',//文字選択なし/PC.android,etc.
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
                        //onContextMenu={(e) => {
                        onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isFocused) return;
                            console.log("===== right click executed =======")
                            e.preventDefault(); // ブラウザ標準のメニューを出さない
                            const allValues = openedModalLocations.flatMap((m: any) => [
                                Number(m.locations?.zIndexValue) || 1000,
                                Number(m.google?.zIndexValue) || 1000,
                                Number(m.log?.zIndexValue) || 1000,
                                ...(m.comments || []).map((c: any) => Number(c.zIndexValue) || 1000)
                            ]);
                            const nextZ = Math.max(1000, ...allValues) + 1;

                            console.log("✈️ 共通関数で更新:", { nextZ });

                            updateModalElements(modal.id, (dummy: any) => ({
                                ...dummy,
                                log: {
                                    ...dummy.dummy,
                                    zIndexValue: nextZ,

                                }
                                //zIndexValue: nextZ,
                            }));

                            // フォーカスもこのグループに合わせる
                            setActiveGroupId(modal.id);
                            //console.log("maxZGoogle:", maxZ)
                            console.log("modalGoogle:::", modal)
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
                                            // 1. 文字列として受け取り、必ず末尾に 'Z' がある状態にする
                                            // (バックエンドが ISOString を送っていれば、これで UTC と認識されます)
                                            const dateStr = String(log.visited_at);
                                            const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
                                            //console.log(">>>>>>>>date:", date);

                                            if (isNaN(date.getTime())) return 'Invalid Date';

                                            // 2. 日本時間（Asia/Tokyo）を指定して出力
                                            // これで 02:07(UTC) が 11:07(JST) に変換されます
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
