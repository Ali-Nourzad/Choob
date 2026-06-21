const SUPABASE_URL='https://rlduutynqgevgzmayeit.supabase.co';

const SUPABASE_KEY='sb_publishable_QQKsRmCxqZNX1dZW7bjAmA_xypPHAjD';

const shopDB=

window.supabase.createClient(

SUPABASE_URL,

SUPABASE_KEY

);

let products=[];

let cart=

JSON.parse(

localStorage.getItem('cart')

)||[];

document.addEventListener(

'DOMContentLoaded',

init

);

async function init(){

await loadUser();

await loadProducts();

updateCart();

}

async function loadProducts(){

const result=

await shopDB

.from('products')

.select('*');

if(result.error){

return;

}

products=result.data;

renderProducts();

}

function renderProducts(){

const grid=

document.getElementById(

'product-grid'

);

if(!grid){

return;

}

grid.innerHTML=

products.map(p=>`

<div

class="bg-white p-4 rounded-2xl shadow">

<img

src="${p.image_url}"

class="w-full h-48 object-contain">

<h3

class="font-bold mt-4">

${p.name}

</h3>

<p

class="text-blue-600 my-3">

${Number(

p.price

).toLocaleString()}

تومان

</p>

<button

onclick="addToCart('${p.id}')"

class="w-full bg-blue-600 text-white py-3 rounded-xl">

افزودن به سبد خرید

</button>

</div>

`).join('');

}

function addToCart(id){

const item=

cart.find(

i=>i.id==id

);

if(item){

item.quantity++;

}else{

cart.push({

id,

quantity:1

});

}

localStorage.setItem(

'cart',

JSON.stringify(cart)

);

updateCart();

}

function updateCart(){

const el=

document.getElementById(

'cart-count'

);

if(!el){

return;

}

const total=

cart.reduce(

(a,b)=>a+b.quantity,

0

);

el.innerText=total;

}

async function loadUser(){

const result=

await shopDB.auth

.getUser();

const user=

result.data.user;

if(!user){

const sec=

document.getElementById(

'user-section'

);

if(sec){

sec.innerHTML=

`

<a

href="./login.html"

class="text-blue-600">

ورود

</a>

`;

}

return;

}

const profile=

await shopDB

.from('profiles')

.select('*')

.eq(

'id',

user.id

)

.single();

if (!profile.data) {

  console.log('پروفایل کاربر پیدا نشد');

  return;

}

const data = profile.data;

const avatar =

data.avatar_url ||

'https://ui-avatars.com/api/?name=User';

const sec=

document.getElementById(

'user-section'

);

if(sec){

sec.innerHTML=

`

<a

href="./profile.html"

class="flex items-center gap-3">

<img

src="${avatar}"

class="w-10 h-10 rounded-full">

<span>

${data.username}

</span>

</a>

`;

}

const img=

document.getElementById(

'profile-avatar'

);

if(img){

img.src=avatar;

document.getElementById(

'profile-name'

).innerText=

data.username;

document.getElementById(

'profile-phone'

).innerText=

data.phone;

document.getElementById(

'profile-email'

).innerText=

user.email;

}

}

async function logout(){

await shopDB.auth

.signOut();

window.location.href=

'./login.html';

}
