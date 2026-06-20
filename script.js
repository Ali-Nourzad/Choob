// تابعی برای خواندن محصولات از فایل JSON
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error("خطا در بارگذاری محصولات:", error);
        document.getElementById('product-grid').innerHTML = "<p class='text-red-500'>خطا در بارگذاری اطلاعات!</p>";
    }
}

// تابعی برای ساختن کارت‌های محصول در HTML
function displayProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = ''; // پاک کردن متن "در حال بارگذاری"

    products.forEach(product => {
        const productCard = `
            <div class="bg-white p-4 rounded-lg shadow hover:shadow-xl transition">
                <img src="${product.img}" class="w-full h-48 object-cover rounded mb-4">
                <h3 class="text-xl font-bold">${product.name}</h3>
                <p class="text-blue-600 font-semibold mt-2">
                    ${product.price.toLocaleString()} تومان
                </p>
                <button class="w-full mt-4 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                    افزودن به سبد خرید
                </button>
            </div>
        `;
        grid.innerHTML += productCard;
    });
}

// اجرای تابع هنگام باز شدن صفحه
window.onload = loadProducts;
