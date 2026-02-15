// 年份标签 - 反转顺序，使2021年显示在最上面
const yearLabels = ['2025年', '2024年', '2023年', '2022年', '2021年'];

// 月份标签
const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// CSV文件列表
const csvFiles = [
    { id: 'csj', file: '/data/csj.csv' },
    { id: 'cy', file: '/data/cy.csv' },
    { id: 'fw', file: '/data/fw.csv' },
    { id: 'jjj', file: '/data/jjj.csv' },
    { id: 'zsj', file: '/data/zsj.csv' }
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
function parseCSVData(csvText) {
    const lines = csvText.trim().split('\n');
    const data = [];
    
    // 跳过表头（第一行）
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 13) { // 1列年份 + 12列月份数据
            // 解析年份（去掉"年"字）
        const yearStr = parts[0].replace('年', '');
        const year = parseInt(yearStr);
        
        // 只处理2021-2025年的数据
        if (year >= 2021 && year <= 2025) {
            // 计算年份索引（2021年对应索引4，2025年对应索引0）
            const yearIndex = 4 - (year - 2021);
            
            // 解析每个月的数据
            for (let month = 0; month < 12; month++) {
                const valueStr = parts[month + 1];
                if (valueStr) {
                    const value = parseFloat(valueStr);
                    // 数据格式：[month, yearIndex, value]
                    data.push([month, yearIndex, value]);
                }
            }
        }
        }
    }
    
    return data;
}

// 创建图表配置
function createChartOption(data) {
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
                return `${yearLabels[params.value[1]]} ${monthLabels[params.value[0]]}<br/>O₃浓度: ${params.value[2]} μg/m³`;
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
            min: 0,
            max: 300,
            left: 'center',
            bottom: 0,
            // 使用 pieces 精确控制每个区间，确保边界明确
            pieces: [
                { gte: 0, lte: 100, label: '0-100', color: '#CFEC71' },
                { gte: 101, lte: 130, label: '101-130', color: '#F0EA7F' },
                { gte: 131, lte: 160, label: '131-160', color: '#F1C454' },
                { gte: 161, lte: 190, label: '161-190', color: '#F0723D' },
                { gte: 191, lte: 200, label: '191-200', color: '#E02B24' },
                { gte: 201, lte: 500, label: '200以上', color: '#9F1627' }
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
            calculable: false  // 分段型不需要计算滑块
        },
        series: [
            {
                name: 'O₃浓度',
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
    csvFiles.forEach(item => {
        fetch(item.file)
            .then(response => response.text())
            .then(csvText => {
                const data = parseCSVData(csvText);
                const option = createChartOption(data);
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