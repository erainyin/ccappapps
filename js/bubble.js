// 初始化图表
const chartDom = document.getElementById('o3-chart');
const myChart = echarts.init(chartDom);

// 区域标签 - 动态生成
let regionLabels = [];

// 月份标签 - 会根据CSV文件动态生成
let monthLabels = [];

// 年份标签
const yearLabels = ['2025年'];

// 从CSV文件读取数据
let concentrationData = [];
let yAxisData = [];
let originalCSVText = '';
let originalValues = [];

// 颜色配置默认值
let currentColorConfig = 'o3';

// 定义O3和PM2.5的默认颜色配置
const colorConfigs = {
    o3: {
        min: 0,
        max: 220,
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

// 生成y轴标签
const generateYAxisData = () => {
    const data = [];
    regionLabels.forEach(region => {
        yearLabels.forEach(year => {
            data.push(`${region} ${year}`);
        });
    });
    return data;
};

// 解析CSV数据 - 修复：包含25年均数据
const parseCSVData = (csvText) => {
    try {
        const lines = csvText.trim().split('\n');
        const data = [];
        originalValues = []; // 重置原始值数组
        regionLabels = []; // 重置区域标签数组
        let valueIndex = 0;
        
        console.log('CSV文件行数:', lines.length);
        console.log('CSV文件内容:', csvText);
        
        // 解析表头，动态调整月份标签
        if (lines.length > 0) {
            const headerLine = lines[0].trim();
            const headerParts = headerLine.split(',');
            console.log('表头数据:', headerParts);
            
            // 根据表头重新生成月份标签，跳过第一列（区域）
            monthLabels = [];
            for (let i = 1; i < headerParts.length; i++) {
                const header = headerParts[i].trim();
                monthLabels.push(header);
            }
            console.log('动态生成的月份标签:', monthLabels);
        }
        
        // 跳过表头，处理数据行
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split(',');
            console.log('第', i, '行数据:', parts);
            console.log('第', i, '行数据长度:', parts.length);
            
            // 检查数据列数，至少需要包含区域名称和至少1列数据
            if (parts.length >= 2) {
                // 从CSV文件中读取区域名称
                const regionName = parts[0].trim();
                regionLabels.push(regionName);
                
                // 区域索引（从0开始）
                const region = i - 1;
                
                const year = 0; // 2025年对应索引0
                
                // 处理所有数据列（从第2列开始，索引为1）
                for (let col = 1; col < parts.length; col++) {
                    const valueStr = parts[col].trim();
                    if (valueStr) {
                        const value = parseFloat(valueStr);
                        if (!isNaN(value)) {
                            data.push([
                                col - 1, // x轴：列索引（从0开始，对应月份标签数组）
                                region, // y轴：区域索引
                                value, // 值
                                region, // 区域索引
                                year, // 年份索引
                                valueIndex // 原始值索引
                            ]);
                            originalValues.push(valueStr);
                            valueIndex++;
                        }
                    }
                }
            } else {
                console.warn('第', i, '行数据列数不足，跳过:', parts);
            }
        }
        
        console.log('解析出的区域标签:', regionLabels);
        console.log('解析出的数据条数:', data.length);
        
        // 反转区域标签顺序，与原始实现保持一致
        regionLabels.reverse();
        
        // 调整数据中的区域索引，以匹配反转后的区域标签
        for (let i = 0; i < data.length; i++) {
            const originalRegion = data[i][1];
            data[i][1] = regionLabels.length - 1 - originalRegion; // 反转索引
            data[i][3] = regionLabels.length - 1 - originalRegion; // 反转索引
        }
        
        return data;
    } catch (error) {
        console.error('解析CSV数据失败:', error);
        throw error;
    }
};

// 计算最小值和最大值（包含25年均数据）
const calculateMinMax = (data) => {
    let min = Infinity;
    let max = -Infinity;
    
    data.forEach(item => {
        const value = item[2];
        if (value < min) min = value;
        if (value > max) max = value;
    });
    
    return { min, max };
};

// 渲染图表
const renderChart = (csvText) => {
    try {
        console.log('开始渲染图表');
        // 解析CSV数据，动态生成区域标签
        concentrationData = parseCSVData(csvText);
        console.log('解析后的数据:', concentrationData.length, '条');
        
        // 检查是否有数据
        if (concentrationData.length === 0) {
            console.warn('解析出的数据为空');
            chartDom.innerHTML = '<div style="text-align:center;padding-top:50px;color:#666">CSV文件中没有有效数据</div>';
            return;
        }
        
        // 重新生成y轴标签，使用动态生成的区域标签
        yAxisData = generateYAxisData();
        console.log('生成的y轴标签:', yAxisData);
        
        // 检查是否有区域标签
        if (regionLabels.length === 0) {
            console.warn('解析出的区域标签为空');
            chartDom.innerHTML = '<div style="text-align:center;padding-top:50px;color:#666">CSV文件中没有区域数据</div>';
            return;
        }
        
        // 计算包含25年均数据的最小值和最大值
        const { min: dataMin, max: dataMax } = calculateMinMax(concentrationData);
        console.log('数据范围:', dataMin, '~', dataMax);
        
        // 渲染图表
        const option = {
            backgroundColor: '#fff',
            tooltip: {
                position: 'top',
                formatter: function(params) {
                    const region = regionLabels[params.data[3]];
                    const year = yearLabels[params.data[4]];
                    const monthIndex = params.data[0];
                    const month = monthLabels[monthIndex];
                    const valueIndex = params.data[5];
                    let value;
                    
                    // 使用原始值显示，保持CSV中的格式
                    if (valueIndex !== undefined && originalValues[valueIndex] !== undefined) {
                        value = originalValues[valueIndex];
                    } else {
                        value = params.data[2];
                    }
                    
                    return `<span style="color: #000; font-weight: bold;">${region} ${year} ${month}<br/>浓度: ${value} μg/m³</span>`;
                },
                textStyle: {
                    color: '#000',
                    fontWeight: 'bold'
                }
            },
            grid: {
                left: 20,
                right: 20,
                bottom: 60,
                top: 20,
                containLabel: true
            },

            
            xAxis: {
                type: 'category',
                data: monthLabels,
                position: 'top', // 调整到顶部
                axisLine: {
                    show: true, // 显示轴线
                    lineStyle: {
                        width: 1,
                        color: '#ddd'
                    }
                },
                axisTick: {
                    show: false // 去掉刻度
                },
                axisLabel: {
                    fontSize: 16,
                    color: '#000',
                    fontWeight: 'normal',
                    interval: 0 // 显示所有标签，不旋转
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        width: 1,
                        color: '#ddd'
                    }
                },
                splitArea: {
                    show: true,
                    areaStyle: {
                        color: ['rgba(255, 255, 255, 0.8)', 'rgba(240, 240, 240, 0.8)'] // 交叉颜色
                    }
                }
            },
            yAxis: {
                type: 'category',
                data: yAxisData,
                axisLine: {
                    show: false // 去掉轴线
                },
                axisTick: {
                    show: false // 去掉刻度
                },
                axisLabel: {
                    fontSize: 16,
                    color: '#000',
                    fontWeight: 'normal',
                    interval: 0,
                    rotate: 0,
                    formatter: function(value) {
                        // 只显示区域名称，不显示年份
                        const region = value.split(' ')[0];
                        // 为京津冀及周边地区添加换行
                        if (region === '京津冀及周边地区') {
                            return '京津冀及\n周边地区';
                        }
                        return region;
                    }
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        width: 1,
                        color: '#ddd'
                    }
                },
                splitArea: {
                    show: true,
                    areaStyle: {
                        color: ['rgba(255, 255, 255, 0.8)', 'rgba(240, 240, 240, 0.8)'] // 交叉颜色
                    }
                }
            },
            visualMap: {
                type: 'piecewise',
                min: 0,
                max: 220,
                left: 'center',
                bottom: '0%',
                dimension: 2,
                pieces: [
                    { gte: 0, lte: 100, label: '0-100', color: '#CFEC71' },
                    { gte: 101, lte: 130, label: '101-130', color: '#F0EA7F' },
                    { gte: 131, lte: 160, label: '131-160', color: '#F1C454' },
                    { gte: 161, lte: 190, label: '161-190', color: '#F0723D' },
                    { gte: 191, lte: 200, label: '191-200', color: '#E02B24' },
                    { gte: 201, lte: 500, label: '200以上', color: '#9F1627' }
                ],
                textStyle: {
                    color: '#000',
                    fontSize: 16,
                    fontWeight: 'bold'
                },
                orient: 'horizontal',
                itemWidth: 25,
                itemHeight: 14,
                textGap: 10
            },
            series: [
                {
                    name: '浓度',
                    type: 'scatter',
                    data: concentrationData,
                    symbolSize: function(data) {
                        // 将值映射到20-60px的范围内
                        const minSize = 20;
                        const maxSize = 60;
                        
                        // 线性映射，使用实际计算出的最小值和最大值
                        let size;
                        if (dataMax === dataMin) {
                            // 如果所有值都相同，返回默认大小
                            size = (minSize + maxSize) / 2;
                        } else {
                            size = minSize + (data[2] - dataMin) * (maxSize - minSize) / (dataMax - dataMin);
                        }
                        return size;
                    },
                    label: {
                        show: true,
                        formatter: function(params) {
                            const valueIndex = params.data[5];
                            // 使用原始值显示，保持CSV中的格式
                            if (valueIndex !== undefined && originalValues[valueIndex] !== undefined) {
                                return originalValues[valueIndex];
                            }
                            return params.data[2];
                        },
                        color: '#000',
                        fontSize: 18,
                        fontWeight: 'bold',
                        textBorderColor: 'rgba(255,255,255,1)',
                        textBorderWidth: 2
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ],
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
            }
        };
        
        // 渲染图表
        console.log('设置图表选项');
        myChart.setOption(option, true); // 添加true参数，强制重绘图表
        console.log('图表渲染完成');
        
        // 保存原始CSV文本用于下载
        originalCSVText = csvText;
        
        // 显示成功信息
        chartDom.style.display = 'block';
        const infoDiv = document.querySelector('.chart-info');
        if (infoDiv) {
            infoDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('渲染图表失败:', error);
        // 如果渲染失败，显示错误信息
        chartDom.innerHTML = '<div style="text-align:center;padding-top:50px;color:#666">数据格式错误，请检查CSV文件格式</div>';
    }
};

// 加载CSV文件
const loadCSVFile = (url) => {
    fetch(url)
        .then(response => response.text())
        .then(csvText => {
            renderChart(csvText);
        })
        .catch(error => {
            console.error('加载CSV文件失败:', error);
            // 如果加载失败，显示错误信息
            chartDom.innerHTML = '<div style="text-align:center;padding-top:50px;color:#666">加载数据失败，请检查CSV文件路径</div>';
        });
};

// 下载CSV文件
const downloadCSV = () => {
    if (!originalCSVText) {
        alert('没有可下载的数据');
        return;
    }
    
    const blob = new Blob([originalCSVText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'bubble-data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// 更新图例颜色设置
const updateVisualMap = () => {
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
        myChart.setOption({
            visualMap: {
                min: min,
                max: max,
                pieces: pieces
            }
        });
        
        console.log('图例颜色设置已更新:', { config: currentColorConfig, min, max, pieces });
    } catch (error) {
        console.error('更新图例颜色设置失败:', error);
        alert('更新图例颜色设置失败: ' + error.message);
    }
};

// 删除分段
const deletePiece = (button) => {
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
};

// 添加分段
const addPiece = () => {
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
};

// 重新编号所有分段
const reindexPieces = () => {
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
};

// 根据默认配置更新自定义表单
const updateCustomFormFromConfig = (configType) => {
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
};

// 初始化页面
window.onload = function() {
    // 加载默认CSV文件
    loadCSVFile('data/25bubble.csv');
    
    // 绑定下载按钮事件
    const downloadBtn = document.getElementById('downloadCSVBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadCSV);
    }
    
    // 绑定文件上传事件
    const csvFileInput = document.getElementById('csvFile');
    if (csvFileInput) {
        csvFileInput.addEventListener('change', function(e) {
            console.log('文件上传事件触发');
            const file = e.target.files[0];
            if (file) {
                console.log('选择的文件:', file.name, file.size, file.type);
                // 更新文件名显示
                const fileNameSpan = document.getElementById('fileName');
                if (fileNameSpan) {
                    fileNameSpan.textContent = file.name;
                }
                
                // 读取文件内容
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        console.log('文件读取完成');
                        const csvText = e.target.result;
                        console.log('CSV文件内容:', csvText);
                        renderChart(csvText);
                    } catch (error) {
                        console.error('处理CSV文件失败:', error);
                        alert('处理CSV文件失败: ' + error.message);
                    }
                };
                reader.onerror = function() {
                    console.error('文件读取失败');
                    alert('读取文件失败');
                };
                console.log('开始读取文件');
                reader.readAsText(file, 'utf-8');
            } else {
                console.log('未选择文件');
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
};

// 响应式调整
window.addEventListener('resize', () => {
    myChart.resize();
});