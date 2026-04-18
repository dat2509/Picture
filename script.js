// ========== HỆ THỐNG TÀI KHOẢN ==========
let currentUser = null;
const USERS_STORAGE_KEY = 'memory_app_users';

// Cấu trúc user: { username, password, displayName, createdAt, albums, photos }

// Khởi tạo users trong localStorage
function initUsers() {
    if (!localStorage.getItem(USERS_STORAGE_KEY)) {
        const defaultUsers = {
            'admin': {
                username: 'admin',
                password: 'admin123',
                displayName: 'Quản trị viên',
                createdAt: Date.now()
            }
        };
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    }
}

// Lấy danh sách users
function getUsers() {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : {};
}

// Lưu users
function saveUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// Đăng ký tài khoản mới
function register(username, password, displayName) {
    const users = getUsers();
    
    // Kiểm tra username đã tồn tại
    if (users[username]) {
        return { success: false, message: 'Tên đăng nhập đã tồn tại!' };
    }
    
    // Kiểm tra độ dài
    if (username.length < 3 || username.length > 20) {
        return { success: false, message: 'Tên đăng nhập phải từ 3-20 ký tự!' };
    }
    
    if (password.length < 6) {
        return { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự!' };
    }
    
    // Tạo user mới
    users[username] = {
        username: username,
        password: password,
        displayName: displayName || username,
        createdAt: Date.now()
    };
    
    saveUsers(users);
    
    // Tạo dữ liệu mặc định cho user mới (album và ảnh)
    initializeUserData(username);
    
    return { success: true, message: 'Đăng ký thành công!' };
}

// Khởi tạo dữ liệu mặc định cho user mới
function initializeUserData(username) {
    const userDataKey = `user_data_${username}`;
    if (!localStorage.getItem(userDataKey)) {
        const defaultData = {
            albums: [
                { id: 'default_1', name: '📘 Kỷ niệm chung', createdAt: Date.now() },
                { id: 'default_2', name: '✈️ Du lịch 2024', createdAt: Date.now() + 1000 },
                { id: 'default_3', name: '🎉 Sinh nhật', createdAt: Date.now() + 2000 }
            ],
            photos: [],
            currentAlbumId: null
        };
        localStorage.setItem(userDataKey, JSON.stringify(defaultData));
    }
}

// Đăng nhập
function login(username, password) {
    const users = getUsers();
    const user = users[username];
    
    if (!user) {
        return { success: false, message: 'Tên đăng nhập không tồn tại!' };
    }
    
    if (user.password !== password) {
        return { success: false, message: 'Mật khẩu không chính xác!' };
    }
    
    currentUser = user;
    // Lưu session
    sessionStorage.setItem('currentUser', JSON.stringify({ username: user.username }));
    
    return { success: true, message: 'Đăng nhập thành công!' };
}

// Đăng xuất
function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    // Reload lại trang để hiện màn hình đăng nhập
    location.reload();
}

// Kiểm tra session
function checkSession() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        const users = getUsers();
        if (users[userData.username]) {
            currentUser = users[userData.username];
            return true;
        }
    }
    return false;
}

// ========== DỮ LIỆU USER ==========
let albums = [];
let photos = [];
let currentAlbumId = null;

// Lấy key lưu dữ liệu của user hiện tại
function getUserDataKey() {
    if (!currentUser) return null;
    return `user_data_${currentUser.username}`;
}

// Lưu dữ liệu user
function saveUserData() {
    const key = getUserDataKey();
    if (!key) return;
    
    const userData = {
        albums: albums,
        photos: photos,
        currentAlbumId: currentAlbumId
    };
    localStorage.setItem(key, JSON.stringify(userData));
    updateStats();
}

// Tải dữ liệu user
function loadUserData() {
    const key = getUserDataKey();
    if (!key) return false;
    
    const stored = localStorage.getItem(key);
    if (stored) {
        const data = JSON.parse(stored);
        albums = data.albums || [];
        photos = data.photos || [];
        currentAlbumId = data.currentAlbumId || (albums.length > 0 ? albums[0].id : null);
        return true;
    }
    return false;
}

// Cập nhật thống kê
function updateStats() {
    const albumCountSpan = document.getElementById('albumCount');
    const photoCountSpan = document.getElementById('photoCount');
    if (albumCountSpan) albumCountSpan.textContent = albums.length;
    if (photoCountSpan) photoCountSpan.textContent = photos.length;
}

// Render toàn bộ giao diện
function renderAll() {
    renderAlbumTabs();
    renderPhotosByAlbum();
    updateUploadAlbumSelect();
    updateStats();
}

// Render album tabs
function renderAlbumTabs() {
    const container = document.getElementById('albumTabsContainer');
    if (!container) return;
    
    if (albums.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:2rem;">✨ Chưa có album nào. Hãy tạo album mới để lưu giữ kỷ niệm!</div>';
        return;
    }
    
    container.innerHTML = '';
    albums.forEach(album => {
        const photoCount = photos.filter(p => p.albumId === album.id).length;
        const tab = document.createElement('div');
        tab.className = 'album-tab';
        if (currentAlbumId === album.id) tab.classList.add('active');
        tab.innerHTML = `
            <span class="album-name">${escapeHtml(album.name)}</span>
            <span class="album-count">${photoCount}</span>
            <span class="edit-album-btn" data-id="${album.id}" title="Sửa tên album">✏️</span>
            <span class="delete-album-btn" data-id="${album.id}" title="Xóa album">🗑️</span>
        `;
        
        tab.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-album-btn') || 
                e.target.classList.contains('edit-album-btn')) return;
            currentAlbumId = album.id;
            saveUserData();
            renderAll();
        });
        container.appendChild(tab);
    });

    document.querySelectorAll('.delete-album-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const albumId = btn.getAttribute('data-id');
            if (albumId) deleteAlbumById(albumId);
        });
    });
    
    document.querySelectorAll('.edit-album-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const albumId = btn.getAttribute('data-id');
            if (albumId) openEditAlbumModal(albumId);
        });
    });
}

// Xóa album
function deleteAlbumById(albumId) {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;
    const photoCount = photos.filter(p => p.albumId === albumId).length;
    const confirmDel = confirm(`Bạn có chắc muốn xóa album "${album.name}"?\nAlbum này có ${photoCount} ảnh. Tất cả sẽ bị xóa vĩnh viễn.`);
    if (!confirmDel) return;
    
    photos = photos.filter(p => p.albumId !== albumId);
    albums = albums.filter(a => a.id !== albumId);
    
    if (currentAlbumId === albumId) {
        currentAlbumId = albums.length > 0 ? albums[0].id : null;
    }
    saveUserData();
    renderAll();
    showUploadMessage(`✅ Đã xóa album "${album.name}" và ${photoCount} ảnh`, 2000);
}

// Tạo album mới
function createNewAlbum(albumName = null) {
    let name = albumName;
    if (!name) {
        name = prompt("Nhập tên album mới:", "🏝️ Chuyến đi vui vẻ");
        if (!name) return;
    }
    name = name.trim();
    if (name === "") name = "📸 Album mới";
    
    const newId = 'album_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const newAlbum = {
        id: newId,
        name: name,
        createdAt: Date.now()
    };
    albums.push(newAlbum);
    currentAlbumId = newId;
    saveUserData();
    renderAll();
    showUploadMessage(`✅ Đã tạo album "${name}"`, 1500);
}

// Mở modal chỉnh sửa album
function openEditAlbumModal(albumId) {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;
    window.albumToEdit = albumId;
    const input = document.getElementById('editAlbumNameInput');
    if (input) input.value = album.name;
    const modal = document.getElementById('editAlbumModal');
    if (modal) modal.style.display = 'flex';
}

// Lưu chỉnh sửa album
function saveEditAlbum() {
    if (!window.albumToEdit) return;
    const input = document.getElementById('editAlbumNameInput');
    const newName = input.value.trim();
    if (!newName) {
        showUploadMessage('⚠️ Tên album không được để trống', 1500);
        return;
    }
    const album = albums.find(a => a.id === window.albumToEdit);
    if (album) {
        album.name = newName;
        saveUserData();
        renderAll();
        showUploadMessage(`✅ Đã đổi tên album thành "${newName}"`, 1500);
    }
    closeEditModal();
}

// Mở modal quản lý album
function openManageAlbumsModal() {
    const modal = document.getElementById('manageAlbumsModal');
    if (!modal) return;
    renderAlbumsList();
    modal.style.display = 'flex';
}

// Render danh sách album trong modal
function renderAlbumsList() {
    const container = document.getElementById('albumsList');
    if (!container) return;
    
    if (albums.length === 0) {
        container.innerHTML = '<div class="empty-state">Chưa có album nào. Hãy tạo album mới!</div>';
        return;
    }
    
    container.innerHTML = '';
    albums.forEach(album => {
        const photoCount = photos.filter(p => p.albumId === album.id).length;
        const albumDiv = document.createElement('div');
        albumDiv.className = 'album-item';
        albumDiv.innerHTML = `
            <div class="album-info">
                <div class="album-name">${escapeHtml(album.name)}</div>
                <div class="album-stats">📸 ${photoCount} ảnh · ${formatDate(album.createdAt)}</div>
            </div>
            <div class="album-actions-manage">
                <button class="btn-small edit-album-manage" data-id="${album.id}">✏️ Sửa</button>
                <button class="btn-small delete-album-manage" data-id="${album.id}" style="color:#bc5a3c;">🗑️ Xóa</button>
            </div>
        `;
        container.appendChild(albumDiv);
    });
    
    document.querySelectorAll('.edit-album-manage').forEach(btn => {
        btn.addEventListener('click', () => {
            const albumId = btn.getAttribute('data-id');
            closeManageModal();
            openEditAlbumModal(albumId);
        });
    });
    
    document.querySelectorAll('.delete-album-manage').forEach(btn => {
        btn.addEventListener('click', () => {
            const albumId = btn.getAttribute('data-id');
            if (confirm('Bạn có chắc muốn xóa album này?')) {
                deleteAlbumById(albumId);
                renderAlbumsList();
            }
        });
    });
}

// Cập nhật dropdown
function updateUploadAlbumSelect() {
    const select = document.getElementById('albumSelectUpload');
    if (!select) return;
    select.innerHTML = '';
    if (albums.length === 0) {
        const option = document.createElement('option');
        option.text = '⚠️ Chưa có album, hãy tạo album trước';
        option.disabled = true;
        select.appendChild(option);
        return;
    }
    albums.forEach(album => {
        const option = document.createElement('option');
        option.value = album.id;
        option.textContent = `${album.name} (${photos.filter(p => p.albumId === album.id).length} ảnh)`;
        if (currentAlbumId === album.id) option.selected = true;
        select.appendChild(option);
    });
}

// Render ảnh theo album
function renderPhotosByAlbum() {
    const container = document.getElementById('photosContainer');
    if (!container) return;
    
    if (!currentAlbumId || albums.length === 0) {
        container.innerHTML = `<div class="empty-state">📭 Chưa có album nào. Hãy tạo album mới và đăng ảnh kỉ niệm nhé!</div>`;
        return;
    }

    const albumPhotos = photos.filter(p => p.albumId === currentAlbumId);
    if (albumPhotos.length === 0) {
        container.innerHTML = `<div class="empty-state">✨ Chưa có ảnh nào trong album này. Hãy tải ảnh lên để lưu giữ kỷ niệm!</div>`;
        return;
    }

    const sorted = [...albumPhotos].sort((a, b) => b.createdAt - a.createdAt);
    container.innerHTML = '';
    sorted.forEach(photo => {
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.innerHTML = `
            <img class="photo-img" src="${photo.dataUrl}" alt="${escapeHtml(photo.title) || 'ảnh kỷ niệm'}" loading="lazy">
            <div class="photo-info">
                <div class="photo-title">${escapeHtml(photo.title) || '📷 Không tiêu đề'}</div>
                <div class="photo-date">${formatDate(photo.createdAt)}</div>
                <div class="photo-actions">
                    <button class="icon-btn preview-btn" data-id="${photo.id}" title="Xem lớn">🔍</button>
                    <button class="icon-btn delete-photo-btn" data-id="${photo.id}" title="Xóa ảnh">🗑️</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    document.querySelectorAll('.preview-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const photoId = btn.getAttribute('data-id');
            const photo = photos.find(p => p.id === photoId);
            if (photo) showModal(photo);
        });
    });
    
    document.querySelectorAll('.delete-photo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const photoId = btn.getAttribute('data-id');
            deletePhotoById(photoId);
        });
    });
    
    document.querySelectorAll('.photo-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('icon-btn')) return;
            const img = card.querySelector('.photo-img');
            if (img && img.src) {
                const photo = photos.find(p => p.dataUrl === img.src);
                if (photo) showModal(photo);
            }
        });
    });
}

function deletePhotoById(photoId) {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;
    if (confirm('Xóa ảnh này khỏi album? Hành động không thể hoàn tác.')) {
        photos = photos.filter(p => p.id !== photoId);
        saveUserData();
        renderAll();
        showUploadMessage('🗑️ Đã xóa ảnh', 1200);
    }
}

// Upload nhiều ảnh
async function uploadMultipleImages(files, albumId, customTitle) {
    if (!albumId) {
        showUploadMessage('❌ Vui lòng chọn album trước khi đăng ảnh.', 2000);
        return 0;
    }
    if (!files || files.length === 0) return 0;
    
    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
            showUploadMessage(`⚠️ File "${file.name}" không phải ảnh, bỏ qua.`, 1500);
            continue;
        }
        if (file.size > 5 * 1024 * 1024) {
            showUploadMessage(`⚠️ Ảnh "${file.name}" > 5MB, vui lòng chọn ảnh nhỏ hơn.`, 2000);
            continue;
        }
        try {
            const dataUrl = await readFileAsDataURL(file);
            let title = customTitle ? customTitle.trim() : '';
            if (!title) {
                let baseName = file.name.replace(/\.[^/.]+$/, "");
                title = baseName.length > 30 ? baseName.slice(0, 27) + '...' : baseName;
            } else if (files.length > 1 && customTitle) {
                title = `${customTitle} (${i + 1})`;
            }
            const newPhoto = {
                id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
                albumId: albumId,
                title: title,
                dataUrl: dataUrl,
                createdAt: Date.now()
            };
            photos.push(newPhoto);
            successCount++;
            await delay(50);
        } catch (err) {
            console.error(err);
            showUploadMessage(`Lỗi đọc file ${file.name}`, 1200);
        }
    }
    if (successCount > 0) {
        saveUserData();
        renderAll();
        showUploadMessage(`✅ Đã đăng thành công ${successCount} ảnh vào album!`, 2000);
    } else if (files.length > 0) {
        showUploadMessage(`⚠️ Không có ảnh hợp lệ nào được thêm.`, 1500);
    }
    return successCount;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showUploadMessage(msg, duration = 2000) {
    const msgDiv = document.getElementById('uploadMessage');
    if (msgDiv) {
        msgDiv.innerText = msg;
        setTimeout(() => {
            if (msgDiv.innerText === msg) msgDiv.innerText = '';
        }, duration);
    }
}

function showModal(photo) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const infoDiv = document.getElementById('modalImageInfo');
    if (modal && modalImg) {
        modalImg.src = photo.dataUrl;
        if (infoDiv) {
            infoDiv.innerHTML = `
                <strong>${escapeHtml(photo.title) || 'Không tiêu đề'}</strong><br>
                <small>${formatDate(photo.createdAt)}</small>
            `;
        }
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function closeEditModal() {
    closeModal('editAlbumModal');
    window.albumToEdit = null;
}

function closeManageModal() {
    closeModal('manageAlbumsModal');
}

function formatDate(timestamp) {
    const d = new Date(timestamp);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== KHỞI TẠO ỨNG DỤNG ==========
function initApp() {
    initUsers();
    
    // Kiểm tra session
    if (checkSession()) {
        // Đã đăng nhập, hiển thị app chính
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Hiển thị tên người dùng
        const displayNameSpan = document.getElementById('userDisplayName');
        if (displayNameSpan && currentUser) {
            displayNameSpan.textContent = currentUser.displayName || currentUser.username;
        }
        
        // Tải dữ liệu của user
        if (!loadUserData()) {
            initializeUserData(currentUser.username);
            loadUserData();
        }
        renderAll();
        setupEventListeners();
    } else {
        // Chưa đăng nhập, hiển thị màn hình auth
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        setupAuthEventListeners();
    }
}

function setupAuthEventListeners() {
    // Chuyển tab
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(`${tabName}Form`).classList.add('active');
        });
    });
    
    // Đăng nhập
    document.getElementById('loginBtn').addEventListener('click', () => {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            showAuthMessage('Vui lòng nhập đầy đủ thông tin!', 'error');
            return;
        }
        
        const result = login(username, password);
        if (result.success) {
            showAuthMessage(result.message, 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            showAuthMessage(result.message, 'error');
        }
    });
    
    // Đăng ký
    document.getElementById('registerBtn').addEventListener('click', () => {
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const displayName = document.getElementById('regDisplayName').value.trim();
        
        if (!username || !password) {
            showAuthMessage('Vui lòng nhập đầy đủ thông tin!', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showAuthMessage('Mật khẩu xác nhận không khớp!', 'error');
            return;
        }
        
        const result = register(username, password, displayName);
        if (result.success) {
            showAuthMessage(result.message + ' Vui lòng đăng nhập!', 'success');
            // Chuyển sang tab đăng nhập
            document.querySelector('.auth-tab[data-tab="login"]').click();
            document.getElementById('loginUsername').value = username;
            document.getElementById('loginPassword').value = '';
        } else {
            showAuthMessage(result.message, 'error');
        }
    });
    
    // Enter key
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('loginBtn').click();
    });
    document.getElementById('regConfirmPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('registerBtn').click();
    });
}

function showAuthMessage(msg, type) {
    const msgDiv = document.getElementById('authMessage');
    if (msgDiv) {
        msgDiv.textContent = msg;
        msgDiv.style.color = type === 'error' ? '#e74c3c' : '#27ae60';
        setTimeout(() => {
            msgDiv.textContent = '';
        }, 3000);
    }
}

function setupEventListeners() {
    // Các nút chính
    document.getElementById('createAlbumBtn')?.addEventListener('click', () => createNewAlbum());
    document.getElementById('manageAlbumsBtn')?.addEventListener('click', openManageAlbumsModal);
    document.getElementById('expandAllBtn')?.addEventListener('click', () => {
        document.querySelectorAll('.photo-card').forEach(card => {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // Upload
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const titleInput = document.getElementById('photoTitle');
    const albumSelect = document.getElementById('albumSelectUpload');
    
    uploadBtn?.addEventListener('click', async () => {
        const files = fileInput.files;
        if (!files || files.length === 0) {
            showUploadMessage('📸 Vui lòng chọn ít nhất một ảnh để đăng.', 1500);
            return;
        }
        let selectedAlbumId = albumSelect.value;
        if (!selectedAlbumId && albums.length > 0) {
            selectedAlbumId = albums[0].id;
        }
        if (!selectedAlbumId) {
            showUploadMessage('❌ Chưa có album nào. Hãy tạo album trước khi đăng ảnh.', 1800);
            return;
        }
        let customTitle = titleInput.value;
        await uploadMultipleImages(files, selectedAlbumId, customTitle);
        fileInput.value = '';
    });
    
    // Modal quản lý album
    const manageModal = document.getElementById('manageAlbumsModal');
    const closeManage = document.querySelector('.close-manage');
    closeManage?.addEventListener('click', () => closeManageModal());
    manageModal?.addEventListener('click', (e) => { if (e.target === manageModal) closeManageModal(); });
    
    document.getElementById('createAlbumFromModalBtn')?.addEventListener('click', () => {
        const input = document.getElementById('newAlbumNameInput');
        if (input.value.trim()) {
            createNewAlbum(input.value.trim());
            input.value = '';
            renderAlbumsList();
        } else {
            showUploadMessage('Vui lòng nhập tên album', 1500);
        }
    });
    
    // Modal chỉnh sửa album
    const editModal = document.getElementById('editAlbumModal');
    const closeEdit = document.querySelector('.close-edit');
    closeEdit?.addEventListener('click', closeEditModal);
    editModal?.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });
    document.getElementById('saveEditAlbumBtn')?.addEventListener('click', saveEditAlbum);
    document.getElementById('cancelEditBtn')?.addEventListener('click', closeEditModal);
    
    // Modal preview
    const imageModal = document.getElementById('imageModal');
    const closeImage = document.querySelector('.close-image');
    closeImage?.addEventListener('click', () => closeModal('imageModal'));
    imageModal?.addEventListener('click', (e) => { if (e.target === imageModal) closeModal('imageModal'); });
}

// Khởi chạy ứng dụng
initApp();