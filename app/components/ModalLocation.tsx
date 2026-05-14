"use client";
import { useState, useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
//import VisitedLogList from './VisitedLogList';
declare const google: any;

export default function ModalLocation({ modal, clickedModalId, setClickedModalId, updateModalElements, isFocused, onFocus, maxZ, isFocusedLocation, onFocusLocation, setCurrentMarker, openedModalLocations, setOpenedModalLocations, isGoogleView, setIsGoogleView, isModalLogsView, setIsModalLogsView, openedModalGoogle, setOpenedModalGoogle, onSaveSuccess, onCloseModalLocation, isExisting, initialModalPos, onFetchLogs, updateCurrentPos, updatePos, moveDist, setMoveDist, setActiveGroupId }: any) {
    const map = useMap();
    //const [localPos, setLocalPos] = useState(initialModalPos);
    const [localPos, setLocalPos] = useState(initialModalPos);
    const [gNewX, setGNewX] = useState<number | undefined>();
    const [onSaving, setOnSaving] = useState(false);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    //const [deffPos, setDiffpos] = useState({ x: null, y: null });
    const [isConfirming, setIsConfirming] = useState(false);


    //-----！！！ このコンポーネントこのopenedModalGoogleはopenedModalGoogle=modal.dataのことなので注意！！！----------

    //let zIndexValue: any;
    // useEffect(() => {
    //     //isFocused ? modal.zIndexValue=2000: modal.zIndexValue=2000
    //     if (isFocused) {
    //          console.log("maxZ:", maxZ)
    //         zIndexValue = maxZ + 1
    //     }
    // }, [isFocused]);

    // ModalComments.tsx の中に追加
    //useEffect(() => {console.log("clickedModalId: ",clickedModalId)},[clickedModalId])
    //console.log("clickedModalId: ",clickedModalId)
    if (clickedModalId) { console.log("<<<<<<<<<<<< Layer System start >>>>>>>>>>>>>>"); }
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
    const handleSave = async () => {

        setOnSaving(true)
        const payload = {
            id: openedModalGoogle.id, // 既存ならID、新規ならnull
            latitude: openedModalGoogle.latitude,
            longitude: openedModalGoogle.longitude,
            name: openedModalGoogle.name,
            comment: openedModalGoogle.comment
        };

        const res = await fetch("/api/save_location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            if (modal.data.isNew) {
                const savedData = await res.json(); // サーバーから正式なID（数字）をもらう
                console.log("savedData: ", savedData)
                setOpenedModalLocations((prev: any) =>
                    prev.map((m: any) =>
                        m.id === modal.id
                            ? {
                                ...m,           // ★ これで現在の currentPos (ドラッグ位置) を保持！
                                id: savedData.id,
                                data: {
                                    ...m.data,  // 既存のデータを保持
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
                if (onSaveSuccess) onSaveSuccess(); // ここでrefreshHistoryが走る

            } else {
                onFetchLogs();
                //     setOpenedModalLocations((prev: any) => [...prev, savedData])
            }
        }
        setOnSaving(false);
        if (res.ok) return;
    }

    const handleDelete = async () => {
        //if (!confirm("削除しますか？")) return;
        const res = await fetch("/api/delete_locations_record", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: openedModalGoogle.id }) });
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
            },
            rankBy: google.maps.places.RankBy.DISTANCE,
            type: 'establishment'
        }, (results: any, status: any) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                const p = results[0];

                // 💡 ここで getDetails を呼び出して詳細情報を取得する
                service.getDetails({
                    placeId: p.place_id,
                    fields: ['name', 'place_id', 'types', 'formatted_address', 'url', 'website'] // 💡 欲しい項目を指定
                }, (place: any, detailStatus: any) => {
                    if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place) {
                        const include = p.types.includes("establishment") || p.types.includes("point_of_interest");
                        const ignore = p.types.includes("political") || p.types.includes("locality");
                        //💡 クリックした位置と、見つかった場所の位置
                        const clickPos = new google.maps.LatLng(
                            Number(openedModalGoogle.latitude),
                            Number(openedModalGoogle.longitude)
                        );
                        const placePos = p.geometry.location;

                        // 💡 距離（メートル）を計算
                        const distance = google.maps.geometry.spherical.computeDistanceBetween(clickPos, placePos);
                        if (!include || ignore || distance > 10) {
                            place.name = "取得できませんでした。";
                            place.place_id = "";
                            place.types = [];
                            place.formatted_address = "";
                            place.url = "";
                            place.website = "";
                        }

                        setOpenedModalLocations((prev: any[]) => {
                            return prev.map((m: any) =>
                                m.id === modal.id
                                    ? {
                                        ...m,
                                        googleData: {
                                            name: place.name,
                                            place_id: place.place_id,
                                            category: Array.isArray(place.types) ? place.types.join(',') : "",
                                            address: place.formatted_address, // vicinityより詳細な住所
                                            url: place.url,      // 👈 これで取得可能
                                            website: place.website, // 👈 これで取得可能
                                            isShowingGoogle: true
                                        }
                                    }
                                    : m
                            );
                        });
                        setIsGoogleView(true);
                    }
                });
            }
        });


    };
    //****************************************************
    const handleShowLogs = () => {
        setOpenedModalLocations((prev: any[]) => {
            return prev.map((m: any) =>
                m.id === modal.id  // 👈 modalId（または id）で自分を探す
                    ? {
                        ...m,
                        data: {
                            ...m.data,
                            isShowingLogs: true, // 👈 ここでフラグをONにする
                            //hasMovedEnough: false,
                            localPosLogs: { x: localPos.x + 80, y: localPos.y + 80 }
                        }
                    }
                    : m
            );
        });
    };

    /*const handleUpdateZIndex = () => {
        // 1. 全体の最大値を計算（これからセットする「新しい一番上」の数値を作る）
        setOpenedModalLocations((prev: any[]) => {
            const allValues = prev.flatMap((m: any) => [
                Number(m.zIndexValue) || 1000,
                Number(m.data?.zIndexValue) || 1000,
                ...(m.activeComment || []).map((c: any) => Number(c.zIndexValue) || 1000)
            ]);
            const maxZ = Math.max(1000, ...allValues);
            const nextZ = maxZ + 1;
            console.log("maxZ:", maxZ, "nextZ:", nextZ)
            return prev.map((item: any) =>
                item.id === modal.id
                    ? {
                        ...item,
                        zIndexValue: nextZ,
                        data: { ...item.data, zIndexValue: nextZ }
                    }
                    : item
            );
        })
    }
    /*const handleUpdateZIndex = () => {
        // 1. 全体の最大値を計算 (計算には今の最新の状態 openedModalLocations を使う)
        const allValues = openedModalLocations.flatMap((m: any) => [
            Number(m.zIndexValue) || 1000,
            Number(m.data?.zIndexValue) || 1000,
            ...(m.activeComment || []).map((c: any) => Number(c.zIndexValue) || 1000)
        ]);
        const nextZ = Math.max(1000, ...allValues) + 1;

        console.log("✈️ 共通関数で更新:", { nextZ });

        // 2. 共通の「魔法の杖」を振る
        updateModalElements(modal.id, (dummy:any) => ({
            ...dummy,
            zIndexValue: nextZ,
            data: {
                ...dummy.data,
                zIndexValue: nextZ
            }
        }));
    };
    // 2. 配列（State）を更新して、自分の zIndexValue だけを nextZ に上書きする
    /*setOpenedModalLocations((prev: any) =>
        prev.map((m: any) =>
            m.id === modal.id
                ? { ...m, zIndexValue: nextZ } // 自分のIDなら新しいzIndexをセット
                : m                           // それ以外はそのままA
        )
    );*/
    //};
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
            comments: (dummy.comments || []).map((c: any) => ({
                ...c,
                zIndexValue: nextZ,
            })),
            //zIndexValue: nextZ,
        }));

    };


    const xRef = useRef<number | undefined>(undefined);
    const yRef = useRef<number | undefined>(undefined);
    let gAx: any, gBx: any;

    const handleDown = (e: React.MouseEvent | React.TouchEvent | any) => {
        if (!e.touches && e.button !== 0) return;  // 左クリックでなければリターン
        //console.log("🖱️ 親の handleDown が呼ばれた！");

        e.stopPropagation();
        if (e.type === 'touchstart') {
            if (e.cancelable) e.preventDefault();
        }
        onFocus();
        handleUpdateGroupZIndex();


        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const startX = clientX - localPos.x;
        const startY = clientY - localPos.y;

        //console.log("*****clientX,Y:", clientX, clientY, "srartX,Y:", startX, startY, "localPos.x,.y", localPos.x, localPos.y);

        const handleMove = (moveEvent: any) => {
            const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const moveY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
            //let newX:any;
            //let newY:any;
            let newX = moveX - startX;
            let newY = moveY - startY;
            xRef.current = newX;
            yRef.current = newY;
            //console.log("✈️ 代入成功 (Ref):", xRef.current);



            const ax = window.innerWidth;
            const ay = window.innerHeight;
            const bx = isMobile ? 210 : 250;// モーダル幅
            //const bx = 260; // モーダル幅
            const by = 320; // モーダル高
            const rightEdgePadding = isMobile ? 40 : 10;

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
            //console.log("✈️ 移動中監査:", { newX, newY });

            setLocalPos({ x: newX, y: newY });

            if (moveEvent.touches) {
                if (moveEvent.cancelable) moveEvent.preventDefault();
            }

        };

        const handleUp = (upE: any) => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleUp);

            if ((document as any).releaseCapture) {
                (document as any).releaseCapture();
            }
            if (updateCurrentPos && xRef.current !== undefined) {
                updateCurrentPos({ x: xRef.current, y: yRef.current! });
            }

            // if (updateCurrentPos && modal.id && String(modal.id).includes('new-')) {
            //     //updateCurrentPos({ x: localPos.x, y: localPos.y });// 新規（赤マーカー由来）の時の処理
            //     updateCurrentPos({ x: xRef.current, y: yRef.current! });// 新規（赤マーカー由来）の時の処理
            // }
            if (updatePos && modal.id && String(modal.id).includes('new-')) {
                updatePos({ x: xRef.current, y: yRef.current! });// 新規（赤マーカー由来）の時の処理
            }

            const finalPos = { x: xRef.current, y: yRef.current };


            //---------------- 子モーダル追従ロジック　------------------------------
            const upX = upE.changedTouches ? upE.changedTouches[0].clientX : upE.clientX;
            const upY = upE.changedTouches ? upE.changedTouches[0].clientY : upE.clientY;
            const currentDiffX = upX - clientX;
            const currentDiffY = upY - clientY;
            const dist = Math.sqrt(currentDiffX ** 2 + currentDiffY ** 2)
            //console.log("🔥 setMoveDistの型:", typeof setMoveDist);
            //console.log("📦 setMoveDistの実体:", setMoveDist);
            setMoveDist({
                x: Math.abs(upX - clientX),
                y: Math.abs(upY - clientY)
            });
            setOpenedModalLocations((prev: any[]) => {
                return prev.map((m: any) =>
                    m.id === modal.id  // 👈 modalId（または id）で自分を探す
                        ? {
                            ...m,
                            data: {
                                ...m.data,
                                //hasMovedEnough: currentDiffX > 50 || currentDiffY > 50,
                                hasMovedEnough: dist > 100,//移動距離>100以上の場合追従
                            }
                        }
                        : m
                );
            });

        };
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        document.addEventListener('touchmove', handleMove, { passive: false }); // 💡 passive: false が重要
        document.addEventListener('touchend', handleUp);

    };

    /*const syncMapPositionWithModal = () => {
        if (!map) return;

        const projection = map.getProjection();
        if (!projection) return;

        // 1. 現在のモーダルの表示位置 (localPos)
        const point = new google.maps.Point(localPos.x, localPos.y);

        // 2. 【核心】ピクセル座標を緯度経度 (LatLng) に変換
        // 💡 Projection を使ってブラウザの枠内の位置を地球上の座標へ翻訳
        const latLng = projection.fromPointToLatLng(point);

        if (latLng) {
            // 3. 親のステート (openedModalGoogle) を更新
            // これにより、地図をドラッグしてもこの新しい地点にモーダルが固定されます
            //setOpenedModalGoogle((prev: any) => ({
            setOpenedModalGoogle((prev: any) => ({
                ...prev,
                latitude: latLng.lat(),
                longitude: latLng.lng()
            }));
            //console.log("📍 地図上の位置を同期しました:", latLng.lat(), latLng.lng());
        }
    };

    const close = (e: React.MouseEvent) => {
        //e.stopPropagation(); // 💡 イベントの連鎖を断ち切る
        onCloseModalLocation();
    };
    const closeGoogleView = () => {
        //e.stopPropagation(); // 💡 イベントの連鎖を断ち切る
        setIsGoogleView(false); // 💡 ただのフラグオフ
    };*/
    useEffect(() => { console.log("openedModalLocations:", openedModalLocations); }, [openedModalLocations])
    //console.log("openedModalLocations:", openedModalLocations);
    return (
        <>
            <div
                style={{
                    width: '15%',
                    minWidth: '180px',
                    height: 'auto',
                    position: 'absolute',
                    top: `${localPos.y - 15}px`, // 少し余裕を持たせる
                    left: `${localPos.x + 15}px`,
                    transform: 'translate(0, -100%)',
                    zIndex: modal.locations?.zIndexValue,
                    //zIndex: (isFocused && modal.data.rightClick) ? modal.zIndexValueRight : (isFocused ? modal.zIndexValue : null),
                    //zIndex: isFocused ? 2000 : 1000,
                    //zIndex: (isFocused && isFocusedLocation) ? 3000: (isFocused ? 2000 : 1000),
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
                <div style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        width: '96%',
                        height: '6px', // 2px〜3pxがおすすめ
                        background: 'linear-gradient(90deg, #10b981 0%, #a3e635 100%)',
                        borderRadius: '15px 15px 0 0',
                        boxShadow: '0 4px 6px -4px rgba(0,0,0,0.1)'
                    }} />
                </div>
                <div
                    onMouseDown={handleDown}
                    onContextMenu={(e) => e.preventDefault()}
                    onTouchStart={handleDown}
                    style={{
                        height: '4vh', background: '#f3f4f6', padding: '0px 0px', cursor: 'move',
                        boxShadow: '0 4px 6px -4px rgba(0,0,0,0.1)', userSelect: 'none', fontSize: '11px', borderRadius: '0 0 6px 6px',      // 💡 ここから追加：縦横センターにする設定
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
                        setClickedModalId(modal.id)
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
                            locations: {
                                ...dummy.locations,
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
                            Number(m.log?.zIndexValueRight) || 1000,
                            ...(m.comments || []).map((c: any) => Number(c.zIndexValueRight) || 1000)
                        ]);
                        const maxZ = Math.max(1000, ...allValues);
                        const nextZ = maxZ + 1;


                        console.log("maxZ:", maxZ)

                        // グループ全体の zIndex を最新の最大値 + 1 に更新
                        updateModalElements(modal.id, (dummy: any) => ({
                            ...dummy,
                            zIndexValueRight: maxZ + 1,
                            data: {
                                ...dummy.data,
                                zIndexValueRight: maxZ + 1,
                                rightClick: true,
                            }
                            //rightClick: true,       // 右クリックフラグオン
                        }));*/

                        // フォーカスもこのグループに合わせる
                        setActiveGroupId(modal.id);
                        console.log("maxZLocatioc:", maxZ)
                        console.log("modalLocation:::", modal)

                    }}
                >
                    {/*<div style={{
                        width: '30px',
                        height: '4px',
                        backgroundColor: '#ccc',
                        borderRadius: '2px'
                    }} />*/}
                    {/*{modal.data.isNew ? "新規訪問先" : "既存訪問先"} (ドラッグ)*/}
                </div>

                {/* ...以下、コンテンツ部分（localPos.x/y を参照するように）... */}
                <div style={{
                    display: 'flex',           // 💡 横並びにする
                    justifyContent: 'flex-end', // 💡 左右の両端に振り分ける
                    alignItems: 'center',      // 💡 上下の高さを中央で揃える
                    margin: '0 0 0px 0'       // 下の余白
                }}>
                    {/*<h4 style={{ margin: '0 0 0 0', fontSize: '10px', fontWeight: 'bold' }}>
                        {isExisting ? "③ 既存訪問先" : "② 初めての訪問先"}
                    </h4>*/}
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
                    緯度: {Number(openedModalGoogle.latitude || 0).toFixed(4)} /
                    経度: {Number(openedModalGoogle.longitude || 0).toFixed(4)}
                    {/*緯度: {localPos.x} /
                    経度: {localPos.y}*/}
                    {/*緯度: {localPos.xCheck} /
                    経度: {localPos.yCheck}*/}
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
                    onChange={e => setOpenedModalGoogle({ ...openedModalGoogle, name: e.target.value })}
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
                    onChange={e => setOpenedModalGoogle({ ...openedModalGoogle, comment: e.target.value })}
                    placeholder="メモを残す"
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
                            fontSize: '10px',
                            border: '1px solid #2563eb',
                            display: 'flex',    // 💡 中身を真ん中に
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',

                        }}
                    >
                        Google情報
                    </button>
                    <button
                        onClick={handleShowLogs}

                        style={{
                            flex: 1,
                            height: '4vh',
                            background: '#fff',
                            color: '#374151',
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '10px',
                            border: '1px solid #374151',
                            display: 'flex',    // 💡 中身を真ん中に
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',

                        }}
                    >
                        {/*DEBUG: {isMobile ? "📱MOBILE" : "💻PC"} /
                        W:{window.innerWidth} /
                        Pad:{rightEdgePadding}*/}
                        訪問記録
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '10px' }}>
                    <button
                        onClick={onCloseModalLocation}
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                        閉じる
                    </button>
                    {isExisting && (isConfirming ? (
                        <button
                            style={{ width: '30%', height: '3vh', background: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', }}
                            onClick={handleDelete} // 💡 2回目で実行
                        >
                            削除確定
                        </button>
                    ) : (
                        <button
                            //style={{ width: '30%', height: '3vh', background: '#9ca3af', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '6px' }}
                            style={{ width: '30%', height: '3vh', background: '#FBBC04', color: '#6b7280', border: '1px solid #6b7280', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', }}
                            onClick={() => setIsConfirming(true)} // 💡 1回目で「確認モード」へ
                        >
                            削除
                        </button>
                    ))
                    }
                    {/*{isExisting && <button onClick={handleDelete} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>履歴を削除</button>}*/}

                </div>
            </div>
        </>
    );
}
