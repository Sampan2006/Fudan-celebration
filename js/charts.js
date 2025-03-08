// 增强型数据加载器
const DataLoader = {
  config: {
    retryCount: 3,
    timeout: 5000
  },

  async load(url) {
    let attempts = 0;
    
    while (attempts < this.config.retryCount) {
      try {
        console.log(`尝试加载数据: ${url} (第${attempts + 1}次)`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP错误 ${response.status}`);
        const data = await response.json();
        console.log('数据加载成功:', url);
        return data;
        
      } catch (error) {
        console.warn(`第${++attempts}次尝试失败:`, error);
        if (attempts >= this.config.retryCount) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
};

// 数据缓存策略
const CachedLoader = {
  async load(url) {
    const cacheKey = `cache_${btoa(url)}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      console.log('使用缓存数据:', url);
      return JSON.parse(cached);
    }

    const data = await DataLoader.load(url);
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  },
  
  clearCache() {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        sessionStorage.removeItem(key);
      }
    });
    console.log('缓存已清除');
  }
};

// 增强错误显示
function showError(message) {
  // 移除已有的错误提示
  const existingError = document.querySelector('.error-notification');
  if (existingError) {
    existingError.remove();
  }
  
  const errorBox = document.createElement('div');
  errorBox.className = 'error-notification';
  errorBox.innerHTML = `
    <span>⚠️</span>
    <p>${message}</p>
    <button onclick="location.reload()">重试</button>
    <button class="close-btn">关闭</button>
  `;
  document.body.prepend(errorBox);
  
  // 添加关闭按钮事件
  errorBox.querySelector('.close-btn').addEventListener('click', () => {
    errorBox.remove();
  });
  
  // 5秒后自动隐藏
  setTimeout(() => {
    if (document.body.contains(errorBox)) {
      errorBox.style.opacity = '0';
      setTimeout(() => errorBox.remove(), 500);
    }
  }, 5000);
}

// 显示加载状态
function showLoading() {
  const loadingContainer = document.getElementById('loadingContainer');
  if (loadingContainer) {
    loadingContainer.style.display = 'flex';
  }
}

// 隐藏加载状态
function hideLoading() {
  const loadingContainer = document.getElementById('loadingContainer');
  if (loadingContainer) {
    loadingContainer.style.display = 'none';
  }
}

// 强化错误处理的图表初始化
async function initCharts() {
  showLoading();
  
  try {
    console.log('当前工作目录:', window.location.pathname);
    console.log('请求路径:', new URL('./data/achievements.json', window.location.href).href);
    
    const data = await CachedLoader.load('./data/achievements.json');
    
    // 初始化图表
    renderDisciplineChart(data);
    renderFundingChart(data);
    renderAwardsChart(data);
    renderAlumni(data.alumni);
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showError(`数据加载失败: ${error.message}`);
    console.error('完整错误信息:', error.stack);
  }
}

// 学科分布图表
function renderDisciplineChart(data) {
  const ctx = document.getElementById('disciplineChart').getContext('2d');
  if (!ctx) {
    console.error('找不到学科分布图表容器');
    return;
  }
  
  try {
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['A类学科', 'B类学科', '其他学科'],
        datasets: [{
          data: [data.disciplines.a, data.disciplines.b, data.disciplines.others],
          backgroundColor: [
            '#9e1f14',
            '#1e3a8a',
            '#d4af37'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
    console.log('学科分布图表渲染成功');
  } catch (error) {
    console.error('学科分布图表渲染失败:', error);
    showError('学科分布图表渲染失败');
  }
}

// 科研经费图表
function renderFundingChart(data) {
  const ctx = document.getElementById('fundingChart').getContext('2d');
  if (!ctx) {
    console.error('找不到科研经费图表容器');
    return;
  }
  
  try {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.researchFunding.years,
        datasets: [{
          label: '科研经费（亿元）',
          data: data.researchFunding.amounts,
          borderColor: '#9e1f14',
          backgroundColor: 'rgba(158, 31, 20, 0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
    console.log('科研经费图表渲染成功');
  } catch (error) {
    console.error('科研经费图表渲染失败:', error);
    showError('科研经费图表渲染失败');
  }
}

// 奖项分布图表
function renderAwardsChart(data) {
  const ctx = document.getElementById('awardsChart').getContext('2d');
  if (!ctx) {
    console.error('找不到奖项分布图表容器');
    return;
  }
  
  try {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.awards.categories,
        datasets: [{
          label: '获奖数量',
          data: data.awards.counts,
          backgroundColor: [
            '#9e1f14',
            '#1e3a8a',
            '#d4af37'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    console.log('奖项分布图表渲染成功');
  } catch (error) {
    console.error('奖项分布图表渲染失败:', error);
    showError('奖项分布图表渲染失败');
  }
}

// 校友信息展示
function renderAlumni(alumniData) {
  const container = document.getElementById('alumniContainer');
  if (!container) {
    console.error('找不到校友信息容器');
    return;
  }
  
  try {
    container.innerHTML = '';

    alumniData.forEach(alumni => {
      const alumniCard = document.createElement('div');
      alumniCard.className = 'col-lg-6';
      
      // 创建成就标签HTML
      const achievementsHtml = alumni.achievements.map(achievement => 
        `<span class="achievement-tag">${achievement}</span>`
      ).join('');
      
      // 设置默认图片，以防图片不存在
      const imgSrc = alumni.image || './assets/images/default-alumni.jpg';
      
      alumniCard.innerHTML = `
        <div class="alumni-card">
          <img src="${imgSrc}" alt="${alumni.name}" class="alumni-image" onerror="this.src='./assets/images/default-alumni.jpg'">
          <div class="alumni-info">
            <h4 class="alumni-name">${alumni.name}</h4>
            <div class="alumni-title">${alumni.title}</div>
            <div class="alumni-description">${alumni.description}</div>
            <div class="alumni-achievements">
              ${achievementsHtml}
            </div>
            <div class="alumni-contribution">${alumni.contribution || ''}</div>
          </div>
        </div>
      `;
      
      container.appendChild(alumniCard);
    });
    console.log('校友信息渲染成功');
  } catch (error) {
    console.error('校友信息渲染失败:', error);
    showError('校友信息渲染失败');
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('页面加载完成，开始初始化图表');
  initCharts();
}); 