import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    onMounted
} from 'vue';
import axios from 'axios';
//====== Start Overview ========//
  const Overview = {
template: `
        <div class="p-8 max-w-7xl mx-auto space-y-8" dir="rtl">
            <!-- Header Banner / Welcome Section -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-l from-slate-900 to-[#0b132b] p-6 rounded-2xl shadow-sm text-white">
                <div>
                    <h2 class="text-2xl font-bold tracking-tight">نظرة عامة على النظام</h2>
                    <p class="text-slate-400 text-sm mt-1">متابعة أداء الصيدلية، الحركات، والمخزون اللحظي لجميع الفروع</p>
                </div>
                <!-- Branch Filter -->
                <div class="w-full md:w-72">
                    <select v-model="selectedBranch" @change="fetchOverview" 
                        class="w-full bg-slate-800/80 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition">
                        <option value="all">عرض إحصائيات جميع الفروع</option>
                        <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
                    </select>
                </div>
            </div>

            <!-- Modern KPI Cards Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <!-- Daily Sales -->
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
                    <div class="absolute -left-4 -bottom-4 w-24 h-24 bg-sky-50 rounded-full group-hover:scale-125 transition duration-300"></div>
                    <div class="relative z-10">
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">مبيعات اليوم</p>
                        <h3 class="text-2xl font-bold text-slate-800 mt-2">{{ stats.daily_sales || 0 }} <span class="text-xs font-normal text-slate-500">ج.س</span></h3>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-xl relative z-10 shadow-sm">
                        <i class="fas fa-chart-line"></i>
                    </div>
                </div>

                <!-- Invoice Count -->
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
                    <div class="absolute -left-4 -bottom-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-125 transition duration-300"></div>
                    <div class="relative z-10">
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">عدد الفواتير</p>
                        <h3 class="text-2xl font-bold text-slate-800 mt-2">{{ stats.invoice_count || 0 }}</h3>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl relative z-10 shadow-sm">
                        <i class="fas fa-file-invoice-dollar"></i>
                    </div>
                </div>

                <!-- Low Stock Items -->
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
                    <div class="absolute -left-4 -bottom-4 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-125 transition duration-300"></div>
                    <div class="relative z-10">
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">أصناف ناقصة</p>
                        <h3 class="text-2xl font-bold text-slate-800 mt-2">{{ stats.low_stock_items?.length || 0 }}</h3>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl relative z-10 shadow-sm">
                        <i class="fas fa-box-open"></i>
                    </div>
                </div>

                <!-- Expiry Alerts -->
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
                    <div class="absolute -left-4 -bottom-4 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-125 transition duration-300"></div>
                    <div class="relative z-10">
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">تنبيهات الانتهاء</p>
                        <h3 class="text-2xl font-bold text-slate-800 mt-2">{{ stats.all_batches?.filter(b => isExpiring(b.expiry_date)).length || 0 }}</h3>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl relative z-10 shadow-sm">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                </div>
            </div>

            <!-- Data Tables Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Sales History -->
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-5">
                            <h3 class="font-bold text-base text-slate-800 flex items-center gap-2.5">
                                <span class="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-sm"><i class="fas fa-receipt"></i></span>
                                سجل المبيعات
                            </h3>
                            <button @click="exportToExcel(stats.sales_history, 'تقرير_المبيعات')" 
                                class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5">
                                <i class="fas fa-file-excel text-emerald-600"></i> تصدير إكسل
                            </button>
                        </div>
                        <div class="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                            <table class="w-full text-right text-sm">
                                <thead>
                                    <tr class="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                        <th class="p-4">الفاتورة</th>
                                        <th class="p-4">التاريخ</th>
                                        <th class="p-4">التحصيل</th>
                                        <th class="p-4">تفاصيل البنك</th>
                                        <th class="p-4">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <tr v-if="!stats.sales_history || stats.sales_history.length === 0">
                                        <td colspan="5" class="p-8 text-center text-slate-400 text-xs">لا توجد بيانات مبيعات متوفرة</td>
                                    </tr>
                                    <tr v-for="s in paginate(stats.sales_history, pageSales)" :key="s.id" class="hover:bg-slate-50/60 transition">
                                        <td class="p-4 font-semibold text-slate-800">#{{ s.id }}</td>
                                        <td class="p-4 text-slate-500 text-xs">{{ s.created_at?.substring(0, 10) }}</td>
                                        <td class="p-4 text-slate-500 text-xs">
                                            <span class="px-2.5 py-1 rounded-md text-xs font-semibold" :class="s.payment_method === 'cash' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'">
                                                {{ s.payment_method }}
                                            </span>
                                        </td>
                                        <td class="p-4 text-xs text-slate-600">
                                            <div v-if="s.payment_method === 'bank'">
                                                <p class="font-medium text-slate-800">البنك: {{ s.bank_name }}</p>
                                                <p class="text-slate-500">المرجع: {{ s.bank_reference }} | التاريخ: {{ s.bank_transfer_date }}</p>
                                                <p v-if="s.bank_notes" class="text-slate-400 italic">ملاحظات: {{ s.bank_notes }}</p>
                                            </div>
                                            <span v-else class="text-slate-400 italic">نقدي (لا توجد تفاصيل بنكية)</span>
                                        </td>
                                        <td class="p-4 font-bold text-emerald-600">{{ s.total_amount }} <span class="text-xs font-normal text-slate-500">ج.س</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="mt-5 flex justify-between items-center pt-4 border-t border-slate-100">
                        <div class="flex gap-1.5">
                            <button @click="pageSales--" :disabled="pageSales===1" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-medium transition">السابق</button>
                            <button @click="pageSales++" :disabled="pageSales >= totalPages(stats.sales_history)" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-medium transition">التالي</button>
                        </div>
                        <span class="text-xs font-medium text-slate-500">صفحة {{ pageSales }} من {{ totalPages(stats.sales_history) || 1 }}</span>
                    </div>
                </div>

                <!-- Inventory Logs -->
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-5">
                            <h3 class="font-bold text-base text-slate-800 flex items-center gap-2.5">
                                <span class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-sm"><i class="fas fa-history"></i></span>
                                آخر حركات المخزون (Inventory Movements)
                            </h3>
                            <button @click="exportToExcel(stats.inventory_movements, 'سجل_حركات_المخزون')" 
                                class="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5">
                                <i class="fas fa-file-excel text-purple-600"></i> تصدير إكسل
                            </button>
                        </div>
                        <div class="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                            <table class="w-full text-right text-sm">
                                <thead>
                                    <tr class="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                        <th class="p-4">الدواء</th>
                                        <th class="p-4">نوع الحركة</th>
                                        <th class="p-4">الكمية</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <tr v-if="!stats.inventory_movements || stats.inventory_movements.length === 0">
                                        <td colspan="3" class="p-8 text-center text-slate-400 text-xs">لا توجد حركات مخزون مسجلة</td>
                                    </tr>
                                    <tr v-for="log in paginate(stats.inventory_movements, pageLogs)" :key="log.id" class="hover:bg-slate-50/60 transition">
                                        <td class="p-4 font-semibold text-slate-800">{{ log.medicine }}</td>
                                        <td class="p-4">
                                            <span :class="log.type === 'purchase' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'" class="px-2.5 py-1 rounded-md text-xs font-semibold">
                                                {{ log.type }}
                                            </span>
                                        </td>
                                        <td class="p-4 font-medium text-slate-600">{{ log.quantity }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="mt-5 flex justify-between items-center pt-4 border-t border-slate-100">
                        <div class="flex gap-1.5">
                            <button @click="pageLogs--" :disabled="pageLogs===1" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-medium transition">السابق</button>
                            <button @click="pageLogs++" :disabled="pageLogs >= totalPages(stats.inventory_movements)" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-medium transition">التالي</button>
                        </div>
                        <span class="text-xs font-medium text-slate-500">صفحة {{ pageLogs }} من {{ totalPages(stats.inventory_movements) || 1 }}</span>
                    </div>
                </div>

                <!-- Low Stock Items -->
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 col-span-1 lg:col-span-2 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-5">
                            <h3 class="font-bold text-base text-slate-800 flex items-center gap-2.5">
                                <span class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-sm"><i class="fas fa-exclamation-triangle"></i></span>
                                أدوية على وشك النفاذ
                            </h3>
                            <button @click="exportToExcel(stats.low_stock_items, 'الأدوية_الناقصة')" 
                                class="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5">
                                <i class="fas fa-file-excel text-rose-600"></i> تصدير إكسل
                            </button>
                        </div>
                        <div class="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                            <table class="w-full text-right text-sm">
                                <thead>
                                    <tr class="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                        <th class="p-4">اسم الدواء</th>
                                        <th class="p-4">الكمية المتوفرة</th>
                                        <th class="p-4">الوحدة</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <tr v-if="!stats.low_stock_items || stats.low_stock_items.length === 0">
                                        <td colspan="3" class="p-8 text-center text-slate-400 text-xs">ممتاز! لا توجد أدوية منخفضة المخزون حالياً</td>
                                    </tr>
                                    <tr v-for="b in paginate(stats.low_stock_items, pageLowStock)" :key="b.id" class="hover:bg-slate-50/60 transition">
                                        <td class="p-4 font-bold text-slate-800">{{ b.name }}</td>
                                        <td class="p-4">
                                            <span class="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md text-xs font-bold">
                                                {{ b.stock_quantity }}
                                            </span>
                                        </td>
                                        <td class="p-4 text-slate-500 text-xs">{{ b.unit_name }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="mt-5 flex justify-between items-center pt-4 border-t border-slate-100">
                        <div class="flex gap-1.5">
                            <button @click="pageLowStock--" :disabled="pageLowStock===1" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-medium transition">السابق</button>
                            <button @click="pageLowStock++" :disabled="pageLowStock >= totalPages(stats.low_stock_items)" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-medium transition">التالي</button>
                        </div>
                        <span class="text-xs font-medium text-slate-500">صفحة {{ pageLowStock }} من {{ totalPages(stats.low_stock_items) || 1 }}</span>
                    </div>
                </div>

                <!-- All Batches Record -->
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 col-span-1 lg:col-span-2 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-5">
                            <h3 class="font-bold text-base text-slate-800 flex items-center gap-2.5">
                                <span class="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-sm"><i class="fas fa-boxes"></i></span>
                                سجل دفعات الأدوية (All Batches)
                            </h3>
                            <button @click="exportToExcel(stats.all_batches, 'جميع_دفعات_الأدوية')" 
                                class="bg-sky-50 hover:bg-sky-100 text-sky-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5">
                                <i class="fas fa-file-excel text-sky-600"></i> تصدير إكسل
                            </button>
                        </div>
                        <div class="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                            <table class="w-full text-right text-sm">
                                <thead>
                                    <tr class="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                        <th class="p-4">اسم الدواء</th>
                                        <th class="p-4">رقم التشغيلة (Batch)</th>
                                        <th class="p-4">الكمية المتبقية</th>
                                        <th class="p-4">تاريخ الانتهاء</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <tr v-if="!stats.all_batches || stats.all_batches.length === 0">
                                        <td colspan="4" class="p-8 text-center text-slate-400 text-xs">لا توجد دفعات مسجلة حالياً</td>
                                    </tr>
                                    <tr v-for="b in paginate(stats.all_batches, pageAllBatches)" :key="b.id" class="hover:bg-slate-50/60 transition">
                                        <td class="p-4 font-bold text-slate-800">{{ b.medicine?.name }}</td>
                                        <td class="p-4 text-slate-600 font-mono text-xs">{{ b.batch_number }}</td>
                                        <td class="p-4 font-semibold text-slate-800">
                                            {{ b.converted_quantity}} <span class="text-xs font-normal text-emerald-600">{{ b.unit?.name || 'قطعة' }} remaining</span>
                                        </td>
                                        <td class="p-4">
                                            <span :class="isExpiring(b.expiry_date) ? 'bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md text-xs font-bold' : 'text-slate-600 text-xs'">
                                                {{ b.expiry_date }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="mt-5 flex justify-between items-center pt-4 border-t border-slate-100">
                        <div class="flex gap-1.5">
                            <button @click="pageAllBatches--" :disabled="pageAllBatches===1" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-medium transition">السابق</button>
                            <button @click="pageAllBatches++" :disabled="pageAllBatches >= totalPages(stats.all_batches)" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-medium transition">التالي</button>
                        </div>
                        <span class="text-xs font-medium text-slate-500">صفحة {{ pageAllBatches }} من {{ totalPages(stats.all_batches) || 1 }}</span>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const stats = ref({ sales_history: [], inventory_movements: [], all_batches: [], low_stock_items: [] });
        const branches = ref([]);
        const selectedBranch = ref('all');
        const pageSales = ref(1); const pageLogs = ref(1); const pageLowStock = ref(1);
        const perPage = 10;
        const pageAllBatches = ref(1);

        const fetchOverview = async () => {
            const res = await axios.get('https://pharmaflow-api-1.1.0-beta-main.test/api/admin/overview-stats', { params: { branch_id: selectedBranch.value } });
            stats.value = res.data;
        };

        const totalPages = (arr) => Math.ceil((arr?.length || 0) / perPage);
        const paginate = (arr, page) => {
            const start = (page - 1) * perPage;
            return arr?.slice(start, start + perPage) || [];
        };

        const isExpiring = (date) => {
            const d = new Date(date);
            const limit = new Date(); limit.setMonth(limit.getMonth() + 3);
            return d < limit;
        };

        const exportToExcel = (data, fileName) => {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        };

        onMounted(() => {
            axios.get('https://pharmaflow-api-1.1.0-beta-main.test/api/branches').then(res => branches.value = res.data);
            fetchOverview();
        });

        return { stats, branches, selectedBranch, fetchOverview, pageSales, pageLogs, pageLowStock, pageAllBatches, paginate, totalPages, isExpiring, exportToExcel };
    }
};

export default Overview;
    //===== End Overview ===========//