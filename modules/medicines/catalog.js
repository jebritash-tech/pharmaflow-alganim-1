import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    onMounted
} from 'vue';
import axios from 'axios';
import MedicineService
    from '../../src/js/services/medicine.service.js';

import MedicineUnitService
    from '../../src/js/services/medicineUnit.service.js';
//====== Start Medicine =============//
const Medicine = {
template: `
        <div class="p-8 max-w-7xl mx-auto space-y-8" dir="rtl">
            <!-- ================= نموذج إضافة / تعديل دواء ================= -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div class="border-b border-slate-100 p-6 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2.5">
                            <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
                                <i class="fas fa-capsules"></i>
                            </span>
                            {{ isEditing ? 'تعديل دواء' : 'إضافة دواء جديد' }}
                        </h2>
                        <p class="text-xs text-slate-500 mt-1">
                            يتم هنا إنشاء كاتالوج الدواء فقط، أما أسعار الشراء والبيع فتحدد لاحقاً أثناء شراء المخزون.
                        </p>
                    </div>
                </div>

                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label class="block mb-2 text-xs font-semibold text-slate-700">اسم الدواء</label>
                            <input
                                v-model="form.name"
                                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                                placeholder="اسم الدواء">
                        </div>
                        <div>
                            <label class="block mb-2 text-xs font-semibold text-slate-700">الباركود الرئيسي</label>
                            <input
                                v-model="form.barcode"
                                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono"
                                placeholder="الباركود الأساسي">
                        </div>
                        <div>
                            <label class="block mb-2 text-xs font-semibold text-slate-700">التصنيف</label>
                            <select
                                v-model="form.category_id"
                                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition">
                                <option value="">اختر التصنيف</option>
                                <option v-for="c in categories" :key="c.id" :value="c.id">
                                    {{ c.name }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="block mb-2 text-xs font-semibold text-slate-700">
                                قاعدة التسعير
                            </label>

                            <select
                                v-model="form.pricing_rule_id"
                                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                            >
                                <option :value="null">
                                    استخدام القاعدة الافتراضية
                                </option>

                                <option
                                    v-for="r in pricingRules"
                                    :key="r.id"
                                    :value="r.id"
                                >
                                    {{ r.name }} — {{ pricingRuleLabel(r) }}
                                </option>
                            </select>

                            <p class="text-[11px] text-slate-400 mt-1">
                                اتركها افتراضية إن لم يحتج الدواء إلى قاعدة خاصة.
                            </p>
                        </div>
                    </div>

                    <!-- الأخطاء -->
                    <div v-if="Object.keys(errors).length" class="mt-5 bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-1">
                        <div v-for="(err, key) in errors" :key="key" class="text-rose-600 text-xs font-medium">
                            • {{ err[0] }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- ====================== الوحدات ======================= -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div class="border-b border-slate-100 p-6 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 class="font-bold text-base text-slate-800 flex items-center gap-2.5">
                            <span class="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-sm">
                                <i class="fas fa-balance-scale"></i>
                            </span>
                            وحدات البيع
                        </h2>
                        <p class="text-xs text-slate-500 mt-1">
                            مثال: حبة ← شريط ← علبة
                        </p>
                    </div>
                    <button
                        @click="addUnit"
                        class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-sm">
                        <i class="fas fa-plus"></i> إضافة وحدة
                    </button>
                </div>

                <div class="p-6 space-y-4">
                    <div v-if="medicineUnits.length == 0" class="text-center text-slate-400 py-10 text-xs">
                        لا توجد وحدات مضافة حالياً.
                    </div>

                    <div v-for="(unit, index) in medicineUnits" :key="index" class="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/60 hover:border-slate-300 transition">
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                            <!-- الوحدة -->
                            <div class="lg:col-span-3">
                                <label class="block mb-2 text-xs font-semibold text-slate-700">الوحدة</label>
                                <select
                                    v-model="unit.unit_id"
                                    class="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition">
                                    <option value="">اختر الوحدة</option>
                                    <option v-for="u in availableUnits" :key="u.id" :value="u.id">
                                        {{ u.name }}
                                    </option>
                                </select>
                            </div>

                            <!-- المعامل -->
                            <div class="lg:col-span-2">
                                <label class="block mb-2 text-xs font-semibold text-slate-700">المعامل</label>
                                <input
                                    type="number"
                                    min="1"
                                    v-model.number="unit.factor"
                                    class="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition">
                            </div>

                            <!-- الباركود -->
                            <div class="lg:col-span-3">
                                <label class="block mb-2 text-xs font-semibold text-slate-700">باركود الوحدة</label>
                                <input
                                    v-model="unit.barcode"
                                    @keydown.enter.prevent="focusNextBarcode(index)"
                                    class="barcode-input w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono"
                                    placeholder="امسح الباركود">
                            </div>

                            <!-- الخيارات -->
                            <div class="lg:col-span-2 flex flex-col justify-center gap-2.5 pt-2 lg:pt-0">
                                <label class="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        v-model="unit.allow_sale"
                                        class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500">
                                    <span>يسمح بالبيع</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                                    <input
                                        type="radio"
                                        :checked="unit.is_base"
                                        @change="setBaseUnit(index)"
                                        class="border-slate-300 text-emerald-600 focus:ring-emerald-500">
                                    <span>الوحدة الأساسية</span>
                                </label>
                            </div>

                            <!-- حذف -->
                            <div class="lg:col-span-2 flex items-center justify-end">
                                <button
                                    @click="removeUnit(unit, index)"
                                    class="bg-rose-50 hover:bg-rose-100 text-rose-600 p-3 rounded-xl transition flex items-center justify-center w-10 h-10">
                                    <i class="fas fa-trash text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ==================== أزرار الحفظ ===================== -->
            <div class="flex gap-3">
                <button
                    @click="saveMedicine"
                    class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition flex items-center gap-2 shadow-sm">
                    <i class="fas fa-save"></i>
                    {{ isEditing ? 'تحديث الدواء' : 'حفظ الدواء' }}
                </button>
                <button
                    v-if="isEditing"
                    @click="resetForm"
                    class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-8 py-3 rounded-xl font-semibold text-sm transition">
                    إلغاء
                </button>
            </div>

            <!-- ====================== جدول الأدوية ====================== -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div class="border-b border-slate-100 p-6 bg-slate-50/50">
                    <h2 class="font-bold text-base text-slate-800 flex items-center gap-2.5">
                        <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
                            <i class="fas fa-list"></i>
                        </span>
                        كاتالوج الأدوية
                    </h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-right text-sm">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                <th class="p-4">الدواء</th>
                                <th class="p-4">التصنيف</th>
                                <th class="p-4">الوحدات</th>
                                <th class="p-4">الأساسية</th>
                                <th class="p-4">الحالة</th>
                                <th class="p-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-if="!medicines || medicines.length === 0">
                                <td colspan="6" class="p-8 text-center text-slate-400 text-xs">لا توجد أدوية مضافة في الكاتالوج</td>
                            </tr>
                            <tr v-for="m in medicines" :key="m.id" class="hover:bg-slate-50/60 transition">
                                <td class="p-4 font-bold text-slate-800">
                                    {{ m.name }}
                                </td>
                                <td class="p-4 text-slate-600 text-xs">
                                    {{ m.category?.name || '-' }}
                                </td>
                                <td class="p-4">
                                    <div v-if="getMedicineUnits(m).length" class="flex flex-wrap gap-1.5">
                                        <span v-for="u in getMedicineUnits(m)" :key="u.id" class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                                            {{ u.unit?.name || unitLabel(u.unit_id) }} <span class="text-slate-400 mx-1">×</span> {{ u.factor }}
                                        </span>
                                    </div>
                                    <span v-else class="text-rose-500 text-xs font-semibold">
                                        ⚠ لا توجد وحدات
                                    </span>
                                </td>
                                <td class="p-4 text-slate-600 text-xs font-medium">
                                    {{ getMedicineUnits(m).find(x => x.is_base)?.unit?.name || unitLabel(getMedicineUnits(m).find(x => x.is_base)?.unit_id) || '-' }}
                                </td>
                                <td class="p-4">
                                    <span v-if="getMedicineUnits(m).length" class="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-semibold">
                                        مكتمل
                                    </span>
                                    <span v-else class="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md text-xs font-semibold">
                                        يحتاج تحديث
                                    </span>
                                </td>
                                <td class="p-4">
                                    <div class="flex items-center gap-3">
                                        <button @click="editMedicine(m)" class="text-sky-600 hover:text-sky-700 text-xs font-semibold transition">
                                            تعديل
                                        </button>
                                        <button @click="deleteMedicine(m.id)" class="text-rose-600 hover:text-rose-700 text-xs font-semibold transition">
                                            حذف
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
setup() {
        
        const apiBase = "https://pharmaflow-api-2-0-0-stable-alganim.onrender.com/api";
        
        const loading=ref(false);

        const saving=ref(false);

        const isEditing=ref(false);

        const currentMedicineId=ref(null);

        const medicines=ref([]);

        const categories=ref([]);

        const pricingRules = ref([]);

        const availableUnits=ref([]);

        const errors=ref({});

        const medicineUnits=ref([]);

        const barcodeInput=ref(null);

       

        const form=reactive({

            id:null,

            name:"",

            barcode:"",

            category_id:"",

            pricing_rule_id: null,

            notes:""

        });
        const totalUnits=computed(()=>{

        return medicineUnits.value.length;

        });
        const hasBaseUnit=computed(()=>{

            return medicineUnits.value.some(

            u=>u.is_base

            );

        });
        const editableMedicine=computed(()=>{

        return currentMedicineId.value!==null;

        });
        const getMedicineUnits=(medicine)=>{

            if(!medicine)
                return[];

            if(!Array.isArray(medicine.units))
                return[];

            return medicine.units;

        };
        const getBaseUnit=(medicine)=>{

            return getMedicineUnits(

            medicine

            )

            .find(

            u=>u.is_base

            )

            ||

            null;

        };
        const baseUnitName=(medicine)=>{

        const base = getBaseUnit(medicine);
        if (!base) return "غير محددة";
        return base.unit?.name || unitLabel(base.unit_id) || "غير محددة";

        };
        const medicineStatus=(medicine)=>{

            return getMedicineUnits(

            medicine

            ).length

            ?

            "ready"

            :

            "missing";

        };
        const clearForm=()=>{
            form.id=null;

            form.name="";

            form.barcode="";

            form.category_id="";

            form.pricing_rule_id = null;

            form.notes="";

            errors.value={};

            currentMedicineId.value=null;

            isEditing.value=false;

            medicineUnits.value=[];

            };
        const createDefaultUnit=()=>({

            id:null,

            unit_id:"",

            factor:1,

            barcode:"",

            allow_sale:true,

            is_base:false,

            sort_order:

            medicineUnits.value.length+1

            });
        
        
        watch(medicineUnits,()=>{
            medicineUnits.value.forEach((u,index)=>{u.sort_order=index+1;});
        },{deep:true}

        );
        watch(medicineUnits,()=>{
            medicineUnits.value.forEach(u=>{if(u.barcode===null)u.barcode="";});},
        {deep:true}

        );
        
        const addUnit = () => {

            medicineUnits.value.push({

                id: null,

                unit_id: "",

                factor: medicineUnits.value.length === 0 ? 1 : "",

                barcode: "",

                allow_sale: true,

                is_base: medicineUnits.value.length === 0,

                sort_order: medicineUnits.value.length + 1

            });

        };
        const removeUnit = async (unit, index) => {

            if (medicineUnits.value.length === 1) {

                alert("يجب وجود وحدة واحدة على الأقل");

                return;

            }

            if (unit.id) {

                try {

                    await axios.delete(

                        apiBase +

                        "/medicine-units/" +

                        unit.id

                    );

                } catch (e) {

                    console.error(e);

                }

            }

            medicineUnits.value.splice(index, 1);

            medicineUnits.value.forEach(

                (u, i) =>

                u.sort_order = i + 1

            );

            if (!medicineUnits.value.some(u => u.is_base)) {

                medicineUnits.value[0].is_base = true;

                medicineUnits.value[0].factor = 1;

            }

        };
        const setBaseUnit = (index) => {

            medicineUnits.value.forEach(

                (u, i) => {

                    u.is_base = i === index;

                }

            );

            medicineUnits.value[index].factor = 1;

        };
        const duplicatedUnit = () => {

            const ids = medicineUnits.value

                .map(u => u.unit_id)

                .filter(Boolean);

            return ids.length !== new Set(ids).size;

        };
        const duplicatedBarcode = () => {

            const barcodes = medicineUnits.value

                .map(

                    u =>

                    (u.barcode || "").trim()

                )

                .filter(

                    b => b !== ""

                );

            return barcodes.length !==

                new Set(barcodes).size;

        };
        const validateUnits = () => {

            if (medicineUnits.value.length === 0) {

                alert("أضف وحدة واحدة على الأقل");

                return false;

            }

            if (!medicineUnits.value.some(u => u.is_base)) {

                alert("حدد الوحدة الأساسية");

                return false;

            }

            if (duplicatedUnit()) {

                alert("الوحدة مكررة");

                return false;

            }

            if (duplicatedBarcode()) {

                alert("باركود مكرر");

                return false;

            }

            for (const u of medicineUnits.value) {

                if (!u.unit_id) {

                    alert("اختر الوحدة");

                    return false;

                }

                if (!u.factor || u.factor < 1) {

                    alert("المعامل غير صحيح");

                    return false;

                }

            }

            return true;

        };
        const unitLabel = (id) => {

            return availableUnits.value.find(

                u => u.id == id

            )?.name || "";

        };

        const makePayload = () => {

            return {

                name: form.name,

                barcode: form.barcode,

                category_id: form.category_id,

                pricing_rule_id:
                    form.pricing_rule_id
                        ? Number(form.pricing_rule_id)
                        : null,

                notes: form.notes,

                units: medicineUnits.value.map(

                    u => ({

                        id: u.id,

                        unit_id: u.unit_id,

                        factor: Number(u.factor),

                        barcode: u.barcode,

                        allow_sale: u.allow_sale,

                        is_base: u.is_base,

                        sort_order: u.sort_order

                    })

                )

            };

        };
        const loadUnits = async () => {

            const res = await axios.get(

                apiBase +

                "/units"

            );

            availableUnits.value =

                Array.isArray(res.data)

                ? res.data

                : res.data.data;

        };
        const loadCategories = async () => {

            const res = await axios.get(

                apiBase +

                "/categories"

            );

            categories.value =

                Array.isArray(res.data)

                ? res.data

                : res.data.data;

        };
        const loadPricingRules = async () => {

            try {

                const res = await axios.get(

                    apiBase + "/price-engine/rules"

                );

                const list =

                    Array.isArray(res.data)

                        ? res.data

                        : (

                            res.data?.data

                            ||

                            res.data?.rules

                            ||

                            []

                        );

                pricingRules.value =

                    list.filter(

                        rule => rule.is_active

                    );

            }

            catch (e) {

                console.error(

                    "Error loading pricing rules:",

                    e

                );

                pricingRules.value = [];

            }

        };
        const pricingRuleLabel = (rule) => {

            if (!rule) return "";

            let label = "";

            if (rule.type === "percentage") {

                label =
                    `${Number(rule.value || 0)}%`;

            }

            else if (rule.type === "fixed") {

                label =
                    `+ ${Number(rule.value || 0)}`;

            }

            else if (rule.type === "multiply") {

                label =
                    `× ${Number(rule.value || 0)}`;

            }

            else {

                label =
                    String(rule.value ?? "");

            }

            const mode =
                rule.settings?.rounding?.mode
                || "none";

            const unit =
                Number(
                    rule.settings?.rounding?.unit
                    || 1
                );

            const roundingLabels = {

                none: "بدون تقريب",

                nearest: `أقرب ${unit}`,

                up: `لأعلى ${unit}`,

                down: `لأسفل ${unit}`

            };

            return (

                `${label} — `

                +

                (

                    roundingLabels[mode]

                    ||

                    "بدون تقريب"

                )

            );

        };
        const loadMedicines = async () => {

            loading.value = true;

            try {

                const res = await MedicineService.getAll({
                    with_units: 1
                });

                medicines.value =

                    Array.isArray(res)

                    ? res

                    : (res.data || []);

            }

            catch (e) {

                console.error(e);

                medicines.value = [];

            }

            finally {

                loading.value = false;

            }

        };
        const editMedicine = async (medicine) => {

            try {

                loading.value = true;

                const full = await MedicineService.get(

                    medicine.id

                );

                currentMedicineId.value = full.id;

                isEditing.value = true;

                form.id = full.id;

                form.name = full.name;

                form.barcode = full.barcode;

                form.category_id = full.category_id;

                form.pricing_rule_id =
                full.pricing_rule_id
                    ? Number(full.pricing_rule_id)
                    : null;

                form.notes = full.notes || "";

                medicineUnits.value =

                    (full.units || []).map(

                        u => ({

                            id: u.id,

                            unit_id: u.unit_id || u.id,

                            factor: Number(u.factor),

                            barcode: u.barcode || "",

                            allow_sale: !!u.allow_sale,

                            is_base: !!u.is_base,

                            sort_order: u.sort_order

                        })

                    );

                if (

                    medicineUnits.value.length === 0

                ) {

                    addUnit();

                }

                await nextTick();

                window.scrollTo({

                    top: 0,

                    behavior: "smooth"

                });

            }

            finally {

                loading.value = false;

            }

        };
        const deleteMedicine = async (id) => {

            if (

                !confirm(

                    "حذف الدواء؟"

                )

            )

                return;

            try {

                await MedicineService.delete(id);

                await loadMedicines();

            }

            catch (e) {

                console.error(e);

            }

        };
        const createMedicine = async () => {
            const payload = makePayload();
            await MedicineService.save(payload);
        };

        const updateMedicine = async () => {
            const payload = makePayload();
            await MedicineService.update(currentMedicineId.value, payload);
        };
        const saveMedicine = async () => {
            errors.value = {};

            if (!validateUnits()) return;

            saving.value = true;

            try {
                if (isEditing.value) {
                    await updateMedicine();
                } else {
                    await createMedicine();
                }

                // Immediately pull fresh data from the database
                await loadMedicines(); 

                resetForm();

                showToast("تم حفظ الدواء بنجاح"); // Optional: use your toast system if active

            } catch (e) {
                if (e.response?.status === 422) {
                    errors.value = e.response.data.errors;
                } else {
                    console.error(e);
                    alert("حدث خطأ أثناء حفظ الدواء");
                }
            } finally {
                saving.value = false;
            }
        };
        const resetForm = () => {

            clearForm();

            addUnit();

            nextTick(() => {

                barcodeInput.value?.focus();

            });

        };
        const barcodeRefs = [];
        const focusNextBarcode=(event)=>{

            const inputs=[

                ...document.querySelectorAll(

                    ".barcode-input"

                )

            ];

            const current=

                inputs.indexOf(event.target);

            if(current>=0){

                inputs[current+1]?.focus();

            }

        }
        const toast=ref({

            show:false,

            text:"",

            color:"green"

        });
        
        const showToast=(

            text,

            color="green"

            )=>{

            toast.value={

            show:true,

            text,

            color

            };

            setTimeout(

            ()=>toast.value.show=false,

            2500

            );

        };
        
        const initApp=async()=>{

            loading.value=true;

            try{

            await Promise.all([

                loadMedicines(),

                loadCategories(),

                loadUnits(),

                loadPricingRules()

            ]);

            if(

            medicineUnits.value.length===0

            ){

            addUnit();

            }

            }

            finally{

            loading.value=false;

            }

        };
        
        onMounted(initApp);

        return{

            loading,

            saving,

            isEditing,

            currentMedicineId,

            medicines,

            categories,

            availableUnits,

            medicineUnits,

            errors,

            form,

            totalUnits,

            editableMedicine,

            hasBaseUnit,

            getMedicineUnits,

            getBaseUnit,

            baseUnitName,

            medicineStatus,

            clearForm,

            resetForm,

            createDefaultUnit,
            
            addUnit,

            removeUnit,

            setBaseUnit,

            validateUnits,

            duplicatedUnit,

            duplicatedBarcode,

            unitLabel,

            makePayload,

            loadUnits,

            loadCategories,

            loadMedicines,

            editMedicine,

            deleteMedicine,

            createMedicine,

            updateMedicine,

            saveMedicine,
            
            pricingRules,

            pricingRuleLabel,

            loadPricingRules,

        };
    }
};
export default Medicine;
//====== End Medicine ============//
