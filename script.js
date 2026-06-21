// --- ۱. تنظیمات اولیه و اتصال به Supabase ---
// حتماً این مقادیر را از پنل Supabase خودتان جایگزین کنید
const SUPABASE_URL = 'https://rlduutynqgevgzmayeit.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_QQKsRmCxqZNX1dZW7bjAmA_xypPHAjD';

if (!window.supabase || !window.supabase.createClient) {
    console.log('Supabase JS library not loaded.');
}

const shopDB = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// متغیرهای سراسری برای مدیریت وضعیت برنامه
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = null;
let currentProductId = null;

// --- ۲. شروع برنامه (Initialization) ---
document.addEventListener('DOMContentLoaded', async () => {
    await fetchProducts();
    await checkUser();
    updateCartUI();
    renderCartItems(); // برای نمایش سبد خرید در صورت لود شدن مجدد صفحه
});

// --- ۳. مدیریت محصولات ---
async function fetchProducts() {
    const { data, error } = await shopDB
        .from('products')
        .select('*');

    if (error) {
        console.error('خطا در دریافت محصولات:', error);
        return;
    }
    products = data;
    renderProducts(products);
}

function renderProducts(productsList) {
    const container = document.getElementById('product-grid');
    if (!container) return;

    if (productsList.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center text-gray-500">محصولی یافت نشد.</p>';
        return;
    }

    container.innerHTML = productsList.map(product => `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow p-4">
            <div class="relative group cursor-pointer" onclick="showProductDetails('${product.id}')">
                <img src="${product.image_url}" alt="${product.name}" class="w-full h-48 object-contain mb-4">
                <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <h3 class="font-bold text-gray-800 mb-2">${product.name}</h3>
            <p class="text-blue-600 font-bold mb-4">${Number(product.price).toLocaleString()} تومان</p>
            <button onclick="addToCart('${product.id}')" class="w-full bg-gray-900 text-white py-2 rounded-xl hover:bg-blue-600 transition-colors">
                افزودن به سبد خرید
            </button>
        </div>
    `).join('');
}

async function showProductDetails(productId) {

    currentProductId = productId;

    const product = products.find(p => p.id == productId);

    if (!product) return;

    document.getElementById('detail-title').innerText =
        product.name;

    document.getElementById('detail-price').innerText =
        `${Number(product.price).toLocaleString()} تومان`;

    document.getElementById('detail-description').innerText =
        product.description;

    document.getElementById('main-product-img').src =
        product.image_url;

    document.getElementById('product-detail-page')
        .classList.remove('hidden');

    loadReviews(productId);
}

function toggleCart() {

    document
        .getElementById('cart-modal')
        .classList.toggle('hidden');

}

function checkout(){

    if(cart.length === 0){

        return alert('سبد خرید خالی است');

    }

    alert('سفارش ثبت شد');

}

function closeProductPage() {

    document
        .getElementById('product-detail-page')
        .classList.add('hidden');

}

function addToCart(id) {

  const item = cart.find(i => i.id === id);

  if (item) {
    item.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }

  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {

  const item = cart.find(i => i.id === id);

  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  saveCart();
  updateCartUI();
}

function removeItem(id) {

  cart = cart.filter(i => i.id !== id);

  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* ---------------- CART UI ---------------- */

function updateCartUI() {

  const el = document.getElementById("cart-count");

  if (!el) return;

  el.innerText = cart.reduce((a, b) => a + b.qty, 0);

}

/* ---------------- CART PAGE (optional modal) ---------------- */

function renderCart() {

  const box = document.getElementById("cart-items");

  if (!box) return;

  box.innerHTML = cart.map(i => {

    const p = products.find(x => x.id === i.id);

    if (!p) return "";

    return `
      <div class="flex justify-between items-center border-b py-2">

        <div>
          <div class="font-bold">${p.name}</div>

          <div class="text-sm text-gray-500">
            ${i.qty} عدد
          </div>
        </div>

        <div class="flex gap-2 items-center">

          <button onclick="changeQty(${i.id}, -1)">➖</button>

          <button onclick="changeQty(${i.id}, 1)">➕</button>

          <button onclick="removeItem(${i.id})" class="text-red-500">❌</button>

        </div>

      </div>
    `;
  }).join("");
}

// --- ۵. مدیریت نظرات (Reviews) ---
async function loadReviews(productId) {
    const list = document.getElementById('reviews-list');
    const formContainer = document.getElementById('review-form-container');
    if (!list) return;

    // نمایش فرم ثبت نظر فقط برای کاربران لاگین شده
    if (currentUser) {
        if (formContainer) formContainer.classList.remove('hidden');
    } else {
        if (formContainer) {
            formContainer.innerHTML = `<p class="text-center text-gray-500 text-sm italic">برای ثبت نظر، ابتدا <button onclick="openAuthModal()" class="text-blue-600 underline">وارد شوید</button>.</p>`;
        }
    }

    const { data: reviews, error } = await shopDB
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = '<p class="text-red-500 text-sm">خطا در بارگذاری نظرات</p>';
        return;
    }

    if (reviews.length === 0) {
        list.innerHTML = '<p class="text-gray-400 text-center text-sm">هنوز نظری ثبت نشده است.</p>';
        return;
    }

    list.innerHTML = reviews.map(rev => `
        <div class="bg-white p-4 rounded-xl border border-gray-100 mb-3">
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-sm text-blue-600">${rev.user_name || 'کاربر'}</span>
                <span class="text-[10px] text-gray-400">${new Date(rev.created_at).toLocaleDateString('fa-IR')}</span>
            </div>
            <p class="text-gray-700 text-sm leading-relaxed">${rev.comment}</p>
        </div>
    `).join('');
}

async function submitReview() {
    const textEl = document.getElementById('review-text');
    const text = textEl.value.trim();

    if (!text) return alert("لطفاً متن نظر را وارد کنید");
    if (!currentUser) return alert("ابتدا باید وارد حساب خود شوید");

    const { error } = await shopDB
        .from('reviews')
        .insert([{ 
            product_id: currentProductId, 
            comment: text, 
            user_id: currentUser.id,
            user_name: currentUser.email.split('@')[0] 
        }]);

    if (error) {
        alert("خطا در ثبت نظر: " + error.message);
    } else {
        textEl.value = '';
        loadReviews(currentProductId);
    }
}

// --- ۶. مدیریت احراز هویت (Auth) ---
function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('hidden');
}

function toggleAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) return alert("لطفاً ایمیل و رمز عبور را وارد کنید");

    const { data, error } = await shopDB.auth.signInWithPassword({ email, password });

    if (error) {
        alert("خطا در ورود: " + error.message);
    } else {
        currentUser = data.user;
        updateUserUI();
        toggleAuthModal();
    }
}

async function handleSignup() {

    const email =
        document.getElementById('login-email').value;

    const password =
        document.getElementById('login-password').value;

    if (!email || !password) return alert("لطفاً اطلاعات ثبت‌نام را کامل کنید");

    const { data, error } = await shopDB.auth.signUp({ email, password });

    if (error) {
        alert("خطا در ثبت‌نام: " + error.message);
    } else {
        alert("ثبت‌نام با موفقیت انجام شد! لطفاً ایمیل خود را برای تایید لینک چک کنید.");
        // در حالت تست، معمولاً کاربر بلافاصله لاگین می‌شود یا باید لاگین کند
    }
}

async function handleLogout() {
    await shopDB.auth.signOut();
    currentUser = null;
    updateUserUI();
}

async function checkUser() {
    const { data: { user } } = await shopDB.auth.getUser();
    if (user) {
        currentUser = user;
        updateUserUI();
    }
}

function updateUserUI() {
    const userSection = document.getElementById('user-section');
    if (!userSection) return;

    if (currentUser) {
        userSection.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-gray-700">${currentUser.email.split('@')[0]}</span>
                <button onclick="handleLogout()" class="text-xs text-red-500 hover:underline">خروج</button>
            </div>
        `;
    } else {
        userSection.innerHTML = `<button onclick="openAuthModal()" class="text-gray-600 hover:text-blue-600 font-medium text-sm">ورود / ثبت‌نام</button>`;
    }
}
