const USER_CACHE_KEY = 'pharmaflow_current_user';


/*
|--------------------------------------------------------------------------
| Cache User
|--------------------------------------------------------------------------
|
| مهم:
| عند وصول بيانات المستخدم من /current-user غالباً لن تحتوي
| offline_password_hash.
|
| لذلك نحافظ على البيانات المحلية السابقة ونسمح للبيانات الجديدة
| بتحديث باقي الحقول.
|
*/

export async function cacheUser(user) {

    if (!user) {
        return null;
    }


    let existingUser = null;


    try {

        const raw =
            localStorage.getItem(
                USER_CACHE_KEY
            );


        if (raw) {

            existingUser =
                JSON.parse(raw);

        }

    } catch (error) {

        console.warn(
            'Could not read existing cached user:',
            error
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Merge
    |--------------------------------------------------------------------------
    |
    | ترتيب الدمج مهم:
    |
    | existingUser
    |      ↓
    | user
    |      ↓
    | preserve offline_password_hash when the new user
    | does not provide one
    |
    */

    const cachedUser = {

        ...(existingUser || {}),

        ...(user || {}),

        offline_password_hash:

            user.offline_password_hash
            ||

            existingUser?.offline_password_hash
            ||

            null,

        cached_at:
            new Date().toISOString()

    };


    localStorage.setItem(

        USER_CACHE_KEY,

        JSON.stringify(
            cachedUser
        )

    );


    return cachedUser;

}


/*
|--------------------------------------------------------------------------
| Get Cached User
|--------------------------------------------------------------------------
*/

export async function getCachedUser() {

    try {

        const raw =
            localStorage.getItem(
                USER_CACHE_KEY
            );


        if (!raw) {

            return null;

        }


        const user =
            JSON.parse(raw);


        if (
            !user ||
            typeof user !== 'object'
        ) {

            return null;

        }


        return user;

    }

    catch (error) {

        console.error(
            'Failed to read cached user:',
            error
        );

        return null;

    }

}


/*
|--------------------------------------------------------------------------
| Clear Cached User
|--------------------------------------------------------------------------
*/

export function clearCachedUser() {

    localStorage.removeItem(
        USER_CACHE_KEY
    );


    localStorage.removeItem(
        'user'
    );


    localStorage.removeItem(
        'offline_mode'
    );

}