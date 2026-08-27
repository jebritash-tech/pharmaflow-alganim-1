import '../../css/app.css';

import {
    createApp,
    ref,
    computed,
    onMounted,
    onUnmounted
} from 'vue';

import axios from 'axios';

import {
    API_BASE
} from '../config.js';

import {
    clearCachedUser,
    getCachedUser
} from '../auth.js';

import '../pwa.js';

/*
|--------------------------------------------------------------------------
| Components
|--------------------------------------------------------------------------
|
| هذه الملفات ما زالت في مجلد modules الموجود حاليًا في مشروعك.
| لاحقًا نستطيع نقلها إلى src/js/components بدون تغيير منطقها.
|
*/

import Overview
    from '../../../modules/overview/overview.js';

import Branches
    from '../../../modules/branches/branches.js';

import Categories
    from '../../../modules/categories/categories.js';

import Purchases
    from '../../../modules/medicines/purchase.js';

import Medicine
    from '../../../modules/medicines/catalog.js';

import Suppliers
    from '../../../modules/suppliers/suppliers.js';

import Users
    from '../../../modules/users/users.js';

import Shifts
    from '../../../modules/shifts/shifts.js';

import Debts
    from '../../../modules/debts/debts.js';

import Expenses
    from '../../../modules/expenses/expenses.js';

import Salaries
    from '../../../modules/salaries/salaries.js';

import Pricing
    from '../../../modules/pricing-engine/pricing.js';

import Analytics
    from '../../../modules/analytics/analytics.js';

import Inventory
    from '../../../modules/inventory/inventory.js';

import About
    from '../../../modules/about/about.js';


/*
|--------------------------------------------------------------------------
| Axios
|--------------------------------------------------------------------------
*/

axios.defaults.headers.common['Accept'] =
    'application/json';

axios.defaults.headers.common[
    'X-Requested-With'
] = 'XMLHttpRequest';


const token =
    localStorage.getItem('token');

if (token) {

    axios.defaults.headers.common[
        'Authorization'
    ] = `Bearer ${token}`;

}


/*
|--------------------------------------------------------------------------
| Global Axios Loading State
|--------------------------------------------------------------------------
|
| لا نستخدم document.getElementById().classList
| بعد الآن.
|
*/

const globalLoadingEvent =
    'pharmaflow:global-loading';


let activeRequests = 0;


axios.interceptors.request.use(

    (config) => {

        activeRequests++;

        window.dispatchEvent(

            new CustomEvent(
                globalLoadingEvent,
                {
                    detail: {
                        loading:
                            activeRequests > 0
                    }
                }
            )

        );

        return config;

    },

    (error) => {

        activeRequests =
            Math.max(
                0,
                activeRequests - 1
            );

        window.dispatchEvent(

            new CustomEvent(
                globalLoadingEvent,
                {
                    detail: {
                        loading:
                            activeRequests > 0
                    }
                }
            )

        );

        return Promise.reject(
            error
        );

    }

);


axios.interceptors.response.use(

    (response) => {

        activeRequests =
            Math.max(
                0,
                activeRequests - 1
            );

        window.dispatchEvent(

            new CustomEvent(
                globalLoadingEvent,
                {
                    detail: {
                        loading:
                            activeRequests > 0
                    }
                }
            )

        );

        return response;

    },

    (error) => {

        activeRequests =
            Math.max(
                0,
                activeRequests - 1
            );

        window.dispatchEvent(

            new CustomEvent(
                globalLoadingEvent,
                {
                    detail: {
                        loading:
                            activeRequests > 0
                    }
                }
            )

        );

        return Promise.reject(
            error
        );

    }

);


/*
|--------------------------------------------------------------------------
| Vue Application
|--------------------------------------------------------------------------
*/

createApp({

    components: {

        Overview,

        Branches,

        Categories,

        Purchases,

        Medicine,

        Suppliers,

        Users,

        Shifts,

        Debts,

        Expenses,

        Salaries,

        Pricing,

        Analytics,

        Inventory,

        About

    },


    template: `

        <div class="flex h-screen overflow-hidden">

            <!-- Offline Overlay -->

            <div
                v-if="showOfflineOverlay"
                class="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm flex items-center justify-center"
            >

                <div
                    class="bg-white rounded-2xl shadow-2xl p-10 max-w-lg text-center"
                >

                    <div class="mb-6">

                        <i
                            class="fas fa-wifi text-red-600 text-7xl"
                        ></i>

                    </div>

                    <h1
                        class="text-3xl font-bold text-red-600 mb-4"
                    >
                        لا يوجد اتصال بالإنترنت
                    </h1>

                    <p
                        class="text-slate-600 text-lg mb-6"
                    >
                        تعذر الاتصال بالشبكة.
                        يرجى التحقق من الاتصال ثم إعادة المحاولة.
                    </p>

                    <div
                        class="inline-flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-lg"
                    >

                        <span class="animate-pulse">
                            ●
                        </span>

                        انتظار عودة الاتصال...

                    </div>

                </div>

            </div>


            <!-- Sidebar -->

            <aside
                class="w-72 bg-[#0b132b] text-slate-300 flex flex-col shrink-0 select-none border-l border-slate-800 h-screen"
            >

                <!-- User -->

                <div
                    class="p-5 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-[#070e22]"
                >

                    <div class="flex items-center gap-3">

                        <div
                            class="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold border border-sky-500/30 shrink-0"
                        >

                            <i class="fas fa-user text-sm"></i>

                        </div>

                        <div class="overflow-hidden">

                            <div
                                class="text-xs text-slate-400"
                            >
                                أهلاً بك،
                            </div>

                            <div
                                class="text-sm font-bold text-white truncate"
                            >
                                {{
                                    adminUser?.name
                                    ||
                                    'Admin Tester'
                                }}
                            </div>

                        </div>

                    </div>


                    <div
                        class="flex items-center gap-2 text-slate-400"
                    >

                        <button
                            class="hover:text-white transition"
                            title="الإشعارات"
                        >

                            <i class="fas fa-bell"></i>

                        </button>

                        <button
                            class="hover:text-white transition"
                            title="الرسائل"
                        >

                            <i class="fas fa-envelope"></i>

                        </button>

                    </div>

                </div>


                <!-- Navigation -->

                <nav
                    class="flex-1 px-4 py-4 space-y-1 overflow-y-auto"
                >

                    <template
                        v-for="tab in tabs"
                        :key="tab.id"
                    >

                        <div
                            v-if="tab.sectionHeader"
                            class="pt-4 pb-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                        >

                            {{ tab.sectionHeader }}

                        </div>


                        <button
                            @click="navigate(tab)"
                            :class="[

                                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium relative',

                                activeTab === tab.id

                                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 font-semibold'

                                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'

                            ]"
                        >

                            <span
                                v-if="
                                    activeTab === tab.id
                                "
                                class="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r"
                            ></span>

                            <i
                                :class="[
                                    tab.icon,
                                    'w-5 text-center text-base'
                                ]"
                            ></i>

                            <span>
                                {{ tab.name }}
                            </span>

                        </button>

                    </template>

                </nav>


                <!-- Logout -->

                <div
                    class="p-4 border-t border-slate-800/80"
                >

                    <button
                        @click="logout"
                        class="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                    >

                        <i
                            class="fas fa-sign-out-alt w-5 text-center"
                        ></i>

                        <span>
                            تسجيل الخروج
                        </span>

                    </button>

                </div>

            </aside>


            <!-- Main -->

            <main
                class="flex-1 flex flex-col h-screen overflow-y-auto"
            >

                <div class="p-8 flex-1">

                    <div
                        class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[500px]"
                    >

                        <component
                            :is="currentComponent"
                        ></component>

                    </div>

                </div>

            </main>


            <!-- Global Loader -->

            <div
                v-if="globalLoading"
                class="fixed inset-0 z-[9999] bg-white/70 flex items-center justify-center backdrop-blur-sm"
            >

                <div
                    class="flex flex-col items-center"
                >

                    <i
                        class="fas fa-spinner fa-spin text-5xl text-sky-600"
                    ></i>

                    <p
                        class="mt-4 font-bold text-slate-700"
                    >
                        جاري المعالجة...
                    </p>

                </div>

            </div>

        </div>

    `,


    setup() {

        /*
        |--------------------------------------------------------------------------
        | State
        |--------------------------------------------------------------------------
        */

        const activeTab =
            ref('overview');


        const globalLoading =
            ref(false);


        const adminUser =
            ref(null);


        const showOfflineOverlay =
            ref(!navigator.onLine);


        /*
        |--------------------------------------------------------------------------
        | Navigation
        |--------------------------------------------------------------------------
        */

        const tabs = [

            {
                id: 'overview',
                name: 'الرئيسية',
                icon: 'fas fa-th-large'
            },

            {
                id: 'medicine',
                name: 'إدارة الأدوية',
                icon: 'fas fa-pills',
                sectionHeader:
                    'إدارة المخزون'
            },

            {
                id: 'purchases',
                name: 'إدارة المشتريات',
                icon: 'fas fa-shopping-cart'
            },

            {
                id: 'shifts',
                name: 'الورديات',
                icon: 'fas fa-user-clock',
                sectionHeader:
                    'المالية'
            },

            {
                id: 'debts',
                name: 'الديون',
                icon: 'fas fa-file-invoice-dollar'
            },

            {
                id: 'expenses',
                name: 'المصروفات',
                icon: 'fas fa-wallet'
            },

            {
                id: 'salaries',
                name: 'الرواتب',
                icon: 'fas fa-hand-holding-usd'
            },

            {
                id: 'pricing',
                name: 'محرك الأسعار',
                icon: 'fas fa-dollar-sign'
            },

            {
                id: 'branches',
                name: 'الفروع',
                icon: 'fas fa-code-branch',
                sectionHeader:
                    'عام'
            },

            {
                id: 'categories',
                name: 'التصنيفات',
                icon: 'fas fa-tags'
            },

            {
                id: 'suppliers',
                name: 'الموردين',
                icon: 'fas fa-truck'
            },

            {
                id: 'users',
                name: 'المستخدمين',
                icon: 'fas fa-users'
            },

            {
                id: 'analytics_link',
                name: 'التحليلات',
                icon: 'fas fa-chart-bar',
                sectionHeader:
                    'التحليلات'
            },

            {
                id: 'stocktaking',
                name: 'الجرد',
                icon: 'fas fa-clipboard-list'
            },

            {
                id: 'about',
                name: 'حول النظام',
                icon: 'fas fa-info-circle',
                sectionHeader:
                    'النظام والإعدادات'
            }

        ];


        /*
        |--------------------------------------------------------------------------
        | Connection
        |--------------------------------------------------------------------------
        */

        const updateConnectionStatus =
            () => {

                showOfflineOverlay.value =
                    !navigator.onLine;

            };


        /*
        |--------------------------------------------------------------------------
        | Global Loader
        |--------------------------------------------------------------------------
        */

        const updateGlobalLoading =
            (event) => {

                globalLoading.value =
                    !!event.detail?.loading;

            };


        /*
        |--------------------------------------------------------------------------
        | Navigation
        |--------------------------------------------------------------------------
        */

        const navigate =
            (tab) => {

                if (
                    tab.id ===
                    'analytics_link'
                ) {

                    window.location.href =
                        'analytics.html';

                    return;

                }

                activeTab.value =
                    tab.id;

            };


        /*
        |--------------------------------------------------------------------------
        | Authentication
        |--------------------------------------------------------------------------
        */

        const checkAuth =
            async () => {

                try {

                    const response =
                        await axios.get(
                            `${API_BASE}/current-user`
                        );


                    if (
                        response.data.role !==
                        'admin'
                    ) {

                        window.location.href =
                            'pos.html';

                        return;

                    }


                    adminUser.value =
                        response.data;

                }

                catch (error) {

                    console.error(
                        'Authentication failed:',
                        error
                    );


                    /*
                    | Keep cached user available
                    | while offline.
                    */

                    const cachedUser =
                        await getCachedUser();


                    if (
                        !navigator.onLine &&
                        cachedUser &&
                        cachedUser.role === 'admin'
                    ) {

                        adminUser.value =
                            cachedUser;

                        return;

                    }


                    clearCachedUser();

                    localStorage.removeItem(
                        'token'
                    );

                    window.location.href =
                        'login.html';

                }

            };


        /*
        |--------------------------------------------------------------------------
        | Initial Data
        |--------------------------------------------------------------------------
        */

        const initApp =
            async () => {

                try {

                    if (
                        !adminUser.value
                    ) {

                        const userRes =
                            await axios.get(
                                `${API_BASE}/current-user`
                            );

                        adminUser.value =
                            userRes.data;

                    }

                }

                catch (error) {

                    console.error(
                        'Could not load admin user:',
                        error
                    );

                }

            };


        /*
        |--------------------------------------------------------------------------
        | Current Component
        |--------------------------------------------------------------------------
        */

        const currentComponent =
            computed(() => {

                const map = {

                    overview:
                        Overview,

                    branches:
                        Branches,

                    categories:
                        Categories,

                    purchases:
                        Purchases,

                    about:
                        About,

                    suppliers:
                        Suppliers,

                    medicine:
                        Medicine,

                    users:
                        Users,

                    shifts:
                        Shifts,

                    debts:
                        Debts,

                    pricing:
                        Pricing,

                    analytics:
                        Analytics,

                    stocktaking:
                        Inventory,

                    expenses:
                        Expenses,

                    salaries:
                        Salaries

                };


                return (
                    map[
                        activeTab.value
                    ]
                    ||
                    Overview
                );

            });


        /*
        |--------------------------------------------------------------------------
        | Lifecycle
        |--------------------------------------------------------------------------
        */

        onMounted(
            async () => {

                window.addEventListener(
                    'online',
                    updateConnectionStatus
                );

                window.addEventListener(
                    'offline',
                    updateConnectionStatus
                );

                window.addEventListener(
                    globalLoadingEvent,
                    updateGlobalLoading
                );


                updateConnectionStatus();


                await checkAuth();

                await initApp();

            }
        );


        onUnmounted(
            () => {

                window.removeEventListener(
                    'online',
                    updateConnectionStatus
                );

                window.removeEventListener(
                    'offline',
                    updateConnectionStatus
                );

                window.removeEventListener(
                    globalLoadingEvent,
                    updateGlobalLoading
                );

            }
        );


        /*
        |--------------------------------------------------------------------------
        | Logout
        |--------------------------------------------------------------------------
        */

        const logout =
            () => {

                clearCachedUser();

                localStorage.removeItem(
                    'token'
                );

                localStorage.removeItem(
                    'offline_mode'
                );

                delete axios
                    .defaults
                    .headers
                    .common[
                        'Authorization'
                    ];


                window.location.href =
                    'login.html';

            };


        /*
        |--------------------------------------------------------------------------
        | Return
        |--------------------------------------------------------------------------
        */

        return {

            activeTab,

            tabs,

            currentComponent,

            adminUser,

            showOfflineOverlay,

            globalLoading,

            logout,

            navigate

        };

    }

}).mount('#app');