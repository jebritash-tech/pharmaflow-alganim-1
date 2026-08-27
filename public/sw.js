const CACHE_NAME = 'pharmaflow-v1';

/*
|--------------------------------------------------------------------------
| Application Shell
|--------------------------------------------------------------------------
|
| Vite copies everything inside public/ directly to dist/.
|
*/

const APP_SHELL = [

    './',

    './index.html',

    './login.html',

    './admin.html',

    './pos.html',

    './shift.html',

    './analytics.html',

    './inventory.html',

    './install.html',

    './forgot-password.html',

    './reset-password.html',

    './manifest.json',

    './icons/icon-192.png',

    './icons/icon-512.png',
    './sounds/success.mp3',
    './sounds/error.mp3',
    './sounds/cart.mp3',
    './sounds/sync.mp3'

];

/*
|--------------------------------------------------------------------------
| Install
|--------------------------------------------------------------------------
*/

self.addEventListener(
    'install',
    (event) => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(
                    async (cache) => {

                        for (
                            const url of APP_SHELL
                        ) {

                            try {

                                const response =
                                    await fetch(
                                        url,
                                        {
                                            cache:
                                                'reload'
                                        }
                                    );

                                if (
                                    response.ok
                                ) {

                                    await cache.put(
                                        url,
                                        response
                                    );

                                }

                            }
                            catch (error) {

                                console.warn(
                                    'Could not cache:',
                                    url,
                                    error
                                );

                            }

                        }

                    }
                )

        );

        self.skipWaiting();
    }
);

/*
|--------------------------------------------------------------------------
| Activate
|--------------------------------------------------------------------------
*/

self.addEventListener(
    'activate',
    (event) => {

        event.waitUntil(

            caches
                .keys()
                .then(
                    (keys) => {

                        return Promise.all(

                            keys
                                .filter(
                                    key =>
                                        key !==
                                        CACHE_NAME
                                )
                                .map(
                                    key =>
                                        caches.delete(
                                            key
                                        )
                                )

                        );

                    }
                )

        );

        self.clients.claim();
    }
);

/*
|--------------------------------------------------------------------------
| Fetch
|--------------------------------------------------------------------------
*/

self.addEventListener(
    'fetch',
    (event) => {

        if (
            event.request.method !== 'GET'
        ) {

            return;
        }

        const request =
            event.request;

        const url =
            new URL(request.url);

        if (
            url.protocol !== 'http:' &&
            url.protocol !== 'https:'
        ) {

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | HTML navigation
        |--------------------------------------------------------------------------
        |
        | Network first.
        | Cache fallback when offline.
        |
        */

        if (
            request.mode === 'navigate'
        ) {

            event.respondWith(

                fetch(request)
                    .then(
                        (response) => {

                            if (
                                response.ok
                            ) {

                                const clone =
                                    response.clone();

                                caches
                                    .open(
                                        CACHE_NAME
                                    )
                                    .then(
                                        (cache) => {

                                            cache.put(
                                                request,
                                                clone
                                            );

                                        }
                                    );

                            }

                            return response;

                        }
                    )
                    .catch(
                        () => {

                            return caches
                                .match(request)
                                .then(
                                    (cached) => {

                                        return (
                                            cached

                                            ||

                                            caches.match(
                                                './login.html'
                                            )

                                        );

                                    }
                                );

                        }
                    )

            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Static assets
        |--------------------------------------------------------------------------
        |
        | Cache first.
        |
        */

        event.respondWith(

            caches
                .match(request)
                .then(
                    (cached) => {

                        if (cached) {
                            return cached;
                        }

                        return fetch(request)

                            .then(
                                (response) => {

                                    if (
                                        !response ||
                                        response.status !== 200
                                    ) {

                                        return response;

                                    }

                                    const clone =
                                        response.clone();

                                    caches
                                        .open(
                                            CACHE_NAME
                                        )
                                        .then(
                                            (cache) => {

                                                cache.put(
                                                    request,
                                                    clone
                                                );

                                            }
                                        );

                                    return response;

                                }
                            )

                            .catch(
                                () => {

                                    return new Response(
                                        '',
                                        {
                                            status: 503,
                                            statusText:
                                                'Offline'
                                        }
                                    );

                                }
                            );

                    }
                )

        );

    }
);