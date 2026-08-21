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


//====== Start Branches ============/
const  Branches = {
  template: `
        <div class="p-6 bg-white rounded-xl shadow-sm border border-slate-100" dir="rtl">
            <!-- Header Section -->
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-xl font-bold text-slate-800">إدارة الفروع</h2>
                    <p class="text-sm text-slate-500">إضافة وتعديل فروع الصيدلية وإدارة بياناتها</p>
                </div>
            </div>

            <!-- Form Card -->
            <div class="mb-6 flex flex-col gap-3 bg-slate-50/80 border border-slate-200/60 p-5 rounded-xl">
                <div class="flex flex-wrap md:flex-nowrap gap-3 items-center">
                    <div class="flex-1 w-full">
                        <input v-model="form.name" placeholder="اسم الفرع (مثال: الفرع الرئيسي)" 
                            class="w-full bg-white border border-slate-300 px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition" 
                            :class="{'border-red-500 focus:ring-red-500/20 focus:border-red-500': errors.name}">
                    </div>
                    <div class="flex-1 w-full">
                        <input v-model="form.location" placeholder="الموقع أو العنوان" 
                            class="w-full bg-white border border-slate-300 px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition" 
                            :class="{'border-red-500 focus:ring-red-500/20 focus:border-red-500': errors.location}">
                    </div>
                    <div class="flex gap-2 w-full md:w-auto">
                        <button @click="saveBranch" class="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition shadow-sm flex items-center justify-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            {{ isEditing ? 'تحديث الفرع' : 'إضافة فرع' }}
                        </button>
                        <button v-if="isEditing" @click="resetForm" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-medium text-sm transition">
                            إلغاء
                        </button>
                    </div>
                </div>

                <!-- Error Messages -->
                <div v-if="Object.keys(errors).length > 0" class="flex flex-col gap-1 mt-1 bg-red-50 border border-red-200 p-3 rounded-lg">
                    <div v-for="(err, key) in errors" :key="key" class="text-red-600 text-xs font-medium flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                        <span>{{ err[0] }}</span>
                    </div>
                </div>
            </div>

            <!-- Data Table -->
            <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table class="w-full text-right border-collapse">
                    <thead>
                        <tr class="bg-slate-100/70 border-b border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                            <th class="p-3.5">الاسم</th>
                            <th class="p-3.5">الموقع</th>
                            <th class="p-3.5 w-32 text-center">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm">
                        <tr v-if="branches.length === 0">
                            <td colspan="3" class="p-8 text-center text-slate-400">لا توجد فروع مسجلة حتى الآن</td>
                        </tr>
                        <tr v-for="b in branches" :key="b.id" class="hover:bg-slate-50/70 transition">
                            <td class="p-3.5 font-medium text-slate-800">{{ b.name }}</td>
                            <td class="p-3.5 text-slate-600">{{ b.location }}</td>
                            <td class="p-3.5">
                                <div class="flex items-center justify-center gap-2">
                                    <button @click="editBranch(b)" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="تعديل">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                    </button>
                                    <button @click="deleteBranch(b.id)" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="حذف">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,
    setup() {
       
        const branches = ref([]);
        const errors = ref({}); // تعريف مصفوفة الأخطاء
        const form = ref({ id: null, name: '', location: '' });
        const isEditing = ref(false);

        const fetchBranches = async () => {
            const res = await axios.get('https://pharmaflow-api-1.1.0-beta-main.test/api/branches');
            branches.value = res.data;
        };

        const saveBranch = async () => {
            errors.value = {}; // مسح الأخطاء السابقة
            try {
                if (isEditing.value) {
                    await axios.put(`https://pharmaflow-api-1.1.0-beta-main.test/api/branches/${form.value.id}`, form.value);
                } else {
                    await axios.post('https://pharmaflow-api-1.1.0-beta-main.test/api/branches', form.value);
                }
                resetForm();
                fetchBranches();
                alert('تم الحفظ بنجاح');
            } catch (e) {
                if (e.response && e.response.status === 422) {
                    errors.value = e.response.data.errors; // تعيين الأخطاء القادمة من Laravel
                } else {
                    alert('حدث خطأ في النظام');
                }
            }
        };

        const resetForm = () => {
            form.value = { id: null, name: '', location: '' };
            isEditing.value = false;
            errors.value = {}; // مسح الأخطاء عند الإلغاء
        };

        const editBranch = (branch) => {
            form.value = { ...branch };
            isEditing.value = true;
            errors.value = {}; // مسح الأخطاء عند التعديل
        };

        const deleteBranch = async (id) => {
            if(confirm('هل أنت متأكد؟')) {
                await axios.delete(`https://pharmaflow-api-1.1.0-beta-main.test/api/branches/${id}`);
                fetchBranches();
            }
        };

        onMounted(fetchBranches);
        return { branches, form, isEditing, saveBranch, editBranch, deleteBranch, resetForm, errors };
    }
};
export default Branches;
//======= End Branches ==================//
