// 初始化图表
const chartDom = document.getElementById('o3-chart');
const myChart = echarts.init(chartDom);

// 区域标签 - 反转顺序
const regionLabels = ['珠三角地区', '成渝地区', '长三角地区', '汾渭平原', '京津冀及周边地区', '全国'];

// 月份标签 - 将"25年均"放在第一列
const monthLabels = ['25年均', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 年份标签
const yearLabels = ['2025年'];

// 从CSV文件读取数据
let o3Data = [];
let yAxisData = [];

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
    const lines = csvText.trim().split('\n');
    const data = [];
    
    // 跳过表头
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 14) {
            // 重新映射区域索引，与反转后的区域标签顺序对应
            let region;
            switch (i - 1) {
                case 0: region = 5; break; // 全国 -> 索引5
                case 1: region = 4; break; // 京津冀 -> 索引4
                case 2: region = 3; break; // 新汾渭平原 -> 索引3
                case 3: region = 2; break; // 新长三角地区 -> 索引2
                case 4: region = 1; break; // 成渝地区 -> 索引1
                case 5: region = 0; break; // 珠三角 -> 索引0
                default: region = i - 1;
            }
            
            const year = 0; // 2025年对应索引0
            
            // 添加25年均数据 - 放在第一列
            const annualValueStr = parts[1].trim();
            if (annualValueStr) {
                const annualValue = parseFloat(annualValueStr);
                data.push([
                    0, // x轴：第0个位置，对应"25年均"
                    region, // y轴：区域索引
                    annualValue, // 值
                    region, // 区域索引
                    year // 年份索引
                ]);
            }
            
            // 解析每个月的数据（从第3列开始，索引为2，对应1月）
            for (let month = 0; month < 12; month++) {
                const valueStr = parts[month + 2].trim();
                if (valueStr) {
                    const value = parseFloat(valueStr);
                    data.push([
                        month + 1, // x轴：月份（从1开始）
                        region, // y轴：区域索引
                        value, // 值
                        region, // 区域索引
                        year // 年份索引
                    ]);
                }
            }
        }
    }
    
    return data;
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

// 加载CSV文件
fetch('data/25bubble.csv')
    .then(response => response.text())
    .then(csvText => {
        o3Data = parseCSVData(csvText);
        yAxisData = generateYAxisData();
        
        // 计算包含25年均数据的最小值和最大值
        const { min: dataMin, max: dataMax } = calculateMinMax(o3Data);
        
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
                    const value = params.data[2];
                    return `<span style="color: #000; font-weight: bold;">${region} ${year} ${month}<br/>O₃浓度: ${value} μg/m³</span>`;
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
                top:20,
                containLabel: true
            },
            graphic: [
                {
                    type: 'image',
                    id: 'logo',
                    left: 20,
                    bottom: 60,
                    style: {
                        image: 'img/logo.png',
                        width: 100,
                        opacity: 0.6
                    }
                }
            ],
            
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
                    name: 'O₃浓度',
                    type: 'scatter',
                    data: o3Data,
                    symbolSize: function(data) {
                        // 将值映射到20-60px的范围内
                        const minSize = 20;
                        const maxSize = 60;
                        
                        // 线性映射，使用实际计算出的最小值和最大值
                        const size = minSize + (data[2] - dataMin) * (maxSize - minSize) / (dataMax - dataMin);
                        return size;
                    },
                    label: {
                        show: true,
                        formatter: function(params) {
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
        myChart.setOption(option);
    })
    .catch(error => {
        console.error('加载CSV文件失败:', error);
        // 如果加载失败，显示错误信息
        chartDom.innerHTML = '<div style="text-align:center;padding-top:50px;color:#666">加载数据失败，请检查CSV文件路径</div>';
    });

// 响应式调整
window.addEventListener('resize', () => {
    myChart.resize();
});