import '../../css/app.css';

import {
    createApp,
    ref,
    onMounted,
    onUnmounted,
    nextTick
} from 'vue';
import * as Vue from 'vue';
import axios from 'axios';

import {
    getCachedUser
} from '../auth.js';

import { API_BASE } from '../config.js';
import {
    updatePendingSalesShiftId
} from '../offline-db.js';

/*
|--------------------------------------------------------------------------
| PharmaFlow - Shift Manager
|--------------------------------------------------------------------------
|
| مسؤولية هذا الملف بالكامل:
|
| 1. فتح الورديات Online / Offline
| 2. تخزين الوردية المحلية
| 3. تسجيل أحداث OPEN / CLOSE
| 4. مزامنة الورديات المحلية مع الخادم
| 5. إنشاء local -> server mapping
| 6. توفير الوردية الحالية لـ POS
| 7. إغلاق الوردية بناءً على طلب POS
|
| POS لا يدير queue الخاصة بالورديات.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Local Storage Keys
|--------------------------------------------------------------------------
*/

const SHIFT_CACHE_PREFIX =
    'pharmaflow_shift_user_';

const SHIFT_EVENTS_PREFIX =
    'pharmaflow_pending_shift_events_user_';

const SHIFT_MAPPINGS_PREFIX =
    'pharmaflow_shift_mappings_user_';

const LEGACY_PENDING_OPEN_PREFIX =
    'pharmaflow_pending_shift_open_user_';


/*
|--------------------------------------------------------------------------
| Generic Helpers
|--------------------------------------------------------------------------
*/

function safeJsonParse(value, fallback = null) {

    try {

        return value
            ? JSON.parse(value)
            : fallback;

    } catch {

        return fallback;

    }

}


function clone(value) {

    try {

        return JSON.parse(
            JSON.stringify(value)
        );

    } catch {

        return value;

    }

}


/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

async function getCurrentUser() {

    try {

        const user =
            await getCachedUser();

        if (user?.id) {
            return user;
        }

    } catch (error) {

        console.warn(
            'Unable to get cached user:',
            error
        );

    }

    return null;

}


function getToken() {

    return localStorage.getItem(
        'token'
    );

}


/*
|--------------------------------------------------------------------------
| Shift Cache
|--------------------------------------------------------------------------
*/

function getShiftCacheKey(userId) {

    if (!userId) {
        return null;
    }

    return (
        `${SHIFT_CACHE_PREFIX}${userId}`
    );

}


function getCachedShift(userId) {

    const key =
        getShiftCacheKey(userId);

    if (!key) {
        return null;
    }

    return safeJsonParse(
        localStorage.getItem(key),
        null
    );

}


function saveCachedShift(
    userId,
    shift
) {

    const key =
        getShiftCacheKey(userId);

    if (!key || !shift) {
        return;
    }

    const existing =
        getCachedShift(userId);

    const nextShift = {

        ...(existing || {}),

        ...clone(shift),

        cached_at:
            new Date().toISOString()

    };

    localStorage.setItem(
        key,
        JSON.stringify(nextShift)
    );

}


function clearCachedShift(userId) {

    const key =
        getShiftCacheKey(userId);

    if (!key) {
        return;
    }

    localStorage.removeItem(key);

}


/*
|--------------------------------------------------------------------------
| Shift Event Queue
|--------------------------------------------------------------------------
*/

function getShiftEventsKey(userId) {

    if (!userId) {
        return null;
    }

    return (
        `${SHIFT_EVENTS_PREFIX}${userId}`
    );

}


function getPendingShiftEvents(userId) {

    const key =
        getShiftEventsKey(userId);

    if (!key) {
        return [];
    }

    const events =
        safeJsonParse(
            localStorage.getItem(key),
            []
        );

    return Array.isArray(events)
        ? events
        : [];

}


function savePendingShiftEvents(
    userId,
    events
) {

    const key =
        getShiftEventsKey(userId);

    if (!key) {
        return;
    }

    localStorage.setItem(
        key,
        JSON.stringify(
            Array.isArray(events)
                ? events
                : []
        )
    );

}


function enqueueShiftEvent(
    userId,
    event
) {

    if (!userId || !event) {
        return null;
    }

    const events =
        getPendingShiftEvents(userId);

    const normalizedEvent = {

        ...event,

        event_id:
            event.event_id ||
            crypto.randomUUID(),

        created_at:
            event.created_at ||
            new Date().toISOString()

    };

    events.push(
        normalizedEvent
    );

    savePendingShiftEvents(
        userId,
        events
    );

    return normalizedEvent;

}


/*
|--------------------------------------------------------------------------
| Shift Mapping
|--------------------------------------------------------------------------
|
| local_shift_id -> server_shift_id
|
|--------------------------------------------------------------------------
*/

function getShiftMappingsKey(userId) {

    if (!userId) {
        return null;
    }

    return (
        `${SHIFT_MAPPINGS_PREFIX}${userId}`
    );

}
/*
|--------------------------------------------------------------------------
| Migrate Offline Sales To Server Shift
|--------------------------------------------------------------------------
|
| بعد إنشاء الوردية على السيرفر:
|
| local shift ID
|       ↓
| server shift ID
|
| يتم تحديث جميع الفواتير المحلية
| التي كانت مرتبطة بالـ local shift ID.
|
|--------------------------------------------------------------------------
*/

async function migrateOfflineSalesToServerShift(
    userId,
    localShiftId,
    serverShiftId
) {
    if (
        !userId ||
        !localShiftId ||
        !serverShiftId
    ) {
        return 0;
    }

    const numericServerShiftId =
        Number(serverShiftId);

    if (
        !Number.isInteger(
            numericServerShiftId
        ) ||
        numericServerShiftId <= 0
    ) {
        console.warn(
            'Invalid server shift ID during sales migration:',
            serverShiftId
        );

        return 0;
    }

    try {

        const updated =
            await updatePendingSalesShiftId(
                localShiftId,
                numericServerShiftId
            );

        console.log(
            'Offline sales migrated to server shift:',
            {
                user_id:
                    userId,

                local_shift_id:
                    localShiftId,

                server_shift_id:
                    numericServerShiftId,

                updated_sales:
                    updated
            }
        );

        return updated;

    } catch (error) {

        console.error(
            'Failed to migrate offline sales shift ID:',
            error
        );

        /*
        |--------------------------------------------------------------------------
        | لا نفشل مزامنة الوردية بسبب مشكلة في ترحيل الفواتير.
        |--------------------------------------------------------------------------
        |
        | لكننا نعيد رمي الخطأ حتى تعرف طبقة المزامنة
        | أن عملية migration لم تكتمل.
        |--------------------------------------------------------------------------
        */

        throw error;
    }
}

function getShiftMappings(userId) {

    const key =
        getShiftMappingsKey(userId);

    if (!key) {
        return {};
    }

    const mappings =
        safeJsonParse(
            localStorage.getItem(key),
            {}
        );

    return (
        mappings &&
        typeof mappings === 'object'
    )
        ? mappings
        : {};

}


function saveShiftMapping(
    userId,
    localShiftId,
    serverShiftId
) {

    if (
        !userId ||
        !localShiftId ||
        !serverShiftId
    ) {
        return;
    }

    const key =
        getShiftMappingsKey(userId);

    if (!key) {
        return;
    }

    const mappings =
        getShiftMappings(userId);

    mappings[
        String(localShiftId)
    ] =
        Number(serverShiftId);

    localStorage.setItem(
        key,
        JSON.stringify(mappings)
    );

}


function getShiftMapping(
    userId,
    localShiftId
) {

    if (
        !userId ||
        !localShiftId
    ) {
        return null;
    }

    const mappings =
        getShiftMappings(userId);

    return (
        mappings[
            String(localShiftId)
        ]
        || null
    );

}


/*
|--------------------------------------------------------------------------
| Legacy Pending OPEN
|--------------------------------------------------------------------------
*/

function getLegacyPendingOpenKey(userId) {

    if (!userId) {
        return null;
    }

    return (
        `${LEGACY_PENDING_OPEN_PREFIX}${userId}`
    );

}


function migrateLegacyPendingOpen(userId) {

    const key =
        getLegacyPendingOpenKey(userId);

    if (!key) {
        return;
    }

    const legacy =
        safeJsonParse(
            localStorage.getItem(key),
            null
        );

    if (
        !legacy?.local_shift_id
    ) {
        return;
    }

    const events =
        getPendingShiftEvents(userId);

    const alreadyExists =
        events.some(
            event =>
                event.type === 'open' &&
                String(
                    event.local_shift_id
                ) ===
                String(
                    legacy.local_shift_id
                )
        );

    if (!alreadyExists) {

        enqueueShiftEvent(
            userId,
            {

                type: 'open',

                local_shift_id:
                    legacy.local_shift_id,

                opening_cash:
                    Number(
                        legacy.opening_cash || 0
                    ),

                user_id:
                    legacy.user_id ||
                    userId,

                branch_id:
                    legacy.branch_id ||
                    null,

                created_at:
                    legacy.created_at ||
                    new Date().toISOString()

            }
        );

    }

    localStorage.removeItem(key);

}


/*
|--------------------------------------------------------------------------
| Build Local Shift
|--------------------------------------------------------------------------
*/

function buildLocalShiftFromOpenEvent(
    event,
    userId
) {

    return {

        id:
            event.local_shift_id,

        local_shift_id:
            event.local_shift_id,

        server_shift_id:
            null,

        user_id:
            event.user_id ||
            userId,

        branch_id:
            event.branch_id ||
            null,

        opening_cash:
            Number(
                event.opening_cash || 0
            ),

        expected_cash:
            Number(
                event.opening_cash || 0
            ),

        cash_sales:
            0,

        card_sales:
            0,

        sales_count:
            0,

        debts_amount:
            0,

        withdraw_amount:
            0,

        expenses_amount:
            0,

        refund_amount:
            0,

        status:
            'open',

        offline:
            true,

        pending_sync:
            true,

        sync_status:
            'pending',

        opened_at:
            event.created_at,

        closed_at:
            null

    };

}


/*
|--------------------------------------------------------------------------
| Find Local Open Shift
|--------------------------------------------------------------------------
*/

function getLocalOpenShift(userId) {

    if (!userId) {
        return null;
    }

    const cached =
        getCachedShift(userId);

    if (
        cached &&
        cached.status !== 'closed' &&
        cached.offline_closed !== true
    ) {

        return {

            source:
                'local-cache',

            shift:
                clone(cached)

        };

    }

    const events =
        getPendingShiftEvents(userId);

    if (!events.length) {
        return null;
    }

    const sorted =
        [...events].sort(
            (a, b) =>
                new Date(
                    a.created_at || 0
                ) -
                new Date(
                    b.created_at || 0
                )
        );

    for (
        let i = sorted.length - 1;
        i >= 0;
        i--
    ) {

        const event =
            sorted[i];

        if (
            event.type === 'close'
        ) {

            return null;

        }

        if (
            event.type === 'open'
        ) {

            return {

                source:
                    'local-pending',

                shift:
                    buildLocalShiftFromOpenEvent(
                        event,
                        userId
                    )

            };

        }

    }

    return null;

}


/*
|--------------------------------------------------------------------------
| Get Server Current Shift
|--------------------------------------------------------------------------
*/

async function getServerOpenShift() {

    if (!navigator.onLine) {
        return null;
    }

    const token =
        getToken();

    if (!token) {
        return null;
    }

    try {

        const response =
            await axios.get(
                `${API_BASE}/shift/current`,
                {

                    headers: {

                        Authorization:
                            `Bearer ${token}`,

                        Accept:
                            'application/json'

                    },

                    params: {
                        _ts: Date.now()
                    }

                }
            );

        if (
            response.data?.opened &&
            response.data?.shift
        ) {

            return {

                source:
                    'server',

                shift:
                    response.data.shift

            };

        }

        return null;

    } catch (error) {

        console.warn(
            'Could not check server shift:',
            error
        );

        return null;

    }

}


/*
|--------------------------------------------------------------------------
| Synchronize Pending Shift Events
|--------------------------------------------------------------------------
|
| Strict order:
|
| OPEN A
| CLOSE A
| OPEN B
| CLOSE B
|
|--------------------------------------------------------------------------
*/

export async function syncPendingShiftEvents() {

    if (!navigator.onLine) {
        return false;
    }

    const user =
        await getCurrentUser();

    if (!user?.id) {
        return false;
    }

    const token =
        getToken();

    if (!token) {
        return false;
    }

    const userId =
        user.id;

    migrateLegacyPendingOpen(
        userId
    );

    const events =
        getPendingShiftEvents(
            userId
        );

    if (!events.length) {
        return true;
    }

    const sortedEvents =
        [...events].sort(
            (a, b) =>
                new Date(
                    a.created_at || 0
                ) -
                new Date(
                    b.created_at || 0
                )
        );

    const completedEventIds = [];

    for (
        const event of sortedEvents
    ) {

        try {

            /*
            |--------------------------------------------------------------------------
            | OPEN
            |--------------------------------------------------------------------------
            */

            if (
                event.type === 'open'
            ) {

                let serverShift =
                    null;

                try {

                    const current =
                        await axios.get(
                            `${API_BASE}/shift/current`,
                            {

                                headers: {

                                    Authorization:
                                        `Bearer ${token}`,

                                    Accept:
                                        'application/json'

                                },

                                params: {
                                    _ts: Date.now()
                                }

                            }
                        );

                    if (
                        current.data?.opened &&
                        current.data?.shift
                    ) {

                        serverShift =
                            current.data.shift;

                    }

                } catch (error) {

                    if (
                        error.response?.status === 401
                    ) {

                        throw error;

                    }

                }

                /*
                | If there is no server shift,
                | create one.
                */

                if (!serverShift) {

                    const response =
                        await axios.post(
                            `${API_BASE}/shift/open`,
                            {

                                opening_cash:
                                    Number(
                                        event.opening_cash || 0
                                    )

                            },
                            {

                                headers: {

                                    Authorization:
                                        `Bearer ${token}`,

                                    Accept:
                                        'application/json'

                                }

                            }
                        );

                    serverShift =
                        response.data?.shift ||
                        response.data?.data ||
                        response.data;

                }

                if (!serverShift?.id) {

                    throw new Error(
                        'لم يتم الحصول على معرف الوردية من الخادم'
                    );

                }

                /*
                | local -> server mapping
                */

               /*
                |--------------------------------------------------------------------------
                | Save local -> server mapping
                |--------------------------------------------------------------------------
                */

                const serverShiftId =
                    Number(
                        serverShift.id
                    );

                saveShiftMapping(
                    userId,
                    event.local_shift_id,
                    serverShiftId
                );


                /*
                |--------------------------------------------------------------------------
                | Migrate pending offline sales
                |--------------------------------------------------------------------------
                |
                | أي فاتورة تم إنشاؤها أثناء Offline
                | وتحمل local_shift_id يجب أن تصبح
                | مرتبطة بالـ server shift ID.
                |--------------------------------------------------------------------------
                */

                await migrateOfflineSalesToServerShift(
                    userId,
                    event.local_shift_id,
                    serverShiftId
                );

                const existing =
                    getCachedShift(
                        userId
                    );

                saveCachedShift(
                    userId,
                    {

                        ...(existing || {}),

                        ...serverShift,

                        id:
                            serverShift.id,

                        local_shift_id:
                            event.local_shift_id,

                        server_shift_id:
                            Number(
                                serverShift.id
                            ),

                        status:
                            'open',

                        offline:
                            false,

                        pending_sync:
                            false,

                        sync_status:
                            'synced'

                    }
                );

                console.log(
                    'تمت مزامنة OPEN:',
                    {

                        local_shift_id:
                            event.local_shift_id,

                        server_shift_id:
                            serverShift.id

                    }
                );

                completedEventIds.push(
                    event.event_id
                );

                continue;

            }


            /*
            |--------------------------------------------------------------------------
            | CLOSE
            |--------------------------------------------------------------------------
            */

            if (
                event.type === 'close'
            ) {

                let serverShiftId =
                    getShiftMapping(
                        userId,
                        event.local_shift_id
                    );

                /*
                | If local ID is already a real server ID,
                | preserve compatibility.
                */

                if (!serverShiftId) {

                    const cached =
                        getCachedShift(
                            userId
                        );

                    if (
                        cached &&
                        Number(cached.server_shift_id)
                    ) {

                        serverShiftId =
                            Number(
                                cached.server_shift_id
                            );

                    }

                }

                /*
                | CLOSE cannot be sent before OPEN
                | mapping exists.
                */

                if (!serverShiftId) {

                    console.warn(
                        'CLOSE مؤجل: لا يوجد mapping للوردية',
                        event
                    );

                    break;

                }

                /*
                | Verify server state.
                */

                let serverCurrentShift =
                    null;

                try {

                    const current =
                        await axios.get(
                            `${API_BASE}/shift/current`,
                            {

                                headers: {

                                    Authorization:
                                        `Bearer ${token}`,

                                    Accept:
                                        'application/json'

                                },

                                params: {
                                    _ts: Date.now()
                                }

                            }
                        );

                    if (
                        current.data?.opened &&
                        current.data?.shift
                    ) {

                        serverCurrentShift =
                            current.data.shift;

                    }

                } catch (error) {

                    throw error;

                }

                /*
                | If server already has no open shift,
                | CLOSE is considered synchronized.
                */

                if (!serverCurrentShift) {

                    const cached =
                        getCachedShift(
                            userId
                        );

                    if (cached) {

                        saveCachedShift(
                            userId,
                            {

                                ...cached,

                                status:
                                    'closed',

                                closing_cash:
                                    Number(
                                        event.closing_cash || 0
                                    ),

                                pending_sync:
                                    false,

                                sync_status:
                                    'synced',

                                offline_closed:
                                    false

                            }
                        );

                    }

                    completedEventIds.push(
                        event.event_id
                    );

                    continue;

                }

                /*
                | Close current server shift.
                */

                await axios.post(
                    `${API_BASE}/shift/close`,
                    {

                        closing_cash:
                            Number(
                                event.closing_cash || 0
                            )

                    },
                    {

                        headers: {

                            Authorization:
                                `Bearer ${token}`,

                            Accept:
                                'application/json'

                        }

                    }
                );

                const cached =
                    getCachedShift(
                        userId
                    );

                if (cached) {

                    saveCachedShift(
                        userId,
                        {

                            ...cached,

                            status:
                                'closed',

                            closing_cash:
                                Number(
                                    event.closing_cash || 0
                                ),

                            pending_sync:
                                false,

                            sync_status:
                                'synced',

                            offline_closed:
                                false

                        }
                    );

                }

                console.log(
                    'تمت مزامنة CLOSE:',
                    {

                        local_shift_id:
                            event.local_shift_id,

                        server_shift_id:
                            serverShiftId

                    }
                );

                completedEventIds.push(
                    event.event_id
                );

            }

        } catch (error) {

            console.error(
                'Shift synchronization failed:',
                {

                    event,

                    status:
                        error.response?.status,

                    response:
                        error.response?.data,

                    error

                }
            );

            /*
            | Preserve remaining queue.
            */

            break;

        }

    }

    /*
    |--------------------------------------------------------------------------
    | Remove only successfully completed events
    |--------------------------------------------------------------------------
    */

    if (
        completedEventIds.length
    ) {

        const remaining =
            getPendingShiftEvents(
                userId
            ).filter(
                event =>
                    !completedEventIds.includes(
                        event.event_id
                    )
            );

        savePendingShiftEvents(
            userId,
            remaining
        );

    }

    return true;

}


/*
|--------------------------------------------------------------------------
| Backward Compatibility
|--------------------------------------------------------------------------
*/

export async function syncPendingShiftOpen() {

    return syncPendingShiftEvents();

}


/*
|--------------------------------------------------------------------------
| Current Shift API FOR POS
|--------------------------------------------------------------------------
|
| POS should call only this function.
|
|--------------------------------------------------------------------------
*/

export async function getCurrentShiftForPOS() {

    const user =
        await getCurrentUser();

    if (!user?.id) {
        return null;
    }

    const userId =
        user.id;

    /*
    |--------------------------------------------------------------------------
    | First migrate old data.
    |--------------------------------------------------------------------------
    */

    migrateLegacyPendingOpen(
        userId
    );

    /*
    |--------------------------------------------------------------------------
    | If online, synchronize local shifts first.
    |--------------------------------------------------------------------------
    */

    if (navigator.onLine) {

        try {

            await syncPendingShiftEvents();

        } catch (error) {

            console.warn(
                'Shift sync before POS read failed:',
                error
            );

        }

    }

    /*
    |--------------------------------------------------------------------------
    | Local state
    |--------------------------------------------------------------------------
    */

    const localState =
        getLocalOpenShift(
            userId
        );

    /*
    |--------------------------------------------------------------------------
    | Offline
    |--------------------------------------------------------------------------
    */

    if (!navigator.onLine) {

        return (
            localState?.shift
            ? clone(localState.shift)
            : null
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Online -> server state
    |--------------------------------------------------------------------------
    */

    const serverState =
        await getServerOpenShift();

    /*
    |--------------------------------------------------------------------------
    | Server has an open shift.
    |--------------------------------------------------------------------------
    */

    if (
        serverState?.shift
    ) {

        const serverShift =
            clone(
                serverState.shift
            );

        const localShift =
            localState?.shift ||
            {};

        const localShiftId =
            localShift.local_shift_id ||
            localShift.local_id ||
            serverShift.local_shift_id ||
            serverShift.id;

        /*
        | Ensure mapping exists.
        */

        if (
            localShiftId &&
            serverShift.id
        ) {

            saveShiftMapping(
                userId,
                localShiftId,
                serverShift.id
            );

        }

        const combined = {

            ...localShift,

            ...serverShift,

            id:
                serverShift.id,

            local_shift_id:
                localShiftId,

            server_shift_id:
                Number(
                    serverShift.id
                ),

            status:
                serverShift.status ||
                'open',

            offline:
                false,

            pending_sync:
                false,

            sync_status:
                'synced'

        };

        saveCachedShift(
            userId,
            combined
        );

        return clone(
            combined
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Server has no open shift.
    |--------------------------------------------------------------------------
    |
    | If a local pending shift exists, keep it.
    | It may be waiting for synchronization.
    |
    |--------------------------------------------------------------------------
    */

    if (
        localState?.shift
    ) {

        return clone(
            localState.shift
        );

    }

    return null;

}


/*
|--------------------------------------------------------------------------
| Close Current Shift FROM POS
|--------------------------------------------------------------------------
|
| POS does NOT implement Online / Offline logic.
|
| It calls this function.
|
|--------------------------------------------------------------------------
*/

export async function closeCurrentShiftFromPOS(
    shift,
    closingCash,
    accountingBalance = 0
) {

    if (!shift) {

        throw new Error(
            'لا توجد وردية مفتوحة حالياً'
        );

    }

    const user =
        await getCurrentUser();

    if (!user?.id) {

        throw new Error(
            'بيانات المستخدم غير متوفرة'
        );

    }

    const userId =
        user.id;

    const amount =
        Number(
            closingCash || 0
        );

    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {

        throw new Error(
            'مبلغ الإغلاق غير صحيح'
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Resolve local ID
    |--------------------------------------------------------------------------
    */

    const localShiftId =
        shift.local_shift_id ||
        shift.local_id ||
        shift.id;

    /*
    |--------------------------------------------------------------------------
    | ONLINE
    |--------------------------------------------------------------------------
    */

    if (navigator.onLine) {

        const token =
            getToken();

        if (!token) {

            throw new Error(
                'جلسة الدخول غير متوفرة'
            );

        }

        /*
        | If this is an offline shift,
        | synchronize its OPEN first.
        */

        const mapping =
            getShiftMapping(
                userId,
                localShiftId
            );

        if (
            shift.pending_sync === true ||
            shift.offline === true
        ) {

            await syncPendingShiftEvents();

        }

        /*
        | Re-check mapping after synchronization.
        */

        const serverShiftId =
            getShiftMapping(
                userId,
                localShiftId
            ) ||
            shift.server_shift_id ||
            shift.server_id ||
            (
                Number.isFinite(
                    Number(shift.id)
                )
                    ? Number(shift.id)
                    : null
            );

        /*
        | Close on server.
        |
        | Backend closes current user's open shift.
        */

        await axios.post(
            `${API_BASE}/shift/close`,
            {

                closing_cash:
                    amount

            },
            {

                headers: {

                    Authorization:
                        `Bearer ${token}`,

                    Accept:
                        'application/json'

                },

                params: {
                    _ts: Date.now()
                }

            }
        );

        /*
        | Update local state.
        */

        const closedShift = {

            ...clone(shift),

            status:
                'closed',

            closing_cash:
                amount,

            actual_cash:
                amount,

            accounting_balance:
                Number(
                    accountingBalance || 0
                ),

            difference:
                amount -
                Number(
                    accountingBalance || 0
                ),

            pending_sync:
                false,

            sync_status:
                'synced',

            offline_closed:
                false,

            closed_at:
                new Date().toISOString(),

            server_shift_id:
                serverShiftId ||
                shift.server_shift_id ||
                shift.id

        };

        if (
            closedShift.server_shift_id &&
            localShiftId
        ) {

            saveShiftMapping(
                userId,
                localShiftId,
                closedShift.server_shift_id
            );

        }

        saveCachedShift(
            userId,
            closedShift
        );

        /*
        | Remove obsolete CLOSE events for this shift.
        */

        const remaining =
            getPendingShiftEvents(
                userId
            ).filter(
                event =>
                    !(
                        event.type === 'close' &&
                        String(
                            event.local_shift_id
                        ) ===
                        String(
                            localShiftId
                        )
                    )
            );

        savePendingShiftEvents(
            userId,
            remaining
        );

        return clone(
            closedShift
        );

    }


    /*
    |--------------------------------------------------------------------------
    | OFFLINE
    |--------------------------------------------------------------------------
    */

    const closeEvent =
        enqueueShiftEvent(
            userId,
            {

                type:
                    'close',

                local_shift_id:
                    localShiftId,

                closing_cash:
                    amount,

                accounting_balance:
                    Number(
                        accountingBalance || 0
                    ),

                difference:
                    amount -
                    Number(
                        accountingBalance || 0
                    ),

                user_id:
                    userId,

                branch_id:
                    shift.branch_id ||
                    user.branch_id ||
                    null

            }
        );

    /*
    | If this shift already has a real server ID,
    | preserve mapping.
    */

    const serverShiftId =
        shift.server_shift_id ||
        shift.server_id;

    if (
        serverShiftId
    ) {

        saveShiftMapping(
            userId,
            localShiftId,
            serverShiftId
        );

    }

    const closedShift = {

        ...clone(shift),

        status:
            'closed',

        closing_cash:
            amount,

        actual_cash:
            amount,

        accounting_balance:
            Number(
                accountingBalance || 0
            ),

        difference:
            amount -
            Number(
                accountingBalance || 0
            ),

        pending_sync:
            true,

        sync_status:
            'pending',

        offline_closed:
            true,

        closed_at:
            new Date().toISOString(),

        close_event_id:
            closeEvent?.event_id ||
            null

    };

    saveCachedShift(
        userId,
        closedShift
    );

    return clone(
        closedShift
    );

}


/*
|--------------------------------------------------------------------------
| Open Shift
|--------------------------------------------------------------------------
*/

async function openShiftCore(
    openingCash,
    redirectToPOS = true
) {

    const user =
        await getCurrentUser();

    if (!user?.id) {

        throw new Error(
            'بيانات المستخدم غير متوفرة'
        );

    }

    const amount =
        Number(
            openingCash || 0
        );

    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {

        throw new Error(
            'الرصيد الافتتاحي غير صحيح'
        );

    }

    /*
    |--------------------------------------------------------------------------
    | First synchronize pending shifts if possible.
    |--------------------------------------------------------------------------
    */

    if (navigator.onLine) {

        try {

            await syncPendingShiftEvents();

        } catch (error) {

            console.warn(
                'Pending shift synchronization failed before OPEN:',
                error
            );

        }

    }

    /*
    |--------------------------------------------------------------------------
    | Prevent duplicate local open shift.
    |--------------------------------------------------------------------------
    */

    const local =
        getLocalOpenShift(
            user.id
        );

    if (
        local?.shift
    ) {

        if (redirectToPOS) {

            window.location.href =
                'pos.html';

        }

        return clone(
            local.shift
        );

    }

    /*
    |--------------------------------------------------------------------------
    | ONLINE OPEN
    |--------------------------------------------------------------------------
    */

    if (navigator.onLine) {

        const token =
            getToken();

        if (!token) {

            throw new Error(
                'جلسة الدخول غير متوفرة'
            );

        }

        try {

            const response =
                await axios.post(
                    `${API_BASE}/shift/open`,
                    {

                        opening_cash:
                            amount

                    },
                    {

                        headers: {

                            Authorization:
                                `Bearer ${token}`,

                            Accept:
                                'application/json'

                        },

                        params: {
                            _ts: Date.now()
                        }

                    }
                );

            const serverShift =
                response.data?.shift ||
                response.data?.data ||
                response.data;

            if (!serverShift?.id) {

                throw new Error(
                    'الخادم لم يرجع بيانات الوردية'
                );

            }

            const localShiftId =
                `server-${serverShift.id}`;

            saveShiftMapping(
                user.id,
                localShiftId,
                serverShift.id
            );

            const finalShift = {

                ...serverShift,

                id:
                    serverShift.id,

                local_shift_id:
                    localShiftId,

                server_shift_id:
                    Number(
                        serverShift.id
                    ),

                user_id:
                    user.id,

                branch_id:
                    serverShift.branch_id ||
                    user.branch_id,

                opening_cash:
                    Number(
                        serverShift.opening_cash ??
                        amount
                    ),

                status:
                    serverShift.status ||
                    'open',

                offline:
                    false,

                pending_sync:
                    false,

                sync_status:
                    'synced'

            };

            saveCachedShift(
                user.id,
                finalShift
            );

            if (redirectToPOS) {

                window.location.href =
                    'pos.html';

            }

            return clone(
                finalShift
            );

        } catch (error) {

            /*
            | Network failure:
            | fallback to local.
            */

            if (
                error.response
            ) {

                throw error;

            }

        }

    }

    /*
    |--------------------------------------------------------------------------
    | OFFLINE OPEN
    |--------------------------------------------------------------------------
    */

    const localShiftId =
        `offline-${crypto.randomUUID()}`;

    const pendingShift = {

        id:
            localShiftId,

        local_shift_id:
            localShiftId,

        server_shift_id:
            null,

        user_id:
            user.id,

        branch_id:
            user.branch_id,

        opening_cash:
            amount,

        expected_cash:
            amount,

        cash_sales:
            0,

        card_sales:
            0,

        sales_count:
            0,

        debts_amount:
            0,

        withdraw_amount:
            0,

        expenses_amount:
            0,

        refund_amount:
            0,

        status:
            'open',

        offline:
            true,

        pending_sync:
            true,

        sync_status:
            'pending',

        opened_at:
            new Date().toISOString(),

        closed_at:
            null

    };

    enqueueShiftEvent(
        user.id,
        {

            type:
                'open',

            local_shift_id:
                localShiftId,

            opening_cash:
                amount,

            user_id:
                user.id,

            branch_id:
                user.branch_id

        }
    );

    saveCachedShift(
        user.id,
        pendingShift
    );

    if (redirectToPOS) {

        window.location.href =
            'pos.html';

    }

    return clone(
        pendingShift
    );

}


/*
|--------------------------------------------------------------------------
| Vue Application
|--------------------------------------------------------------------------
|
| مهم:
|
| عند استيراد shift.js من pos.js لا يجب أن يتم mount للتطبيق.
|
|--------------------------------------------------------------------------
*/

if (
    document.getElementById('app')
) {

    createApp({

        template: `

            <div
                class="min-h-screen bg-slate-100 flex items-center justify-center p-6"
            >

                <div
                    class="w-full max-w-lg"
                >

                    <div
                        class="bg-white rounded-2xl shadow-xl border border-slate-200 p-8"
                    >

                        <div
                            class="text-center mb-8"
                        >

                            <div
                                class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"
                            >

                                <i
                                    class="fas fa-cash-register text-3xl"
                                ></i>

                            </div>

                            <h1
                                class="text-2xl font-bold text-slate-800"
                            >
                                فتح الوردية
                            </h1>

                            <p
                                class="text-sm text-slate-500 mt-2"
                            >
                                {{
                                    currentUser?.name ||
                                    'المستخدم الحالي'
                                }}
                            </p>

                            <p
                                v-if="currentUser?.branch?.name"
                                class="text-xs text-slate-400 mt-1"
                            >
                                الفرع:
                                {{ currentUser.branch.name }}
                            </p>

                        </div>


                        <div
                            v-if="!isOnline"
                            class="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4"
                        >

                            <div
                                class="flex items-start gap-3"
                            >

                                <i
                                    class="fas fa-wifi-slash mt-1"
                                ></i>

                                <div>

                                    <div
                                        class="font-bold"
                                    >
                                        وضع عدم الاتصال
                                    </div>

                                    <p
                                        class="text-sm mt-1"
                                    >
                                        سيتم حفظ فتح الوردية محليًا،
                                        وستتم مزامنته تلقائيًا عند عودة الإنترنت.
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div
                            v-if="cachedShift && cachedShift.status === 'open'"
                            class="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5"
                        >

                            <div
                                class="flex items-center justify-between mb-3"
                            >

                                <span
                                    class="font-bold text-emerald-800"
                                >
                                    توجد وردية مفتوحة
                                </span>

                                <span
                                    class="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full"
                                >
                                    {{
                                        isOnline
                                            ? 'محفوظة على الخادم'
                                            : 'محفوظة محلياً'
                                    }}
                                </span>

                            </div>


                            <div
                                class="grid grid-cols-2 gap-3 text-sm"
                            >

                                <div>

                                    <div
                                        class="text-slate-500"
                                    >
                                        الرصيد الافتتاحي
                                    </div>

                                    <div
                                        class="font-bold text-slate-800"
                                    >

                                        {{
                                            Number(
                                                cachedShift.opening_cash || 0
                                            ).toLocaleString()
                                        }}

                                        ج.س

                                    </div>

                                </div>


                                <div>

                                    <div
                                        class="text-slate-500"
                                    >
                                        الحالة
                                    </div>

                                    <div
                                        class="font-bold text-emerald-700"
                                    >
                                        مفتوحة
                                    </div>

                                </div>

                            </div>


                            <button
                                type="button"
                                @click="goToPOS"
                                class="w-full mt-5 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition"
                            >
                                متابعة إلى نقطة البيع
                            </button>

                        </div>


                        <form
                            v-if="!cachedShift || cachedShift.status !== 'open'"
                            @submit.prevent="openShift"
                            class="space-y-5"
                        >

                            <div>

                                <label
                                    class="block text-sm font-bold text-slate-700 mb-2"
                                >
                                    الرصيد الافتتاحي
                                </label>

                                <input
                                    v-model.number="openingCash"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    class="w-full border border-slate-300 rounded-xl px-4 py-4 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >

                                <p
                                    class="text-xs text-slate-400 mt-2 text-center"
                                >
                                    أدخل المبلغ الموجود فعليًا في الدرج عند بداية الوردية.
                                </p>

                            </div>


                            <button
                                type="submit"
                                :disabled="loading || !currentUser"
                                class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-4 rounded-xl font-bold text-lg transition"
                            >

                                <span
                                    v-if="loading"
                                >
                                    جاري فتح الوردية...
                                </span>

                                <span
                                    v-else
                                >
                                    فتح الوردية والانتقال للبيع
                                </span>

                            </button>

                        </form>


                        <button
                            v-if="!isOnline"
                            type="button"
                            @click="refreshState"
                            class="w-full mt-4 border border-slate-300 text-slate-700 py-3 rounded-xl hover:bg-slate-50 transition"
                        >
                            إعادة المحاولة
                        </button>

                    </div>

                </div>

            </div>

        `,

        setup() {

            const openingCash =
                ref(0);

            const loading =
                ref(false);

            const currentUser =
                ref(null);

            const cachedShift =
                ref(null);

            const shift =
                ref(null);

            const isOnline =
                ref(
                    navigator.onLine
                );


            /*
            |--------------------------------------------------------------------------
            | Go To POS
            |--------------------------------------------------------------------------
            */

            const goToPOS =
                () => {

                    window.location.href =
                        'pos.html';

                };


            /*
            |--------------------------------------------------------------------------
            | Apply State
            |--------------------------------------------------------------------------
            */

            const applyShiftState =
                async (shiftData) => {

                    if (!shiftData) {

                        shift.value =
                            null;

                        cachedShift.value =
                            null;

                        return null;

                    }

                    const plain =
                        clone(
                            shiftData
                        );

                    shift.value =
                        plain;

                    cachedShift.value =
                        plain;

                    if (
                        currentUser.value?.id
                    ) {

                        saveCachedShift(
                            currentUser.value.id,
                            plain
                        );

                    }

                    await nextTick();

                    return plain;

                };


            /*
            |--------------------------------------------------------------------------
            | Refresh State
            |--------------------------------------------------------------------------
            */

            const refreshState =
                async () => {

                    isOnline.value =
                        navigator.onLine;

                    currentUser.value =
                        await getCurrentUser();

                    if (
                        !currentUser.value?.id
                    ) {

                        return false;

                    }

                    const current =
                        await getCurrentShiftForPOS();

                    await applyShiftState(
                        current
                    );

                    return !!current;

                };


            /*
            |--------------------------------------------------------------------------
            | Open Shift
            |--------------------------------------------------------------------------
            */

            const openShift =
                async () => {

                    if (loading.value) {
                        return;
                    }

                    loading.value =
                        true;

                    try {

                        const result =
                            await openShiftCore(
                                openingCash.value,
                                true
                            );

                        return result;

                    } catch (error) {

                        console.error(
                            'Open shift error:',
                            error
                        );

                        alert(
                            error.response?.data?.message ||
                            error.message ||
                            'تعذر فتح الوردية'
                        );

                        return null;

                    } finally {

                        loading.value =
                            false;

                    }

                };


            /*
            |--------------------------------------------------------------------------
            | Online
            |--------------------------------------------------------------------------
            */

            const handleOnline =
                async () => {

                    isOnline.value =
                        true;

                    try {

                        await syncPendingShiftEvents();

                        await refreshState();

                    } catch (error) {

                        console.error(
                            'Online shift synchronization error:',
                            error
                        );

                    }

                };


            /*
            |--------------------------------------------------------------------------
            | Offline
            |--------------------------------------------------------------------------
            */

            const handleOffline =
                async () => {

                    isOnline.value =
                        false;

                    currentUser.value =
                        await getCurrentUser();

                    if (
                        currentUser.value?.id
                    ) {

                        const local =
                            getLocalOpenShift(
                                currentUser.value.id
                            );

                        await applyShiftState(
                            local?.shift ||
                            null
                        );

                    }

                };


            /*
            |--------------------------------------------------------------------------
            | Lifecycle
            |--------------------------------------------------------------------------
            */

            onMounted(
                async () => {

                    await refreshState();

                    window.addEventListener(
                        'online',
                        handleOnline
                    );

                    window.addEventListener(
                        'offline',
                        handleOffline
                    );

                }
            );


            onUnmounted(
                () => {

                    window.removeEventListener(
                        'online',
                        handleOnline
                    );

                    window.removeEventListener(
                        'offline',
                        handleOffline
                    );

                }
            );


            return {

                openingCash,

                loading,

                currentUser,

                cachedShift,

                shift,

                isOnline,

                openShift,

                goToPOS,

                refreshState,

                syncPendingShiftEvents

            };

        }

    }).mount('#app');

}