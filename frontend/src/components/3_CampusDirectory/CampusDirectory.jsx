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
        // 現在從後端拿到的 data，是包含 phone1, phone2, fax, email 的物件陣列
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

  // 修改點：更新搜尋邏輯以匹配新的資料欄位
  const filteredContacts = contacts.filter(contact => {
    const term = searchTerm.toLowerCase();
    return (
      (contact.title && contact.title.toLowerCase().includes(term)) ||
      (contact.phone1 && contact.phone1.includes(term)) ||
      (contact.phone2 && contact.phone2.includes(term)) ||
      (contact.fax && contact.fax.includes(term)) ||
      (contact.email && contact.email.toLowerCase().includes(term))
    );
  });

  if (loading) return <div><p>正在載入校園通訊錄...</p></div>;
  if (error) return <div><p style={{ color: 'red' }}>{error}</p></div>;

  return (
    <div className="directory-container">
      <h2>校園通訊錄</h2>
      <input
        type="text"
        placeholder="依單位、電話、傳真、電郵搜尋..."
        className="directory-search-bar"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="directory-grid">
        {filteredContacts.map((contact, index) => (
          <div key={index} className="contact-card">
            <h3>{contact.title || '無標題'}</h3>
            <div className="contact-info">
              {/* 
                修改點：條件式渲染每一行聯絡資訊
                只有當該欄位有值 (不是空字串) 時，才會顯示這一行
              */}
              {contact.phone1 && <p>📞 電話1: {contact.phone1}</p>}
              {contact.phone2 && <p>📞 電話2: {contact.phone2}</p>}
              {contact.fax && <p>📠 傳真: {contact.fax}</p>}
              {/* 對於 email，我們要排除掉 API 回傳的 "未申請" 字樣 */}
              {contact.email && contact.email !== '未申請' && <p>📧 電郵: {contact.email}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampusDirectory;