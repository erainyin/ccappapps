// 年份标签 - 反转顺序，使2021年显示在最上面
const yearLabels = ['2025年', '2024年', '2023年', '2022年', '2021年'];

// 月份标签 - 添加全年选项
const monthLabels = ['全年', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// CSV文件列表
const csvFiles = [
    { id: 'pm25', file: '/data/pm25-block.csv' },
    { id: 'csj', file: '/data/25-csj.csv' },
    { id: 'cy', file: '/data/25-cy.csv' },
    { id: 'fw', file: '/data/25-fw.csv' },
    { id: 'jjj', file: '/data/25-jjj.csv' }
];

// 图表实例存储
const charts = {};

// 初始化所有图表
function initCharts() {
    csvFiles.forEach(item => {
        const chartDom = document.getElementById(`chart-${item.id}`);
        charts[item.id] = echarts.init(chartDom);
    });
}

// 解析CSV数据
function parseCSVData(csvText, fileName) {
    const lines = csvText.trim().split('\n');
    const data = [];
    
    // 跳过表头（第一行）
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 12) { // 至少包含年份和12个月的数据
            // 解析年份
            const yearStr = parts[0].trim();
            const year = parseInt(yearStr);
            
            // 只处理2021-2025年的数据
            if (year >= 2021 && year <= 2025) {
                // 计算年份索引（2021年对应索引4，2025年对应索引0）
                const yearIndex = 4 - (year - 2021);
                
                // 检查是否为pm25-block.csv，如果是，则解析全年数据
                if (fileName.includes('pm25-block.csv')) {
                    // 解析全年数据（第2列，索引为1）
                    if (parts.length >= 13 && parts[1]) {
                        const annualValueStr = parts[1].trim();
                        if (annualValueStr && !isNaN(parseFloat(annualValueStr))) {
                            // 转换为数值用于颜色映射
                            const annualValue = parseFloat(annualValueStr);
                            // 数据格式：[month, yearIndex, value, displayValue]，全年对应索引0
                            // value用于颜色映射，displayValue用于显示
                            data.push([0, yearIndex, annualValue, annualValueStr]);
                        }
                    }
                    
                    // 解析每个月的数据（从第3列开始，索引为2，对应1月）
                    for (let month = 0; month < 12; month++) {
                        if (month + 2 < parts.length) {
                            const valueStr = parts[month + 2].trim();
                            if (valueStr && !isNaN(parseFloat(valueStr))) {
                                // 转换为数值用于颜色映射
                                const value = parseFloat(valueStr);
                                // 数据格式：[month, yearIndex, value, displayValue]，月份从1开始
                                // value用于颜色映射，displayValue用于显示
                                data.push([month + 1, yearIndex, value, valueStr]);
                            }
                        }
                    }
                } else {
                    // 对于其他文件，直接解析月份数据（从第2列开始，索引为1，对应1月）
                    for (let month = 0; month < 12; month++) {
                        if (month + 1 < parts.length) {
                            const valueStr = parts[month + 1].trim();
                            if (valueStr && !isNaN(parseFloat(valueStr))) {
                                // 转换为数值用于颜色映射
                                const value = parseFloat(valueStr);
                                // 数据格式：[month, yearIndex, value, displayValue]，月份从1开始
                                // value用于颜色映射，displayValue用于显示
                                data.push([month + 1, yearIndex, value, valueStr]);
                            }
                        }
                    }
                }
            }
        }
    }
    
    return data;
}

// 创建图表配置
function createChartOption(data, fileName) {
    // 检查数据中是否包含全年数据（month=0）
    const hasAnnualData = data.some(item => item[0] === 0);
    
    // 根据是否包含全年数据确定xAxis数据和标签
    const xAxisData = hasAnnualData ? monthLabels : monthLabels.slice(1);
    
    // 调整数据，对于没有全年数据的图表，确保月份索引与xAxisData的索引对应
    const adjustedData = hasAnnualData ? data : data.map(item => {
        // 对于没有全年数据的图表，月份索引减1，使其与xAxisData的索引对应（0对应'1月'，1对应'2月'，依此类推）
        return [item[0] - 1, item[1], item[2], item[3]];
    });
    
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
                // 使用displayValue（索引为3）来显示原始格式
                // 根据是否有全年数据调整月份标签索引
                const monthIndex = hasAnnualData ? params.value[0] : params.value[0] + 1;
                return `${yearLabels[params.value[1]]} ${monthLabels[monthIndex]}<br/>PM2.5浓度: ${params.value[3]} μg/m³`;
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
            data: xAxisData,
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
            min: 0,
            max: 81,
            left: 'center',
            bottom: 0,
            // 使用 pieces 精确控制每个区间，确保边界明确
            pieces: [
                { gte: 0, lte: 5, label: '0-5', color: '#9EEE68' },
                { gte: 6, lte: 10, label: '6-10', color: '#CAEA73' },
                { gte: 11, lte: 15, label: '11-15', color: '#DFEC78' },
                { gte: 16, lte: 35, label: '16-35', color: '#ECDA76' },
                { gte: 36, lte: 50, label: '36-50', color: '#F0BB53' },
                { gte: 51, lte: 80, label: '51-80', color: '#EF733A' },
                { gte: 81, lte: 200, label: '80以上', color: '#D42028' }
            ],
            textStyle: {
                color: '#666',
                fontSize: 16
            },
            orient: 'horizontal',
            itemWidth: 25,
            itemHeight: 14,
            textGap: 10,
            splitNumber: 0,  // 设置为0不自动分段
            calculable: false,  // 分段型不需要计算滑块
            // 指定使用数据的第3个维度（索引为2）进行映射
            dimension: 2
        },
        series: [
            {
                name: 'PM2.5浓度',
                type: 'heatmap',
                data: adjustedData,
                label: {
                        show: true,
                        formatter: function(params) {
                            // 使用displayValue（索引为3）来显示原始格式
                            return params.value[3];
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
    csvFiles.forEach(item => {
        fetch(item.file)
            .then(response => response.text())
            .then(csvText => {
                const data = parseCSVData(csvText, item.file);
                const option = createChartOption(data, item.file);
                charts[item.id].setOption(option);
            })
            .catch(error => {
                console.error(`加载 ${item.file} 失败:`, error);
            });
    });
}

// 响应式调整
function handleResize() {
    Object.values(charts).forEach(chart => {
        chart.resize();
    });
}

// 初始化
function init() {
    initCharts();
    loadChartData();
    window.addEventListener('resize', handleResize);
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);