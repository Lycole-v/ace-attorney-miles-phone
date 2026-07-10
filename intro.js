// ================================================================
// 0. 全屏模式 + 页面切换
// ================================================================
const fullscreenOverlay = document.getElementById('fullscreenOverlay');
const introContainer = document.getElementById('introContainer');
const lockscreenContainer = document.getElementById('lockscreenContainer');
const homescreenContainer = document.getElementById('homescreenContainer');
const startBtn = document.getElementById('startBtn');

function requestFullscreen() {
  const doc = document.documentElement;
  if (doc.requestFullscreen) {
    doc.requestFullscreen().catch(() => {});
  } else if (doc.webkitRequestFullscreen) {
    doc.webkitRequestFullscreen();
  } else if (doc.msRequestFullscreen) {
    doc.msRequestFullscreen();
  }
}

function enterFullscreen() {
  requestFullscreen();
  fullscreenOverlay.classList.add('hidden');
}

fullscreenOverlay.addEventListener('click', enterFullscreen);
fullscreenOverlay.addEventListener('touchend', (e) => {
  e.preventDefault();
  enterFullscreen();
});

document.addEventListener('click', (e) => {
  if (!fullscreenOverlay.classList.contains('hidden')) {
    enterFullscreen();
  }
});

// 切换页面：从开场到锁屏
function goToLockscreen() {
  introContainer.style.display = 'none';
  lockscreenContainer.style.display = 'block';
}

startBtn.addEventListener('click', goToLockscreen);
startBtn.addEventListener('touchend', (e) => {
  e.preventDefault();
  goToLockscreen();
});

// ================================================================
// 1. 实时时间更新
// ================================================================
function updateTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('timeDisplay').textContent = `${hours}:${minutes}`;
  document.getElementById('dateDisplay').textContent = '2016年12月23日 星期五';
}

function updateHomescreenTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeDisplay = document.getElementById('homescreenTime');
  if (timeDisplay) {
    timeDisplay.textContent = `${hours}:${minutes}`;
  }
}

updateTime();
setInterval(updateTime, 1000);
setInterval(() => {
  if (homescreenContainer && homescreenContainer.style.display === 'block') {
    updateHomescreenTime();
  }
}, 1000);

// ================================================================
// 2. 电池状态
// ================================================================
function updateBattery() {
  if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
      const level = Math.round(battery.level * 100);
      const batteryPercent = document.getElementById('batteryPercent');
      const homescreenBattery = document.getElementById('homescreenBattery');
      if (batteryPercent) batteryPercent.textContent = `${level}%`;
      if (homescreenBattery) homescreenBattery.textContent = `${level}%`;
      battery.addEventListener('levelchange', () => {
        const newLevel = Math.round(battery.level * 100);
        if (batteryPercent) batteryPercent.textContent = `${newLevel}%`;
        if (homescreenBattery) homescreenBattery.textContent = `${newLevel}%`;
      });
    });
  } else {
    const batteryPercent = document.getElementById('batteryPercent');
    const homescreenBattery = document.getElementById('homescreenBattery');
    if (batteryPercent) batteryPercent.textContent = '85%';
    if (homescreenBattery) homescreenBattery.textContent = '85%';
  }
}
updateBattery();

// ================================================================
// 3. 左滑打开右侧面板 / 右滑关闭
// ================================================================
let touchStartX = 0;
const mainScreen = document.getElementById('mainScreen');
const sidePanel = document.getElementById('sidePanel');
const pinOverlay = document.getElementById('pinOverlay');

mainScreen.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});

mainScreen.addEventListener('touchend', (e) => {
  if (pinOverlay.classList.contains('active')) return;
  const touchEndX = e.changedTouches[0].clientX;
  const diffX = touchEndX - touchStartX;
  if (diffX < -50 && touchStartX > window.innerWidth * 0.7) {
    sidePanel.classList.add('open');
  }
});

sidePanel.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});

sidePanel.addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const diffX = touchEndX - touchStartX;
  if (diffX > 50) {
    sidePanel.classList.remove('open');
  }
});

// ================================================================
// 4. 上滑打开密码界面
// ================================================================
let touchStartY = 0;

mainScreen.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
});

mainScreen.addEventListener('touchend', (e) => {
  if (pinOverlay.classList.contains('active')) return;
  const touchEndY = e.changedTouches[0].clientY;
  const diffY = touchStartY - touchEndY;
  if (diffY > 60) {
    openPinScreen();
  }
});

// ================================================================
// 5. 密码盘逻辑
// ================================================================
const CORRECT_PIN = '1228';
let currentInput = '';
const pinDots = document.querySelectorAll('.pin-dot');
const errorMsg = document.getElementById('errorMsg');
const pinPad = document.getElementById('pinPad');

function buildPinPad() {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'];
  pinPad.innerHTML = '';
  keys.forEach(key => {
    const keyDiv = document.createElement('div');
    keyDiv.className = 'pin-key';
    if (key === '') {
      keyDiv.classList.add('empty');
      keyDiv.textContent = '';
    } else {
      keyDiv.textContent = key;
      keyDiv.addEventListener('click', () => handlePinKey(key));
    }
    pinPad.appendChild(keyDiv);
  });
}

function handlePinKey(key) {
  if (key === '⌫') {
    if (currentInput.length > 0) {
      currentInput = currentInput.slice(0, -1);
    }
  } else {
    if (currentInput.length < 4) {
      currentInput += key.toString();
    }
  }
  updateDots();
  if (currentInput.length === 4) {
    setTimeout(verifyPin, 200);
  }
}

function updateDots() {
  pinDots.forEach((dot, index) => {
    if (index < currentInput.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  });
  errorMsg.textContent = '';
}

function verifyPin() {
  if (currentInput === CORRECT_PIN) {
    closePinScreen();
    lockscreenContainer.style.display = 'none';
    homescreenContainer.style.display = 'block';
    updateHomescreenTime();
  } else {
    errorMsg.textContent = '密码错误';
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    currentInput = '';
    updateDots();
  }
}

function openPinScreen() {
  pinOverlay.classList.add('active');
  currentInput = '';
  updateDots();
  errorMsg.textContent = '';
  sidePanel.classList.remove('open');
  document.querySelector('.time-date-area').style.display = 'none';
  document.querySelector('.swipe-up-hint').style.display = 'none';
}

function closePinScreen() {
  pinOverlay.classList.remove('active');
  currentInput = '';
  updateDots();
  errorMsg.textContent = '';
  document.querySelector('.time-date-area').style.display = 'flex';
  document.querySelector('.swipe-up-hint').style.display = 'block';
}

// ================================================================
// 6. 密码盘返回按钮
// ================================================================
const pinBackBtn = document.getElementById('pinBackBtn');
pinBackBtn.addEventListener('click', () => {
  closePinScreen();
});

pinOverlay.addEventListener('click', (e) => {
  if (e.target === pinOverlay) {
    // 不关闭
  }
});

pinOverlay.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

buildPinPad();

// ================================================================
// 7. 主屏幕 App 点击
// ================================================================
const wechatContainer = document.getElementById('wechatContainer');

document.querySelectorAll('.app-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    const appName = icon.dataset.app;
    
    // 点击微信图标
    if (appName === 'wechat' || appName === 'wechat-dock') {
      homescreenContainer.style.display = 'none';
      wechatContainer.style.display = 'block';
      updateWechatTime();
    }
    // 点击邮箱图标
    if (appName === 'mail') {
      homescreenContainer.style.display = 'none';
      mailContainer.style.display = 'block';
      updateMailTime();
    }
    // 点击电话图标
    if (appName === 'phone' || appName === 'phone-dock') {
      homescreenContainer.style.display = 'none';
      phoneContainer.style.display = 'block';
      updatePhoneTime();
    }

        if (appName === 'weather') {
      homescreenContainer.style.display = 'none';
      weatherContainer.style.display = 'block';
      updateWeatherTime();
    }

        if (appName === 'notes') {
      homescreenContainer.style.display = 'none';
      notesContainer.style.display = 'block';
      updateNotesTime();
    }


  });
});

// ================================================================
// 微信界面逻辑
// ================================================================

// 微信返回按钮
const wechatBackBtn = document.getElementById('wechatBackBtn');
if (wechatBackBtn) {
  wechatBackBtn.addEventListener('click', () => {
    wechatContainer.style.display = 'none';
    homescreenContainer.style.display = 'block';
  });
}

// 微信时间更新
function updateWechatTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeDisplay = document.getElementById('wechatTime');
  if (timeDisplay) {
    timeDisplay.textContent = `${hours}:${minutes}`;
  }
}

// 新闻时间更新
function updateNewsTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeDisplay = document.getElementById('newsTime');
  if (timeDisplay) {
    timeDisplay.textContent = `${hours}:${minutes}`;
  }
}

// 聊天项点击（只写一次）
const newsContainer = document.getElementById('newsContainer');

document.querySelectorAll('.chat-item').forEach(chat => {
  chat.addEventListener('click', () => {
    const chatName = chat.dataset.chat;
    
    if (chatName === '新闻资讯') {
      wechatContainer.style.display = 'none';
      newsContainer.style.display = 'block';
      updateNewsTime();
    }
    
    if (chatName === '老师') {
      wechatContainer.style.display = 'none';
      teacherChatContainer.style.display = 'block';
      updateTeacherChatTime();
      // 滚动到最底部
      const teacherMessages = document.getElementById('teacherMessages');
      if (teacherMessages) {
        teacherMessages.scrollTop = teacherMessages.scrollHeight;
      }
    }

        if (chatName === '信乐律师') {
      wechatContainer.style.display = 'none';
      shinobiChatContainer.style.display = 'block';
      updateShinobiChatTime();
    }


  });
});


// 新闻返回按钮
const newsBackBtn = document.getElementById('newsBackBtn');
if (newsBackBtn) {
  newsBackBtn.addEventListener('click', () => {
    newsContainer.style.display = 'none';
    wechatContainer.style.display = 'block';
  });
}


// ================================================================
// 邮箱界面逻辑
// ================================================================
const mailContainer = document.getElementById('mailContainer');

// 邮箱时间更新
function updateMailTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeDisplay = document.getElementById('mailTime');
  if (timeDisplay) {
    timeDisplay.textContent = `${hours}:${minutes}`;
  }
}

// 邮箱返回按钮
const mailBackBtn = document.getElementById('mailBackBtn');
if (mailBackBtn) {
  mailBackBtn.addEventListener('click', () => {
    mailContainer.style.display = 'none';
    homescreenContainer.style.display = 'block';
  });
}

// 邮箱登录按钮
const mailLoginBtn = document.getElementById('mailLoginBtn');
const mailError = document.getElementById('mailError');

if (mailLoginBtn) {
  mailLoginBtn.addEventListener('click', () => {
    const address = document.getElementById('mailAddress').value.trim();
    const password = document.getElementById('mailPassword').value;

    if (!address) {
      mailError.textContent = '请输入邮箱地址';
      return;
    }
    if (!password) {
      mailError.textContent = '请输入密码';
      return;
    }

    // 这里只是示例验证，你可以改成任意密码
    if (password === 'dl6') {
      mailError.textContent = '';
      alert('登录成功！\n（后续可以跳转到收件箱）');
    } else {
      mailError.textContent = '密码错误，请重试';
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
  });
}

// ================================================================
// 电话界面逻辑
// ================================================================
const phoneContainer = document.getElementById('phoneContainer');

// 电话时间更新
function updatePhoneTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeDisplay = document.getElementById('phoneTime');
  if (timeDisplay) {
    timeDisplay.textContent = `${hours}:${minutes}`;
  }
}

// 电话返回按钮
const phoneBackBtn = document.getElementById('phoneBackBtn');
if (phoneBackBtn) {
  phoneBackBtn.addEventListener('click', () => {
    phoneContainer.style.display = 'none';
    homescreenContainer.style.display = 'block';
  });
}
// ========== 标签切换 ==========
document.querySelectorAll('.phone-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    document.querySelectorAll('.phone-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    document.querySelectorAll('.phone-tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
  });
});

// ========== 拨号盘 ==========
const dialInput = document.getElementById('dialInput');
let dialNumber = '';

document.querySelectorAll('.dial-key').forEach(key => {
  key.addEventListener('click', () => {
    const digit = key.dataset.key;
    dialNumber += digit;
    dialInput.value = dialNumber;
  });
});

const dialDeleteBtn = document.getElementById('dialDeleteBtn');
if (dialDeleteBtn) {
  dialDeleteBtn.addEventListener('click', () => {
    dialNumber = dialNumber.slice(0, -1);
    dialInput.value = dialNumber;
  });
}

// 拨号盘拨打（只有这两个号码能打通）
const dialCallBtn = document.getElementById('dialCallBtn');
const dialError = document.getElementById('dialError');

if (dialCallBtn) {
  dialCallBtn.addEventListener('click', () => {
    const cleanNumber = dialNumber.replace(/[-\s]/g, '');
    
    if (cleanNumber === '') {
      dialError.textContent = '请输入号码';
      return;
    }
    
    if (cleanNumber === '5558730579') {
      dialError.textContent = '';
      alert('📞 通话已接通');
      addHistory('检察院客服电话', '呼出');
    } else if (cleanNumber === '1285550128') {
      dialError.textContent = '';
      alert('📞 对方拒接了通话...');
      addHistory('未知电话', '呼出');
    } else {
      dialError.textContent = '号码不存在';
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    }
  });
}

// ========== 通讯录拨打（没有号码，但都能拨通） ==========
document.querySelectorAll('.contact-item').forEach(contact => {
  contact.addEventListener('click', () => {
    const name = contact.dataset.name;
    
    // 切换到拨号标签
    document.querySelectorAll('.phone-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.phone-tab[data-tab="dial"]').classList.add('active');
    document.querySelectorAll('.phone-tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('dialTab').classList.add('active');
    
    dialError.textContent = '';
    alert(`📞 正在呼叫 ${name}...\n（通话已接通）`);
    addHistory(name, '呼出');
  });
});

// ========== 通话记录 ==========
function addHistory(name, type) {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
    const month = 12;
  const day = 23;
  const timeStr = `${hours}:${minutes} ${month}/${day}`;
  
  const avatarColors = {
    '老师': 'red',
    '冥': 'purple',
    '成步堂': 'blue',
    '绫里真宵': 'pink',
    '严徒海慈': 'gray',
    '糸锯圭介': 'green',
    '父亲': 'dark',
    '检察院客服电话': 'gray',
    '未知电话': 'dark'
  };
  
  const avatarChar = name.charAt(0);
  const avatarColor = avatarColors[name] || 'gray';
  
  const historyList = document.getElementById('historyList');
  const newItem = document.createElement('div');
  newItem.className = 'history-item';
  newItem.style.cssText = 'background: #1a1a2e;';
  newItem.innerHTML = `
    <div class="history-avatar ${avatarColor}">${avatarChar}</div>
    <div class="history-info">
      <span class="history-name">${name}</span>
      <span class="history-type">📞 ${type}</span>
    </div>
    <div class="history-time">${timeStr}</div>
  `;
  
  historyList.insertBefore(newItem, historyList.firstChild);
  
  setTimeout(() => {
    newItem.style.background = '';
    newItem.style.transition = 'background 1s ease';
  }, 2000);
}

// ================================================================
// 老师聊天界面
// ================================================================
const teacherChatContainer = document.getElementById('teacherChatContainer');

// 老师聊天时间更新
function updateTeacherChatTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeDisplay = document.getElementById('teacherChatTime');
  if (timeDisplay) {
    timeDisplay.textContent = `${hours}:${minutes}`;
  }
}

// 老师聊天返回按钮
const teacherChatBackBtn = document.getElementById('teacherChatBackBtn');
if (teacherChatBackBtn) {
  teacherChatBackBtn.addEventListener('click', () => {
    teacherChatContainer.style.display = 'none';
    wechatContainer.style.display = 'block';
  });
}

// ================================================================
// 信乐律师聊天界面
// ================================================================
const shinobiChatContainer = document.getElementById('shinobiChatContainer');

function updateShinobiChatTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeDisplay = document.getElementById('shinobiChatTime');
  if (timeDisplay) {
    timeDisplay.textContent = `${hours}:${minutes}`;
  }
}

const shinobiChatBackBtn = document.getElementById('shinobiChatBackBtn');
if (shinobiChatBackBtn) {
  shinobiChatBackBtn.addEventListener('click', () => {
    shinobiChatContainer.style.display = 'none';
    wechatContainer.style.display = 'block';
  });
}


// ================================================================
// 天气界面
// ================================================================
const weatherContainer = document.getElementById('weatherContainer');

function updateWeatherTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeDisplay = document.getElementById('weatherTime');
  if (timeDisplay) {
    timeDisplay.textContent = `${hours}:${minutes}`;
  }
}

const weatherBackBtn = document.getElementById('weatherBackBtn');
if (weatherBackBtn) {
  weatherBackBtn.addEventListener('click', () => {
    weatherContainer.style.display = 'none';
    homescreenContainer.style.display = 'block';
  });
}

// ================================================================
// 备忘录界面
// ================================================================
const notesContainer = document.getElementById('notesContainer');

function updateNotesTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeDisplay = document.getElementById('notesTime');
  if (timeDisplay) {
    timeDisplay.textContent = `${hours}:${minutes}`;
  }
}

const notesBackBtn = document.getElementById('notesBackBtn');
if (notesBackBtn) {
  notesBackBtn.addEventListener('click', () => {
    notesContainer.style.display = 'none';
    homescreenContainer.style.display = 'block';
  });
}
























