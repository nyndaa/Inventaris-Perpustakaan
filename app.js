/**
 * LibriKeep - Core Application Logic
 * Implements CRUD, Search, Filter, Sort, Theme Switcher, and LocalStorage Sync.
 */

// ==========================================================================
// 1. Initial Mock Data
// ==========================================================================
const DEFAULT_BOOKS = [
    {
        id: "book-1",
        title: "Atomic Habits",
        author: "James Clear",
        publisher: "Penguin Random House",
        year: 2018,
        isbn: "978-1-84-794183-1",
        stock: 8,
        category: "Non-Fiksi",
        cover: "images/atomicHabits.jpg"
    },
    {
        id: "book-2",
        title: "Ikigai",
        author: "Héctor García & Francesc Miralles",
        publisher: "Penguin Books",
        year: 2016,
        isbn: "978-0-14-313072-7",
        stock: 15,
        category: "Non-Fiksi",
        cover: "images/ikigai.jpg"
    },
    {
        id: "book-3",
        title: "Mindset",
        author: "Carol S. Dweck",
        publisher: "Robinson",
        year: 2017,
        isbn: "978-1-47-213995-5",
        stock: 2, // Low stock alert
        category: "Pendidikan",
        cover: "images/mindset.jpg"
    },
    {
        id: "book-4",
        title: "From Zero to Millionaire",
        author: "Bodo Schäfer",
        publisher: "Elex Media Komputindo",
        year: 2020,
        isbn: "978-623-00-1736-0",
        stock: 5,
        category: "Pendidikan",
        cover: "images/fromZeroToMillionaire.jpg"
    },
    {
        id: "book-5",
        title: "Almendra",
        author: "Sohn Won-pyung",
        publisher: "HarperVia",
        year: 2020,
        isbn: "978-0-06-296111-2",
        stock: 1, // Critical stock
        category: "Fiksi",
        cover: "images/almendra.jpg"
    }
];

// Color palettes for auto-generated covers
const CATEGORY_GRADIENTS = {
    "Fiksi": "linear-gradient(135deg, #ec4899, #8b5cf6)", // Pink to Violet
    "Non-Fiksi": "linear-gradient(135deg, #3b82f6, #06b6d4)", // Blue to Cyan
    "Sains & Teknologi": "linear-gradient(135deg, #14b8a6, #0f766e)", // Teal to Deep Teal
    "Sejarah & Budaya": "linear-gradient(135deg, #f59e0b, #d97706)", // Amber to Brown
    "Biografi": "linear-gradient(135deg, #84cc16, #10b981)", // Lime to Emerald
    "Pendidikan": "linear-gradient(135deg, #6366f1, #3b82f6)", // Indigo to Blue
    "Default": "linear-gradient(135deg, #6b7280, #374151)" // Slate to Zinc
};

// ==========================================================================
// 2. State & Constants
// ==========================================================================
let books = [];
let bookIdToDelete = null;

// ==========================================================================
// 3. DOM Elements Setup
// ==========================================================================
// Navigation & Theme
const themeToggleBtn = document.getElementById("theme-toggle");
const themeText = document.getElementById("theme-text");
const sidebarDashboardBtn = document.getElementById("sidebar-dashboard-btn");
const sidebarAddBtn = document.getElementById("sidebar-add-btn");

// Header Actions
const addBookTrigger = document.getElementById("add-book-trigger");

// Stats Counters
const statTotalTitles = document.getElementById("stat-total-titles");
const statTotalStock = document.getElementById("stat-total-stock");
const statLowStock = document.getElementById("stat-low-stock");
const statCategories = document.getElementById("stat-categories");

// Search & Filters controls
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
const filterCategory = document.getElementById("filter-category");
const sortBySelect = document.getElementById("sort-by");
const viewGridBtn = document.getElementById("view-grid");
const viewTableBtn = document.getElementById("view-table");
const resetFiltersBtn = document.getElementById("reset-filters-btn");

// Displays container
const booksGridView = document.getElementById("books-grid-view");
const booksTableView = document.getElementById("books-table-view");
const booksTableBody = document.getElementById("books-table-body");
const emptyStateView = document.getElementById("empty-state-view");

// Form Modal Elements
const bookModal = document.getElementById("book-modal");
const modalTitle = document.getElementById("modal-title");
const bookForm = document.getElementById("book-form");
const closeBookModalBtn = document.getElementById("close-modal-btn");
const cancelBookModalBtn = document.getElementById("cancel-modal-btn");
const bookCategorySelect = document.getElementById("book-category");
const customCategoryGroup = document.getElementById("custom-category-group");
const bookCustomCategoryInput = document.getElementById("book-custom-category");

// Delete Modal Elements
const deleteModal = document.getElementById("delete-modal");
const deleteBookTitleSpan = document.getElementById("delete-book-title");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");

// Toast Container
const toastContainer = document.getElementById("toast-container");

// Login & Authentication Elements
const loginOverlay = document.getElementById("login-overlay");
const loginForm = document.getElementById("login-form");
const loginUsernameInput = document.getElementById("login-username");
const loginPasswordInput = document.getElementById("login-password");
const loginPasswordToggle = document.getElementById("login-password-toggle");
const loginGeneralError = document.getElementById("login-general-error");
const logoutBtn = document.getElementById("logout-btn");

// Sidebar Toggle Elements
const appSidebar = document.getElementById("app-sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const mobileSidebarToggle = document.getElementById("mobile-sidebar-toggle");
const sidebarOverlay = document.getElementById("sidebar-overlay");

// ==========================================================================
// 4. Initialisation & Core Operations
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // 0. Auth Guard Setup
    checkAuth();

    // 1. Theme setup
    initTheme();

    // 2. Load books data
    loadBooks();

    // 3. Build category filter list
    populateCategoryFilters();

    // 4. Render main layout
    renderDashboard();

    // 5. Initialize Lucide Icons
    lucide.createIcons();

    // 6. Bind Event Listeners
    bindEvents();
});

function loadBooks() {
    const stored = localStorage.getItem("librikeep_books");
    
    // Explicit fail-safe check: reset database if it contains old book titles
    let needsReset = false;
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                const oldTitles = ["Bumi", "Laskar Pelangi", "Filosofi Teras", "Cosmos"];
                needsReset = parsed.some(book => oldTitles.includes(book.title));
            }
        } catch (e) {
            needsReset = true;
        }
    }
    
    if (stored && !needsReset) {
        try {
            books = JSON.parse(stored);
        } catch (e) {
            console.error("Error parsing books data, resetting to defaults", e);
            books = [...DEFAULT_BOOKS];
            saveBooks();
        }
    } else {
        // Seed data with images folder references
        books = [...DEFAULT_BOOKS];
        saveBooks();
        localStorage.setItem("librikeep_has_migrated_images_v4", "true");
    }
}

function saveBooks() {
    localStorage.setItem("librikeep_books", JSON.stringify(books));
}

function checkAuth() {
    const isLoggedIn = sessionStorage.getItem("librikeep_is_logged_in") === "true";
    if (isLoggedIn) {
        loginOverlay.classList.add("hidden");
    } else {
        loginOverlay.classList.remove("hidden");
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem("librikeep_theme") || "light";
    if (savedTheme === "light") {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        if (themeText) themeText.textContent = "Mode Terang";
    } else {
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
        if (themeText) themeText.textContent = "Mode Gelap";
    }
}

function toggleTheme() {
    if (document.body.classList.contains("dark-theme")) {
        document.body.classList.replace("dark-theme", "light-theme");
        if (themeText) themeText.textContent = "Mode Terang";
        localStorage.setItem("librikeep_theme", "light");
        showToast("Beralih ke Mode Terang", "info");
    } else {
        document.body.classList.replace("light-theme", "dark-theme");
        if (themeText) themeText.textContent = "Mode Gelap";
        localStorage.setItem("librikeep_theme", "dark");
        showToast("Beralih ke Mode Gelap", "info");
    }
    // Re-create icons to adjust color classes if any
    lucide.createIcons();
}

// ==========================================================================
// 4a. Admin Authentication Handlers
// ==========================================================================
function handleLoginSubmit(e) {
    e.preventDefault();
    
    const username = loginUsernameInput.value.trim().toLowerCase();
    const password = loginPasswordInput.value;
    
    let hasError = false;
    
    if (!username) {
        setError("login-username", true);
        hasError = true;
    } else {
        setError("login-username", false);
    }
    
    if (!password) {
        setError("login-password", true);
        hasError = true;
    } else {
        setError("login-password", false);
    }
    
    if (hasError) return;
    
    // Accept either 'nadia' or 'admin nadia' (case-insensitive checks)
    const isValidUser = (username === "nadia" || username === "admin nadia");
    const isValidPass = (password === "12345678");
    
    if (isValidUser && isValidPass) {
        sessionStorage.setItem("librikeep_is_logged_in", "true");
        loginOverlay.classList.add("hidden");
        showToast("Selamat datang kembali, Nadia!", "success");
        // Reset form
        loginForm.reset();
        clearLoginErrors();
    } else {
        loginGeneralError.style.display = "flex";
        loginPasswordInput.value = ""; // Clear password for security
    }
}

function toggleLoginPasswordVisibility() {
    const eyeIcon = loginPasswordToggle.querySelector(".eye-icon");
    const eyeOffIcon = loginPasswordToggle.querySelector(".eye-off-icon");
    
    if (loginPasswordInput.type === "password") {
        loginPasswordInput.type = "text";
        eyeIcon.style.display = "none";
        eyeOffIcon.style.display = "block";
        loginPasswordToggle.title = "Sembunyikan Password";
    } else {
        loginPasswordInput.type = "password";
        eyeIcon.style.display = "block";
        eyeOffIcon.style.display = "none";
        loginPasswordToggle.title = "Tampilkan Password";
    }
}

function handleLogout(e) {
    e.preventDefault();
    sessionStorage.removeItem("librikeep_is_logged_in");
    loginOverlay.classList.remove("hidden");
    showToast("Anda telah keluar dari akun.", "info");
}

function clearLoginErrors() {
    loginGeneralError.style.display = "none";
    setError("login-username", false);
    setError("login-password", false);
}

// ==========================================================================
// 4b. Sidebar Collapse & Mobile Slide-out Handlers
// ==========================================================================
function toggleSidebarCollapse() {
    if (window.innerWidth <= 768) {
        if (appSidebar.classList.contains("mobile-open")) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
    } else {
        const isCollapsed = appSidebar.classList.toggle("collapsed");
        document.body.classList.toggle("sidebar-collapsed-layout", isCollapsed);
        
        if (isCollapsed) {
            sidebarToggle.title = "Tampilkan Sidebar";
        } else {
            sidebarToggle.title = "Sembunyikan Sidebar";
        }
    }
}

function openMobileSidebar() {
    appSidebar.classList.add("mobile-open");
    sidebarOverlay.classList.add("active");
}

function closeMobileSidebar() {
    appSidebar.classList.remove("mobile-open");
    sidebarOverlay.classList.remove("active");
}


// ==========================================================================
// 5. Rendering Dashboard & Lists
// ==========================================================================
function renderDashboard() {
    renderStats();
    renderBookCollection();
}

function renderStats() {
    const totalTitles = books.length;
    const totalStock = books.reduce((sum, b) => sum + parseInt(b.stock || 0), 0);
    const lowStockCount = books.filter(b => parseInt(b.stock || 0) < 3).length;
    
    // Unique categories
    const categoriesSet = new Set(books.map(b => b.category).filter(Boolean));
    const totalCategories = categoriesSet.size;

    statTotalTitles.textContent = totalTitles;
    statTotalStock.textContent = totalStock;
    statLowStock.textContent = lowStockCount;
    statCategories.textContent = totalCategories;

    // Highlight low stock count in red warning state if there's any
    const lowStockCard = statLowStock.closest(".stat-card");
    if (lowStockCount > 0) {
        lowStockCard.style.borderColor = "var(--accent-rose)";
    } else {
        lowStockCard.style.borderColor = "var(--border-color)";
    }
}

// Populates category select in filters
function populateCategoryFilters(activeCategory = "all") {
    const currentCategories = Array.from(new Set(books.map(b => b.category).filter(Boolean))).sort();
    
    // Reset options but keep "Semua Kategori"
    filterCategory.innerHTML = `<option value="all">Semua Kategori</option>`;
    
    currentCategories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        if (cat === activeCategory) option.selected = true;
        filterCategory.appendChild(option);
    });
}

// Populates category options inside form
function populateFormCategories() {
    const currentCategories = Array.from(new Set(books.map(b => b.category).filter(Boolean))).sort();
    
    // Default categories in PRD
    const defaultCategories = ["Fiksi", "Non-Fiksi", "Sains & Teknologi", "Sejarah & Budaya", "Biografi", "Pendidikan"];
    const allUniqueCategories = Array.from(new Set([...defaultCategories, ...currentCategories])).sort();

    // Reset except first default placeholder
    bookCategorySelect.innerHTML = `<option value="" disabled selected>Pilih Kategori...</option>`;
    
    allUniqueCategories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        bookCategorySelect.appendChild(option);
    });

    // Add custom trigger
    const customOption = document.createElement("option");
    customOption.value = "custom";
    customOption.textContent = "+ Tambah Kategori Baru...";
    bookCategorySelect.appendChild(customOption);
}

function renderBookCollection() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    const activeCategory = filterCategory.value;
    const activeSort = sortBySelect.value;
    const viewMode = localStorage.getItem("librikeep_view_mode") || "grid";

    // Toggle view buttons active states
    if (viewMode === "grid") {
        viewGridBtn.classList.add("active");
        viewTableBtn.classList.remove("active");
        booksGridView.style.display = "grid";
        booksTableView.style.display = "none";
    } else {
        viewGridBtn.classList.remove("active");
        viewTableBtn.classList.add("active");
        booksGridView.style.display = "none";
        booksTableView.style.display = "block";
    }

    // Toggle Clear Search Button
    if (searchQuery) {
        clearSearchBtn.style.display = "block";
    } else {
        clearSearchBtn.style.display = "none";
    }

    // Filter books
    let filteredBooks = books.filter(book => {
        const matchesSearch = 
            book.title.toLowerCase().includes(searchQuery) ||
            book.author.toLowerCase().includes(searchQuery) ||
            book.isbn.toLowerCase().includes(searchQuery);
        
        const matchesCategory = activeCategory === "all" || book.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    // Sort books
    filteredBooks.sort((a, b) => {
        switch (activeSort) {
            case "title-asc":
                return a.title.localeCompare(b.title);
            case "title-desc":
                return b.title.localeCompare(a.title);
            case "stock-asc":
                return a.stock - b.stock;
            case "stock-desc":
                return b.stock - a.stock;
            case "year-desc":
                return b.year - a.year;
            case "year-asc":
                return a.year - b.year;
            case "newest":
            default:
                // Sorting by ID creation index/order or ID string
                return b.id.localeCompare(a.id);
        }
    });

    // Render logic
    if (filteredBooks.length === 0) {
        booksGridView.innerHTML = "";
        booksTableBody.innerHTML = "";
        emptyStateView.style.display = "flex";
    } else {
        emptyStateView.style.display = "none";
        if (viewMode === "grid") {
            renderGrid(filteredBooks);
        } else {
            renderTable(filteredBooks);
        }
    }

    // Initialize Lucide Icons for dynamic content
    lucide.createIcons();
}

// Generate cover background color gradient
function getCoverBackground(category, title) {
    const gradient = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS["Default"];
    return gradient;
}

// Generate book initials for fallback cover text
function getBookInitials(title) {
    if (!title) return "BK";
    const words = title.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return title.substring(0, 2).toUpperCase();
}

function renderGrid(items) {
    booksGridView.innerHTML = "";
    items.forEach(book => {
        const isLowStock = parseInt(book.stock) < 3;
        const stockText = isLowStock ? `Stok Kritis: ${book.stock}` : `Stok: ${book.stock}`;
        const stockClass = isLowStock ? 'stock-badge-critical' : 'stock-badge-normal';
        
        let coverElement = "";
        if (book.cover && book.cover.trim() !== "") {
            coverElement = `<img src="${escapeHtml(book.cover)}" alt="${escapeHtml(book.title)}" class="book-card-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        }
        
        // Dynamic fallback placeholder cover
        const bgGradient = getCoverBackground(book.category, book.title);
        const initials = getBookInitials(book.title);
        const fallbackCover = `
            <div class="book-cover-placeholder" style="background: ${bgGradient}">
                <span class="placeholder-tag">${escapeHtml(book.category)}</span>
                <div>
                    <h4 class="placeholder-title">${escapeHtml(book.title)}</h4>
                    <span class="placeholder-author">${escapeHtml(book.author)}</span>
                </div>
            </div>
        `;

        const card = document.createElement("div");
        card.className = "book-card";
        card.innerHTML = `
            <div class="book-card-cover-container">
                ${coverElement}
                ${fallbackCover}
                <span class="book-card-stock-badge ${stockClass}">${stockText}</span>
            </div>
            
            <div class="book-card-body">
                <h3 class="book-card-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
                <div class="book-card-meta">
                    <div class="meta-row">
                        <i data-lucide="user"></i>
                        <span>${escapeHtml(book.author)}</span>
                    </div>
                    <div class="meta-row">
                        <i data-lucide="building"></i>
                        <span>${escapeHtml(book.publisher)} (${book.year})</span>
                    </div>
                    <div class="meta-row">
                        <i data-lucide="barcode"></i>
                        <span style="font-family: monospace;">ISBN: ${escapeHtml(book.isbn)}</span>
                    </div>
                </div>
            </div>
            
            <div class="book-card-actions">
                <button class="btn btn-secondary btn-icon edit-btn" onclick="openEditForm('${book.id}')" title="Edit Buku">
                    <i data-lucide="edit-3"></i>
                </button>
                <button class="btn btn-secondary btn-icon delete-btn" onclick="triggerDelete('${book.id}')" title="Hapus Buku">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        booksGridView.appendChild(card);
    });
}

function renderTable(items) {
    booksTableBody.innerHTML = "";
    items.forEach(book => {
        const isLowStock = parseInt(book.stock) < 3;
        const stockClass = isLowStock ? 'critical' : '';
        const warningIcon = isLowStock ? '<i data-lucide="alert-triangle" style="width: 14px; height: 14px; color: #ffffff;"></i> ' : '';
        
        let coverElement = "";
        if (book.cover && book.cover.trim() !== "") {
            coverElement = `<img src="${escapeHtml(book.cover)}" alt="${escapeHtml(book.title)}" class="table-book-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        }
        
        const bgGradient = getCoverBackground(book.category, book.title);
        const initials = getBookInitials(book.title);
        const fallbackCover = `
            <div class="table-book-cover-placeholder" style="background: ${bgGradient}">
                ${initials}
            </div>
        `;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="table-book-title-cell">
                    <div style="position: relative; width: 44px; height: 58px; overflow: hidden; border-radius: var(--radius-xs);">
                        ${coverElement}
                        ${fallbackCover}
                    </div>
                    <div class="table-title-info">
                        <span class="table-book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</span>
                        <span class="table-book-isbn">ISBN: ${escapeHtml(book.isbn)}</span>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(book.author)}</td>
            <td>
                <span class="table-category-badge">${escapeHtml(book.category)}</span>
            </td>
            <td>${escapeHtml(book.publisher)} (${book.year})</td>
            <td style="font-family: monospace;">${escapeHtml(book.isbn)}</td>
            <td>
                <span class="table-stock-number ${stockClass}">
                    ${warningIcon}${book.stock}
                </span>
            </td>
            <td>
                <div class="table-actions-cell">
                    <button class="btn btn-secondary btn-icon edit-btn" onclick="openEditForm('${book.id}')" title="Edit">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn btn-secondary btn-icon delete-btn" onclick="triggerDelete('${book.id}')" title="Hapus">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        booksTableBody.appendChild(tr);
    });
}

// Helper to escape HTML tags to prevent XSS
function escapeHtml(string) {
    if (!string) return '';
    return String(string)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================================================
// 6. Form Handlers & CRUD Logic
// ==========================================================================
function openAddForm() {
    // Populate categories dynamic options
    populateFormCategories();

    // Reset Form fields
    bookForm.reset();
    document.getElementById("book-id").value = "";
    customCategoryGroup.style.display = "none";
    bookCustomCategoryInput.removeAttribute("required");

    // Reset Cover Component
    document.getElementById("book-cover").value = "";
    document.getElementById("book-cover-file").value = "";
    const previewImg = document.getElementById("cover-preview-img");
    const previewPlaceholder = document.getElementById("cover-preview-placeholder");
    const uploadWrapper = document.querySelector(".cover-upload-wrapper");
    
    previewImg.src = "";
    previewImg.style.display = "none";
    previewPlaceholder.style.display = "flex";
    previewPlaceholder.textContent = "No Cover";
    if (uploadWrapper) uploadWrapper.classList.remove("has-cover");

    // Reset Error Classes
    document.querySelectorAll(".form-group").forEach(el => el.classList.remove("has-error"));

    // Modal Title
    modalTitle.textContent = "Tambah Buku Baru";
    document.getElementById("save-book-btn").querySelector("span").textContent = "Simpan Buku";

    // Open Modal
    bookModal.classList.add("open");
}

function openEditForm(id) {
    const book = books.find(b => b.id === id);
    if (!book) {
        showToast("Data buku tidak ditemukan", "error");
        return;
    }

    // Populate categories
    populateFormCategories();

    // Populate fields
    document.getElementById("book-id").value = book.id;
    document.getElementById("book-title").value = book.title;
    document.getElementById("book-author").value = book.author;
    document.getElementById("book-publisher").value = book.publisher;
    document.getElementById("book-year").value = book.year;
    document.getElementById("book-isbn").value = book.isbn;
    document.getElementById("book-stock").value = book.stock;
    
    // Set Cover
    const cover = book.cover || "";
    document.getElementById("book-cover").value = cover;
    document.getElementById("book-cover-file").value = "";
    
    const previewImg = document.getElementById("cover-preview-img");
    const previewPlaceholder = document.getElementById("cover-preview-placeholder");
    const uploadWrapper = document.querySelector(".cover-upload-wrapper");

    if (cover) {
        previewImg.src = cover;
        previewImg.style.display = "block";
        previewPlaceholder.style.display = "none";
        if (uploadWrapper) uploadWrapper.classList.add("has-cover");
    } else {
        previewImg.src = "";
        previewImg.style.display = "none";
        previewPlaceholder.style.display = "flex";
        previewPlaceholder.textContent = "No Cover";
        if (uploadWrapper) uploadWrapper.classList.remove("has-cover");
    }

    // Set Category Selection
    // If it's a dynamic category not standard in default list, it's still rendered by populateFormCategories
    bookCategorySelect.value = book.category;
    customCategoryGroup.style.display = "none";
    bookCustomCategoryInput.removeAttribute("required");

    // Reset error messages
    document.querySelectorAll(".form-group").forEach(el => el.classList.remove("has-error"));

    // Modal Title
    modalTitle.textContent = "Edit Detail Buku";
    document.getElementById("save-book-btn").querySelector("span").textContent = "Simpan Perubahan";

    // Open Modal
    bookModal.classList.add("open");
    lucide.createIcons();
}

// Make accessible to onclick handlers
window.openEditForm = openEditForm;

function closeBookModal() {
    bookModal.classList.remove("open");
}

function processImageFile(file) {
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
        showToast("File yang dipilih harus berupa gambar!", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Resize Image using Canvas
            const canvas = document.createElement("canvas");
            const maxDim = 400; // maximum dimension limit
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxDim) {
                    height = Math.round(height * maxDim / width);
                    width = maxDim;
                }
            } else {
                if (height > maxDim) {
                    width = Math.round(width * maxDim / height);
                    height = maxDim;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress image to JPEG at 70% quality
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
            
            document.getElementById("book-cover").value = compressedDataUrl;
            
            const previewImg = document.getElementById("cover-preview-img");
            const previewPlaceholder = document.getElementById("cover-preview-placeholder");
            const uploadWrapper = document.querySelector(".cover-upload-wrapper");
            
            previewImg.src = compressedDataUrl;
            previewImg.style.display = "block";
            previewPlaceholder.style.display = "none";
            if (uploadWrapper) uploadWrapper.classList.add("has-cover");
            
            showToast("Foto sampul berhasil diunggah!", "success");
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function removeBookCover() {
    document.getElementById("book-cover").value = "";
    document.getElementById("book-cover-file").value = "";
    
    const previewImg = document.getElementById("cover-preview-img");
    const previewPlaceholder = document.getElementById("cover-preview-placeholder");
    const uploadWrapper = document.querySelector(".cover-upload-wrapper");
    
    previewImg.src = "";
    previewImg.style.display = "none";
    previewPlaceholder.style.display = "flex";
    previewPlaceholder.textContent = "No Cover";
    if (uploadWrapper) uploadWrapper.classList.remove("has-cover");
    
    showToast("Foto sampul dihapus.", "info");
}

function handleCategoryChange() {
    if (bookCategorySelect.value === "custom") {
        customCategoryGroup.style.display = "block";
        bookCustomCategoryInput.setAttribute("required", "required");
        bookCustomCategoryInput.focus();
    } else {
        customCategoryGroup.style.display = "none";
        bookCustomCategoryInput.removeAttribute("required");
    }
}

function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById("book-id").value;
    const title = document.getElementById("book-title").value.trim();
    const author = document.getElementById("book-author").value.trim();
    const categoryOption = bookCategorySelect.value;
    const customCategory = bookCustomCategoryInput.value.trim();
    const publisher = document.getElementById("book-publisher").value.trim();
    const yearVal = document.getElementById("book-year").value;
    const isbn = document.getElementById("book-isbn").value.trim();
    const stockVal = document.getElementById("book-stock").value;
    const cover = document.getElementById("book-cover").value.trim();

    // Validations
    let isValid = true;

    // Title validation
    if (!title) {
        setError("book-title", true);
        isValid = false;
    } else {
        setError("book-title", false);
    }

    // Author validation
    if (!author) {
        setError("book-author", true);
        isValid = false;
    } else {
        setError("book-author", false);
    }

    // Category validation
    let category = categoryOption;
    if (!categoryOption) {
        setError("book-category", true);
        isValid = false;
    } else if (categoryOption === "custom") {
        if (!customCategory) {
            setError("book-custom-category", true);
            isValid = false;
        } else {
            setError("book-custom-category", false);
            category = customCategory;
        }
        setError("book-category", false);
    } else {
        setError("book-category", false);
    }

    // Publisher validation
    if (!publisher) {
        setError("book-publisher", true);
        isValid = false;
    } else {
        setError("book-publisher", false);
    }

    // Year validation
    const year = parseInt(yearVal);
    if (isNaN(year) || year < 1000 || year > 2099) {
        setError("book-year", true);
        isValid = false;
    } else {
        setError("book-year", false);
    }

    // ISBN validation
    if (!isbn) {
        setError("book-isbn", true);
        isValid = false;
    } else {
        setError("book-isbn", false);
    }

    // Stock validation
    const stock = parseInt(stockVal);
    if (isNaN(stock) || stock < 0) {
        setError("book-stock", true);
        isValid = false;
    } else {
        setError("book-stock", false);
    }

    // Cover validation: only local uploads are allowed, no URL checking needed
    setError("book-cover", false);

    if (!isValid) return;

    if (id) {
        // Edit Mode
        const index = books.findIndex(b => b.id === id);
        if (index !== -1) {
            books[index] = { id, title, author, category, publisher, year, isbn, stock, cover };
            saveBooks();
            showToast("Informasi buku berhasil diperbarui!", "success");
        }
    } else {
        // Create Mode
        const newBook = {
            id: "book-" + Date.now(), // Safe dynamic ID generator
            title, author, category, publisher, year, isbn, stock, cover
        };
        books.unshift(newBook); // Prepend to show on top
        saveBooks();
        showToast("Buku baru berhasil ditambahkan!", "success");
    }

    // Sync categories in filters and layout
    const currentFilterCat = filterCategory.value;
    populateCategoryFilters(currentFilterCat === "all" ? "all" : (books.some(b => b.category === currentFilterCat) ? currentFilterCat : "all"));
    
    // Close modal & render
    closeBookModal();
    renderDashboard();
}

function setError(fieldId, hasError) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    const formGroup = input.closest(".form-group");
    if (hasError) {
        formGroup.classList.add("has-error");
    } else {
        formGroup.classList.remove("has-error");
    }
}

// Delete Logic trigger
function triggerDelete(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    bookIdToDelete = id;
    deleteBookTitleSpan.textContent = `"${book.title}"`;
    deleteModal.classList.add("open");
}

window.triggerDelete = triggerDelete;

function closeDeleteModal() {
    deleteModal.classList.remove("open");
    bookIdToDelete = null;
}

function executeDelete() {
    if (!bookIdToDelete) return;

    books = books.filter(b => b.id !== bookIdToDelete);
    saveBooks();

    // Check if current filter category exists, if not revert to 'all'
    const currentFilterCat = filterCategory.value;
    if (currentFilterCat !== "all" && !books.some(b => b.category === currentFilterCat)) {
        filterCategory.value = "all";
    }
    
    populateCategoryFilters(filterCategory.value);
    closeDeleteModal();
    renderDashboard();
    showToast("Buku berhasil dihapus dari inventaris.", "success");
}

// Resetting filters
function resetFilters() {
    searchInput.value = "";
    filterCategory.value = "all";
    sortBySelect.value = "newest";
    renderDashboard();
    showToast("Pencarian & Filter telah direset", "info");
}

// ==========================================================================
// 7. Toast Notifications System
// ==========================================================================
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let iconName = "check-circle";
    if (type === "info") iconName = "info";
    if (type === "error") iconName = "alert-circle";

    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${iconName}"></i>
        </div>
        <div class="toast-message">${message}</div>
    `;

    toastContainer.appendChild(toast);
    lucide.createIcons();

    // Fade out and remove
    setTimeout(() => {
        toast.classList.add("toast-fade-out");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// ==========================================================================
// 8. Event Listeners Setup
// ==========================================================================
function bindEvents() {
    // Admin Authentication Events
    loginForm.addEventListener("submit", handleLoginSubmit);
    loginPasswordToggle.addEventListener("click", toggleLoginPasswordVisibility);
    logoutBtn.addEventListener("click", handleLogout);
    loginUsernameInput.addEventListener("input", clearLoginErrors);
    loginPasswordInput.addEventListener("input", clearLoginErrors);

    // Theme Switcher
    themeToggleBtn.addEventListener("click", toggleTheme);

    // Sidebar navigation buttons
    sidebarDashboardBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeMobileSidebar();
    });

    // Sidebar Toggle Events (Desktop Collapse & Mobile Slide)
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", toggleSidebarCollapse);
    }
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener("click", openMobileSidebar);
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeMobileSidebar);
    }

    // Header Trigger
    addBookTrigger.addEventListener("click", openAddForm);

    // Add Book Form Close Buttons
    closeBookModalBtn.addEventListener("click", closeBookModal);
    cancelBookModalBtn.addEventListener("click", closeBookModal);
    bookCategorySelect.addEventListener("change", handleCategoryChange);
    bookForm.addEventListener("submit", handleFormSubmit);

    // Book Cover Image Upload / Remove Handlers
    const coverFileEl = document.getElementById("book-cover-file");
    const removeCoverBtn = document.getElementById("remove-cover-btn");
    if (coverFileEl) {
        coverFileEl.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                processImageFile(e.target.files[0]);
            }
        });
    }
    if (removeCoverBtn) {
        removeCoverBtn.addEventListener("click", removeBookCover);
    }

    // Dynamic error clearing on keyup/change
    const fields = ["book-title", "book-author", "book-category", "book-publisher", "book-year", "book-isbn", "book-stock", "book-custom-category", "book-cover"];
    fields.forEach(fid => {
        const el = document.getElementById(fid);
        if (el) {
            const eventName = el.tagName === "SELECT" ? "change" : "input";
            el.addEventListener(eventName, () => {
                setError(fid, false);
                // Also clear main cover error
                setError("book-cover", false);
            });
        }
    });

    // Delete Modals buttons
    cancelDeleteBtn.addEventListener("click", closeDeleteModal);
    confirmDeleteBtn.addEventListener("click", executeDelete);

    // Search and Filters
    searchInput.addEventListener("input", renderBookCollection);
    clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        renderBookCollection();
    });
    filterCategory.addEventListener("change", renderBookCollection);
    sortBySelect.addEventListener("change", renderBookCollection);
    resetFiltersBtn.addEventListener("click", resetFilters);

    // Layout View toggles
    viewGridBtn.addEventListener("click", () => {
        localStorage.setItem("librikeep_view_mode", "grid");
        renderBookCollection();
    });

    viewTableBtn.addEventListener("click", () => {
        localStorage.setItem("librikeep_view_mode", "table");
        renderBookCollection();
    });

    // Clicking on modal backdrop closes modal
    window.addEventListener("click", (e) => {
        if (e.target === bookModal) closeBookModal();
        if (e.target === deleteModal) closeDeleteModal();
    });
}
