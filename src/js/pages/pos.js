import '../../css/app.css';
import { playSound } from '../sounds.js';
import {
    createApp,
    ref,
    computed,
    reactive,
    onMounted,
    onUnmounted,
    nextTick,
    onBeforeUnmount
} from 'vue';

import * as Vue from 'vue';

import axios from 'axios';

import {API_BASE} from '../config.js';

import {
    cacheUser,
    getCachedUser
} from '../auth.js';

import {
    db,
    getPendingSales,
    saveOfflineSale,
    removeOfflineSale,
    countPendingSales,
    cacheMedicines,
    getCachedMedicines,
    reduceMedicineStock,
    saveMedicinesToCache,
} from '../offline-db.js';


import '../pwa.js';
import {
    getCurrentShiftForPOS,
    closeCurrentShiftFromPOS
} from './shift.js';
createApp({

    template: `

        <!-- كامل Template POS -->
        
    <nav class="bg-emerald-700 text-white shadow-lg px-6 py-3">

        <div class="flex items-center justify-between gap-6">
    
            <!-- Logo -->
            <div class="flex items-center gap-3 flex-shrink-0">
    
                <i class="fas fa-pills text-4xl"></i>
    
                <div>
    
                    <div class="text-2xl font-bold">
    
                        PharmaFlow POS
    
                    </div>
    
                    <div class="text-xs text-emerald-200">
    
                        Pharmacy Management System
    
                    </div>
    
                </div>
    
            </div>
    
            <!-- Shift Status -->
            <div class="flex items-center gap-3 flex-1 justify-center">
    
                <!-- Cash Drawer -->
    
                <div class="bg-white text-gray-800 rounded-xl px-5 py-2 shadow text-center min-w-[170px]">
    
                    <div class="text-xs text-gray-500">
    
                        💵 المبلغ في الدرج
    
                    </div>
    
                    <div
                        class="text-2xl font-bold"
                        :class="Number(shift?.expected_cash)>=0 ? 'text-emerald-600':'text-red-600'">
    
                        {{ Number(shift?.expected_cash || 0).toLocaleString() }}
    
                    </div>
    
                </div>
    
                <!-- Cash Sales -->
    
                <div class="bg-emerald-800 rounded-xl px-5 py-2 text-center min-w-[130px]">
    
                    <div class="text-xs text-emerald-200">
    
                        💰 نقدي
    
                    </div>
    
                    <div class="text-xl font-bold">
    
                        {{ Number(shift?.cash_sales || 0).toLocaleString() }}
    
                    </div>
    
                </div>
    
                <!-- Card -->
    
                <div class="bg-emerald-800 rounded-xl px-5 py-2 text-center min-w-[130px]">
    
                    <div class="text-xs text-emerald-200">
    
                        💳 بطاقة
    
                    </div>
    
                    <div class="text-xl font-bold">
    
                        {{ Number(shift?.card_sales || 0).toLocaleString() }}
    
                    </div>
    
                </div>
    
                <!-- Sales Count -->
    
                <div class="bg-emerald-800 rounded-xl px-5 py-2 text-center min-w-[100px]">
    
                    <div class="text-xs text-emerald-200">
    
                        🧾 الفواتير
    
                    </div>
    
                    <div class="text-xl font-bold">
    
                        {{ shift?.sales_count || 0 }}
    
                    </div>
    
                </div>
    
                <!-- Shift -->
    
                <div class="bg-emerald-800 rounded-xl px-5 py-2 text-center min-w-[120px]">
    
                    <div class="text-xs text-emerald-200">
    
                        الوردية
    
                    </div>
    
                    <div class="font-bold">
    
                        {{ shift?.status=='open' ? '🟢 مفتوحة' : '🔴 مغلقة' }}
    
                    </div>
    
                </div>
    
            </div>
    
            <!-- Right Side -->
    
            <div class="flex items-center gap-3 flex-shrink-0">
    
                <!-- Finance -->
    
                <div class="relative">
    
                    <button
                        @click="showFinanceMenu=!showFinanceMenu"
                        class="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-5 py-3 rounded-xl shadow">
    
                        💰 العمليات المالية
    
                    </button>
    
                    <div
                        v-if="showFinanceMenu"
                        class="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl overflow-hidden z-50">
    
                        <button
                            @click="showFinanceMenu=false;openExpenseModal()"
                            class="w-full text-right px-5 py-4 hover:bg-gray-100 text-gray-700">
    
                            💸 إضافة مصروف
    
                        </button>
    
                        <button
                            @click="showFinanceMenu=false;openWithdrawModal()"
                            class="w-full text-right px-5 py-4 hover:bg-gray-100 text-gray-700">
    
                            👤 سحب مبلغ
    
                        </button>
    
                        <button
                            @click="showFinanceMenu=false;openDebtPaymentModal()"
                            class="w-full text-right px-5 py-4 hover:bg-gray-100 text-gray-700">
    
                            💵 سداد دين
    
                        </button>
    
                        <hr>
    
                        <button
                            @click="showFinanceMenu=false;loadShift()"
                            class="w-full text-right px-5 py-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold">
    
                            🧾 إنهاء الوردية
    
                        </button>
    
                    </div>
                    
    
                </div>
                
                <!-- User -->
    
                <div
                    v-if="currentUser"
                    class="bg-emerald-800 rounded-xl px-4 py-2 text-right">
    
                    <div class="font-bold">
    
                        {{ currentUser.name }}
    
                    </div>
    
                    <div class="text-xs text-emerald-200">
    
                        {{ currentUser.branch?.name }}
    
                    </div>
    
                </div>
    
                <!-- Logout -->
    
                <button
                    @click="logout"
                    class="bg-red-600 hover:bg-red-700 rounded-xl px-4 py-3 shadow">
    
                    <i class="fas fa-sign-out-alt text-xl"></i>
    
                </button>
    
            </div>
    
        </div>
    
    </nav>
    <div
        v-if="!isOnline"
        class="bg-red-100 border border-red-300 text-red-700 p-3 rounded mb-4">

        النظام يعمل حالياً بدون اتصال بالإنترنت

    </div>
    <div class="flex flex-1 overflow-hidden p-6 gap-6">
        <aside class="w-1/4 bg-white rounded-xl shadow border p-4 overflow-y-auto">
            <div
                v-if="offlineSalesCount > 0"
                class="bg-yellow-100 border border-yellow-300 text-yellow-800 p-3 rounded mb-4">

                يوجد {{ offlineSalesCount }}
                فاتورة بانتظار المزامنة

            </div>
            <h3 class="font-bold text-slate-700 mb-4 border-b pb-2">آخر 8 مبيعات</h3>
            <div v-for="sale in recentSales" :key="sale.id" class="p-3 border-b hover:bg-slate-50">
                <p class="text-xs text-slate-500">#{{ sale.id }} - {{ sale.created_at?.substring(0, 10) }}</p>
                <p class="text-emerald-600 font-bold mb-2">{{ sale.total_amount }} ج.س</p>
                <button v-if="!sale.is_refunded" 
                        @click="showRefundModal(sale)" 
                        class="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">
                    إرجاع (Refund)
                </button>
                <span v-else class="text-[10px] text-gray-400 font-bold italic">
                    تم الإرجاع مسبقاً
                </span>
            </div>
            
        </aside>
        
        <div v-if="refundModal.show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div class="bg-white p-6 rounded-lg w-80">
                <h3 class="font-bold mb-4">إرجاع فاتورة #{{ refundModal.sale?.id }}</h3>
                <textarea v-model="refundModal.reason" class="w-full border p-2 mb-4" placeholder="سبب الإرجاع"></textarea>
                <div class="flex gap-2">
                    <button @click="processRefund" class="bg-red-600 text-white px-4 py-2 rounded">تأكيد</button>
                    <button @click="refundModal.show = false" class="bg-gray-200 px-4 py-2 rounded">إلغاء</button>
                </div>
            </div>
        </div>

        <main class="flex-1 flex flex-col gap-6 relative">
            <div class="relative">
                <input type="text" v-model="search" placeholder="ابحث عن دواء بالاسم أو الباركود..." 
                        ref="searchInput"
                        @keydown.enter.prevent="handleBarcodeSearch"
                       class="w-full p-4 rounded-full border-2 border-emerald-500 shadow-lg outline-none text-center text-lg">

                    <div v-if="search && filteredMedicines.length > 0" class="absolute z-50 w-full bg-white border mt-2 rounded-xl shadow-2xl max-h-96 overflow-y-auto divide-y">
                        <div v-for="med in filteredMedicines" :key="med.id" class="p-4 hover:bg-slate-50">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h4 class="font-bold text-slate-800 text-base">{{ med.name }}</h4>
                                    <p v-if="med.scientific_name" class="text-xs text-slate-500">{{ med.scientific_name }}</p>
                                </div>
                                <span class="text-xs text-slate-400">
                                    المتبقي في التشغيلة: <span class="font-semibold text-emerald-600">{{ med.batches[0]?.remaining_quantity || 0 }}</span>
                                </span>
                            </div>

                            <!-- Dynamic Unit Selection Buttons based on batch prices -->
                            <div v-if="med.batches && med.batches[0] && med.batches[0].prices" class="flex flex-wrap gap-2 mt-2">
                                <button v-for="priceRecord in med.batches[0].prices" 
                                    :key="priceRecord.id"
                                    @click.stop="addToCart(med, priceRecord)"
                                    class="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-2">
                                    <span>{{ priceRecord.unit?.name || 'وحدة' }}</span>
                                    <span class="bg-white/80 text-emerald-900 px-1.5 py-0.5 rounded text-[10px]">
                                        {{ priceRecord.sell_price }} ج.س
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
            </div>
            <div class="bg-white rounded-xl shadow p-6 flex-1 border flex items-center justify-center">
                <p class="text-slate-400">استخدم شريط البحث لإضافة الأدوية للفاتورة</p>
            </div>
        </main>

        <aside class="w-1/3 bg-white rounded-xl shadow border flex flex-col">
            <div class="bg-white rounded-xl shadow p-4 mb-4">

                    <label
                        class="block text-sm font-medium mb-2"
                    >
                        طريقة التحصيل
                    </label>

                    <div class="flex gap-6">

                        <label class="flex items-center gap-2">

                            <input

                                type="radio"

                                value="cash"

                                v-model="payment.method"

                                @change="changePaymentMethod"

                            >

                            نقدي

                        </label>

                        <label class="flex items-center gap-2">

                            <input

                                type="radio"

                                value="bank"

                                v-model="payment.method"

                                @change="changePaymentMethod"

                            >

                            بنكي

                        </label>

                    </div>

                </div>
                <div
                    v-if="payment.method==='bank' && payment.bank.reference_number"
                    class="mt-2 text-green-700 bg-green-100 rounded-lg p-2 text-sm"
                >

                    🏦

                    {{ payment.bank.bank_name }}

                    -

                    تحويل رقم

                    {{ payment.bank.reference_number }}

                </div>
            <div class="p-4 border-b font-bold text-lg bg-emerald-50 flex justify-between items-center">
                <span>سلة التسوق</span>
                <button @click="clearCart" v-if="cart.length > 0" class="text-xs text-red-600 hover:underline">إفراغ السلة</button>
            </div>
            <div class="flex-1 p-4 overflow-y-auto">
                <div v-for="(item, index) in cart" :key="index" class="flex justify-between items-center py-3 border-b">
                    <div>
                        <p class="font-bold text-sm">{{ item.name }} <span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{{ item.unit }}</span></p>
                        <div class="flex items-center gap-2 mt-1">
                            <button @click="updateQuantity(index, -1)" class="px-2 bg-slate-200 rounded">-</button>
                            <span class="text-xs font-bold">{{ item.quantity }}</span>
                            <button @click="updateQuantity(index, 1)" class="px-2 bg-slate-200 rounded">+</button>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold">{{ item.selling_price * item.quantity }} ج.س</p>
                        <button @click="removeFromCart(index)" class="text-red-500 text-[10px]">حذف</button>
                    </div>
                </div>
            </div>
            
            <div class="p-4 border-t">
                <div class="flex justify-between text-2xl font-bold mb-4">
                    <span>الإجمالي:</span>
                    <span class="text-emerald-700">{{ cartTotal }} ج.س</span>
                </div>
                <button :disabled="cart.length === 0" @click="checkout" 
                    class="w-full bg-emerald-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-emerald-700 transition disabled:bg-gray-300">
                    إتمام الدفع
                </button>
            </div>
        </aside>
    </div>

    <div v-if="refundModal.show" class="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center backdrop-blur-sm">
        <div class="bg-white p-6 rounded-xl w-96 shadow-2xl">
            <h3 class="font-bold text-lg mb-4 text-red-600">طلب إرجاع فاتورة #{{ refundModal.sale?.id }}</h3>
            <textarea v-model="refundModal.reason" placeholder="يرجى كتابة سبب الإرجاع..." class="w-full border p-2 rounded mb-4 h-24"></textarea>
            <div class="flex gap-2">
                <button @click="processRefund" class="flex-1 bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700">تأكيد الإرجاع</button>
                <button @click="refundModal.show = false" class="flex-1 bg-gray-200 py-2 rounded font-bold">إلغاء</button>
            </div>
        </div>
    </div>
    <div
    v-if="showCloseShift"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6">
    
            <h2 class="text-2xl font-bold mb-6 text-center">
    
                🧾 إغلاق الوردية
    
            </h2>
    
            <div class="space-y-3 text-lg">
    
                <div class="flex justify-between">
    
                    <span>الرصيد الافتتاحي</span>
    
                    <b>{{ Number(shift.opening_cash).toLocaleString() }}</b>
    
                </div>
    
                <div class="flex justify-between text-green-600">
    
                    <span>المبيعات النقدية</span>
    
                    <b>+ {{ Number(shift.cash_sales).toLocaleString() }}</b>
    
                </div>
    
                <div class="flex justify-between text-green-600">
    
                    <span>سداد الديون</span>
    
                    <b>+ {{ Number(shift.debts_amount).toLocaleString() }}</b>
    
                </div>
    
                <div class="flex justify-between text-red-600">
    
                    <span>السحوبات</span>
    
                    <b>- {{ Number(shift.withdraw_amount).toLocaleString() }}</b>
    
                </div>
    
                <div class="flex justify-between text-red-600">
    
                    <span>المصروفات</span>
    
                    <b>- {{ Number(shift.expenses_amount).toLocaleString() }}</b>
    
                </div>
    
                <div class="flex justify-between text-red-600">
    
                    <span>المرتجعات</span>
    
                    <b>- {{ Number(shift.refund_amount).toLocaleString() }}</b>
    
                </div>
    
                <hr class="my-3">
    
                <div class="flex justify-between text-xl font-bold">
    
                    <span>الرصيد المحاسبي</span>
    
                    <span
                        :class="accountingBalance>=0 ? 'text-emerald-600':'text-red-600'">
    
                        {{ accountingBalance.toLocaleString() }}
    
                    </span>
    
                </div>
    
            </div>
    
            <div class="mt-6">
    
                <label class="block mb-2 font-semibold">
    
                    💵 الرصيد الفعلي بعد عدّ الدرج
    
                </label>
    
                <input
    
                    v-model="closingCash"
    
                    type="number"
    
                    class="w-full border-2 rounded-xl p-3 text-center text-xl">
                
            </div>
            <div
            class="mt-6 rounded-xl p-4"
            :class="
                closingCash === '' || closingCash === null
                    ? 'bg-gray-100'
                    : difference == 0
                        ? 'bg-green-100'
                        : difference < 0
                            ? 'bg-red-100'
                            : 'bg-yellow-100'
            ">
        
            <template v-if="closingCash === '' || closingCash === null">
        
                <div class="text-gray-600 text-lg font-bold">
        
                    أدخل الرصيد الفعلي لحساب العجز أو الزيادة
        
                </div>
        
            </template>
        
            <template v-else-if="difference == 0">
        
                <div class="text-green-700 text-xl font-bold">
        
                    ✅ الصندوق مطابق
        
                </div>
        
            </template>
        
            <template v-else-if="difference < 0">
        
                <div class="text-red-700 text-xl font-bold">
        
                    ❌ عجز {{ Math.abs(difference).toLocaleString() }} جنيه
        
                </div>
        
            </template>
        
            <template v-else>
        
                <div class="text-yellow-700 text-xl font-bold">
        
                    💰 زيادة {{ difference.toLocaleString() }} جنيه
        
                </div>
        
            </template>
        
        </div>
            <div class="flex gap-3 mt-8">
    
                <button
    
                    @click="confirmCloseShift"
    
                    class="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-bold">
    
                    إنهاء الوردية
    
                </button>
    
                <button
    
                    @click="showCloseShift=false"
    
                    class="flex-1 bg-gray-300 hover:bg-gray-400 rounded-xl py-3">
    
                    إلغاء
    
                </button>
    
            </div>
    
        </div>
    
    </div>
    <div

        v-if="showExpenseModal"

        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

        <div

        class="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">

        <h2

        class="text-2xl font-bold mb-6 text-center">

        إضافة مصروف

        </h2>

        <div class="space-y-4">

        <input

        v-model="expense.title"

        type="text"

        placeholder="اسم المصروف"

        class="w-full border rounded-lg p-3">

        <input

        v-model="expense.amount"

        type="number"

        placeholder="المبلغ"

        class="w-full border rounded-lg p-3">

        <textarea

        v-model="expense.notes"

        placeholder="ملاحظات"

        rows="3"

        class="w-full border rounded-lg p-3"></textarea>

        <div class="flex justify-end gap-3 mt-6">

        <button

        @click="showExpenseModal=false"

        class="px-6 py-2 rounded-lg bg-gray-300">

        إلغاء

        </button>

        <button

        @click="saveExpense"

        :disabled="expenseLoading"

        class="px-6 py-2 rounded-lg bg-emerald-600 text-white">

        {{ expenseLoading ? 'جاري الحفظ...' : 'حفظ' }}

        </button>

        </div>

        </div>

        </div>

        </div>

        <div
            v-if="showBankModal"
            class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        >

            <div class="bg-white rounded-xl shadow-xl w-full max-w-lg">

                <div class="border-b p-4">

                    <h3 class="font-bold text-lg">

                        بيانات التحويل البنكي

                    </h3>

                </div>

                <div class="p-5 space-y-4">

                    <div>

                        <label class="block mb-1">

                            البنك

                        </label>

                        <input

                            v-model="payment.bank.bank_name"

                            class="w-full border rounded-lg p-2"

                            placeholder="بنك الخرطوم"

                        >

                    </div>

                    <div>

                        <label class="block mb-1">

                            رقم التحويل

                        </label>

                        <input

                            v-model="payment.bank.reference_number"

                            class="w-full border rounded-lg p-2"

                        >

                    </div>

                    <div>

                        <label class="block mb-1">

                            تاريخ التحويل

                        </label>

                        <input

                            type="date"

                            v-model="payment.bank.transfer_date"

                            class="w-full border rounded-lg p-2"

                        >

                    </div>

                    <div>

                        <label class="block mb-1">

                            المبلغ

                        </label>

                        <input

                            type="number"

                            v-model="payment.bank.amount"

                            class="w-full border rounded-lg p-2"

                            readonly

                        >

                    </div>

                    <div>

                        <label class="block mb-1">

                            ملاحظات

                        </label>

                        <textarea

                            rows="3"

                            v-model="payment.bank.notes"

                            class="w-full border rounded-lg p-2"

                        ></textarea>

                    </div>

                </div>

                <div class="border-t p-4 flex justify-end gap-3">

                    <button

                        class="px-4 py-2 bg-gray-200 rounded"

                        @click="closeBankModal"

                    >

                        إلغاء

                    </button>

                    <button

                        class="px-4 py-2 bg-blue-600 text-white rounded"

                        @click="saveBankPayment"

                    >

                        حفظ

                    </button>

                </div>

            </div>

        </div>
        <div v-if="showDebtPaymentModal"
            class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

                <h2 class="text-2xl font-bold mb-6">
                    💰 سداد دين
                </h2>

                <div class="space-y-4">

                    <input
                        v-model="debtPayment.amount"
                        type="number"
                        placeholder="المبلغ"

                        class="w-full border rounded-lg p-3">

                    <textarea
                        v-model="debtPayment.notes"
                        placeholder="ملاحظات"

                        class="w-full border rounded-lg p-3"></textarea>

                </div>

                <div class="flex gap-3 mt-6">

                    <button
                        @click="saveDebtPayment"
                        class="flex-1 bg-blue-600 text-white rounded-lg p-3">

                        حفظ

                    </button>

                    <button
                        @click="closeDebtPaymentModal"
                        class="flex-1 bg-gray-200 rounded-lg p-3">

                        إلغاء

                    </button>

                </div>

            </div>

        </div>
        <div v-if="showWithdrawModal"
            class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

                <h2 class="text-2xl font-bold mb-6">
                    💸 سحب نقدي
                </h2>

                <div class="space-y-4">

                    <input
                        v-model="withdraw.amount"
                        type="number"
                        placeholder="المبلغ"
                        class="w-full border rounded-lg p-3">

                    <textarea
                        v-model="withdraw.reason"
                        placeholder="سبب السحب"
                        class="w-full border rounded-lg p-3"></textarea>

                </div>

                <div class="flex gap-3 mt-6">

                    <button
                        @click="saveWithdraw"
                        class="flex-1 bg-emerald-600 text-white rounded-lg p-3">

                        حفظ

                    </button>

                    <button
                        @click="closeWithdrawModal"
                        class="flex-1 bg-gray-200 rounded-lg p-3">

                        إلغاء

                    </button>

                </div>

            </div>

        </div>
    <div id="global-loader" class="hidden fixed inset-0 z-[9999] bg-white/70 flex items-center justify-center backdrop-blur-sm">
        <div class="flex flex-col items-center">
            <i class="fas fa-spinner fa-spin text-5xl text-emerald-600"></i>
            <p class="mt-4 font-bold text-slate-700">جاري المعالجة...</p>
        </div>
    </div>
    <footer class="text-center p-4 text-slate-500 border-t bg-white">
        <p class="text-[10px] font-bold"> vإدارة الصيدلية | الإصدار 2.0.0 Stable </p>
    </footer>



    `,

 setup() {
    /*
    |--------------------------------------------------------------------------
    | Vue
    |--------------------------------------------------------------------------
    */

    const {
        ref,
        reactive,
        computed,
        onMounted,
        onUnmounted,
        nextTick
    } = Vue;

    /*
    |--------------------------------------------------------------------------
    | API
    |--------------------------------------------------------------------------
    |
    | مهم جداً:
    | لا تستخدم /api هنا لأن POS يعمل على localhost:4173.
    | استخدم نفس API_BASE الخاص بالنظام.
    |--------------------------------------------------------------------------
    */


    /*
    |--------------------------------------------------------------------------
    | Axios
    |--------------------------------------------------------------------------
    */

    const token =
        localStorage.getItem('token');

    axios.defaults.headers.common['Accept'] =
        'application/json';

    axios.defaults.headers.common['X-Requested-With'] =
        'XMLHttpRequest';

    if (token) {
        axios.defaults.headers.common['Authorization'] =
            `Bearer ${token}`;
    }


    /*
    |--------------------------------------------------------------------------
    | User
    |--------------------------------------------------------------------------
    */

    const currentUser =
        ref(null);


    /*
    |--------------------------------------------------------------------------
    | Network
    |--------------------------------------------------------------------------
    */

    const isOnline =
        ref(navigator.onLine);


    const updateOnlineState = () => {
        isOnline.value =
            navigator.onLine;
    };


    /*
    |--------------------------------------------------------------------------
    | UI Alerts
    |--------------------------------------------------------------------------
    */

    const alert = reactive({
        show: false,
        type: 'info',
        message: ''
    });


    const showAlert = (
        message,
        type = 'info'
    ) => {
        alert.message =
            message;

        alert.type =
            type;

        alert.show =
            true;
    };


    const hideAlert = () => {
        alert.show =
            false;

        alert.message =
            '';
    };


    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    const isLoading =
        ref(false);

    const savingSale =
        ref(false);


    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    |
    | الاسم يجب أن يكون search لأن الـtemplate يستخدم:
    |
    | v-model="search"
    |--------------------------------------------------------------------------
    */

    const search =
        ref('');

    const searchInput =
        ref(null);


    const focusSearch = () => {
        setTimeout(() => {

            if (!searchInput.value) {
                return;
            }

            searchInput.value.focus();

        }, 50);
    };


    /*
    |--------------------------------------------------------------------------
    | Medicines
    |--------------------------------------------------------------------------
    */

    const allMedicines =
        ref([]);

    const usingCachedMedicines =
        ref(false);


    /*
    |--------------------------------------------------------------------------
    | Normalize Medicines
    |--------------------------------------------------------------------------
    */

    const normalizeMedicine =
        (medicine) => {

            const med = {
                ...medicine
            };

            med.units =
                Array.isArray(med.units)
                    ? med.units
                    : [];

            med.batches =
                Array.isArray(med.batches)
                    ? med.batches
                    : [];

            med.name =
                med.name || '';

            med.scientific_name =
                med.scientific_name || '';

            /*
            | Attach unit names to prices
            */

            med.batches =
                med.batches.map(batch => {

                    const normalizedBatch = {
                        ...batch
                    };

                    normalizedBatch.prices =
                        Array.isArray(
                            normalizedBatch.prices
                        )
                            ? normalizedBatch.prices
                            : [];

                    normalizedBatch.prices =
                        normalizedBatch.prices.map(
                            price => {

                                const unitId =
                                    Number(
                                        price.unit_id
                                    );

                                const unit =
                                    med.units.find(
                                        u =>
                                            Number(
                                                u.unit_id
                                            ) === unitId
                                            ||
                                            Number(
                                                u.id
                                            ) === unitId
                                    );

                                return {
                                    ...price,
                                    unit:
                                        unit?.unit
                                        ||
                                        price.unit
                                        ||
                                        null
                                };
                            }
                        );

                    return normalizedBatch;
                });

            return med;
        };


    const normalizeMedicinesResponse =
        (response) => {

            let data =
                response?.data ??
                response;

            if (
                data &&
                !Array.isArray(data)
            ) {
                data =
                    data.data ??
                    data.medicines ??
                    data.items ??
                    [];
            }

            if (!Array.isArray(data)) {
                return [];
            }

            return data.map(
                normalizeMedicine
            );
        };


    /*
    |--------------------------------------------------------------------------
    | Cache Medicines
    |--------------------------------------------------------------------------
    |
    | استخدم cacheMedicines المستوردة من offline-db.js.
    | لا تستخدم saveMedicinesToCache لأنها غير موجودة.
    |--------------------------------------------------------------------------
    */

    const saveMedicinesToCache =
        async (medicines) => {

            if (
                !Array.isArray(
                    medicines
                )
            ) {
                return false;
            }

            try {

                await cacheMedicines(
                    medicines
                );

                return true;

            } catch (error) {

                console.warn(
                    'تعذر تحديث Cache الأدوية:',
                    error
                );

                return false;
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Load Medicines
    |--------------------------------------------------------------------------
    */

    const loadMedicines =
        async () => {

            /*
            | ONLINE
            */

            if (isOnline.value) {

                try {

                    const branchId =
                        currentUser.value
                            ?.branch_id;

                    const response =
                        await axios.get(
                            `${API_BASE}/sales/medicines`,
                            {
                                params: {
                                    branch_id:
                                        branchId,
                                    _ts:
                                        Date.now()
                                }
                            }
                        );

                    const medicines =
                        normalizeMedicinesResponse(
                            response
                        );

                    console.log(
                        'Raw medicines response:',
                        response.data
                    );

                    console.log(
                        'Normalized medicines:',
                        medicines
                    );

                    allMedicines.value =
                        medicines;

                    await saveMedicinesToCache(
                        medicines
                    );

                    usingCachedMedicines.value =
                        false;

                    return medicines;

                } catch (error) {

                    console.warn(
                        'تعذر تحميل الأدوية من الخادم، سيتم استخدام النسخة المحلية:',
                        error
                    );
                }
            }


            /*
            | OFFLINE / SERVER FAILURE
            */

            try {

                const cached =
                    await getCachedMedicines();

                allMedicines.value =
                    Array.isArray(cached)
                        ? cached.map(
                            normalizeMedicine
                        )
                        : [];

                usingCachedMedicines.value =
                    true;

                console.log(
                    'Loaded medicines from IndexedDB:',
                    allMedicines.value
                );

                return allMedicines.value;

            } catch (error) {

                console.warn(
                    'تعذر تحميل الأدوية محلياً:',
                    error
                );

                allMedicines.value =
                    [];

                return [];
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Medicine Search
    |--------------------------------------------------------------------------
    */

    const filteredMedicines =
        computed(() => {

            const query =
                String(
                    search.value || ''
                )
                    .trim()
                    .toLowerCase();

            if (
                !query ||
                !Array.isArray(
                    allMedicines.value
                )
            ) {
                return [];
            }


            return allMedicines.value.filter(
                medicine => {

                    const name =
                        String(
                            medicine?.name ||
                            ''
                        ).toLowerCase();

                    const scientificName =
                        String(
                            medicine?.scientific_name ||
                            ''
                        ).toLowerCase();

                    const barcode =
                        String(
                            medicine?.barcode ||
                            ''
                        ).toLowerCase();


                    const unitBarcode =
                        Array.isArray(
                            medicine?.units
                        )
                        &&
                        medicine.units.some(
                            unit =>
                                String(
                                    unit?.barcode ||
                                    ''
                                )
                                    .toLowerCase()
                                    .includes(
                                        query
                                    )
                        );


                    return (
                        name.includes(query) ||
                        scientificName.includes(query) ||
                        barcode.includes(query) ||
                        unitBarcode
                    );
                }
            );
        });


    /*
    |--------------------------------------------------------------------------
    | Barcode Search
    |--------------------------------------------------------------------------
    */

    const findMedicineByBarcode =
        (barcode) => {

            const value =
                String(
                    barcode || ''
                ).trim();

            if (!value) {
                return null;
            }

            return (
                allMedicines.value.find(
                    medicine => {

                        if (
                            String(
                                medicine?.barcode ||
                                ''
                            ).trim() === value
                        ) {
                            return true;
                        }

                        return (
                            Array.isArray(
                                medicine?.units
                            )
                            &&
                            medicine.units.some(
                                unit =>
                                    String(
                                        unit?.barcode ||
                                        ''
                                    ).trim() === value
                            )
                        );
                    }
                )
                ||
                null
            );
        };


    /*
    |--------------------------------------------------------------------------
    | Price Unit
    |--------------------------------------------------------------------------
    */

    const getPriceUnit =
        (
            medicine,
            priceRecord
        ) => {

            if (
                !medicine ||
                !priceRecord
            ) {
                return null;
            }

            const unitId =
                Number(
                    priceRecord.unit_id
                );

            return (
                medicine.units?.find(
                    unit =>
                        Number(
                            unit.unit_id
                        ) === unitId
                        ||
                        Number(
                            unit.id
                        ) === unitId
                )?.unit
                ||
                priceRecord.unit
                ||
                null
            );
        };


    const getPriceUnitName =
        (
            medicine,
            priceRecord
        ) => {

            return (
                getPriceUnit(
                    medicine,
                    priceRecord
                )?.name
                ||
                'وحدة'
            );
        };


    /*
    |--------------------------------------------------------------------------
    | Stock Display
    |--------------------------------------------------------------------------
    */

    const formatStockQuantity =
        (medicine) => {

            const batch =
                medicine?.batches?.[0];

            if (!batch) {
                return '0 وحدة';
            }

            const stock =
                Number(
                    batch.remaining_quantity ||
                    0
                );

            const unitConfig =
                medicine?.units?.[0];

            if (!unitConfig) {
                return `${stock} وحدة`;
            }

            const factor =
                Number(
                    unitConfig.factor
                ) > 0
                    ? Number(
                        unitConfig.factor
                    )
                    : 1;

            const unitName =
                unitConfig.unit?.name ||
                'وحدة';

            return (
                `${Math.floor(
                    stock / factor
                )} ${unitName}`
            );
        };


    /*
    |--------------------------------------------------------------------------
    | Cart
    |--------------------------------------------------------------------------
    */

    const cart =
        ref([]);


    const cartTotal =
        computed(() => {

            return cart.value.reduce(
                (
                    total,
                    item
                ) => {

                    return (
                        total +
                        (
                            Number(
                                item.selling_price ||
                                item.price ||
                                0
                            )
                            *
                            Number(
                                item.quantity ||
                                0
                            )
                        )
                    );

                },
                0
            );
        });


    const addToCart =
        (
            medicine,
            selectedPriceRecord = null
        ) => {

            const batch =
                medicine?.batches?.[0];

            if (!batch) {

                showAlert(
                    'هذا الدواء لا يحتوي على تشغيلة متاحة',
                    'error'
                );

                return;
            }


            const available =
                Number(
                    batch.remaining_quantity ||
                    0
                );

            if (
                available <= 0
            ) {

                showAlert(
                    'هذا الدواء غير متوفر حالياً',
                    'error'
                );

                return;
            }


            let priceRecord =
                selectedPriceRecord;

            if (
                !priceRecord &&
                Array.isArray(
                    batch.prices
                )
            ) {
                priceRecord =
                    batch.prices[0];
            }


            if (!priceRecord) {

                showAlert(
                    'لا يوجد سعر لهذا الدواء',
                    'error'
                );

                return;
            }


            const price =
                Number(
                    priceRecord.sell_price ??
                    priceRecord.sale_price ??
                    priceRecord.price ??
                    0
                );


            const existing =
                cart.value.find(
                    item =>
                        item.id === medicine.id
                        &&
                        item.unit_id ===
                            priceRecord.unit_id
                );


            if (existing) {

                if (
                    existing.quantity <
                    available
                ) {
                    existing.quantity++;
                }

            } else {

                cart.value.push({
                    id:
                        medicine.id,

                    name:
                        medicine.name,

                    unit_id:
                        priceRecord.unit_id,

                    unit:
                        getPriceUnitName(
                            medicine,
                            priceRecord
                        ),

                    selling_price:
                        price,

                    quantity:
                        1,

                    quantity_base:
                        Number(
                            priceRecord.factor ||
                            1
                        ),
                     medicine_unit_id: priceRecord.unit_id,
                });
            }


            search.value =
                '';

            focusSearch();
        };


    const clearCart =
        () => {
            cart.value = [];
            focusSearch();
        };


    const updateQuantity =
        (
            index,
            delta
        ) => {

            const item =
                cart.value[index];

            if (!item) {
                return;
            }

            const next =
                Number(
                    item.quantity || 0
                ) + delta;

            if (next <= 0) {

                cart.value.splice(
                    index,
                    1
                );

                return;
            }

            item.quantity =
                next;
        };


    const removeFromCart =
        (index) => {

            cart.value.splice(
                index,
                1
            );
        };


    /*
    |--------------------------------------------------------------------------
    | Barcode
    |--------------------------------------------------------------------------
    */

    const processBarcode =
        (barcode) => {

            const medicine =
                findMedicineByBarcode(
                    barcode
                );

            if (!medicine) {

                showAlert(
                    'لم يتم العثور على الدواء',
                    'error'
                );

                search.value =
                    '';

                focusSearch();

                return false;
            }


            const batch =
                medicine.batches?.[0];

            const priceRecord =
                batch?.prices?.[0];


            addToCart(
                medicine,
                priceRecord
            );

            return true;
        };


    const handleBarcodeSearch =
        () => {

            const barcode =
                String(
                    search.value || ''
                ).trim();

            if (!barcode) {
                return;
            }

            processBarcode(
                barcode
            );
        };


    /*
    |--------------------------------------------------------------------------
    | Payment
    |--------------------------------------------------------------------------
    */

    const payment =
        reactive({

            method:
                'cash',

            bank: {

                bank_name:
                    '',

                reference_number:
                    '',

                transfer_date:
                    new Date()
                        .toISOString()
                        .substring(
                            0,
                            10
                        ),

                amount:
                    0,

                notes:
                    ''
            }
        });


    const showBankModal =
        ref(false);


    const changePaymentMethod =
        () => {

            if (
                payment.method ===
                'bank'
            ) {

                payment.bank.amount =
                    cartTotal.value;

                showBankModal.value =
                    true;

            } else {

                payment.bank = {
                    bank_name:
                        '',

                    reference_number:
                        '',

                    transfer_date:
                        new Date()
                            .toISOString()
                            .substring(
                                0,
                                10
                            ),

                    amount:
                        0,

                    notes:
                        ''
                };
            }
        };


    const closeBankModal =
        () => {

            payment.method =
                'cash';

            payment.bank = {
                bank_name:
                    '',

                reference_number:
                    '',

                transfer_date:
                    new Date()
                        .toISOString()
                        .substring(
                            0,
                            10
                        ),

                amount:
                    0,

                notes:
                    ''
            };

            showBankModal.value =
                false;
        };


    const saveBankPayment =
        () => {

            if (
                !payment.bank.bank_name
            ) {

                showAlert(
                    'يرجى إدخال اسم البنك',
                    'error'
                );

                return;
            }


            if (
                !payment.bank.reference_number
            ) {

                showAlert(
                    'يرجى إدخال رقم التحويل',
                    'error'
                );

                return;
            }


            showBankModal.value =
                false;
        };


    /*
    |--------------------------------------------------------------------------
    | Shift
    |--------------------------------------------------------------------------
    */

    const shift =
        ref(null);


    const showCloseShift =
        ref(false);

    const closingCash =
        ref('');

    const difference =
        computed(() => {

            if (
                closingCash.value === ''
                ||
                closingCash.value === null
            ) {
                return 0;
            }

            return (
                Number(
                    closingCash.value
                )
                -
                Number(
                    accountingBalance.value
                )
            );
        });

    
    const accountingBalance =
        computed(() => {

            const s =
                shift.value;

            if (!s) {
                return 0;
            }

            return (
                Number(
                    s.opening_cash || 0
                )
                +
                Number(
                    s.cash_sales || 0
                )
                +
                Number(
                    s.debts_amount || 0
                )
                -
                Number(
                    s.withdraw_amount || 0
                )
                -
                Number(
                    s.expenses_amount || 0
                )
                -
                Number(
                    s.refund_amount || 0
                )
            );
        });

    const loadShift = async () => {

        try {

            const current =
                await getCurrentShiftForPOS();

            if (!current) {

                shift.value = null;

                showAlert(
                    'لا توجد وردية مفتوحة حالياً',
                    'error'
                );

                return null;
            }

            shift.value = current;

            closingCash.value = '';

            showCloseShift.value = true;

            return current;

        } catch (error) {

            console.error(
                'POS loadShift error:',
                error
            );

            showAlert(
                error?.message ||
                'تعذر تحميل الوردية الحالية',
                'error'
            );

            return null;
        }
    };

    const refreshCurrentShift = async () => {

        try {

            const current =
                await getCurrentShiftForPOS();

            if (current) {
                shift.value = current;
            }

            return current;

        } catch (error) {

            console.warn(
                'تعذر تحديث الوردية الحالية:',
                error
            );

            return shift.value;
        }
    };
    /*
    |--------------------------------------------------------------------------
    | Cached Shift
    |--------------------------------------------------------------------------
    |
    | لا ننشئ DB.
    | قاعدة البيانات تأتي من offline-db.js.
    |--------------------------------------------------------------------------
    */

    


    /*
    |--------------------------------------------------------------------------
    | Load Shift
    |--------------------------------------------------------------------------
    */

    

   const loading = ref(false);
   const currentShift =  ref(null);
   /*
    |--------------------------------------------------------------------------
    | Close Current Shift Helper
    |--------------------------------------------------------------------------
    */
    const closeCurrentShift = async (closingCashAmount) => {

        if (!shift.value) {
            throw new Error(
                'لا توجد وردية مفتوحة حالياً'
            );
        }

        const closedShift =
            await closeCurrentShiftFromPOS(
                shift.value,
                Number(closingCashAmount),
                Number(accountingBalance.value)
            );

        shift.value = {
            ...shift.value,
            ...closedShift,
            status: 'closed'
        };

        return closedShift;
    };
    const confirmCloseShift = async () => {
        if (loading.value) {
            return;
        }

        if (!shift.value) {
            showAlert('لا توجد وردية مفتوحة لإغلاقها', 'error');
            return;
        }

        const amount = Number(closingCash.value || 0);

        if (!Number.isFinite(amount) || amount < 0) {
            showAlert('أدخل مبلغ الإغلاق بشكل صحيح', 'error');
            return;
        }

        // طلب التأكيد من المستخدم
        if (!confirm('هل أنت متأكد من إغلاق الوردية الحالية؟')) {
            return;
        }

        loading.value = true;

        try {
            /*
            |--------------------------------------------------------------------------
            | إغلاق الوردية عبر shift.js
            |--------------------------------------------------------------------------
            | POS ينادي الدالة المسؤولة، و shift.js يتعامل مع Online/Offline.
            */
            await closeCurrentShiftFromPOS(shift.value, amount);

            /*
            |--------------------------------------------------------------------------
            | إنهاء الجلسة والعودة لتسجيل الدخول
            |--------------------------------------------------------------------------
            | بعد نجاح عملية الإغلاق، نقوم بتنظيف الـ POS والعودة للخلف.
            */

            // تنظيف حالة الوردية في الـ POS
            shift.value = null;

            // إزالة بيانات الاعتماد
            //localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];

            // العودة لصفحة تسجيل الدخول
            window.location.href = 'login.html';

        } catch (error) {
            console.error('Confirm close shift error:', error);

            showAlert(
                error?.response?.data?.message || 
                error?.message || 
                'تعذر إغلاق الوردية، يرجى المحاولة مرة أخرى',
                'error'
            );
        } finally {
            loading.value = false;
        }
    };
    const closeShift = async () => {
        await confirmCloseShift();
    };
    /*
    |--------------------------------------------------------------------------
    | Finance Menu
    |--------------------------------------------------------------------------
    */

    const showFinanceMenu =
        ref(false);


    /*
    |--------------------------------------------------------------------------
    | Expense
    |--------------------------------------------------------------------------
    */

    const showExpenseModal =
        ref(false);


    const expense =
        ref({
            title:
                '',

            amount:
                '',

            notes:
                ''
        });


    const expenseLoading =
        ref(false);


    const openExpenseModal =
        () => {

            showFinanceMenu.value =
                false;

            expense.value = {
                title:
                    '',

                amount:
                    '',

                notes:
                    ''
            };

            showExpenseModal.value =
                true;
        };


    const saveExpense =
        async () => {

            if (!isOnline.value) {

                showAlert(
                    'إضافة المصروفات تحتاج إلى اتصال بالإنترنت حالياً.',
                    'error'
                );

                return;
            }


            if (
                !expense.value.title?.trim()
            ) {

                showAlert(
                    'أدخل اسم المصروف',
                    'error'
                );

                return;
            }


            const amount =
                Number(
                    expense.value.amount
                );

            if (
                !Number.isFinite(amount)
                ||
                amount <= 0
            ) {

                showAlert(
                    'أدخل مبلغاً صحيحاً',
                    'error'
                );

                return;
            }


            expenseLoading.value =
                true;

            try {

                await axios.post(
                    `${API_BASE}/expenses`,
                    {
                        title:
                            expense.value.title,

                        amount,

                        notes:
                            expense.value.notes ||
                            ''
                    }
                );

                showExpenseModal.value =
                    false;

                showAlert(
                    'تم حفظ المصروف',
                    'success'
                );

                await refreshCurrentShift();

            } catch (error) {

                console.error(
                    'Expense error:',
                    error
                );

                showAlert(
                    error.response?.data?.message ||
                    'تعذر حفظ المصروف',
                    'error'
                );

            } finally {

                expenseLoading.value =
                    false;
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Withdraw
    |--------------------------------------------------------------------------
    */

    const showWithdrawModal =
        ref(false);


    const withdraw =
        ref({
            amount:
                '',

            reason:
                ''
        });


    const withdrawLoading =
        ref(false);


    const openWithdrawModal =
        () => {

            showFinanceMenu.value =
                false;

            withdraw.value = {
                amount:
                    '',

                reason:
                    ''
            };

            showWithdrawModal.value =
                true;
        };


    const closeWithdrawModal =
        () => {

            showWithdrawModal.value =
                false;
        };


    const saveWithdraw =
        async () => {

            if (!isOnline.value) {

                showAlert(
                    'السحب النقدي يحتاج إلى اتصال بالإنترنت حالياً.',
                    'error'
                );

                return;
            }


            const amount =
                Number(
                    withdraw.value.amount
                );


            if (
                !Number.isFinite(amount)
                ||
                amount <= 0
            ) {

                showAlert(
                    'أدخل مبلغ سحب صحيح',
                    'error'
                );

                return;
            }


            if (
                !withdraw.value.reason?.trim()
            ) {

                showAlert(
                    'أدخل سبب السحب',
                    'error'
                );

                return;
            }


            withdrawLoading.value =
                true;

            try {

                await axios.post(
                    `${API_BASE}/shift/withdraw`,
                    {
                        amount,

                        reason:
                            withdraw.value.reason
                    }
                );

                showWithdrawModal.value =
                    false;

                showAlert(
                    'تم تسجيل السحب',
                    'success'
                );

                await refreshCurrentShift();

            } catch (error) {

                showAlert(
                    error.response?.data?.message ||
                    'تعذر تسجيل السحب',
                    'error'
                );

            } finally {

                withdrawLoading.value =
                    false;
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Debt Payment
    |--------------------------------------------------------------------------
    */

    const showDebtPaymentModal =
        ref(false);


    const debtPayment =
        ref({
            amount:
                '',

            notes:
                ''
        });


    const openDebtPaymentModal =
        () => {

            showFinanceMenu.value =
                false;

            debtPayment.value = {
                amount:
                    '',

                notes:
                    ''
            };

            showDebtPaymentModal.value =
                true;
        };


    const closeDebtPaymentModal =
        () => {

            showDebtPaymentModal.value =
                false;
        };


    const saveDebtPayment =
        async () => {

            if (!isOnline.value) {

                showAlert(
                    'سداد الدين يحتاج إلى اتصال بالإنترنت حالياً.',
                    'error'
                );

                return;
            }


            const amount =
                Number(
                    debtPayment.value.amount
                );


            if (
                !Number.isFinite(amount)
                ||
                amount <= 0
            ) {

                showAlert(
                    'أدخل مبلغاً صحيحاً',
                    'error'
                );

                return;
            }


            try {

                await axios.post(
                    `${API_BASE}/shift/debt-payment`,
                    {
                        amount,

                        notes:
                            debtPayment.value.notes ||
                            ''
                    }
                );

                showDebtPaymentModal.value =
                    false;

                showAlert(
                    'تم تسجيل السداد',
                    'success'
                );

                await refreshCurrentShift();

            } catch (error) {

                showAlert(
                    error.response?.data?.message ||
                    'تعذر تسجيل السداد',
                    'error'
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Shift Refresh
    |--------------------------------------------------------------------------
    */
    


    /*
    |--------------------------------------------------------------------------
    | Sales
    |--------------------------------------------------------------------------
    */

    const recentSales =
        ref([]);

    const offlineSalesCount =
        ref(0);


    const refreshOfflineCount =
        async () => {

            try {

                offlineSalesCount.value =
                    await countPendingSales();

            } catch {

                offlineSalesCount.value =
                    0;
            }
        };


    const saveSaleOffline =
        async (
            payload
        ) => {

            if (
                !currentUser.value?.id
            ) {

                showAlert(
                    'لا توجد بيانات المستخدم المحلية',
                    'error'
                );

                return false;
            }


            const localShift =
                shift.value ||
                await getCachedShift();


            if (
                !localShift?.id
            ) {

                showAlert(
                    'لا توجد وردية مفتوحة محلياً',
                    'error'
                );

                return false;
            }


            const sale = {

                id:
                    crypto.randomUUID(),

                synced:
                    false,

                created_at:
                    new Date()
                        .toISOString(),

                user_id:
                    currentUser.value.id,

                branch_id:
                    currentUser.value.branch_id
                    ||
                    localShift.branch_id
                    ||
                    null,

                shift_id:
                    localShift.id,

                payment_method:
                    payload.payment_method,

                bank_transfer:
                    payload.bank_transfer ||
                    null,

                items:
                    Array.isArray(
                        payload.items
                    )
                        ? payload.items
                        : []
            };


            await saveOfflineSale(
                sale
            );


            /*
            | Reduce local medicine stock.
            */

            for (
                const item of cart.value
            ) {

                try {

                    await reduceMedicineStock(
                        item.id,
                        Number(
                            item.quantity_base ||
                            item.quantity ||
                            1
                        )
                    );

                } catch (error) {

                    console.warn(
                        'تعذر تحديث مخزون الدواء المحلي:',
                        error
                    );
                }
            }


            /*
            | Reload medicines from IndexedDB.
            */

            try {

                const cached =
                    await getCachedMedicines();

                allMedicines.value =
                    Array.isArray(cached)
                        ? cached.map(
                            normalizeMedicine
                        )
                        : [];

            } catch {
                // keep current medicines
            }


            cart.value =
                [];

            await refreshOfflineCount();

            showAlert(
                'تم حفظ الفاتورة محلياً وسيتم إرسالها عند عودة الاتصال',
                'success'
            );

            return true;
        };


    const checkout =
        async () => {

            if (
                !cart.value.length
            ) {

                showAlert(
                    'السلة فارغة',
                    'error'
                );

                return;
            }


            if (
                savingSale.value
            ) {
                return;
            }


            savingSale.value =
                true;


            try {

                const payload = {

                    branch_id:
                        currentUser.value
                            ?.branch_id,

                    user_id:
                        currentUser.value
                            ?.id,

                    shift_id:
                        shift.value
                            ?.id,

                    payment_method:
                        payment.method,

                    bank_transfer:
                        payment.method === 'bank'
                            ? {
                                bank_name:
                                    payment.bank.bank_name,

                                reference_number:
                                    payment.bank.reference_number,

                                transfer_date:
                                    payment.bank.transfer_date,

                                amount:
                                    Number(
                                        payment.bank.amount
                                    ),

                                notes:
                                    payment.bank.notes
                            }
                            : null,

                    items: cart.value.map(i => ({
                        medicine_batch_id: i.id,
                        quantity: i.quantity,
                        unit: i.unit,
                        
                        medicine_unit_id: Number(i.medicine_unit_id),
                        quantity_base: i.quantity_base
                    }))
                };


                /*
                | Offline
                */

                if (!isOnline.value) {

                    await saveSaleOffline(
                        payload
                    );

                    return;
                }


                /*
                | Online
                */

                try {

                    await axios.post(
                        `${API_BASE}/sales`,
                        payload
                    );

                    showAlert(
                        'تم حفظ الفاتورة بنجاح',
                        'success'
                    );

                    cart.value =
                        [];

                    await refreshCurrentShift();

                    await loadMedicines();

                } catch (error) {

                    /*
                    | If request failed because
                    | connection disappeared,
                    | save locally.
                    */

                    if (
                        !navigator.onLine
                    ) {

                        isOnline.value =
                            false;

                        await saveSaleOffline(
                            payload
                        );

                        return;
                    }

                    throw error;
                }

            } catch (error) {

                console.error(
                    'Checkout error:',
                    error
                );

                showAlert(
                    error.response?.data?.message ||
                    'تعذر إتمام البيع',
                    'error'
                );

            } finally {

                savingSale.value =
                    false;
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Sync Offline Sales
    |--------------------------------------------------------------------------
    */

    /*
    |--------------------------------------------------------------------------
    | Sync Offline Sales
    |--------------------------------------------------------------------------
    */

const syncOfflineSales =
    async () => {

        if (
            !navigator.onLine
        ) {
            await refreshOfflineCount();

            return false;
        }


        /*
        |--------------------------------------------------------------------------
        | أولاً:
        | تأكد أن الورديات المحلية تمت مزامنتها.
        |--------------------------------------------------------------------------
        */

        try {

            await getCurrentShiftForPOS();

        } catch (error) {

            console.warn(
                'تعذر مزامنة الورديات قبل الفواتير:',
                error
            );
        }


        /*
        |--------------------------------------------------------------------------
        | جلب الفواتير المعلقة.
        |--------------------------------------------------------------------------
        */

        const pending =
            await getPendingSales();


        if (
            !Array.isArray(
                pending
            ) ||
            !pending.length
        ) {

            await refreshOfflineCount();

            return true;
        }


        /*
        |--------------------------------------------------------------------------
        | إرسال الفواتير واحدة تلو الأخرى.
        |--------------------------------------------------------------------------
        */

        for (
            const sale of pending
        ) {

            try {

                /*
                |--------------------------------------------------------------------------
                | Shift ID
                |--------------------------------------------------------------------------
                |
                | يجب أن يكون Server ID رقماً.
                |--------------------------------------------------------------------------
                */

                const shiftId =
                    Number(
                        sale.shift_id
                    );


                if (
                    !Number.isInteger(
                        shiftId
                    ) ||
                    shiftId <= 0
                ) {

                    console.warn(
                        'فاتورة بدون Server Shift ID:',
                        {
                            sale_id:
                                sale.id,

                            shift_id:
                                sale.shift_id
                        }
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | لا نحذف الفاتورة.
                    |
                    | نوقف المزامنة حتى تتم مزامنة الوردية.
                    |--------------------------------------------------------------------------
                    */

                    break;
                }


                /*
                |--------------------------------------------------------------------------
                | Payload النهائي.
                |--------------------------------------------------------------------------
                */

                const payload = {

                    branch_id:
                        sale.branch_id,

                    user_id:
                        sale.user_id,

                    shift_id:
                        shiftId,

                    payment_method:
                        sale.payment_method,

                    bank_transfer:
                        sale.bank_transfer ||
                        null,

                    items:
                        sale.items ||
                        []
                };


                console.log(
                    'Syncing offline sale:',
                    {
                        sale_id:
                            sale.id,

                        shift_id:
                            shiftId
                    }
                );


                /*
                |--------------------------------------------------------------------------
                | إرسال الفاتورة.
                |--------------------------------------------------------------------------
                */

                await axios.post(
                    `${API_BASE}/sales`,
                    payload
                );


                /*
                |--------------------------------------------------------------------------
                | حذف الفاتورة من IndexedDB
                | فقط بعد نجاح السيرفر.
                |--------------------------------------------------------------------------
                */

                await removeOfflineSale(
                    sale.id
                );

            } catch (error) {

                console.warn(
                    'تعذر مزامنة فاتورة Offline:',
                    {
                        sale_id:
                            sale.id,

                        error:
                            error
                    }
                );

                /*
                |--------------------------------------------------------------------------
                | لا ننتقل للفواتير التالية.
                |--------------------------------------------------------------------------
                */

                break;
            }
        }


        await refreshOfflineCount();

        return true;
    };


    /*
    |--------------------------------------------------------------------------
    | Refund
    |--------------------------------------------------------------------------
    */

    const refundModal =
        ref({
            show:
                false,

            sale:
                null,

            reason:
                ''
        });


    const showRefundModal =
        (sale) => {

            refundModal.value = {

                show:
                    true,

                sale:
                    sale,

                reason:
                    ''
            };
        };


    const processRefund =
        async () => {

            if (
                !isOnline.value
            ) {

                showAlert(
                    'الإرجاع يحتاج إلى اتصال بالإنترنت حالياً.',
                    'error'
                );

                return;
            }


            const sale =
                refundModal.value.sale;


            if (!sale) {
                return;
            }


            try {

                await axios.post(
                    `${API_BASE}/refunds`,
                    {
                        sale_id:
                            sale.id,

                        reason:
                            refundModal.value.reason,

                        amount:
                            Number(
                                sale.total_amount ||
                                0
                            )
                    }
                );


                refundModal.value = {

                    show:
                        false,

                    sale:
                        null,

                    reason:
                        ''
                };


                showAlert(
                    'تمت عملية الإرجاع بنجاح',
                    'success'
                );


                await initApp();

            } catch (error) {

                console.error(
                    'Refund error:',
                    error
                );

                showAlert(
                    error.response?.data?.message ||
                    'خطأ في الإرجاع',
                    'error'
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Load Recent Sales
    |--------------------------------------------------------------------------
    */

    const loadRecentSales =
        async () => {

            if (
                !isOnline.value
            ) {

                recentSales.value =
                    [];

                return;
            }


            try {

                const response =
                    await axios.get(
                        `${API_BASE}/reports/sales`,
                        {
                            params: {
                                _ts:
                                    Date.now()
                            }
                        }
                    );


                recentSales.value =
                    response.data?.recent ||
                    [];

            } catch {

                recentSales.value =
                    [];
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Init App
    |--------------------------------------------------------------------------
    */

    const initApp = async () => {

        console.log(
            'POS initApp: بدء تهيئة الصفحة'
        );

        updateOnlineState();


        /*
        |--------------------------------------------------------------------------
        | User
        |--------------------------------------------------------------------------
        */

        try {

            if (isOnline.value) {

                const response =
                    await axios.get(
                        `${API_BASE}/current-user`,
                        {
                            params: {
                                _ts: Date.now()
                            }
                        }
                    );

                currentUser.value =
                    response.data;

                await cacheUser(
                    response.data
                );
            }

        } catch (error) {

            console.warn(
                'تعذر تحديث المستخدم الحالي:',
                error
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Fallback to local user
        |--------------------------------------------------------------------------
        */

        if (!currentUser.value) {

            try {

                currentUser.value =
                    await getCachedUser();

            } catch (error) {

                console.warn(
                    'تعذر قراءة المستخدم المحفوظ محلياً:',
                    error
                );

                currentUser.value =
                    null;
            }
        }


        /*
        |--------------------------------------------------------------------------
        | No User
        |--------------------------------------------------------------------------
        */

        if (!currentUser.value) {

            showAlert(
                'لا توجد بيانات مستخدم محفوظة محلياً',
                'error'
            );

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Current Shift
        |--------------------------------------------------------------------------
        |
        | مسؤولية إدارة الورديات موجودة في shift.js.
        | POS يحصل فقط على الوردية الحالية.
        |
        */

        try {

            await loadShift();

        } catch (error) {

            console.error(
                'تعذر تحميل الوردية الحالية:',
                error
            );

            shift.value = null;
        }


        /*
        |--------------------------------------------------------------------------
        | Medicines
        |--------------------------------------------------------------------------
        */

        await loadMedicines();


        /*
        |--------------------------------------------------------------------------
        | Offline Sales
        |--------------------------------------------------------------------------
        */

        await refreshOfflineCount();


        /*
        |--------------------------------------------------------------------------
        | Online Synchronization
        |--------------------------------------------------------------------------
        */

        if (isOnline.value) {

            try {

                await syncOfflineSales();

            } catch (error) {

                console.warn(
                    'تعذر مزامنة فواتير البيع المحلية:',
                    error
                );
            }


            try {

                await loadRecentSales();

            } catch (error) {

                console.warn(
                    'تعذر تحميل آخر المبيعات:',
                    error
                );
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Initialization Complete
        |--------------------------------------------------------------------------
        */

        console.log(
            'POS initApp: اكتملت التهيئة',
            {
                online:
                    isOnline.value,

                shift:
                    shift.value,

                medicines:
                    allMedicines.value.length
            }
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    const logout =
        () => {

            localStorage.removeItem(
                'token'
            );

            localStorage.removeItem(
                'offline_mode'
            );

            if (
                axios.defaults.headers?.common
            ) {

                delete axios
                    .defaults
                    .headers
                    .common
                    .Authorization;
            }


            window.location.href =
                'login.html';
        };


    /*
    |--------------------------------------------------------------------------
    | Online / Offline Events
    |--------------------------------------------------------------------------
    */

   const handleOnline = async () => {

        isOnline.value = true;

        /*
        | POS مسؤول عن مزامنة الفواتير فقط.
        */
        await syncOfflineSales();

        /*
        | shift.js مسؤول عن مزامنة الورديات.
        | بعد ذلك نقرأ الوردية الحالية فقط.
        */
        await refreshCurrentShift();

        await loadMedicines();

        await loadRecentSales();

        await refreshOfflineCount();
    };


    const handleOffline =
        () => {

            isOnline.value =
                false;

            console.log(
                'POS: النظام يعمل الآن Offline'
            );
        };


    /*
    |--------------------------------------------------------------------------
    | Keyboard / Visibility
    |--------------------------------------------------------------------------
    */

    const handleVisibilityChange =
        () => {

            if (
                document.visibilityState ===
                'visible'
            ) {

                updateOnlineState();

                if (isOnline.value) {
                    refreshCurrentShift();
                }
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Lifecycle
    |--------------------------------------------------------------------------
    */

    onMounted(
        async () => {

            window.addEventListener(
                'online',
                handleOnline
            );

            window.addEventListener(
                'offline',
                handleOffline
            );

            document.addEventListener(
                'visibilitychange',
                handleVisibilityChange
            );


            await initApp();


            await nextTick();

            focusSearch();
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

            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            );
        }
    );


    /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    |
    | هذه القائمة مطابقة للـtemplate.
    |--------------------------------------------------------------------------
    */

    return {

        /*
        | User
        */

        currentUser,
        isOnline,


        /*
        | Alert
        */

        alert,
        showAlert,
        hideAlert,


        /*
        | Loading
        */

        isLoading,
        savingSale,
        loading,

        /*
        | Search
        */

        search,
        searchInput,
        filteredMedicines,
        findMedicineByBarcode,
        processBarcode,
        handleBarcodeSearch,
        focusSearch,


        /*
        | Medicines
        */

        allMedicines,
        usingCachedMedicines,
        formatStockQuantity,
        getPriceUnitName,


        /*
        | Cart
        */

        cart,
        cartTotal,
        addToCart,
        clearCart,
        updateQuantity,
        removeFromCart,


        /*
        | Payment
        */

        payment,
        showBankModal,
        changePaymentMethod,
        closeBankModal,
        saveBankPayment,


        /*
        | Sales
        */

        checkout,
        recentSales,
        offlineSalesCount,
        saveSaleOffline,
        syncOfflineSales,


        /*
        | Refund
        */

        refundModal,
        showRefundModal,
        processRefund,


        /*
        | Shift
        */


        shift,
        showCloseShift,
        closingCash,
        difference,
        accountingBalance,
        loadShift,
        closeCurrentShift,
        confirmCloseShift,
        refreshCurrentShift,
        /*
        | Finance
        */

        showFinanceMenu,
        showExpenseModal,
        openExpenseModal,
        saveExpense,
        expense,
        expenseLoading,


        /*
        | Withdraw
        */

        showWithdrawModal,
        withdraw,
        openWithdrawModal,
        closeWithdrawModal,
        saveWithdraw,
        withdrawLoading,


        /*
        | Debt Payment
        */

        showDebtPaymentModal,
        debtPayment,
        openDebtPaymentModal,
        closeDebtPaymentModal,
        saveDebtPayment,


        /*
        | General
        */

        logout,
       
        refreshOfflineCount,
        loadMedicines,
        normalizeMedicinesResponse,
        initApp
    };
}

}).mount('#app');
