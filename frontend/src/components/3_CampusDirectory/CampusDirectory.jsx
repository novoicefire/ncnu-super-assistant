// frontend/src/components/3_CampusDirectory/CampusDirectory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CampusDirectory.css';

const API_URL = import.meta.env.VITE_API_URL;

const CampusDirectory = () => {
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        axios.get(`${API_URL}/api/contacts`)
            .then(res => {
                setContacts(res.data);
                setFilteredContacts(res.data);
            })
            .catch(err => console.error("Error fetching contacts:", err));
    }, []);

    useEffect(() => {
        // [核心修正] 並行讀取兩個靜態 JSON
        const fetchContactData = async () => {
            try {
                const contactPromise = axios.get('/data/校園聯絡資訊API.json');
                const unitPromise = axios.get('/data/行政教學單位代碼API.json');

                const [contactRes, unitRes] = await Promise.all([contactPromise, unitPromise]);
                
                const contactItems = contactRes.data.contact_info.item || [];
                const unitItems = unitRes.data.deptId_ncnu.item || [];

                // 整合資料的邏輯
                const unitMap = new Map(unitItems.map(item => [item.中文名稱, item.網站網址]));
                const mergedContacts = contactItems.map(contact => ({
                    ...contact,
                    web: unitMap.get(contact.title) || contact.web,
                }));
                
                setContacts(mergedContacts);
                setFilteredContacts(mergedContacts);
            } catch (error) {
                console.error("Error fetching contact data:", error);
            }
        };
        fetchContactData();
    }, []);
    return (
        <div className="directory-container">
            <h1>校園通訊錄</h1>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="輸入單位名稱或關鍵字搜尋..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="contact-grid">
                {filteredContacts.map((contact, index) => (
                    <div className="contact-card" key={index}>
                        <h3>{contact.title}</h3>
                        <p className="title-en">{contact.title_en}</p>
                        {contact.phone1 && <p>📞 電話1: <a href={`tel:${contact.phone1}`}>{contact.phone1}</a></p>}
                        {contact.phone2 && <p>📞 電話2: <a href={`tel:${contact.phone2.replace(/#(\d+)/, ',$1')}`}>{contact.phone2}</a></p>}
                        {contact.fax && <p>📠 傳真: {contact.fax}</p>}
                        {contact.email !== '未申請' && contact.email && <p>📧 電郵: <a href={`mailto:${contact.email}`}>{contact.email}</a></p>}
                        {contact.web && <p>🌐 網站: <a href={contact.web} target="_blank" rel="noopener noreferrer">點我前往</a></p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CampusDirectory;