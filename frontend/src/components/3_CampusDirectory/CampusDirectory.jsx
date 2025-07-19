import React, { useState, useEffect } from 'react';
import { robustRequest } from '../../apiHelper';
import './CampusDirectory.css';

const CampusDirectory = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        // 現在從後端拿到的 data，已經是轉換過的乾淨資料了
        const data = await robustRequest('get', '/api/contacts');
        if (Array.isArray(data)) {
          setContacts(data);
        } else {
          setError('無法識別的通訊錄資料格式');
        }
      } catch (err) {
        setError(`讀取通訊錄失敗: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // 現在這個過濾邏輯將能完美運作
  const filteredContacts = contacts.filter(contact => {
    const titleMatch = contact.title && contact.title.toLowerCase().includes(searchTerm.toLowerCase());
    const telMatch = contact.tel && contact.tel.some(t => t.ext && t.ext.includes(searchTerm));
    return titleMatch || telMatch;
  });

  if (loading) return <div><p>正在載入校園通訊錄...</p></div>;
  if (error) return <div><p style={{ color: 'red' }}>{error}</p></div>;

  return (
    <div className="directory-container">
      <h2>校園通訊錄</h2>
      <input
        type="text"
        placeholder="依單位名稱或分機號碼搜尋..."
        className="directory-search-bar"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="directory-grid">
        {filteredContacts.map((contact, index) => (
          <div key={index} className="contact-card">
            <h3>{contact.title || '無標題'}</h3>
            <div className="contact-info">
              {/* 這段程式碼現在可以安心地渲染 tel 陣列 */}
              {Array.isArray(contact.tel) && contact.tel.length > 0 ? (
                contact.tel.map((t, telIndex) => (
                  <p key={telIndex}>
                    📞 {t.name}: {t.ext}
                  </p>
                ))
              ) : (
                <p className="no-tel-info">無電話資訊</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampusDirectory;