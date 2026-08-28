import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    onMounted
} from 'vue';
import axios from 'axios';
import SupplierService
    from '../../src/js/services/supplier.service.js';
//======= Start Suppliers ==============//
const Suppliers = {
    template: `
        <div class="p-6 lg:p-8 space-y-8 bg-slate-50/50 min-h-screen" dir="rtl">

        <!-- ================= Supplier Form ================= -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-200 hover:shadow-md">
            <div class="px-8 py-6 border-b border-slate-100 bg-gradient-to-l from-slate-50/50 to-white">
                <div class="flex items-center gap-3">
                    <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                    </div>
                    <div>
                        <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">
                            إدارة الموردين
                        </h2>
                        <p class="text-sm text-slate-500 mt-0.5">
                            إضافة وتحديث بيانات الموردين المسجلين في النظام.
                        </p>
                    </div>
                </div>
            </div>

            <div class="p-8">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            اسم المورد
                        </label>
                        <input
                            v-model="form.name"
                            placeholder="اسم المورد"
                            class="w-full bg-slate-50/50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                            :class="{'border-red-500 bg-red-50/30': errors.name, 'border-slate-200': !errors.name}">
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            رقم الهاتف
                        </label>
                        <input
                            v-model="form.phone"
                            placeholder="رقم الهاتف"
                            class="w-full bg-slate-50/50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-mono"
                            :class="{'border-red-500 bg-red-50/30': errors.phone, 'border-slate-200': !errors.phone}">
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            البريد الإلكتروني
                        </label>
                        <input
                            v-model="form.email"
                            placeholder="البريد الإلكتروني"
                            class="w-full bg-slate-50/50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-mono"
                            :class="{'border-red-500 bg-red-50/30': errors.email, 'border-slate-200': !errors.email}">
                    </div>
                </div>

                <!-- Errors Section -->
                <div v-if="Object.keys(errors).length" class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl space-y-1">
                    <div v-for="(err, key) in errors" :key="key" class="text-red-600 text-xs font-medium flex items-center gap-1.5">
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        <span>{{ err[0] }}</span>
                    </div>
                </div>

                <div class="flex justify-end">
                    <button
                        @click="saveSupplier"
                        class="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-150 flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        {{ isEditing ? 'تحديث بيانات المورد' : 'إضافة مورد جديد' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- ================= Suppliers Table ================= -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-right border-collapse">
                    <thead>
                        <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                            <th class="p-4.5">اسم المورد</th>
                            <th class="p-4.5">الهاتف</th>
                            <th class="p-4.5">البريد</th>
                            <th class="p-4.5 text-center">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
                        <tr
                            v-for="s in suppliers"
                            :key="s.id"
                            class="hover:bg-slate-50/50 transition-colors group">
                            <td class="p-4.5 font-bold text-slate-800">
                                {{ s.name }}
                            </td>
                            <td class="p-4.5 font-mono text-slate-600">
                                {{ s.phone }}
                            </td>
                            <td class="p-4.5 font-mono text-slate-500">
                                {{ s.email }}
                            </td>
                            <td class="p-4.5 text-center">
                                <div class="flex items-center justify-center gap-2">
                                    <button
                                        @click="editSupplier(s)"
                                        class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="تعديل">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                        </svg>
                                    </button>
                                    <button
                                        @click="deleteSupplier(s.id)"
                                        class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="حذف">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!suppliers.length">
                            <td colspan="4" class="text-center py-12 text-slate-400">
                                لا يوجد موردين مسجلين حتى الآن.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>
    `,
    setup() {
       
        const suppliers = ref([]);
        const errors = ref({}); // تعريف مصفوفة الأخطاء
        const form = ref({ id: null, name: '', phone: '', email: '' });
        const isEditing = ref(false);

        const fetchSuppliers = async () => {
            const res = await axios.get('https://pharmaflow-api-2-0-0-stable-alganim.onrender.com/api/suppliers');
            suppliers.value = res.data;
        };

        const saveSupplier = async () => {
            errors.value = {}; // مسح الأخطاء السابقة
            try {
                if (isEditing.value) {
                    await axios.put('https://pharmaflow-api-2-0-0-stable-alganim.onrender.com/api/suppliers/' + form.value.id, form.value);
                } else {
                    await axios.post('https://pharmaflow-api-2-0-0-stable-alganim.onrender.com/api/suppliers', form.value);
                }
                resetForm();
                fetchSuppliers();
                alert('تم الحفظ بنجاح');
            } catch (e) {
                if (e.response && e.response.status === 422) {
                    errors.value = e.response.data.errors; // تعيين الأخطاء من Laravel
                } else {
                    alert('حدث خطأ في النظام');
                }
            }
        };

        const editSupplier = (s) => { 
            form.value = { ...s }; 
            isEditing.value = true; 
            errors.value = {}; // مسح الأخطاء عند التعديل
        };
        
        const resetForm = () => {
            form.value = { id: null, name: '', phone: '', email: '' };
            isEditing.value = false;
            errors.value = {};
        };
        
        const deleteSupplier = async (id) => {
            if(confirm('هل أنت متأكد؟')) {
                await axios.delete('https://pharmaflow-api-2-0-0-stable-alganim.onrender.com/api/suppliers/' + id);
                fetchSuppliers();
            }
        };

        onMounted(fetchSuppliers);
        return { suppliers, form, isEditing, saveSupplier, editSupplier, deleteSupplier, errors };
    }
};
export default Suppliers;
//======= End Suppliers ===============//

