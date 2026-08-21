import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    onMounted
} from 'vue';

import axios from 'axios';

import PricingService
    from '../../src/js/services/pricing.service.js';

const Pricing = {
template: `
<div class="space-y-6">

    <!-- Header -->

    <div class="flex items-center justify-between">

        <div>

            <h2 class="text-2xl font-bold">

                محرك الأسعار

            </h2>

            <p class="text-gray-500">

                إدارة قواعد التسعير ومحاكاة الأسعار

            </p>

        </div>

    </div>

    <!-- ===================================================== -->

    <!-- Rule Form -->

    <!-- ===================================================== -->

    <div class="bg-white rounded-xl shadow p-6">

        <h3 class="text-lg font-semibold mb-4">

            {{ rule.id ? 'تعديل قاعدة' : 'إضافة قاعدة' }}

        </h3>

        <div class="grid grid-cols-6 gap-4">

            <div class="col-span-2">

                <label class="text-sm">

                    اسم القاعدة

                </label>

                <input

                    v-model="rule.name"

                    class="w-full border rounded p-2"

                >

            </div>

            <div>

                <label>

                    النوع

                </label>

                <select

                    v-model="rule.type"

                    class="w-full border rounded p-2"

                >

                    <option value="percentage">

                        نسبة %

                    </option>

                    <option value="fixed">

                        مبلغ ثابت

                    </option>

                    <option value="multiply">

                        ضرب

                    </option>

                </select>

            </div>

            <div>

                <label>

                    تطبق على

                </label>

                <select

                    v-model="rule.apply_on"

                    class="w-full border rounded p-2"

                >

                    <option value="buy_price">

                        سعر الشراء

                    </option>

                    <option value="sell_price">

                        سعر البيع

                    </option>

                    <option value="profit">

                        الربح

                    </option>

                </select>

            </div>

            <div>

                <label>

                    القيمة

                </label>

                <input

                    type="number"

                    v-model.number="rule.value"

                    class="w-full border rounded p-2"

                >

            </div>

            <div>

                <label>

                    الترتيب

                </label>

                <input

                    type="number"

                    v-model.number="rule.sort_order"

                    class="w-full border rounded p-2"

                >

            </div>

        </div>

        <!-- ===================================================== -->
        <!-- Rounding -->
        <!-- ===================================================== -->

        <div class="grid grid-cols-4 gap-4 mt-4">

            <div>

                <label class="text-sm">

                    سياسة التقريب

                </label>

                <select

                    v-model="rule.settings.rounding.mode"

                    class="w-full border rounded p-2"

                >

                    <option value="none">

                        بدون تقريب

                    </option>

                    <option value="nearest">

                        الأقرب

                    </option>

                    <option value="up">

                        لأعلى

                    </option>

                    <option value="down">

                        لأسفل

                    </option>

                </select>

            </div>

            <div>

                <label class="text-sm font-medium">
                    وحدة التقريب
                </label>

                <div class="flex gap-2">

                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        v-model.number="rule.settings.rounding.unit"
                        class="flex-1 border rounded p-2"
                        placeholder="أدخل قيمة مخصصة"
                    >

                </div>

                <div class="flex flex-wrap gap-2 mt-2">

                    <button
                        v-for="value in roundingSuggestions"
                        :key="value"
                        type="button"
                        @click="rule.settings.rounding.unit = value"
                        class="px-3 py-1.5 rounded-lg border bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 text-xs"
                    >
                        {{ value }}
                    </button>

                </div>

                <p class="text-xs text-slate-400 mt-2">
                    اختر قيمة شائعة أو أدخل أي قيمة مخصصة.
                </p>

            </div>

            <div class="flex items-end">

                <label class="flex items-center gap-2">

                    <input

                        type="checkbox"

                        v-model="rule.is_default"

                    >

                    قاعدة افتراضية

                </label>

            </div>

        </div>

        <div class="flex justify-between mt-4">

            <label class="flex items-center gap-2">

                <input

                    type="checkbox"

                    v-model="rule.is_active"

                >

                مفعلة

            </label>

            <div class="space-x-2">

                <button

                    class="px-4 py-2 rounded bg-gray-200"

                    @click="resetRule"

                >

                    جديد

                </button>

                <button

                    class="px-4 py-2 rounded bg-blue-600 text-white"

                    @click="saveRule"

                    :disabled="saving"

                >

                    {{ saving ? 'جاري الحفظ...' : 'حفظ' }}

                </button>

            </div>

        </div>

    </div>

    <!-- ===================================================== -->

    <!-- Rules -->

    <!-- ===================================================== -->

    <div class="bg-white rounded-xl shadow overflow-x-auto">
        <button
            @click="regenerateCurrentPrices"
            :disabled="loading"
            class="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
        >
            {{
                loading
                    ? 'جاري تحديث الأسعار...'
                    : 'تحديث الأسعار الحالية حسب قواعد الأدوية'
            }}
        </button>
        <table class="w-full">

            <thead class="bg-gray-100">

                <tr>

                    <th class="p-3">#</th>

                    <th class="p-3">الاسم</th>

                    <th class="p-3">النوع</th>

                    <th class="p-3">التطبيق</th>

                    <th class="p-3">القيمة</th>

                    <th class="p-3">التقريب</th>

                    <th class="p-3">الترتيب</th>

                    <th class="p-3">الحالة</th>

                    <th class="p-3">الافتراضية</th>

                    <th class="p-3">العمليات</th>

                </tr>

            </thead>

            <tbody>

                <tr

                    v-for="item in rules"

                    :key="item.id"

                    class="border-b hover:bg-gray-50"

                >

                    <td class="p-3">

                        {{ item.id }}

                    </td>

                    <td class="p-3">

                        {{ item.name }}

                    </td>

                    <td class="p-3">

                        {{ item.type }}

                    </td>

                    <td class="p-3">

                        {{ item.apply_on }}

                    </td>

                    <td class="p-3">

                        {{ item.value }}

                    </td>

                    <td class="p-3">

                        {{ formatRounding(item) }}

                    </td>

                    <td class="p-3">

                        {{ item.sort_order }}

                    </td>

                    <td class="p-3">

                        <span

                            class="px-2 py-1 rounded"

                            :class="item.is_active

                                ? 'bg-green-100 text-green-700'

                                : 'bg-red-100 text-red-700'"

                        >

                            {{ item.is_active ? 'مفعلة' : 'متوقفة' }}

                        </span>

                    </td>

                    <td class="p-3">

                        <span

                            v-if="item.is_default"

                            class="px-2 py-1 rounded bg-blue-100 text-blue-700"

                        >

                            افتراضية

                        </span>

                        <span

                            v-else

                            class="text-gray-400"

                        >

                            —

                        </span>

                    </td>

                    <td class="p-3">

                        <div class="flex items-center gap-2">

                            <button

                                @click="editRule(item)"

                                class="text-blue-600 hover:text-blue-800"

                                title="تعديل"

                            >

                                ✏

                            </button>

                            <button

                                @click="toggleRule(item.id)"

                                class="text-purple-600 hover:text-purple-800"

                                title="تفعيل / إيقاف"

                            >

                                🔄

                            </button>

                            <button

                                @click="deleteRule(item.id)"

                                class="text-red-600 hover:text-red-800"

                                title="حذف"

                            >

                                🗑

                            </button>

                            

                        </div>

                    </td>

                </tr>

                <tr v-if="!rules.length">

                    <td

                        colspan="10"

                        class="text-center py-8 text-gray-400"

                    >

                        لا توجد قواعد تسعير.

                    </td>

                </tr>

            </tbody>

        </table>

    </div>

    <!-- ===================================================== -->

    <!-- Medicine Pricing Rules -->

    <!-- ===================================================== -->

    <div class="bg-white rounded-xl shadow p-6">

        <div class="flex items-center justify-between mb-4">

            <div>

                <h3 class="text-lg font-semibold">

                    قواعد تسعير الأدوية

                </h3>

                <p class="text-sm text-gray-500 mt-1">

                    اختر قاعدة التسعير الخاصة بكل دواء.

                </p>

            </div>

            <button

                @click="loadMedicines"

                class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"

            >

                تحديث

            </button>

        </div>

        <div class="overflow-x-auto">

            <table class="w-full">

                <thead class="bg-gray-100">

                    <tr>

                        <th class="p-3 text-right">

                            الدواء

                        </th>

                        <th class="p-3 text-right">

                            القاعدة الحالية

                        </th>

                        <th class="p-3 text-right">

                            قاعدة التسعير

                        </th>

                    </tr>

                </thead>

                <tbody>

                    <tr

                        v-for="medicine in medicines"

                        :key="medicine.id"

                        class="border-b"

                    >

                        <td class="p-3 font-semibold">

                            {{ medicine.name }}

                        </td>

                        <td class="p-3 text-gray-500">

                            {{

                                medicine.pricing_rule?.name

                                ||

                                'القاعدة الافتراضية'

                            }}

                        </td>

                        <td class="p-3">

                            <select

                                :value="medicine.pricing_rule_id || ''"

                                @change="assignMedicineRule(

                                    medicine,

                                    $event.target.value

                                )"

                                class="border rounded p-2 min-w-[250px]"

                            >

                                <option value="">

                                    استخدام القاعدة الافتراضية

                                </option>

                                <option

                                    v-for="item in activeRules"

                                    :key="item.id"

                                    :value="item.id"

                                >

                                    {{ item.name }}

                                    —

                                    {{ item.value }}

                                    {{ item.type === 'percentage' ? '%' : '' }}

                                </option>

                            </select>

                        </td>

                    </tr>

                    <tr v-if="!medicines.length">

                        <td

                            colspan="3"

                            class="text-center py-8 text-gray-400"

                        >

                            لا توجد أدوية.

                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

    </div>

    <!-- ===================================================== -->

    <!-- Simulator -->

    <!-- ===================================================== -->

    <div class="bg-white rounded-xl shadow p-6">

        <h3 class="text-lg font-semibold mb-4">

            محاكاة السعر

        </h3>

        <div class="grid grid-cols-4 gap-4">

            <div class="col-span-2">

                <label>

                    الدواء

                </label>

                <select

                    v-model.number="simulator.medicine_id"

                    class="w-full border rounded p-2"

                >

                    <option :value="null">

                        اختر الدواء

                    </option>

                    <option

                        v-for="medicine in medicines"

                        :key="medicine.id"

                        :value="medicine.id"

                    >

                        {{ medicine.name }}

                    </option>

                </select>

            </div>

            <div>

                <label>

                    سعر الشراء

                </label>

                <input

                    type="number"

                    v-model.number="simulator.buy_price"

                    class="w-full border rounded p-2"

                >

            </div>

            <div class="flex items-end">

                <button

                    class="bg-green-600 text-white rounded px-4 py-2"

                    @click="simulate"

                    :disabled="loading"

                >

                    {{ loading ? 'جاري الحساب...' : 'تشغيل' }}

                </button>

            </div>

        </div>

        <div

            v-if="simulationResult"

            class="mt-6"

        >

            <div

                v-if="simulationResult.rule_name"

                class="mb-4 p-3 rounded bg-gray-50"

            >

                القاعدة:

                <strong>

                    {{ simulationResult.rule_name }}

                </strong>

            </div>

            <div

                v-if="simulationResult.raw_sell_price !== undefined"

                class="border-b py-2"

            >

                <div class="font-semibold">

                    السعر قبل التقريب

                </div>

                <div class="text-gray-500">

                    {{ simulationResult.raw_sell_price }}

                </div>

            </div>

            <div

                v-for="step in simulationResult.steps || []"

                :key="step.rule + step.before + step.after"

                class="border-b py-2"

            >

                <div class="font-semibold">

                    {{ step.rule }}

                </div>

                <div class="text-gray-500">

                    {{ step.before }}

                    →

                    {{ step.after }}

                </div>

            </div>

            <div class="mt-4 bg-blue-50 rounded p-4 space-y-2">

                <div class="flex justify-between">

                    <span>

                        سعر البيع

                    </span>

                    <strong>

                        {{ simulationResult.sell_price }}

                    </strong>

                </div>

                <div class="flex justify-between">

                    <span>

                        الربح

                    </span>

                    <strong>

                        {{ simulationResult.profit_amount }}

                    </strong>

                </div>

                <div class="flex justify-between">

                    <span>

                        النسبة

                    </span>

                    <strong>

                        {{ simulationResult.profit_percent }}%

                    </strong>

                </div>

            </div>

        </div>

    </div>

</div>
`,

setup() {

    /*
    |--------------------------------------------------------------------------
    | Services
    |--------------------------------------------------------------------------
    */

    const pricing = PricingService;

    /*
    |--------------------------------------------------------------------------
    | State
    |--------------------------------------------------------------------------
    */

    const loading = ref(false);

    const saving = ref(false);

    const rules = ref([]);

    const medicines = ref([]);

    const simulationResult = ref(null);

    const roundingSuggestions = ref([
        1,
        5,
        10,
        25,
        50,
        100,
        250,
        500,
        1000
    ]);
    /*
    |--------------------------------------------------------------------------
    | Rule Form
    |--------------------------------------------------------------------------
    */

    const rule = reactive({

        id: null,

        name: '',

        type: 'percentage',

        apply_on: 'buy_price',

        value: 40,

        sort_order: 1,

        is_active: true,

        is_default: false,

        settings: {

            rounding: {

                mode: 'none',

                unit: 1

            }

        }

    });

    /*
    |--------------------------------------------------------------------------
    | Simulation
    |--------------------------------------------------------------------------
    */

    const simulator = reactive({

        medicine_id: null,

        buy_price: 100

    });

    /*
    |--------------------------------------------------------------------------
    | Load Rules
    |--------------------------------------------------------------------------
    */

    const loadRules = async () => {

        loading.value = true;

        try {

            rules.value =
                await pricing.loadRules();

        }

        catch (e) {

            console.error(e);

            alert(

                e.response?.data?.message

                ||

                'تعذر تحميل قواعد التسعير'

            );

        }

        finally {

            loading.value = false;

        }

    };

    /*
    |--------------------------------------------------------------------------
    | Load Medicines
    |--------------------------------------------------------------------------
    */

    const loadMedicines = async () => {

        try {

            medicines.value =
                await pricing.loadMedicines();

        }

        catch (e) {

            console.error(e);

            alert(

                e.response?.data?.message

                ||

                'تعذر تحميل الأدوية'

            );

        }

    };

    /*
    |--------------------------------------------------------------------------
    | Active Rules
    |--------------------------------------------------------------------------
    */

    const activeRules = computed(() => {

        return rules.value.filter(

            item => item.is_active

        );

    });

    /*
    |--------------------------------------------------------------------------
    | Rounding Display
    |--------------------------------------------------------------------------
    */

    const formatRounding = (item) => {

        const mode =

            item.settings?.rounding?.mode

            ||

            'none';

        const unit =

            Number(

                item.settings?.rounding?.unit

                ||

                1

            );

        const labels = {

            none:
                'بدون تقريب',

            nearest:
                `الأقرب ${unit}`,

            up:
                `لأعلى ${unit}`,

            down:
                `لأسفل ${unit}`

        };

        return (

            labels[mode]

            ||

            'بدون تقريب'

        );

    };

    /*
    |--------------------------------------------------------------------------
    | Assign Medicine Rule
    |--------------------------------------------------------------------------
    */

    const assignMedicineRule = async (

        medicine,

        pricingRuleId

    ) => {

        try {

            const id =

                pricingRuleId

                    ? Number(
                        pricingRuleId
                    )

                    : null;

            await pricing.assignRule(

                medicine.id,

                id

            );

            medicine.pricing_rule_id = id;

            medicine.pricing_rule =

                rules.value.find(

                    item => item.id === id

                )

                ||

                null;

            alert(

                'تم تحديث قاعدة تسعير الدواء'

            );

        }

        catch (e) {

            console.error(e);

            alert(

                e.response?.data?.message

                ||

                'تعذر تحديث قاعدة التسعير'

            );

            await loadMedicines();

        }

    };

    /*
    |--------------------------------------------------------------------------
    | Reset Rule
    |--------------------------------------------------------------------------
    */

    const resetRule = () => {

        rule.id = null;

        rule.name = '';

        rule.type = 'percentage';

        rule.apply_on = 'buy_price';

        rule.value = 40;

        rule.sort_order =

            rules.value.length + 1;

        rule.is_active = true;

        rule.is_default = false;

        rule.settings = {

            rounding: {

                mode: 'none',

                unit: 1

            }

        };

    };

    /*
    |--------------------------------------------------------------------------
    | Save Rule
    |--------------------------------------------------------------------------
    */

    const saveRule = async () => {

        saving.value = true;

        try {

            const payload = {

                id: rule.id,

                name: rule.name,

                type: rule.type,

                apply_on: rule.apply_on,

                value: Number(
                    rule.value
                ),

                sort_order: Number(
                    rule.sort_order
                ),

                is_active:
                    Boolean(
                        rule.is_active
                    ),

                is_default:
                    Boolean(
                        rule.is_default
                    ),

                settings: {

                    rounding: {

                        mode:
                            rule.settings
                                .rounding
                                .mode
                            ||

                            'none',

                        unit:
                            Number(
                                rule.settings
                                    .rounding
                                    .unit
                                ||

                                1
                            )

                    }

                }

            };

            if (rule.id) {

                await pricing.updateRule(

                    rule.id,

                    payload

                );

            }

            else {

                delete payload.id;

                await pricing.createRule(

                    payload

                );

            }

            await loadRules();

            resetRule();

            alert(

                'تم حفظ قاعدة التسعير'

            );

        }

        catch (e) {

            console.error(e);

            alert(

                e.response?.data?.message

                ||

                'تعذر حفظ قاعدة التسعير'

            );

        }

        finally {

            saving.value = false;

        }

    };

    /*
    |--------------------------------------------------------------------------
    | Edit Rule
    |--------------------------------------------------------------------------
    */

    const editRule = (item) => {

        rule.id = item.id;

        rule.name = item.name || '';

        rule.type =
            item.type || 'percentage';

        rule.apply_on =
            item.apply_on || 'buy_price';

        rule.value =
            Number(item.value || 0);

        rule.sort_order =
            Number(
                item.sort_order || 1
            );

        rule.is_active =
            Boolean(
                item.is_active
            );

        rule.is_default =
            Boolean(
                item.is_default
            );

        rule.settings = {

            rounding: {

                mode:
                    item.settings
                        ?.rounding
                        ?.mode

                    ||

                    'none',

                unit:
                    Number(

                        item.settings
                            ?.rounding
                            ?.unit

                        ||

                        1

                    )

            }

        };

    };

    /*
    |--------------------------------------------------------------------------
    | Delete Rule
    |--------------------------------------------------------------------------
    */

    const deleteRule = async (id) => {

        if (

            !confirm(

                'هل تريد حذف قاعدة التسعير؟'

            )

        ) {

            return;

        }

        try {

            await pricing.deleteRule(

                id

            );

            await loadRules();

            alert(

                'تم حذف القاعدة'

            );

        }

        catch (e) {

            console.error(e);

            alert(

                e.response?.data?.message

                ||

                'تعذر حذف قاعدة التسعير'

            );

        }

    };

    /*
    |--------------------------------------------------------------------------
    | Toggle Rule
    |--------------------------------------------------------------------------
    */

    const toggleRule = async (id) => {

        try {

            await pricing.toggleRule(

                id

            );

            await loadRules();

        }

        catch (e) {

            console.error(e);

            alert(

                e.response?.data?.message

                ||

                'تعذر تغيير حالة القاعدة'

            );

        }

    };

    /*
    |--------------------------------------------------------------------------
    | Apply Rule
    |--------------------------------------------------------------------------
    */

    const applyRule = async (id) => {

        const selectedRule =

            rules.value.find(

                item => item.id === id

            );

        if (!selectedRule) {

            alert(

                'قاعدة التسعير غير موجودة'

            );

            return;

        }

        if (

            !confirm(

                'سيتم إعادة توليد الأسعار حسب قواعد الأدوية الحالية. هل تريد المتابعة؟'

            )

        ) {

            return;

        }

        loading.value = true;

        try {

            await pricing.regenerateAll();

            alert(

                'تم إعادة توليد الأسعار بنجاح'

            );

        }

        catch (e) {

            console.error(e);

            alert(

                e.response?.data?.message

                ||

                'تعذر إعادة توليد الأسعار'

            );

        }

        finally {

            loading.value = false;

        }

    };

    /*
    |--------------------------------------------------------------------------
    | Simulate
    |--------------------------------------------------------------------------
    */

    const simulate = async () => {

        if (

            !simulator.medicine_id

        ) {

            alert(

                'اختر الدواء أولاً'

            );

            return;

        }

        if (

            Number(
                simulator.buy_price
            ) < 0

        ) {

            alert(

                'أدخل سعر شراء صحيح'

            );

            return;

        }

        loading.value = true;

        try {

            simulationResult.value =

                await pricing.simulate({

                    medicine_id: Number(
                        simulator.medicine_id
                    ),

                    buy_price: Number(
                        simulator.buy_price
                    )

                });

        }

        catch (e) {

            console.error(e);

            simulationResult.value = null;

            alert(

                e.response?.data?.message

                ||

                'تعذر تنفيذ المحاكاة'

            );

        }

        finally {

            loading.value = false;

        }

    };

   const regenerateCurrentPrices = async () => {

        if (!confirm(
            'سيتم تحديث أسعار الدفعات التي ما زال بها مخزون حسب قاعدة كل دواء. هل تريد المتابعة؟'
        )) {
            return;
        }

        loading.value = true;

        try {

            const response =
                await pricing.regenerateCurrent();

            const data =
                response.data || {};

            alert(
                `تم التحديث بنجاح.\n\n` +

                `الدفعات: ${data.batches || 0}\n` +

                `الوحدات: ${data.units || 0}\n` +

                `الأسعار: ${data.prices || 0}\n` +

                `الأخطاء: ${data.failed || 0}`
            );

        } catch (e) {

            console.error(e);

            alert(
                e.response?.data?.message ||
                'تعذر تحديث الأسعار.'
            );

        } finally {

            loading.value = false;

        }
    };

    /*
    |--------------------------------------------------------------------------
    | Lifecycle
    |--------------------------------------------------------------------------
    */

    onMounted(
        async () => {

            await loadRules();

            await loadMedicines();

        }
    );

    /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    */

    return {

        loading,

        saving,

        rules,

        medicines,

        activeRules,

        rule,

        simulator,

        simulationResult,

        loadRules,

        loadMedicines,

        saveRule,

        editRule,

        deleteRule,

        toggleRule,

        applyRule,

        assignMedicineRule,

        formatRounding,

        simulate,

        resetRule,
        roundingSuggestions,
        regenerateCurrentPrices,

    };

}

};

export default Pricing;