// 首先定义所有需要的初始化函数
function init() {
    console.log('Basic initialization...');
    initNavigation();
    initBgAnimation();
    initAudio();
    initShareButtons();
}

// 添加导航功能初始化
function initNavigation() {
    // 确保导航按钮正确跳转 - 移除阻止默认行为的代码
    const directoryBtn = document.querySelector('.nav-btn[href*="directory.html"]');
    if (directoryBtn) {
        directoryBtn.addEventListener('click', function() {
            console.log('Directory button clicked');
            // 不再阻止默认行为，让浏览器自然处理链接跳转
        });
    }
}

// 显示标志性建筑模态框 - 保留此函数供目录页面使用
function showBuildingsModal() {
    // 检查是否已存在模态框
    let modal = document.getElementById('buildings-modal');
    
    // 如果不存在，创建一个
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'buildings-modal';
        modal.className = 'modal';
        
        // 创建模态框内容
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h2>复旦大学标志性建筑</h2>
                <div class="buildings-grid">
                    <div class="building-item">
                        <img src="assets/images/guanghua-tower.png" alt="光华楼">
                        <h3>光华楼</h3>
                        <p>复旦大学的标志性建筑，以校友企业家光华先生命名</p>
                    </div>
                    <div class="building-item">
                        <img src="assets/images/li-dasan.jpg" alt="李达三楼">
                        <h3>李达三楼</h3>
                        <p>复旦大学的现代化教学楼，以校友李达三先生命名</p>
                    </div>
                    <div class="building-item">
                        <img src="assets/images/old-library.jpg" alt="老图书馆">
                        <h3>老图书馆</h3>
                        <p>复旦大学历史悠久的图书馆，见证了学校的发展历程</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 添加关闭按钮事件
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // 点击模态框外部关闭
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // 显示模态框
    modal.style.display = 'block';
}

// 将变量声明移到最顶部，并正确初始化
let scene = null;
let camera = null;
let renderer = null;
let geometry = null;
let material = null;
let mesh = null;
const uniforms = {
    time: { value: 1.0 },
    resolution: { value: new THREE.Vector2() }
};

function initBgAnimation() {
    try {
        // 创建场景
        scene = new THREE.Scene();
        
        // 创建相机
        camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.01,
            10
        );
        camera.position.z = 1;

        // 创建着色器材质
        material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec2 resolution;
                varying vec2 vUv;

                // 噪声函数
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }

                // 烟花效果
                vec3 firework(vec2 uv, float t, vec2 pos, vec3 color) {
                    float d = length(uv - pos);
                    float sparkle = exp(-d * 50.0);
                    float expand = smoothstep(0.0, 0.5, d) * (1.0 - smoothstep(0.5, 1.0, d));
                    float flicker = random(uv + t) * 0.5 + 0.5;
                    return color * sparkle * expand * flicker;
                }

                // 祥云效果
                float cloud(vec2 uv, float t) {
                    float cloud = 0.0;
                    for(float i = 0.0; i < 5.0; i++) {
                        vec2 offset = vec2(sin(t + i) * 0.2, cos(t + i) * 0.1);
                        float scale = 1.0 + i * 0.5;
                        cloud += smoothstep(0.5, 0.8, 
                            sin(uv.x * scale + offset.x) * 
                            sin(uv.y * scale + offset.y));
                    }
                    return cloud / 5.0;
                }

                void main() {
                    vec2 uv = gl_FragCoord.xy / resolution.xy;
                    uv = uv * 2.0 - 1.0;
                    uv.x *= resolution.x / resolution.y;
                    float t = time * 0.5;

                    // 基础红色背景
                    vec3 color = vec3(0.7, 0.1, 0.1);

                    // 添加祥云
                    float cloudPattern = cloud(uv * 2.0, t);
                    vec3 cloudColor = vec3(1.0, 0.9, 0.8);
                    color = mix(color, cloudColor, cloudPattern * 0.3);

                    // 添加多个烟花
                    vec3 fw1 = firework(uv, t, 
                        vec2(sin(t * 0.5) * 0.5, cos(t * 0.7) * 0.3), 
                        vec3(1.0, 0.8, 0.0)); // 金色烟花
                    vec3 fw2 = firework(uv, t + 1.5, 
                        vec2(cos(t * 0.6) * 0.4, sin(t * 0.5) * 0.4), 
                        vec3(1.0, 0.3, 0.1)); // 红色烟花
                    vec3 fw3 = firework(uv, t + 3.0, 
                        vec2(sin(t * 0.8) * 0.3, cos(t * 0.9) * 0.5), 
                        vec3(1.0, 1.0, 0.6)); // 亮金色烟花

                    // 混合所有效果
                    color += fw1 * 0.5;
                    color += fw2 * 0.4;
                    color += fw3 * 0.3;

                    // 添加整体光晕
                    float vignette = 1.0 - length(uv) * 0.5;
                    color *= vignette;

                    // 确保颜色值在有效范围内
                    color = clamp(color, 0.0, 1.0);
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });

        // 创建平面几何体
        geometry = new THREE.PlaneGeometry(2, 2);
        
        // 创建网格
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // 创建渲染器
        const canvas = document.getElementById('webgl-bg');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // 设置尺寸
        onWindowResize();
        
        // 添加窗口调整监听
        window.addEventListener('resize', onWindowResize, false);
        
        // 开始动画循环
        animate();
    } catch (error) {
        console.error('Error initializing background animation:', error);
    }
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    uniforms.resolution.value.x = width;
    uniforms.resolution.value.y = height;
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    uniforms.time.value += 0.05;
    renderer.render(scene, camera);
}

function initShareButtons() {
    console.log('Share buttons initialized...');
    // 分享按钮功能保留
}

function initAudio() {
    const musicControl = document.querySelector('.music-control');
    const musicIcon = document.querySelector('.music-icon');
    
    if (musicControl && musicIcon) {
        musicControl.addEventListener('click', () => {
            // 简化音频控制逻辑
            musicIcon.classList.toggle('playing');
            console.log('Music control clicked');
        });
    }
}

// 然后是 DOMContentLoaded 事件监听器
document.addEventListener('DOMContentLoaded', function() {
    try {
        // 移除加载屏幕
        const loadingScreen = document.querySelector('.loading-screen');
        const container = document.querySelector('.container');
        
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                if (container) container.classList.remove('hide');
            }, 1000); // 简化加载过程
        }
        
        init();
    } catch (error) {
        console.error('Initialization error:', error);
        const loadingScreen = document.querySelector('.loading-screen');
        const container = document.querySelector('.container');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (container) container.classList.remove('hide');
    }
}); 