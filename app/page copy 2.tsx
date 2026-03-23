"use client";
import { useState, useEffect } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import MapContainer from "./components/MapContainer";
import RecordModal from "./components/RecordModal";
import RecenterButton from "./components/RecenterButton";
import ZoomControl from "./components/ZoomController"; 

export default function WanderingLog() {
  //const [currentPosOfCamera, setCurrentPosOfCamera] = useState({ lat: 35.666, lng: 139.858 });
  const [currentPosOfCamera, setCurrentPosOfCamera] = useState<any>(null);
  const [currentPosOfMe, setCurrentPosOfMe] = useState<any>(null);
  const [history, setHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", date: "", comment: "" });

  // 起動時の初期化
  useEffect(() => {
    setFormData(prev => ({ ...prev, date: new Date().toLocaleString() }));
    
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords={ lat: pos.coords.latitude, lng: pos.coords.longitude }
      setCurrentPosOfCamera(coords);
      setCurrentPosOfMe(coords);
    });

    fetch("/api/visited_places")
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error("過去ログ取得失敗", err));
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch("/api/visited_places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, ...currentPosOfCamera }),
      });
      if (!response.ok) throw new Error("射出失敗");
      
      alert("放浪の足跡を 1ビット刻みました！");
      setIsModalOpen(false);
      // 再フェッチしてピンを更新
      const updated = await fetch("/api/visited_places").then(res => res.json());
      setHistory(updated);
    } catch (error) {
      alert("失敗しました。");
    }
  };
console.log("rendering in main page.tsx");
  if (!currentPosOfCamera) return <div style={{ padding: "20px" }}>現在地を 確認中...</div>;
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>
      <MapContainer 
        currentPosOfCamera={currentPosOfCamera} 
        setCurrentPosOfCamera={setCurrentPosOfCamera} 
        history={history} 
        onMarkerClick={() => setIsModalOpen(true)}
      />
       <RecenterButton 
       currentPosOfMe={currentPosOfMe} 
       setCurrentPosOfMe={setCurrentPosOfMe} 
       currentPosOfCamera={currentPosOfCamera} 
       setCurrentPosOfCamera={setCurrentPosOfCamera} 
        />
<ZoomControl />
      {isModalOpen && (
        <RecordModal 
          formData={formData} 
          setFormData={setFormData} 
          onSave={handleSave} 
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </APIProvider>
  );
}
