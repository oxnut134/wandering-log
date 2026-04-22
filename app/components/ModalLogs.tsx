
"use client";
import { useState, useEffect, useRef } from 'react';
import { useMap } from "@vis.gl/react-google-maps";

export default function ModalLogs({ modal, renderMe, setOpenedModalLocations, isGoogleView, setIsGoogleView, openedModalGoogle, setopenedModalGoogle, onClose, onSave, isExisting, initialModalPosLogs, onFetchLogs, logs, isDraggingRef }: any) {
    const map = useMap();

    const [gNewX, setGNewX] = useState<number | undefined>();
    const [isDragging, setIsDragging] = useState(false);
    const [localPos, setLocalPos] = useState<{ x: number, y: number } | null>(null);
    console.log(" =====modal.data.localPosLogs:", modal.data.localPosLogs);
    /* if ( initialModalPosLogs) {
         modal.data.localPosLogs = initialModalPosLogs;
    //     renderMe(); // 先ほど作った強制再描画関数
     }*/
    /*useEffect(() => {
        if (isDragging) {
            // 💡 ここは確実に isDragging が true になった後に実行される
            console.log("親の配列でもドラッグ中になりました");
            renderMe();
        }
    }, [isDragging]);*/
    /*useEffect(() => {
        if (initialModalPosLogs) {
            // 💡 親から「ずらした位置」が届いていればそれを使う
            setLocalPos(initialModalPosLogs);

        } else {
            // 💡 そうでなければ、modal自身の現在の位置を使う
            setLocalPos({ x: modal.currentPos.x, y: modal.currentPos.y });
        }
    }, []); // 👈 空の配列にすることで「最初の1回だけ」実行される
    //console.log("on ModalGoogle");

    // 💡 親（ModalLocationの移動結果）から降りてくる最新座標を監視して、自分を同期させる
    useEffect(() => {
        if (initialModalPosLogs) {
            setLocalPos(initialModalPosLogs);
        }
    }, [initialModalPosLogs]); // 👈 親の currentPos が変わるたびに実行される
*/
    // 💡 2つの useEffect をこれ1つにまとめます
    useEffect(() => {
        if (initialModalPosLogs) {
            // ① 親のドラッグに追従して位置を更新
            setLocalPos(initialModalPosLogs);

            // ② 【重要】追従が完了したので、親のフラグを即座にリセット
            // これをしないと、次に足跡をクリックした時にまた initialModalPosLogs が届いてしまいます
            setOpenedModalLocations((prev: any[]) =>
                prev.map((m: any) =>
                    m.id === modal.id
                        ? { ...m, data: { ...m.data, hasMovedEnough: false } }
                        : m
                )
            );
        } else if (!localPos) {
            // ③ 初回マウント時などで座標がない場合のみ初期位置をセット
            setLocalPos({ x: modal.currentPos.x, y: modal.currentPos.y });
        }
    }, [initialModalPosLogs]); // 💡 initialModalPosLogs の変化（親の大きな移動）を監視

    useEffect(() => {
        onFetchLogs();
    }, []);

    const xRef = useRef<number | undefined>(undefined);
    const yRef = useRef<number | undefined>(undefined);

    let gAx: any, gBx: any;

    const handleMouseDown = (e: any) => {
        //setIsDragging(true);
        if (!localPos) return;
        console.log("🖱️ 子の handleDown が呼ばれた！");
        e.stopPropagation();

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
            console.log("✈️ 代入成功 (Ref):", xRef.current);

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
            console.log("✈️ 移動中監査:", { newX, newY });
            //modal.data.localPosLogs = { x: newX, y: newY };

            setLocalPos({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            //modal.data.hasMovedEnough=false;//<<=====追従後の子モーダルを開放
            //setIsDragging(false);
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
    //if (!localPos) return null;
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
                        zIndex: 100000,
                        backgroundColor: 'white',
                        padding: '10px', // 12pxから16pxへ。余白に呼吸を持たせる
                        borderRadius: '10px',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
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
                            style={{ margin: '5px 0 0 0', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                            閉じる
                        </button>
                    </div>

                </div>
            ) : (null)}
        </>
    );
}
