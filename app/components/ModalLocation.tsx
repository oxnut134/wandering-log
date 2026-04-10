"use client";
import { useState, useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
//import VisitedLogList from './VisitedLogList';
declare const google: any;

export default function ModalLocation({ modal, setCurrentMarker, setOpenedModalLocations, isGoogleView, setIsGoogleView, isModalLogsView, setIsModalLogsView, openedModalGoogle, setopenedModalGoogle, onSaveSuccess, onCloseModalLocation, isExisting, initialModalPos, onFetchLogs, onPosUpdate }: any) {
    const map = useMap();
    const [localPos, setLocalPos] = useState(initialModalPos);
    const [gNewX, setGNewX] = useState<number | undefined>();
    const [onSaving, setOnSaving] = useState(false);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const rightEdgePadding = isMobile ? 150 : 10; // スマホならボタンの裏まで潜り込むために数値を調整

    const handleSave = async () => {
        setOnSaving(true)
        const res = await fetch("/api/wandering_where", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(openedModalGoogle) });
        if (res.ok) {
            // 💡 1. 親(page.tsx)から渡された refreshHistory を実行して地図にピンを出す
            if (onSaveSuccess) onSaveSuccess();

            // 💡 2. 保存が終わったので入力用モーダルを閉じる
            onCloseModalLocation();
        }
        setOnSaving(false)
        if (res.ok) return;
    }

    const handleDelete = async () => {
        if (!confirm("削除しますか？")) return;
        const res = await fetch("/api/wandering_where", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: openedModalGoogle.id }) });
        if (res.ok) { onSaveSuccess(); onCloseModalLocation(); }
    };

    const viewFuncRef = useRef(setIsGoogleView);
    useEffect(() => {
        viewFuncRef.current = setIsGoogleView;
    }, [setIsGoogleView]);


    const handleGoogleSearch = () => {
        if (!map || !(window as any).google) return;
        const service = new google.maps.places.PlacesService(map as any);
        service.nearbySearch({
            location: {
                lat: Number(openedModalGoogle.latitude),
                lng: Number(openedModalGoogle.longitude)
            }, rankBy: google.maps.places.RankBy.DISTANCE, type: 'establishment'
        },
            (results: any, status: any) => {
                //console.log("onsetting true to IsGoogleView");
                //console.log("=====openedModalGoogle:",openedModalGoogle);
                if (status === "OK" && results) {
                    const p = results[0];
                    setopenedModalGoogle({ ...openedModalGoogle, googleData: { place_id: p.place_id, name: p.name, category: p.types?.join(','), address: p.vicinity } });
                    setIsGoogleView(true);
                }
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                    const p = results[0];

                    // 💡 自分のデータ（openedModalGoogle）の中にあるフラグだけを true にする
                    setopenedModalGoogle({
                        ...openedModalGoogle,
                        googleData: {
                            place_id: p.place_id,
                            name: p.name,
                            category: p.types?.join(','),
                            address: p.vicinity
                        },
                        isShowingGoogle: true // 👈 全体のフラグではなく、このモーダル固有のフラグを立てる
                    });
                    setOpenedModalLocations((prev: any[]) => {
                        return prev.map((m: any) =>
                            m.id === modal.id  // 👈 modalId（または id）で自分を探す
                                ? {
                                    ...m,
                                    data: {
                                        ...m.data,
                                        googleData: { name: p.name, place_id: p.place_id }, // 検索結果を格納
                                        isShowingGoogle: true // 👈 ここでフラグをONにする
                                    }
                                }
                                : m
                        );
                    });
                } else {
                    console.log("🚫 検索結果が見つかりませんでした");
                }
            });
    };
    const handleShowLogs = () => {
        setOpenedModalLocations((prev: any[]) => {
            return prev.map((m: any) =>
                m.id === modal.id  // 👈 modalId（または id）で自分を探す
                    ? {
                        ...m,
                        data: {
                            ...m.data,
                            isShowingLogs: true // 👈 ここでフラグをONにする
                        }
                    }
                    : m
            );
        });
    };

    // ModalLocation.tsx の handleUp 内

    //let gNewX:any,gAx:any,gBx:any;
    const xRef = useRef<number | undefined>(undefined);
    const yRef = useRef<number | undefined>(undefined);
    let gAx: any, gBx: any;

    const handleDown = (e: React.MouseEvent | React.TouchEvent | any) => {
        if (e.type === 'touchstart') {
            if (e.cancelable) e.preventDefault();
        }
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const startX = clientX - localPos.x;
        const startY = clientY - localPos.y;

        const handleMove = (moveEvent: any) => {
            const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const moveY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
            //let newX:any;
            //let newY:any;
            let newX = moveX - startX;
            let newY = moveY - startY;
            xRef.current = newX;
            yRef.current = newY;
            console.log("✈️ 代入成功 (Ref):", xRef.current);



            const ax = window.innerWidth;
            const ay = window.innerHeight;
            const bx = 260; // モーダル幅
            const by = 320; // モーダル高

            if (isMobile) {
                // スマホ用のゆるいガード設定
                //newX = Math.max(-20, Math.min(newX, ax - bx + 20));
                if (newX < -10) {
                    newX = -10;
                } else if (newX + bx > ax + rightEdgePadding) {
                    // ax + rightEdgePadding とすることで、ボタンの「左端」という制限を突き抜けます
                    newX = ax - bx + rightEdgePadding;
                }
            } else {
                // PC用のきっちりしたガード設定
                newX = Math.max(0, Math.min(newX, ax - bx));
            }


            //gNewX=newX;
            setGNewX(newX);
            gAx = ax;
            gBx = bx;

            // 💡 4. あなたの定義した境界線ガード・ロジック (Mmyu < Bmyu => Mbyu = 0)
            if (newX < 0) {
                newX = -10; // 左端固定
            } else if (newX + bx > ax) {
                newX = ax - bx + 10; // 右端固定
            }

            if (newY < by) {
                newY = by - 20; // 上端固定 (transformの影響を考慮)
            } else if (newY > ay) {
                newY = ay + 10; // 下端固定
            }

            // 監査ログ（これで数値が出るようになります）
            console.log("✈️ 移動中監査:", { newX, newY });

            setLocalPos({ x: newX, y: newY });

            if (moveEvent.touches) {
                if (moveEvent.cancelable) moveEvent.preventDefault();
            }

        };

        const handleUp = () => {
            //document.removeEventListener('mousemove', handleMove);
            //document.removeEventListener('mouseup', handleUp);
            //syncMapPositionWithModal();
            // ModalLocation.tsx の handleUp 内
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleUp);

            if (onPosUpdate && xRef.current !== undefined) {
                onPosUpdate({ x: xRef.current + 40, y: yRef.current! + 40 });
            }

            const finalPos = { x: xRef.current, y: yRef.current };

            console.log("📍 ドラッグ終了！親へ送る最新座標:", finalPos);

            if (onPosUpdate && finalPos.x !== undefined) {
                onPosUpdate(finalPos);
            }

            // 💡 1. 最終位置を親の基本座標（ModalLocation用）に一回だけ報告する
            if (onPosUpdate && xRef.current !== undefined && yRef.current !== undefined) {
                onPosUpdate({ x: xRef.current + 40, y: yRef.current + 40 });
            }
        };
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        document.addEventListener('touchmove', handleMove, { passive: false }); // 💡 passive: false が重要
        document.addEventListener('touchend', handleUp);
        //document.addEventListener('mousemove', handleMove);
        //document.addEventListener('mouseup', handleUp);
    };

    const syncMapPositionWithModal = () => {
        if (!map) return;

        const projection = map.getProjection();
        if (!projection) return;

        // 1. 現在のモーダルの表示位置 (localPos)
        // transform: translate(0, -100%) なので、実質の「指している点」は localPos そのもの
        const point = new google.maps.Point(localPos.x, localPos.y);

        // 2. 【核心】ピクセル座標を緯度経度 (LatLng) に変換
        // 💡 Projection を使ってブラウザの枠内の位置を地球上の座標へ翻訳
        const latLng = projection.fromPointToLatLng(point);

        if (latLng) {
            // 3. 親のステート (openedModalGoogle) を更新
            // これにより、地図をドラッグしてもこの新しい地点にモーダルが固定されます
            setopenedModalGoogle((prev: any) => ({
                ...prev,
                latitude: latLng.lat(),
                longitude: latLng.lng()
            }));
            console.log("📍 地図上の位置を同期しました:", latLng.lat(), latLng.lng());
        }
    };

    const close = (e: React.MouseEvent) => {
        //e.stopPropagation(); // 💡 イベントの連鎖を断ち切る
        onCloseModalLocation();
    };
    const closeGoogleView = () => {
        //e.stopPropagation(); // 💡 イベントの連鎖を断ち切る
        setIsGoogleView(false); // 💡 ただのフラグオフ
    };
    console.log("openedModalGoogle:", openedModalGoogle);
    //console.log("newX:", gNewX,"ax:", gAx,"bx:", gBx);
    //console.log("localPos:", localPos);
    //alert("localPos: " + JSON.stringify(localPos));
    //console.log("localPos: ",localPos);
    return (
        <>
            <div
                style={{
                    width: '15%',
                    minWidth: '180px',
                    height: 'auto',
                    //aspectRatio: '1 / 1',
                    //minHeight: '45vh',
                    position: 'absolute',
                    //position: 'fixed',
                    top: `${localPos.y - 15}px`, // 少し余裕を持たせる
                    left: `${localPos.x + 15}px`,
                    transform: 'translate(0, -100%)',
                    //top: '50%',          // 💡 変数を使わず「50%」と直接書く
                    //left: '50%',         // 💡 変数を使わず「50%」と直接書く
                    //transform: 'translate(-50%, -50%)', // 💡 真ん中寄せ
                    zIndex: 99999,
                    backgroundColor: 'white',
                    padding: '10px', // 12pxから16pxへ。余白に呼吸を持たせる
                    borderRadius: '10px',
                    //width: '260px', // 220pxと300pxの中間、260pxが「不沈の正解」
                    boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                    fontSize: '13px' // 小さすぎず読みやすいサイズ
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    onMouseDown={handleDown}
                    onTouchStart={handleDown}
                    style={{
                        height: '4vh', background: '#f3f4f6', padding: '0px 0px', cursor: 'move',
                        borderBottom: '1px solid #ddd', userSelect: 'none', fontSize: '11px', borderRadius: '6px',      // 💡 ここから追加：縦横センターにする設定
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    ::: {isExisting ? "既存訪問先" : "新規訪問先"} (ドラッグ可)
                </div>

                {/* ...以下、コンテンツ部分（localPos.x/y を参照するように）... */}
                <div style={{
                    display: 'flex',           // 💡 横並びにする
                    justifyContent: 'space-between', // 💡 左右の両端に振り分ける
                    alignItems: 'center',      // 💡 上下の高さを中央で揃える
                    margin: '0 0 0px 0'       // 下の余白
                }}>
                    <h4 style={{ margin: '0 0 0 0', fontSize: '10px', fontWeight: 'bold' }}>
                        {isExisting ? "③ 既存訪問先" : "② 初めての訪問先"}
                    </h4>
                    <button
                        onClick={setCurrentMarker}
                        style={{
                            background: '#fff',
                            color: '#374151',
                            borderRadius: '6px',
                            padding: '0',       // 💡 中央寄せのために一度リセット
                            fontSize: '12px',   // 💡 絵文字が綺麗に見えるサイズ
                            display: 'flex',    // 💡 中身を真ん中に
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        👣  {/* 💡 ここに絵文字を入れました */}
                    </button>
                </div>
                <p style={{ fontSize: '11px', color: '#777', marginBottom: '5px' }}>
                    緯度: {Number(openedModalGoogle.latitude || 0).toFixed(5)} /
                    経度: {Number(openedModalGoogle.longitude || 0).toFixed(5)}
                </p>
                <input
                    style={{
                        width: '100%',
                        marginBottom: '2%',
                        border: '1px solid #bbb', // 少し視認性を上げる
                        borderRadius: '6px',
                        padding: '1px', // 指でタップしやすい高さ
                        fontSize: '12px',
                        outline: 'none'
                    }}
                    value={openedModalGoogle.name || ""}
                    onChange={e => setopenedModalGoogle({ ...openedModalGoogle, name: e.target.value })}
                    placeholder="名称を入力"
                />

                <textarea
                    style={{
                        width: '100%',
                        height: '10vh', // 入力しやすさを確保
                        marginBottom: '1%',
                        border: '1px solid #bbb',
                        borderRadius: '6px',
                        padding: '4px',
                        fontSize: '10px',
                        resize: 'none'
                    }}
                    value={openedModalGoogle.comment || ""}
                    onChange={e => setopenedModalGoogle({ ...openedModalGoogle, comment: e.target.value })}
                    placeholder="コメントを残す"
                />

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


                <div style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}>
                    <button
                        onClick={handleGoogleSearch}
                        style={{
                            flex: 1, // 均等に横幅を分ける
                            height: '4vh',
                            background: '#ffffff',
                            color: '#2563eb',
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '8px',
                            border: '1px solid #2563eb',
                            display: 'flex',    // 💡 中身を真ん中に
                            alignItems: 'center',
                            justifyContent: 'center',

                        }}
                    >
                        Google情報
                    </button>
                    {/*onClick={() => {
                            setIsModalLogsView(true)
                            if (onFetchLogs) {
                                onFetchLogs();
                            }
                        }}// 💡 履歴を開く*/}
                    <button
                        onClick={handleShowLogs}

                        style={{
                            flex: 1,
                            height: '4vh',
                            background: '#f3f4f6',
                            color: '#374151',
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '8px',
                            border: '1px solid #d1d5db',
                            display: 'flex',    // 💡 中身を真ん中に
                            alignItems: 'center',
                            justifyContent: 'center',

                        }}
                    >
                        訪問記録
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '12px' }}>
                    <button
                        onClick={onCloseModalLocation}
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                        閉じる
                    </button>
                    {isExisting && <button onClick={handleDelete} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>履歴を削除</button>}
                </div>
            </div>
        </>
    );
}
