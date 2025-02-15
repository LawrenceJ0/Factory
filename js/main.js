// 全局状态管理
const state = {
    messages: [],
    myAvatar: null,
    theirAvatar: null,
    theirName: '联系人',
    chatTime: '09:41'
};

// DOM 元素
const elements = {
    myAvatar: document.getElementById('myAvatar'),
    theirAvatar: document.getElementById('theirAvatar'),
    myAvatarPreview: document.getElementById('myAvatarPreview'),
    theirAvatarPreview: document.getElementById('theirAvatarPreview'),
    theirName: document.getElementById('theirName'),
    chatTime: document.getElementById('chatTime'),
    messageList: document.getElementById('messageList'),
    addMessageBtn: document.getElementById('addMessage'),
    chatArea: document.getElementById('chatArea'),
    previewName: document.getElementById('previewName'),
    previewAvatar: document.getElementById('previewAvatar'),
    exportImageBtn: document.getElementById('exportImage'),
    exportConfigBtn: document.getElementById('exportConfig'),
    importConfigBtn: document.getElementById('importButton'),
    importConfigInput: document.getElementById('importConfig')
};

// 初始化
function init() {
    // 加载本地存储的数据
    loadFromLocalStorage();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始渲染
    render();
}

// 绑定事件监听器
function bindEventListeners() {
    // 头像上传
    elements.myAvatar.addEventListener('change', handleAvatarUpload.bind(null, 'my'));
    elements.theirAvatar.addEventListener('change', handleAvatarUpload.bind(null, 'their'));
    
    // 昵称修改
    elements.theirName.addEventListener('input', handleNameChange);
    
    // 时间修改
    elements.chatTime.addEventListener('change', handleTimeChange);
    
    // 添加消息
    elements.addMessageBtn.addEventListener('click', handleAddMessage);
    
    // 导出功能
    elements.exportImageBtn.addEventListener('click', handleExportImage);
    elements.exportConfigBtn.addEventListener('click', handleExportConfig);
    elements.importConfigBtn.addEventListener('click', () => elements.importConfigInput.click());
    elements.importConfigInput.addEventListener('change', handleImportConfig);
}

// 处理头像上传
async function handleAvatarUpload(type, event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const dataUrl = await readFileAsDataURL(file);
        if (type === 'my') {
            state.myAvatar = dataUrl;
        } else {
            state.theirAvatar = dataUrl;
        }
        saveToLocalStorage();
        render();
    } catch (error) {
        console.error('头像上传失败:', error);
        alert('头像上传失败，请重试');
    }
}

// 处理昵称修改
function handleNameChange(event) {
    state.theirName = event.target.value || '联系人';
    saveToLocalStorage();
    render();
}

// 处理时间修改
function handleTimeChange(event) {
    state.chatTime = event.target.value;
    saveToLocalStorage();
    render();
}

// 处理添加消息
function handleAddMessage() {
    const messageItem = createMessageItem();
    elements.messageList.appendChild(messageItem);
    
    // 添加到状态
    state.messages.push({
        text: '',
        sender: 'me',
        time: getCurrentTime()
    });
    
    saveToLocalStorage();
    render();
}

// 创建消息编辑项
function createMessageItem(message = { text: '', sender: 'me', time: getCurrentTime() }, index = state.messages.length) {
    const div = document.createElement('div');
    div.className = 'message-item';
    
    const textarea = document.createElement('textarea');
    textarea.value = message.text;
    textarea.placeholder = '输入消息内容...';
    textarea.addEventListener('input', (e) => {
        state.messages[index].text = e.target.value;
        saveToLocalStorage();
        render();
    });
    
    const controls = document.createElement('div');
    controls.className = 'message-controls';
    
    const senderSelect = document.createElement('select');
    senderSelect.innerHTML = `
        <option value="me" ${message.sender === 'me' ? 'selected' : ''}>我</option>
        <option value="them" ${message.sender === 'them' ? 'selected' : ''}>对方</option>
    `;
    senderSelect.addEventListener('change', (e) => {
        state.messages[index].sender = e.target.value;
        saveToLocalStorage();
        render();
    });
    
    const timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.value = message.time;
    timeInput.addEventListener('change', (e) => {
        state.messages[index].time = e.target.value;
        saveToLocalStorage();
        render();
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => {
        state.messages.splice(index, 1);
        div.remove();
        saveToLocalStorage();
        render();
    });
    
    controls.append(senderSelect, timeInput, deleteBtn);
    div.append(textarea, controls);
    
    // 使消息可拖拽
    div.draggable = true;
    div.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index);
    });
    
    div.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    div.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = index;
        
        if (fromIndex !== toIndex) {
            const message = state.messages.splice(fromIndex, 1)[0];
            state.messages.splice(toIndex, 0, message);
            saveToLocalStorage();
            render();
        }
    });
    
    return div;
}

// 渲染预览
function render() {
    // 更新预览区域
    elements.previewName.textContent = state.theirName;
    document.querySelector('.status-bar .time').textContent = state.chatTime;
    
    // 渲染头像预览
    if (state.theirAvatar) {
        elements.previewAvatar.style.backgroundImage = `url(${state.theirAvatar})`;
        elements.theirAvatarPreview.style.backgroundImage = `url(${state.theirAvatar})`;
    }
    
    if (state.myAvatar) {
        elements.myAvatarPreview.style.backgroundImage = `url(${state.myAvatar})`;
    }
    
    // 渲染消息列表
    elements.messageList.innerHTML = '';
    state.messages.forEach((message, index) => {
        elements.messageList.appendChild(createMessageItem(message, index));
    });
    
    // 渲染聊天区域
    elements.chatArea.innerHTML = '';
    state.messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender === 'me' ? 'sent' : 'received'}`;
        messageDiv.innerHTML = `
            ${message.text}
            <span class="message-time">${message.time}</span>
        `;
        elements.chatArea.appendChild(messageDiv);
    });
}

// 导出图片
async function handleExportImage() {
    try {
        const canvas = await html2canvas(document.querySelector('.whatsapp-container'));
        const link = document.createElement('a');
        link.download = 'whatsapp-chat.png';
        link.href = canvas.toDataURL();
        link.click();
    } catch (error) {
        console.error('导出图片失败:', error);
        alert('导出图片失败，请重试');
    }
}

// 导出配置
function handleExportConfig() {
    const config = {
        messages: state.messages,
        myAvatar: state.myAvatar,
        theirAvatar: state.theirAvatar,
        theirName: state.theirName,
        chatTime: state.chatTime
    };
    
    const blob = new Blob([JSON.stringify(config)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'whatsapp-config.json';
    link.href = URL.createObjectURL(blob);
    link.click();
}

// 导入配置
async function handleImportConfig(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const config = JSON.parse(await readFileAsText(file));
        Object.assign(state, config);
        saveToLocalStorage();
        render();
    } catch (error) {
        console.error('导入配置失败:', error);
        alert('导入配置失败，请确保文件格式正确');
    }
}

// 工具函数
function getCurrentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// 本地存储
function saveToLocalStorage() {
    localStorage.setItem('whatsapp-state', JSON.stringify(state));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('whatsapp-state');
    if (saved) {
        Object.assign(state, JSON.parse(saved));
    }
}

// 初始化应用
init(); 