// 图表实例存储
const charts = {};

// 原始CSV文本存储
let originalCSVText = '';

// 颜色配置默认值
let currentColorConfig = 'o3';

// 定义O3和PM2.5的默认颜色配置
const colorConfigs = {
    o3: {
        min: 0,
        max: 300,
        pieces: [
            { gte: 0, lte: 100, label: '0-100', color: '#CFEC71' },
            { gte: 101, lte: 130, label: '101-130', color: '#F0EA7F' },
            { gte: 131, lte: 160, label: '131-160', color: '#F1C454' },
            { gte: 161, lte: 190, label: '161-190', color: '#F0723D' },
            { gte: 191, lte: 200, label: '191-200', color: '#E02B24' },
            { gte: 201, lte: 500, label: '200以上', color: '#9F1627' }
        ]
    },
    pm25: {
        min: 0,
        max: 200,
        pieces: [
            { gte: 0, lte: 5, label: '0-5', color: '#9EEE68' },
            { gte: 6, lte: 10, label: '6-10', color: '#CAEA73' },
            { gte: 11, lte: 15, label: '11-15', color: '#DFEC78' },
            { gte: 16, lte: 35, label: '16-35', color: '#ECDA76' },
            { gte: 36, lte: 50, label: '36-50', color: '#F0BB53' },
            { gte: 51, lte: 80, label: '51-80', color: '#EF733A' },
            { gte: 81, lte: 200, label: '80以上', color: '#D42028' }
        ]
    }
};

// 年份标签
let yearLabels = [];

// 月份标签
let monthLabels = [];

// 初始化图表
function initCharts() {
    const chartDom = document.getElementById('chart-jjj');
    if (chartDom) {
        charts['jjj'] = echarts.init(chartDom);
    }
}

// 解析CSV数据
function parseCSVData(csvText) {
    const lines = csvText.trim().split('\n');
    const data = [];
    const yAxisLabels = [];
    const xAxisLabels = [];
    
    // 解析表头（第一行）作为x轴标签
    if (lines.length > 0) {
        const headerLine = lines[0].trim();
        const headerParts = headerLine.split(',');
        for (let i = 1; i < headerParts.length; i++) { // 跳过第一列（y轴标签）
            xAxisLabels.push(headerParts[i].trim());
        }
    }
    
    // 解析数据行
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 2) { // 至少需要1列标签 + 1列数据
            // 第一列为y轴文字
            const yAxisLabel = parts[0].trim();
            yAxisLabels.push(yAxisLabel);
            
            // 解析第二列及以后的数据
            for (let j = 1; j < parts.length; j++) {
                const valueStr = parts[j].trim();
                if (valueStr) {
                    const value = parseFloat(valueStr);
                    if (!isNaN(value)) {
                        // 数据格式：[x轴索引, y轴索引, value]
                        data.push([j - 1, i - 1, value]);
                    }
                }
            }
        }
    }
    
    // 更新全局变量
    yearLabels = yAxisLabels;
    monthLabels = xAxisLabels;
    
    return data;
}

// 创建图表配置
function createChartOption(data) {
    const config = colorConfigs[currentColorConfig];
    
    return {
        // 设置图表背景色为白色
        backgroundColor: '#fff',
        // 添加水印
        graphic: [
            {
                type: 'image',
                id: 'logo',
                left: 20,
                bottom: 55,
                style: {
                    image: 'img/logo.png',
                    width: 80,
                    opacity: 0.6
                }
            }
        ],
        // 添加工具箱，包含下载图片功能
        toolbox: {
            feature: {
                saveAsImage: {
                    show: true,
                    title: '下载图片',
                    pixelRatio: 2
                }
            },
            right: 0,
            bottom: 0
        },
        title: {
            text: '(单位：μg/m³)',
            right: 20,
            top: 0,
            textStyle: {
                fontSize: 16,
                color: '#666'
            }
        },
        tooltip: {
            position: 'top',
            formatter: function(params) {
                return `${yearLabels[params.value[1]]} ${monthLabels[params.value[0]]}<br/>浓度: ${params.value[2]} μg/m³`;
            },
            textStyle: {
                fontSize: 16
            }
        },
        grid: {
            left: 20,
            right: 20,
            bottom: 50,
            top: 30,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: monthLabels,
            axisLabel: {
                fontSize: 16
            },
            splitArea: {
                show: true
            }
        },
        yAxis: {
            type: 'category',
            data: yearLabels,
            axisLabel: {
                fontSize: 16
            },
            splitArea: {
                show: true
            }
        },
        visualMap: {
            type: 'piecewise',  // 使用分段型视觉映射
            min: config.min,
            max: config.max,
            left: 'center',
            bottom: 0,
            // 使用 pieces 精确控制每个区间，确保边界明确
            pieces: config.pieces,
            textStyle: {
                color: '#666',
                fontSize: 16
            },
            orient: 'horizontal',
            itemWidth: 25,
            itemHeight: 14,
            textGap: 10,
            splitNumber: 0,  // 设置为0不自动分段
            calculable: false  // 分段型不需要计算滑块
        },
        series: [
            {
                name: '浓度',
                type: 'heatmap',
                data: data,
                label: {
                        show: true,
                        formatter: function(params) {
                            // 直接返回值，不包含HTML标签
                            return params.value[2];
                        },
                        color: '#333',
                        fontSize: 18,
                        fontWeight: 'bold',
                        // 添加半透明白色描边
                        textBorderColor: 'rgba(255,255,255,.75)',
                        textBorderWidth: 2
                    },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };
}

// 加载并渲染图表数据
function loadChartData() {
    const fileUrl = 'data/jjj.csv';
    fetch(fileUrl)
        .then(response => response.text())
        .then(csvText => {
            const data = parseCSVData(csvText);
            const option = createChartOption(data);
            if (charts['jjj']) {
                charts['jjj'].setOption(option);
            }
            // 保存原始CSV文本用于下载
            originalCSVText = csvText;
        })
        .catch(error => {
            console.error(`加载 ${fileUrl} 失败:`, error);
        });
}

// 响应式调整
function handleResize() {
    Object.values(charts).forEach(chart => {
        chart.resize();
    });
}

// 下载CSV文件
function downloadCSV() {
    if (!originalCSVText) {
        alert('没有可下载的数据');
        return;
    }
    
    const blob = new Blob([originalCSVText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'o3-pieces-data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 更新图例颜色设置
function updateVisualMap() {
    try {
        let min, max, pieces;
        
        // 根据选择的颜色配置类型更新图表
        if (currentColorConfig === 'custom') {
            // 动态读取所有分段的输入值
            pieces = [];
            const pieceContainers = document.querySelectorAll('#rangePiecesContainer .visual-map-piece');
            
            pieceContainers.forEach((container, index) => {
                const minInput = container.querySelector(`input[id^="range${index+1}Min"]`);
                const maxInput = container.querySelector(`input[id^="range${index+1}Max"]`);
                const colorInput = container.querySelector(`input[id^="color${index+1}"]`);
                
                if (minInput && maxInput && colorInput) {
                    const gte = parseInt(minInput.value);
                    const lte = parseInt(maxInput.value);
                    const color = colorInput.value;
                    const label = index === pieceContainers.length - 1 ? `${gte}以上` : `${gte}-${lte}`;
                    
                    pieces.push({
                        gte: gte,
                        lte: lte,
                        label: label,
                        color: color
                    });
                }
            });
            
            // 计算新的最小值和最大值
            const allMins = pieces.map(piece => piece.gte);
            const allMaxs = pieces.map(piece => piece.lte);
            min = Math.min(...allMins);
            max = Math.max(...allMaxs);
        } else {
            // 使用预设的颜色配置
            const config = colorConfigs[currentColorConfig];
            min = config.min;
            max = config.max;
            pieces = config.pieces;
        }
        
        // 更新图表的visualMap配置
        Object.values(charts).forEach(chart => {
            chart.setOption({
                visualMap: {
                    min: min,
                    max: max,
                    pieces: pieces
                }
            });
        });
        
        console.log('图例颜色设置已更新:', { config: currentColorConfig, min, max, pieces });
    } catch (error) {
        console.error('更新图例颜色设置失败:', error);
        alert('更新图例颜色设置失败: ' + error.message);
    }
}

// 删除分段
function deletePiece(button) {
    const pieceContainers = document.querySelectorAll('#rangePiecesContainer .visual-map-piece');
    
    // 确保至少保留一个分段
    if (pieceContainers.length <= 1) {
        alert('至少需要保留一个分段');
        return;
    }
    
    // 删除当前分段
    const pieceContainer = button.closest('.visual-map-piece');
    if (pieceContainer) {
        pieceContainer.remove();
        
        // 重新编号所有分段
        reindexPieces();
    }
}

// 添加分段
function addPiece() {
    const container = document.getElementById('rangePiecesContainer');
    const pieceContainers = document.querySelectorAll('#rangePiecesContainer .visual-map-piece');
    const newIndex = pieceContainers.length + 1;
    
    // 获取最后一个分段的值，作为新分段的默认值
    let lastMin = 0;
    let lastMax = 100;
    let lastColor = '#CFEC71';
    
    if (pieceContainers.length > 0) {
        const lastContainer = pieceContainers[pieceContainers.length - 1];
        const lastMaxInput = lastContainer.querySelector('input[id$="Max"]');
        const lastColorInput = lastContainer.querySelector('input[id^="color"]');
        
        if (lastMaxInput) {
            lastMin = parseInt(lastMaxInput.value) + 1;
            lastMax = lastMin + 50;
        }
        if (lastColorInput) {
            lastColor = lastColorInput.value;
        }
    }
    
    // 创建新分段
    const newPiece = document.createElement('div');
    newPiece.className = 'visual-map-piece';
    newPiece.dataset.pieceIndex = newIndex;
    newPiece.innerHTML = `
        <label>范围${newIndex}: </label>
        <input type="number" id="range${newIndex}Min" value="${lastMin}" min="0" max="500" placeholder="最小值">-
        <input type="number" id="range${newIndex}Max" value="${lastMax}" min="0" max="500" placeholder="最大值">
        <input type="color" id="color${newIndex}" value="${lastColor}" class="color-picker">
        <button type="button" class="btn btn-small delete-piece-btn">删除</button>
    `;
    
    // 添加到容器
    container.appendChild(newPiece);
    
    // 添加删除按钮事件监听器
    const deleteBtn = newPiece.querySelector('.delete-piece-btn');
    deleteBtn.addEventListener('click', function() {
        deletePiece(this);
    });
}

// 重新编号所有分段
function reindexPieces() {
    const pieceContainers = document.querySelectorAll('#rangePiecesContainer .visual-map-piece');
    
    pieceContainers.forEach((container, index) => {
        const newIndex = index + 1;
        container.dataset.pieceIndex = newIndex;
        
        // 更新标签
        const label = container.querySelector('label');
        if (label) {
            label.textContent = `范围${newIndex}: `;
        }
        
        // 更新输入框ID
        const minInput = container.querySelector('input[id$="Min"]');
        const maxInput = container.querySelector('input[id$="Max"]');
        const colorInput = container.querySelector('input[id^="color"]');
        
        if (minInput) minInput.id = `range${newIndex}Min`;
        if (maxInput) maxInput.id = `range${newIndex}Max`;
        if (colorInput) colorInput.id = `color${newIndex}`;
    });
}

// 根据默认配置更新自定义表单
function updateCustomFormFromConfig(configType) {
    const config = colorConfigs[configType];
    if (!config) return;
    
    // 清空现有分段
    const container = document.getElementById('rangePiecesContainer');
    container.innerHTML = '';
    
    // 根据配置创建新分段
    const pieces = config.pieces;
    pieces.forEach((piece, index) => {
        const newIndex = index + 1;
        const newPiece = document.createElement('div');
        newPiece.className = 'visual-map-piece';
        newPiece.dataset.pieceIndex = newIndex;
        newPiece.innerHTML = `
            <label>范围${newIndex}: </label>
            <input type="number" id="range${newIndex}Min" value="${piece.gte}" min="0" max="500" placeholder="最小值">-
            <input type="number" id="range${newIndex}Max" value="${piece.lte}" min="0" max="500" placeholder="最大值">
            <input type="color" id="color${newIndex}" value="${piece.color}" class="color-picker">
            <button type="button" class="btn btn-small delete-piece-btn">删除</button>
        `;
        
        container.appendChild(newPiece);
        
        // 添加删除按钮事件监听器
        const deleteBtn = newPiece.querySelector('.delete-piece-btn');
        deleteBtn.addEventListener('click', function() {
            deletePiece(this);
        });
    });
}

// 初始化页面
function init() {
    initCharts();
    loadChartData();
    window.addEventListener('resize', handleResize);
    
    // 绑定下载按钮事件
    const downloadBtn = document.getElementById('downloadCSVBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadCSV);
    }
    
    // 绑定文件上传事件
    const csvFileInput = document.getElementById('csvFile');
    if (csvFileInput) {
        csvFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // 更新文件名显示
                const fileNameSpan = document.getElementById('fileName');
                if (fileNameSpan) {
                    fileNameSpan.textContent = file.name;
                }
                
                // 读取文件内容
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const csvText = e.target.result;
                        // 解析CSV数据
                        const data = parseCSVData(csvText);
                        // 创建图表配置
                        const option = createChartOption(data);
                        // 更新图表
                        if (charts['jjj']) {
                            charts['jjj'].setOption(option);
                        }
                        // 保存原始CSV文本用于下载
                        originalCSVText = csvText;
                    } catch (error) {
                        console.error('处理CSV文件失败:', error);
                        alert('处理CSV文件失败: ' + error.message);
                    }
                };
                reader.onerror = function() {
                    console.error('文件读取失败');
                    alert('读取文件失败');
                };
                reader.readAsText(file, 'utf-8');
            }
        });
    }
    
    // 绑定图例颜色设置事件
    const applyVisualMapBtn = document.getElementById('applyVisualMapBtn');
    if (applyVisualMapBtn) {
        applyVisualMapBtn.addEventListener('click', updateVisualMap);
    }
    
    // 绑定展开收起设置区域事件
    const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
    const advancedSettings = document.getElementById('advancedSettings');
    if (toggleSettingsBtn && advancedSettings) {
        toggleSettingsBtn.addEventListener('click', function() {
            if (advancedSettings.style.display === 'none' || advancedSettings.style.display === '') {
                // 如果当前是隐藏状态，则显示它
                advancedSettings.style.display = 'block';
                toggleSettingsBtn.textContent = '收起设置';
            } else {
                // 如果当前是显示状态，则隐藏它
                advancedSettings.style.display = 'none';
                toggleSettingsBtn.textContent = '展开设置';
            }
        });
    }
    
    // 绑定颜色配置下拉菜单事件
    const colorConfigSelect = document.getElementById('colorConfig');
    const customColorConfig = document.getElementById('customColorConfig');
    if (colorConfigSelect && customColorConfig) {
        // 初始化时隐藏自定义配置区域
        customColorConfig.style.display = 'none';
        
        colorConfigSelect.addEventListener('change', function() {
            currentColorConfig = this.value;
            
            // 根据选择的配置类型显示/隐藏自定义配置区域
            if (currentColorConfig === 'custom') {
                customColorConfig.style.display = 'block';
            } else {
                customColorConfig.style.display = 'none';
            }
            
            // 自动应用选择的颜色配置
            updateVisualMap();
        });
    }
    
    // 绑定自定义配置的基础配置选择事件
    const baseConfigSelect = document.getElementById('baseConfig');
    if (baseConfigSelect) {
        baseConfigSelect.addEventListener('change', function() {
            const configType = this.value;
            updateCustomFormFromConfig(configType);
        });
    }
    
    // 绑定删除分段按钮事件
    const deleteButtons = document.querySelectorAll('.delete-piece-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            deletePiece(this);
        });
    });
    
    // 绑定添加分段按钮事件
    const addPieceBtn = document.getElementById('addPieceBtn');
    if (addPieceBtn) {
        addPieceBtn.addEventListener('click', addPiece);
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);