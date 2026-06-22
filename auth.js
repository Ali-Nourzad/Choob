const SUPABASE_URL =
'https://rlduutynqgevgzmayeit.supabase.co';

const SUPABASE_KEY =
'sb_publishable_QQKsRmCxqZNX1dZW7bjAmA_xypPHAjD';

const shopDB =
window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// =================== ورود ===================

async function handleLogin(){

  const email =
  document
  .getElementById('login-email')
  ?.value
  .trim();

  const password =
  document
  .getElementById('login-password')
  ?.value;

  if(!email || !password){

    return alert(
      'ایمیل و رمز عبور را وارد کنید'
    );

  }

  const { error } =

  await shopDB.auth

  .signInWithPassword({

    email,

    password

  });

  if(error){

    return alert(

      error.message

    );

  }

  location.href='index.html';

}


// =================== ثبت نام ===================

async function handleSignup(){

  const btn =

  document.getElementById(

    'signup-btn'

  );

  if(btn){

    btn.disabled = true;

    btn.innerText =

    'در حال ثبت‌نام...';

  }

  try{

    const username =

    document

    .getElementById(

      'signup-username'

    )

    ?.value

    .trim();



    const phone =

    document

    .getElementById(

      'signup-phone'

    )

    ?.value

    .trim();



    const email =

    document

    .getElementById(

      'signup-email'

    )

    ?.value

    .trim();



    const password =

    document

    .getElementById(

      'signup-password'

    )

    ?.value;



    const avatarInput =

    document.getElementById(

      'signup-avatar'

    );



    const avatar =

    avatarInput

    ? avatarInput.files[0]

    : null;



    if(

      !username ||

      !phone ||

      !email ||

      !password

    ){

      throw new Error(

        'همه فیلدها را تکمیل کنید'

      );

    }



    if(password.length < 6){

      throw new Error(

        'رمز عبور باید حداقل ۶ کاراکتر باشد'

      );

    }



    // ثبت نام

    const {

      data,

      error

    }

    =

    await shopDB

    .auth

    .signUp({

      email,

      password

    });



    // محدودیت تعداد درخواست

    if(

      error?.status === 429

    ){

      throw new Error(

        'درخواست‌های زیادی ارسال شده است. لطفاً چند دقیقه دیگر دوباره تلاش کنید.'

      );

    }



    if(error){

      throw error;

    }



    if(!data.user){

      throw new Error(

        'کاربر ساخته نشد'

      );

    }



    const userId =

    data.user.id;



    // آپلود عکس

    let avatarUrl = '';



    if(avatar){

      const fileName =

      `${userId}-${Date.now()}-${avatar.name}`;



      const upload =

      await shopDB.storage

      .from('avatars')

      .upload(

        fileName,

        avatar

      );



      if(

        !upload.error

      ){

        avatarUrl =

        `${SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;

      }

    }



    // ساخت پروفایل

    const {

      error: profileError

    }

    =

    await shopDB

    .from('profiles')

    .insert([{

      id: userId,

      username,

      phone,

      avatar_url: avatarUrl

    }]);



    if(profileError){

      throw profileError;

    }



    alert(

      'ثبت‌نام با موفقیت انجام شد'

    );



    location.href =

    'login.html';

  }

  catch(err){

    console.error(err);



    alert(

      err.message ||

      'خطایی رخ داد'

    );

  }

  finally{

    if(btn){

      btn.disabled = false;

      btn.innerText =

      'ثبت‌نام';

    }

  }

}
