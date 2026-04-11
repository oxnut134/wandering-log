"use client";
import { useState, useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
//import VisitedLogList from './VisitedLogList';

export default function ModalGoogle({ modal, isGoogleView, setIsGoogleView, openedModalGoogle, setopenedModalGoogle, onClose, onSave, isExisting, initialModalPosGoogle, onFetchLogs, logs }: any) {
    const map = useMap();

    const [localPos, setLocalPos] = useState(initialModalPosGoogle);
    const [gNewX, setGNewX] = useState<number | undefined>();

    console.log("on ModalGoogle");

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
                newX = -10; // 左端固定
            } else if (newX + bx > ax) {
                newX = ax - bx +10; // 右端固定
            }

            if (newY < by) {
                newY = by -115; // 上端固定 (transformの影響を考慮)
            } else if (newY > ay) {
                newY = ay+10//下端固定
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



    const close = (e: React.MouseEvent) => {
        //e.stopPropagation(); // 💡 イベントの連鎖を断ち切る
        onClose();
    };
    const closeGoogleView = () => {
        setIsGoogleView(false); // 💡 ただのフラグオフ
    };
    //console.log("isGoogleView*", isGoogleView);
    console.log("openedModalGoogle::", openedModalGoogle);
    //console.log("newX:", gNewX,"ax:", gAx,"bx:", gBx);
    return (
        <>
            {modal.data.isShowingGoogle ? (
                <>
                    <div
                        style={{
                            width: '15%',
                            minWidth: '180px',
                            position: 'absolute',
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

                        {/* ...以下、コンテンツ部分（localPos.x/y を参照するように）... */}
                        <h4 style={{
                            margin: '3px 0 3px 0', fontSize: '10px', fontWeight: 'bold',
                        }}>
                            {isExisting ? "③ 既存訪問先" : "② 初めての訪問先"}
                        </h4>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '10px',
                                margin: '5x,0,0px,0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start'

                            }}>Google名: <br /></div>
                            <div style={{
                                fontSize: '14px',
                                marginBottom: '5px'
                            }}>
                                <strong>{openedModalGoogle?.googleData?.name}</strong>
                            </div>
                            <button
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold' }}
                                onClick={() => { setopenedModalGoogle({ ...openedModalGoogle, name: openedModalGoogle.googleData.name }); setIsGoogleView(false); }}
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
