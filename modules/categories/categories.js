import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    onMounted
} from 'vue';
import axios from 'axios';
//======= Start Categories ==============//
const Categories = {
template: `
        <div class="p-8 max-w-5xl mx-auto space-y-6" dir="rtl">
            <!-- ================= نموذج إضافة / تعديل تصنيف ================= -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div class="border-b border-slate-100 p-6 bg-slate-50/50">
                    <h2 class="text-base font-bold text-slate-800 flex items-center gap-2.5">
                        <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
                            <i class="fas fa-tags"></i>
                        </span>
                        {{ isEditing ? 'تعديل التصنيف' : 'إضافة تصنيف جديد' }}
                    </h2>
                </div>
                <div class="p-6 space-y-4">
                    <div class="flex flex-col md:flex-row gap-3 items-start md:items-center">
                        <div class="flex-1 w-full">
                            <input
                                v-model="form.name"
                                placeholder="اسم التصنيف"
                                class="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                                :class="{'border-rose-500 bg-rose-50/30': errors.name, 'border-slate-300': !errors.name}">
                        </div>
                        <div class="flex gap-2 w-full md:w-auto">
                            <button
                                @click="saveCategory"
                                class="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2">
                                <i class="fas fa-save text-xs"></i>
                                {{ isEditing ? 'تحديث' : 'إضافة' }}
                            </button>
                            <button
                                v-if="isEditing"
                                @click="resetForm"
                                class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-3 rounded-xl font-semibold text-sm transition">
                                إلغاء
                            </button>
                        </div>
                    </div>
                    
                    <!-- الأخطاء -->
                    <div v-if="Object.keys(errors).length" class="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-1">
                        <div v-for="(err, key) in errors" :key="key" class="text-rose-600 text-xs font-medium">
                            • {{ err[0] }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- ====================== جدول التصنيفات ====================== -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div class="border-b border-slate-100 p-6 bg-slate-50/50">
                    <h2 class="font-bold text-base text-slate-800 flex items-center gap-2.5">
                        <span class="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-sm">
                            <i class="fas fa-list-ul"></i>
                        </span>
                        قائمة التصنيفات
                    </h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-right text-sm">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                <th class="p-4">اسم التصنيف</th>
                                <th class="p-4 text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-if="!categories || categories.length === 0">
                                <td colspan="2" class="p-8 text-center text-slate-400 text-xs">لا توجد تصنيفات مضافة حالياً</td>
                            </tr>
                            <tr v-for="cat in categories" :key="cat.id" class="hover:bg-slate-50/60 transition">
                                <td class="p-4 font-bold text-slate-800">
                                    {{ cat.name }}
                                </td>
                                <td class="p-4 text-left">
                                    <div class="flex items-center justify-end gap-2">
                                        <button
                                            @click="editCategory(cat)"
                                            title="تعديل"
                                            class="w-9 h-9 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 flex items-center justify-center transition shadow-sm">
                                            <i class="fas fa-pen text-xs"></i>
                                        </button>
                                        <button
                                            @click="deleteCategory(cat.id)"
                                            title="حذف"
                                            class="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition shadow-sm">
                                            <i class="fas fa-trash text-xs"></i>
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
       
        const categories = ref([]);
        const errors = ref({}); // تعريف مصفوفة الأخطاء
        const form = ref({ id: null, name: '' });
        const isEditing = ref(false);

        const fetchCategories = async () => {
            const res = await axios.get('https://pharmaflow-api-2-0-0-stable-alganim.onrender.com/api/categories');
            categories.value = res.data;
        };

        const saveCategory = async () => {
            errors.value = {}; // مسح الأخطاء السابقة
            try {
                if (isEditing.value) {
                    await axios.put('https://pharmaflow-api-2-0-0-stable-alganim.onrender.com/api/categories/' + form.value.id, form.value);
                } else {
                    await axios.post('https://pharmaflow-api-2-0-0-stable-alganim.onrender.com/api/categories', form.value);
                }
                resetForm();
                fetchCategories();
                alert('تم الحفظ بنجاح');
            } catch (e) {
                if (e.response && e.response.status === 422) {
                    errors.value = e.response.data.errors; // تعيين الأخطاء القادمة من Laravel
                } else {
                    alert('حدث خطأ في النظام');
                }
            }
        };

        const editCategory = (cat) => { 
            form.value = { ...cat }; 
            isEditing.value = true; 
            errors.value = {}; // مسح الأخطاء عند التعديل
        };
        
        const resetForm = () => {
            form.value = { id: null, name: '' };
            isEditing.value = false;
            errors.value = {};
        };

        const deleteCategory = async (id) => {
            if (confirm('تنبيه: سيتم حذف هذا التصنيف. هل أنت متأكد؟')) {
                await axios.delete('https://pharmaflow-api-2-0-0-stable-alganim.onrender.com/api/categories/' + id);
                fetchCategories();
            }
        };

        onMounted(fetchCategories);
        return { categories, form, isEditing, saveCategory, editCategory, deleteCategory, resetForm, errors };
    }
};
export default Categories;
//======= End Categories ================//
