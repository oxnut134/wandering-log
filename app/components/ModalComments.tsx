
"use client";
import { useState, useEffect, useRef } from 'react';
import { useMap } from "@vis.gl/react-google-maps";

export default function ModalComments({ modal, comment, updateModalElements, activeComment, logId, commentId, isFocused, onFocus, renderMe, setOpenedModalLocations, openedModalLocations, isGoogleView, setIsGoogleView, openedModalGoogle, setOpenedModalGoogle, onClose, onSave, isExisting, initialModalPosComments, onFetchLogs, logs, isDraggingRef, onSaveSuccess, isCommentRecordExist, memoNo, setActiveGroupId }: any) {
    const map = useMap();

    const [gNewX, setGNewX] = useState<number | undefined>();
    //const [isDragging, setIsDragging] = useState(false);
    const [localPos, setLocalPos] = useState<{ x: number, y: number } | null>(null);
    const [onSaving, setOnSaving] = useState(false);
    //const [text, setText] = useState("");
    const LIMIT = 500;
    const [isConfirming, setIsConfirming] = useState(false);
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
            //console.log("👻 幽霊退治完了: モーダル消滅に伴いイベントを破棄しました");

            //zIndex最大値取得
            const allValues = openedModalLocations.flatMap((m: any) => [
                Number(m.locations?.zIndexValue) || 1000,
                Number(m.google?.zIndexValue) || 1000,
                Number(m.log?.zIndexValue) || 1000,
                ...(m.comments || []).map((c: any) => Number(c.zIndexValue) || 1000)
            ]);
            //const nextZ = Math.max(1000, ...allValues);
            const nextZ = Math.max(1000, ...allValues) + 1;

            console.log("allValues:", allValues);

            // call back zIndex グループ設定
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
    }, []);

    useEffect(() => {
        if (initialModalPosComments) {
            //setLocalPos(initialModalPosComments);
            setLocalPos({
                x: initialModalPosComments.x + 20,
                y: initialModalPosComments.y + 20
            });

            if (modal.data.hasMovedEnough) {
                updateModalElements(modal.id, (dummy: any) => ({
                    ...dummy,
                    data: {
                        ...dummy.data,
                        hasMovedEnough: false // 追従終了
                    }
                }));
            }

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

    /*const handleUpdateZIndex = () => {
        const allValues = openedModalLocations.flatMap((m: any) => [
            Number(m.zIndexValue) || 1000,
            Number(m.zIndexValueRight) || 1000,
            Number(m.data?.zIndexValue) || 1000,
            Number(m.google?.zIndexValueRight) || 1000,
            Number(m.log?.zIndexValueRight) || 1000,
            ...(m.comments || []).map((c: any) => Number(c.zIndexValueRight) || 1000)
        ]);
        const nextZ = Math.max(1000, ...allValues) + 1;


        console.log("✈️ 共通関数で更新:", { nextZ });

        // 2. 共通の「魔法の杖」を振る
        updateModalElements(modal.id, (dummy: any) => ({
            ...dummy,
            zIndexValue: nextZ,
            comments: (dummy.comments || []).map((c: any) => ({
                ...c,
                zIndexValueRight: nextZ,
                rightClick: false
            })),
            // comments: {
            //     ...dummy.activecomments,
            //     zIndexValue: nextZ
            // },
            hasMovedEnough: false,
            rightClick: false,
        }));
    };*/



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
        //handleUpdateZIndex();



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
        const currentData = modal.comments?.find((c: any) => c.logId === logId);
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
            if (res.ok) {
                const savedData = await res.json(); // サーバーからID等の最新情報をもらう

                setOpenedModalLocations((prev: any[]) => {
                    return prev.map((m: any) => {
                        if (m.id !== modal.id) return m;

                        const currentComments = m.comments || [];

                        // 💡 1. まず今あるかチェック
                        const exists = currentComments.some((c: any) => c.logId === logId);

                        let updatedComments;
                        if (exists) {
                            // 💡 既存なら、中身を更新（isExistingCommentをtrueに）
                            updatedComments = currentComments.map((c: any) =>
                                c.logId === logId ? { ...c, id: savedData.id, isExistingComment: true } : c
                            );
                        } else {
                            // 💡 新規なら、配列の末尾に追加
                            updatedComments = [
                                ...currentComments,
                                {
                                    id: savedData.id,
                                    logId: logId,
                                    comment: currentData.comment,
                                    isExistingComment: true,
                                    // 他に必要なプロパティがあればここに追加
                                }
                            ];
                        }

                        return {
                            ...m,
                            comments: updatedComments
                        };
                    });
                });

                if (onSaveSuccess) onSaveSuccess();
            }


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
    const handleDeleteComment = async () => {
        console.log("commentId:", commentId)
        //if (!confirm("削除しますか？")) return;
        const res = await fetch("/api/delete_comments_record", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: commentId }) });
        if (res.ok) {
            //onSaveSuccess();
            onClose(); //handleLogsClose();
        }
    };
    const handleLogsClose = () => {
        //console.log("On closing");
        // 💡 親の配列をまるごと更新（イミュータビリティを保つ）
        setOpenedModalLocations((prev: any[]) => {
            return prev.map((m: any) =>
                m.id === modal.id
                    ? {
                        ...m,
                        data: {
                            ...m.data,
                            isShowingLogs: false
                        }
                    }
                    : m
            );
        });


    }

    //console.log("modal.comments.zIndexValue",modal.comments.zIndexValue)
    //console.log("isCommentRecordExist:",isCommentRecordExist,"isConfirming:",isConfirming);
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
                    zIndex: comment?.zIndexValue,
                    //zIndex: (isFocused && activeComment?.rightClick) ? activeComment.zIndexValueRight : (isFocused ? modal.zIndexValue : null),
                    //zIndex: activeComment?.rightClick ? activeComment.zIndexValueRight : modal.zIndexValue,
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
                    onContextMenu={(e) => {
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
                            comments: (dummy.comments || []).map((c: any) => {
                                if (c.logId === comment.logId) {
                                    return {
                                        ...c,
                                        zIndexValue: nextZ,
                                    }
                                }

                                return c;


                            }),

                            /*comments: {
                                ...dummy.dummy,
                                zIndexValue: nextZ,

                            }*/
                            //zIndexValue: nextZ,
                        }));

                        //if (modal.zIndex !== maxZ) return;
                        /*const allValues = openedModalLocations.flatMap((m: any) => [
                            Number(m.zIndexValue) || 1000,
                            Number(m.zIndexValueRight) || 1000,
                            Number(m.data?.zIndexValue) || 1000,
                            Number(m.google?.zIndexValueRight) || 1000,
                            Number(m.log?.zIndexValueRight) || 1000,
                            //...(m.activeComment || []).map((c: any) => Number(c.zIndexValueRight) || 1000)
                            ...(m.comments || []).map((c: any) => Number(c.zIndexValueRight) || 1000)
                        ]);
                        const maxZ = Math.max(1000, ...allValues);
                        //if (modal.zIndex !== maxZ) return;


                        console.log("maxZ:", maxZ)

                        // グループ全体の zIndex を最新の最大値 + 1 に更新
                        updateModalElements(modal.id, (dummy: any) => ({
                    ...dummy,
                    // 💡 activeComment 配列を map で回して、対象のものを更新する
                    comments: (dummy.comments || []).map((c: any) =>
                // もし特定のコメントID(commentId)があるならそれで判定
                // 全てを最前面にするならそのまま map で回す
                {
                                if (c.logId === logId) {
                    console.log("*** c.log.Id = logId")
                                    return ({
                    ...c,
                    zIndexValueRight: maxZ + 1,
                rightClick: true,
                                    })
                                }
                return c;
                            })
                        }));
                console.log("activeComment :", activeComment, "commentId:", commentId, "logtId:", logId)
                        updateModalElements(modal.id, (dummy: any) => ({
                    ...dummy,
                    //zIndexValueRight: maxZ + 1,
                    //rightClick: true,       // 右クリックフラグオン
                    activeComment: {
                    ...dummy.activecomment,
                    zIndexValueRight: maxZ + 1,
                rightClick: true,
                            }
                        }));*/

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
                        <strong>🚩 メモ</strong>
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

                                    <span style={{ color: '#aaa' }}>#{memoNo}</span>
                                    {/*<span style={{ color: '#aaa' }}>#{logs.length - index}</span>*/}
                                </div>
                            ))}
                    </div>
                    <textarea
                        maxLength={500}
                        style={{
                            width: '100%',
                            height: '10vh',
                            display: 'block',
                            //marginBottom: '2px',
                            border: '1px solid #bbb',
                            borderRadius: '6px',
                            padding: '4px',
                            fontSize: '10px',
                            resize: 'none'
                        }}
                        // 💡 Propsから現在のコメントを表示
                        value={modal.comments?.find((l: any) => l.logId === logId)?.comment || ""}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            // 💡 親の配列の中から、自分に関連する「地点」と「ログ」を探して更新
                            setOpenedModalLocations((prev: any[]) =>
                                prev.map((m: any) =>
                                    m.id === modal.id
                                        ? {
                                            ...m,
                                            comments: m.comments?.map((c: any) =>
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
                        placeholder="メモを残す"
                    />
                    <div style={{ textAlign: 'right', margin: '0 0 2px 0', fontSize: '8px', color: '#888' }}>
                        {(modal.comments?.find((l: any) => l.logId === logId)?.comment || "").length} / 500文字
                    </div>
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
                <div style={{
                    display: 'flex',    // 💡 中身を真ん中に
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '10px'
                }}>
                    <button
                        onClick={onClose}
                        style={{ margin: '5px 0 0 0', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                        閉じる
                    </button>
                    {/*{isExisting && (*/}
                    {/*{  isCommentRecordExist && (isConfirming ?*/}
                    {/*{activeComment.isExistingComment && (isConfirming ? (*/}
                    {comment.isExistingComment && (isConfirming ? (
                        <button
                            style={{ width: '30%', height: '3vh', background: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '6px' }}
                            onClick={handleDeleteComment} // 💡 2回目で実行
                        >
                            削除確定
                        </button>
                    ) : (
                        <button
                            //style={{ width: '30%', height: '3vh', background: '#9ca3af', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '6px' }}
                            style={{ width: '30%', height: '3vh', background: '#FBBC04', color: '#6b7280', border: 'none', fontWeight: 'bold', borderRadius: '6px' }}
                            onClick={() => setIsConfirming(true)} // 💡 1回目で「確認モード」へ
                        >
                            削除
                        </button>
                    ))}
                    {/*})}*/}
                </div>
            </div >
        </>
    );
}
