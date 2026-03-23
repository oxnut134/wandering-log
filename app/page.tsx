"use client";
import { useState, useEffect, useCallback } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import MapContainer from "./components/MapContainer";
import RecordModal from "./components/RecordModal";

export default function WanderingLog() {
  const [currentPosOfCamera, setCurrentPosOfCamera] = useState<any>(null);
  const [currentPosOfMe, setCurrentPosOfMe] = useState<any>(null);
  const [history, setHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [homeTrigger, setHomeTrigger] = useState(0);

  const refreshHistory = useCallback(async () => {
    const res = await fetch("/api/wandering_save");
    const data = await res.json();
    setHistory(data);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCurrentPosOfCamera(coords);
      setCurrentPosOfMe(coords);
    });
    refreshHistory();
  }, [refreshHistory]);

  const handleMarkerClick = (place?: any) => {
    if (place && place.id) {
      setFormData({ ...place, latitude: Number(place.latitude), longitude: Number(place.longitude) });
    } else {
      setFormData({ id: null, latitude: currentPosOfCamera.lat, longitude: currentPosOfCamera.lng, name: "", comment: "" });
    }
    setIsModalOpen(true);
  };

  const handleHome = () => {
    if (currentPosOfMe) {
      // 💡 状態を更新することで、MapContainer 側の Map コンポーネントが再描画されます
      setCurrentPosOfCamera({
        lat: currentPosOfMe.lat,
        lng: currentPosOfMe.lng
      });
      setHomeTrigger(Date.now());
    }
  };

  if (!currentPosOfCamera) return <div>現在地確認中...</div>;
  console.log("history:", history);
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string} libraries={['places']}>
      <MapContainer
        currentPosOfCamera={currentPosOfCamera}
        setCurrentPosOfCamera={setCurrentPosOfCamera}
        history={history}
        onMarkerClick={handleMarkerClick}
        homeTrigger={homeTrigger}
      />
      {/* Homeボタン */}
      <button
        onClick={handleHome}
        style={{
          position: 'fixed', bottom: '120px', right: '20px',
          width: '50px', height: '50px', borderRadius: '50%',
          backgroundColor: 'white', border: 'none', fontSize: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 1000
        }}
      >
        🏠
      </button>
      {isModalOpen && (
        <RecordModal formData={formData} setFormData={setFormData} onClose={() => setIsModalOpen(false)} onSave={refreshHistory} isExisting={!!formData.id} />
      )}
    </APIProvider>
  );
}
