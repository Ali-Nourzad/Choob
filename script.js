// تنظیمات Supabase (اطلاعات خود را اینجا جایگزین کنید)
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// وضعیت‌های برنامه
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = null;
let currentProductId = null;

// --- ۱. لود اولیه داده‌ها ---
async function init() {
    await fetchProducts();
    updateCartCount();
    checkUser();
}

async function fetchProducts() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
        console.error("Error fetching products:", error);
        return;
    }
    products = data;
    renderProductGrid();
}

// --- ۲. مدیریت نمایش محصولات ---
function renderProductGrid() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(product => `
        <div onclick="openProductPage('${product.id}')" class="product-card group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
            <div class="h-52 overflow-hidden flex items-center justify-center p-4">
                <img src="${product.image_url}" class="w-full h-full object-contain transition-transform duration-500">
            </div>
            <div class="p-5">
                <h3 class="font-bold text-lg text-gray-800 truncate">${product.name}</h3>
                <p class="text-blue-600 font-bold mt-2">${Number(product.price).toLocaleString()} تومان</p>
                <button onclick="event.stopPropagation(); addToCart('${product.id}')" 
                        class="mt-4 w-full bg-gray-100 group-hover:bg-blue-600 group-hover:text-white text-gray-800 py-2 rounded-xl transition-colors">
                    افزودن به سبد
                </button>
            </div>
        </div>
    `).join('');
}

// --- ۳. مدیریت صفحه جزئیات محصول (SPA Logic) ---
async function openProductPage(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    currentProductId = id;
    document.getElementById('detail-title').innerText = product.name;
    document.getElementById('detail-price').innerText = `${Number(product.price).toLocaleString()} تومان`;
    document.getElementById('detail-description').innerText = product.description || 'توضیحاتی برای این محصول ثبت نشده است.';
    document.getElementById('main-product-img').src = product.image_url;
    
    // دکمه افزودن به سبد در صفحه جزئیات
    document.getElementById('detail-add-to-cart').onclick = () => addToCart(product.id);

    // مدیریت تصاویر (اگر چند تصویر وجود داشته باشد)
    const thumbContainer = document.getElementById('product-image-thumbnails');
    thumbContainer.innerHTML = '';
    
    // فرض می‌کنیم تصاویر در فیلد images به صورت آرایه هستند
    const images = product.images || [product.image_url];
    images.forEach(imgUrl => {
        const img = document.createElement('img');
        img.src = imgUrl;
        img.className = "w-20 h-20 object-contain bg-gray-100 rounded-lg cursor-pointer border-2 border-transparent hover:border-blue-500";
        img.onclick = () => {
            document.getElementById('main-product-img').src = imgUrl;
        };
        thumbContainer.appendChild(img);
    });

    // لود نظرات
    loadReviews(id);

    // نمایش صفحه
    document.getElementById('product-detail-page').classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // جلوگیری از اسکرول صفحه اصلی
}

function closeProductPage() {
    document.getElementById('product-detail-page').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// --- ۴. مدیریت سبد خرید ---
function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    updateCartCount();
    
    // نمایش افکت کوچک (اختیاری)
    console.log("Added to cart:", product.name);
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').innerText = count;
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) renderCartItems();
}

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 mt-10">سبد خرید خالی است</p>';
        totalEl.innerText = '۰ تومان';
        return;
    }

    let total = 0;
// ادامه تابع renderCartItems
    list.innerHTML = cart.map((item, index) => `
        <div class="flex items-center gap-4 bg-gray-50 p-3 rounded-xl">
            <img src="${item.image_url}" class="w-16 h-16 object-contain bg-white rounded-lg">
            <div class="flex-1">
                <h4 class="font-bold text-sm">${item.name}</h4>
                <p class="text-xs text-blue-600">${Number(item.price).toLocaleString()} تومان</p>
                <div class="flex items-center gap-2 mt-2">
                    <button onclick="updateQty('${item.id}', -1)" class="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">-</button>
                    <span class="text-xs">${item.quantity}</span>
                    <button onclick="updateQty('${item.id}', 1)" class="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">+</button>
                </div>
            </div>
            <button onclick="removeFromCart('${item.id}')" class="text-red-400 hover:text-red-600 text-xl">&times;</button>
        </div>
    `).join('');
    totalEl.innerText = `${total.toLocaleString()} تومان`;
}

// مدیریت تعداد و حذف از سبد
function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) return removeFromCart(id);
        saveCart();
        updateCartCount();
        renderCartItems();
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartCount();
    renderCartItems();
}

// --- ۵. مدیریت نظرات (Reviews) ---
async function loadReviews(productId) {
    const list = document.getElementById('reviews-list');
    const formContainer = document.getElementById('review-form-container');
    
    // نمایش فرم فقط اگر کاربر وارد شده باشد
    if (currentUser) {
        formContainer.classList.remove('hidden');
    } else {
        formContainer.innerHTML = `<p class="text-center text-gray-500 italic">برای ثبت نظر، ابتدا <button onclick="openAuthModal()" class="text-blue-600 underline">وارد شوید</button>.</p>`;
    }

    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name)') // فرض بر این است که پروفایل کاربر را هم می‌خواهید
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = '<p class="text-red-500">خطا در بارگذاری نظرات</p>';
        return;
    }

    if (reviews.length === 0) {
        list.innerHTML = '<p class="text-gray-400 text-center">هنوز نظری ثبت نشده است.</p>';
        return;
    }

    list.innerHTML = reviews.map(rev => `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div class="flex justify-between items-center mb-3">
                <span class="font-bold text-blue-600">${rev.user_name || 'کاربر مهمان'}</span>
                <span class="text-xs text-gray-400">${new Date(rev.created_at).toLocaleDateString('fa-IR')}</span>
            </div>
            <p class="text-gray-700 leading-relaxed">${rev.comment}</p>
        </div>
    `).join('');
}

async function submitReview() {
    const text = document.getElementById('review-text').value.trim();
    if (!text) return alert("لطفاً نظر خود را بنویسید");
    if (!currentUser) return alert("ابتدا باید وارد حساب خود شوید");

    const { error } = await supabase
        .from('reviews')
        .insert([{ 
            product_id: currentProductId, 
            comment: text, 
            user_id: currentUser.id,
            user_name: currentUser.email // یا نام واقعی کاربر از پروفایل
        }]);

    if (error) {
        alert("خطا در ثبت نظر");
        console.error(error);
    } else {
        document.getElementById('review-text').value = '';
        loadReviews(currentProductId); // بازسازی لیست نظرات
    }
}

// --- ۶. مدیریت احراز هویت (Auth) ---
function openAuthModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
}

function toggleAuthModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        alert("خطا در ورود: " + error.message);
    } else {
        currentUser = data.user;
        updateUserUI();
        toggleAuthModal();
    }
}

async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
        updateUserUI();
    }
}

function updateUserUI() {
    const userSection = document.getElementById('user-section');
    if (currentUser) {
        userSection.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-gray-700">${currentUser.email.split('@')[0]}</span>
                <button onclick="handleLogout()" class="text-sm text-red-500 underline">خروج</button>
            </div>
        `;
    } else {
        userSection.innerHTML = `<button onclick="openAuthModal()" class="text-gray-600 hover:text-blue-600 font-medium">ورود / ثبت‌نام</button>`;
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    currentUser = null;
    updateUserUI();
}
