// 成就展示页面的JavaScript代码
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initPage();
    
    // 加载数据并创建图表
    loadAchievementsData();
    
    // 初始化返回顶部按钮
    initBackToTop();
});

// 初始化页面
function initPage() {
    // 模拟加载进度
    let progress = 0;
    const progressElement = document.querySelector('.progress');
    const loadingScreen = document.querySelector('.loading-screen');
    const container = document.querySelector('.container');
    
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 1;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // 隐藏加载屏幕，显示内容
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                container.classList.remove('hide');
                
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 500);
        }
        progressElement.textContent = `${progress}%`;
    }, 150);
}

// 加载成就数据并创建图表
async function loadAchievementsData() {
    try {
        const response = await fetch('data/achievements.json');
        const data = await response.json();
        
        // 创建学科评估图表
        createDisciplineChart(data.discipline);
        
        // 创建科研突破图表
        createResearchChart(data.research);
        
        // 创建国际交流图表
        createInternationalChart(data.international);
        
        // 创建校友展示
        createAlumniCards(data.alumni);
        
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// 创建学科评估图表
function createDisciplineChart(data) {
    const ctx = document.getElementById('disciplineChart').getContext('2d');
    
    // 创建柱状图
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: data.title,
                data: data.data,
                backgroundColor: data.colors,
                borderColor: data.colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: data.title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}个`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '学科数量'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '评估等级'
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// 创建科研突破图表
function createResearchChart(data) {
    const ctx = document.getElementById('researchChart').getContext('2d');
    
    // 创建混合图表（柱状图+折线图）
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.years,
            datasets: [
                {
                    label: data.funding.label,
                    data: data.funding.data,
                    backgroundColor: data.funding.color,
                    borderColor: data.funding.color,
                    borderWidth: 1,
                    order: 1
                },
                {
                    label: data.papers.label,
                    data: data.papers.data,
                    type: 'line',
                    borderColor: data.papers.color,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointBackgroundColor: data.papers.color,
                    tension: 0.4,
                    yAxisID: 'y1',
                    order: 0
                },
                {
                    label: data.awards.label,
                    data: data.awards.data,
                    type: 'line',
                    borderColor: data.awards.color,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointBackgroundColor: data.awards.color,
                    tension: 0.4,
                    yAxisID: 'y2',
                    order: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: data.title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '科研经费（亿元）'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'SCI论文数量'
                    }
                },
                y2: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    display: false
                },
                x: {
                    title: {
                        display: true,
                        text: '年份'
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// 创建国际交流图表
function createInternationalChart(data) {
    const ctx = document.getElementById('internationalChart').getContext('2d');
    
    // 创建折线图
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.years,
            datasets: [
                {
                    label: data.programs.label,
                    data: data.programs.data,
                    borderColor: data.programs.color,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointBackgroundColor: data.programs.color,
                    tension: 0.4
                },
                {
                    label: data.students.label,
                    data: data.students.data,
                    borderColor: data.students.color,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointBackgroundColor: data.students.color,
                    tension: 0.4,
                    yAxisID: 'y1'
                },
                {
                    label: data.partners.label,
                    data: data.partners.data,
                    borderColor: data.partners.color,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointBackgroundColor: data.partners.color,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: data.title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '项目/院校数量'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: '留学生人数'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '年份'
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// 创建校友卡片
function createAlumniCards(alumni) {
    const container = document.getElementById('alumniContainer');
    
    alumni.forEach(person => {
        const card = document.createElement('div');
        card.className = 'alumni-card';
        
        // 检查图片是否存在，如果不存在则使用默认图片
        const imgSrc = person.image || 'assets/images/alumni/default.jpg';
        
        card.innerHTML = `
            <img src="${imgSrc}" alt="${person.name}" class="alumni-image" onerror="this.src='assets/images/alumni/default.jpg'">
            <div class="alumni-info">
                <h4>${person.name}</h4>
                <p class="alumni-title">${person.title}</p>
                <p class="alumni-description">${person.description}</p>
            </div>
        `;
        
        container.appendChild(card);
        
        // 添加动画效果
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * container.children.length);
    });
}

// 初始化返回顶部按钮
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    // 监听滚动事件
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    // 点击返回顶部
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
} 