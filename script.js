// --- ۱. تنظیمات اولیه و اتصال به Supabase ---
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
    await updateUserNavbar();
    await loadOrders();
    await loadCartFromDB();
    updateCartUI();
    updateCartCount();
    //toggleCart(); // برای نمایش سبد خرید در صورت لود شدن مجدد صفحه
});

// --- ۳. مدیریت محصولات ---
async function fetchProducts() {
    const {
        data,
        error
    } = await shopDB
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

        container.innerHTML = `
      <p class="col-span-full text-center text-gray-500">
        محصولی یافت نشد.
      </p>
    `;

        return;

    }

container.innerHTML = productsList.map(product => `

<div class="product-card">

    <div

        class="product-image-box"

        onclick="goToProduct('${product.id}')"

    >

        <img

            src="${product.image_url}"

            alt="${product.name}"

            class="product-image"

        >

    </div>

    <div class="product-info">

        <h3 class="product-name">

            ${product.name}

        </h3>

        <p class="product-price">

            ${Number(product.price).toLocaleString()}

            تومان

        </p>

        <button

            onclick="event.stopPropagation();addToCart('${product.id}')"

            class="product-btn"

        >

            افزودن به سبد خرید

        </button>

    </div>

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

function goToProduct(id) {
    window.location.href = `product.html?id=${id}`;
}

function toggleCart() {

    const modal = document.getElementById('cart-modal');

    if (!modal) return;

    modal.classList.toggle('hidden');

    renderCartItems();

}

async function sendResetPasswordEmail() {

    const {

        data: {
            user
        }

    } = await shopDB.auth.getUser();

    if (!user) {

        return alert('ابتدا وارد حساب شوید');

    }

    const {
        error
    } = await shopDB.auth.resetPasswordForEmail(

        user.email,

        {

            redirectTo:

                'https://ali-nourzad.github.io/Choob/reset-password.html'

        }

    );

    if (error) {

        return alert(error.message);

    }

    alert(

        'لینک تغییر رمز عبور به ایمیل شما ارسال شد.'

    );

}

async function saveCartToDB() {

    const {

        data: {
            user
        }

    } = await shopDB.auth.getUser();

    if (!user) return;

    // حذف سبد خرید قبلی

    await shopDB

        .from('carts')

        .delete()

        .eq('user_id', user.id);

    // ساخت آرایه جدید

    const rows = [];

    for (const item of cart) {

        rows.push({

            user_id: user.id,

            product_id: item.id,

            quantity: item.quantity

        });

    }

    if (rows.length === 0) return;

    const {
        error
    } = await shopDB

        .from('carts')

        .insert(rows);

    if (error) {

        console.error(error);

    }

}

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');
    if (!list) return;
    if (!totalEl) {
        console.warn('cart-total پیدا نشد');
    }
    // سبد خالی
    if (cart.length === 0) {
        list.innerHTML = `
        <p class="text-center text-gray-500 py-6">
        سبد خرید شما خالی است.
        </p>
        `;
        if (totalEl) {
            totalEl.innerText = '۰ تومان';
        }
        return;
    }
    let total = 0;
    list.innerHTML = cart.map(item => {
        const product = products.find(
            p => String(p.id) === String(item.id)
        );
        if (!product) return '';
        // یکسان‌سازی quantity
        item.quantity = item.quantity || item.qty || 1;
        total += product.price * item.quantity;
        return `
        <div class="flex items-center gap-4 border-b py-4">
        <img
          src="${product.image_url}"
          class="w-16 h-16 object-contain rounded-lg bg-gray-100"
        >
        <div class="flex-1">
            <h4 class="font-bold">
                ${product.name}
            </h4>
            <p class="text-sm text-gray-500">
            ${Number(product.price).toLocaleString()} تومان
            </p>
        </div>
        <div class="flex items-center gap-2">

          <button

            onclick="changeQty('${item.id}', -1)"

            class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"

          >

            ➖

          </button>

          <span class="font-bold">

            ${item.quantity}

          </span>

          <button

            onclick="changeQty('${item.id}', 1)"

            class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"

          >

            ➕

          </button>

        </div>

        <div class="w-28 text-center font-bold">

          ${(product.price * item.quantity).toLocaleString()}

          تومان

        </div>

        <button

          onclick="removeItem('${item.id}')"

          class="text-red-500 text-2xl hover:text-red-700"

        >

          🗑️

        </button>

      </div>

    `;

    }).join('');

    if (totalEl) {

        totalEl.innerText =

            `${total.toLocaleString()} تومان`;

    }
}

async function loadOrders() {

    const ordersBox =

        document.getElementById(

            'orders-list'

        );

    if (!ordersBox) return;

    const {

        data: {
            user
        }

    } = await shopDB.auth.getUser();

    if (!user) {

        ordersBox.innerHTML =

            '<p>ابتدا وارد حساب شوید.</p>';

        return;

    }

    const {

        data: orders,

        error

    } = await shopDB

        .from('orders')

        .select('*')

        .eq('user_id', user.id)

        .order(

            'created_at',

            {

                ascending: false

            }

        );

    if (error) {

        ordersBox.innerHTML =

            '<p>خطا در دریافت سفارش‌ها</p>';

        return;

    }

    if (!orders || orders.length === 0) {

        ordersBox.innerHTML =

            '<p>هنوز سفارشی ثبت نشده است.</p>';

        return;

    }

    ordersBox.innerHTML =

        orders.map(order => `

      <div

      class="bg-white shadow rounded-2xl p-4 mb-4 flex items-center gap-4"

      >

        <img

        src="${order.image_url}"

        class="w-20 h-20 object-contain"

        >



        <div class="flex-1">

          <h3 class="font-bold">

            ${order.product_name}

          </h3>



          <div class="text-gray-500 text-sm">

            تعداد:

            ${order.quantity}

          </div>



          <div class="text-blue-600 font-bold">

            ${Number(

              order.price

            ).toLocaleString()}

            تومان

          </div>

        </div>



        <div class="text-left">

          <div

          class="text-green-600"

          >

            ${order.status}

          </div>



          <div

          class="text-xs text-gray-400"

          >

            ${new Date(

              order.created_at

            ).toLocaleDateString(

              'fa-IR'

            )}

          </div>

        </div>

      </div>

    `).join('');

}
async function updateUserNavbar() {

  const userSection =
    document.getElementById('user-section');

  if (!userSection) return;

  const {
    data:{ user }
  } = await shopDB.auth.getUser();

  // اگر لاگین نیست
  if (!user) {

    userSection.innerHTML = `

      <a
        href="login.html"
        class="login-btn"
      >

        ورود / ثبت‌نام

      </a>

    `;

    return;
  }

  // دریافت پروفایل

  const { data: profile } = await shopDB

    .from('profiles')

    .select('*')

    .eq('id', user.id)

    .single();

  const avatar =

    profile?.avatar_url ||

    'https://ui-avatars.com/api/?name=User';

  const username =

    profile?.username ||

    user.email.split('@')[0];

userSection.innerHTML = `

<a

  href="profile.html"

  class="user-link"

>

  <img

    src="${avatar}"

    class="user-avatar"

  >

  <span

    class="user-name"

  >

    ${username}

  </span>

</a>

`;

async function checkout() {

    if (cart.length === 0) {

        return alert('سبد خرید خالی است');

    }

    // گرفتن کاربر لاگین شده

    const {

        data: {
            user
        }

    } = await shopDB.auth.getUser();

    if (!user) {

        return alert(

            'ابتدا وارد حساب کاربری شوید'

        );

    }

    // ساخت آرایه سفارش‌ها

    const orders = [];

    for (const item of cart) {

        const product = products.find(

            p => String(p.id) === String(item.id)

        );

        if (!product) continue;

        orders.push({

            product_name: product.name,

            price: product.price,

            image_url: product.image_url,

            quantity: item.quantity,

            user_id: user.id,

            status: 'در انتظار پرداخت'

        });

    }

    // ذخیره در سوپابیس

    const {
        error
    } = await shopDB

        .from('orders')

        .insert(orders);

    if (error) {

        console.error(error);

        return alert(

            'خطا در ثبت سفارش'

        );

    }

    // خالی کردن سبد خرید

    cart = [];

    saveCart();

    updateCartCount();

    renderCartItems();

    alert(

        'سفارش با موفقیت ثبت شد'

    );

}

function closeProductPage() {

    document
        .getElementById('product-detail-page')
        .classList.add('hidden');

}

function addToCart(id) {

    id = String(id);

    const item = cart.find(

        i => String(i.id) === id

    );

    if (item) {

        item.quantity++;

    } else {

        cart.push({

            id,

            quantity: 1

        });

    }

    saveCart();

    updateCartCount();

    renderCartItems();

    saveCartToDB();

}

function changeQty(id, delta) {

    const item = cart.find(

        i => String(i.id) === String(id)

    );

    if (!item) return;

    item.quantity = item.quantity || 1;

    item.quantity += delta;

    if (item.quantity <= 0) {

        removeItem(id);

        return;

    }

    saveCart();

    updateCartCount();

    renderCartItems();
    saveCartToDB();

}

function removeItem(id) {

    cart = cart.filter(

        i => String(i.id) !== String(id)

    );

    saveCart();

    updateCartCount();

    renderCartItems();
    saveCartToDB();

}

async function loadCartFromDB() {

    const {

        data: {
            user
        }

    } = await shopDB.auth.getUser();

    if (!user) return;

    const {

        data,

        error

    } = await shopDB

        .from('carts')

        .select('*')

        .eq('user_id', user.id);

    if (error) {

        console.error(error);

        return;

    }

    cart = data.map(item => ({

        id: item.product_id,

        quantity: item.quantity

    }));

    saveCart();

    updateCartCount();

    renderCartItems();

}

function saveCart() {

    localStorage.setItem(

        'cart',

        JSON.stringify(cart)

    );

}

/* ---------------- CART UI ---------------- */

function updateCartCount() {

    const countEl = document.getElementById('cart-count');

    if (!countEl) return;

    const totalItems = cart.reduce(

        (sum, item) => {

            const quantity = item.quantity || item.qty || 1;

            return sum + quantity;

        },

        0

    );

    countEl.innerText = totalItems;

}

function updateCartUI() {

    const el =

        document.getElementById(

            'cart-count'

        );

    if (!el) return;

    el.innerText =

        cart.reduce(

            (sum, item) =>

            sum +

            (item.quantity || 1),

            0

        );

}

/* ---------------- CART PAGE (optional modal) ---------------- */

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

    const {
        data: reviews,
        error
    } = await shopDB
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', {
            ascending: false
        });

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
    else if (!currentUser) return alert("ابتدا باید وارد حساب خود شوید");

    const {
        error
    } = await shopDB
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

    const {
        data,
        error
    } = await shopDB.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        alert("خطا در ورود: " + error.message);
    } else {
        currentUser = data.user;
        //updateUserUI();
        toggleAuthModal();
    }
}

async function handleSignup() {

    const email =
        document.getElementById('login-email').value;

    const password =
        document.getElementById('login-password').value;

    if (!email || !password) return alert("لطفاً اطلاعات ثبت‌نام را کامل کنید");

    const {
        data,
        error
    } = await shopDB.auth.signUp({
        email,
        password
    });

    if (error) {
        alert("خطا در ثبت‌نام: " + error.message);
    } else {
        alert("ثبت‌نام با موفقیت انجام شد! لطفاً ایمیل خود را برای تایید لینک چک کنید.");
        // در حالت تست، معمولاً کاربر بلافاصله لاگین می‌شود یا باید لاگین کند
    }
}

async function handleLogout() {

    await shopDB.auth.signOut();

    location.href = 'login.html';

}

async function checkUser() {
    const {
        data: {
            user
        }
    } = await shopDB.auth.getUser();
    if (user) {
        currentUser = user;
        //updateUserUI();
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
        userSection.innerHTML = `<button onclick="openAuthModal()" class="text-[#E6D5B8] font-medium text-sm">ورود / ثبت‌نام</button>`;
    }
}

async function loadProductPage() {
    const id = new URLSearchParams(window.location.search).get("id");

    const {
        data
    } = await shopDB.from("products").select("*").eq("id", id).single();

    const box = document.getElementById("product-box");

    if (!data) return;

    let images = [];

    try {
        images = data.images ? data.images.split("|") : [];
    } catch {
        images = [];
    }

    box.innerHTML = `
    <img id="main-img" src="${data.image_url}" class="w-full h-96 object-contain">

    <div class="flex gap-2 mt-4 overflow-x-auto">
      ${images.map(img => `
        <img src="${img}" onclick="document.getElementById('main-img').src='${img}'"
        class="w-20 h-20 object-cover border cursor-pointer">
      `).join("")}
    </div>

    <h1 class="text-2xl font-bold mt-4">${data.name}</h1>

    <p class="text-gray-600 mt-2">${data.description || ""}</p>

    <p class="text-blue-600 text-xl mt-3">
      ${Number(data.price).toLocaleString()} تومان
    </p>

    <button onclick="addToCart('${data.id}')"
    class="w-full bg-green-600 text-white py-3 mt-4 rounded-xl">

      افزودن به سبد خرید

    </button>
  `;
}
function filterProducts(){

  const search = document
    .getElementById('search-input')
    .value
    .toLowerCase();

  const sort = document
    .getElementById('sort-select')
    .value;

  let filtered = [...products];

  // جستجو

  filtered = filtered.filter(product =>

    product.name
      .toLowerCase()
      .includes(search)

  );

  // مرتب سازی

  if(sort === 'cheap'){

    filtered.sort(

      (a,b)=>a.price-b.price

    );

  }

  if(sort === 'expensive'){

    filtered.sort(

      (a,b)=>b.price-a.price

    );

  }

  if(sort === 'name'){

    filtered.sort(

      (a,b)=>

      a.name.localeCompare(

        b.name,

        'fa'

      )

    );

  }

  renderProducts(filtered);

}
