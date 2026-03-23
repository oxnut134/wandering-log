"use client";
import { useState, useEffect } from "react";
import { APIProvider, Map, Marker, InfoWindow } from "@vis.gl/react-google-maps";
//import axios from "@/lib/axios"; // 401サイレンサー搭載済みの不沈の通信兵

export default function WanderingLog() {
  const [currentPos, setCurrentPos] = useState({ lat: 35.666, lng: 139.858 });
  const [history, setHistory] = useState([]); // 過去の放浪ログ（DONE）
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", date: new Date().toLocaleString(), comment: "" });

  console.log("isModalOpen:", isModalOpen);

  // ① 【センサー点火】起動時に 1秒で現在地と過去ログを Audit（取得）
  useEffect(() => {
    // 現在位置の特定（GPS）
    navigator.geolocation.getCurrentPosition((pos) => {
      setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
    // 過去の訪問先を Laravel の金庫（DB）からフェッチ（READY）

    const fetchHistory = async () => {
      try {
        const response = await fetch("/api/visited_places", {
          method: "GET",
        });
        if (response.ok) {
          const data = await response.json();
          // 💡 取得した全データを history に流し込む！
          setHistory(data);
        }
        //if (!response.ok) throw new Error("射出失敗");
      } catch (error) {
        console.error("過去ログの取得に失敗:", error);
      }
    }
    fetchHistory();
  }, []);

  // ② 【Commit】記録ボタンでお城（DB）へ射出（Execute）
  const handleSave = async () => {
    try {
      const payload = { ...formData, ...currentPos };

      // 💡 同一ドメイン内の Next.js API（内蔵）へ射出
      const response = await fetch("/api/visited_places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("射出失敗");

      setIsModalOpen(false); // 201 Created で閉じる
      alert("放浪の足跡を 1ビット刻みました！");
    } catch (error) {
      console.error("射出失敗:", error);
      alert("1ビットの刻み込みに失敗しました。F12でパケットを確認してください。");
    }
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>
      <div style={{ height: "100vh", width: "100%" }}>
        <Map
          defaultCenter={currentPos} // center ではなく defaultCenter にするのがコツ
          defaultZoom={15}
          gestureHandling={'greedy'}
          // 💡 地図が動くたびに、中心座標を currentPos に刻み込む
          onCameraChanged={(ev) => {
            setCurrentPos(ev.detail.center);
          }}
        >
          {/* 現在地ピン（常に地図の中心に居座る） */}
          <Marker
            position={currentPos}
            onClick={() => setIsModalOpen(true)}
          />

          {/* 過去の足跡（これはそのまま） */}
          {history.map((place: any) => (
            <Marker key={place.id} position={{ lat: Number(place.lat), lng: Number(place.lng) }} />
          ))}
        </Map>
      </div>

      {isModalOpen && (
        /* 💡 ① 背景：画面全体を覆い、最前面（z-index: 9999）へ強制ワープ */
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          {/* 💡 ② ホワイトボックス：金庫（入力フォーム）の実体 */}
          <div style={{
            backgroundColor: 'white', padding: '24px', borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', color: '#171717'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px' }}>📍 今この瞬間を記録する</h2>

            <input
              style={{ width: '100%', border: '1px solid #ccc', padding: '8px', marginBottom: '8px', borderRadius: '4px' }}
              placeholder="場所名（省略可）"
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />

            <input
              style={{ width: '100%', border: '1px solid #ccc', padding: '8px', marginBottom: '8px', borderRadius: '4px', backgroundColor: '#f9f9f9' }}
              defaultValue={formData.date}
              readOnly
            />

            <textarea
              style={{ width: '100%', border: '1px solid #ccc', padding: '8px', marginBottom: '16px', borderRadius: '4px', height: '100px' }}
              placeholder="コメント"
              onChange={e => setFormData({ ...formData, comment: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                onClick={handleSave}
              >
                登録（Commit）
              </button>
              <button
                style={{ backgroundColor: '#e5e7eb', color: '#374151', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                onClick={() => setIsModalOpen(false)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ③ 【モーダル】記録用のダイアログ（不沈の受付） */}
      0 {/*isModalOpen ? (
        <>
        {console.log("in modal now")}
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">📍 今この瞬間を記録する</h2>
            <input className="w-full border p-2 mb-2" placeholder="場所名（省略可）" onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <input className="w-full border p-2 mb-2" defaultValue={formData.date} />
            <textarea className="w-full border p-2 mb-4" placeholder="コメント" onChange={e => setFormData({ ...formData, comment: e.target.value })} />
            <div className="flex justify-between">
              <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>登録（Commit）</button>
              <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => setIsModalOpen(false)}>閉じる</button>
            </div>
          </div>
        </div>
      </>
    ):(null)*/}

    </APIProvider>
  );
}
