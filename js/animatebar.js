let chart;
let animationInterval = null;
let currentIndex = 0;
let chartData = { labels: [], values: [], headers: [] };
let isAnimating = false;
let currentChartType = 'bar'; // 默认图表类型为柱状图

// GIF设置变量
let gifSettings = {
    recordInterval: 600,   // 录制间隔(ms)
    frameDelay: 500,       // 普通帧延迟(ms)
    lastFrameDelay: 3360,  // 最后一帧延迟(ms)
    bgColor: '#ffffff'     // 背景颜色
};

// 全局颜色数组
let customColors = [
    '#188df0',
    '#009688',
    '#ff9800',
    '#ff4d4f',
    '#673ab7'
];

// 确保DOM和ECharts库加载完成后初始化
window.addEventListener('load', function() {
    console.log('DOM加载完成，开始初始化图表');
    if (typeof echarts !== 'undefined') {
        console.log('ECharts库已加载');
        // 初始化ECharts实例
        const chartElement = document.getElementById('chart');
        console.log('图表元素:', chartElement);
        console.log('图表元素尺寸:', { width: chartElement.offsetWidth, height: chartElement.offsetHeight });
        
        // 检查父容器尺寸
        const animatebarContainer = document.querySelector('.animatebar-container');
        console.log('animatebar-container元素:', animatebarContainer);
        console.log('animatebar-container尺寸:', { width: animatebarContainer.offsetWidth, height: animatebarContainer.offsetHeight });
        
        // 设置默认图表尺寸
        const defaultWidth = 1200;
        const defaultHeight = 400;
        
        // 强制设置图表元素的样式，确保尺寸不会被其他因素影响
        chartElement.style.width = defaultWidth + 'px';
        chartElement.style.height = defaultHeight + 'px';
        chartElement.style.flex = 'none';
        chartElement.style.display = 'block';
        chartElement.style.margin = '20px auto';
        
        console.log('设置默认图表尺寸:', { width: defaultWidth, height: defaultHeight });
        console.log('设置后图表元素样式:', {
            width: chartElement.style.width,
            height: chartElement.style.height,
            flex: chartElement.style.flex,
            display: chartElement.style.display,
            margin: chartElement.style.margin
        });
        
        // 强制重排
        chartElement.offsetHeight;
        
        console.log('重排后图表元素offset尺寸:', {
            width: chartElement.offsetWidth,
            height: chartElement.offsetHeight
        });
        
        // 初始化图表实例
        chart = echarts.init(chartElement);
        console.log('ECharts实例初始化成功:', chart);
        
        // 初始化后再次检查图表尺寸
        setTimeout(() => {
            console.log('初始化后图表元素尺寸:', { width: chartElement.offsetWidth, height: chartElement.offsetHeight });
            
            // 检查canvas元素的尺寸
            const canvasElement = chartElement.querySelector('canvas');
            if (canvasElement) {
                console.log('Canvas元素样式:', {
                    width: canvasElement.style.width,
                    height: canvasElement.style.height
                });
                console.log('Canvas元素属性:', {
                    width: canvasElement.width,
                    height: canvasElement.height
                });
            }
            
            // 再次强制设置图表尺寸，确保不会被覆盖
            chartElement.style.width = defaultWidth + 'px';
            chartElement.style.height = defaultHeight + 'px';
            chart.resize();
            console.log('再次设置后图表元素尺寸:', { width: chartElement.offsetWidth, height: chartElement.offsetHeight });
        }, 100);
        
        // 初始化颜色输入框
        initColorInputs();
        
        // 添加颜色配置事件监听
        document.getElementById('addColorBtn').addEventListener('click', addColorInput);
        document.getElementById('removeColorBtn').addEventListener('click', removeColorInput);
        document.getElementById('applyColorBtn').addEventListener('click', applyColorConfig);
        
        // 设置初始图表配置
        const initialOption = {
            title: {
                text: 'CSV数据柱状图',
                left: 'center',
                show: false
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                textStyle: {
                    fontSize: 16
                }
            },
            // 添加水印
            graphic: [
                {
                    type: 'image',
                    id: 'logo',
                    right: '10%',
                    top: '20%',
                    z: 100,
                    bounding: 'raw',
                    style: {
                        image: './img/logo.png',
                        width: 100,
                        opacity: 0.5
                    }
                }
            ],
            legend: {
                data: [],
                bottom: 20,
                left: 'center'
            },
            xAxis: {
                type: 'category',
                data: []
            },
            yAxis: {
                type: 'value',
                name: '数据',
                nameLocation: 'middle',
                nameGap: 50,
                nameRotate: 90
            },
            series: [{
                name: '',
                type: currentChartType === 'stackedBar' ? 'bar' : currentChartType,
                stack: currentChartType === 'stackedBar' ? 'total' : undefined,
                data: [],
                itemStyle: {
                    color: '#188df0'
                },
                label: {
                    show: true,
                    position: currentChartType === 'bar' || currentChartType === 'stackedBar' ? 'top' : 'top',
                    formatter: '{c}',
                    fontSize: 12,
                    color: '#333'
                },
                // 折线图特有配置
                lineStyle: {
                    width: 3
                },
                symbol: 'circle',
                symbolSize: 8
            }]
        };
        
        chart.setOption(initialOption);
        console.log('初始图表配置已设置');
        
        // 页面初始化时加载data.csv文件
        console.log('开始加载data.csv文件');
        loadCSVFile('./data/data.csv');
        
        // 添加播放和暂停按钮事件监听
        document.getElementById('playBtn').addEventListener('click', playAnimation);
        document.getElementById('pauseBtn').addEventListener('click', pauseAnimation);
        
        // 添加图表类型切换事件监听
        const chartTypeSelect = document.getElementById('chartType');
        chartTypeSelect.addEventListener('change', function() {
            currentChartType = this.value;
            // 如果已有数据，重新渲染图表
            if (chartData.values.length > 0) {
                resetAnimation();
                renderChart({ headers: chartData.headers, data: chartData.values });
            }
        });
        
        // 添加标题设置事件监听
        const applyTitleBtn = document.getElementById('applyTitleBtn');
        applyTitleBtn.addEventListener('click', updateChartTitle);
        
        // 添加字号设置事件监听
        const applyFontBtn = document.getElementById('applyFontBtn');
        applyFontBtn.addEventListener('click', updateFontSize);
        
        // 添加重新播放按钮事件监听
        const replayBtn = document.getElementById('replayBtn');
        replayBtn.addEventListener('click', function() {
            // 重置动画状态，从第一个数据开始
            resetAnimation();
            // 开始播放动画
            playAnimation();
        });
        
        // 添加水印设置事件监听
        const applyWatermarkBtn = document.getElementById('applyWatermarkBtn');
        applyWatermarkBtn.addEventListener('click', updateWatermark);
        
        // 添加GIF设置事件监听
        const applyGifBtn = document.getElementById('applyGifBtn');
        applyGifBtn.addEventListener('click', updateGifSettings);
        
        // 添加柱子宽度设置事件监听
        const applyBarWidthBtn = document.getElementById('applyBarWidthBtn');
        applyBarWidthBtn.addEventListener('click', updateBarWidth);
        
        // 添加图例设置事件监听
        const applyLegendBtn = document.getElementById('applyLegendBtn');
        applyLegendBtn.addEventListener('click', updateLegend);
        
        // 添加图表尺寸设置事件监听
        const applySizeBtn = document.getElementById('applySizeBtn');
        applySizeBtn.addEventListener('click', updateChartSize);
        
        // 初始设置标题输入框值
        document.getElementById('chartTitle').value = 'CSV数据图表';
        
        // 添加展开收起设置区域的事件监听
        const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
        const advancedSettings = document.getElementById('advancedSettings');
        
        toggleSettingsBtn.addEventListener('click', function() {
            // 切换设置区域的显示/隐藏
            advancedSettings.classList.toggle('collapsed');
            
            // 更新按钮文本
            if (advancedSettings.classList.contains('collapsed')) {
                toggleSettingsBtn.textContent = '展开设置';
            } else {
                toggleSettingsBtn.textContent = '收起设置';
            }
            
            // 延迟一段时间，等待CSS过渡完成后调整图表大小
            setTimeout(() => {
                if (chart) {
                    chart.resize();
                }
            }, 350);
        });
    } else {
        console.error('ECharts库加载失败，请检查网络连接或CDN链接');
        document.getElementById('chart').innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ff4d4f; font-size: 18px;">ECharts库加载失败，请刷新页面重试</div>';
    }
});

// 加载CSV文件函数
function loadCSVFile(filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                console.log('未找到data.csv文件或文件加载失败，您可以通过按钮选择CSV文件');
                return null;
            }
            return response.text();
        })
        .then(csvText => {
            if (csvText) {
                const parsedData = parseCSV(csvText);
                renderChart(parsedData);
                // 更新显示的文件名
                document.getElementById('fileName').textContent = '当前文件：data.csv';
            }
        })
        .catch(error => {
            console.log('未找到data.csv文件或文件加载失败，您可以通过按钮选择CSV文件');
        });
}

// 文件选择事件处理
document.getElementById('csvFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 更新显示的文件名
    document.getElementById('fileName').textContent = '当前文件：' + file.name;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const csvData = event.target.result;
        const parsedData = parseCSV(csvData);
        renderChart(parsedData);
    };
    reader.readAsText(file);
});

// CSV解析函数
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 1) return { headers: [], data: [] };
    
    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];
    
    // 从第二行开始解析数据
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim());
        if (values.length > 0) {
            const row = {};
            headers.forEach((header, index) => {
                // 如果数据列数少于标题列数，使用空字符串填充
                const value = index < values.length ? values[index] : '';
                // 保留原始字符串格式，不转换为数字
                row[header] = value;
            });
            data.push(row);
        }
    }
    
    return { headers, data };
}

// 渲染图表函数
function renderChart(parsedData) {
    if (typeof echarts === 'undefined' || !chart) {
        alert('ECharts库未加载成功，请刷新页面重试');
        return;
    }
    
    // 检查渲染前的图表尺寸
    const chartElement = document.getElementById('chart');
    console.log('渲染前图表元素尺寸:', {
        width: chartElement.offsetWidth,
        height: chartElement.offsetHeight
    });
    
    const { headers, data } = parsedData;
    if (headers.length < 1) {
        alert('CSV文件至少需要包含一列数据');
        return;
    }
    
    // 如果没有数据行，创建一个空数据行，避免图表显示异常
    const displayData = data.length > 0 ? data : [{ [headers[0]]: '无数据' }];
    
    // 第一列为标签
    const labels = displayData.map(row => row[headers[0]]);
    
    // 保存图表数据
    chartData = { labels, values: displayData, headers };
    
    // 使用自定义颜色数组，为每个系列分配不同颜色
    const colors = customColors;
    
    // 获取当前设置的字号和X轴文字角度
    const xAxisFontSize = parseInt(document.getElementById('xAxisFontSize').value);
    const yAxisFontSize = parseInt(document.getElementById('yAxisFontSize').value);
    const valueFontSize = parseInt(document.getElementById('valueFontSize').value);
    const xAxisRotate = parseInt(document.getElementById('xAxisRotate').value);
    
    // 获取当前设置的柱子宽度
    const barWidth = document.getElementById('barWidth').value;
    const widthValue = barWidth === 'auto' ? 'auto' : parseInt(barWidth);
    
    // 生成初始数据，所有值为0
    const series = [];
    
    // 确定数据列范围：
    // - 如果只有一列，该列作为数据列，使用其列名
    // - 如果有多列，第一列为标签，其余列为数据列，使用其列名
    const startColumn = headers.length > 1 ? 1 : 0;
    const dataColumns = headers.length - startColumn;
    
    for (let i = startColumn; i < headers.length; i++) {
        const initialValues = new Array(displayData.length).fill(0);
        
        // 堆积柱状图配置
        if (currentChartType === 'stackedBar') {
            // 计算每个柱子的初始总和（所有值为0，所以总和也为0）
            const initialTotals = new Array(displayData.length).fill(0);
            
            series.push({
                name: headers[i], // 使用CSV文件中的列名作为系列名称
                type: 'bar',
                stack: 'total',
                data: initialValues,
                itemStyle: {
                    color: colors[(i - startColumn) % colors.length]
                },
                emphasis: {
                    itemStyle: {
                        color: colors[(i - startColumn) % colors.length]
                    }
                },
                label: {
                    show: i === headers.length - 1, // 只在最后一个系列显示标签
                    position: 'top',
                    formatter: (params) => {
                        // 计算当前柱子的总和
                        let total = 0;
                        for (let j = startColumn; j < headers.length; j++) {
                            total += displayData[params.dataIndex][headers[j]] || 0;
                        }
                        return total;
                    },
                    fontSize: valueFontSize,
                    color: '#333'
                },
                // 折线图特有配置
                lineStyle: {
                    width: 3
                },
                symbol: 'circle',
                symbolSize: 8,
                // 添加柱子宽度设置
                barWidth: widthValue
            });
        } else {
            // 普通柱状图和折线图配置
            const seriesConfig = {
                name: headers[i], // 使用CSV文件中的列名作为系列名称
                type: currentChartType,
                data: initialValues,
                itemStyle: {
                    color: colors[(i - startColumn) % colors.length]
                },
                emphasis: {
                    itemStyle: {
                        color: colors[(i - startColumn) % colors.length]
                    }
                },
                label: {
                    show: true,
                    position: currentChartType === 'bar' ? 'top' : 'top',
                    formatter: '{c}',
                    fontSize: valueFontSize,
                    color: '#333'
                },
                // 折线图特有配置
                lineStyle: {
                    width: 3
                },
                symbol: 'circle',
                symbolSize: 8
            };
            
            // 只有柱状图需要设置柱子宽度
            if (currentChartType === 'bar') {
                seriesConfig.barWidth = widthValue;
            }
            
            series.push(seriesConfig);
        }
    }
    
    // 使用CSV第一行第一列的值作为y轴名称
    const yAxisName = headers[0];
    
    // 获取图例显示设置
    const showLegend = document.getElementById('showLegend').checked;
    
    const option = {
        title: {
            text: 'CSV数据图表',
            left: 'center',
            show: false
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: currentChartType === 'bar' || currentChartType === 'stackedBar' ? 'shadow' : 'line'
            },
            textStyle: {
                fontSize: 16
            }
        },
        // 添加水印
        graphic: [
            {
                type: 'image',
                id: 'logo',
                right: '10%',
                top: '20%',
                z: 100,
                bounding: 'raw',
                style: {
                    image: './img/logo.png',
                    width: 100,
                    opacity: 0.5
                }
            }
        ],
        legend: {
            data: headers.slice(startColumn), // 使用数据列的列名作为图例
            bottom: 20,
            left: 'center',
            show: showLegend
        },
        xAxis: {
            type: 'category',
            data: labels,
            axisLabel: {
                rotate: xAxisRotate,
                fontSize: xAxisFontSize
            }
        },
        yAxis: {
            type: 'value',
            name: yAxisName,
            nameLocation: 'middle',
            nameGap: 50,
            nameRotate: 90,
            axisLabel: {
                fontSize: yAxisFontSize
            },
            nameTextStyle: {
                fontSize: yAxisFontSize
            }
        },
        series: series
    };
    
    // 使用notMerge: true确保完全替换图表配置，清除之前的数据
    chart.setOption(option, true);
    
    // 重置动画状态
    resetAnimation();
    
    // 将当前标题设置为输入框默认值
    document.getElementById('chartTitle').value = 'CSV数据图表';
    
    // 自动开始动画
    playAnimation();
    
    // 检查渲染后的图表尺寸
    console.log('渲染后图表元素尺寸:', {
        width: chartElement.offsetWidth,
        height: chartElement.offsetHeight
    });
    
    // 确保图表使用用户设置的尺寸
    const chartWidth = parseInt(document.getElementById('chartWidth').value);
    const chartHeight = parseInt(document.getElementById('chartHeight').value);
    chartElement.style.width = chartWidth + 'px';
    chartElement.style.height = chartHeight + 'px';
    chart.resize();
    console.log('确保后图表元素尺寸:', {
        width: chartElement.offsetWidth,
        height: chartElement.offsetHeight
    });
}

// 更新图表标题函数
function updateChartTitle() {
    if (typeof echarts === 'undefined' || !chart) return;
    
    const titleText = document.getElementById('chartTitle').value || 'CSV数据图表';
    const showTitle = document.getElementById('showTitle').checked;
    
    chart.setOption({
        title: {
            show: showTitle,
            text: titleText,
            left: 'center'
        }
    });
}

// 更新图表字号函数
function updateFontSize() {
    if (typeof echarts === 'undefined' || !chart) return;
    
    const xAxisFontSize = parseInt(document.getElementById('xAxisFontSize').value);
    const yAxisFontSize = parseInt(document.getElementById('yAxisFontSize').value);
    const valueFontSize = parseInt(document.getElementById('valueFontSize').value);
    const xAxisRotate = parseInt(document.getElementById('xAxisRotate').value);
    
    // 更新坐标轴字号和X轴文字角度
    chart.setOption({
        xAxis: {
            axisLabel: {
                fontSize: xAxisFontSize,
                rotate: xAxisRotate
            }
        },
        yAxis: {
            axisLabel: {
                fontSize: yAxisFontSize
            },
            nameTextStyle: {
                fontSize: yAxisFontSize
            }
        },
        // 更新数据值字号
        series: chart.getOption().series.map(seriesItem => ({
            label: {
                fontSize: valueFontSize
            }
        }))
    });
}

// 更新水印函数
function updateWatermark() {
    if (typeof echarts === 'undefined' || !chart) return;
    
    const watermarkWidth = parseInt(document.getElementById('watermarkWidth').value);
    const showWatermark = document.getElementById('showWatermark').checked;
    
    // 更新水印宽度和可见性
    chart.setOption({
        graphic: [
            {
                id: 'logo',
                style: {
                    width: watermarkWidth
                },
                invisible: !showWatermark
            }
        ]
    });
}

// 更新GIF设置函数
function updateGifSettings() {
    // 更新GIF设置变量
    gifSettings = {
        recordInterval: parseInt(document.getElementById('recordInterval').value),
        frameDelay: parseInt(document.getElementById('frameDelay').value),
        lastFrameDelay: parseInt(document.getElementById('lastFrameDelay').value),
        bgColor: document.getElementById('bgColor').value
    };
    
    console.log('GIF设置已更新:', gifSettings);
}

// 更新柱子宽度函数
function updateBarWidth() {
    if (typeof echarts === 'undefined' || !chart) return;
    
    const barWidth = document.getElementById('barWidth').value;
    const widthValue = barWidth === 'auto' ? 'auto' : parseInt(barWidth);
    
    // 获取当前图表类型
    const chartType = document.getElementById('chartType').value;
    
    // 只有柱状图和堆积柱状图需要设置柱子宽度
    if (chartType === 'bar' || chartType === 'stackedBar') {
        // 更新图表系列的柱子宽度
        chart.setOption({
            series: chart.getOption().series.map(seriesItem => ({
                barWidth: widthValue
            }))
        });
    }
}

// 更新图例显示设置函数
function updateLegend() {
    if (typeof echarts === 'undefined' || !chart) return;
    
    const showLegend = document.getElementById('showLegend').checked;
    
    // 更新图例显示状态
    chart.setOption({
        legend: {
            show: showLegend
        }
    });
}

// 更新图表尺寸函数
function updateChartSize() {
    if (typeof echarts === 'undefined' || !chart) {
        console.error('ECharts库未加载或图表实例未初始化');
        return;
    }
    
    const chartWidth = parseInt(document.getElementById('chartWidth').value);
    const chartHeight = parseInt(document.getElementById('chartHeight').value);
    
    console.log('开始更新图表尺寸:', { width: chartWidth, height: chartHeight });
    
    // 更新图表元素的尺寸
    const chartElement = document.getElementById('chart');
    if (!chartElement) {
        console.error('图表元素未找到');
        return;
    }
    
    console.log('更新前图表元素样式:', {
        width: chartElement.style.width,
        height: chartElement.style.height
    });
    
    // 移除flex属性，确保尺寸设置生效
    chartElement.style.flex = 'none';
    // 直接设置样式属性
    chartElement.style.width = chartWidth + 'px';
    chartElement.style.height = chartHeight + 'px';
    chartElement.style.display = 'block';
    
    console.log('更新后图表元素样式:', {
        width: chartElement.style.width,
        height: chartElement.style.height,
        flex: chartElement.style.flex,
        display: chartElement.style.display
    });
    
    // 强制重排
    chartElement.offsetHeight;
    
    console.log('更新后图表元素offset尺寸:', {
        width: chartElement.offsetWidth,
        height: chartElement.offsetHeight
    });
    
    // 销毁旧的图表实例并重新初始化
    try {
        chart.dispose();
        console.log('图表实例已销毁');
    } catch (error) {
        console.error('销毁图表实例时出错:', error);
    }
    
    try {
        chart = echarts.init(chartElement);
        console.log('图表实例已重新初始化');
    } catch (error) {
        console.error('初始化图表实例时出错:', error);
        return;
    }
    
    // 重新设置图表配置
    if (chartData.values.length > 0) {
        try {
            renderChart({ headers: chartData.headers, data: chartData.values });
            console.log('图表配置已重新应用');
        } catch (error) {
            console.error('重新应用图表配置时出错:', error);
        }
    }
    
    console.log('图表尺寸已更新:', { width: chartWidth, height: chartHeight });
}

// 播放动画函数
function playAnimation() {
    if (isAnimating || chartData.values.length === 0) return;
    
    isAnimating = true;
    
    // 清除之前的定时器
    if (animationInterval) {
        clearInterval(animationInterval);
    }
    
    // 获取当前设置的字号
    const valueFontSize = parseInt(document.getElementById('valueFontSize').value);
    
    // 设置动画间隔为500ms
    animationInterval = setInterval(() => {
        if (currentIndex < chartData.values.length) {
            // 生成当前动画帧的所有系列数据
            const animatedSeries = [];
            
            // 确定数据列范围
            const startColumn = chartData.headers.length > 1 ? 1 : 0;
            const dataColumns = chartData.headers.length - startColumn;
            
            for (let seriesIndex = startColumn; seriesIndex < chartData.headers.length; seriesIndex++) {
                const animatedData = chartData.values.map((row, dataIndex) => {
                    return dataIndex <= currentIndex ? row[chartData.headers[seriesIndex]] : 0;
                });
                
                // 堆积柱状图特殊处理：只在最后一个系列显示总和标签
                if (currentChartType === 'stackedBar') {
                    const isLastSeries = seriesIndex === chartData.headers.length - 1;
                    
                    animatedSeries.push({
                        data: animatedData,
                        stack: 'total',
                        label: {
                            show: isLastSeries,
                            position: 'top',
                            formatter: (params) => {
                                // 计算当前柱子的总和
                                let total = 0;
                                for (let j = startColumn; j < chartData.headers.length; j++) {
                                    const rowData = chartData.values[params.dataIndex];
                                    const value = rowData && rowData[chartData.headers[j]] && params.dataIndex <= currentIndex ? rowData[chartData.headers[j]] : 0;
                                    // 将值转换为数字进行计算
                                    total += parseFloat(value) || 0;
                                }
                                return total;
                            },
                            fontSize: valueFontSize,
                            color: '#333'
                        }
                    });
                } else {
                    animatedSeries.push({
                        data: animatedData,
                        stack: currentChartType === 'stackedBar' ? 'total' : undefined
                    });
                }
            }
            
            // 更新图表
            chart.setOption({
                series: animatedSeries
            });
            
            // 触发当前柱子的tooltip显示
            chart.dispatchAction({
                type: 'showTip',
                seriesIndex: 0,
                dataIndex: currentIndex
            });
            
            currentIndex++;
        } else {
            // 动画结束
            pauseAnimation();
        }
    }, 500);
}

// 暂停动画函数
function pauseAnimation() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    isAnimating = false;
}

// 重置动画函数
function resetAnimation() {
    pauseAnimation();
    currentIndex = 0;
}

// 导出PNG序列功能
document.getElementById('exportPngBtn').addEventListener('click', function() {
    if (chartData.values.length === 0) {
        alert('请先加载数据');
        return;
    }
    
    // 禁用相关按钮，防止重复操作
    this.disabled = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('exportBtn').disabled = true;
    this.textContent = '导出中...';
    
    // 获取图表容器的实际尺寸
    const chartContainer = document.getElementById('chart');
    const containerWidth = chartContainer.offsetWidth;
    const containerHeight = chartContainer.offsetHeight;
    
    // 创建JSZip实例
    const zip = new JSZip();
    const pngPromises = [];
    
    // 重置动画状态
    resetAnimation();
    
    // 获取当前设置的字号
    const xAxisFontSize = parseInt(document.getElementById('xAxisFontSize').value);
    const yAxisFontSize = parseInt(document.getElementById('yAxisFontSize').value);
    const valueFontSize = parseInt(document.getElementById('valueFontSize').value);
    
    // 重新渲染初始状态
    const initialSeries = [];
    const dataColumns = chartData.headers.length > 1 ? chartData.headers.length - 1 : 1;
    for (let i = 0; i < dataColumns; i++) {
        initialSeries.push({
            data: new Array(chartData.values.length).fill(0),
            label: {
                fontSize: valueFontSize
            }
        });
    }
    chart.setOption({
        xAxis: {
            axisLabel: {
                fontSize: xAxisFontSize
            }
        },
        yAxis: {
            axisLabel: {
                fontSize: yAxisFontSize
            },
            nameTextStyle: {
                fontSize: yAxisFontSize
            }
        },
        series: initialSeries
    });
    
    // 确保图表容器没有滚动
    document.getElementById('chart').scrollLeft = 0;
    document.getElementById('chart').scrollTop = 0;
    
    // 延迟开始录制，确保初始状态渲染完成
    setTimeout(() => {
        let frameIndex = 0;
        
        // 录制每一帧
        const recordInterval = setInterval(() => {
            if (frameIndex <= chartData.values.length) {
                // 生成当前帧的数据
                const frameSeries = [];
                const startColumn = chartData.headers.length > 1 ? 1 : 0;
                for (let seriesIndex = startColumn; seriesIndex < chartData.headers.length; seriesIndex++) {
                    const frameData = chartData.values.map((row, index) => {
                        return index <= frameIndex ? row[chartData.headers[seriesIndex]] : 0;
                    });
                    
                    // 堆积柱状图特殊处理：只在最后一个系列显示总和标签
                    if (currentChartType === 'stackedBar') {
                        const isLastSeries = seriesIndex === chartData.headers.length - 1;
                        
                        frameSeries.push({
                            data: frameData,
                            stack: 'total',
                            label: {
                                show: isLastSeries,
                                position: 'top',
                                formatter: (params) => {
                                    // 计算当前柱子的总和
                                    let total = 0;
                                    for (let j = startColumn; j < chartData.headers.length; j++) {
                                        const rowData = chartData.values[params.dataIndex];
                                        const value = rowData && rowData[chartData.headers[j]] && params.dataIndex <= frameIndex ? rowData[chartData.headers[j]] : 0;
                                        // 将值转换为数字进行计算
                                        total += parseFloat(value) || 0;
                                    }
                                    return total;
                                },
                                fontSize: valueFontSize,
                                color: '#333'
                            }
                        });
                    } else {
                        frameSeries.push({
                            data: frameData,
                            stack: currentChartType === 'stackedBar' ? 'total' : undefined
                        });
                    }
                }
                
                // 更新图表
                chart.setOption({
                    series: frameSeries
                });
                
                // 触发tooltip
                if (frameIndex < chartData.values.length) {
                    chart.dispatchAction({
                        type: 'showTip',
                        seriesIndex: 0,
                        dataIndex: frameIndex
                    });
                }
                
                // 延迟捕获，确保图表更新完成
                const currentFrameIndex = frameIndex;
                setTimeout(() => {
                    // 使用html2canvas捕获图表
                    const capturePromise = html2canvas(document.getElementById('chart'), {
                        scale: 2, // 提高分辨率
                        useCORS: true,
                        allowTaint: false,
                        logging: false,
                        backgroundColor: gifSettings.bgColor,
                        width: containerWidth,
                        height: containerHeight,
                        x: 0,
                        y: 0
                    }).then(canvas => {
                        // 将PNG添加到ZIP
                        const filename = `frame_${currentFrameIndex.toString().padStart(4, '0')}.png`;
                        return new Promise((resolve) => {
                            canvas.toBlob((blob) => {
                                zip.file(filename, blob);
                                resolve();
                            }, 'image/png');
                        });
                    });
                    pngPromises.push(capturePromise);
                }, 100);
                
                frameIndex++;
            } else {
                // 停止录制
                clearInterval(recordInterval);
                
                // 等待所有PNG捕获完成
                Promise.all(pngPromises).then(() => {
                    // 生成ZIP文件并下载
                    zip.generateAsync({ type: 'blob' }).then((content) => {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(content);
                        link.download = 'echarts-animation-png.zip';
                        link.click();
                        URL.revokeObjectURL(link.href);
                        
                        // 恢复按钮状态
                        document.getElementById('exportPngBtn').disabled = false;
                        document.getElementById('playBtn').disabled = false;
                        document.getElementById('pauseBtn').disabled = false;
                        document.getElementById('exportBtn').disabled = false;
                        document.getElementById('exportPngBtn').textContent = '导出PNG序列';
                        
                        // 重新播放动画
                        resetAnimation();
                        playAnimation();
                    });
                });
            }
        }, gifSettings.recordInterval); // 使用GIF设置中的录制间隔
    }, 500);
});

// 导出GIF功能
document.getElementById('exportBtn').addEventListener('click', function() {
    if (chartData.values.length === 0) {
        alert('请先加载数据');
        return;
    }
    
    // 禁用相关按钮，防止重复操作
    this.disabled = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = true;
    this.textContent = '导出中...';
    
    // 获取图表容器的实际尺寸
    const chartContainer = document.getElementById('chart');
    const containerWidth = chartContainer.offsetWidth;
    const containerHeight = chartContainer.offsetHeight;
    
    // 创建GIF实例，使用容器的实际尺寸
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: containerWidth,
        height: containerHeight,
        workerScript: './js/gif.worker.js'
    });
    
    // 重置动画状态
    resetAnimation();
    
    // 获取当前设置的字号
    const xAxisFontSize = parseInt(document.getElementById('xAxisFontSize').value);
    const yAxisFontSize = parseInt(document.getElementById('yAxisFontSize').value);
    const valueFontSize = parseInt(document.getElementById('valueFontSize').value);
    
    // 重新渲染初始状态
    const initialSeries = [];
    const dataColumns = chartData.headers.length > 1 ? chartData.headers.length - 1 : 1;
    for (let i = 0; i < dataColumns; i++) {
        initialSeries.push({
            data: new Array(chartData.values.length).fill(0),
            label: {
                fontSize: valueFontSize
            }
        });
    }
    chart.setOption({
        xAxis: {
            axisLabel: {
                fontSize: xAxisFontSize
            }
        },
        yAxis: {
            axisLabel: {
                fontSize: yAxisFontSize
            },
            nameTextStyle: {
                fontSize: yAxisFontSize
            }
        },
        series: initialSeries
    });
    
    // 确保图表容器没有滚动
    document.getElementById('chart').scrollLeft = 0;
    document.getElementById('chart').scrollTop = 0;
    
    // 延迟开始录制，确保初始状态渲染完成
    setTimeout(() => {
        let frameIndex = 0;
        
        // 录制每一帧
        const recordInterval = setInterval(() => {
            if (frameIndex <= chartData.values.length) {
                // 生成当前帧的数据
                const frameSeries = [];
                const startColumn = chartData.headers.length > 1 ? 1 : 0;
                for (let seriesIndex = startColumn; seriesIndex < chartData.headers.length; seriesIndex++) {
                    const frameData = chartData.values.map((row, index) => {
                        return index <= frameIndex ? row[chartData.headers[seriesIndex]] : 0;
                    });
                    
                    // 堆积柱状图特殊处理：只在最后一个系列显示总和标签
                    if (currentChartType === 'stackedBar') {
                        const isLastSeries = seriesIndex === chartData.headers.length - 1;
                        
                        frameSeries.push({
                            data: frameData,
                            stack: 'total',
                            label: {
                                show: isLastSeries,
                                position: 'top',
                                formatter: (params) => {
                                    // 计算当前柱子的总和
                                    let total = 0;
                                    for (let j = startColumn; j < chartData.headers.length; j++) {
                                        const rowData = chartData.values[params.dataIndex];
                                        const value = rowData && rowData[chartData.headers[j]] && params.dataIndex <= frameIndex ? rowData[chartData.headers[j]] : 0;
                                        // 将值转换为数字进行计算
                                        total += parseFloat(value) || 0;
                                    }
                                    return total;
                                },
                                fontSize: valueFontSize,
                                color: '#333'
                            }
                        });
                    } else {
                        frameSeries.push({
                            data: frameData,
                            stack: currentChartType === 'stackedBar' ? 'total' : undefined
                        });
                    }
                }
                
                // 更新图表
                chart.setOption({
                    series: frameSeries
                });
                
                // 触发tooltip
                if (frameIndex < chartData.values.length) {
                    chart.dispatchAction({
                        type: 'showTip',
                        seriesIndex: 0,
                        dataIndex: frameIndex
                    });
                }
                
                // 延迟捕获，确保图表更新完成
                setTimeout(() => {
                    // 使用html2canvas捕获图表，添加配置确保捕获完整区域
                    html2canvas(document.getElementById('chart'), {
                        scale: 1,
                        useCORS: true,
                        allowTaint: false,
                        logging: false,
                        backgroundColor: gifSettings.bgColor,
                        width: containerWidth,
                        height: containerHeight,
                        x: 0,
                        y: 0
                    }).then(canvas => {
                        gif.addFrame(canvas, { delay: gifSettings.frameDelay }); // 增加延迟，降低播放速度
                    });
                }, 100);
                
                frameIndex++;
            } else {
                // 停止录制
                clearInterval(recordInterval);
                
                // 为最后一帧添加一个长时间延迟（3.36秒 = 3360毫秒）
                // 重新捕获最后一帧，设置长时间延迟
                setTimeout(() => {
                    html2canvas(document.getElementById('chart'), {
                        scale: 1,
                        useCORS: true,
                        allowTaint: false,
                        logging: false,
                        backgroundColor: gifSettings.bgColor,
                        width: containerWidth,
                        height: containerHeight,
                        x: 0,
                        y: 0
                    }).then(canvas => {
                        // 添加最后一帧，设置延迟为用户设置的值
                        gif.addFrame(canvas, { delay: gifSettings.lastFrameDelay });
                        
                        // 完成GIF生成
                        gif.render();
                    });
                }, 100);
            }
        }, gifSettings.recordInterval); // 间隔时间由用户设置，确保有足够时间捕获每一帧
        
        // GIF生成完成后下载
        gif.on('finished', function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'echarts-animation.gif';
            a.click();
            URL.revokeObjectURL(url);
            
            // 恢复按钮状态
            document.getElementById('exportBtn').disabled = false;
            document.getElementById('playBtn').disabled = false;
            document.getElementById('pauseBtn').disabled = false;
            document.getElementById('exportBtn').textContent = '导出GIF';
            
            // 重新播放动画
            resetAnimation();
            playAnimation();
        });
    }, 500);
});

// 窗口大小变化时重新调整图表大小
window.addEventListener('resize', function() {
    if (chart) {
        chart.resize();
    }
});

// 颜色配置相关函数
function initColorInputs() {
    const colorInputsContainer = document.getElementById('colorInputs');
    colorInputsContainer.innerHTML = '';
    
    customColors.forEach((color, index) => {
        const colorInputWrapper = document.createElement('div');
        colorInputWrapper.className = 'color-input-wrapper';
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'color-input';
        colorInput.value = color;
        colorInput.dataset.index = index;
        
        const colorLabel = document.createElement('span');
        colorLabel.className = 'color-label';
        colorLabel.textContent = `颜色 ${index + 1}`;
        
        colorInputWrapper.appendChild(colorLabel);
        colorInputWrapper.appendChild(colorInput);
        colorInputsContainer.appendChild(colorInputWrapper);
    });
}

function addColorInput() {
    // 默认添加一个新的蓝色
    customColors.push('#4fc3f7');
    initColorInputs();
}

function removeColorInput() {
    if (customColors.length > 1) {
        customColors.pop();
        initColorInputs();
    } else {
        alert('至少需要保留一个颜色');
    }
}

function applyColorConfig() {
    // 从输入框中收集颜色
    const colorInputs = document.querySelectorAll('#colorInputs input[type="color"]');
    customColors = Array.from(colorInputs).map(input => input.value);
    
    // 如果已有数据，重新渲染图表
    if (chartData.values.length > 0) {
        resetAnimation();
        renderChart({ headers: chartData.headers, data: chartData.values });
    }
}