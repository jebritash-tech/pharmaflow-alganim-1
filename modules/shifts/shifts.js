import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    onMounted
} from 'vue';
import axios from 'axios';
import ShiftService
    from'../../src/js/services/shift.service.js';
// Start Shifts ==============//
const Shifts = {

template: `
<div class="p-6 lg:p-8 space-y-8 bg-slate-50/50 min-h-screen" dir="rtl">

        <!-- ================= Header & Stats ================= -->
        <div class="space-y-6">
            <div class="flex items-center gap-3">
                <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div>
                    <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">
                        إدارة الورديات
                    </h2>
                    <p class="text-sm text-slate-500 mt-0.5">
                        متابعة ورديات العمل، الحركة النقدية، والأداء العام.
                    </p>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Stat 1 -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between transition-all duration-200 hover:shadow-md">
                    <div class="space-y-1">
                        <div class="text-slate-400 text-xs font-bold uppercase tracking-wider">
                            الورديات المفتوحة
                        </div>
                        <div class="text-3xl font-extrabold text-emerald-600 font-mono">
                            {{ stats.open }}
                        </div>
                    </div>
                    <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                </div>

                <!-- Stat 2 -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between transition-all duration-200 hover:shadow-md">
                    <div class="space-y-1">
                        <div class="text-slate-400 text-xs font-bold uppercase tracking-wider">
                            الورديات المغلقة
                        </div>
                        <div class="text-3xl font-extrabold text-slate-800 font-mono">
                            {{ stats.closed }}
                        </div>
                    </div>
                    <div class="p-3 bg-slate-100 text-slate-600 rounded-xl">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                    </div>
                </div>

                <!-- Stat 3 -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between transition-all duration-200 hover:shadow-md">
                    <div class="space-y-1">
                        <div class="text-slate-400 text-xs font-bold uppercase tracking-wider">
                            المبيعات النقدية
                        </div>
                        <div class="text-3xl font-extrabold text-emerald-600 font-mono">
                            {{ money(stats.cashSales) }}
                        </div>
                    </div>
                    <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                    </div>
                </div>

                <!-- Stat 4 -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between transition-all duration-200 hover:shadow-md">
                    <div class="space-y-1">
                        <div class="text-slate-400 text-xs font-bold uppercase tracking-wider">
                            الرصيد المتوقع
                        </div>
                        <div class="text-3xl font-extrabold text-blue-600 font-mono">
                            {{ money(stats.expectedCash) }}
                        </div>
                    </div>
                    <div class="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= Filters ================= -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div class="space-y-1.5">
                    <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">بحث</label>
                    <input
                        v-model="filters.search"
                        class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                        placeholder="اسم الموظف...">
                </div>

                <div class="space-y-1.5">
                    <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">الحالة</label>
                    <select
                        v-model="filters.status"
                        class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                        <option value="">كل الحالات</option>
                        <option value="open">مفتوحة</option>
                        <option value="closed">مغلقة</option>
                    </select>
                </div>

                <div class="space-y-1.5">
                    <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">من تاريخ</label>
                    <input
                        type="date"
                        v-model="filters.from"
                        class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                </div>

                <div class="space-y-1.5">
                    <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">إلى تاريخ</label>
                    <input
                        type="date"
                        v-model="filters.to"
                        class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                </div>

                <div class="flex items-end">
                    <button
                        @click="loadShifts"
                        class="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-150 flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        تحديث البيانات
                    </button>
                </div>
            </div>
        </div>

        <!-- ================= Shifts Table ================= -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-right border-collapse">
                    <thead>
                        <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                            <th class="p-4.5">#</th>
                            <th class="p-4.5">الموظف</th>
                            <th class="p-4.5">الفرع</th>
                            <th class="p-4.5">فتح</th>
                            <th class="p-4.5">إغلاق</th>
                            <th class="p-4.5">نقدي</th>
                            <th class="p-4.5">بطاقات</th>
                            <th class="p-4.5">المتوقع</th>
                            <th class="p-4.5">الفرق</th>
                            <th class="p-4.5">الحالة</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
                        <tr
                            v-for="shift in filteredShifts"
                            :key="shift.id"
                            @click="selectShift(shift)"
                            class="hover:bg-emerald-50/40 cursor-pointer transition-colors group"
                            :class="selectedShiftId == shift.id ? 'bg-emerald-50/80' : ''">
                            <td class="p-4.5 font-mono font-bold text-slate-700">
                                {{ shift.id }}
                            </td>
                            <td class="p-4.5 font-semibold text-slate-800">
                                {{ shift.user?.name }}
                            </td>
                            <td class="p-4.5 text-slate-600">
                                {{ shift.branch?.name }}
                            </td>
                            <td class="p-4.5 font-mono text-xs text-slate-500">
                                {{ formatDate(shift.opened_at) }}
                            </td>
                            <td class="p-4.5 font-mono text-xs text-slate-500">
                                {{ shift.closed_at ? formatDate(shift.closed_at) : '-' }}
                            </td>
                            <td class="p-4.5 font-mono font-semibold text-emerald-600">
                                {{ money(shift.cash_sales) }}
                            </td>
                            <td class="p-4.5 font-mono font-semibold text-blue-600">
                                {{ money(shift.card_sales) }}
                            </td>
                            <td class="p-4.5 font-mono text-slate-700">
                                {{ money(shift.expected_cash) }}
                            </td>
                            <td
                                class="p-4.5 font-mono font-bold"
                                :class="{
                                    'text-rose-600': shift.difference < 0,
                                    'text-emerald-600': shift.difference > 0,
                                    'text-slate-500': shift.difference == 0 || !shift.difference
                                }">
                                {{ shift.difference ?? '-' }}
                            </td>
                            <td class="p-4.5">
                                <span
                                    v-if="shift.status == 'open'"
                                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    مفتوحة
                                </span>
                                <span
                                    v-else
                                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                    مغلقة
                                </span>
                            </td>
                        </tr>
                        <tr v-if="!filteredShifts.length">
                            <td colspan="10" class="text-center py-12 text-slate-400">
                                لا توجد ورديات متاحة للعرض.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="flex justify-between items-center p-4.5 border-t border-slate-100 bg-slate-50/50">
                <button
                    class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-all"
                    @click="goToPage(pagination.current_page - 1)"
                    :disabled="pagination.current_page == 1">
                    ◀ السابق
                </button>
                <div class="text-sm font-semibold text-slate-600">
                    صفحة <span class="text-emerald-600">{{ pagination.current_page }}</span> من {{ pagination.last_page }}
                </div>
                <button
                    class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-all"
                    @click="goToPage(pagination.current_page + 1)"
                    :disabled="pagination.current_page == pagination.last_page">
                    التالي ▶
                </button>
            </div>
        </div>

        <!-- ================= Selected Shift Details ================= -->
        <div v-if="selectedShift" class="space-y-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6 lg:p-8">

            <!-- Details Header -->
            <div class="bg-gradient-to-l from-emerald-600 to-emerald-700 text-white px-6 py-5 rounded-2xl flex justify-between items-center shadow-lg shadow-emerald-600/10">
                <div class="space-y-1">
                    <h3 class="text-xl font-extrabold tracking-tight">
                        الوردية #{{ selectedShift.id }}
                    </h3>
                    <div class="text-xs text-emerald-100/90 font-medium">
                        {{ selectedShift.user?.name }} &bull; {{ selectedShift.branch?.name }}
                    </div>
                </div>
                <div class="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                    </svg>
                </div>
            </div>

            <!-- Shift Metrics Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-slate-50/70 border border-slate-100 rounded-2xl p-5">
                    <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">الرصيد الافتتاحي</div>
                    <div class="text-xl font-extrabold text-slate-800 font-mono">{{ money(selectedShift.opening_cash) }}</div>
                </div>
                <div class="bg-emerald-50/60 border border-emerald-100/60 rounded-2xl p-5">
                    <div class="text-emerald-600/80 text-xs font-bold uppercase tracking-wider mb-1">المبيعات النقدية</div>
                    <div class="text-xl font-extrabold text-emerald-700 font-mono">{{ money(selectedShift.cash_sales) }}</div>
                </div>
                <div class="bg-blue-50/60 border border-blue-100/60 rounded-2xl p-5">
                    <div class="text-blue-600/80 text-xs font-bold uppercase tracking-wider mb-1">مبيعات البطاقات</div>
                    <div class="text-xl font-extrabold text-blue-700 font-mono">{{ money(selectedShift.card_sales) }}</div>
                </div>
                <div class="bg-amber-50/60 border border-amber-100/60 rounded-2xl p-5">
                    <div class="text-amber-600/80 text-xs font-bold uppercase tracking-wider mb-1">عدد الفواتير</div>
                    <div class="text-xl font-extrabold text-amber-800 font-mono">{{ selectedShift.sales_count }}</div>
                </div>
                <div class="bg-rose-50/60 border border-rose-100/60 rounded-2xl p-5">
                    <div class="text-rose-600/80 text-xs font-bold uppercase tracking-wider mb-1">المصروفات</div>
                    <div class="text-xl font-extrabold text-rose-600 font-mono">{{ money(selectedShift.expenses_amount) }}</div>
                </div>
                <div class="bg-yellow-50/60 border border-yellow-100/60 rounded-2xl p-5">
                    <div class="text-yellow-600/80 text-xs font-bold uppercase tracking-wider mb-1">السحوبات</div>
                    <div class="text-xl font-extrabold text-yellow-700 font-mono">{{ money(selectedShift.withdraw_amount) }}</div>
                </div>
                <div class="bg-purple-50/60 border border-purple-100/60 rounded-2xl p-5">
                    <div class="text-purple-600/80 text-xs font-bold uppercase tracking-wider mb-1">سداد الديون</div>
                    <div class="text-xl font-extrabold text-purple-700 font-mono">{{ money(selectedShift.debts_amount) }}</div>
                </div>
                <div class="bg-cyan-50/60 border border-cyan-100/60 rounded-2xl p-5">
                    <div class="text-cyan-600/80 text-xs font-bold uppercase tracking-wider mb-1">المرتجعات</div>
                    <div class="text-xl font-extrabold text-cyan-800 font-mono">{{ money(selectedShift.refund_amount) }}</div>
                </div>
            </div>

            <!-- Balances Summary Section -->
            <div class="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-right">
                    <div class="p-3">
                        <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">الرصيد المتوقع</div>
                        <div class="text-2xl font-extrabold text-slate-800 font-mono">{{ money(selectedShift.expected_cash) }}</div>
                    </div>
                    <div class="p-3 border-y md:border-y-0 md:border-x border-slate-200/60">
                        <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">الرصيد الفعلي</div>
                        <div class="text-2xl font-extrabold text-slate-800 font-mono">{{ money(selectedShift.closing_cash) }}</div>
                    </div>
                    <div class="p-3">
                        <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">الفرق النهائي</div>
                        <div
                            class="text-2xl font-extrabold font-mono"
                            :class="{
                                'text-rose-600': selectedShift.difference < 0,
                                'text-emerald-600': selectedShift.difference > 0,
                                'text-slate-700': selectedShift.difference == 0 || !selectedShift.difference
                            }">
                            {{ money(selectedShift.difference) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= Timeline ================= -->
        <div v-if="selectedShift" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8 space-y-6">
            <h3 class="text-xl font-extrabold text-slate-800 tracking-tight">
                الخط الزمني للوردية
            </h3>

            <div class="space-y-6">
                <div
                    v-for="(activity, index) in activities"
                    :key="activity.id"
                    class="flex gap-5 relative">
                    
                    <div class="flex flex-col items-center">
                        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-sm border border-emerald-100 shrink-0">
                            {{ activityIcon(activity.type) }}
                        </div>
                        <div
                            class="flex-1 w-0.5 bg-slate-200 my-2"
                            v-if="index !== activities.length - 1">
                        </div>
                    </div>

                    <div class="flex-1 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5 space-y-2">
                        <div class="flex justify-between items-center">
                            <div class="font-bold text-slate-800 text-base">
                                {{ activity.title }}
                            </div>
                            <div class="text-xs font-mono text-slate-400">
                                {{ activity.created_at }}
                            </div>
                        </div>

                        <div
                            v-if="typeof parseDescription(activity) == 'string'"
                            class="text-sm text-slate-600">
                            {{ parseDescription(activity) }}
                        </div>

                        <div
                            v-else-if="activity.type == 'sale'"
                            class="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <span class="px-2.5 py-0.5 bg-slate-100 rounded-lg text-xs font-mono">فاتورة رقم #{{ parseDescription(activity).id }}</span>
                            <span class="text-emerald-600 font-mono font-bold">{{ money(parseDescription(activity).total_amount) }}</span>
                        </div>

                        <div
                            v-if="activity.amount"
                            class="mt-2 text-emerald-700 font-bold font-mono text-sm">
                            {{ money(activity.amount) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
`,

setup(){

    const shifts = ref([]);
    const selectedDebt= ref(null);
    const debtPayments=ref([]);
    const debtSearch=ref("");
    const debtStatus=ref("");
    const loading = ref(false);
    const selectedShift = ref(null);
    const activities = ref([]);
    const loadingDetails = ref(false);
    const selectedShiftId = ref(null);
    const debts=ref([]);
    const pricingPreview = ref(0);
    const pricingCost = ref(1000);

    const pagination = ref({

        current_page:1,

        last_page:1,

        total:0,

        per_page:20

    });

    const activityIcon = (type)=>{

        switch(type){

            case "open":

                return "🟢";

            case "sale":

                return "💊";

            case "expense":

                return "💸";

            case "withdraw":

                return "👤";

            case "debt_payment":

                return "💵";

            case "refund":

                return "↩️";

            case "close":

                return "🔴";

            default:

                return "📌";

        }

    };
    const stats = computed(() => {
    
        const data = shifts.value;

        return {

            open: data.filter(s => s.status === 'open').length,

            closed: data.filter(s => s.status === 'closed').length,

            cashSales: data.reduce(
                (sum, s) => sum + Number(s.cash_sales || 0),
                0
            ),

            expectedCash: data.reduce(
                (sum, s) => sum + Number(s.expected_cash || 0),
                0
            )

        };

    });
    
    const money = (value) => {

        return Number(value || 0).toLocaleString();

    };
    
    const loadShifts = async()=>{

        loading.value = true;

        try{

            const res = await ShiftService.getAll(filters);

            shifts.value = res.data;

            pagination.value = {

                current_page:res.current_page,

                last_page:res.last_page,

                total:res.total,

                per_page:res.per_page

            };

        }

        finally{

            loading.value = false;

        }

    };
    const filters = reactive({

        search: "",

        status: "",

        branch: "",

        from: "",

        to: ""

    });
    const filteredShifts = computed(() => {
        return shifts.value.filter(shift => {

        /*
        البحث
        */

        if (
            filters.search &&
            !String(shift.user?.name || "")
                .toLowerCase()
                .includes(filters.search.toLowerCase())
        ) {

            return false;

        }

        /*
        الحالة
        */

        if (

            filters.status &&
            shift.status !== filters.status

        ) {

            return false;

        }

        /*
        الفرع
        */

        if (

            filters.branch &&
            Number(shift.branch_id) !== Number(filters.branch)

        ) {

            return false;

        }

        /*
        التاريخ من
        */

        if (

            filters.from &&
            shift.opened_at < filters.from

        ) {

            return false;

        }

        /*
        التاريخ إلى
        */

        if (

            filters.to &&
            shift.opened_at > filters.to + " 23:59:59"

        ) {

            return false;

        }

        return true;

    });

    });
    
    const selectShift = async (shift) => {

        selectedShiftId.value = shift.id;

        loadingDetails.value = true;

        try {

            const res = await ShiftService.show(shift.id);

            console.log("Shift:", res.shift);

            console.log("Activities:", res.activities);

            selectedShift.value = res.shift;

            activities.value = Array.isArray(res.activities)
                ? res.activities
                : [];

        } finally {

            loadingDetails.value = false;

        }

    };
    
    const parseDescription = (activity)=>{

        if(!activity.description)

            return null;

        try{

            return JSON.parse(activity.description);

        }

        catch{

            return activity.description;

        }

    };
    const formatDate = (date)=>{

        if(!date) return "-";

        return new Date(date).toLocaleString('ar');

    };
    const goToPage = async(page)=>{

        if(page<1) return;

        if(page>pagination.value.last_page) return;

        loading.value = true;

        try{

            const res = await ShiftService.getAll({

                ...filters,

                page

            });

            shifts.value = res.data;

            pagination.value = {

                current_page:res.current_page,

                last_page:res.last_page,

                total:res.total,

                per_page:res.per_page

            };

        }

        finally{

            loading.value = false;

        }

    };
    
    const debtFilters=reactive({

    search:"",

    status:""

    });
    const pricing = ref({

        exchange_rate:0,

        profit_percent:0,

        extra_cost:0,

        round_to:0

    });

    
    const loadDebts=async()=>{

        const res = await DebtService.getAll();

        debts.value = res.data;

    };
    
    const selectDebt=async(debt)=>{

        const res=await DebtService.show(

        debt.id

        );

        selectedDebt.value=res;

        debtPayments.value=res.payments;

    };

    const payDebt=async()=>{

        await DebtService.pay(

        selectedDebt.value.id,

        paymentAmount.value

        );

        await selectDebt(

        selectedDebt.value

        );

        await loadDebts();

    };
    const loadPricing = async () => {

        return;

    };
    onMounted(loadShifts);

    return{
        loadPricing,
        pricingCost,
        pricingPreview,
        pricing,
        parseDescription,
        debtFilters,
        debtPayments,
        selectedDebt,
        debts,
        goToPage,
        shifts,
        loading,
        loadShifts,
        stats,
        pagination,
        money,
        filteredShifts,
        filters,
        selectedShift,
        selectedShiftId,
        selectShift,
        formatDate,
        activities,
        activityIcon,
        
    };

}

};
export default Shifts;
// End Shifts ==============//

