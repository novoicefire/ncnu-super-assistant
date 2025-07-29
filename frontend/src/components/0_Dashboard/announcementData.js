// frontend/src/components/0_Dashboard/announcementData.js
export const announcementData = [
  {
    id: 1,
    title: "🎉 暨大生超級助理深色模式上線！",
    date: "2025-07-29",
    priority: "high", // high, normal, low
    content: `我們很高興地宣布，網站全新的深色模式現已正式上線！除了視覺體驗的提升，我們還對手機版介面進行了全面優化。

**新功能亮點：**
• 智能主題切換，保護您的雙眼
• 響應式設計完美適配各種設備  
• 毛玻璃效果提升視覺層次感`,
    images: [
      {
        src: "/images/dark-mode-preview.jpg",
        alt: "深色模式預覽圖",
        caption: "全新深色模式界面"
      }
    ],
    embeds: [
      {
        type: "youtube",
        id: "dQw4w9WgXcQ",
        title: "功能演示影片"
      }
    ],
    buttons: [
      {
        text: "立即體驗",
        url: "/",
        style: "primary",
        icon: "✨",
        external: false
      },
      {
        text: "查看更新日誌",
        url: "/update-log",
        style: "secondary", 
        icon: "📖",
        external: false
      }
    ]
  },
  {
    id: 2,
    title: "📚 期中考週系統維護通知",
    date: "2025-07-28",
    priority: "normal",
    content: `親愛的同學們，為了提供更穩定的服務，我們將在期中考週進行系統例行維護。

**維護時間：** 7月30日 凌晨2:00-6:00
**影響範圍：** 課程規劃功能可能短暫無法使用
**建議：** 請提前備份您的課表資料`,
    images: [],
    embeds: [],
    buttons: [
      {
        text: "了解詳情",
        url: "#maintenance-info",
        style: "warning",
        icon: "🔧",
        external: false
      }
    ]
  },
  {
    id: 3,
    title: "🎓 畢業生感謝回饋",
    date: "2025-07-27", 
    priority: "low",
    content: `感謝所有使用暨大生超級助理的同學們！您的支持是我們持續改進的動力。

歡迎在使用過程中提供寶貴建議，讓我們一起打造更好的校園服務平台。`,
    images: [],
    embeds: [
      {
        type: "link",
        url: "https://forms.google.com/feedback",
        title: "用戶滿意度調查",
        description: "幫助我們改進服務品質"
      }
    ],
    buttons: [
      {
        text: "填寫問卷",
        url: "https://forms.google.com/feedback", 
        style: "success",
        icon: "💬",
        external: true
      },
      {
        text: "加入社群",
        url: "https://line.me/community",
        style: "secondary",
        icon: "👥", 
        external: true
      }
    ]
  }
];
