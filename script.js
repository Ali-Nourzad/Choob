// این‌ها را باید از سایت Supabase بردارید
const SUPABASE_URL = 'https://rlduutynqgevgzmayeit.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QQKsRmCxqZNX1dZW7bjAmA_xypPHAjD';

// ایجاد اتصال
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// متغیر برای ذخیره محصولات در حافظه موقت (برای سرعت بیشتر)
let products = [];

// ==========================================
// ۲. توابع مربوط به دیتابیس (Supabase)
// ==========================================

// خواندن محصولات از دیتابیس
async function fetchProducts() {
    const { data, error } = await supabase
        .from('products') // نام جدولی که در مرحله قبل ساختید
        .select('*');

    if (error) {
        console.error('خطا در دریافت اطلاعات:', error.message);
        alert('خطا در اتصال به دیتابیس!');
    } else {
        products = data;
        displayProducts(products);
    }
}

// اضافه کردن محصول جدید (برای پنل مدیریت)
async function addProduct(name, price, imageUrl) {
    const { data, error } = await supabase
        .from('products')
        .insert([{ name: name, price: parseInt(price), image_url: imageUrl }]);

    if (error) {
        alert('خطا در ثبت محصول: ' + error.message);
    } else {
        alert('محصول با موفقیت اضافه شد!');
        await fetchProducts(); // لیست را آپدیت کن
    }
}

// حذف محصول (برای پنل مدیریت)
async function deleteProduct(productId) {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) {
        alert('خطا در حذف محصول!');
    } else {
        await fetchProducts(); // لیست را آپدیت کن
    }
}

// ==========================================
// ۳. توابع مربوط به نمایش در صفحه (UI)
// ==========================================

function displayProducts(productsList) {
    const container = document.getElementById('product-container');
    if (!container) return; // اگر در صفحه فعلی کانتینر نبود، کاری نکن

    container.innerHTML = ''; // پاک کردن محتوای قبلی

    productsList.forEach(product => {
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-md'; // استایل Tailwind
        card.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" class="w-full h-48 object-cover rounded">
            <h2 class="text-xl font-bold mt-2">${product.name}</h2>
            <p class="text-gray-600">${product.price.toLocaleString()} تومان</p>
            <button onclick="addToCart(${product.id})" class="mt-3 bg-blue-500 text-white px-4 py-2 rounded w-full">
                افزودن به سبد خرید
            </button>
            ${window.location.pathname.includes('admin.html') ? 
                `<button onclick="deleteProduct(${product.id})" class="mt-2 bg-red-500 text-white px-4 py-2 rounded w-full">حذف</button>` 
                : ''}
        `;
        container.appendChild(card);
    });
}

// ==========================================
// ۴. مدیریت رویدادها (Event Listeners)
// ==========================================

// وقتی صفحه لود می‌شود
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

            await addProduct(name, price, img);
            adminForm.reset(); // خالی کردن فرم
        });
    }
});

// تابع سبد خرید (ساده شده)
function addToCart(productId) {
    alert('محصول به سبد خرید اضافه شد! (در این مرحله فقط نمایش داده می‌شود)');
    // در اینجا می‌توانید منطق سبد خرید را که قبلاً داشتید اضافه کنید
}
