import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    onMounted
} from 'vue';
import axios from 'axios';

import PurchaseService
    from '../../src/js/services/purchase.service.js';
import SupplierService
    from '../../src/js/services/supplier.service.js';
import BranchService
    from '../../src/js/services/branch.service.js';

import MedicineService
    from '../../src/js/services/medicine.service.js';

//==== Start Purchase ================//
const Purchases = {
        template: `
            <div class="p-6 lg:p-8 space-y-8 bg-slate-50/50 min-h-screen" dir="rtl">

        <!-- ================= Header ================= -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-200 hover:shadow-md">
            <div class="px-8 py-6 border-b border-slate-100 bg-gradient-to-l from-slate-50/50 to-white">
                <div class="flex items-center gap-3">
                    <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                        </svg>
                    </div>
                    <div>
                        <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">
                            شراء مخزون جديد
                        </h2>
                        <p class="text-sm text-slate-500 mt-0.5">
                            إنشاء فاتورة شراء جديدة وإضافة دفعات المخزون.
                        </p>
                    </div>
                </div>
            </div>
            <div class="p-8">
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            المورد
                        </label>
                        <select
                            v-model="purchase.supplier_id"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                            <option value="">
                                اختر المورد
                            </option>
                            <option
                                v-for="supplier in suppliers"
                                :key="supplier.id"
                                :value="supplier.id">
                                {{ supplier.name }}
                            </option>
                        </select>
                    </div>
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            الفرع المستهدف
                        </label>
                        <select
                            v-model="purchase.branch_id"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                            <option value="">
                                اختر الفرع
                            </option>
                            <option
                                v-for="branch in branches"
                                :key="branch.id"
                                :value="branch.id">
                                {{ branch.name }}
                            </option>
                        </select>
                    </div>
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            رقم الفاتورة
                        </label>
                        <input
                            v-model="purchase.invoice_number"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                            placeholder="INV-001">
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            تاريخ الشراء
                        </label>
                        <input
                            type="date"
                            v-model="purchase.purchase_date"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            الخصم
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            v-model="purchase.discount"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            ملاحظات
                        </label>
                        <input
                            v-model="purchase.notes"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                            placeholder="اختياري">
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= Add Item ================= -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-200 hover:shadow-md">
            <div class="px-8 py-5 border-b border-slate-100 bg-gradient-to-l from-slate-50/50 to-white flex items-center justify-between">
                <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    إضافة صنف
                </h3>
            </div>
            <div class="p-8">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    <!-- البحث -->
                    <div class="lg:col-span-4 relative space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            ابحث باسم الدواء أو باركود الوحدة
                        </label>
                        <div class="relative">
                            <input
                                v-model="search"
                                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                                placeholder="ابدأ بكتابة اسم الدواء...">
                        </div>

                        <div
                            v-if="filteredMedicines.length"
                            class="absolute z-50 bg-white border border-slate-100 rounded-xl shadow-xl w-full mt-2 max-h-72 overflow-auto divide-y divide-slate-50">
                            <div
                                v-for="medicine in filteredMedicines"
                                :key="medicine.id"
                                @click="chooseMedicine(medicine)"
                                class="p-3.5 cursor-pointer hover:bg-emerald-50/50 transition-colors flex flex-col gap-0.5">
                                <div class="font-bold text-slate-800 text-sm">
                                    {{ medicine.name }}
                                </div>
                                <div class="text-xs font-mono text-slate-400">
                                    {{ medicine.barcode }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- الوحدة -->
                    <div class="lg:col-span-2 space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            الوحدة
                        </label>
                        <select
                            v-model="item.unit_id"
                            @change="changeUnit"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                            <option value="">
                                اختر الوحدة
                            </option>
                            <option
                                v-for="unit in availableUnits"
                                :key="unit.id"
                                :value="unit.id">
                                {{ unit.name }} (معامل: {{ unit.factor }})
                            </option>
                        </select>
                    </div>

                    <!-- الكمية -->
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            الكمية
                        </label>
                        <input
                            type="number"
                            min="1"
                            v-model.number="item.quantity"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                    </div>

                    <!-- السعر -->
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            سعر الشراء
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            v-model.number="item.buy_price"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                    </div>

                    <!-- LOT -->
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            LOT
                        </label>
                        <input
                            v-model="item.batch_number"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono">
                    </div>

                    <!-- EXP -->
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            الصلاحية
                        </label>
                        <input
                            type="date"
                            v-model="item.expiry_date"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                    </div>
                </div>

                <!-- معلومات الوحدة -->
                <div
                    v-if="selectedUnit"
                    class="mt-6 bg-slate-50/70 border border-slate-200/60 rounded-2xl p-5">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 items-center text-center md:text-right">
                        <div class="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div class="text-slate-400 text-xs font-medium mb-1">
                                معامل التحويل
                            </div>
                            <div class="font-bold text-slate-700 text-lg font-mono">
                                × {{ selectedUnit.factor }}
                            </div>
                        </div>
                        <div class="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div class="text-slate-400 text-xs font-medium mb-1">
                                الحبات الناتجة
                            </div>
                            <div class="font-extrabold text-emerald-600 text-lg font-mono">
                                {{ baseQuantity }}
                            </div>
                        </div>
                        <div class="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div class="text-slate-400 text-xs font-medium mb-1">
                                الوحدة الأساسية
                            </div>
                            <div class="font-bold text-slate-700 text-base">
                                {{ selectedMedicine?.units?.find(u => u.is_base)?.unit?.name || selectedMedicine?.units?.[0]?.unit?.name || 'الحبة' }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center md:justify-end">
                            <button
                                @click="addItem"
                                class="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium px-8 py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-150 flex items-center justify-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                إضافة الصنف
                            </button>
                        </div>
                    </div>
                </div>
                <div
                    v-if="selectedMedicine"
                    class="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4"
                >
                    <div class="flex items-center justify-between">

                        <div>

                            <div class="text-xs text-slate-500 mb-1">
                                قاعدة التسعير
                            </div>

                            <div class="font-bold text-blue-700">
                                {{
                                    selectedMedicine.pricing_rule?.name
                                    ||
                                    'القاعدة الافتراضية'
                                }}
                            </div>

                        </div>

                        <div
                            v-if="selectedMedicine.pricing_rule"
                            class="text-sm text-slate-600"
                        >

                            <span
                                v-if="selectedMedicine.pricing_rule.type === 'percentage'"
                            >
                                ربح {{ selectedMedicine.pricing_rule.value }}%
                            </span>

                            <span
                                v-else-if="selectedMedicine.pricing_rule.type === 'fixed'"
                            >
                                + {{ selectedMedicine.pricing_rule.value }}
                            </span>

                            <span
                                v-else-if="selectedMedicine.pricing_rule.type === 'multiply'"
                            >
                                × {{ selectedMedicine.pricing_rule.value }}
                            </span>

                        </div>

                    </div>

                    <div
                        v-if="selectedMedicine.pricing_rule?.settings?.rounding"
                        class="text-xs text-slate-500 mt-2"
                    >
                        التقريب:
                        {{
                            selectedMedicine.pricing_rule.settings.rounding.mode === 'up'
                                ? 'لأعلى'
                                : selectedMedicine.pricing_rule.settings.rounding.mode === 'down'
                                    ? 'لأسفل'
                                    : selectedMedicine.pricing_rule.settings.rounding.mode === 'nearest'
                                        ? 'الأقرب'
                                        : 'بدون تقريب'
                        }}

                        <span
                            v-if="
                                selectedMedicine.pricing_rule.settings.rounding.mode !== 'none'
                            "
                        >
                            إلى
                            {{ selectedMedicine.pricing_rule.settings.rounding.unit }}
                        </span>
                    </div>

                </div>
            </div>
        </div>

        <!-- ================= Items ================= -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-right border-collapse">
                    <thead>
                        <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                            <th class="p-4.5">الدواء</th>
                            <th class="p-4.5">الوحدة</th>
                            <th class="p-4.5">الكمية</th>
                            <th class="p-4.5">التحويل</th>
                            <th class="p-4.5">الحبات</th>
                            <th class="p-4.5">سعر الشراء</th>
                            <th class="p-4.5">الإجمالي</th>
                            <th class="p-4.5">LOT</th>
                            <th class="p-4.5">الصلاحية</th>
                            <th class="p-4.5 text-center">إجراء</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
                        <tr
                            v-for="(row, index) in purchaseItems"
                            :key="index"
                            class="hover:bg-slate-50/50 transition-colors group">
                            <td class="p-4.5 font-bold text-slate-800">
                                {{ row.medicine_name }}
                            </td>
                            <td class="p-4.5">
                                <span class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                                    {{ row.unit_name }}
                                </span>
                            </td>
                            <td class="p-4.5 font-mono font-semibold text-slate-700">
                                {{ row.quantity }}
                            </td>
                            <td class="p-4.5 font-mono text-slate-500">
                                × {{ row.factor }}
                            </td>
                            <td class="p-4.5 font-mono font-bold text-emerald-600">
                                {{ row.base_quantity }}
                            </td>
                            <td class="p-4.5 font-mono text-slate-600">
                                {{ formatCurrency(row.buy_price) }}
                            </td>
                            <td class="p-4.5 font-mono font-bold text-slate-800">
                                {{ formatCurrency(row.subtotal) }}
                            </td>
                            <td class="p-4.5 font-mono text-xs text-slate-500">
                                {{ row.batch_number || '-' }}
                            </td>
                            <td class="p-4.5 font-mono text-xs text-slate-500">
                                {{ row.expiry_date || '-' }}
                            </td>
                            <td class="p-4.5 text-center">
                                <button
                                    @click="removeItem(index)"
                                    class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
                                    title="حذف الصنف">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="!purchaseItems.length">
                            <td colspan="10" class="text-center py-12 text-slate-400">
                                لم يتم إضافة أي أصناف إلى الفاتورة حتى الآن.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ================= Summary ================= -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="grid grid-cols-2 md:grid-cols-5 gap-6 p-6 text-center divide-x divide-x-reverse divide-slate-100">
                <div class="p-2">
                    <div class="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">
                        إجمالي الفاتورة
                    </div>
                    <div class="font-extrabold text-slate-800 text-xl font-mono">
                        {{ formatCurrency(subtotal) }}
                    </div>
                </div>
                <div class="p-2">
                    <div class="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">
                        الخصم
                    </div>
                    <div class="font-extrabold text-slate-800 text-xl font-mono">
                        {{ formatCurrency(purchase.discount) }}
                    </div>
                </div>
                <div class="p-2">
                    <div class="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">
                        الصافي
                    </div>
                    <div class="font-extrabold text-emerald-600 text-2xl font-mono">
                        {{ formatCurrency(grandTotal) }}
                    </div>
                </div>
                <div class="p-2">
                    <div class="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">
                        عدد الأصناف
                    </div>
                    <div class="font-extrabold text-slate-800 text-xl font-mono">
                        {{ purchaseItems.length }}
                    </div>
                </div>
                <div class="p-2 col-span-2 md:col-span-1">
                    <div class="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">
                        إجمالي الحبات
                    </div>
                    <div class="font-extrabold text-slate-800 text-xl font-mono">
                        {{ totalBase }}
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= Save ================= -->
        <div class="flex justify-end pt-2">
            <button
                @click="savePurchase"
                :disabled="saving"
                class="bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-55 text-white font-bold px-10 py-3.5 rounded-xl shadow-xl shadow-emerald-700/20 transition-all duration-150 flex items-center gap-3">
                <svg v-if="!saving" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ saving ? "جارى الحفظ..." : "حفظ الفاتورة" }}
            </button>
        </div>
    </div>
            `,
        setup() {
           
            
            const purchase = reactive({
                supplier_id: "",
                branch_id: "",
                invoice_number: "",
                purchase_date: new Date().toISOString().substring(0, 10),
                exchange_rate: 1,
                discount: 0,
                notes: ""
            });

            const branches = ref([]);
            const loadBranches = async () => {
                try {
                    branches.value = await BranchService.getAll();
                } catch (e) {
                    console.error("Load Branches Error", e);
                    branches.value = [];
                }
            };

            const item = reactive({
                medicine_id: null,
                medicine_name: "",
                unit_id: null,
                unit_name: "",
                quantity: 1,
                factor: 1,
                base_quantity: 1,
                buy_price: 0,
                subtotal: 0,
                batch_number: "",
                expiry_date: ""
            });

            const suppliers = ref([]);
            const medicines = ref([]);
            const purchaseItems = ref([]);
            const availableUnits = ref([]);
            const search = ref("");
            const selectedMedicine = ref(null);
            const saving = ref(false);

            const selectedUnit = computed(() => {
                return availableUnits.value.find(
                    u => Number(u.id) === Number(item.unit_id)
                ) || null;
            });

            const baseQuantity = computed(() => {
                if (!selectedUnit.value) return 0;
                return Number(item.quantity) * Number(selectedUnit.value.factor);
            });

            const filteredMedicines = computed(() => {
                if (!search.value) return [];
                return medicines.value.filter(m =>
                    m.name.toLowerCase().includes(search.value.toLowerCase()) ||
                    (m.barcode || "").includes(search.value)
                ).slice(0, 20);
            });

            const subtotal = computed(() => {
                return purchaseItems.value.reduce((sum, row) => {
                    return sum + (Number(row.quantity) * Number(row.buy_price));
                }, 0);
            });

            const grandTotal = computed(() => {
                return subtotal.value - Number(purchase.discount || 0);
            });

            const totalBase = computed(() => {
                return purchaseItems.value.reduce((sum, row) => sum + Number(row.base_quantity), 0);
            });

            watch(() => item.quantity, () => {
                if (!selectedUnit.value) return;
                item.factor = selectedUnit.value.factor;
                item.base_quantity = Number(item.quantity) * Number(selectedUnit.value.factor);
            });

            watch([() => item.quantity, () => item.buy_price], () => {
                item.subtotal = Number(item.quantity) * Number(item.buy_price);
            });

            watch(() => item.unit_id, (newVal) => {
                const unit = availableUnits.value.find(u => Number(u.id) === Number(newVal));
                if (unit) {
                    item.unit_name = unit.name;
                    item.factor = unit.factor;
                    item.base_quantity = Number(item.quantity) * Number(unit.factor);
                }
            });

            const resetItem = () => {
                item.medicine_id = null;
                item.medicine_name = "";
                item.unit_id = null;
                item.unit_name = "";
                item.quantity = 1;
                item.factor = 1;
                item.base_quantity = 1;
                item.buy_price = 0;
                item.subtotal = 0;
                item.batch_number = "";
                item.expiry_date = "";
                availableUnits.value = [];
                selectedMedicine.value = null;
                search.value = "";
            };

            const loadSuppliers = async () => {
                try {
                    suppliers.value = await SupplierService.getAll();
                } catch (e) {
                    console.error("Load Suppliers Error", e);
                    suppliers.value = [];
                }
            };

            const loadMedicines = async () => {
                try {
                    medicines.value = await MedicineService.getAll({ with_units: 1 });
                } catch (e) {
                    console.error("Load Medicines Error", e);
                    medicines.value = [];
                }
            };

            const initPurchase = async () => {
                try {
                    await Promise.all([
                        loadSuppliers(),
                        loadMedicines(),
                        loadBranches()
                    ]);
                } catch (e) {
                    console.error(e);
                }
            };

            const chooseMedicine = (medicine) => {
                selectedMedicine.value = medicine;
                search.value = medicine.name;
                item.medicine_id = medicine.id;
                item.medicine_name = medicine.name;

                availableUnits.value = (medicine.units || []).map(u => ({
                    id: u.unit_id,
                    pivot_id: u.id,
                    name: u.unit?.name || 'وحدة',
                    factor: Number(u.factor) || 1,
                    is_base: u.is_base
                }));

                if (availableUnits.value.length) {
                    const base = availableUnits.value.find(u => u.is_base) || availableUnits.value[0];
                    item.unit_id = base.id;
                    item.unit_name = base.name;
                    item.factor = base.factor;
                }
            };

            const changeUnit = () => {
                const unit = availableUnits.value.find(u => Number(u.id) === Number(item.unit_id));
                if (!unit) return;
                item.unit_name = unit.name;
                item.factor = unit.factor;
                item.base_quantity = Number(item.quantity) * Number(unit.factor);
            };

            const addItem = () => {
                if (!item.medicine_id) return alert("اختر دواء");
                if (!item.unit_id) return alert("اختر وحدة");
                if (Number(item.quantity) <= 0) return alert("أدخل الكمية");
                if (Number(item.buy_price) <= 0) return alert("أدخل سعر الشراء");

                item.factor = Number(item.factor || 1);
                item.base_quantity = Number(item.quantity) * Number(item.factor);
                item.subtotal = Number(item.quantity) * Number(item.buy_price);

                purchaseItems.value.push({
                    medicine_id: item.medicine_id,
                    medicine_name: item.medicine_name,
                    unit_id: item.unit_id,
                    unit_name: item.unit_name,
                    quantity: Number(item.quantity),
                    factor: Number(item.factor),
                    base_quantity: Number(item.base_quantity),
                    buy_price: Number(item.buy_price),
                    subtotal: Number(item.subtotal),
                    batch_number: item.batch_number,
                    expiry_date: item.expiry_date
                });

                resetItem();
            };

            const removeItem = (index) => {
                purchaseItems.value.splice(index, 1);
            };

            const buildPayload = () => {
                return {
                    purchase: {
                        supplier_id: purchase.supplier_id,
                        branch_id: purchase.branch_id,
                        invoice_number: purchase.invoice_number,
                        purchase_date: purchase.purchase_date,
                        exchange_rate: purchase.exchange_rate,
                        discount: purchase.discount,
                        notes: purchase.notes
                    },
                    items: purchaseItems.value
                };
            };

            const validatePurchase = () => {
                if (!purchase.branch_id) return "اختر الفرع المستهدف";
                if (!purchase.supplier_id) return "اختر المورد";
                if (!purchaseItems.value.length) return "الفاتورة فارغة";
                return null;
            };

            const resetPurchase = () => {
                purchase.supplier_id = "";
                purchase.branch_id = "";
                purchase.invoice_number = "";
                purchase.discount = 0;
                purchase.notes = "";
                purchaseItems.value = [];
                resetItem();
            };

            const formatCurrency = (value) => {
                value = Number(value || 0);
                return value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) + " ج.س";
            };

            const savePurchase = async () => {
                const error = validatePurchase();
                if (error) return alert(error);

                try {
                    saving.value = true;
                    const payload = buildPayload();
                    const invoice = await PurchaseService.save(payload);
                    console.log(invoice);
                    alert("تم حفظ الفاتورة بنجاح");
                    resetPurchase();
                } catch (e) {
                    console.error(e);
                    alert(e.response?.data?.message || "حدث خطأ أثناء الحفظ");
                } finally {
                    saving.value = false;
                }
            };

            onMounted(() => {
                initPurchase();
            });

            return {
                branches,
                purchase,
                item,
                suppliers,
                medicines,
                availableUnits,
                purchaseItems,
                search,
                saving,
                selectedMedicine,
                selectedUnit,
                filteredMedicines,
                subtotal,
                grandTotal,
                totalBase,
                baseQuantity,
                chooseMedicine,
                changeUnit,
                addItem,
                removeItem,
                savePurchase,
                resetPurchase,
                formatCurrency,
                initPurchase
            };
        }
    };

    export default Purchases;
    //==== End Purchase ===============//