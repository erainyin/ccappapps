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
var keywordChart;
// 当前时间维度（day, week, month, quarter, year）
var currentTimeDimension = 'year';
// 筛选选项
var filterOptions = {
  regions: [],
  types: [],
  keywords: []
};
// 选中的筛选值
var selectedFilters = {
  regions: [],
  types: [],
  keywords: []
};

// 初始化函数
function init() {
  console.log('开始加载数据...');
  
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
      
      // 提取筛选选项
      extractFilterOptions();
      
      // 生成筛选复选框
      generateFilterCheckboxes();
      
      // 绑定筛选事件
      bindFilterEvents();
      
      // 更新页面
      updatePage();
      console.log('页面更新完成');
      
      // 绑定按钮事件
      bindButtonEvents();
      console.log('按钮事件绑定完成');
      
      console.log('初始化完成');
    })
    .catch(function(error) {
      console.error('加载数据失败:', error);
      // 显示错误信息
      var policyContentElement = document.getElementById('policy-info-content');
      if (policyContentElement) {
        policyContentElement.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">加载数据失败: ' + error.message + '</div>';
      }
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
        updatePage();
        
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
        updatePage();
        
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
      // 更新页面
      updatePage();
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
        updatePage();
        
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

// 更新页面
function updatePage() {
  if (timeList.length === 0) return;
  
  var currentTime = timeList[currentTimeIndex];
  var currentData = timeGroupedData[currentTime];
  
  // 应用筛选
  var filteredData = applyFilters(currentData);
  
  console.log('更新页面数据，时间:', currentTime, '原始数据:', currentData.length, '筛选后数据:', filteredData.length);
  
  // 处理政策数据，生成地区数据
  var regionMap = {};
  
  // 按地区分组数据
  filteredData.forEach(function(item) {
    var region = item.region;
    
    if (!regionMap[region]) {
      regionMap[region] = {
        name: region,
        policies: []
      };
    }
    regionMap[region].policies.push(item);
  });
  
  // 转换为数组
  var regionData = Object.values(regionMap);
  
  // 更新政策信息面板
  updatePolicyInfoPanel(filteredData, regionData);
  
  // 更新关键词统计
  updateKeywordStats(filteredData);
  
  // 添加单选按钮切换事件监听器
  var radioButtons = document.querySelectorAll('input[name="stats-type"]');
  radioButtons.forEach(function(radio) {
    radio.addEventListener('change', function() {
      updateKeywordStats(filteredData);
    });
  });
}

// 更新政策信息面板
function updatePolicyInfoPanel(data, regionData) {
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
        break;
    }
    infoContentElement.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">' + noDataText + '</p>';
    return;
  }
  
  var html = '<div class="policy-items-container">';
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
      <div class="policy-info-item policy-item" data-index="${index}" data-summary="${item.policy_summary}" data-link="${item.link}" style="cursor: pointer;">
        <div class="policy-title"><span class="date">${formattedDate}</span> <span class="region">${item.region}</span> <span class="policy-name">${item.policy_name}</span></div>
        <div class="policy-content">
          <div class="detail-item policy-level-category">
            <span class="value policy-level">${item.policy_level}</span> <span class="value policy-category">${item.policy_category}</span>
          </div>
          <div class="detail-item keyword-tags">
            ${tagsHtml}
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  infoContentElement.innerHTML = html;
  
  // 添加鼠标悬停事件，显示自定义 tooltip
  var infoItems = infoContentElement.querySelectorAll('.policy-info-item');
  infoItems.forEach(function(item, index) {
    // 创建 tooltip 元素
    var tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '10px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = '1000';
    tooltip.style.display = 'none';
    tooltip.style.maxWidth = '300px';
    tooltip.style.wordWrap = 'break-word';
    document.body.appendChild(tooltip);
    
    // 鼠标进入事件
    item.addEventListener('mouseenter', function(e) {
      var summary = this.getAttribute('data-summary');
      tooltip.textContent = summary;
      tooltip.style.display = 'block';
      
      // 计算位置
      var rect = this.getBoundingClientRect();
      tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
      tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
      
      // 确保 tooltip 不会超出视口
      var tooltipRect = tooltip.getBoundingClientRect();
      if (tooltipRect.left < 0) {
        tooltip.style.left = '10px';
      }
      if (tooltipRect.right > window.innerWidth) {
        tooltip.style.left = (window.innerWidth - tooltipRect.width - 10) + 'px';
      }
      if (tooltipRect.top < 0) {
        tooltip.style.top = (rect.bottom + 10) + 'px';
      }
    });
    
    // 鼠标移动事件
    item.addEventListener('mousemove', function(e) {
      // 可以根据需要更新 tooltip 位置
    });
    
    // 鼠标离开事件
    item.addEventListener('mouseleave', function(e) {
      tooltip.style.display = 'none';
    });
    
    // 点击事件，跳转到政策链接
    item.addEventListener('click', function(e) {
      var link = this.getAttribute('data-link');
      if (link) {
        window.open(link, '_blank');
      }
    });
  });
}

// 更新关键词统计
function updateKeywordStats(data) {
  var keywordStatsElement = document.getElementById('keyword-stats');
  if (!keywordStatsElement) return;
  
  // 获取选中的统计类型
  var selectedType = document.querySelector('input[name="stats-type"]:checked').value;
  
  // 销毁之前的图表实例
  if (keywordChart) {
    keywordChart.dispose();
  }
  
  // 初始化新的图表实例
  keywordChart = echarts.init(keywordStatsElement);
  
  // 添加窗口大小变化事件，确保图表能够自适应容器大小
  window.addEventListener('resize', function() {
    keywordChart.resize();
  });
  
  var chartData = [];
  var titleText = '';
  
  switch (selectedType) {
    case 'keywords':
      // 统计关键词
      var keywordMap = {};
      
      data.forEach(function(item) {
        if (item.policy_tags) {
          item.policy_tags.forEach(function(tag) {
            if (tag.includes(',')) {
              // 拆分包含逗号的关键词
              var subTags = tag.split(',').map(function(subTag) {
                return subTag.trim();
              });
              subTags.forEach(function(subTag) {
                if (subTag) {
                  keywordMap[subTag] = (keywordMap[subTag] || 0) + 1;
                }
              });
            } else {
              keywordMap[tag] = (keywordMap[tag] || 0) + 1;
            }
          });
        }
      });
      
      // 转换为数组并排序
      chartData = Object.entries(keywordMap)
        .map(function([name, value]) {
          return { name, value };
        })
        .sort(function(a, b) {
          return b.value - a.value;
        })
        .slice(0, 10); // 取前10个
      
      titleText = '关键词统计';
      break;
      
    case 'regions':
      // 统计地区
      var regionMap = {};
      
      data.forEach(function(item) {
        var region = item.region;
        regionMap[region] = (regionMap[region] || 0) + 1;
      });
      
      // 转换为数组并排序
      chartData = Object.entries(regionMap)
        .map(function([name, value]) {
          return { name, value };
        })
        .sort(function(a, b) {
          return b.value - a.value;
        });
      
      titleText = '地区统计';
      break;
      
    case 'types':
      // 统计类型
      var typeMap = {};
      
      data.forEach(function(item) {
        var type = item.policy_category;
        typeMap[type] = (typeMap[type] || 0) + 1;
      });
      
      // 转换为数组并排序
      chartData = Object.entries(typeMap)
        .map(function([name, value]) {
          return { name, value };
        })
        .sort(function(a, b) {
          return b.value - a.value;
        });
      
      titleText = '类型统计';
      break;
  }
  
  // 设置图表选项
  var option = {
    title: {
      text: titleText,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      left: 'center',
      bottom: 10,
      itemWidth: 10,
      itemHeight: 6,
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: titleText,
        type: 'pie',
        radius: '60%',
        center: ['50%', '40%'],
        data: chartData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {c}'
        }
      }
    ]
  };
  
  // 应用图表选项
  keywordChart.setOption(option);
}

// 更新进度条
function updateProgressBar() {
  var progressFill = document.getElementById('time-progress-fill');
  if (!progressFill) return;
  
  if (totalCountdown === 0) {
    // 当选择不自动切换时，进度条宽度为0
    progressFill.style.width = '0%';
    return;
  }
  
  var progress = (currentCountdown / totalCountdown) * 100;
  progressFill.style.width = progress + '%';
}

// 提取筛选选项
function extractFilterOptions() {
  var regions = new Set();
  var types = new Set();
  var keywords = new Set();
  
  policyData.forEach(function(item) {
    // 提取区域
    if (item.region) {
      regions.add(item.region);
    }
    
    // 提取类型
    if (item.policy_category) {
      types.add(item.policy_category);
    }
    
    // 提取关键词
    if (item.policy_tags && item.policy_tags.length > 0) {
      item.policy_tags.forEach(function(tag) {
        if (tag.includes(',')) {
          var subTags = tag.split(',').map(function(subTag) {
            return subTag.trim();
          });
          subTags.forEach(function(subTag) {
            if (subTag) {
              keywords.add(subTag);
            }
          });
        } else {
          keywords.add(tag);
        }
      });
    }
  });
  
  // 转换为数组并排序
  filterOptions.regions = Array.from(regions).sort();
  filterOptions.types = Array.from(types).sort();
  filterOptions.keywords = Array.from(keywords).sort();
  
  console.log('筛选选项提取完成:', filterOptions);
}

// 生成筛选复选框
function generateFilterCheckboxes() {
  // 生成区域复选框
  var regionFilterElement = document.getElementById('region-filter');
  if (regionFilterElement) {
    regionFilterElement.innerHTML = `
      <div class="filter-top">
        <div class="filter-search">
          <input type="text" id="region-search" placeholder="搜索区域" style="width: 150px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div class="filter-option">
          <input type="checkbox" id="region-all" value="all" checked>
          <label for="region-all">全部</label>
        </div>
      </div>
      <div class="filter-options" id="region-options-list"></div>
    `;
    
    // 生成区域选项
    var regionOptionsList = document.getElementById('region-options-list');
    filterOptions.regions.forEach(function(region) {
      var optionElement = document.createElement('div');
      optionElement.className = 'filter-option';
      optionElement.innerHTML = `
        <input type="checkbox" id="region-${region}" value="${region}" checked>
        <label for="region-${region}">${region}</label>
      `;
      regionOptionsList.appendChild(optionElement);
      
      // 绑定事件监听器
      var checkbox = optionElement.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', function() {
        // 如果有任何选项被取消选择，取消全选
        var allCheckbox = document.getElementById('region-all');
        if (allCheckbox && allCheckbox.checked) {
          allCheckbox.checked = false;
        }
        
        // 检查是否所有选项都被选中，如果是，选中全选
        var allCheckboxes = document.querySelectorAll('#region-options-list input[type="checkbox"]');
        var allChecked = true;
        allCheckboxes.forEach(function(cb) {
          if (!cb.checked) {
            allChecked = false;
          }
        });
        if (allChecked && allCheckbox) {
          allCheckbox.checked = true;
        }
        
        updateSelectedFilters();
        updatePage();
      });
    });
    
    // 添加搜索事件
    document.getElementById('region-search').addEventListener('input', function() {
      filterOptionsList('region');
    });
    
    // 添加全选事件
    document.getElementById('region-all').addEventListener('change', function() {
      var isChecked = this.checked;
      var checkboxes = document.querySelectorAll('#region-options-list input[type="checkbox"]');
      checkboxes.forEach(function(checkbox) {
        checkbox.checked = isChecked;
      });
      updateSelectedFilters();
    });
  }
  
  // 生成类型复选框
  var typeFilterElement = document.getElementById('type-filter');
  if (typeFilterElement) {
    typeFilterElement.innerHTML = `
      <div class="filter-top">
        <div class="filter-search">
          <input type="text" id="type-search" placeholder="搜索类型" style="width: 150px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div class="filter-option">
          <input type="checkbox" id="type-all" value="all" checked>
          <label for="type-all">全部</label>
        </div>
      </div>
      <div class="filter-options" id="type-options-list"></div>
    `;
    
    // 生成类型选项
    var typeOptionsList = document.getElementById('type-options-list');
    filterOptions.types.forEach(function(type) {
      var optionElement = document.createElement('div');
      optionElement.className = 'filter-option';
      optionElement.innerHTML = `
        <input type="checkbox" id="type-${type}" value="${type}" checked>
        <label for="type-${type}">${type}</label>
      `;
      typeOptionsList.appendChild(optionElement);
      
      // 绑定事件监听器
      var checkbox = optionElement.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', function() {
        // 如果有任何选项被取消选择，取消全选
        var allCheckbox = document.getElementById('type-all');
        if (allCheckbox && allCheckbox.checked) {
          allCheckbox.checked = false;
        }
        
        // 检查是否所有选项都被选中，如果是，选中全选
        var allCheckboxes = document.querySelectorAll('#type-options-list input[type="checkbox"]');
        var allChecked = true;
        allCheckboxes.forEach(function(cb) {
          if (!cb.checked) {
            allChecked = false;
          }
        });
        if (allChecked && allCheckbox) {
          allCheckbox.checked = true;
        }
        
        updateSelectedFilters();
        updatePage();
      });
    });
    
    // 添加搜索事件
    document.getElementById('type-search').addEventListener('input', function() {
      filterOptionsList('type');
    });
    
    // 添加全选事件
    document.getElementById('type-all').addEventListener('change', function() {
      var isChecked = this.checked;
      var checkboxes = document.querySelectorAll('#type-options-list input[type="checkbox"]');
      checkboxes.forEach(function(checkbox) {
        checkbox.checked = isChecked;
      });
      updateSelectedFilters();
    });
  }
  
  // 生成关键词复选框
  var keywordFilterElement = document.getElementById('keyword-filter');
  if (keywordFilterElement) {
    keywordFilterElement.innerHTML = `
      <div class="filter-top">
        <div class="filter-search">
          <input type="text" id="keyword-search" placeholder="搜索关键词" style="width: 150px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div class="filter-option">
          <input type="checkbox" id="keyword-all" value="all" checked>
          <label for="keyword-all">全部</label>
        </div>
      </div>
      <div class="filter-options" id="keyword-options-list"></div>
    `;
    
    // 生成关键词选项
    var keywordOptionsList = document.getElementById('keyword-options-list');
    filterOptions.keywords.forEach(function(keyword) {
      var optionElement = document.createElement('div');
      optionElement.className = 'filter-option';
      optionElement.innerHTML = `
        <input type="checkbox" id="keyword-${keyword}" value="${keyword}" checked>
        <label for="keyword-${keyword}">${keyword}</label>
      `;
      keywordOptionsList.appendChild(optionElement);
      
      // 绑定事件监听器
      var checkbox = optionElement.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', function() {
        // 如果有任何选项被取消选择，取消全选
        var allCheckbox = document.getElementById('keyword-all');
        if (allCheckbox && allCheckbox.checked) {
          allCheckbox.checked = false;
        }
        
        // 检查是否所有选项都被选中，如果是，选中全选
        var allCheckboxes = document.querySelectorAll('#keyword-options-list input[type="checkbox"]');
        var allChecked = true;
        allCheckboxes.forEach(function(cb) {
          if (!cb.checked) {
            allChecked = false;
          }
        });
        if (allChecked && allCheckbox) {
          allCheckbox.checked = true;
        }
        
        updateSelectedFilters();
        updatePage();
      });
    });
    
    // 添加搜索事件
    document.getElementById('keyword-search').addEventListener('input', function() {
      filterOptionsList('keyword');
    });
    
    // 添加全选事件
    document.getElementById('keyword-all').addEventListener('change', function() {
      var isChecked = this.checked;
      var checkboxes = document.querySelectorAll('#keyword-options-list input[type="checkbox"]');
      checkboxes.forEach(function(checkbox) {
        checkbox.checked = isChecked;
      });
      updateSelectedFilters();
    });
  }
}

// 筛选选项列表
function filterOptionsList(type) {
  var searchInput = document.getElementById(`${type}-search`);
  var searchTerm = searchInput.value.toLowerCase();
  var optionsList = document.getElementById(`${type}-options-list`);
  var options = optionsList.querySelectorAll('.filter-option');
  
  options.forEach(function(option) {
    var label = option.querySelector('label').textContent.toLowerCase();
    if (label.includes(searchTerm)) {
      option.style.display = 'flex';
    } else {
      option.style.display = 'none';
    }
  });
}

// 绑定筛选事件
function bindFilterEvents() {
  // 绑定区域筛选事件
  var regionCheckboxes = document.querySelectorAll('#region-filter input[type="checkbox"]');
  regionCheckboxes.forEach(function(checkbox) {
    checkbox.addEventListener('change', function() {
      updateSelectedFilters();
      updatePage();
    });
  });
  
  // 绑定类型筛选事件
  var typeCheckboxes = document.querySelectorAll('#type-filter input[type="checkbox"]');
  typeCheckboxes.forEach(function(checkbox) {
    checkbox.addEventListener('change', function() {
      updateSelectedFilters();
      updatePage();
    });
  });
  
  // 绑定关键词筛选事件
  var keywordCheckboxes = document.querySelectorAll('#keyword-filter input[type="checkbox"]');
  keywordCheckboxes.forEach(function(checkbox) {
    checkbox.addEventListener('change', function() {
      updateSelectedFilters();
      updatePage();
    });
  });
}

// 更新选中的筛选条件
function updateSelectedFilters() {
  // 更新区域筛选
  selectedFilters.regions = [];
  var regionAllChecked = document.getElementById('region-all') && document.getElementById('region-all').checked;
  if (!regionAllChecked) {
    var regionCheckboxes = document.querySelectorAll('#region-options-list input[type="checkbox"]:checked');
    regionCheckboxes.forEach(function(checkbox) {
      selectedFilters.regions.push(checkbox.value);
    });
  }
  
  // 更新类型筛选
  selectedFilters.types = [];
  var typeAllChecked = document.getElementById('type-all') && document.getElementById('type-all').checked;
  if (!typeAllChecked) {
    var typeCheckboxes = document.querySelectorAll('#type-options-list input[type="checkbox"]:checked');
    typeCheckboxes.forEach(function(checkbox) {
      selectedFilters.types.push(checkbox.value);
    });
  }
  
  // 更新关键词筛选
  selectedFilters.keywords = [];
  var keywordAllChecked = document.getElementById('keyword-all') && document.getElementById('keyword-all').checked;
  if (!keywordAllChecked) {
    var keywordCheckboxes = document.querySelectorAll('#keyword-options-list input[type="checkbox"]:checked');
    keywordCheckboxes.forEach(function(checkbox) {
      selectedFilters.keywords.push(checkbox.value);
    });
  }
  
  // 更新筛选计数显示
  updateFilterCounts();
  
  console.log('筛选条件更新:', selectedFilters);
}

// 更新筛选计数显示
function updateFilterCounts() {
  var filterCountsElement = document.getElementById('filter-counts');
  if (!filterCountsElement) return;
  
  var counts = [];
  
  if (selectedFilters.regions.length > 0) {
    counts.push('区域：' + selectedFilters.regions.length);
  }
  
  if (selectedFilters.types.length > 0) {
    counts.push('类型：' + selectedFilters.types.length);
  }
  
  if (selectedFilters.keywords.length > 0) {
    counts.push('关键词：' + selectedFilters.keywords.length);
  }
  
  if (counts.length > 0) {
    filterCountsElement.textContent = '(' + counts.join('，') + ')';
  } else {
    filterCountsElement.textContent = '';
  }
}

// 应用筛选
function applyFilters(data) {
  return data.filter(function(item) {
    // 检查是否有任何筛选条件被设置
    var hasRegionFilter = selectedFilters.regions.length > 0;
    var hasTypeFilter = selectedFilters.types.length > 0;
    var hasKeywordFilter = selectedFilters.keywords.length > 0;
    
    // 如果没有设置任何筛选条件，显示所有数据
    if (!hasRegionFilter && !hasTypeFilter && !hasKeywordFilter) {
      return true;
    }
    
    // 区域筛选：如果设置了区域筛选，必须匹配
    var regionMatch = !hasRegionFilter || selectedFilters.regions.includes(item.region);
    if (!regionMatch) {
      return false;
    }
    
    // 类型筛选：如果设置了类型筛选，必须匹配
    var typeMatch = !hasTypeFilter || selectedFilters.types.includes(item.policy_category);
    if (!typeMatch) {
      return false;
    }
    
    // 关键词筛选：如果设置了关键词筛选，必须匹配
    var keywordMatch = !hasKeywordFilter;
    if (hasKeywordFilter && item.policy_tags) {
      item.policy_tags.forEach(function(tag) {
        if (tag.includes(',')) {
          var subTags = tag.split(',').map(function(subTag) {
            return subTag.trim();
          });
          subTags.forEach(function(subTag) {
            if (subTag && selectedFilters.keywords.includes(subTag)) {
              keywordMatch = true;
            }
          });
        } else {
          if (selectedFilters.keywords.includes(tag)) {
            keywordMatch = true;
          }
        }
      });
    }
    if (!keywordMatch) {
      return false;
    }
    
    // 返回满足所有筛选条件的结果（交集逻辑）
    return true;
  });
}

// 页面加载完成后初始化
window.onload = function() {
  init();
};
