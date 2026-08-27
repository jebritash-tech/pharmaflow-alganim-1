import axios from 'axios';
//========= Start Analytics ====//
const Analytics = {
template: `
    <div class="p-6 space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-lg shadow border">
                <h3 class="font-bold text-slate-700 mb-4">اتجاه المبيعات (آخر 7 أيام)</h3>
                <canvas id="salesChart"></canvas>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow border">
                <h3 class="font-bold text-slate-700 mb-4">الأدوية الأكثر ربحية</h3>
                <ul class="space-y-3">
                    <li v-for="med in topProfitable" :key="med.id" class="flex justify-between p-2 border-b">
                        <span>{{ med.name }}</span>
                        <span class="font-bold text-emerald-600">{{ med.profit }} ج.س</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
`,
setup() {
    const topProfitable = ref([]);

    const renderChart = async () => {
        const res = await axios.get('https://pharmaflow-api-1.1.0-beta-main.test/api/admin/analytics-data');
        const ctx = document.getElementById('salesChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: res.data.dates,
                datasets: [{ label: 'المبيعات (ج.س)', data: res.data.totals, borderColor: '#10b981', fill: true }]
            }
        });
        topProfitable.value = res.data.top_medicines;
    };

    onMounted(renderChart);
    return { topProfitable };
}
};
export default Analytics;
//==== End  Analytics ======//