// 题库定义
const questions = {
    BASIC: [
        {
            type: "text",
            question: "复旦大学创立于哪一年？创始人是谁？",
            options: ["1900年，李登辉", "1905年，马相伯", "1910年，陈望道", "1915年，郭秉文"],
            correct: 1,
            difficulty: 1,
            category: "校史基础"
        },
        {
            type: "text",
            question: "\"复旦\"校名出自哪部古籍？",
            options: ["《论语》", "《尚书大传·虞夏传》", "《诗经》", "《左传》"],
            correct: 1,
            difficulty: 1,
            category: "校史基础"
        },
        {
            type: "text",
            question: "复旦大学的第一任校长是谁？",
            options: ["马相伯", "李登辉", "于右任", "蔡元培"],
            correct: 0,
            difficulty: 1
        },
        {
            type: "text",
            question: "复旦公学最初创办的地点在哪里？",
            options: ["武昌路", "吴淞路", "南京路", "淮海路"],
            correct: 1,
            difficulty: 1
        },
        {
            type: "text",
            question: "复旦大学的校训是什么？",
            options: ["博学而笃志，切问而近思", "明德格物", "自强不息，厚德载物", "文明、民主、科学"],
            correct: 0,
            difficulty: 1
        }
    ],
    EVENTS: [
        {
            type: "text",
            question: "抗日战争期间，复旦大学内迁至何处复课？",
            options: ["重庆北碚夏坝", "昆明", "贵阳", "成都"],
            correct: 0,
            difficulty: 2,
            category: "历史事件"
        },
        {
            type: "text",
            question: "复旦公学正式更名为\"复旦大学\"的年份是？",
            options: ["1917年", "1920年", "1925年", "1929年"],
            correct: 0,
            difficulty: 2
        },
        {
            type: "text",
            question: "1952年院系调整后，复旦大学的主要学科方向是？",
            options: ["理工为主", "文理为主", "医学为主", "师范为主"],
            correct: 1,
            difficulty: 2
        },
        {
            type: "text",
            question: "复旦大学现在的邯郸校区是哪一年启用的？",
            options: ["1952年", "1956年", "1960年", "1965年"],
            correct: 1,
            difficulty: 2
        },
        {
            type: "text",
            question: "2000年，哪所医科大学与复旦大学合并？",
            options: ["上海医科大学", "第二军医大学", "同济医学院", "中山医科大学"],
            correct: 0,
            difficulty: 2
        }
    ],
    ACHIEVEMENTS: [
        {
            type: "text",
            question: "复旦校友中首位诺贝尔奖获得者是？",
            options: ["李政道", "杨振宁", "朱棣文", "丁肇中"],
            correct: 0,
            difficulty: 3,
            category: "杰出校友"
        },
        {
            type: "text",
            question: "复旦大学强势学科之一，被誉为\"中国新闻学第一学府\"的是？",
            options: ["新闻学院", "传播学院", "新闻传播学院", "媒体与传播学院"],
            correct: 2,
            difficulty: 3
        },
        {
            type: "text",
            question: "复旦大学校史中\"二周\"指的是哪两位历史学家？",
            options: ["周谷城和周予同", "周树人和周作人", "周恩来和周公度", "周培源和周光召"],
            correct: 0,
            difficulty: 3
        },
        {
            type: "text",
            question: "复旦大学在2021年QS世界大学排名中的位次是？",
            options: ["前50", "前100", "前150", "前200"],
            correct: 1,
            difficulty: 3
        },
        {
            type: "text",
            question: "复旦大学的校园内有一条著名的林荫道，被称为？",
            options: ["光华路", "复旦路", "五角场路", "国定路"],
            correct: 0,
            difficulty: 3
        }
    ],
    CHALLENGE: [
        {
            type: "text",
            question: "复旦大学现任校长是？",
            options: ["许宁生", "金力", "焦扬", "杨玉良"],
            correct: 1,
            difficulty: 4,
            category: "现状发展"
        },
        {
            type: "text",
            question: "复旦大学图书馆藏书量超过多少册？",
            options: ["300万册", "400万册", "500万册", "600万册"],
            correct: 2,
            difficulty: 4
        },
        {
            type: "text",
            question: "复旦大学的校歌《复旦大学校歌》作词者是？",
            options: ["李叔同", "郭秉文", "许寿裳", "李登辉"],
            correct: 1,
            difficulty: 4
        },
        {
            type: "text",
            question: "复旦大学现有多少个院士（包括两院院士）？",
            options: ["20位以上", "30位以上", "40位以上", "50位以上"],
            correct: 2,
            difficulty: 4
        },
        {
            type: "text",
            question: "复旦大学的校色是？",
            options: ["红色和蓝色", "红色和金色", "蓝色和白色", "红色和白色"],
            correct: 0,
            difficulty: 4
        },
        {
            type: "text",
            question: "复旦大学的校徽设计灵感来源于？",
            options: ["古代铜镜", "太极八卦", "篆刻印章", "青铜器纹"],
            correct: 0,
            difficulty: 4
        }
    ]
}; 