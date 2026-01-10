// frontend/src/components/0_Dashboard/SemesterWrapped.jsx
import React from 'react';
import './SemesterWrapped.css';

const SemesterWrapped = ({ onClose }) => {
    return (
        <div className="wrapped-overlay">
            <div className="wrapped-container" style={{ justifyContent: 'center' }}>
                {/* Close Button */}
                <button className="close-btn" onClick={onClose} style={{ zIndex: 100 }}>×</button>

                {/* Dcard Promo Content */}
                <div className="slide-content slide-promo" style={{ background: '#006aa6', color: '#fff', overflow: 'hidden', width: '100%', height: '100%', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
                    <div className="poster-header" style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '1rem', letterSpacing: '2px' }}>HOUSING SURVEY</span>
                    </div>
                    <div className="poster-hero" style={{ padding: '0 15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h2 style={{
                            fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
                            color: '#fff',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                            lineHeight: 1.2,
                            marginBottom: '12px'
                        }}>
                            你的房間是避風港，<br />還是修煉場？🏠
                        </h2>
                        <div className="poster-tag" style={{
                            fontSize: 'clamp(1rem, 4vw, 1.3rem)',
                            background: '#fff',
                            color: '#006aa6',
                            transform: 'rotate(-2deg)',
                            padding: '8px 15px',
                            lineHeight: 1.3,
                            alignSelf: 'center'
                        }}>
                            第二次抽獎來咯！🎁<br />租屋鬼故事募集 👻
                        </div>
                        <div
                            className="promo-container"
                            onClick={() => window.open('https://www.dcard.tw/f/ncnu/p/260489435', '_blank', 'noopener,noreferrer')}
                            style={{
                                marginTop: '20px',
                                padding: '8px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                border: '2px solid rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                        >
                            <iframe
                                src="https://embed.dcard.tw/post/260489435"
                                width="100%"
                                height="220"
                                style={{ border: 'none', borderRadius: '8px', pointerEvents: 'none' }}
                                title="Dcard Post"
                            ></iframe>
                            <div style={{
                                position: 'absolute',
                                bottom: '12px',
                                right: '12px',
                                background: 'rgba(0,0,0,0.6)',
                                color: '#fff',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.7rem'
                            }}>
                                👆 點擊查看完整貼文
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open('https://www.dcard.tw/f/ncnu/p/260489435', '_blank', 'noopener,noreferrer');
                                }}
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                                    color: '#000',
                                    borderRadius: '50px',
                                    border: '2px solid #fff',
                                    cursor: 'pointer',
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 15px rgba(255,215,0,0.5)',
                                    position: 'relative',
                                    zIndex: 10,
                                    animation: 'btnPulse 1.5s infinite'
                                }}
                            >
                                🎉 點我填問卷抽獎 🎁
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SemesterWrapped;
