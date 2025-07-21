// frontend/src/components/3_CampusDirectory/CampusDirectory.jsx (現代化版)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CampusDirectory.css';

const CampusDirectory = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContactData = async () => {
      setIsLoading(true);
      try {
        const contactPromise = axios.get('/data/校園聯絡資訊API.json');
        const unitPromise = axios.get('/data/行政教學單位代碼API.json');
        
        const [contactRes, unitRes] = await Promise.all([contactPromise, unitPromise]);
        
        const contactItems = contactRes.data.contact_info.item || [];
        const unitItems = unitRes.data.deptId_ncnu.item || [];
        
        const unitMap = new Map(unitItems.map(item => [item.中文名稱, item.網站網址]));
        const mergedContacts = contactItems.map(contact => ({
          ...contact,
          web: unitMap.get(contact.title) || contact.web,
        }));
        
        setContacts(mergedContacts);
        setFilteredContacts(mergedContacts);
      } catch (error) {
        console.error("Error fetching contact data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.title_en && contact.title_en.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredContacts(filtered);
    }
  }, [searchTerm, contacts]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 聯絡資訊圖示對應
  const getContactIcon = (type) => {
    const icons = {
      phone: '📞',
      fax: '📠',
      email: '📧',
      web: '🌐'
    };
    return icons[type] || '📋';
  };

  if (isLoading) {
    return (
      <div className="directory-container">
        <div className="loading">
          正在載入校園通訊錄...
        </div>
      </div>
    );
  }

  return (
    <div className="directory-container">
      <div className="directory-header">
        <h2>📞 校園通訊錄</h2>
        <p>快速查詢暨南大學各單位聯絡資訊</p>
      </div>

      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 搜尋單位名稱或英文名稱..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="directory-stats">
        <div className="stat-item">
          <span className="stat-number">{contacts.length}</span>
          <span className="stat-label">總單位數</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{filteredContacts.length}</span>
          <span className="stat-label">搜尋結果</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{contacts.filter(c => c.web).length}</span>
          <span className="stat-label">有官網</span>
        </div>
      </div>

      {filteredContacts.length > 0 ? (
        <div className="contact-grid">
          {filteredContacts.map((contact, index) => (
            <div key={index} className="contact-card">
              <div className="contact-header">
                <h3 className="contact-title">{contact.title}</h3>
                {contact.title_en && (
                  <p className="contact-title-en">{contact.title_en}</p>
                )}
              </div>
              
              <div className="contact-info">
                {contact.phone1 && (
                  <div className="contact-item">
                    <span className="contact-icon">{getContactIcon('phone')}</span>
                    <span className="contact-text">電話1: {contact.phone1}</span>
                  </div>
                )}
                
                {contact.phone2 && (
                  <div className="contact-item">
                    <span className="contact-icon">{getContactIcon('phone')}</span>
                    <span className="contact-text">電話2: {contact.phone2}</span>
                  </div>
                )}
                
                {contact.fax && (
                  <div className="contact-item">
                    <span className="contact-icon">{getContactIcon('fax')}</span>
                    <span className="contact-text">傳真: {contact.fax}</span>
                  </div>
                )}
                
                {contact.email && contact.email !== '未申請' && (
                  <div className="contact-item">
                    <span className="contact-icon">{getContactIcon('email')}</span>
                    <a 
                      href={`mailto:${contact.email}`} 
                      className="contact-link contact-text"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
                
                {contact.web && (
                  <div className="contact-item">
                    <span className="contact-icon">{getContactIcon('web')}</span>
                    <a 
                      href={contact.web} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="contact-link contact-text"
                    >
                      前往官網
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <h3>🔍 找不到符合條件的單位</h3>
          <p>請嘗試使用不同的關鍵字搜尋</p>
        </div>
      )}
    </div>
  );
};

export default CampusDirectory;
