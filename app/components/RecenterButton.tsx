"use client";
import { useMap } from "@vis.gl/react-google-maps";

export default function RecenterButton({ currentPosOfMe, setCurrentPosOfMe, currentPosOfCamera, setCurrentPosOfCamera }: any) {
    const map = useMap(); // 地図のリモコンを取得
  const handleRecenter = () => {
    // 💡 ボタンを押した瞬間に、最新のGPS情報を Audit（再取得）！
    navigator.geolocation.getCurrentPosition((pos) => {
      const latestPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      
      if (map) {
        console.log("🎯 最新の現在地を捕捉し、カメラをパンします:", latestPos);
        map.panTo(latestPos); // 最新地へなめらかに移動
        map.setZoom(15);
      }

      // 状態を最新に更新
      setCurrentPosOfMe(latestPos);
      setCurrentPosOfCamera(latestPos);
    })}
    console.log("in RecenerButton");
    console.log("currentPosOfCameraiton:", currentPosOfCamera)
    return (
        <button
            onClick={handleRecenter}
            style={{
                position: 'fixed', bottom: '24px', right: '24px',
                width: '56px', height: '56px', borderRadius: '50%',
                backgroundColor: 'white', color: '#374151', fontSize: '24px',
                border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                cursor: 'pointer', zIndex: 10, display: 'flex',
                alignItems: 'center', justifyContent: 'center'
            }}
            title="現在地に戻る"
        >
            🎯
        </button>
    );
}
