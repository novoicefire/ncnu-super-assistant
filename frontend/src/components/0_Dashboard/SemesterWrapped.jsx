// frontend/src/components/0_Dashboard/SemesterWrapped.jsx
import React, { useState, useEffect } from 'react';
import { toBlob } from 'html-to-image';
import './SemesterWrapped.css';
import { getWrappedData } from '../../apiHelper';

const SemesterWrapped = ({ userId, onClose }) => {
    const [data, setData] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [shareBlob, setShareBlob] = useState(null);

    const SLIDE_count = 7; // Increased for Promo Slide
    // const slideDuration = 5000; 

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getWrappedData(userId);
                if (result && !result.error) {
                    setData(result);
                } else {
                    setError('尚無數據或載入失敗');
                }
            } catch (err) {
                setError('網路連線錯誤');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    // Handle slide navigation
    const nextSlide = (e) => {
        e?.stopPropagation();
        if (currentSlide < SLIDE_count - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            // Last slide (now 6), maybe close?
        }
    };

    const prevSlide = (e) => {
        e?.stopPropagation();
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide]);

    // Auto-play (Slow) - Exclude Slide 5 (Summary) and 6 (Promo) from auto-skip
    useEffect(() => {
        if (!loading && !error && currentSlide < 5) {
            const timer = setTimeout(() => {
                setCurrentSlide(prev => prev + 1);
            }, 6000); // 6 seconds per slide
            return () => clearTimeout(timer);
        }
    }, [currentSlide, loading, error]);

    // 1. Capture and Show Promo
    const captureAndShowPromo = async (e) => {
        e.stopPropagation();
        const posterElement = document.querySelector('.summary-poster');
        if (!posterElement) return;

        try {
            // Apply capturing class to live element to freeze animations
            posterElement.classList.add('capturing');

            // Wait for paint/CSS to apply
            await new Promise(resolve => setTimeout(resolve, 100));

            const blob = await toBlob(posterElement, {
                pixelRatio: 3, // High quality
                backgroundColor: null,
            });

            // Remove class immediately
            posterElement.classList.remove('capturing');

            if (blob) {
                setShareBlob(blob);
                setCurrentSlide(6); // Go to Promo Slide
            }
        } catch (error) {
            console.error('Screenshot failed:', error);
            posterElement.classList.remove('capturing'); // Ensure cleanup
            alert('截圖失敗，請稍後再試。');
        }
    };

    // 2. Finalize Share (After Promo)
    useEffect(() => {
        if (currentSlide === 6 && shareBlob) {
            // Wait 3 seconds then share
            const timer = setTimeout(() => {
                finalizeShare();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [currentSlide, shareBlob]);

    const finalizeShare = async () => {
        if (!shareBlob) return;
        const fileName = 'ncnu_wrapped_2025.png';
        const file = new File([shareBlob], fileName, { type: 'image/png' });

        // Always save (Download) first
        const url = URL.createObjectURL(shareBlob);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Then try to Share
        if (navigator.share) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'My NCNU 2025 Semester Wrapped',
                    text: '看看我的 2025 年學期回顧！✨ #NCNUSuperAssistant',
                });
            } catch (shareError) {
                console.log('Share canceled or failed', shareError);
            }
        } else {
            alert('已保存您的年度回顧圖片！📸');
        }
    };

    if (loading) {
        return (
            <div className="wrapped-overlay">
                <div className="wrapped-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <h2 style={{ animation: 'btnPulse 1s infinite' }}>✨ 正在準備您的回顧...</h2>
                    <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#FFD700', textShadow: '0 2px 10px rgba(0,0,0,0.5)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.6rem' }}>🧁</span> Hola Bakery 甜點工作室
                        </div>
                        <div style={{ fontSize: '1rem', color: '#FFD700', opacity: 0.9, letterSpacing: '2px' }}>暖心應援</div>
                    </div>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="wrapped-overlay" onClick={onClose}>
                <div className="wrapped-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <h2>⚠️ {error}</h2>
                    <p>可能是您還沒有建立課表數據</p>
                    <button onClick={onClose} style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}>關閉</button>
                </div>
            </div>
        )
    }

    const renderSlideContent = () => {
        switch (currentSlide) {
            // ... (cases 0-4 unchanged, I'll keep them implicit or user must trust replace)
            case 0:
                return (
                    <div className="slide-content slide-intro">
                        <div className="poster-header">
                            <span>NCNU SUPER ASSISTANT</span>
                        </div>
                        <div className="poster-hero">
                            <h1 style={{ fontSize: '3rem', lineHeight: '0.9' }}>2025 / 114-1 SEMESTER<br />WRAPPED</h1>
                            <div className="poster-tag" style={{ transform: 'rotate(-5deg)', marginTop: '20px' }}>學期回顧</div>

                            {/* Hola Bakery Promo Tag */}
                            <div className="poster-tag" style={{
                                fontSize: '1rem',
                                padding: '8px 15px',
                                marginTop: '15px',
                                background: '#000',
                                color: '#fff',
                                transform: 'rotate(10deg)', // 更活潑的傾斜
                                boxShadow: '5px 5px 0px rgba(0,0,0,0.5)',
                                animationName: 'stampInRight', // 專屬右傾動畫
                                animationDelay: '0.8s',
                                textShadow: 'none',
                                lineHeight: '1.4'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🧁</span> Hola Bakery 甜點工作室
                                </div>
                                <div style={{ fontSize: '0.8rem', marginTop: '2px', fontWeight: 'normal', letterSpacing: '2px', opacity: 0.9 }}>
                                    暖心應援
                                </div>
                            </div>
                        </div>
                        <div className="poster-footer">
                            <p>點擊開啟 👉</p>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="slide-content slide-rank">
                        <div className="poster-header">
                            <span>EARLY ADOPTER</span>
                        </div>
                        <div className="poster-hero">
                            <h2>你是第 ...</h2>
                            <div className="poster-tag" style={{ fontSize: '5rem', color: '#000', background: '#fff', textShadow: 'none' }}>#{data.user_rank}</div>
                            <h2>位使用者</h2>
                            <h3 className="poster-subtitle">{data.join_date} 加入</h3>
                        </div>
                        <div className="poster-footer">
                            <p>NCNU SUPER ASSISTANT</p>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="slide-content slide-credits">
                        <div className="poster-header">
                            <span>ACADEMIC FOCUS</span>
                        </div>
                        <div className="poster-hero">
                            <h2>本學期規劃了</h2>
                            <div className="poster-tag" style={{ fontSize: '5rem', background: '#ffeb3b', color: '#000' }}>{data.total_credits}</div>
                            <h2>學分</h2>
                            <h3 className="poster-subtitle">約 {Math.round(data.total_credits * 16)} 小時課程</h3>
                        </div>
                        <div className="poster-footer">
                            <p>NCNU SUPER ASSISTANT</p>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="slide-content slide-percentile">
                        <div className="poster-header">
                            <span>OUTSTANDING</span>
                        </div>
                        <div className="poster-hero">
                            <h2>學分量超越了</h2>
                            <div className="poster-tag" style={{ fontSize: '4rem', background: '#ff00cc', color: '#fff' }}>{data.percentile}%</div>
                            <h2>的全校使用者</h2>
                            <div className="poster-tag-sub">{data.tag}</div>
                        </div>
                        <div className="poster-footer">
                            <p>NCNU SUPER ASSISTANT</p>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="slide-content slide-dept">
                        <div className="poster-header">
                            <span>TOP INTEREST</span>
                        </div>
                        <div className="poster-hero">
                            <h2>你的最愛領域</h2>
                            <div className="poster-tag" style={{ fontSize: '2.5rem', background: '#00c6ff', color: '#000', lineHeight: '1.2' }}>{data.favorite_dept}</div>
                            <h3 className="poster-subtitle">專注你的熱情 ❤️</h3>
                        </div>
                        <div className="poster-footer">
                            <p>NCNU SUPER ASSISTANT</p>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="slide-content slide-summary">
                        <div className="summary-poster">
                            <div className="poster-header">
                                <span>NCNU SUPER ASSISTANT</span>
                                <div className="poster-username" style={{ fontSize: '2rem', fontWeight: 900, margin: '10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    {data.user_name}
                                </div>
                                <h2>2025 / 114-1 SEMESTER<br />WRAPPED</h2>
                            </div>

                            <div className="poster-hero">
                                <div className="poster-tag">{data.tag}</div>
                            </div>

                            <div className="poster-stats-grid">
                                <div className="wrapped-stat-item">
                                    <span className="wrapped-stat-label">加入排名</span>
                                    <span className="wrapped-stat-value">#{data.user_rank}</span>
                                </div>
                                <div className="wrapped-stat-item">
                                    <span className="wrapped-stat-label">總學分</span>
                                    <span className="wrapped-stat-value">{data.total_credits}</span>
                                </div>
                                <div className="wrapped-stat-item">
                                    <span className="wrapped-stat-label">超越全校</span>
                                    <span className="wrapped-stat-value">{data.percentile}%</span>
                                </div>
                                <div className="wrapped-stat-item">
                                    <span className="wrapped-stat-label">最愛領域</span>
                                    <span className="wrapped-stat-value" style={{ fontSize: '1rem' }}>{data.favorite_dept}</span>
                                </div>
                            </div>

                            <div className="poster-footer">
                                <div className="footer-line"></div>
                                <p>NCNU SUPER ASSISTANT • 2025</p>
                            </div>
                        </div>

                        <button className="share-btn" onClick={captureAndShowPromo}>
                            分享我的回顧
                        </button>
                    </div>
                );
            case 6: // Dcard Promo Slide
                return (
                    <div className="slide-content slide-promo" style={{ background: '#006aa6', color: '#fff', overflow: 'hidden' }}>
                        <div className="poster-header" style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '1rem', letterSpacing: '2px' }}>HOUSING SURVEY</span>
                        </div>
                        <div className="poster-hero" style={{ padding: '0 15px' }}>
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
                                lineHeight: 1.3
                            }}>
                                第二次抽獎來咯！🎁<br />租屋鬼故事募集 👻
                            </div>
                            <div
                                className="promo-container"
                                onClick={() => window.open('https://www.dcard.tw/f/ncnu/p/260489435', '_blank', 'noopener,noreferrer')}
                                style={{
                                    marginTop: '12px',
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
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open('https://www.dcard.tw/f/ncnu/p/260489435', '_blank', 'noopener,noreferrer');
                                    }}
                                    style={{
                                        padding: '10px 18px',
                                        background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                                        color: '#000',
                                        borderRadius: '50px',
                                        border: '2px solid #fff',
                                        cursor: 'pointer',
                                        fontWeight: 900,
                                        fontSize: '0.95rem',
                                        boxShadow: '0 4px 15px rgba(255,215,0,0.5)',
                                        position: 'relative',
                                        zIndex: 10,
                                        animation: 'btnPulse 1.5s infinite'
                                    }}
                                >
                                    🎉 填問卷抽獎 🎁
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShareBlob(null);
                                        setCurrentSlide(5);
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'rgba(255,255,255,0.3)',
                                        color: '#fff',
                                        borderRadius: '50px',
                                        border: '2px solid #fff',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                                        position: 'relative',
                                        zIndex: 10
                                    }}
                                >
                                    🔄 重新分享
                                </button>
                            </div>
                            <p style={{ marginTop: '8px', fontSize: '0.75rem', opacity: 0.8 }}>正在為您生成回顧圖片... ⏳</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="wrapped-overlay">
            <div className="wrapped-container">
                {/* Progress Bars */}
                <div className="progress-bars">
                    {[...Array(SLIDE_count)].map((_, idx) => (
                        <div key={idx} className="progress-bar">
                            <div
                                className={`progress-fill ${idx < currentSlide ? 'completed' : idx === currentSlide ? 'active' : ''}`}
                            />
                        </div>
                    ))}
                </div>

                {/* Close Button */}
                <button className="close-btn" onClick={onClose}>×</button>

                {/* Tap Areas - Hidden on Promo Slide (6) to allow button interaction */}
                {currentSlide !== 6 && (
                    <>
                        <div className="tap-area tap-left" onClick={prevSlide}></div>
                        <div className="tap-area tap-right" onClick={nextSlide}></div>
                    </>
                )}

                {/* Slide Content */}
                {renderSlideContent()}
            </div>
        </div>
    );
};

export default SemesterWrapped;
