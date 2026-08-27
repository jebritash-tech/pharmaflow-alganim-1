import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    onMounted
} from 'vue';
import axios from 'axios';
import DebtService
    from '../../src/js/services/debt.service.js';

//========= Start Debts ====//
const Debts = {

template:`
<div class="p-6 lg:p-8 space-y-8 bg-slate-50/50 min-h-screen" dir="rtl">

        <!-- ================= Header & Actions ================= -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div class="flex items-center gap-3">
                <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </div>
                <div>
                    <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">
                        إدارة الديون
                    </h2>
                    <p class="text-sm text-slate-500 mt-0.5">
                        متابعة ديون العملاء، المبالغ المدفوعة، والمتبقي وسجل السداد.
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <button
                    @click="openCreateDebtModal"
                    class="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-150 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    تسجيل دين جديد
                </button>
                <button
                    @click="load(pagination.currentPage)"
                    class="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-150 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    تحديث البيانات
                </button>
            </div>
        </div>

        <!-- ================= Debts Table ================= -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-right border-collapse">
                    <thead>
                        <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                            <th class="p-4.5">#</th>
                            <th class="p-4.5">العميل</th>
                            <th class="p-4.5">الفرع</th>
                            <th class="p-4.5">الإجمالي</th>
                            <th class="p-4.5">المدفوع</th>
                            <th class="p-4.5">المتبقي</th>
                            <th class="p-4.5">الحالة</th>
                            <th class="p-4.5 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
                        <tr
                            v-for="debt in debts"
                            :key="debt.id"
                            class="hover:bg-emerald-50/40 transition-colors group">
                            <td class="p-4.5 font-mono font-bold text-slate-700">
                                {{ debt.id }}
                            </td>
                            <td class="p-4.5 font-semibold text-slate-800">
                                {{ debt.user?.name }}
                            </td>
                            <td class="p-4.5 text-slate-600">
                                {{ debt.branch ? debt.branch.name : 'غير محدد' }}
                            </td>
                            <td class="p-4.5 font-mono text-slate-700">
                                {{ money(debt.total_amount) }}
                            </td>
                            <td class="p-4.5 font-mono font-semibold text-emerald-600">
                                {{ money(debt.paid_amount) }}
                            </td>
                            <td class="p-4.5 font-mono font-semibold text-rose-600">
                                {{ money(debt.remaining_amount) }}
                            </td>
                            <td class="p-4.5">
                                <span
                                    :class="statusColor(debt.status)"
                                    class="px-3 py-1 rounded-full text-xs font-bold border">
                                    {{ debt.status }}
                                </span>
                            </td>
                            <td class="p-4.5 text-center flex items-center justify-center gap-2">
                                <button
                                    @click="selectDebt(debt)"
                                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    عرض
                                </button>
                                <button
                                    v-if="debt.status !== 'paid'"
                                    @click="openPaymentModal(debt)"
                                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                    </svg>
                                    سداد
                                </button>
                            </td>
                        </tr>
                        <tr v-if="!debts.length">
                            <td colspan="8" class="text-center py-12 text-slate-400">
                                لا توجد سجلات ديون متاحة.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- ================= Pagination Controls ================= -->
            <div class="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                <div class="text-sm text-slate-500">
                    عرض الصفحة <span class="font-bold text-slate-700">{{ pagination.currentPage }}</span> من <span class="font-bold text-slate-700">{{ pagination.lastPage }}</span> (الإجمالي: {{ pagination.total }})
                </div>
                <div class="flex items-center gap-2">
                    <button
                        @click="load(pagination.currentPage - 1)"
                        :disabled="pagination.currentPage <= 1"
                        class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        السابق
                    </button>
                    <button
                        @click="load(pagination.currentPage + 1)"
                        :disabled="pagination.currentPage >= pagination.lastPage"
                        class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        التالي
                    </button>
                </div>
            </div>
        </div>

        <!-- ================= Selected Debt Details ================= -->
        <div
            v-if="selectedDebt"
            class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8 space-y-6">

            <div class="flex justify-between items-center border-b border-slate-100 pb-5">
                <h3 class="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <span class="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                    </span>
                    بيانات الدين رقم #{{ selectedDebt.id }}
                </h3>
                <button
                    @click="selectedDebt = null"
                    class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Details Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-slate-50/70 border border-slate-100 rounded-2xl p-5">
                    <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">العميل (المسؤول)</div>
                    <div class="text-base font-extrabold text-slate-800">{{ selectedDebt.user?.name }}</div>
                </div>
                <div class="bg-slate-50/70 border border-slate-100 rounded-2xl p-5">
                    <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">الفرع</div>
                    <div class="text-base font-extrabold text-slate-800">{{ selectedDebt?.branch ? selectedDebt.branch.name : 'غير محدد' }}</div>
                </div>
                <div class="bg-emerald-50/60 border border-emerald-100/60 rounded-2xl p-5">
                    <div class="text-emerald-600/80 text-xs font-bold uppercase tracking-wider mb-1">الإجمالي</div>
                    <div class="text-xl font-extrabold text-emerald-700 font-mono">{{ money(selectedDebt.total_amount) }}</div>
                </div>
                <div class="bg-rose-50/60 border border-rose-100/60 rounded-2xl p-5">
                    <div class="text-rose-600/80 text-xs font-bold uppercase tracking-wider mb-1">المتبقي</div>
                    <div class="text-xl font-extrabold text-rose-700 font-mono">{{ money(selectedDebt.remaining_amount) }}</div>
                </div>
            </div>

            <!-- Payment History Section -->
            <div class="space-y-4 pt-4">
                <div class="flex justify-between items-center">
                    <h4 class="font-bold text-slate-800 text-base">
                        سجل السداد
                    </h4>
                    <button
                        v-if="selectedDebt.status !== 'paid'"
                        @click="openPaymentModal(selectedDebt)"
                        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20">
                        إضافة دفعة جديدة
                    </button>
                </div>

                <div class="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                    <table class="w-full text-right border-collapse">
                        <thead>
                            <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                                <th class="p-4">التاريخ والوقت</th>
                                <th class="p-4">الموظف / المسؤول</th>
                                <th class="p-4">المبلغ المدفوع</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
                            <tr
                                v-for="payment in selectedDebt.payments"
                                :key="payment.id"
                                class="hover:bg-slate-50/50 transition-colors">
                                <td class="p-4 font-mono text-xs text-slate-500">
                                    {{ payment.created_at }}
                                </td>
                                <td class="p-4 font-semibold text-slate-800">
                                    {{ payment.user?.name }}
                                </td>
                                <td class="p-4 font-mono font-bold text-emerald-600">
                                    {{ money(payment.amount) }}
                                </td>
                            </tr>
                            <tr v-if="!selectedDebt.payments || !selectedDebt.payments.length">
                                <td colspan="3" class="text-center py-8 text-slate-400">
                                    لا توجد مدفوعات مسجلة لهذا الدين حتى الآن.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

        <!-- ================= Payment Modal ================= -->
        <div v-if="showModal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-150">
                <div class="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 class="text-lg font-bold text-slate-800">سداد دين العميل: {{ activeDebt?.user?.name }}</h3>
                    <button @click="showModal = false" class="text-slate-400 hover:text-slate-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">المبلغ المراد سداده</label>
                        <input
                            type="number"
                            v-model.number="paymentAmount"
                            :max="activeDebt?.remaining_amount"
                            min="1"
                            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-lg font-bold"
                            placeholder="أدخل المبلغ..."
                        />
                        <span class="text-xs text-slate-400 mt-1 block">المبلغ المتبقي: {{ money(activeDebt?.remaining_amount || 0) }}</span>
                    </div>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        @click="showModal = false"
                        class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all">
                        إلغاء
                    </button>
                    <button
                        @click="submitPayment"
                        class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all">
                        حفظ السداد
                    </button>
                </div>
            </div>
        </div>

        <!-- ================= Create Debt Modal ================= -->
        <div v-if="showCreateModal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-150">
                <div class="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 class="text-lg font-bold text-slate-800">إضافة دين جديد</h3>
                    <button @click="showCreateModal = false" class="text-slate-400 hover:text-slate-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">الفرع</label>
                        <select
                            v-model.number="newDebtForm.branch_id"
                            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                            <option value="" disabled>اختر الفرع...</option>
                            <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                                {{ branch.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">إجمالي المبلغ</label>
                        <input
                            type="number"
                            v-model.number="newDebtForm.total_amount"
                            min="1"
                            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg font-bold"
                            placeholder="أدخل إجمالي الدين..."
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">تاريخ الاستحقاق</label>
                        <input
                            type="date"
                            v-model="newDebtForm.due_date"
                            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                    </div>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        @click="showCreateModal = false"
                        class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all">
                        إلغاء
                    </button>
                    <button
                        @click="submitCreateDebt"
                        class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all">
                        حفظ الدين
                    </button>
                </div>
            </div>
        </div>

    </div>

`,

setup(){

const debts = ref([]);
const branches = ref([]);
const selectedDebt = ref(null);
const showModal = ref(false);
const showCreateModal = ref(false);
const activeDebt = ref(null);
const paymentAmount = ref(0);

const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    total: 0
});

const newDebtForm = ref({
    branch_id: '',
    total_amount: '',
    due_date: ''
});

const load = async (page = 1) => {
    try {
        // Fallback directly to axios query parameter to ensure pagination page triggers smoothly
        const res = await axios.get(`https://pharmaflow-api-1.1.0-beta-main.test/api/debts?page=${page}`);
        
        debts.value = res.data.data || [];
        
        pagination.value = {
            currentPage: res.data.current_page || 1,
            lastPage: res.data.last_page || 1,
            total: res.data.total || 0
        };

        const branchRes = await axios.get("https://pharmaflow-api-1.1.0-beta-main.test/api/branches");
        
        if (Array.isArray(branchRes.data)) {
            branches.value = branchRes.data;
        } else if (branchRes.data && Array.isArray(branchRes.data.data)) {
            branches.value = branchRes.data.data;
        } else if (branchRes.data && branchRes.data.branches && Array.isArray(branchRes.data.branches)) {
            branches.value = branchRes.data.branches;
        }
    } catch (e) {
        console.error("Error loading data:", e);
    }
};

const selectDebt = async (debt) => {
    const res = await axios.get(`https://pharmaflow-api-1.1.0-beta-main.test/api/debts/${debt.id}`);
    selectedDebt.value = res.data;
};

const openPaymentModal = (debt) => {
    activeDebt.value = debt;
    paymentAmount.value = debt.remaining_amount;
    showModal.value = true;
};

const openCreateDebtModal = () => {
    newDebtForm.value = {
        branch_id: '',
        total_amount: '',
        due_date: ''
    };
    showCreateModal.value = true;
};

const submitCreateDebt = async () => {
    if (!newDebtForm.value.total_amount || newDebtForm.value.total_amount <= 0) {
        alert('الرجاء إدخال إجمالي مبلغ صحيح');
        return;
    }

    try {
        await axios.post("https://pharmaflow-api-1.1.0-beta-main.test/api/debts", newDebtForm.value);
        showCreateModal.value = false;
        alert('تم تسجيل الدين الجديد بنجاح');
        await load(pagination.value.currentPage);
    } catch (e) {
        console.error("Detailed Error:", e);
        alert(e.response?.data?.message || e.message || 'حدث خطأ غير معروف');
    }
};

const submitPayment = async () => {
    if (!paymentAmount.value || paymentAmount.value <= 0) {
        alert('الرجاء إدخال مبلغ صحيح');
        return;
    }

    if (paymentAmount.value > activeDebt.value.remaining_amount) {
        alert('المبلغ المدفوع أكبر من المتبقي');
        return;
    }

    try {
        await axios.post(`https://pharmaflow-api-1.1.0-beta-main.test/api/debts/${activeDebt.value.id}/payments`, {
            amount: paymentAmount.value
        });

        showModal.value = false;
        alert('تم تسجيل عملية السداد بنجاح');

        await load(pagination.value.currentPage);
        if (selectedDebt.value && selectedDebt.value.id === activeDebt.value.id) {
            const res = await axios.get(`https://pharmaflow-api-1.1.0-beta-main.test/api/debts/${activeDebt.value.id}`);
            selectedDebt.value = res.data;
        }
    } catch (e) {
        alert(e.response?.data?.message || 'حدث خطأ أثناء حفظ السداد');
    }
};

const money = v => Number(v || 0).toLocaleString();

const statusColor = s => {
    switch(s){
        case 'paid':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'partial':
            return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        default:
            return 'bg-red-100 text-red-700 border-red-200';
    }
};

onMounted(() => load(1));

return {
    debts,
    branches,
    selectedDebt,
    showModal,
    showCreateModal,
    activeDebt,
    paymentAmount,
    newDebtForm,
    pagination,
    load,
    selectDebt,
    openPaymentModal,
    openCreateDebtModal,
    submitCreateDebt,
    submitPayment,
    money,
    statusColor
};

}

};
export default Debts;
//========= End Debts ====//