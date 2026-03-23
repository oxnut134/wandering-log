"use client";
import { useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";

export default function RecordModal({ formData, setFormData, onClose, onSave, isExisting }: any) {
  const map = useMap();
  const [isGoogleView, setIsGoogleView] = useState(false);

  const handleSave = async () => {
    const res = await fetch("/api/wandering_save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    if (res.ok) { onSave(); onClose(); }
  };

  const handleDelete = async () => {
    if (!confirm("削除しますか？")) return;
    const res = await fetch("/api/wandering_save", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: formData.id }) });
    if (res.ok) { onSave(); onClose(); }
  };

  const handleGoogleSearch = () => {
    if (!map || !window.google) return;
    const service = new google.maps.places.PlacesService(map as any);
    service.nearbySearch({ location: { lat: formData.latitude, lng: formData.longitude }, rankBy: google.maps.places.RankBy.DISTANCE, type: 'establishment' }, (results, status) => {
      if (status === "OK" && results) {
        const p = results[0];
        setFormData({ ...formData, googleData: { place_id: p.place_id, name: p.name, category: p.types?.join(','), address: p.vicinity } });
        setIsGoogleView(true);
      }
    });
  };
console.log("formData:",formData);
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', width: '300px' }}>
        <h3>{isExisting ? "③ 既存訪問先" : "② 初めての訪問先"}</h3>
        <p style={{fontSize:'12px'}}>緯度:{formData.latitude?.toFixed(6)} / 経度:{formData.longitude?.toFixed(6)}</p>
        {!isGoogleView ? (
          <>
            <input style={{width:'100%', marginBottom:'10px'}} value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="名称" />
            <textarea style={{width:'100%', marginBottom:'10px'}} value={formData.comment || ""} onChange={e => setFormData({...formData, comment: e.target.value})} placeholder="コメント" />
            <button onClick={handleSave} style={{width:'100%', background:'#2563eb', color:'white', marginBottom:'5px'}}>保存</button>
            <button onClick={handleGoogleSearch} style={{width:'100%', marginBottom:'5px'}}>Google情報</button>
          </>
        ) : (
          <div>
            <p>Google名: {formData.googleData.name}</p>
            <button onClick={() => { setFormData({...formData, name: formData.googleData.name}); setIsGoogleView(false); }}>反映して戻る</button>
          </div>
        )}
        <div style={{display:'flex', justifyContent:'space-between', marginTop:'10px'}}>
          {isExisting && <button onClick={handleDelete} style={{color:'red'}}>消去</button>}
          <button onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
