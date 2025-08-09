// frontend/src/components/0_Dashboard/announcementData.js
export const announcementData = [
  {
    id: 1,
    title: "友情提示🫶不是廣告",
    date: "2025-08-08",
    priority: "normal",
    content: "有需要**免費諮詢升學或職涯規劃**的人，可以找我要聯繫方式，而且他們在學校也有駐點，有興趣可以去問問看，反正問不用錢，祝大家學業順利💪大展鴻圖😎",
    images: [],
    embeds: [],
    buttons: [
      {
        text: "加我IG跟我拿聯絡資訊",
        url: "https://www.instagram.com/ncnu_super_assistant/",
        style: "success",
        icon: "💬",
        external: true
      }
    ]
  },
  {
    id: 1,
    title: "🎉 暨大生超級助理深色模式上線！",
    date: "2025-07-29",
    priority: "high", // high, normal, low
    content: `我很高興地宣布，網站全新的深色模式現已正式上線！除了視覺體驗的提升，我還對手機版介面進行了全面優化。

**新功能亮點：**
• 智能主題切換，保護您的雙眼
• 響應式設計完美適配各種設備  
• 毛玻璃效果提升視覺層次感`,
    images: [
      {
        src: "/images/dark-mode-preview.jpg",
        alt: "",
        caption: "新增公告區功能，可放置圖、文、影"
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
        text: "點擊選單裡的按鈕🌙立即體驗",
        url: "/",
        style: "primary",
        icon: "✨",
        external: false
      },
      {
        text: "查看更新日誌",
        url: "/updates",
        style: "secondary", 
        icon: "📖",
        external: false
      }
    ]
  },
  {
    id: 2,
    title: "📚 8/26~28 為選課週時間",
    date: "2025-07-28",
    priority: "normal",
    content: `親愛的同學們，為了您自己的權益，請記得要預先安排好課程規劃，並於校方公告時間前往校務系統選課。

**選課時間：**
8月26日 上午11:00 ~ 8月28日 上午10:00
**選課範圍：**
大學部學生選填通識課程及特色運動志願
**公布時間：**
8月28日 下午03:00`,
    images: [],
    embeds: [],
    buttons: [
      {
        text: "了解詳情",
        url: "https://curriculum.ncnu.edu.tw/p/404-1049-28076.php?Lang=zh-tw",
        style: "warning",
        icon: "📰",
        external: true
      }
    ]
  },
  {
    id: 3,
    title: "🎓 暨大生使用回饋",
    date: "2025-07-27", 
    priority: "low",
    content: `感謝所有使用暨大生超級助理的同學們！您的支持是我們持續改進的動力。

歡迎在使用過程中提供寶貴建議，讓我們一起打造更好的校園服務平台。`,
    images: [],
    embeds: [
      {
        type: "link",
        url: "https://www.dcard.tw/f/ncnu/p/259365158",
        title: "Dcard 網站介紹貼文",
        description: "在下方留言或回報幫助我修復BUG與改進服務品質"
      }
    ],
    buttons: [
      {
        text: "追蹤IG",
        url: "https://www.instagram.com/ncnu_super_assistant/", 
        style: "success",
        icon: "💬",
        external: true
      },
    ]
  }
];
