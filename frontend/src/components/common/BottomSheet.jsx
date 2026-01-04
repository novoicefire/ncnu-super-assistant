/**
 * BottomSheet.jsx - 統一的手機版底部彈出視窗組件
 * 手機版：從底部滑入 + 支援滑動關閉 | 電腦版：居中 Modal
 * 用於免責聲明、設定、快速操作等彈窗場景
 */
import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import './BottomSheet.css';

const BottomSheet = forwardRef(({
    isVisible,
    onClose,
    title,
    subtitle,
    headerExtra,      // 新增：標題區額外內容（如語言切換）
    showHeader = true,
    showCloseButton = true,
    maxHeight = '85vh',
    className = '',
    children
}, ref) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const containerRef = useRef(null);
    const dragStartY = useRef(0);
    const isDragging = useRef(false);

    // 暴露 close 方法給父組件（用於觸發關閉動畫）
    useImperativeHandle(ref, () => ({
        close: (callback) => {
            setIsClosing(true);
            setTimeout(() => {
                if (callback) callback();
                else if (onClose) onClose();
            }, 200);
        }
    }));

    // 捲動鎖定 Effect (獨立處理以避免 cleanup 覆蓋狀態)
    useEffect(() => {
        if (!isVisible) return;

        // 鎖定：記錄並固定當前位置
        const scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';

        return () => {
            // 恢復：清除樣式並還原位置
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            // 強制瞬間滾動回原位，避免觸發 smooth scrolling 動畫
            window.scrollTo({
                top: scrollY,
                behavior: 'instant'
            });
        };
    }, [isVisible]);

    // 動畫狀態 Effect
    useEffect(() => {
        if (isVisible) {
            requestAnimationFrame(() => {
                setIsAnimating(true);
            });
        } else {
            setIsAnimating(false);
            setIsClosing(false);
            setDragOffset(0);
        }
    }, [isVisible]);

    // 處理關閉動畫
    const handleClose = () => {
        if (onClose) {
            setIsClosing(true);
            setTimeout(() => {
                onClose();
            }, 200);
        }
    };

    // 點擊遮罩關閉
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && showCloseButton) {
            handleClose();
        }
    };

    // ========== 觸控滑動手勢處理 ==========
    const handleTouchStart = (e) => {
        // 如果沒有關閉 callback (onClose)，則禁止拖曳
        if (!onClose) return;
        dragStartY.current = e.touches[0].clientY;
        isDragging.current = true;
    };

    const handleTouchMove = (e) => {
        if (!isDragging.current) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - dragStartY.current;

        // 只允許向下滑動
        if (diff > 0) {
            setDragOffset(diff);
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;

        // 如果滑動超過 100px，觸發關閉
        if (dragOffset > 100) {
            handleClose();
        } else {
            // 回彈
            setDragOffset(0);
        }
    };

    if (!isVisible) return null;

    // 計算容器樣式（包含拖曳偏移）
    const containerStyle = {
        '--max-height': maxHeight,
        transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
        transition: isDragging.current ? 'none' : undefined
    };

    return (
        <div
            className={`bottom-sheet-overlay ${isAnimating ? 'active' : ''} ${isClosing ? 'closing' : ''}`}
            onClick={handleOverlayClick}
            onWheel={(e) => e.stopPropagation()}
        >
            <div
                ref={containerRef}
                className={`bottom-sheet-container ${isAnimating ? 'active' : ''} ${isClosing ? 'closing' : ''} ${className}`}
                style={containerStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 拖曳指示條（僅手機版，若無關閉功能則隱藏） */}
                {onClose && (
                    <div
                        className="bottom-sheet-handle"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="handle-bar"></div>
                    </div>
                )}

                {/* 標題列 */}
                {showHeader && (
                    <div
                        className="bottom-sheet-header"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="header-text">
                            {title && <h2 className="bottom-sheet-title">{title}</h2>}
                            {subtitle && <p className="bottom-sheet-subtitle">{subtitle}</p>}
                            {headerExtra && <div className="header-extra">{headerExtra}</div>}
                        </div>
                        {showCloseButton && (
                            <button className="bottom-sheet-close" onClick={handleClose}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        )}
                    </div>
                )}

                {/* 內容區域 */}
                <div className="bottom-sheet-content">
                    {children}
                </div>
            </div>
        </div>
    );
});

export default BottomSheet;
