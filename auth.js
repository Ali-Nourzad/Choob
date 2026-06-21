const SUPABASE_URL='آدرس سوپابیس';

const SUPABASE_KEY='کلید Publishable';

const shopDB=

window.supabase.createClient(

SUPABASE_URL,

SUPABASE_KEY

);

async function handleLogin(){

const email=

document.getElementById(

'login-email'

).value.trim();

const password=

document.getElementById(

'login-password'

).value;

const {error}=

await shopDB.auth

.signInWithPassword({

email,

password

});

if(error){

return alert(error.message);

}

window.location.href='./index.html';

}

async function handleSignup(){

const username=

document.getElementById(

'signup-username'

).value.trim();

const phone=

document.getElementById(

'signup-phone'

).value.trim();

const email=

document.getElementById(

'signup-email'

).value.trim();

const password=

document.getElementById(

'signup-password'

).value;

const avatar=

document.getElementById(

'signup-avatar'

).files[0];

if(

!username ||

!phone ||

!email ||

!password

){

return alert(

'همه فیلدها را تکمیل کنید'

);

}

const signup=

await shopDB.auth.signUp({

email,

password

});

if(signup.error){

return alert(

signup.error.message

);

}

let avatarUrl='';

if(avatar){

const fileName=

`${signup.data.user.id}-${Date.now()}-${avatar.name}`;

const upload=

await shopDB.storage

.from('avatars')

.upload(fileName,avatar);

if(!upload.error){

avatarUrl=

`${SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;

}

}

const profile=

await shopDB

.from('profiles')

.insert([{

id:signup.data.user.id,

username,

phone,

avatar_url:avatarUrl

}]);

if(profile.error){

return alert(

profile.error.message

);

}

alert(

'ثبت‌نام انجام شد'

);

window.location.href='./login.html';

}
