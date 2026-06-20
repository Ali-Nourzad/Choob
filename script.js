// ۱. تنظیمات اصلی
const SUPABASE_URL = 'https://rlduutynqgevgzmayeit.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QQKsRmCxqZNX1dZW7bjAmA_xypPHAjD';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ==========================================
// ۲. سیستم احراز هویت ساده (برای پنل ادمین)
// ==========================================
function checkAdmin() {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin && window.location.pathname.includes('admin.html')) {
        const pass = prompt("لطفاً رمز عبور ادمین را وارد کنید:");
        if (pass === 'admin') {
            localStorage.setItem('isAdmin', 'true');
            location.reload();
        } else {
            alert("رمز اشتباه است!");
            window.location.href = 'index.html';
        }
    }
}

// ==========================================
// ۳. مدیریت محصولات و نمایش
// ==========================================
async function fetchProducts() {
    const { data, error } = await supabaseClient.from('products').select('*');
    if (error) {
        console.error(error);
        return;
    }
    products = data;
    displayProducts(products);
}

function displayProducts(productsList) {
    const container = document.getElementById('product-grid');
    if (!container) return;
    container.innerHTML = '';

    productsList.forEach(product => {
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-md flex flex-col transition hover:shadow-xl';
        card.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" 
                 class="w-full h-48 object-contain bg-gray-50 rounded mb-2" 
                 onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
            <h2 class="text-lg font-bold mb-1">${product.name}</h2>
            <p class="text-blue-600 font-semibold mb-3">${Number(product.price).toLocaleString()} تومان</p>
            <div class="mt-auto flex flex-col gap-2">
                <button onclick="viewDetails(${product.id})" class="text-sm text-gray-500 underline">مشاهده جزئیات</button>
                <button onclick="addToCart(${product.id})" class="bg-blue-600 text-white px-4 py-2 rounded w-full">افزودن به سبد</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// رفع مشکل کشیده شدن تصویر: استفاده از object-contain
// در کد بالا کلاس object-contain اضافه شد تا تصویر در کادر خودش قرار بگیرد نه اینکه کشیده شود.

// ==========================================
// ۴. سبد خرید (Cart System)
// ==========================================
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${product.name} به سبد اضافه شد!`);
    updateCartCount();
}

function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = cart.length;
}

async function checkout() {
    if (cart.length === 0) return alert("سبد خرید خالی است!");
    
    try {
        for (let item of cart) {
            const { error } = await supabaseClient.from('orders').insert([{
                product_name: item.name,
                price: item.price,
                image_url: item.image_url,
                status: 'در انتظار پرداخت'
            }]);
            if (error) throw error;
        }
        cart = [];
        localStorage.removeItem('cart');
        alert("سفارش شما با موفقیت ثبت شد!");
        location.reload();
    } catch (err) {
        alert("خطا در ثبت سفارش: " + err.message);
    }
}

// ==========================================
// ۵. پنل ادمین و سفارشات
// ==========================================
async function fetchOrders() {
    const { data, error } = await supabaseClient.from('orders').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('orders-list');
    if (!container || error) return;

    container.innerHTML = data.map(order => `
        <div class="border-b p-4 flex justify-between items-center">
            <div>
                <p class="font-bold">${order.product_name}</p>
                <p class="text-sm text-gray-500">${order.price.toLocaleString()} تومان</p>
            </div>
            <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">${order.status}</span>
        </div>
    `).join('');
}

// اجرای اولیه
document.addEventListener('DOMContentLoaded', () => {
    checkAdmin();
    fetchProducts();
    updateCartCount();
    if (document.getElementById('orders-list')) fetchOrders();
});

// نمایش جزئیات محصول (Modal ساده)
function viewDetails(productId) {
    const product = products.find(p => p.id === productId);
    alert(`نام محصول: ${product.name}\nقیمت: ${product.price} تومان\n\nاین یک نمایش ساده است. در نسخه کامل می‌توانید اینجا توضیحات کامل را بنویسید.`);
}
