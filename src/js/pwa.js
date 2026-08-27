let deferredPrompt = null;

window.addEventListener(
    'beforeinstallprompt',
    (event) => {

        event.preventDefault();

        deferredPrompt = event;

        const installBtn =
            document.getElementById('installAppBtn');

        if (installBtn) {
            installBtn.classList.remove('hidden');
        }
    }
);

window.installPWA = async function () {

    if (!deferredPrompt) {

        alert(
            'التثبيت غير متاح حالياً. استخدم زر التثبيت في شريط المتصفح.'
        );

        return;
    }

    deferredPrompt.prompt();

    const result =
        await deferredPrompt.userChoice;

    console.log(
        'Install:',
        result.outcome
    );

    deferredPrompt = null;

    document
        .getElementById('installAppBtn')
        ?.classList.add('hidden');
};

window.addEventListener(
    'appinstalled',
    () => {

        console.log('PWA Installed');

        document
            .getElementById('installAppBtn')
            ?.classList.add('hidden');

        document
            .getElementById('installSuccess')
            ?.classList.remove('hidden');
    }
);

/*
|--------------------------------------------------------------------------
| Service Worker
|--------------------------------------------------------------------------
|
| pwa.js is loaded through Vite.
| The Service Worker itself lives in public/sw.js and will be copied
| by Vite to the root of dist.
|
*/

if ('serviceWorker' in navigator) {

    window.addEventListener(
        'load',
        () => {

            navigator.serviceWorker
                .register(
                    './sw.js',
                    {
                        scope: './'
                    }
                )
                .then(
                    (registration) => {

                        console.log(
                            'Service Worker Registered:',
                            registration.scope
                        );

                    }
                )
                .catch(
                    (error) => {

                        console.error(
                            'Service Worker registration failed:',
                            error
                        );

                    }
                );

        }
    );
}