// frontend/src/components/3_CampusDirectory/CampusDirectory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CampusDirectory.css';

const API_URL = '/api';

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
        const results = contacts.filter(contact =>
            contact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.description && contact.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredContacts(results);
    }, [searchTerm, contacts]);

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