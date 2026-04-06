// app/components/VisitedLogList.tsx
import React from 'react';

export default function VisitedLogList({ logs }: { logs: any[] }) {
    if (!logs || logs.length === 0) {
        return <p style={{ fontSize: '12px', color: '#999', padding: '10px' }}>まだ訪問記録がありません</p>;
    }

    return (
        <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
            <h5 style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                🚩 訪問履歴（全 {logs.length} 回）
            </h5>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {logs.map((log, index) => (
                    <div key={log.id || index} style={{
                        fontSize: '12px',
                        padding: '6px 0',
                        borderBottom: '1px dashed #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                            {new Date(log.visited_at).toLocaleString('ja-JP', {
                                year: 'numeric', month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                        <span style={{ color: '#aaa' }}>#{logs.length - index}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
