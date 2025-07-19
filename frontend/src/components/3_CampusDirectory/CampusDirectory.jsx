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

  // --- 修正點：在這裡加入防禦性檢查 ---
  const filteredContacts = contacts.filter(contact => {
    // 檢查 title 是否存在且匹配
    const titleMatch = contact.title && typeof contact.title === 'string' &&
      contact.title.toLowerCase().includes(searchTerm.toLowerCase());

    // 檢查 tel 是否存在、是個陣列，並且其中有項目匹配
    const telMatch = contact.tel && Array.isArray(contact.tel) &&
      contact.tel.some(t => t.ext && typeof t.ext === 'string' && t.ext.includes(searchTerm));

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
          <div key={contact.title + index} className="contact-card">
            <h3>{contact.title}</h3>
            <div className="contact-info">
              {/* 也為 tel 陣列加上防禦性檢查，以防萬一 */}
              {contact.tel && contact.tel.map((t, telIndex) => (
                <p key={telIndex}>
                  📞 {t.name}: {t.ext}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampusDirectory;