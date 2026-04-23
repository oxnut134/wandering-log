"use client";
import { useState, useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
//import VisitedLogList from './VisitedLogList';
declare const google: any;

export default function ModalGoogle({ modal, setOpenedModalLocations, isGoogleView, setIsGoogleView, openedModalGoogle, setopenedModalGoogle, onClose, onSave, isExisting, initialModalPosGoogle, onFetchLogs, logs }: any) {
    const map = useMap();

    //const [localPos, setLocalPos] = useState(initialModalPosGoogle);
    const [gNewX, setGNewX] = useState<number | undefined>();
    const [localPos, setLocalPos] = useState<{ x: number, y: number } | null>(null);
    const service = new google.maps.places.PlacesService(map);


    useEffect(() => {
        service.getDetails({
            placeId: modal.data.google_place_id,
            // 💡 取得したいフィールドを正確に指定（不要な項目を削ると節約になります）
            fields: ['name', 'types', 'formatted_address', 'url', 'website']
        }, (place: any, status: any) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                console.log("カテゴリー:", place.types);             // Array: ['establishment', 'point_of_interest', ...]
                console.log("住所:", place.formatted_address);      // String: "日本、〒169-0074 東京都新宿区..."
                console.log("GoogleマップURL:", place.url);         // String: "https://maps.google.com/..."
                console.log("公式ウェブサイト:", place.website);   // String: (あれば) "https://example.com"
                setOpenedModalLocations((prev: any[]) => {
                    return prev.map((m: any) =>
                        m.id === modal.id  // 👈 modalId（または id）で自分を探す
                            ? {
                                ...m,
                                data: {
                                    ...m.data,
                                    googleDetailData: {
                                        type: place.types,
                                        address: place.formatted_address,
                                        url: place.url,
                                        website: place.website,
                                    }, // 検索結果を格納
                                    //isShowingGoogle: true // 👈 ここでフラグをONにする
                                }
                            }
                            : m
                    );
                });

                // 💡 ここでStateを更新してモーダルに表示

            } else {
                console.error("詳細情報の取得に失敗しました:", status);
            }
        });
    }, [])

    useEffect(() => {
        if (initialModalPosGoogle) {
            // 💡 親から「ずらした位置」が届いていればそれを使う
            setLocalPos(initialModalPosGoogle);
            setOpenedModalLocations((prev: any[]) =>
                prev.map((m: any) =>
                    m.id === modal.id
                        ? { ...m, data: { ...m.data, hasMovedEnough: false } }
                        : m
                )
            );

        } else {
            // 💡 そうでなければ、modal自身の現在の位置を使う
            setLocalPos({ x: modal.currentPos.x, y: modal.currentPos.y });
        }
    }, [initialModalPosGoogle]); // 👈 空の配列にすることで「最初の1回だけ」実行される



    const xRef = useRef<number | undefined>(undefined);
    const yRef = useRef<number | undefined>(undefined);
    let gAx: any, gBx: any;

    const handleMouseDown = (e: any) => {
        if (!localPos) return;

        setOpenedModalLocations((prev: any[]) =>
            prev.map((m: any) =>
                m.id === modal.id
                    ? { ...m, zIndex: 1001 } // 👈 常に一番上
                    : { ...m, zIndex: 1000 } // 👈 それ以外は一歩下がる
            )
        );

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // 💡 2. 掴んだ瞬間に「マウスとモーダルの距離」をこの関数内だけで固定
        const startX = clientX - localPos.x;
        const startY = clientY - localPos.y;

        const handleMouseMove = (moveEvent: any) => {
            const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const moveY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

            // 💡 3. moveEvent (ブラウザの生イベント) を使って計算
            let newX = moveX - startX;
            let newY = moveY - startY;

            xRef.current = newX;
            yRef.current = newX;
            //console.log("✈️ 代入成功 (Ref):", xRef.current);

            const ax = window.innerWidth;
            const ay = window.innerHeight;
            const bx = 260; // モーダル幅
            //const by = 320; // モーダル高
            const by = 215; // モーダル高

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
                //newY = by -115; // 上端固定 (transformの影響を考慮)
                newY = by - 10; // 上端固定 (transformの影響を考慮)
            } else if (newY > ay) {
                newY = ay + 10//下端固定
            }

            // 監査ログ（これで数値が出るようになります）
            //console.log("✈️ 移動中監査:", { newX, newY });

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



    const close = (e: React.MouseEvent) => {
        //e.stopPropagation(); // 💡 イベントの連鎖を断ち切る
        onClose();
    };
    const closeGoogleView = () => {
        setIsGoogleView(false); // 💡 ただのフラグオフ
    };
    //console.log("isGoogleView*", isGoogleView);
    //console.log("openedModalGoogle::", openedModalGoogle);
    //console.log("newX:", gNewX,"ax:", gAx,"bx:", gBx);
    if (!localPos) return;
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
                            zIndex: modal.zIndex || 100,
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
                                borderBottom: '1px solid #ddd', userSelect: 'none', fontSize: '10px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'

                            }}
                        >
                            ::: {modal.data.isNew ? "新規訪問先" : "既存訪問先"} (ドラッグ可)

                        </div>

                        {/* ...以下、コンテンツ部分（localPos.x/y を参照するように）... */}
                        {/*<h4 style={{
                            margin: '3px 0 3px 0', fontSize: '10px', fontWeight: 'bold',
                        }}>
                            {isExisting ? "③ 既存訪問先" : "② 初めての訪問先"}
                        </h4>*/}
                        <div style={{ textAlign: 'center' }}>
                            {/*<div style={{
                                fontSize: '12px',
                                margin: '2x,0,0px,0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start'

                            }}>Google名: <br /></div>*/}
                            <div style={{
                                margin: '2x,0,0px,0',
                                fontSize: '12px',
                                marginBottom: '2px'
                            }}>
                                <strong>{openedModalGoogle?.googleData?.name}</strong>
                            </div>

                            {/*<div style={{
                                fontSize: '12px',
                                margin: '2x,0,0px,0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start'

                            }}>カテゴリ: <br /></div>
                            <div style={{
                                fontSize: '12px',
                                marginBottom: '2px'
                            }}>
                                <strong>{modal.data.googleDetailData.type.join(', ')}</strong>

                            </div>*/}

                            {/*<div style={{
                                fontSize: '12px',
                                margin: '2x,0,0px,0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start'

                            }}>住所: <br /></div>*/}
                            <div style={{
                                fontSize: '12px',
                                marginBottom: '2px'
                            }}>
                                <strong>{modal?.data?.googleDetailData?.address}</strong>

                            </div>


                            <button
                                style={{ width: '100%', height: '4vh', margin: '0 0 2px 0', padding: '10px', borderRadius: '6px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => {
                                    // 💡 ここに飛ばしたいURLを指定します
                                    if (modal?.data?.googleDetailData?.url) {
                                        window.open(modal.data.googleDetailData.url, '_blank', 'noreferrer');
                                    }
                                }} >
                                詳細情報
                            </button>
                            <button
                                style={{ width: '100%', height: '4vh', margin: '0 0 2px 0', padding: '10px', borderRadius: '6px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => {
                                    // 💡 ここに飛ばしたいURLを指定します
                                    if (modal?.data?.googleDetailData?.url) {
                                        window.open(modal.data.googleDetailData.website, '_blank', 'noreferrer');
                                    }
                                }} >
                                ウェブサイト
                            </button>
                             <button
                                style={{ width: '100%',  height: '4vh', padding: '10px', borderRadius: '6px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
