// ============================================================
// 1. تنظیمات اولیه و اتصال به Supabase
// ============================================================

const SUPABASE_URL =
    'https://rlduutynqgevgzmayeit.supabase.co';

const SUPABASE_ANON_KEY =
    'sb_publishable_QQKsRmCxqZNX1dZW7bjAmA_xypPHAjD';


if (
    !window.supabase ||
    !window.supabase.createClient
) {

    console.error(
        'Supabase JS library is not loaded.'
    );

}


const shopDB = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);



// ============================================================
// 2. متغیرهای سراسری
// ============================================================

let products = [];

let cart =
    JSON.parse(
        localStorage.getItem('cart')
    ) || [];

let currentUser = null;

let currentProductId = null;

let displayedProducts = [];

let fuse = null;



// ============================================================
// 3. تصویر پیش‌فرض محصول
// ============================================================

const DEFAULT_PRODUCT_IMAGE =
    './default-product.jpg';



// ============================================================
// 4. شروع برنامه
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        await fetchProducts();

        await checkUser();

        await updateUserNavbar();

        await loadOrders();

        await loadCartFromDB();

        updateCartUI();

        updateCartCount();

        setupProductFilters();

        updateAdvancedFilters();

    }
);



// ============================================================
// 5. دریافت محصولات
// ============================================================

async function fetchProducts() {

    const {
        data,
        error
    } = await shopDB
        .from('products')
        .select('*');



    if (error) {

        console.error(
            'خطا در دریافت محصولات:',
            error
        );

        const container =
            document.getElementById(
                'product-grid'
            );

        if (container) {

            container.innerHTML = `
                <p class="products-error">
                    خطا در دریافت محصولات.
                </p>
            `;

        }

        return;

    }



    products = data || [];

    displayedProducts = [
        ...products
    ];



    createProductSearch();

    renderProducts(
        displayedProducts
    );

}



// ============================================================
// 6. ساخت Fuse
// ============================================================

function createProductSearch() {

    fuse = new Fuse(
        products,
        {

            keys: [

                {
                    name: 'name',
                    weight: 2
                },

                {
                    name: 'description',
                    weight: 1
                },

                {
                    name: 'product_type',
                    weight: 1
                }

            ],

            threshold: 0.4,

            ignoreLocation: true

        }
    );

}



// ============================================================
// 7. گرفتن مشخصات از details
// ============================================================

function getDetail(
    product,
    key
) {

    if (
        !product ||
        !product.details
    ) {

        return null;

    }


    let details =
        product.details;



    // اگر JSONB به صورت string برگشته باشد

    if (
        typeof details === 'string'
    ) {

        try {

            details =
                JSON.parse(details);

        } catch (error) {

            console.warn(
                'خطا در خواندن details:',
                error
            );

            return null;

        }

    }


    return details?.[key] ?? null;

}



// ============================================================
// 8. تبدیل مقدار به عدد
// ============================================================

function numericDetail(
    product,
    key
) {

    const value =
        getDetail(
            product,
            key
        );

    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {

        return null;

    }

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : null;

}



// ============================================================
// 9. گرفتن تصویر محصول
// ============================================================

function getProductImage(
    product
) {

    if (
        product &&
        product.image_url &&
        String(
            product.image_url
        ).trim()
    ) {

        return product.image_url;

    }

    return DEFAULT_PRODUCT_IMAGE;

}



// ============================================================
// 10. Escape کردن متن برای HTML
// ============================================================

function escapeHTML(value) {

    return String(
        value ?? ''
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

}



// ============================================================
// 11. نمایش محصولات
// ============================================================

function renderProducts(
    productsList
) {

    const container =
        document.getElementById(
            'product-grid'
        );


    if (!container) {
        return;
    }



    // هیچ محصولی پیدا نشد

    if (
        !productsList ||
        productsList.length === 0
    ) {

        container.innerHTML = `

            <div class="no-products">

                <p>
                    محصولی با این مشخصات یافت نشد.
                </p>

            </div>

        `;

        return;

    }



    container.innerHTML =
        productsList
            .map(
                product => {

                    const image =
                        getProductImage(
                            product
                        );

                    const name =
                        escapeHTML(
                            product.name
                        );

                    const price =
                        Number(
                            product.price || 0
                        )
                            .toLocaleString(
                                'fa-IR'
                            );



                    return `

                        <div class="product-card">


                            <div
                                class="product-image-box"
                                onclick="goToProduct('${product.id}')"
                            >

                                <img
                                    src="${escapeHTML(image)}"
                                    alt="${name}"
                                    class="product-image"
                                    onerror="this.onerror=null;this.src='${DEFAULT_PRODUCT_IMAGE}'"
                                >

                            </div>



                            <div class="product-info">


                                <h3 class="product-name">
                                    ${name}
                                </h3>


                                <p class="product-price">
                                    ${price}
                                    تومان
                                </p>


                                <button
                                    type="button"
                                    onclick="event.stopPropagation(); addToCart('${product.id}')"
                                    class="product-btn"
                                >
                                    افزودن به سبد خرید
                                </button>


                            </div>


                        </div>

                    `;

                }
            )
            .join('');

}



// ============================================================
// 12. رفتن به صفحه محصول
// ============================================================

function goToProduct(id) {

    window.location.href =
        `product.html?id=${encodeURIComponent(id)}`;

}



// ============================================================
// 13. جزئیات محصول
// ============================================================

async function showProductDetails(
    productId
) {

    currentProductId =
        productId;



    const product =
        products.find(
            p =>
                String(p.id) ===
                String(productId)
        );


    if (!product) {
        return;
    }



    const title =
        document.getElementById(
            'detail-title'
        );

    const price =
        document.getElementById(
            'detail-price'
        );

    const description =
        document.getElementById(
            'detail-description'
        );

    const image =
        document.getElementById(
            'main-product-img'
        );

    const page =
        document.getElementById(
            'product-detail-page'
        );



    if (title) {

        title.innerText =
            product.name || '';

    }



    if (price) {

        price.innerText =
            `${Number(
                product.price || 0
            ).toLocaleString(
                'fa-IR'
            )} تومان`;

    }



    if (description) {

        description.innerText =
            product.description || '';

    }



    if (image) {

        image.src =
            getProductImage(
                product
            );

        image.onerror = () => {

            image.onerror = null;

            image.src =
                DEFAULT_PRODUCT_IMAGE;

        };

    }



    if (page) {

        page.classList.remove(
            'hidden'
        );

    }



    await loadReviews(
        productId
    );

}



// ============================================================
// 14. سبد خرید
// ============================================================

function toggleCart() {

    const modal =
        document.getElementById(
            'cart-modal'
        );


    if (!modal) {
        return;
    }


    modal.classList.toggle(
        'hidden'
    );


    renderCartItems();

}



// ============================================================
// 15. نمایش سبد خرید
// ============================================================

function renderCartItems() {

    const list =
        document.getElementById(
            'cart-items-list'
        );

    const totalEl =
        document.getElementById(
            'cart-total'
        );


    if (!list) {
        return;
    }



    if (
        cart.length === 0
    ) {

        list.innerHTML = `

            <p class="text-center text-gray-500 py-6">
                سبد خرید شما خالی است.
            </p>

        `;


        if (totalEl) {

            totalEl.innerText =
                '۰ تومان';

        }


        return;

    }



    let total = 0;



    list.innerHTML =
        cart
            .map(
                item => {

                    const product =
                        products.find(
                            p =>
                                String(p.id) ===
                                String(item.id)
                        );


                    if (!product) {
                        return '';
                    }



                    item.quantity =
                        Number(
                            item.quantity ||
                            item.qty ||
                            1
                        );



                    const price =
                        Number(
                            product.price || 0
                        );



                    const lineTotal =
                        price *
                        item.quantity;



                    total +=
                        lineTotal;



                    return `

                        <div class="cart-item">


                            <img
                                src="${escapeHTML(
                                    getProductImage(product)
                                )}"
                                class="cart-item-image"
                                alt="${escapeHTML(
                                    product.name
                                )}"
                                onerror="this.onerror=null;this.src='${DEFAULT_PRODUCT_IMAGE}'"
                            >


                            <div class="cart-item-info">

                                <h4 class="cart-item-name">
                                    ${escapeHTML(
                                        product.name
                                    )}
                                </h4>


                                <p class="cart-item-price">

                                    ${price.toLocaleString(
                                        'fa-IR'
                                    )}

                                    تومان

                                </p>

                            </div>



                            <div class="cart-item-quantity">


                                <button
                                    type="button"
                                    onclick="changeQty('${item.id}', -1)"
                                    class="qty-btn"
                                >
                                    ➖
                                </button>


                                <span class="qty-number">
                                    ${item.quantity}
                                </span>


                                <button
                                    type="button"
                                    onclick="changeQty('${item.id}', 1)"
                                    class="qty-btn"
                                >
                                    ➕
                                </button>


                            </div>



                            <div class="cart-item-total">

                                ${lineTotal.toLocaleString(
                                    'fa-IR'
                                )}

                                تومان

                            </div>



                            <button
                                type="button"
                                onclick="removeItem('${item.id}')"
                                class="remove-btn"
                                aria-label="حذف محصول"
                            >
                                🗑️
                            </button>


                        </div>

                    `;

                }
            )
            .join('');



    if (totalEl) {

        totalEl.innerText =
            `${total.toLocaleString(
                'fa-IR'
            )} تومان`;

    }

}



// ============================================================
// 16. اضافه کردن به سبد
// ============================================================

function addToCart(id) {

    id = String(id);


    const item =
        cart.find(
            i =>
                String(i.id) === id
        );


    if (item) {

        item.quantity =
            Number(
                item.quantity || 1
            ) + 1;

    } else {

        cart.push({

            id: id,

            quantity: 1

        });

    }


    saveCart();

    updateCartCount();

    renderCartItems();

    saveCartToDB();

}



// ============================================================
// 17. تغییر تعداد
// ============================================================

function changeQty(
    id,
    delta
) {

    const item =
        cart.find(
            i =>
                String(i.id) ===
                String(id)
        );


    if (!item) {
        return;
    }


    item.quantity =
        Number(
            item.quantity || 1
        );


    item.quantity +=
        delta;


    if (
        item.quantity <= 0
    ) {

        removeItem(id);

        return;

    }


    saveCart();

    updateCartCount();

    renderCartItems();

    saveCartToDB();

}



// ============================================================
// 18. حذف از سبد
// ============================================================

function removeItem(id) {

    cart =
        cart.filter(
            i =>
                String(i.id) !==
                String(id)
        );


    saveCart();

    updateCartCount();

    renderCartItems();

    saveCartToDB();

}



// ============================================================
// 19. ذخیره سبد در LocalStorage
// ============================================================

function saveCart() {

    localStorage.setItem(
        'cart',
        JSON.stringify(cart)
    );

}



// ============================================================
// 20. تعداد سبد خرید
// ============================================================

function updateCartCount() {

    const countEl =
        document.getElementById(
            'cart-count'
        );


    if (!countEl) {
        return;
    }


    const totalItems =
        cart.reduce(
            (
                sum,
                item
            ) => {

                return sum +
                    Number(
                        item.quantity ||
                        item.qty ||
                        1
                    );

            },
            0
        );


    countEl.innerText =
        totalItems;

}



// ============================================================
// 21. آپدیت UI سبد
// ============================================================

function updateCartUI() {

    updateCartCount();

}



// ============================================================
// 22. ذخیره سبد در Supabase
// ============================================================

async function saveCartToDB() {

    const {
        data: {
            user
        }
    } =
        await shopDB.auth.getUser();


    if (!user) {
        return;
    }



    await shopDB
        .from('carts')
        .delete()
        .eq(
            'user_id',
            user.id
        );



    const rows =
        cart.map(
            item => ({

                user_id:
                    user.id,

                product_id:
                    item.id,

                quantity:
                    Number(
                        item.quantity || 1
                    )

            })
        );



    if (
        rows.length === 0
    ) {
        return;
    }



    const {
        error
    } =
        await shopDB
            .from('carts')
            .insert(rows);



    if (error) {

        console.error(
            'خطا در ذخیره سبد:',
            error
        );

    }

}



// ============================================================
// 23. دریافت سبد از Supabase
// ============================================================

async function loadCartFromDB() {

    const {
        data: {
            user
        }
    } =
        await shopDB.auth.getUser();


    if (!user) {
        return;
    }



    const {
        data,
        error
    } =
        await shopDB
            .from('carts')
            .select('*')
            .eq(
                'user_id',
                user.id
            );


    if (error) {

        console.error(
            'خطا در دریافت سبد:',
            error
        );

        return;

    }



    cart =
        (data || []).map(
            item => ({

                id:
                    item.product_id,

                quantity:
                    Number(
                        item.quantity || 1
                    )

            })
        );



    saveCart();

    updateCartCount();

    renderCartItems();

}



// ============================================================
// 24. ثبت سفارش
// ============================================================

async function checkout() {

    if (
        cart.length === 0
    ) {

        return alert(
            'سبد خرید خالی است'
        );

    }



    const {
        data: {
            user
        }
    } =
        await shopDB.auth.getUser();


    if (!user) {

        return alert(
            'ابتدا وارد حساب کاربری شوید'
        );

    }



    const orders = [];



    for (
        const item of cart
    ) {

        const product =
            products.find(
                p =>
                    String(p.id) ===
                    String(item.id)
            );


        if (!product) {
            continue;
        }



        const order = {

            product_name:
                product.name,

            price:
                product.price,

            image_url:
                getProductImage(
                    product
                ),

            quantity:
                Number(
                    item.quantity || 1
                ),

            user_id:
                user.id,

            status:
                'in progress'

        };



        // نوع محصول

        if (
            product.product_type
        ) {

            order.product_type =
                product.product_type;

        }



        // تصاویر

        if (
            product.images
        ) {

            order.images =
                product.images;

        }



        // کد محصول

        if (
            product.code
        ) {

            order.code =
                product.code;

        }



        orders.push(
            order
        );

    }



    if (
        orders.length === 0
    ) {

        return alert(
            'محصول معتبری برای ثبت سفارش وجود ندارد.'
        );

    }



    const {
        error
    } =
        await shopDB
            .from('orders')
            .insert(orders);



    if (error) {

        console.error(
            error
        );

        return alert(
            'خطا در ثبت سفارش: ' +
            error.message
        );

    }



    // خالی کردن سبد

    cart = [];

    saveCart();

    updateCartCount();

    renderCartItems();

    await saveCartToDB();



    alert(
        'سفارش با موفقیت ثبت شد'
    );

}



// ============================================================
// 25. سفارش‌های کاربر
// ============================================================

async function loadOrders() {

    const ordersBox =
        document.getElementById(
            'orders-list'
        );


    if (!ordersBox) {
        return;
    }



    const {
        data: {
            user
        }
    } =
        await shopDB.auth.getUser();


    if (!user) {

        ordersBox.innerHTML =
            '<p>ابتدا وارد حساب شوید.</p>';

        return;

    }



    const {
        data: orders,
        error
    } =
        await shopDB
            .from('orders')
            .select('*')
            .eq(
                'user_id',
                user.id
            )
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



    if (
        !orders ||
        orders.length === 0
    ) {

        ordersBox.innerHTML =
            '<p>هنوز سفارشی ثبت نشده است.</p>';

        return;

    }



    ordersBox.innerHTML =
        orders
            .map(
                order => `

                    <div class="order-card">


                        <img
                            src="${escapeHTML(
                                order.image_url ||
                                DEFAULT_PRODUCT_IMAGE
                            )}"
                            class="order-image"
                            alt="${escapeHTML(
                                order.product_name
                            )}"
                            onerror="this.onerror=null;this.src='${DEFAULT_PRODUCT_IMAGE}'"
                        >


                        <div class="order-content">


                            <h3 class="order-title">
                                ${escapeHTML(
                                    order.product_name
                                )}
                            </h3>


                            <div class="order-meta">

                                <span>
                                    تعداد:
                                    ${order.quantity}
                                </span>


                                <span>
                                    ${Number(
                                        order.price || 0
                                    ).toLocaleString(
                                        'fa-IR'
                                    )}
                                    تومان
                                </span>

                            </div>


                            <div class="order-footer">

                                <span class="order-status">
                                    ${escapeHTML(
                                        order.status
                                    )}
                                </span>


                                <span class="order-date">
                                    ${new Date(
                                        order.created_at
                                    ).toLocaleDateString(
                                        'fa-IR'
                                    )}
                                </span>

                            </div>


                        </div>


                    </div>

                `
            )
            .join('');

}



// ============================================================
// 26. نوار کاربر
// ============================================================

async function updateUserNavbar() {

    const userSection =
        document.getElementById(
            'user-section'
        );


    if (!userSection) {
        return;
    }



    const {
        data: {
            user
        }
    } =
        await shopDB.auth.getUser();



    // کاربر وارد نشده

    if (!user) {

        userSection.innerHTML = `

            <button
                type="button"
                onclick="window.location.href='profile.html'"
                class="login-btn"
            >
                ورود / ثبت‌نام
            </button>

        `;

        return;

    }



    // دریافت پروفایل

    const {
        data: profile
    } =
        await shopDB
            .from('profiles')
            .select('*')
            .eq(
                'id',
                user.id
            )
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
                src="${escapeHTML(avatar)}"
                class="user-avatar"
                alt="پروفایل"
            >

            <span class="user-name">
                ${escapeHTML(username)}
            </span>

        </a>

    `;

}



// ============================================================
// 27. ارسال ایمیل تغییر رمز
// ============================================================

async function sendResetPasswordEmail() {

    const {
        data: {
            user
        }
    } =
        await shopDB.auth.getUser();


    if (!user) {

        return alert(
            'ابتدا وارد حساب شوید'
        );

    }



    const {
        error
    } =
        await shopDB.auth
            .resetPasswordForEmail(
                user.email,
                {

                    redirectTo:
                        'https://ali-nourzad.github.io/Choob/reset-password.html'

                }
            );



    if (error) {

        return alert(
            error.message
        );

    }



    alert(
        'لینک تغییر رمز عبور به ایمیل شما ارسال شد.'
    );

}



// ============================================================
// 28. صفحه محصول
// ============================================================

async function loadProductPage() {

    const id =
        new URLSearchParams(
            window.location.search
        ).get('id');



    if (!id) {
        return;
    }



    const {
        data,
        error
    } =
        await shopDB
            .from('products')
            .select('*')
            .eq(
                'id',
                id
            )
            .single();



    if (error) {

        console.error(
            'خطا در دریافت محصول:',
            error
        );

        return;

    }



    const box =
        document.getElementById(
            'product-box'
        );


    if (
        !box ||
        !data
    ) {
        return;
    }



    let images = [];



    if (
        data.images
    ) {

        if (
            Array.isArray(
                data.images
            )
        ) {

            images =
                data.images;

        } else {

            images =
                String(
                    data.images
                )
                    .split('|')
                    .map(
                        image =>
                            image.trim()
                    )
                    .filter(Boolean);

        }

    }



    // اگر image_url در images نیست
    // آن را به ابتدای تصاویر اضافه می‌کنیم

    const mainImage =
        getProductImage(
            data
        );



    if (
        mainImage &&
        !images.includes(
            mainImage
        )
    ) {

        images.unshift(
            mainImage
        );

    }



    box.innerHTML = `

        <img
            id="main-img"
            src="${escapeHTML(mainImage)}"
            class="w-full h-96 object-contain"
            alt="${escapeHTML(data.name)}"
            onerror="this.onerror=null;this.src='${DEFAULT_PRODUCT_IMAGE}'"
        >



        <div class="flex gap-2 mt-4 overflow-x-auto">

            ${images
                .map(
                    image => `

                        <img
                            src="${escapeHTML(image)}"
                            onclick="document.getElementById('main-img').src='${escapeHTML(image)}'"
                            class="w-20 h-20 object-cover border cursor-pointer"
                            alt=""
                            onerror="this.style.display='none'"
                        >

                    `
                )
                .join('')}

        </div>



        <h1 class="text-2xl font-bold mt-4">

            ${escapeHTML(
                data.name
            )}

        </h1>



        <p class="text-gray-600 mt-2">

            ${escapeHTML(
                data.description || ''
            )}

        </p>



        <p class="text-blue-600 text-xl mt-3">

            ${Number(
                data.price || 0
            ).toLocaleString(
                'fa-IR'
            )}

            تومان

        </p>



        <button
            type="button"
            onclick="addToCart('${data.id}')"
            class="w-full bg-green-600 text-white py-3 mt-4 rounded-xl"
        >
            افزودن به سبد خرید
        </button>

    `;

}



// ============================================================
// 29. جستجو
// ============================================================

function searchProducts(
    search
) {

    search =
        String(
            search || ''
        )
            .trim();



    if (!search) {

        return [
            ...products
        ];

    }



    if (!fuse) {

        createProductSearch();

    }



    return fuse
        .search(search)
        .map(
            result =>
                result.item
        );

}



// ============================================================
// 30. فیلتر اصلی محصولات
// ============================================================

function filterProducts() {

    const searchInput =
        document.getElementById(
            'search-input'
        );

    const typeFilter =
        document.getElementById(
            'product-type-filter'
        );

    const sortSelect =
        document.getElementById(
            'sort-select'
        );



    const search =
        searchInput
            ?.value || '';

    const type =
        typeFilter
            ?.value || '';

    const sort =
        sortSelect
            ?.value || '';



    // ابتدا جستجو

    let result =
        searchProducts(
            search
        );



    // سپس نوع محصول

    if (type) {

        result =
            result.filter(
                product =>
                    product.product_type ===
                    type
            );

    }



    // ========================================================
    // جاسوئیچی
    // ========================================================

    if (
        type === 'JS'
    ) {

        const wood =
            document.getElementById(
                'js-wood-filter'
            )?.value || '';

        const size =
            document.getElementById(
                'js-size-filter'
            )?.value || '';

        const font =
            document.getElementById(
                'js-font-filter'
            )?.value || '';



        if (wood) {

            result =
                result.filter(
                    product =>
                        String(
                            getDetail(
                                product,
                                'wood'
                            )
                        ) === wood
                );

        }



        if (size) {

            result =
                result.filter(
                    product =>
                        String(
                            getDetail(
                                product,
                                'size'
                            )
                        ) === size
                );

        }



        if (font) {

            result =
                result.filter(
                    product =>
                        String(
                            getDetail(
                                product,
                                'font'
                            )
                        ) === font
                );

        }

    }



    // ========================================================
    // جاکلیدی
    // ========================================================

    if (
        type === 'JK'
    ) {

        const wood =
            document.getElementById(
                'jk-wood-filter'
            )?.value || '';

        const hookCount =
            document.getElementById(
                'jk-hook-filter'
            )?.value || '';



        if (wood) {

            result =
                result.filter(
                    product =>
                        String(
                            getDetail(
                                product,
                                'wood'
                            )
                        ) === wood
                );

        }



        if (hookCount) {

            result =
                result.filter(
                    product => {

                        const value =
                            numericDetail(
                                product,
                                'hook_count'
                            );

                        return (
                            value !== null &&
                            value ===
                            Number(
                                hookCount
                            )
                        );

                    }
                );

        }

    }



    // ========================================================
    // تابلو
    // ========================================================

    if (
        type === 'TB'
    ) {

        const width =
            document.getElementById(
                'tb-width-filter'
            )?.value || '';

        const length =
            document.getElementById(
                'tb-length-filter'
            )?.value || '';



        if (width) {

            result =
                result.filter(
                    product => {

                        const value =
                            numericDetail(
                                product,
                                'width'
                            );

                        return (
                            value !== null &&
                            value ===
                            Number(width)
                        );

                    }
                );

        }



        if (length) {

            result =
                result.filter(
                    product => {

                        const value =
                            numericDetail(
                                product,
                                'length'
                            );

                        return (
                            value !== null &&
                            value ===
                            Number(length)
                        );

                    }
                );

        }

    }



    // ========================================================
    // ساعت
    // ========================================================

    if (
        type === 'CL'
    ) {

        const width =
            document.getElementById(
                'cl-width-filter'
            )?.value || '';

        const length =
            document.getElementById(
                'cl-length-filter'
            )?.value || '';



        if (width) {

            result =
                result.filter(
                    product => {

                        const value =
                            numericDetail(
                                product,
                                'width'
                            );

                        return (
                            value !== null &&
                            value ===
                            Number(width)
                        );

                    }
                );

        }



        if (length) {

            result =
                result.filter(
                    product => {

                        const value =
                            numericDetail(
                                product,
                                'length'
                            );

                        return (
                            value !== null &&
                            value ===
                            Number(length)
                        );

                    }
                );

        }

    }



    // ========================================================
    // مرتب سازی
    // ========================================================

    switch (sort) {


        case 'cheap':

            result.sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        a.price || 0
                    ) -
                    Number(
                        b.price || 0
                    )
            );

            break;



        case 'expensive':

            result.sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        b.price || 0
                    ) -
                    Number(
                        a.price || 0
                    )
            );

            break;



        case 'name':

            result.sort(
                (
                    a,
                    b
                ) =>
                    String(
                        a.name || ''
                    ).localeCompare(
                        String(
                            b.name || ''
                        ),
                        'fa'
                    )
            );

            break;

    }



    displayedProducts =
        result;



    renderProducts(
        displayedProducts
    );

}



// ============================================================
// 31. نمایش/مخفی کردن فیلترهای اختصاصی
// ============================================================

function updateAdvancedFilters() {

    const type =
        document.getElementById(
            'product-type-filter'
        )?.value || '';



    document
        .querySelectorAll(
            '.type-filters'
        )
        .forEach(
            element => {

                element.classList.add(
                    'hidden'
                );

            }
        );



    const filterMap = {

        JS:
            'js-filters',

        JK:
            'jk-filters',

        TB:
            'tb-filters',

        CL:
            'cl-filters'

    };



    const targetId =
        filterMap[type];



    if (targetId) {

        const target =
            document.getElementById(
                targetId
            );


        if (target) {

            target.classList.remove(
                'hidden'
            );

        }

    }

}



// ============================================================
// 32. راه‌اندازی فیلترها
// ============================================================

function setupProductFilters() {

    const searchInput =
        document.getElementById(
            'search-input'
        );

    const typeFilter =
        document.getElementById(
            'product-type-filter'
        );

    const sortSelect =
        document.getElementById(
            'sort-select'
        );



    // جستجو

    searchInput?.addEventListener(
        'input',
        filterProducts
    );



    // نوع محصول

    typeFilter?.addEventListener(
        'change',
        () => {

            updateAdvancedFilters();

            filterProducts();

        }
    );



    // مرتب سازی

    sortSelect?.addEventListener(
        'change',
        filterProducts
    );



    // تمام فیلترهای پیشرفته

    document
        .querySelectorAll(
            '#advanced-filters select, #advanced-filters input'
        )
        .forEach(
            element => {

                element.addEventListener(
                    'input',
                    filterProducts
                );

                element.addEventListener(
                    'change',
                    filterProducts
                );

            }
        );

}



// ============================================================
// 33. صفحه محصول را ببند
// ============================================================

function closeProductPage() {

    const page =
        document.getElementById(
            'product-detail-page'
        );


    if (page) {

        page.classList.add(
            'hidden'
        );

    }

}



// ============================================================
// 34. نظرات
// ============================================================

async function loadReviews(
    productId
) {

    const list =
        document.getElementById(
            'reviews-list'
        );

    const formContainer =
        document.getElementById(
            'review-form-container'
        );


    if (!list) {
        return;
    }



    // فرم نظر برای کاربر لاگین شده

    if (currentUser) {

        if (formContainer) {

            formContainer.classList.remove(
                'hidden'
            );

        }

    } else {

        if (formContainer) {

            formContainer.innerHTML = `

                <p class="text-center text-gray-500 text-sm italic">

                    برای ثبت نظر، ابتدا

                    <button
                        type="button"
                        onclick="openAuthModal()"
                        class="text-blue-600 underline"
                    >
                        وارد شوید
                    </button>

                    .

                </p>

            `;

        }

    }



    const {
        data: reviews,
        error
    } =
        await shopDB
            .from('reviews')
            .select('*')
            .eq(
                'product_id',
                productId
            )
            .order(
                'created_at',
                {
                    ascending: false
                }
            );



    if (error) {

        list.innerHTML =
            '<p class="text-red-500 text-sm">خطا در بارگذاری نظرات</p>';

        return;

    }



    if (
        !reviews ||
        reviews.length === 0
    ) {

        list.innerHTML =
            '<p class="text-gray-400 text-center text-sm">هنوز نظری ثبت نشده است.</p>';

        return;

    }



    list.innerHTML =
        reviews
            .map(
                review => `

                    <div class="bg-white p-4 rounded-xl border border-gray-100 mb-3">


                        <div class="flex justify-between items-center mb-2">


                            <span class="font-bold text-sm text-blue-600">

                                ${escapeHTML(
                                    review.user_name ||
                                    'کاربر'
                                )}

                            </span>


                            <span class="text-[10px] text-gray-400">

                                ${new Date(
                                    review.created_at
                                ).toLocaleDateString(
                                    'fa-IR'
                                )}

                            </span>


                        </div>


                        <p class="text-gray-700 text-sm leading-relaxed">

                            ${escapeHTML(
                                review.comment
                            )}

                        </p>


                    </div>

                `
            )
            .join('');

}



// ============================================================
// 35. ثبت نظر
// ============================================================

async function submitReview() {

    const textEl =
        document.getElementById(
            'review-text'
        );


    if (!textEl) {
        return;
    }



    const text =
        textEl.value.trim();



    if (!text) {

        return alert(
            'لطفاً متن نظر را وارد کنید'
        );

    }



    if (!currentUser) {

        return alert(
            'ابتدا باید وارد حساب خود شوید'
        );

    }



    const {
        error
    } =
        await shopDB
            .from('reviews')
            .insert(
                [
                    {

                        product_id:
                            currentProductId,

                        comment:
                            text,

                        user_id:
                            currentUser.id,

                        user_name:
                            currentUser.email.split('@')[0]

                    }
                ]
            );



    if (error) {

        alert(
            'خطا در ثبت نظر: ' +
            error.message
        );

        return;

    }



    textEl.value = '';

    loadReviews(
        currentProductId
    );

}



// ============================================================
// 36. Auth Modal
// ============================================================

function openAuthModal() {

    const modal =
        document.getElementById(
            'auth-modal'
        );


    if (modal) {

        modal.classList.remove(
            'hidden'
        );

    }

}



function toggleAuthModal() {

    const modal =
        document.getElementById(
            'auth-modal'
        );


    if (modal) {

        modal.classList.add(
            'hidden'
        );

    }

}



// ============================================================
// 37. ورود
// ============================================================

async function handleLogin() {

    const email =
        document.getElementById(
            'login-email'
        )?.value.trim();


    const password =
        document.getElementById(
            'login-password'
        )?.value;



    if (
        !email ||
        !password
    ) {

        return alert(
            'لطفاً ایمیل و رمز عبور را وارد کنید'
        );

    }



    const {
        data,
        error
    } =
        await shopDB.auth
            .signInWithPassword(
                {
                    email,
                    password
                }
            );



    if (error) {

        alert(
            'خطا در ورود: ' +
            error.message
        );

        return;

    }



    currentUser =
        data.user;


    toggleAuthModal();

    await updateUserNavbar();

}



// ============================================================
// 38. ثبت نام
// ============================================================

async function handleSignup() {

    const email =
        document.getElementById(
            'login-email'
        )?.value.trim();


    const password =
        document.getElementById(
            'login-password'
        )?.value;



    if (
        !email ||
        !password
    ) {

        return alert(
            'لطفاً اطلاعات ثبت‌نام را کامل کنید'
        );

    }



    const {
        error
    } =
        await shopDB.auth
            .signUp(
                {
                    email,
                    password
                }
            );



    if (error) {

        alert(
            'خطا در ثبت‌نام: ' +
            error.message
        );

        return;

    }



    alert(
        'ثبت‌نام با موفقیت انجام شد! لطفاً ایمیل خود را برای تایید لینک چک کنید.'
    );

}



// ============================================================
// 39. خروج
// ============================================================

async function handleLogout() {

    await shopDB.auth.signOut();

    location.href =
        'login.html';

}



// ============================================================
// 40. بررسی کاربر
// ============================================================

async function checkUser() {

    const {
        data: {
            user
        }
    } =
        await shopDB.auth.getUser();


    if (user) {

        currentUser =
            user;

    }

}
