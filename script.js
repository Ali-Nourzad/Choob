const SUPABASE_URL='https://rlduutynqgevgzmayeit.supabase.co';

const SUPABASE_KEY='sb_publishable_QQKsRmCxqZNX1dZW7bjAmA_xypPHAjD';

const SUPABASE_URL = "YOUR_URL";
const SUPABASE_KEY = "YOUR_KEY";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartUI();
});

/* ---------------- PRODUCTS ---------------- */

async function loadProducts() {
  const { data } = await db.from("products").select("*");
  products = data || [];
  renderProducts();
}

function renderProducts() {
  const box = document.getElementById("product-grid");
  if (!box) return;

  box.innerHTML = products.map(p => `
    <div class="bg-white p-4 rounded-xl shadow">
      
      <img src="${p.image_url}" class="h-48 w-full object-contain">

      <h3 class="font-bold mt-2">${p.name}</h3>

      <p class="text-blue-600">${Number(p.price).toLocaleString()} تومان</p>

      <button onclick="addToCart(${p.id})"
      class="w-full mt-3 bg-blue-600 text-white py-2 rounded-xl">

        افزودن به سبد

      </button>

    </div>
  `).join("");
}

/* ---------------- PRODUCT PAGE ---------------- */

function goToProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

async function loadProductPage() {
  const id = new URLSearchParams(window.location.search).get("id");

  const { data } = await db.from("products").select("*").eq("id", id).single();

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

    <button onclick="addToCart(${data.id})"
    class="w-full bg-green-600 text-white py-3 mt-4 rounded-xl">

      افزودن به سبد خرید

    </button>
  `;
}

/* ---------------- CART ---------------- */

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
