"use client";
import { useMap } from "@vis.gl/react-google-maps";

export default function ZoomController() {
  const map = useMap();

  const handleZoom = (delta: number) => {
    if (map) {
      const currentZoom = map.getZoom() || 15;
      // 💡 現在のズームレベルに +1 または -1 する
      map.setZoom(currentZoom + delta);
    }
  };

  return (
    <div style={{
      position: 'fixed', bottom: '100px', right: '24px',
      display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10
    }}>
      <button
        onClick={() => handleZoom(1)}
        style={buttonStyle} title="拡大"
      >＋</button>
      <button
        onClick={() => handleZoom(-1)}
        style={buttonStyle} title="縮小"
      >－</button>
    </div>
  );
}

const buttonStyle = {
  width: '40px', height: '40px', borderRadius: '8px',
  backgroundColor: 'white', color: '#374151', fontSize: '20px', fontWeight: 'bold',
  border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
};
