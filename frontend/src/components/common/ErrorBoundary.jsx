// frontend/src/components/common/ErrorBoundary.jsx (錯誤邊界組件)
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 🎯 錯誤日誌記錄
    this.logError(error, errorInfo);
    
    // 🎯 通知父組件
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  logError = (error, errorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // 🎯 開發環境下詳細日誌
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught an Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error Data:', errorData);
      console.groupEnd();
    }

    // 🎯 生產環境下可以發送到錯誤監控服務
    if (process.env.NODE_ENV === 'production') {
      try {
        // 這裡可以整合 Sentry、LogRocket 等錯誤監控服務
        // sendErrorToService(errorData);
        
        // 暫時存儲到 localStorage 以供調試
        const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
        existingErrors.push(errorData);
        
        // 只保留最近的 10 個錯誤
        if (existingErrors.length > 10) {
          existingErrors.shift();
        }
        
        localStorage.setItem('app_errors', JSON.stringify(existingErrors));
      } catch (e) {
        console.error('Failed to log error:', e);
      }
    }
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 🎯 自定義錯誤顯示組件
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 🎯 預設錯誤顯示
      return (
        <div className="error-boundary">
          <div className="error-container glass-effect">
            <div className="error-header">
              <div className="error-icon">💥</div>
              <h2>糟糕！出現了意外錯誤</h2>
            </div>
            
            <div className="error-body">
              <p className="error-message">
                我們在載入此頁面時遇到了問題。這個錯誤已經被記錄，我們會盡快修復。
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="error-details">
                  <summary>技術詳情 (開發模式)</summary>
                  <div className="error-info">
                    <p><strong>錯誤訊息:</strong> {this.state.error?.message}</p>
                    <p><strong>錯誤ID:</strong> {this.state.errorId}</p>
                    <pre className="error-stack">
                      {this.state.error?.stack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
            
            <div className="error-actions">
              <button 
                className="apple-button"
                onClick={this.handleRetry}
              >
                重試
              </button>
              <button 
                className="apple-button" 
                onClick={this.handleReload}
                style={{ marginLeft: '1rem' }}
              >
                重新載入頁面
              </button>
            </div>
            
            <div className="error-footer">
              <p className="error-support">
                如果問題持續發生，請聯繫技術支援並提供錯誤ID: 
                <code>{this.state.errorId}</code>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
