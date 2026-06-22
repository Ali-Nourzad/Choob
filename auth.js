const SUPABASE_URL='https://rlduutynqgevgzmayeit.supabase.co';

const SUPABASE_KEY='sb_publishable_QQKsRmCxqZNX1dZW7bjAmA_xypPHAjD';

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

async function handleSignup() {

  const btn = document.getElementById('signup-btn');

  btn.disabled = true;

  btn.innerText = 'در حال ثبت‌نام...';

  try {

    const username = document
      .getElementById('signup-username')
      .value.trim();

    const phone = document
      .getElementById('signup-phone')
      .value.trim();

    const email = document
      .getElementById('signup-email')
      .value.trim();

    const password = document
      .getElementById('signup-password')
      .value;

    const avatar = document
      .getElementById('signup-avatar')
      .files[0];

    if (
      !username ||
      !phone ||
      !email ||
      !password
    ) {

      throw new Error(
        'همه فیلدها را تکمیل کنید'
      );

    }

    // ثبت‌نام

    const {
      data,
      error
    } = await shopDB.auth.signUp({

      email,

      password

    });

    if (error) {

      throw error;

    }

    if (!data.user) {

      throw new Error(
        'ثبت‌نام انجام نشد'
      );

    }

    const userId = data.user.id;

    // آپلود عکس

    let avatarUrl = '';

    if (avatar) {

      const fileName =

        `${userId}-${Date.now()}`;

      const upload =

      await shopDB.storage

      .from('avatars')

      .upload(fileName, avatar);

      if (!upload.error) {

        avatarUrl =

        `${SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;

      }

    }

    // ساخت پروفایل

    const {
      error: profileError
    } = await shopDB

    .from('profiles')

    .insert([{

      id: userId,

      username,

      phone,

      avatar_url: avatarUrl

    }]);

    if (profileError) {

      throw profileError;

    }

    alert(
      'ثبت‌نام با موفقیت انجام شد'
    );

    location.href = './login.html';

  }

  catch (err) {

    console.error(err);

    alert(
      err.message
    );

  }

  finally {

    btn.disabled = false;

    btn.innerText =

    'ثبت‌نام';

  }

}
