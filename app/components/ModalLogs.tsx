
// app/components/VisitedLogList.tsx
"use client";
import { useState, useEffect, useRef } from 'react';
import { useMap } from "@vis.gl/react-google-maps";

export default function ModalLogs({ modal, isGoogleView, setIsGoogleView, openedModalGoogle, setopenedModalGoogle, onClose, onSave, isExisting, initialModalPosGoogle, onFetchLogs, logs }: any) {
    const map = useMap();

    const [localPos, setLocalPos] = useState(initialModalPosGoogle);
    const [gNewX, setGNewX] = useState<number | undefined>();

    useEffect(() => {
        onFetchLogs();
    }, []);

    // 💡 親（ModalLocationの移動結果）から降りてくる最新座標を監視して、自分を同期させる
    useEffect(() => {
        if (initialModalPosGoogle) {
            setLocalPos(initialModalPosGoogle);
        }
    }, [initialModalPosGoogle]); // 👈 親の currentPos が変わるたびに実行される

    const xRef = useRef<number | undefined>(undefined);
    let gAx: any, gBx: any;

    const handleMouseDown = (e: React.MouseEvent) => {
        // 💡 2. 掴んだ瞬間に「マウスとモーダルの距離」をこの関数内だけで固定
        const startX = e.clientX - localPos.x;
        const startY = e.clientY - localPos.y;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            // 💡 3. moveEvent (ブラウザの生イベント) を使って計算
            let newX = moveEvent.clientX - startX;
            let newY = moveEvent.clientY - startY;

            xRef.current = newX;
            console.log("✈️ 代入成功 (Ref):", xRef.current);

            const ax = window.innerWidth;
            const ay = window.innerHeight;
            const bx = 260; // モーダル幅
            const by = 320; // モーダル高

            //gNewX=newX;
            setGNewX(newX);
            gAx = ax;
            gBx = bx;

            // 境界線ガード・ロジック (Mmyu < Bmyu => Mbyu = 0)
            if (newX < 0) {
                newX = 0; // 左端固定
            } else if (newX + bx > ax) {
                newX = ax - bx - 30; // 右端固定
            }

            if (newY < by) {
                newY = by + 60; // 上端固定 (transformの影響を考慮)
            } else if (newY > ay) {
                newY = ay; // 下端固定
            }

            // 監査ログ（これで数値が出るようになります）
            console.log("✈️ 移動中監査:", { newX, newY });

            setLocalPos({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    /*if (!logs || logs.length === 0) {
        return <p style={{ fontSize: '12px', color: '#999', padding: '10px' }}>まだ訪問記録がありません</p>;
    }*/
    console.log("isShowingLogs:", modal.data.isShowingLogs)
    return (
        <>
            {modal.data.isShowingLogs ? (
                <div
                    style={{
                        position: 'absolute',
                        top: `${localPos.y - 15}px`, // 少し余裕を持たせる
                        left: `${localPos.x + 15}px`,
                        transform: 'translate(0, -100%)',
                        backgroundColor: 'white',
                        padding: '16px', // 12pxから16pxへ。余白に呼吸を持たせる
                        borderRadius: '10px',
                        width: '200px', // 220pxと300pxの中間、260pxが「不沈の正解」
                        boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                        fontSize: '13px' // 小さすぎず読みやすいサイズ
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        onMouseDown={handleMouseDown}
                        style={{
                            background: '#f3f4f6', padding: '8px 12px', cursor: 'move',
                            borderBottom: '1px solid #ddd', userSelect: 'none', fontSize: '11px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'

                        }}
                    >
                        ::: {isExisting ? "既存訪問先" : "新規訪問先"} (ドラッグ可)
                    </div>

                    <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                        <h5 style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                            <strong>🚩 訪問履歴（全 {logs.length} 回）</strong>
                        </h5>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {logs.map((log: any, index: any) => (
                                <div key={log.id || index} style={{
                                    fontSize: '12px',
                                    padding: '1px 0',
                                    borderBottom: '1px dashed #f0f0f0',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{ fontWeight: index === 0 ? 'normal' : 'normal' }}>
                                        {new Date(log.visited_at).toLocaleString('ja-JP', {
                                            year: 'numeric', month: '2-digit', day: '2-digit',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                    <span style={{ color: '#aaa' }}>#{logs.length - index}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={onClose}
                            //onClick={closeGoogleView}
                            style={{ margin: '5px 0 0 0',background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                            閉じる
                        </button>
                    </div>

                </div>
            ) : (null)}
        </>
    );
}
