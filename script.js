// ==========================================
// ۱. تنظیمات اتصال به Supabase
// ==========================================
const SUPABASE_URL = 'https://rlduutynqgevgzmayeit.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QQKsRmCxqZNX1dZW7bjAmA_xypPHAjD';

// اصلاح شده: استفاده از شیء جهانی supabase برای ایجاد اتصال
// ما نام متغیر را 'supabaseClient' می‌گذاریم تا با نام کتابخانه اصلی قاطی نشود
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// متغیر برای ذخیره محصولات در حافظه موقت
let products = [];
// ==========================================
// ۲. توابع مربوط به دیتابیس (Supabase)
// ==========================================

// خواندن محصولات از دیتابیس
async function fetchProducts() {
    try {
        // تغییر از client به supabaseClient
        const { data, error } = await supabaseClient
            .from('products') 
            .select('*');

        if (error) {
            console.error('خطا در دریافت اطلاعات:', error.message);
        } else {
            products = data;
            displayProducts(products);
        }
    } catch (err) {
        console.error('خطای غیرمنتظره:', err);
    }
}

// اضافه کردن محصول جدید (برای پنل مدیریت)
async function addProduct(name, price, imageUrl) {
    try {
        const { error } = await client
            .from('products')
            .insert([{ name: name, price: parseInt(price), image_url: imageUrl }]);

        if (error) {
            alert('خطا در ثبت محصول: ' + error.message);
        } else {
            alert('محصول با موفقیت اضافه شد!');
            await fetchProducts(); // لیست را آپدیت کن
        }
    } catch (err) {
        console.error('خطا در افزودن:', err);
    }
}

// حذف محصول (برای پنل مدیریت)
async function deleteProduct(productId) {
    if (!confirm('آیا از حذف این محصول مطمئن هستید؟')) return;

    try {
        const { error } = await client
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) {
            alert('خطا در حذف محصول!');
        } else {
            await fetchProducts(); // لیست را آپدیت کن
        }
    } catch (err) {
        console.error('خطا در حذف:', err);
    }
}

// ==========================================
// ۳. توابع مربوط به نمایش در صفحه (UI)
// ==========================================

function displayProducts(productsList) {
    // اصلاح شده: نام آی‌دی باید با HTML یکی باشد
    const container = document.getElementById('product-grid');

    if (!container) return; 

    container.innerHTML = ''; // پاک کردن محتوای قبلی

    if (productsList.length === 0) {
        container.innerHTML = '<p class="text-center col-span-full text-gray-500">هیچ محصولی یافت نشد.</p>';
        return;
    }

    productsList.forEach(product => {
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-md flex flex-col'; 
        card.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" class="w-full h-48 object-cover rounded mb-2">
            <h2 class="text-xl font-bold mb-1">${product.name}</h2>
            <p class="text-gray-600 mb-3">${Number(product.price).toLocaleString()} تومان</p>
            <div class="mt-auto">
                <button onclick="addToCart(${product.id})" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full transition">
                    افزودن به سبد خرید
                </button>
                ${window.location.pathname.includes('admin.html') ? 
                    `<button onclick="deleteProduct(${product.id})" class="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full transition">حذف محصول</button>` 
                    : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

// ==========================================
// ۴. مدیریت رویدادها (Event Listeners)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // ۱. همیشه محصولات را از دیتابیس بگیر
    fetchProducts();

    // ۲. اگر در صفحه مدیریت هستیم، فرم افزودن را فعال کن
    const adminForm = document.getElementById('admin-form');
    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('p-name').value;
            const price = document.getElementById('p-price').value;
            const img = document.getElementById('p-img').value;

            if (!name || !price || !img) {
                alert('لطفاً همه فیلدها را پر کنید');
                return;
            }

            await addProduct(name, price, img);
            adminForm.reset(); 
        });
    }
});

// تابع سبد خرید (ساده شده)
function addToCart(productId) {
    alert('محصول با کد ' + productId + ' به سبد خرید اضافه شد!');
}
