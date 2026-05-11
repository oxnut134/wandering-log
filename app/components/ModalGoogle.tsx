"use client";
import { useState, useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
//import VisitedLogList from './VisitedLogList';
declare const google: any;

export default function ModalGoogle({ modal, isFocused, onFocus, updateModalElements, isFocusedGoogle, onFocusGoogle, setOpenedModalLocations, openedModalLocations, isGoogleView, setIsGoogleView, openedModalGoogle, setOpenedModalGoogle, onClose, onSave, isExisting, initialModalPosGoogle, onFetchLogs, logs, onSaveSuccess, setOnSaving, setActiveGroupId, }: any) {
    const map = useMap();

    //const [localPos, setLocalPos] = useState(initialModalPosGoogle);
    const [gNewX, setGNewX] = useState<number | undefined>();
    const [localPos, setLocalPos] = useState<{ x: number, y: number } | null>(null);
    const service = new google.maps.places.PlacesService(map);

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
        console.log("*****************************************")
        if (initialModalPosGoogle) {
            // 追従後、位置を更新
            setLocalPos(initialModalPosGoogle);
            if (modal.data.hasMovedEnough) {
                updateModalElements(modal.id, (dummy: any) => ({
                    ...dummy,
                    data: {
                        ...dummy.data,
                        hasMovedEnough: false // 役割終了のためリセット
                    }
                }));
            }

        } else {
            //  初回マウント時、初期位置セット
            setLocalPos({ x: modal.currentPos.x - 80, y: modal.currentPos.y + 40 });
        }
    }, [initialModalPosGoogle]); // 👈 空の配列にすることで「最初の1回だけ」実行される

    /*const handleUpdateZIndex = () => {
        const allValues = openedModalLocations.flatMap((m: any) => [
            Number(m.zIndexValue) || 1000,
            Number(m.zIndexValueRight) || 1000,
            Number(m.data?.zIndexValue) || 1000,
            Number(m.google?.zIndexValueRight) || 1000,
            Number(m.log?.zIndexValueRight) || 1000,
            ...(m.comments || []).map((c: any) => Number(c.zIndexValueRight) || 1000)
        ]);
        //const maxZ = Math.max(1000, ...allValues);
        // 1. 全体の最大値を計算 (計算には今の最新の状態 openedModalLocations を使う)
        // const allValues = openedModalLocations.flatMap((m: any) => [
        //     Number(m.zIndexValue) || 1000,
        //     Number(m.data?.zIndexValue) || 1000,
        //     ...(m.comments || []).map((c: any) => Number(c.zIndexValue) || 1000)
        // ]);
        const nextZ = Math.max(1000, ...allValues) + 1;

        console.log("✈️ 共通関数で更新:", { nextZ });

        // 2. 共通の「魔法の杖」を振る
        updateModalElements(modal.id, (dummy: any) => ({
            ...dummy,
            zIndexValue: nextZ,
            google: {
                ...dummy.data,
                zIndexValueRight: nextZ
            },
            hasMovedEnough: false,
            rightClick: false,

        }));
    };*/
    /*const handleUpdateZIndex = () => {
        const allValues = openedModalLocations.flatMap((m: any) => [
            Number(m.locations?.zIndexValue) || 1000,
            Number(m.google?.zIndexValue) || 1000,
            Number(m.logs?.zIndexValue) || 1000,
            ...(m.comments || []).map((c: any) => Number(c.zIndexValue) || 1000)
        ]);
        const nextZ = Math.max(1000, ...allValues) ;
        //const nextZ = Math.max(1000, ...allValues) + 1;

        console.log("✈️ 共通関数で更新:", { nextZ });

        updateModalElements(modal.id, (dummy: any) => ({
            ...dummy,
            google: {
                ...dummy.google,
                zIndexValue: nextZ,

            }
            //zIndexValue: nextZ,
        }));

    };*/
    const handleUpdateGroupZIndex = () => {
        const allValues = openedModalLocations.flatMap((m: any) => [
            Number(m.locations?.zIndexValue) || 1000,
            Number(m.google?.zIndexValue) || 1000,
            Number(m.log?.zIndexValue) || 1000,
            ...(m.comments || []).map((c: any) => Number(c.zIndexValue) || 1000)
        ]);
        //const nextZ = Math.max(1000, ...allValues);
        const nextZ = Math.max(1000, ...allValues) + 1;

        console.log("allValues:", allValues);

        updateModalElements(modal.id, (dummy: any) => ({
            ...dummy,
            locations: {
                ...dummy.dummy,
                zIndexValue: nextZ,
            },
            google: {
                ...dummy.dummy,
                zIndexValue: nextZ,
            },
            log: {
                ...dummy.dummy,
                zIndexValue: nextZ,
            },
            comments: (dummy.logs || []).map((c: any) => ({
                ...c,
                zIndexValue: nextZ,
            })),
            //zIndexValue: nextZ,
        }));

    };



    const xRef = useRef<number | undefined>(undefined);
    const yRef = useRef<number | undefined>(undefined);
    let gAx: any, gBx: any;

    const handleMouseDown = (e: any) => {
        if (!e.touches && e.button !== 0) return;
        if (!localPos) return;

        onFocus();
        //handleUpdateGroupZIndex();

        //handleUpdateZIndex();
        //  hasMovedEnough リセット
        /*updateModalElements(modal.id, (dummy: any) => ({
            ...dummy,
            data: {
                ...dummy.data,
                hasMovedEnough: false,
                rightClick: false,

            }
        }));*/

        //onFocusGoogle();
        /*setOpenedModalLocations((prev: any[]) =>
            prev.map((m: any) =>
                m.id === modal.id
                    ? { ...m, zIndex: 1001 } // 👈 常に一番上
                    : { ...m, zIndex: 1000 } // 👈 それ以外は一歩下がる
            )
        );*/

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


    const reflectGoogleData = async () => {
        //const newName = modal.googleData.name;
        console.log("==========opendModalGoogle:", modal);
        setIsGoogleView(false);
        const payload = {
            location_id: modal.id,
            google_place_id: modal.googleData.place_id,
            name: modal.googleData.name,
            category: modal.googleData.category,
            address: modal.googleData.address

        };
        console.log("🔥 いまから fetch を実行します！宛先: /api/save_place");
        const res = await fetch("/api/save_place", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("📍 受信データ:", data);
        if (res.ok) {
            if (onSaveSuccess) onSaveSuccess();
        }
        //setOnSaving(false)
        if (res.ok) return;

    }


    const close = (e: React.MouseEvent) => {
        //e.stopPropagation(); // 💡 イベントの連鎖を断ち切る
        onClose();
    };
    const closeGoogleView = () => {
        setIsGoogleView(false); // 💡 ただのフラグオフ
    };
    //console.log("isGoogleView*", isGoogleView);
    console.log("modal:", modal);
    //console.log("newX:", gNewX,"ax:", gAx,"bx:", gBx);
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
                            top: `${localPos.y - 15}px`, // 少し余裕を持たせる
                            left: `${localPos.x + 15}px`,
                            transform: 'translate(0, -100%)',
                            zIndex: modal.google?.zIndexValue,
                            //zIndex: (isFocused && modal.google?.rightClick) ? modal.google.zIndexValueRight : (isFocused ? modal.zIndexValue : null),
                            //zIndex: modal.google?.rightClick ? modal.google.zIndexValueRight : modal.zIndexValue,
                            //zIndex: modal.zIndexValue,
                            //zIndex: isFocused ? 2000 : 1000,
                            //zIndex: (isFocused && isFocusedGoogle) ? 3000 :(isFocused ? 2000 : 1000),
                            border: isFocused ? '3px solid #ff4444' : '1px solid #ccc',
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
                                borderBottom: '1px solid #ddd', userSelect: 'none', fontSize: '10px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'

                            }}
                            onContextMenu={(e) => {
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
                                    google: {
                                        ...dummy.dummy,
                                        zIndexValue: nextZ,

                                    }
                                    //zIndexValue: nextZ,
                                }));

                                //if (modal.zIndex !== maxZ) return;
                                /*const allValues = openedModalLocations.flatMap((m: any) => [
                                    Number(m.zIndexValue) || 1000,
                                    Number(m.zIndexValueRight) || 1000,
                                    Number(m.data?.zIndexValue) || 1000,
                                    Number(m.google?.zIndexValueRight) || 1000,
                                    Number(m.logs?.zIndexValueRight) || 1000,
                                    ...(m.comments || []).map((c: any) => Number(c.zIndexValueRight) || 1000)

                                ]);
                                const maxZ = Math.max(1000, ...allValues);
                                //if (modal.zIndex !== maxZ) return;


                                console.log("maxZ:", maxZ)

                                // グループ全体の zIndex を最新の最大値 + 1 に更新
                                updateModalElements(modal.id, (dummy: any) => ({
                                    ...dummy,
                                    //zIndexValueRight: maxZ + 1,
                                    //rightClick: true,       // 右クリックフラグオン
                                    google: {
                                        ...dummy.google,
                                        zIndexValueRight: maxZ + 1,
                                        rightClick: true,
                                    }
                                }));*/

                                // フォーカスもこのグループに合わせる
                                setActiveGroupId(modal.id);
                                console.log("modalGoogle:::", modal)

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
                                    // 💡 ここに飛ばしたいURLを指定します
                                    if (modal?.googleData?.url) {
                                        window.open(modal.googleData.url, '_blank', 'noreferrer');
                                    }
                                }} >
                                詳細情報
                            </button>
                            <button
                                style={{ width: '100%', height: '4vh', margin: '0 0 2px 0', padding: '10px', borderRadius: '6px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => {
                                    // 💡 ここに飛ばしたいURLを指定します
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
