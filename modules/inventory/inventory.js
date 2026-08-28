import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    onMounted
} from 'vue';
import axios from 'axios';
import InventoryService
    from '../../src/js/services/inventoryService.js';

//========= Start Inventory ====//

const Inventory = {

template:`

<div class="p-6 lg:p-8 space-y-8 bg-slate-50/50 min-h-screen" dir="rtl">

    <!-- ================= Header ================= -->

    <div class="flex flex-col lg:flex-row justify-between items-center bg-white rounded-2xl shadow-sm border border-slate-100 p-6">

        <div>

            <h2 class="text-2xl font-extrabold text-slate-800">

                جرد المخزون

            </h2>

            <p class="text-sm text-slate-500 mt-1">

                متابعة المخزون وإجراء عمليات الجرد اليدوي.

            </p>

        </div>

        <button

            @click="load"

            class="mt-4 lg:mt-0 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow"

        >

            تحديث

        </button>

    </div>
    
    <!-- ================= Dashboard ================= -->

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">

        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">

            <div class="text-xs text-slate-500">

                إجمالي الأصناف

            </div>

            <div class="text-3xl font-bold mt-2">

                {{ dashboard.total_items }}

            </div>

        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">

            <div class="text-xs text-slate-500">

                منخفض المخزون

            </div>

            <div class="text-3xl font-bold text-amber-600 mt-2">

                {{ dashboard.low_stock }}

            </div>

        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">

            <div class="text-xs text-slate-500">

                نفد المخزون

            </div>

            <div class="text-3xl font-bold text-red-600 mt-2">

                {{ dashboard.out_stock }}

            </div>

        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">

            <div class="text-xs text-slate-500">

                آخر جرد

            </div>

            <div class="text-lg font-bold mt-2">

                {{ dashboard.last_inventory }}

            </div>

        </div>

    </div>

    <!-- ================= Search ================= -->

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">

            <input

                v-model="search"

                class="border rounded-xl p-3"

                placeholder="بحث بالاسم أو الباركود"

            >

            <!-- Branch Dropdown -->
            <select

                v-model="selectedBranch"

                class="border rounded-xl p-3"

            >

                <option value="">كل الفروع</option>

                <option v-for="branch in branches" :key="branch.id" :value="branch.id">

                    {{ branch.name }}

                </option>

            </select>

            <select

                v-model="status"

                class="border rounded-xl p-3"

            >

                <option value="">

                    كل الحالات

                </option>

                <option value="low">

                    منخفض

                </option>

                <option value="out">

                    نافد

                </option>

                <option value="expired">

                    منتهي الصلاحية

                </option>

            </select>

            <button

                @click="load"

                class="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"

            >

                بحث

            </button>

        </div>

    </div>

    <!-- ================= Table ================= -->

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

        <table class="w-full">

            <thead class="bg-slate-50">

                <tr>

                    <th class="p-4">#</th>

                    <th class="p-4">رقم التشغيلة</th>

                    <th class="p-4">الدواء</th>

                    <th class="p-4">الوحدة</th>

                    <th class="p-4">المخزون</th>

                    <th class="p-4">الحد الأدنى</th>

                    <th class="p-4">الحالة</th>

                    <th class="p-4"></th>

                </tr>

            </thead>

            <tbody>

                <tr

                   v-for="item in inventories" :key="item.id"

                >

                    <td class="p-4">{{ item.id }}</td>

                    <td class="p-4">{{ item.medicine?.batches?.[0]?.batch_number || '-' }}</td>

                    <td class="p-4 font-bold text-slate-800">{{ item.medicine?.name || '-' }}</td>

                    <td class="p-4 font-semibold">{{ item.formatted_stock }}</td>

                    <td class="p-4 font-semibold">{{ item.quantity }}</td>

                    <td class="p-4">{{ item.minimum_quantity }}</td>

                    <td class="p-4">

                        <span

                            :class="statusColor(item)"

                            class="px-2 py-1 rounded-full text-xs"

                        >

                            {{ inventoryStatus(item) }}

                        </span>

                    </td>

                    <td class="p-4">

                        <!-- Trigger Button inside table row -->
                        <button
                            @click="openAdjustment(item)"
                            class="text-blue-600 hover:underline font-semibold"
                        >
                            تعديل
                        </button>

                        <!-- Modal Container -->
                        <div v-if="showAdjustmentModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                            <div class="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                                <h3 class="text-xl font-bold mb-4 text-slate-800">تعديل المخزون: {{ adjustment.medicine_name }}</h3>
                                
                               <div class="space-y-4">
                                    <!-- Medicine Name & Batch (Readonly / Pre-filled) -->
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-xs font-semibold text-slate-700 mb-1">اسم الدواء</label>
                                            <input 
                                                type="text" 
                                                v-model="adjustment.medicine_name" 
                                                disabled 
                                                class="w-full border rounded-xl p-3 bg-slate-100 text-slate-600 text-sm"
                                            >
                                        </div>
                                        <div>
                                            <label class="block text-xs font-semibold text-slate-700 mb-1">رقم التشغيلة (Batch)</label>
                                            <input 
                                                type="text" 
                                                v-model="adjustment.batch_number" 
                                                disabled 
                                                class="w-full border rounded-xl p-3 bg-slate-100 text-slate-600 text-sm"
                                            >
                                        </div>
                                    </div>

                                    <!-- System Quantity & Actual Physical Quantity Calculation Row -->
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-xs font-semibold text-slate-700 mb-1">الكمية الحالية في النظام</label>
                                            <input 
                                                type="number" 
                                                v-model="adjustment.system_quantity" 
                                                disabled 
                                                class="w-full border rounded-xl p-3 bg-slate-100 text-slate-600 text-sm font-bold"
                                            >
                                        </div>

                                        <!-- Actual Physical Quantity (Auto-calculated) -->
                                        <div>
                                            <label class="block text-xs font-semibold text-emerald-700 mb-1">الكمية الفعلية الإجمالية (الوحدة الأساسية)</label>
                                            <input 
                                                type="number" 
                                                v-model="adjustment.actual_quantity" 
                                                class="w-full border rounded-xl p-3 bg-emerald-50/50 border-emerald-300 font-bold text-emerald-700 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                            >
                                        </div>
                                        
                                    </div>

                                    <!-- Helper inputs for multiplier/factor calculation -->
                                    <div class="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <div>
                                            <label class="block text-xs font-semibold text-slate-700 mb-1">الكمية المقاسة (مثلاً عدد الأشرطة)</label>
                                            <input 
                                                type="number" 
                                                v-model="adjustment.counted_packs" 
                                                class="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                                                placeholder="مثال: 10"
                                            >
                                        </div>

                                        <div>
                                            <label class="block text-xs font-semibold text-slate-700 mb-1">معامل الضرب التلقائي (Factor)</label>
                                            <input 
                                                type="number" 
                                                v-model="adjustment.factor" 
                                                disabled
                                                class="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-600 cursor-not-allowed"
                                            >
                                        </div>
                                    </div>

                                    <!-- Difference Calculation -->
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-700 mb-1">الفرق (التجزئة)</label>
                                        <input 
                                            type="number" 
                                            v-model="adjustment.difference" 
                                            disabled 
                                            class="w-full border rounded-xl p-3 bg-slate-100 font-bold text-sm"
                                            :class="adjustment.difference < 0 ? 'text-red-600' : 'text-emerald-600'"
                                        >
                                    </div>

                                    <!-- Reason / Type -->
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-700 mb-1">سبب التعديل</label>
                                        <select 
                                            v-model="adjustment.reason" 
                                            class="w-full border rounded-xl p-3 text-sm"
                                        >
                                            <option value="inventory">جرد دوري</option>
                                            <option value="damage">تلف</option>
                                            <option value="loss">فقدان</option>
                                            <option value="other">أخرى</option>
                                        </select>
                                    </div>

                                    <!-- Notes -->
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-700 mb-1">ملاحظات</label>
                                        <textarea 
                                            v-model="adjustment.notes" 
                                            rows="2" 
                                            class="w-full border rounded-xl p-3 text-sm"
                                            placeholder="أدخل أي ملاحظات إضافية هنا..."
                                        ></textarea>
                                    </div>
                                </div>
                                
                                <div class="flex justify-end gap-3 mt-6">
                                    <button @click="closeAdjustment" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-slate-700 rounded-xl text-sm font-semibold">إلغاء</button>
                                    <button @click="saveAdjustment" :disabled="saving" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2">
                                        <span v-if="saving">جاري الحفظ...</span>
                                        <span v-else>حفظ</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </td>

                </tr>

            </tbody>

        </table>

    </div>

</div>

`,

setup(){

    const inventoryService = InventoryService;

    const loading = ref(false);

    const inventories = ref([]);

    const search = ref("");

    const status = ref("");

    const branches = ref([]); 

    const selectedBranch = ref(""); 

    const dashboard = reactive({

        total_items: 0,

        low_stock: 0,

        out_stock: 0,

        last_inventory: "-"

    });

    const page = ref(1);

    const perPage = ref(20);

    const loadBranches = async () => {
        try {
            const res = await axios.get('https://pharmaflow-api-2-0-0-stable-alganim.onrender.com/api/branches'); 
            branches.value = res.data;
        } catch (e) {
            console.error("Failed to load branches");
        }
    };

   const load = async()=>{

        loading.value = true;

        try{

            const res = await InventoryService.getAll({

                page: page.value,

                search: search.value,

                status: status.value,

                branch_id: selectedBranch.value

            });

            inventories.value = res.data.data || [];

            if (res.dashboard) {
                Object.assign(dashboard, res.dashboard);
            }

        }

        finally{

            loading.value = false;

        }

    };

    const showAdjustmentModal = ref(false);

    const saving = ref(false);

   const adjustment = reactive({
        inventory_id: null,
        medicine_id: null,
        medicine_name: "",
        batch_number: "",
        unit_name: "",
        counted_packs: 0,   // What the user types (e.g., 10 strips)
        factor: 1,             // Fixed unit factor from database (e.g., 10)
        system_quantity: 0,
        actual_quantity: 0,    // The final calculated base quantity sent to backend
        difference: 0,
        reason: "inventory",
        notes: ""
    });

    // Auto calculate actual quantity based on package input and predefined factor
    watch(
            [() => adjustment.counted_packs, () => adjustment.factor],
            ([newPacks, newFactor]) => {
                adjustment.actual_quantity = Number(newPacks) * Number(newFactor);
            }
        );

    const openAdjustment = (item)=>{
        const activeBatch = item.medicine?.batches?.[0] || {};
        const activeUnit = item.medicine?.units?.[0] || {};

        adjustment.inventory_id = item.id;
        adjustment.medicine_id = item.medicine_id;
        adjustment.medicine_name = item.medicine?.name || "";
        adjustment.batch_number = activeBatch.batch_number || "-";
        
        // Fetch factor from unit definition (e.g. 10)
        adjustment.factor = Number(activeUnit.factor) || 1; 

        adjustment.system_quantity = Number(item.quantity);
        adjustment.counted_packs = 0; // Reset input field so it starts clean
        adjustment.actual_quantity = Number(item.quantity);
        adjustment.difference = 0;
        adjustment.reason = "inventory";
        adjustment.notes = "";

        showAdjustmentModal.value = true;
    };

    watch(
        ()=>adjustment.actual_quantity,
        (newVal)=>{
            adjustment.difference = Number(newVal) - Number(adjustment.system_quantity);
        }
    );

    const closeAdjustment = ()=>{
        showAdjustmentModal.value = false;
    };

   const saveAdjustment = async()=>{
        saving.value = true;
        try{
            console.log("Submitting Adjustment:", {
                medicine_id: adjustment.medicine_id,
                branch_id: selectedBranch.value || 1,
                purchased_quantity: adjustment.actual_quantity, 
                factor: adjustment.factor,
                counted_packs: adjustment.counted_packs
            });

            await InventoryService.adjust({
                medicine_id: adjustment.medicine_id,
                branch_id: selectedBranch.value || 1,
                purchased_quantity: adjustment.actual_quantity, 
                factor: adjustment.factor,
                type: 'adjustment',
                notes: adjustment.notes
            });

            closeAdjustment();
            await load();
        }
        finally{
            saving.value = false;
        }
    };

    const inventoryStatus = (item)=>{
        if(Number(item.quantity) <= 0){
            return "نافد";
        }
        if(Number(item.quantity) <= Number(item.minimum_quantity)){
            return "منخفض";
        }
        return "متوفر";
    };

    const statusColor = (item)=>{
        if(Number(item.quantity) <= 0){
            return "bg-red-100 text-red-700";
        }
        if(Number(item.quantity) <= Number(item.minimum_quantity)){
            return "bg-yellow-100 text-yellow-700";
        }
        return "bg-green-100 text-green-700";
    };

    onMounted(async()=>{
        await loadBranches(); 
        await load();
    });

    return{
        loading,
        saving,
        inventories,
        dashboard,
        search,
        status,
        page,
        perPage,
        showAdjustmentModal,
        adjustment,
        branches,        
        selectedBranch,  
        load,
        openAdjustment,
        closeAdjustment,
        saveAdjustment,
        inventoryStatus,
        statusColor
    };

}

};
export default Inventory;
//========= End Inventory ====//
