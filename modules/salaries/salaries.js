import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    onMounted
} from 'vue';
import axios from 'axios';
import SalaryService
    from '../../src/js/services/salaries.service.js';
const Salaries = {

template:`

<div class="space-y-6">

    <!-- ================================= -->

    <!-- Header -->

    <!-- ================================= -->

    <div class="flex items-center justify-between">

        <div>

            <h2 class="text-2xl font-bold">

                إدارة الرواتب

            </h2>

            <p class="text-sm text-gray-500">

                إدارة رواتب الموظفين وصرفها.

            </p>

        </div>

        <div class="flex gap-2">

            <button

                @click="generateMonth"

                class="px-4 py-2 rounded-lg bg-blue-600 text-white"

            >

                إنشاء رواتب الشهر

            </button>

            <button

                @click="load"

                class="px-4 py-2 rounded-lg bg-gray-700 text-white"

            >

                تحديث

            </button>

        </div>

    </div>

    <!-- ================================= -->

    <!-- Dashboard -->

    <!-- ================================= -->

    <div class="grid grid-cols-4 gap-4">

        <div class="bg-white rounded-xl shadow p-4">

            <div class="text-gray-500 text-sm">

                إجمالي الرواتب

            </div>

            <div class="text-2xl font-bold">

                {{ dashboard.total }}

            </div>

        </div>

        <div class="bg-white rounded-xl shadow p-4">

            <div class="text-gray-500 text-sm">

                المدفوع

            </div>

            <div class="text-2xl font-bold text-green-600">

                {{ dashboard.paid }}

            </div>

        </div>

        <div class="bg-white rounded-xl shadow p-4">

            <div class="text-gray-500 text-sm">

                المتبقي

            </div>

            <div class="text-2xl font-bold text-red-600">

                {{ dashboard.pending }}

            </div>

        </div>

        <div class="bg-white rounded-xl shadow p-4">

            <div class="text-gray-500 text-sm">

                عدد الرواتب

            </div>

            <div class="text-2xl font-bold">

                {{ salaries.length }}

            </div>

        </div>

    </div>

    <!-- ================================= -->

    <!-- Filters -->

    <!-- ================================= -->

    <div class="bg-white rounded-xl shadow p-4">

        <div class="grid grid-cols-4 gap-4">

            <select

                v-model="filters.month"

                class="border rounded-lg p-2"

            >

                <option

                    v-for="m in 12"

                    :value="m"

                >

                    {{ m }}

                </option>

            </select>

            <input

                type="number"

                v-model="filters.year"

                class="border rounded-lg p-2"

            >

            <select

                v-model="filters.status"

                class="border rounded-lg p-2"

            >

                <option value="">

                    الكل

                </option>

                <option value="pending">

                    غير مدفوع

                </option>

                <option value="paid">

                    مدفوع

                </option>

            </select>

            <button

                @click="load"

                class="bg-emerald-600 text-white rounded-lg"

            >

                بحث

            </button>

        </div>

    </div>

    <!-- ================================= -->

    <!-- Table -->

    <!-- ================================= -->

    <div class="bg-white rounded-xl shadow overflow-hidden">

        <table class="w-full">

            <thead class="bg-gray-100">

                <tr>

                    <th>#</th>

                    <th>الموظف</th>

                    <th>الأساسي</th>

                    <th>الإضافات</th>

                    <th>الخصومات</th>

                    <th>الصافي</th>

                    <th>الحالة</th>

                    <th></th>

                </tr>

            </thead>

            <tbody>

                <tr

                    v-for="item in salaries"

                    :key="item.id"

                    @click="selected=item"

                    class="cursor-pointer hover:bg-gray-50"

                >

                    <td>{{ item.id }}</td>

                    <td>{{ item.user.name }}</td>

                    <td>{{ item.basic_salary }}</td>

                    <td>{{ item.allowances }}</td>

                    <td>{{ item.deductions }}</td>

                    <td>{{ item.net_salary }}</td>

                    <td>

                        <span

                            class="px-2 py-1 rounded"

                            :class="item.status=='paid'

                            ?'bg-green-100 text-green-700'

                            :'bg-red-100 text-red-700'"

                        >

                            {{ item.status=='paid'

                            ?'مدفوع'

                            :'غير مدفوع' }}

                        </span>

                    </td>

                    <td>

                        <button

                            @click.stop="editSalary(item)"

                        >

                            ✏

                        </button>

                        <button

                            v-if="item.status=='pending'"

                            @click.stop="paySalary(item)"

                        >

                            💰

                        </button>

                        <button

                            @click.stop="deleteSalary(item.id)"

                        >

                            🗑

                        </button>

                    </td>

                </tr>

            </tbody>

        </table>

    </div>

    <!-- ================================= -->

    <!-- Details -->

    <!-- ================================= -->

    <div

        v-if="selected"

        class="bg-white rounded-xl shadow p-6"

    >

        <h3 class="font-bold mb-4">

            تفاصيل الراتب

        </h3>

        <div class="grid grid-cols-2 gap-4">

            <div>

                الموظف

            </div>

            <div>

                {{ selected.user.name }}

            </div>

            <div>

                الشهر

            </div>

            <div>

                {{ selected.month }}/{{ selected.year }}

            </div>

            <div>

                الأساسي

            </div>

            <div>

                {{ selected.basic_salary }}

            </div>

            <div>

                الإضافات

            </div>

            <div>

                {{ selected.allowances }}

            </div>

            <div>

                الخصومات

            </div>

            <div>

                {{ selected.deductions }}

            </div>

            <div>

                الصافي

            </div>

            <div>

                {{ selected.net_salary }}

            </div>

        </div>

    </div>

</div>
<!-- ================================= -->

<!-- Edit Salary Modal -->

<!-- ================================= -->

<div
v-if="showEditModal"
class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
>

<div class="bg-white rounded-xl shadow-xl w-full max-w-xl">

    <div class="border-b p-4">

        <h3 class="font-bold text-lg">

            تعديل الراتب

        </h3>

    </div>

    <div class="p-6 space-y-4">

        <div>

            <label class="text-sm text-gray-500">

                الراتب الأساسي

            </label>

            <input

                class="w-full border rounded-lg p-3 bg-gray-100"

                v-model="salary.basic_salary"

                disabled

            >

        </div>

        <div class="grid grid-cols-2 gap-4">

            <div>

                <label class="text-sm text-gray-500">

                    الإضافات

                </label>

                <input

                    type="number"

                    class="w-full border rounded-lg p-3"

                    v-model.number="salary.allowances"

                >

            </div>

            <div>

                <label class="text-sm text-gray-500">

                    الخصومات

                </label>

                <input

                    type="number"

                    class="w-full border rounded-lg p-3"

                    v-model.number="salary.deductions"

                >

            </div>

        </div>

        <div>

            <label class="text-sm text-gray-500">

                الصافي

            </label>

            <input

                class="w-full border rounded-lg p-3 bg-gray-100"

                :value="

                Number(salary.basic_salary)

                +

                Number(salary.allowances)

                -

                Number(salary.deductions)

                "

                disabled

            >

        </div>

    </div>

    <div class="border-t p-4 flex justify-end gap-2">

        <button

            @click="showEditModal=false"

            class="px-5 py-2 rounded-lg border"

        >

            إلغاء

        </button>

        <button

            @click="saveSalary"

            class="px-5 py-2 rounded-lg bg-blue-600 text-white"

            :disabled="saving"

        >

            {{ saving ? 'جارٍ الحفظ...' : 'حفظ' }}

        </button>

    </div>

</div>

</div>

<!-- ================================= -->

<!-- Pay Salary Modal -->

<!-- ================================= -->

<div
v-if="showPaymentModal"
class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
>

<div class="bg-white rounded-xl shadow-xl w-full max-w-xl">

    <div class="border-b p-4">

        <h3 class="font-bold text-lg">

            صرف الراتب

        </h3>

    </div>

    <div class="p-6 space-y-4">

        <div>

            <label class="text-sm text-gray-500">

                طريقة الدفع

            </label>

            <select

                v-model="payment.payment_method"

                class="w-full border rounded-lg p-3"

            >

                <option value="cash">

                    نقدي

                </option>

                <option value="bank">

                    بنكي

                </option>

            </select>

        </div>

        <template
        v-if="payment.payment_method=='bank'"
        >

            <div>

                <label class="text-sm text-gray-500">

                    اسم البنك

                </label>

                <input

                    class="w-full border rounded-lg p-3"

                    v-model="payment.bank_name"

                >

            </div>

            <div>

                <label class="text-sm text-gray-500">

                    رقم التحويل

                </label>

                <input

                    class="w-full border rounded-lg p-3"

                    v-model="payment.bank_reference"

                >

            </div>

        </template>

        <div>

            <label class="text-sm text-gray-500">

                ملاحظات

            </label>

            <textarea

                rows="3"

                class="w-full border rounded-lg p-3"

                v-model="payment.notes"

            ></textarea>

        </div>

    </div>

    <div class="border-t p-4 flex justify-end gap-2">

        <button

            @click="showPaymentModal=false"

            class="px-5 py-2 rounded-lg border"

        >

            إلغاء

        </button>

        <button

            @click="savePayment"

            class="px-5 py-2 rounded-lg bg-green-600 text-white"

            :disabled="saving"

        >

            {{ saving ? 'جارٍ الصرف...' : 'صرف الراتب' }}

        </button>

    </div>

</div>

</div>
`,
setup(){

    /*
    |--------------------------------------------------------------------------
    | Services
    |--------------------------------------------------------------------------
    */

    const salaryService = SalaryService;

    /*
    |--------------------------------------------------------------------------
    | State
    |--------------------------------------------------------------------------
    */

    const loading = ref(false);

    const saving = ref(false);

    const salaries = ref([]);

    const selected = ref(null);

    const dashboard = reactive({

        total:0,

        paid:0,

        pending:0

    });

    /*
    |--------------------------------------------------------------------------
    | Filters
    |--------------------------------------------------------------------------
    */

    const today = new Date();

    const filters = reactive({

        month:today.getMonth()+1,

        year:today.getFullYear(),

        status:''

    });

    /*
    |--------------------------------------------------------------------------
    | Salary Form
    |--------------------------------------------------------------------------
    */

    const salary = reactive({

        id:null,

        user_id:null,

        month:today.getMonth()+1,

        year:today.getFullYear(),

        allowances:0,

        deductions:0,

        basic_salary:0,

        net_salary:0

    });

    /*
    |--------------------------------------------------------------------------
    | Payment Form
    |--------------------------------------------------------------------------
    */

    const payment = reactive({

        salary_id:null,

        payment_method:'cash',

        bank_name:'',

        bank_reference:'',

        notes:''

    });

    /*
    |--------------------------------------------------------------------------
    | Modals
    |--------------------------------------------------------------------------
    */

    const showEditModal = ref(false);

    const showPaymentModal = ref(false);

    /*
    |--------------------------------------------------------------------------
    | Load
    |--------------------------------------------------------------------------
    */

    const load = async()=>{

        loading.value=true;

        try{

            const res = await salaryService.load({

                month:filters.month,

                year:filters.year,

                status:filters.status

            });

            salaries.value =

                res.data;

            const dash =

                await salaryService.dashboard();

            Object.assign(

                dashboard,

                dash

            );

        }

        finally{

            loading.value=false;

        }

    };

    /*
    |--------------------------------------------------------------------------
    | Generate Month
    |--------------------------------------------------------------------------
    */

    const generateMonth = async()=>{

        if(

            !confirm(

                'إنشاء رواتب هذا الشهر؟'

            )

        ) return;

        await salaryService.generate(

            filters.month,

            filters.year

        );

        await load();

    };

    /*
    |--------------------------------------------------------------------------
    | Edit
    |--------------------------------------------------------------------------
    */

    const editSalary = (item)=>{

        Object.assign(

            salary,

            JSON.parse(

                JSON.stringify(item)

            )

        );

        showEditModal.value=true;

    };

    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    const saveSalary = async()=>{

        saving.value=true;

        try{

            await salaryService.update(

                salary.id,

                salary

            );

            showEditModal.value=false;

            await load();

        }

        finally{

            saving.value=false;

        }

    };

    /*
    |--------------------------------------------------------------------------
    | Payment
    |--------------------------------------------------------------------------
    */

    const paySalary = (item)=>{

        payment.salary_id=

            item.id;

        payment.payment_method='cash';

        payment.bank_name='';

        payment.bank_reference='';

        payment.notes='';

        showPaymentModal.value=true;

    };

    const savePayment = async()=>{

        saving.value=true;

        try{

            await salaryService.pay(

                payment.salary_id,

                payment

            );

            showPaymentModal.value=false;

            await load();

        }

        finally{

            saving.value=false;

        }

    };

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    const deleteSalary = async(id)=>{

        if(

            !confirm(

                'حذف الراتب؟'

            )

        ) return;

        await salaryService.delete(id);

        await load();

    };

    /*
    |--------------------------------------------------------------------------
    | Lifecycle
    |--------------------------------------------------------------------------
    */

    onMounted(async()=>{

        await load();

    });

    /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    */

    return{

        loading,

        saving,

        salaries,

        selected,

        dashboard,

        filters,

        salary,

        payment,

        showEditModal,

        showPaymentModal,

        load,

        generateMonth,

        editSalary,

        saveSalary,

        paySalary,

        savePayment,

        deleteSalary

    };

}};
export default Salaries;