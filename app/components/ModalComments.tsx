
"use client";
import { useState, useEffect, useRef } from 'react';
import { useMap } from "@vis.gl/react-google-maps";

export default function ModalComments({ modal, logId, isFocused, onFocus, renderMe, setOpenedModalLocations, isGoogleView, setIsGoogleView, openedModalGoogle, setOpenedModalGoogle, onClose, onSave, isExisting, initialModalPosComments, onFetchLogs, logs, isDraggingRef, onSaveSuccess }: any) {
    const map = useMap();

    const [gNewX, setGNewX] = useState<number | undefined>();
    const [isDragging, setIsDragging] = useState(false);
    const [localPos, setLocalPos] = useState<{ x: number, y: number } | null>(null);
    const [onSaving, setOnSaving] = useState(false);
    //console.log(" =====modal.data.localPosLogs:", modal.data.localPosLogs);
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
            console.log("👻 幽霊退治完了: モーダル消滅に伴いイベントを破棄しました");
        };
    }, []);

    useEffect(() => {
        if (initialModalPosComments) {
            // ① 親のドラッグに追従して位置を更新
            //setLocalPos(initialModalPosComments);
            setLocalPos({
                x: initialModalPosComments.x + 20,
                y: initialModalPosComments.y + 20
            });

            // ② 【重要】追従が完了したので、親のフラグを即座にリセット
            // これをしないと、次に足跡をクリックした時にまた  initialModalPosComments が届いてしまいます
            /*setOpenedModalLocations((prev: any[]) =>
                prev.map((m: any) =>
                    m.id === modal.id
                        ? { ...m, data: { ...m.data, hasMovedEnough: false } }
                        : m
                )
            );*/
        } else if (!localPos) {
            // ③ 初回マウント時などで座標がない場合のみ初期位置をセット
            setLocalPos({ x: modal.currentPos.x + 20, y: modal.currentPos.y + 10 });
            modal.currentPos.x += 20; modal.currentPos.y += 20;
        }
    }, [initialModalPosComments]); // 💡  initialModalPosComments の変化（親の大きな移動）を監視

    useEffect(() => {
        // 1. 履歴データの取得（既存の関数）
        onFetchLogs();

        // 2. コメントデータの取得（非同期処理）




    }, []); // 💡 初回マウント時のみ実行


    const xRef = useRef<number | undefined>(undefined);
    const yRef = useRef<number | undefined>(undefined);

    let gAx: any, gBx: any;

    const handleMouseDown = (e: any) => {
        //setIsDragging(true);
        if (!localPos) return;
        //console.log("🖱️ 子の handleDown が呼ばれた！");
        e.stopPropagation();

        onFocus();
        /*setOpenedModalLocations((prev: any[]) =>
            prev.map((m: any) =>
                m.id === modal.id
                    ? { ...m, zIndex: 1001 } // 👈 常に一番上
                    : { ...m, zIndex: 1000 } // 👈 それ以外は一歩下がる
            )
        );*/

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

    const handleSave = async () => {
        console.log("************ in handle save ***************")
        const currentData = modal.activeComments?.find((c: any) => c.logId === logId);
        console.log("currentData:", currentData)

        if (!currentData) {
            console.error("保存対象のデータが見つかりません");
            return;
        }

        setOnSaving(true)
        const payload = {
            log_id: logId, // 既存ならID、新規ならnull
            commentText: currentData.comment,
        };

        const res = await fetch("/api/save_comment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            console.log("************ ref.ok ***************")

            if (onSaveSuccess) onSaveSuccess();
        }
        setOnSaving(false)
        if (res.ok) return;
    }

    /*if (!logs || logs.length === 0) {
        return <p style={{ fontSize: '12px', color: '#999', padding: '10px' }}>まだ訪問記録がありません</p>;
    }*/
    //console.log("isShowingLogs:", modal.data.isShowingLogs)
    //if (!localPos) return null;
    if (!localPos) {
        console.log("==================localPos=NULL")
        return;
    }
    //console.log("modal.activeComments.isShowingComment:",C)

    return (
        <>
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
                    zIndex: isFocused ? 2000 : 1000,
                    border: isFocused ? '2px solid #ff4444' : '1px solid #ccc',
                    boxShadow: isFocused ? '0 10px 30px rgba(0,0,0,0.2)' : 'none',
                    //zIndex: modal.zIndex || 100,
                    backgroundColor: 'white',
                    padding: '10px', // 12pxから16pxへ。余白に呼吸を持たせる
                    borderRadius: '10px',
                    //boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                    fontSize: '13px' // 小さすぎず読みやすいサイズ
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    onMouseDown={handleMouseDown}
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
                >
                    {modal.data.isNew ? "新規訪問先" : "既存訪問先"} (ドラッグ)
                </div>

                <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <h5 style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                        <strong>🚩 コメント</strong>
                    </h5>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {logs
                            .filter((log: any) => log.id === logId)
                            .map((log: any, index: any) => (
                                <div key={log.id || index} style={{
                                    fontSize: '12px',
                                    padding: '1px 0',
                                    borderBottom: '1px dashed #f0f0f0',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{ fontWeight: 'normal' }}>
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

                                    <span style={{ color: '#aaa' }}>#{logs.length - index}</span>
                                </div>
                            ))}
                    </div>
                    <textarea
                        style={{
                            width: '100%',
                            height: '10vh',
                            marginBottom: '1%',
                            border: '1px solid #bbb',
                            borderRadius: '6px',
                            padding: '4px',
                            fontSize: '10px',
                            resize: 'none'
                        }}
                        // 💡 Propsから現在のコメントを表示
                        value={modal.activeComments?.find((l: any) => l.logId === logId)?.comment || ""}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            // 💡 親の巨大な配列の中から、自分に関連する「地点」と「ログ」を探して更新
                            setOpenedModalLocations((prev: any[]) =>
                                prev.map((m: any) =>
                                    m.id === modal.id
                                        ? {
                                            ...m,
                                            activeComments: m.activeComments?.map((c: any) =>
                                                // 💡 logId が一致する要素を探して、その comment だけを更新する
                                                c.logId === logId ? { ...c, logId: logId, comment: newValue } : c
                                            )
                                            // logs: m.logs.map((l: any) =>
                                            //     l.id === logId ? { ...l, comment: newValue } : l
                                            // )
                                        }
                                        : m
                                )
                            );
                        }}
                        placeholder="コメントを残す"
                    />

                </div>
                <button
                    onClick={handleSave}
                    style={{
                        width: '100%',
                        height: '4vh',
                        background: '#2563eb',
                        color: 'white',
                        marginBottom: '6px',
                        borderRadius: '6px',
                        padding: '10px', // 押しやすいボタンサイズ
                        fontSize: '14px',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',    // 💡 中身を真ん中に
                        alignItems: 'center',
                        justifyContent: 'center',

                    }}
                >
                    {onSaving ? (
                        <>
                            <div>
                                <span>処理中...</span>
                            </div>
                        </>
                    ) : (
                        "保存する"
                    )}
                </button>
                <div>
                    <button
                        onClick={onClose}
                        style={{ margin: '5px 0 0 0', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                        閉じる
                    </button>
                </div>

            </div>
        </>
    );
}
