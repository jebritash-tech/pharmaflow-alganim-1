import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    onMounted
} from 'vue';
import axios from 'axios';
import ExpenseService
    from '../../src/js/services/expenses.js';
//========= Start Expenses ====//
 const Expenses = {

template:`
<div class="p-6 lg:p-8 space-y-8 bg-slate-50/50 min-h-screen" dir="rtl">

        <!-- ================= Header & Actions ================= -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div class="flex items-center gap-3">
                <div class="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </div>
                <div>
                    <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">
                        إدارة المصروفات
                    </h2>
                    <p class="text-sm text-slate-500 mt-0.5">
                        متابعة المصروفات التشغيلية، تفاصيل الصرف، وسجل الوردية.
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <button
                    @click="load"
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 rounded-xl transition-all duration-150 flex items-center gap-2 text-xs font-bold">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    تحديث
                </button>
                <button
                    @click="openAddModal"
                    class="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/25 transition-all duration-150 flex items-center gap-2 text-xs font-bold">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    إضافة مصروف جديد
                </button>
            </div>
        </div>

        <!-- ================= Expenses Table ================= -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-right border-collapse">
                    <thead>
                        <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                            <th class="p-4.5">#</th>
                            <th class="p-4.5">البيان / العنوان</th>
                            <th class="p-4.5">المبلغ</th>
                            <th class="p-4.5">المسؤول</th>
                            <th class="p-4.5">رقم الوردية</th>
                            <th class="p-4.5">التاريخ والوقت</th>
                            <th class="p-4.5">ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
                        <tr
                            v-for="expense in expenses"
                            :key="expense.id"
                            class="hover:bg-rose-50/40 transition-colors group">
                            <td class="p-4.5 font-mono font-bold text-slate-700">
                                {{ expense.id }}
                            </td>
                            <td class="p-4.5 font-semibold text-slate-800">
                                {{ expense.title }}
                            </td>
                            <td class="p-4.5 font-mono font-bold text-rose-600">
                                {{ money(expense.amount) }} <span class="text-xs font-normal text-slate-400">ج.س</span>
                            </td>
                            <td class="p-4.5 text-slate-700 text-xs">
                                {{ expense.user?.name || '---' }}
                            </td>
                            <td class="p-4.5 font-mono text-slate-500 text-xs">
                                #{{ expense.shift_id }}
                            </td>
                            <td class="p-4.5 font-mono text-xs text-slate-500">
                                {{ expense.created_at?.substring(0, 19).replace('T', ' ') }}
                            </td>
                            <td class="p-4.5 text-xs text-slate-500 max-w-xs truncate">
                                {{ expense.notes || '---' }}
                            </td>
                        </tr>
                        <tr v-if="!expenses.length">
                            <td colspan="7" class="text-center py-12 text-slate-400">
                                لا توجد سجلات مصروفات متاحة.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ================= Add Expense Modal ================= -->
        <div v-if="showModal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-150">
                <div class="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 class="text-lg font-bold text-slate-800">إضافة مصروف جديد</h3>
                    <button @click="showModal = false" class="text-slate-400 hover:text-slate-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">البيان / العنوان</label>
                        <input
                            type="text"
                            v-model="form.title"
                            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium"
                            placeholder="أدخل عنوان المصروف..."
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">المبلغ</label>
                        <input
                            type="number"
                            v-model.number="form.amount"
                            min="1"
                            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-lg font-bold"
                            placeholder="أدخل المبلغ..."
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">ملاحظات (اختياري)</label>
                        <textarea
                            v-model="form.notes"
                            rows="3"
                            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                            placeholder="ملاحظات إضافية..."></textarea>
                    </div>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        @click="showModal = false"
                        class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all">
                        إلغاء
                    </button>
                    <button
                        @click="submitExpense"
                        class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition-all">
                        حفظ المصروف
                    </button>
                </div>
            </div>
        </div>

    </div>

`,

setup(){

const expenses = ref([]);
const showModal = ref(false);
const form = ref({
    title: '',
    amount: '',
    notes: ''
});

const load = async () => {
    try {
        const res = await axios.get('https://pharmaflow-api-1.1.0-beta-main.test/api/expenses');
        expenses.value = res.data.data || res.data;
    } catch (e) {
        console.error('Failed to load expenses', e);
    }
};

const openAddModal = () => {
    form.value = { title: '', amount: '', notes: '' };
    showModal.value = true;
};

const submitExpense = async () => {
    if (!form.value.title || !form.value.amount || form.value.amount <= 0) {
        alert('الرجاء إدخال البيان والمبلغ بشكل صحيح');
        return;
    }

    try {
        await axios.post('https://pharmaflow-api-1.1.0-beta-main.test/api/expenses', {
            title: form.value.title,
            amount: form.value.amount,
            notes: form.value.notes
        });

        showModal.value = false;
        alert('تم تسجيل المصروف بنجاح');
        await load();
    } catch (e) {
        alert(e.response?.data?.message || 'حدث خطأ أثناء حفظ المصروف (تأكد من وجود وردية مفتوحة)');
    }
};

const money = v => Number(v).toLocaleString();

onMounted(load);

return {
    expenses,
    showModal,
    form,
    load,
    openAddModal,
    submitExpense,
    money
};

}

};
export default Expenses;
//========= End Expenses ====//