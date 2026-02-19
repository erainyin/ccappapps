// 存储政策数据
var policyData = [];
// 按时间分组的数据
var timeGroupedData = {};
// 时间列表
var timeList = [];
// 当前时间索引
var currentTimeIndex = 0;
// 自动时间切换定时器
var autoTimeInterval;
// 倒计时定时器
var countdownInterval;
// 当前倒计时进度（秒）
var currentCountdown = 0;
// 总倒计时时间（秒）
var totalCountdown = 0;
// 图表实例
var myChart;
// 当前时间维度（day, week, month, quarter, year）
var currentTimeDimension = 'year';

// 初始化函数
function init() {
  console.log('开始加载数据...');
  
  // 初始化图表
  var chartDom = document.getElementById('map-container');
  myChart = echarts.init(chartDom);
  
  // 加载政策数据
  fetch('data/policy_data.json')
    .then(function(response) {
      if (!response.ok) {
        throw new Error('政策数据加载失败: ' + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      policyData = data;
      console.log('政策数据加载成功:', policyData);
      
      // 按时间分组数据
      groupDataByTimeDimension();
      
      // 获取时间列表并按日期排序
      timeList = Object.keys(timeGroupedData).sort(function(a, b) {
        // 将日期字符串转换为日期对象进行比较
        var dateA = parseTimeString(a);
        var dateB = parseTimeString(b);
        return dateA - dateB;
      });
      console.log('时间列表:', timeList);
      console.log('按时间分组的数据:', timeGroupedData);
      
      // 更新时间显示
      var timeDisplayElement = document.getElementById('time-display');
      if (timeDisplayElement && timeList.length > 0) {
        timeDisplayElement.textContent = timeList[currentTimeIndex];
      }
      
      // 启动自动时间切换
      startAutoTimeSwitch();
      
      // 加载地图数据
      return fetch('data/china-prov.json');
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('地图数据加载失败: ' + response.status);
      }
      return response.json();
    })
    .then(function(mapData) {
      console.log('地图数据加载成功');
      
      // 注册地图
      echarts.registerMap('china', mapData);
      console.log('地图注册成功');
      
      // 更新地图
      updateMap();
      console.log('地图更新完成');
      
      // 绑定按钮事件
      bindButtonEvents();
      console.log('按钮事件绑定完成');
      
      console.log('图表初始化完成');
    })
    .catch(function(error) {
      console.error('加载数据失败:', error);
      // 显示错误信息
      document.getElementById('map-container').innerHTML = '<div style="padding: 20px; text-align: center; color: red;">加载数据失败: ' + error.message + '</div>';
    });
}

// 绑定按钮事件
function bindButtonEvents() {
  var prevBtn = document.getElementById('prev-btn');
  var nextBtn = document.getElementById('next-btn');
  var timeIntervalSelect = document.getElementById('time-interval-select');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      if (currentTimeIndex > 0) {
        currentTimeIndex--;
        updateMap();
        
        // 更新时间显示
        var timeDisplayElement = document.getElementById('time-display');
        if (timeDisplayElement && timeList.length > 0) {
          timeDisplayElement.textContent = timeList[currentTimeIndex];
        }
        
        // 更新按钮状态
        prevBtn.disabled = currentTimeIndex === 0;
        if (nextBtn) {
          nextBtn.disabled = currentTimeIndex === timeList.length - 1;
        }
        
        // 重置自动时间切换定时器
        resetAutoTimeSwitch();
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      if (currentTimeIndex < timeList.length - 1) {
        currentTimeIndex++;
        updateMap();
        
        // 更新时间显示
        var timeDisplayElement = document.getElementById('time-display');
        if (timeDisplayElement && timeList.length > 0) {
          timeDisplayElement.textContent = timeList[currentTimeIndex];
        }
        
        // 更新按钮状态
        if (prevBtn) {
          prevBtn.disabled = currentTimeIndex === 0;
        }
        nextBtn.disabled = currentTimeIndex === timeList.length - 1;
        
        // 重置自动时间切换定时器
        resetAutoTimeSwitch();
      }
    });
  }
  
  // 绑定时间间隔选择事件
  if (timeIntervalSelect) {
    timeIntervalSelect.addEventListener('change', function() {
      var selectedValue = parseInt(this.value);
      if (!isNaN(selectedValue)) {
        totalCountdown = selectedValue;
        if (selectedValue === 0) {
          // 不自动切换，清除定时器
          if (autoTimeInterval) {
            clearInterval(autoTimeInterval);
            autoTimeInterval = null;
          }
          if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
          }
          // 重置进度条
          currentCountdown = 0;
          updateProgressBar();
        } else {
          // 自动切换，重置定时器
          resetAutoTimeSwitch();
        }
      }
    });
  }
  
  // 绑定时间维度选择事件
  var timeDimensionSelect = document.getElementById('time-dimension-select');
  if (timeDimensionSelect) {
    timeDimensionSelect.addEventListener('change', function() {
      currentTimeDimension = this.value;
      // 重新分组数据
      groupDataByTimeDimension();
      // 更新时间列表
      timeList = Object.keys(timeGroupedData).sort(function(a, b) {
        var dateA = parseTimeString(a);
        var dateB = parseTimeString(b);
        return dateA - dateB;
      });
      // 重置时间索引
      currentTimeIndex = 0;
      // 更新地图
      updateMap();
      // 更新时间显示
      var timeDisplayElement = document.getElementById('time-display');
      if (timeDisplayElement && timeList.length > 0) {
        timeDisplayElement.textContent = timeList[currentTimeIndex];
      }
      // 更新按钮状态
      if (prevBtn && nextBtn) {
        if (currentTimeDimension === 'year') {
          // 选择全年，禁用所有按钮
          prevBtn.disabled = true;
          nextBtn.disabled = true;
          // 禁用自动切换
          var timeIntervalSelect = document.getElementById('time-interval-select');
          if (timeIntervalSelect) {
            timeIntervalSelect.value = 0;
            timeIntervalSelect.disabled = true;
            totalCountdown = 0;
            // 清除定时器
            if (autoTimeInterval) {
              clearInterval(autoTimeInterval);
              autoTimeInterval = null;
            }
            if (countdownInterval) {
              clearInterval(countdownInterval);
              countdownInterval = null;
            }
            // 重置进度条
            currentCountdown = 0;
            updateProgressBar();
          }
        } else {
          // 选择其他时间类型，启用按钮
          prevBtn.disabled = currentTimeIndex === 0;
          nextBtn.disabled = currentTimeIndex === timeList.length - 1;
          // 启用时间间隔选择器
          var timeIntervalSelect = document.getElementById('time-interval-select');
          if (timeIntervalSelect) {
            timeIntervalSelect.disabled = false;
          }
          // 重置自动时间切换定时器
          resetAutoTimeSwitch();
        }
      }
    });
  }
  
  // 初始化按钮状态
  if (prevBtn) {
    prevBtn.disabled = currentTimeIndex === 0;
  }
  if (nextBtn) {
    nextBtn.disabled = currentTimeIndex === timeList.length - 1;
  }
  
  // 初始化时间维度相关控件状态
  if (currentTimeDimension === 'year') {
    // 禁用时间间隔选择器
    var timeIntervalSelect = document.getElementById('time-interval-select');
    if (timeIntervalSelect) {
      timeIntervalSelect.value = 0;
      timeIntervalSelect.disabled = true;
    }
    // 禁用前进后退按钮
    if (prevBtn) {
      prevBtn.disabled = true;
    }
    if (nextBtn) {
      nextBtn.disabled = true;
    }
  }
}

// 启动自动时间切换
function startAutoTimeSwitch() {
  // 清除之前的定时器
  if (autoTimeInterval) {
    clearInterval(autoTimeInterval);
    autoTimeInterval = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  
  // 重置倒计时
  currentCountdown = 0;
  updateProgressBar();
  
  // 只有当totalCountdown大于0时，才启动自动切换
  if (totalCountdown > 0) {
    // 设置倒计时定时器，每0.1秒更新一次进度条
    countdownInterval = setInterval(function() {
      currentCountdown += 0.1;
      if (currentCountdown >= totalCountdown) {
        currentCountdown = 0;
      }
      updateProgressBar();
    }, 100); // 每0.1秒更新一次
    
    // 设置新的定时器，每隔指定秒数切换一次
    autoTimeInterval = setInterval(function() {
      if (timeList.length > 1) {
        currentTimeIndex = (currentTimeIndex + 1) % timeList.length;
        updateMap();
        
        // 更新时间显示
        var timeDisplayElement = document.getElementById('time-display');
        if (timeDisplayElement && timeList.length > 0) {
          timeDisplayElement.textContent = timeList[currentTimeIndex];
        }
        
        // 更新按钮状态
        var prevBtn = document.getElementById('prev-btn');
        var nextBtn = document.getElementById('next-btn');
        if (prevBtn) {
          prevBtn.disabled = currentTimeIndex === 0;
        }
        if (nextBtn) {
          nextBtn.disabled = currentTimeIndex === timeList.length - 1;
        }
        
        // 重置倒计时
        currentCountdown = 0;
      }
    }, totalCountdown * 1000);
  }
}

// 重置自动时间切换定时器
function resetAutoTimeSwitch() {
  startAutoTimeSwitch();
}

// 获取日期所在的周数
function getWeekNumber(date) {
  var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return [d.getUTCFullYear(), weekNo];
}

// 按时间维度分组数据
function groupDataByTimeDimension() {
  // 清空之前的数据
  timeGroupedData = {};
  
  policyData.forEach(function(item) {
    var timeKey;
    var date = new Date(item.time);
    
    switch (currentTimeDimension) {
      case 'day':
        // 按日分组，使用完整日期
        timeKey = item.time;
        break;
      case 'week':
        // 按周分组，使用年周
        var weekInfo = getWeekNumber(date);
        timeKey = weekInfo[0] + '-W' + weekInfo[1];
        break;
      case 'month':
        // 按月分组，使用年月
        timeKey = date.getFullYear() + '-' + (date.getMonth() + 1);
        break;
      case 'quarter':
        // 按季度分组，使用年季度
        var quarter = Math.floor(date.getMonth() / 3) + 1;
        timeKey = date.getFullYear() + '-Q' + quarter;
        break;
      case 'year':
        // 按年分组，使用年份
        timeKey = date.getFullYear();
        break;
      default:
        timeKey = item.time;
    }
    
    if (!timeGroupedData[timeKey]) {
      timeGroupedData[timeKey] = [];
    }
    timeGroupedData[timeKey].push(item);
  });
}

// 解析时间字符串为日期对象
function parseTimeString(timeStr) {
  if (timeStr.includes('-Q')) {
    // 处理季度格式：2025-Q1
    var parts = timeStr.split('-Q');
    var year = parseInt(parts[0]);
    var quarter = parseInt(parts[1]);
    var month = (quarter - 1) * 3;
    return new Date(year, month, 1);
  } else if (timeStr.includes('-W')) {
    // 处理周格式：2025-W1
    var parts = timeStr.split('-W');
    var year = parseInt(parts[0]);
    var week = parseInt(parts[1]);
    // 计算周的开始日期
    var d = new Date(Date.UTC(year, 0, 1));
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    d.setUTCDate(d.getUTCDate() + (week - 1) * 7);
    return new Date(d);
  } else if (!isNaN(parseInt(timeStr)) && timeStr.length === 4) {
    // 处理年份格式：2025
    var year = parseInt(timeStr);
    return new Date(year, 0, 1);
  } else if (timeStr.split('-').length === 2) {
    // 处理月份格式：2025-1
    var parts = timeStr.split('-');
    var year = parseInt(parts[0]);
    var month = parseInt(parts[1]) - 1;
    return new Date(year, month, 1);
  } else {
    // 处理日期格式：2025-1-20
    return new Date(timeStr);
  }
}

// 更新地图
function updateMap() {
  if (timeList.length === 0) return;
  
  var currentTime = timeList[currentTimeIndex];
  var currentData = timeGroupedData[currentTime];
  
  console.log('更新地图数据，时间:', currentTime, '数据:', currentData);
  
  // 处理政策数据，生成地图数据
  var mapSeriesData = [];
  var regionMap = {};
  
  // 按地区分组数据
  currentData.forEach(function(item) {
    var region = item.region;
    var adcode = parseInt(item.adcode);
    
    // 跳过特殊地区"流域省"，因为它不是实际的行政区划
    if (region === '流域省') {
      console.log('跳过特殊地区:', region);
      return;
    }
    
    // 为新疆地区添加正确的adcode
    if (region === '新疆维吾尔族自治区' && isNaN(adcode)) {
      adcode = 650000;
    }
    
    // 跳过没有有效adcode的地区
    if (isNaN(adcode)) {
      console.log('跳过无有效adcode的地区:', region);
      return;
    }
    
    if (!regionMap[region]) {
      regionMap[region] = {
        name: region,
        adcode: adcode,
        value: 100,
        policies: []
      };
    }
    regionMap[region].policies.push(item);
    console.log('添加政策地区:', item.region, 'adcode:', adcode);
  });
  
  // 确保所有地区都有adcode
  for (var region in regionMap) {
    if (!regionMap[region].adcode || isNaN(regionMap[region].adcode)) {
      console.error('地区缺少adcode:', region);
    }
  }
  
  // 转换为数组
  for (var region in regionMap) {
    mapSeriesData.push(regionMap[region]);
  }
  
  // 生成标题
  var titleText;
  switch (currentTimeDimension) {
    case 'day':
      // 日格式：2025-1-20 -> 2025年1月20日发布的政策
      var dateParts = currentTime.split('-');
      titleText = dateParts[0] + '年' + dateParts[1] + '月' + dateParts[2] + '日发布的政策';
      break;
    case 'week':
      // 周格式：2025-W1 -> 2025年第1周(2025-1-1至2025-1-7)发布的政策
      var weekParts = currentTime.split('-W');
      var year = parseInt(weekParts[0]);
      var week = parseInt(weekParts[1]);
      // 计算周的开始和结束日期
      var startDate = new Date(Date.UTC(year, 0, 1));
      var dayNum = startDate.getUTCDay() || 7;
      startDate.setUTCDate(startDate.getUTCDate() + 4 - dayNum);
      startDate.setUTCDate(startDate.getUTCDate() + (week - 1) * 7 - 3);
      var endDate = new Date(startDate);
      endDate.setUTCDate(startDate.getUTCDate() + 6);
      // 格式化日期
      var startYear = startDate.getUTCFullYear();
      var startMonth = startDate.getUTCMonth() + 1;
      var startDay = startDate.getUTCDate();
      var endYear = endDate.getUTCFullYear();
      var endMonth = endDate.getUTCMonth() + 1;
      var endDay = endDate.getUTCDate();
      
      // 生成日期范围字符串
      var startDateStr, endDateStr;
      if (startYear !== endYear) {
        // 年份不同，加上年份前缀
        startDateStr = (startYear % 100) + '.' + startMonth + '.' + startDay;
        endDateStr = (endYear % 100) + '.' + endMonth + '.' + endDay;
      } else {
        // 年份相同，只显示月日
        startDateStr = startMonth + '.' + startDay;
        endDateStr = endMonth + '.' + endDay;
      }
      var dateRange = '(' + startDateStr + '-' + endDateStr + ')';
      titleText = weekParts[0] + '年第' + weekParts[1] + '周' + dateRange + '发布的政策';
      break;
    case 'month':
      // 月格式：2025-1 -> 2025年1月发布的政策
      var monthParts = currentTime.split('-');
      titleText = monthParts[0] + '年' + monthParts[1] + '月发布的政策';
      break;
    case 'quarter':
      // 季度格式：2025-Q1 -> 2025年第1季度发布的政策
      var quarterParts = currentTime.split('-Q');
      titleText = quarterParts[0] + '年第' + quarterParts[1] + '季度发布的政策';
      break;
    case 'year':
      // 年份格式：2025 -> 2025年发布的政策
      titleText = currentTime + '年发布的政策';
      break;
    default:
      titleText = currentTime + ' 发布的政策';
  }
  
  // 设置图表选项
  var option = {
    title: {
      text: titleText,
      left: 'center',
      textStyle: {
        fontSize: 20,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      enterable: true,
      position: function(point, params, dom, rect, size) {
        // 显示在对应区域的上方
        // 计算区域中心点的上方位置
        var x = point[0] - 100; // 在区域中心点左侧60像素
        var y = point[1] - 100; // 在区域中心点上方60像素
        return [x, y];
      },
      formatter: function(params) {
        if (params.data && params.data.policies) {
          var policies = params.data.policies;
          var html = params.name + '<br/>';
          policies.forEach(function(policy, index) {
            html += (index + 1) + '. ' + policy.policy_name + '<br/>';
          });
          return html;
        }
        return params.name;
      }
    },
    visualMap: {
      type: 'piecewise',
      left: 'left',
      bottom: '10%',
      pieces: [
        {
          min: 1,
          max: 100,
          label: '有政策',
          color: '#ff7875'
        },
        {
          min: 0,
          max: 0,
          label: '无政策',
          color: '#e0f7fa'
        }
      ],
      calculable: true
    },
    series: [
      {
        name: '中国城市',
        type: 'map',
        map: 'china',
        roam: false,
        label: {
          show: true,
          fontSize: 8
        },
        emphasis: {
          disabled: true // 禁用鼠标悬停高亮效果
        },
        select: {
          itemStyle: {
            areaColor: '#ffd700',
            borderColor: '#ff0000',
            borderWidth: 1
          },
          label: {
            show: true,
            fontSize: 10,
            fontWeight: 'bold'
          }
        },
        joinBy: ['properties.adcode', 'adcode'], // 使用adcode字段进行匹配，地图数据中的adcode在properties对象中
        data: mapSeriesData
      }
    ]
  };

  // 应用图表选项
  myChart.setOption(option);
  console.log('图表选项应用完成');
  
  // 更新政策信息面板
  updatePolicyInfoPanel(currentData, mapSeriesData);
  
  // 更新关键词统计
  updateKeywordStats(currentData);
  
  // 添加单选按钮切换事件监听器
  var radioButtons = document.querySelectorAll('input[name="stats-type"]');
  radioButtons.forEach(function(radio) {
    radio.addEventListener('change', function() {
      updateKeywordStats(currentData);
    });
  });
  
  // 实现tooltip轮播显示
    if (mapSeriesData.length > 0) {
      var currentTooltipIndex = 0;
      
      // 清除之前的轮播定时器
      if (window.tooltipInterval) {
        clearInterval(window.tooltipInterval);
      }
      
      // 高亮政策信息列表中的对应项
      function highlightPolicyInfoItem(dataIndex) {
        // 移除之前的高亮
        var infoItems = document.querySelectorAll('.policy-info-item');
        infoItems.forEach(function(item) {
          item.classList.remove('highlight');
        });
        
        // 找到对应的政策信息项并高亮
        var region = mapSeriesData[dataIndex].name;
        var policyItems = document.querySelectorAll('.policy-info-item');
        policyItems.forEach(function(item) {
          var itemIndex = item.getAttribute('data-index');
          if (itemIndex !== null) {
            var itemPolicy = currentData[parseInt(itemIndex)];
            if (itemPolicy && itemPolicy.region === region) {
              item.classList.add('highlight');
            }
          }
        });
      }
      
      // 立即显示第一个tooltip并选中对应的区域和政策信息项
      myChart.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: 0
      });
      myChart.dispatchAction({
        type: 'select',
        seriesIndex: 0,
        dataIndex: 0
      });
      highlightPolicyInfoItem(0);
      
      // 如果有多个地区数据，设置轮播
      if (mapSeriesData.length > 1) {
        window.tooltipInterval = setInterval(function() {
          currentTooltipIndex = (currentTooltipIndex + 1) % mapSeriesData.length;
          // 取消之前的选择
          myChart.dispatchAction({
            type: 'unselect',
            seriesIndex: 0
          });
          // 显示新的tooltip并选中对应的区域和政策信息项
          myChart.dispatchAction({
            type: 'showTip',
            seriesIndex: 0,
            dataIndex: currentTooltipIndex
          });
          myChart.dispatchAction({
            type: 'select',
            seriesIndex: 0,
            dataIndex: currentTooltipIndex
          });
          highlightPolicyInfoItem(currentTooltipIndex);
        }, 5000); // 每5秒切换一次
      }
    }
  
  // 移除地图点击事件，确保tooltip只受政策信息面板点击和自动轮播控制
  myChart.off('click');
  
  // 禁用图表的鼠标事件，确保tooltip不会被鼠标操作影响
  myChart.getZr().off('mousemove');
  myChart.getZr().off('click');
  myChart.getZr().off('mouseout');
}

// 更新政策信息面板
function updatePolicyInfoPanel(data, mapSeriesData) {
  var infoContentElement = document.getElementById('policy-info-content');
  if (!infoContentElement) return;
  
  // 更新政策数量
  var policyCountElement = document.getElementById('policy-count');
  if (policyCountElement) {
    policyCountElement.textContent = `共 ${data.length} 条政策`;
  }
  
  if (data.length === 0) {
    var noDataText;
    switch (currentTimeDimension) {
      case 'day':
        noDataText = '当前日没有数据';
        break;
      case 'week':
        noDataText = '当前周没有数据';
        break;
      case 'month':
        noDataText = '当前月没有数据';
        break;
      case 'quarter':
        noDataText = '当前季度没有数据';
        break;
      case 'year':
        noDataText = '当前年没有数据';
        break;
      default:
        noDataText = '当前时间无政策数据';
        break;}
    infoContentElement.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">' + noDataText + '</p>';
    return;
  }
  
  var html = '';
  data.forEach(function(item, index) {
    // 格式化日期
    var date = new Date(item.time);
    var formattedDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    
    // 处理关键词，拆分包含逗号的关键词
    var processedTags = [];
    if (item.policy_tags && item.policy_tags.length > 0) {
      item.policy_tags.forEach(function(tag) {
        if (tag.includes(',')) {
          var subTags = tag.split(',').map(function(subTag) {
            return subTag.trim();
          });
          subTags.forEach(function(subTag) {
            if (subTag) {
              processedTags.push(subTag);
            }
          });
        } else {
          processedTags.push(tag);
        }
      });
    }
    
    // 生成关键词标签HTML
    var tagsHtml = '';
    processedTags.forEach(function(tag) {
      tagsHtml += `<span class="value policy-tags">${tag}</span> `;
    });
    
    html += `
      <div class="policy-info-item" data-index="${index}">
        <div class="policy-header">
          <div class="policy-title"><span class="date">${formattedDate}</span> <span class="region">${item.region}</span> <span class="policy-name">${item.policy_name}</span></div>
          <div class="toggle-btn">+</div>
        </div>
        <div class="policy-details">
          <div class="detail-item">
            <span class="value policy-link"><a href="${item.link}" target="_blank">链接</a></span>
          </div>
          <div class="detail-item policy-level-category">
            <span class="value policy-level">${item.policy_level}</span> <span class="value policy-category">${item.policy_category}</span>
          </div>
          <div class="detail-item keyword-tags">
            <span class="label">关键词：</span>
            ${tagsHtml}
          </div>
          <!--<div class="detail-item">
            <span class="label">政策名称：</span>
            <span class="value">${item.policy_name}</span>
          </div>-->
          <div class="detail-item">
            <span class="label">政策摘要：</span>
            <span class="value">${item.policy_summary}</span>
          </div>


        </div>
      </div>
    `;
  });
  
  infoContentElement.innerHTML = html;
  
  // 添加事件，点击时在地图上高亮对应的区域并显示tooltip，同时处理展开收起
  var infoItems = infoContentElement.querySelectorAll('.policy-info-item');
  infoItems.forEach(function(item, index) {
    // 添加点击事件以处理展开收起和高亮
    item.addEventListener('click', function(e) {
      // 先收起所有其他展开的项
      infoItems.forEach(function(otherItem) {
        if (otherItem !== this) {
          var otherDetails = otherItem.querySelector('.policy-details');
          var otherToggleBtn = otherItem.querySelector('.toggle-btn');
          if (otherDetails.style.display === 'block') {
            otherDetails.style.display = 'none';
            otherToggleBtn.textContent = '+';
          }
        }
      }.bind(this));
      
      var details = this.querySelector('.policy-details');
      var toggleBtn = this.querySelector('.toggle-btn');
      
      // 检查详情是否已经展开
      if (details.style.display !== 'block') {
        // 详情未展开，执行展开操作
        details.style.display = 'block';
        toggleBtn.textContent = '-';
        
        // 自动滚动到列表顶部
        this.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // 详情已展开，执行收起操作
        details.style.display = 'none';
        toggleBtn.textContent = '+';
      }
    });
    
    // 添加鼠标悬停事件，悬停时在地图上显示对应区域的tooltip，并暂停tooltip轮播
    item.addEventListener('mouseenter', function() {
      // 暂停tooltip轮播
      if (window.tooltipInterval) {
        clearInterval(window.tooltipInterval);
      }
      
      // 从data-index属性获取索引
      var itemIndex = this.getAttribute('data-index');
      if (itemIndex !== null) {
        var policy = data[parseInt(itemIndex)];
        if (policy) {
          // 找到对应的地区在mapSeriesData中的索引
          var regionIndex = mapSeriesData.findIndex(function(mapItem) {
            return mapItem.name === policy.region;
          });
          
          if (regionIndex !== -1) {
        // 取消之前的选择
        myChart.dispatchAction({
          type: 'unselect',
          seriesIndex: 0
        });
        // 触发地图区域的tooltip
        myChart.dispatchAction({
          type: 'showTip',
          seriesIndex: 0,
          dataIndex: regionIndex
        });
        
        // 触发地图区域的选中效果
        myChart.dispatchAction({
          type: 'select',
          seriesIndex: 0,
          dataIndex: regionIndex
        });
      }
        }
      }
    });
    
    // 添加鼠标离开事件，离开时取消选择，并恢复tooltip轮播
    item.addEventListener('mouseleave', function() {
      // 取消选择
      myChart.dispatchAction({
        type: 'unselect',
        seriesIndex: 0
      });
      
      // 恢复tooltip轮播
      if (mapSeriesData.length > 1) {
        var currentTooltipIndex = 0;
        window.tooltipInterval = setInterval(function() {
          currentTooltipIndex = (currentTooltipIndex + 1) % mapSeriesData.length;
          // 取消之前的选择
          myChart.dispatchAction({
            type: 'unselect',
            seriesIndex: 0
          });
          // 显示新的tooltip并选中对应的区域和政策信息项
          myChart.dispatchAction({
            type: 'showTip',
            seriesIndex: 0,
            dataIndex: currentTooltipIndex
          });
          myChart.dispatchAction({
            type: 'select',
            seriesIndex: 0,
            dataIndex: currentTooltipIndex
          });
          // 高亮政策信息列表中的对应项
          var region = mapSeriesData[currentTooltipIndex].name;
          var policyItems = document.querySelectorAll('.policy-info-item');
          policyItems.forEach(function(item) {
            item.classList.remove('highlight');
          });
          policyItems.forEach(function(item) {
            var itemIndex = item.getAttribute('data-index');
            if (itemIndex !== null) {
              var itemPolicy = data[parseInt(itemIndex)];
              if (itemPolicy && itemPolicy.region === region) {
                item.classList.add('highlight');
              }
            }
          });
        }, 5000); // 每5秒切换一次
      }
    });
    
    // 为每个政策信息项添加点击政策标题时的高亮功能
    var policyTitle = item.querySelector('.policy-title');
    if (policyTitle) {
      policyTitle.addEventListener('dblclick', function(e) {
        e.stopPropagation(); // 阻止事件冒泡，避免触发展开收起
        
        // 清除之前的轮播定时器
        if (window.tooltipInterval) {
          clearInterval(window.tooltipInterval);
        }
        
        // 移除之前的高亮
        infoItems.forEach(function(infoItem) {
          infoItem.classList.remove('highlight');
        });
        // 高亮当前点击的政策信息项
        item.classList.add('highlight');
        
        // 找到对应的地区在mapSeriesData中的索引
        var policy = data[index];
        var regionIndex = mapSeriesData.findIndex(function(item) {
          return item.name === policy.region;
        });
        
        if (regionIndex !== -1) {
          // 取消之前的选择
          myChart.dispatchAction({
            type: 'unselect',
            seriesIndex: 0
          });
          // 触发地图区域的tooltip
          myChart.dispatchAction({
            type: 'showTip',
            seriesIndex: 0,
            dataIndex: regionIndex
          });
          
          // 触发地图区域的选中效果
          myChart.dispatchAction({
            type: 'select',
            seriesIndex: 0,
            dataIndex: regionIndex
          });
          
          // 高亮政策信息列表中的对应项
          function highlightPolicyInfoItem(dataIndex) {
            // 移除之前的高亮
            var infoItems = document.querySelectorAll('.policy-info-item');
            infoItems.forEach(function(item) {
              item.classList.remove('highlight');
            });
            
            // 找到对应的政策信息项并高亮
            var region = mapSeriesData[dataIndex].name;
            var policyItems = document.querySelectorAll('.policy-info-item');
            policyItems.forEach(function(item) {
              var itemIndex = item.getAttribute('data-index');
              if (itemIndex !== null) {
                var itemPolicy = data[parseInt(itemIndex)];
                if (itemPolicy && itemPolicy.region === region) {
                  item.classList.add('highlight');
                }
              }
            });
          }
          
          // 重新启动轮播，从当前点击的地区索引开始
          if (mapSeriesData.length > 1) {
            var startIndex = regionIndex;
            window.tooltipInterval = setInterval(function() {
              startIndex = (startIndex + 1) % mapSeriesData.length;
              // 取消之前的选择
              myChart.dispatchAction({
                type: 'unselect',
                seriesIndex: 0
              });
              // 显示新的tooltip并选中对应的区域
              myChart.dispatchAction({
                type: 'showTip',
                seriesIndex: 0,
                dataIndex: startIndex
              });
              myChart.dispatchAction({
                type: 'select',
                seriesIndex: 0,
                dataIndex: startIndex
              });
              // 高亮政策信息列表中的对应项
              highlightPolicyInfoItem(startIndex);
            }, 5000); // 每5秒切换一次
          }
        }
      });
    }
  });
  
  // 为每个政策信息项添加收起功能
  infoItems.forEach(function(item) {
    var details = item.querySelector('.policy-details');
    var toggleBtn = item.querySelector('.toggle-btn');
    
    // 点击切换按钮时直接收起
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // 阻止事件冒泡，避免触发展开操作
      if (details.style.display === 'block') {
        details.style.display = 'none';
        toggleBtn.textContent = '+';
      } else {
        // 先收起所有其他展开的项
        infoItems.forEach(function(otherItem) {
          if (otherItem !== item) {
            var otherDetails = otherItem.querySelector('.policy-details');
            var otherToggleBtn = otherItem.querySelector('.toggle-btn');
            if (otherDetails.style.display === 'block') {
              otherDetails.style.display = 'none';
              otherToggleBtn.textContent = '+';
            }
          }
        });
        // 展开当前项
        details.style.display = 'block';
        toggleBtn.textContent = '-';
      }
    });
  });
  
  // 初始化时隐藏详情
  var allDetails = infoContentElement.querySelectorAll('.policy-details');
  allDetails.forEach(function(detail) {
    detail.style.display = 'none';
  });
}

// 更新进度条
function updateProgressBar() {
  var progressFill = document.getElementById('time-progress-fill');
  if (progressFill) {
    var percentage = 0;
    if (totalCountdown > 0) {
      percentage = (currentCountdown / totalCountdown) * 100;
    }
    progressFill.style.width = percentage + '%';
  }
}

// 存储ECharts实例，用于后续销毁
var statsCharts = {};

// 更新关键词统计
function updateKeywordStats(data) {
  var statsContainer = document.getElementById('keyword-stats');
  if (!statsContainer) return;
  
  // 销毁之前的ECharts实例，避免内存泄漏
  if (statsCharts.current) {
    statsCharts.current.dispose();
    statsCharts.current = null;
  }
  
  // 获取当前选中的统计类型
  var selectedType = document.querySelector('input[name="stats-type"]:checked').value;
  
  switch (selectedType) {
    case 'keywords':
      // 清空容器
      statsContainer.innerHTML = '';
      
      // 统计关键词出现次数
      var keywordCount = {};
      data.forEach(function(item) {
        if (item.policy_tags && item.policy_tags.length > 0) {
          item.policy_tags.forEach(function(tag) {
            // 检查标签中是否包含逗号，如果包含，就拆分
            if (tag.includes(',')) {
              var subTags = tag.split(',').map(function(subTag) {
                return subTag.trim(); // 去除空格
              });
              subTags.forEach(function(subTag) {
                if (subTag) { // 确保子标签不为空
                  if (keywordCount[subTag]) {
                    keywordCount[subTag]++;
                  } else {
                    keywordCount[subTag] = 1;
                  }
                }
              });
            } else {
              // 标签中不包含逗号，直接处理
              if (keywordCount[tag]) {
                keywordCount[tag]++;
              } else {
                keywordCount[tag] = 1;
              }
            }
          });
        }
      });
      
      // 转换为数组并按降序排序
      var keywordArray = [];
      for (var keyword in keywordCount) {
        keywordArray.push({name: keyword, value: keywordCount[keyword]});
      }
      // 按出现次数降序排序
      keywordArray.sort(function(a, b) {
        return b.value - a.value;
      });
      
      // 取前10个关键词
      var topKeywords = keywordArray.slice(0, 10);
      
      // 创建饼图
      var keywordChart = echarts.init(statsContainer);
      statsCharts.current = keywordChart;
      var keywordOption = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          type: 'scroll',
          orient: 'vertical',
          right: 0,
          top: 'center',
          data: topKeywords.map(function(item) { return item.name; }),
          itemWidth: 10,
          itemHeight: 6,
          textStyle: {
            fontSize: 12
          }
        },
        series: [
          {
            name: '关键词出现次数',
            type: 'pie',
            radius: '50%',
            center: ['35%', '50%'],
            data: topKeywords.sort(function(a, b) { return b.value - a.value; }),
            label: {
              show: true,
              formatter: '{b}：{c}'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
      keywordChart.setOption(keywordOption);
      break;
      
    case 'regions':
      // 清空容器
      statsContainer.innerHTML = '';
      
      // 统计区域政策数量
      var regionCount = {};
      data.forEach(function(item) {
        var region = item.region;
        if (regionCount[region]) {
          regionCount[region]++;
        } else {
          regionCount[region] = 1;
        }
      });
      
      // 转换为数组并按值降序排序
      var regionArray = [];
      for (var region in regionCount) {
        regionArray.push({name: region, value: regionCount[region]});
      }
      regionArray.sort(function(a, b) { return b.value - a.value; });
      
      // 创建饼图
      var regionChart = echarts.init(statsContainer);
      statsCharts.current = regionChart;
      var regionOption = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          type: 'scroll',
          orient: 'vertical',
          right: 0,
          top: 'center',
          data: regionArray.map(function(item) { return item.name; }),
          itemWidth: 10,
          itemHeight: 6,
          textStyle: {
            fontSize: 12
          }
        },
        series: [
          {
            name: '区域政策数量',
            type: 'pie',
            radius: '50%',
            center: ['35%', '50%'],
            data: regionArray,
            label: {
              show: true,
              formatter: '{b}：{c}'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
      regionChart.setOption(regionOption);
      break;
      
    case 'types':
      // 清空容器
      statsContainer.innerHTML = '';
      
      // 统计政策类型数量
      var typeCount = {};
      data.forEach(function(item) {
        var type = item.policy_category;
        if (typeCount[type]) {
          typeCount[type]++;
        } else {
          typeCount[type] = 1;
        }
      });
      
      // 转换为数组并按值降序排序
      var typeArray = [];
      for (var type in typeCount) {
        typeArray.push({name: type, value: typeCount[type]});
      }
      typeArray.sort(function(a, b) { return b.value - a.value; });
      
      // 创建饼图
      var typeChart = echarts.init(statsContainer);
      statsCharts.current = typeChart;
      var typeOption = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          type: 'scroll',
          orient: 'vertical',
          right: 0,
          top: 'center',
          data: typeArray.map(function(item) { return item.name; }),
          itemWidth: 10,
          itemHeight: 6,
          textStyle: {
            fontSize: 12
          }
        },
        series: [
          {
            name: '政策类型数量',
            type: 'pie',
            radius: '50%',
            center: ['35%', '50%'],
            data: typeArray,
            label: {
              show: true,
              formatter: '{b}：{c}'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
      typeChart.setOption(typeOption);
      break;
  }
}

// 响应式调整
window.addEventListener('resize', function() {
  if (myChart) {
    myChart.resize();
  }
  if (statsCharts.current) {
    statsCharts.current.resize();
  }
});

// 页面加载完成后初始化
window.addEventListener('load', init);
