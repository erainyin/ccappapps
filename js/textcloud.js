// 全局变量
let customSvgPath = null;
let myChart = null;
let wordCloudData = [];

// 从CSV文件读取数据
function loadCSVData() {
    fetch('data/keyword-dq.csv')
        .then(response => response.text())
        .then(csvText => {
            const lines = csvText.trim().split('\n');
            // 跳过表头
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const name = parts[0].trim();
                    const value = parseInt(parts[1].trim()) || 1;
                    wordCloudData.push({ name, value });
                }
            }
            // 渲染关键词表格
            renderKeywordTable();
            // 初始化词云
            initWordCloud();
        })
        .catch(error => {
            console.error('加载CSV文件失败:', error);
            // 如果加载失败，使用默认数据
            wordCloudData = [
                { name: '改善空气质量', value: 32 },
                { name: '碳中和', value: 28 },
                { name: '2030', value: 27 },
                { name: '碳达峰', value: 16 },
                { name: '让城市更宜居', value: 21 }
            ];
            renderKeywordTable();
            initWordCloud();
        });
}

// 解析SVG文件，提取路径数据
function parseSvgFile(file, callback) {
    if (!file) return callback(null);
    if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
        alert('请上传有效的SVG文件！');
        return callback(null);
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // 创建临时DOM解析SVG
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(e.target.result, 'image/svg+xml');
            const pathElements = svgDoc.querySelectorAll('path');
            const svgElement = svgDoc.querySelector('svg');

            // 预览SVG
            const previewContainer = document.getElementById('svgPreview');
            previewContainer.innerHTML = '';
            const previewSvg = document.createElement('div');
            previewSvg.innerHTML = e.target.result;
            previewSvg.style.width = '100%';
            previewSvg.style.height = '100%';
            previewContainer.appendChild(previewSvg);

            // 提取第一个path的d属性（简化处理，取主路径）
            if (pathElements.length > 0) {
                customSvgPath = pathElements[0].getAttribute('d');
                callback(customSvgPath);
            } else {
                alert('SVG文件中未找到路径数据，请使用包含<path>标签的SVG！');
                callback(null);
            }
        } catch (err) {
            console.error('解析SVG失败：', err);
            alert('SVG解析失败，请检查文件格式！');
            callback(null);
        }
    };
    reader.readAsText(file);
}

// 初始化词云配置
function initWordCloud(colorOption = 'random', colorParams = {}, shapeOption = 'circle') {
    // 确保myChart已初始化
    if (!myChart) {
        myChart = echarts.init(document.getElementById('wordcloud'), null, {
            renderer: 'svg' // 核心：切换为SVG渲染模式
        });
    }
    
    // 定义颜色生成函数
    let colorFunc;
    
    // 工具函数：解析十六进制颜色为RGB
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        return [
            parseInt(hex.substring(0, 2), 16),
            parseInt(hex.substring(2, 4), 16),
            parseInt(hex.substring(4, 6), 16)
        ];
    }

    // 工具函数：给RGB颜色添加亮度偏移
    function adjustBrightness(rgb, offset) {
        return [
            Math.max(0, Math.min(255, rgb[0] + offset)),
            Math.max(0, Math.min(255, rgb[1] + offset)),
            Math.max(0, Math.min(255, rgb[2] + offset))
        ];
    }

    // 颜色逻辑，根据选择的配色方案生成颜色
    switch (colorOption) {
        case 'random':
            colorFunc = function() {
                return 'rgb(' + [
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160)
                ].join(',') + ')';
            };
            break;
        case 'blue':
            colorFunc = function() {
                const blue = 150 + Math.round(Math.random() * 105);
                return `rgb(${Math.round(Math.random() * 80)}, ${Math.round(Math.random() * 100)}, ${blue})`;
            };
            break;
        case 'green':
            colorFunc = function() {
                const green = 150 + Math.round(Math.random() * 105);
                return `rgb(${Math.round(Math.random() * 80)}, ${green}, ${Math.round(Math.random() * 80)})`;
            };
            break;
        case 'orange':
            colorFunc = function() {
                const orange = 180 + Math.round(Math.random() * 75);
                return `rgb(${orange}, ${Math.round(Math.random() * 100)}, ${Math.round(Math.random() * 50)})`;
            };
            break;
        case 'purple':
            colorFunc = function() {
                const purple = 150 + Math.round(Math.random() * 105);
                return `rgb(${Math.round(Math.random() * 100)}, ${Math.round(Math.random() * 80)}, ${purple})`;
            };
            break;
        case 'custom-single':
            colorFunc = function() {
                const rgb = hexToRgb(colorParams.singleColor);
                const offset = Math.round(Math.random() * 50) - 25;
                const adjustedRgb = adjustBrightness(rgb, offset);
                return `rgb(${adjustedRgb[0]}, ${adjustedRgb[1]}, ${adjustedRgb[2]})`;
            };
            break;
        case 'custom-multi':
            colorFunc = function() {
                const colorList = [
                    colorParams.color1,
                    colorParams.color2,
                    colorParams.color3,
                    colorParams.color4,
                    colorParams.color5
                ];
                const randomColor = colorList[Math.floor(Math.random() * colorList.length)];
                const rgb = hexToRgb(randomColor);
                const offset = Math.round(Math.random() * 30) - 15;
                const adjustedRgb = adjustBrightness(rgb, offset);
                return `rgb(${adjustedRgb[0]}, ${adjustedRgb[1]}, ${adjustedRgb[2]})`;
            };
            break;
        default:
            // 默认使用随机颜色
            colorFunc = function() {
                return 'rgb(' + [
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160)
                ].join(',') + ')';
            };
            break;
    }

    // 简化的词云配置，避免复杂设置导致NaN
    var option = {
        series: [
            {
                type: 'wordCloud',
                gridSize: 10,
                sizeRange: [12, 60],
                // 设置旋转角度为0度或90度
                rotationRange: [0, 90],
                // 只允许0度或90度旋转
                rotationStep: 90,
                // 使用具体数值而非百分比
                width: 1000,
                height: 600,
                drawOutOfBound: false,
                textStyle: {
                    fontFamily: "Microsoft Yahei",
                    fontWeight: 'bold',
                    color: colorFunc
                },
                // 使用传入的形状方案
                shape: shapeOption,
                // 确保数据正确格式化
                data: wordCloudData.map(item => ({
                    name: String(item.name),
                    value: Number(item.value)
                }))
            }
        ]
    };

    // 设置配置项并渲染
    myChart.setOption(option);
}

// 下载SVG文件函数
function downloadWordCloudAsSvg() {
    try {
        // 确保myChart已初始化
        if (!myChart) {
            alert('词云未初始化，请先应用配置生成词云！');
            return;
        }
        
        // 获取ECharts生成的SVG元素
        const svgElement = myChart.getDom().querySelector('svg');
        if (!svgElement) {
            alert('未找到SVG图表，请先应用配置生成词云！');
            return;
        }

        // 克隆SVG元素（避免修改原图表）
        const cloneSvg = svgElement.cloneNode(true);
        
        // 设置SVG的宽高属性（确保导出后尺寸正确）
        const container = document.getElementById('wordcloud');
        const width = container.clientWidth;
        const height = container.clientHeight;
        cloneSvg.setAttribute('width', width);
        cloneSvg.setAttribute('height', height);
        cloneSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // 将SVG转换为字符串
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(cloneSvg);
        
        // 创建Blob对象并下载
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '双碳与空气质量词云.svg'; // 下载文件名
        document.body.appendChild(a);
        a.click();
        
        // 清理资源
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('SVG词云文件下载成功！');
    } catch (err) {
        console.error('下载SVG失败：', err);
        alert('下载SVG失败，请检查控制台错误信息！');
    }
}

// 渲染关键词表格
function renderKeywordTable() {
    const tableBody = document.getElementById('keywordTableBody');
    tableBody.innerHTML = '';
    
    wordCloudData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="keyword-checkbox" data-index="${index}"></td>
            <td><input type="text" class="keyword-name" data-index="${index}" value="${item.name}"></td>
            <td><input type="number" class="keyword-value" data-index="${index}" value="${item.value}" min="1"></td>
        `;
        tableBody.appendChild(row);
    });
}

// 更新词云函数
function updateWordCloud() {
    // 获取当前的配置参数
    const colorScheme = document.getElementById('colorScheme').value;
    const shapeScheme = document.getElementById('shapeScheme').value;
    const colorParams = {};

    // 收集颜色参数
    if (colorScheme === 'custom-single') {
        colorParams.singleColor = document.getElementById('customSingleColor').value;
    } else if (colorScheme === 'custom-multi') {
        colorParams.color1 = document.getElementById('customColor1').value;
        colorParams.color2 = document.getElementById('customColor2').value;
        colorParams.color3 = document.getElementById('customColor3').value;
        colorParams.color4 = document.getElementById('customColor4').value;
        colorParams.color5 = document.getElementById('customColor5').value;
    }
    // 重新初始化词云
    initWordCloud(colorScheme, colorParams, shapeScheme);
}

// 初始化函数
function init() {
    // 初始化关键词表格
    renderKeywordTable();
    
    // 加载CSV数据
    loadCSVData();
    
    // 监听配色方案选择变化
    document.getElementById('colorScheme').addEventListener('change', function() {
        const singleColorGroup = document.getElementById('customSingleColorGroup');
        const multiColorGroup = document.getElementById('customMultiColorGroup');
        
        singleColorGroup.style.display = 'none';
        multiColorGroup.style.display = 'none';

        if (this.value === 'custom-single') {
            singleColorGroup.style.display = 'flex';
        } else if (this.value === 'custom-multi') {
            multiColorGroup.style.display = 'flex';
        }
    });

    // 监听形状方案选择变化
    document.getElementById('shapeScheme').addEventListener('change', function() {
        const svgUploadGroup = document.getElementById('svgUploadGroup');
        svgUploadGroup.style.display = 'none';

        if (this.value === 'custom-svg') {
            svgUploadGroup.style.display = 'flex';
        }
    });

    // 监听SVG文件上传
    document.getElementById('svgFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            parseSvgFile(file, function(path) {
                customSvgPath = path;
            });
        }
    });

    // 监听应用配置按钮点击
    document.getElementById('applyConfig').addEventListener('click', function() {
        const colorScheme = document.getElementById('colorScheme').value;
        const shapeScheme = document.getElementById('shapeScheme').value;
        const colorParams = {};

        // 收集颜色参数
        if (colorScheme === 'custom-single') {
            colorParams.singleColor = document.getElementById('customSingleColor').value;
        } else if (colorScheme === 'custom-multi') {
            colorParams.color1 = document.getElementById('customColor1').value;
            colorParams.color2 = document.getElementById('customColor2').value;
            colorParams.color3 = document.getElementById('customColor3').value;
            colorParams.color4 = document.getElementById('customColor4').value;
            colorParams.color5 = document.getElementById('customColor5').value;
        }

        // 重新渲染词云
        initWordCloud(colorScheme, colorParams, shapeScheme);
    });

    // 监听下载按钮点击
    document.getElementById('downloadSvg').addEventListener('click', downloadWordCloudAsSvg);

    // 监听CSV文件选择
    document.getElementById('csvFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const csvText = e.target.result;
                    const lines = csvText.trim().split('\n');
                    // 清空现有数据
                    wordCloudData = [];
                    // 跳过表头
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        const parts = line.split(',');
                        if (parts.length >= 2) {
                            const name = parts[0].trim();
                            const value = parseInt(parts[1].trim()) || 1;
                            wordCloudData.push({ name, value });
                        }
                    }
                    // 渲染关键词表格
                    renderKeywordTable();
                    // 更新词云
                    updateWordCloud();
                    alert('CSV文件加载成功，词云已更新！');
                } catch (error) {
                    console.error('解析CSV文件失败:', error);
                    alert('CSV文件解析失败，请检查文件格式！');
                }
            };
            reader.onerror = function() {
                alert('文件读取失败！');
            };
            reader.readAsText(file);
        }
    });

    // 自适应窗口大小
    window.addEventListener('resize', function() {
        if (myChart) {
            myChart.resize();
        }
    });

    // 添加关键词
    document.getElementById('addKeyword').addEventListener('click', function() {
        wordCloudData.push({ name: '新关键词', value: 10 });
        renderKeywordTable();
        updateWordCloud();
    });

    // 删除选中的关键词
    document.getElementById('deleteSelected').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.keyword-checkbox:checked');
        const indicesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
        
        // 按降序删除，避免索引偏移
        indicesToDelete.sort((a, b) => b - a);
        indicesToDelete.forEach(index => {
            wordCloudData.splice(index, 1);
        });
        
        renderKeywordTable();
        updateWordCloud();
    });

    // 全选/取消全选
    document.getElementById('selectAll').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.keyword-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = this.checked;
        });
    });

    // 实时更新关键词名称
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('keyword-name')) {
            const index = parseInt(e.target.dataset.index);
            wordCloudData[index].name = e.target.value;
            updateWordCloud();
        }
    });

    // 实时更新关键词数值
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('keyword-value')) {
            const index = parseInt(e.target.dataset.index);
            const value = parseInt(e.target.value) || 1;
            wordCloudData[index].value = value;
            updateWordCloud();
        }
    });

    // 刷新词云
    document.getElementById('refreshWordCloud').addEventListener('click', function() {
        updateWordCloud();
    });

    // 编辑面板折叠/展开功能
    const editPanel = document.querySelector('.edit-panel');
    const toggleBtn = document.getElementById('toggleEditPanel');
    
    toggleBtn.addEventListener('click', function() {
        const isCollapsed = editPanel.classList.toggle('collapsed');
        toggleBtn.textContent = isCollapsed ? '展开编辑面板' : '收起编辑面板';
        // 调整词云大小以适应布局变化
        setTimeout(() => {
            if (myChart) {
                myChart.resize();
            }
        }, 300); // 等待过渡动画完成后调整大小
    });
}

// 在DOM完全加载后初始化
window.addEventListener('DOMContentLoaded', init);