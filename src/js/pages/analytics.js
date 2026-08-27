import '../../css/app.css';

import {
    createApp
} from 'vue';

import axios from 'axios';

import Chart from 'chart.js/auto';

import {
    API_BASE
} from '../config.js';


const api = axios.create({

    baseURL: API_BASE,

    headers: {

        Accept:
            'application/json'

    }

});


/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
    (config) => {

        const token =
            localStorage.getItem('token');

        if (token) {

            config.headers.Authorization =
                `Bearer ${token}`;

        }

        return config;

    }
);


/*
|--------------------------------------------------------------------------
| Vue Application
|--------------------------------------------------------------------------
*/

createApp({

    data() {

        return {

            loading: false,

            dashboard: null,

            charts: {},

            branches: [],

            selectedBranch: 'all'

        };

    },


    async mounted() {

        await this.loadBranches();

        await this.loadDashboard();

    },


    methods: {

        /*
        |--------------------------------------------------------------------------
        | Formatting
        |--------------------------------------------------------------------------
        */

        formatNumber(value) {

            if (
                value === null ||
                value === undefined ||
                value === ''
            ) {

                return 0;

            }

            return Number(value)
                .toLocaleString();

        },


        /*
        |--------------------------------------------------------------------------
        | Branches
        |--------------------------------------------------------------------------
        */

        async loadBranches() {

            try {

                const response =
                    await api.get(
                        '/branches'
                    );

                this.branches =
                    response.data.data
                    ||
                    response.data
                    ||
                    [];

            }

            catch (error) {

                console.error(
                    'Failed to load branches',
                    error
                );

            }

        },


        /*
        |--------------------------------------------------------------------------
        | Dashboard
        |--------------------------------------------------------------------------
        */

        async loadDashboard() {

            this.loading = true;

            try {

                const response =
                    await api.get(

                        '/analytics/dashboard',

                        {

                            params: {

                                branch_id:
                                    this.selectedBranch

                            }

                        }

                    );


                this.dashboard =
                    response.data;


                this.$nextTick(
                    () => {

                        this.renderCharts();

                    }
                );

            }

            catch (error) {

                console.error(
                    error
                );

                alert(
                    'تعذر تحميل بيانات التحليلات'
                );

            }

            finally {

                this.loading = false;

            }

        },


        /*
        |--------------------------------------------------------------------------
        | Chart Management
        |--------------------------------------------------------------------------
        */

        destroyChart(name) {

            if (
                this.charts[name]
            ) {

                this.charts[name].destroy();

                this.charts[name] =
                    null;

            }

        },


        renderCharts() {

            if (
                !this.dashboard
            ) {

                return;

            }

            this.renderSalesProfitChart();

            this.renderInventoryDistributionChart();

            this.renderGrowthChart();

            this.renderSupplierChart();

            this.renderPeakHoursChart();

            this.renderForecastChart();

            this.renderABCChart();

        },


        /*
        |--------------------------------------------------------------------------
        | Sales / Profit
        |--------------------------------------------------------------------------
        */

        renderSalesProfitChart() {

            this.destroyChart('sales');


            const canvas =
                document.getElementById(
                    'salesProfitChart'
                );

            if (!canvas) {

                return;

            }


            const rows =
                Array.isArray(
                    this.dashboard.sales_profit_chart
                )

                    ? this.dashboard
                        .sales_profit_chart

                    : [];


            this.charts.sales =

                new Chart(
                    canvas,
                    {

                        type: 'line',

                        data: {

                            labels:
                                rows.map(
                                    x =>
                                        x.month
                                ),

                            datasets: [

                                {

                                    label:
                                        'المبيعات',

                                    data:
                                        rows.map(
                                            x =>
                                                Number(
                                                    x.sales
                                                )
                                        )

                                },

                                {

                                    label:
                                        'الأرباح',

                                    data:
                                        rows.map(
                                            x =>
                                                Number(
                                                    x.profit
                                                )
                                        )

                                }

                            ]

                        },

                        options: {

                            responsive: true,

                            maintainAspectRatio:
                                true,

                            plugins: {

                                legend: {
                                    display: true
                                }

                            }

                        }

                    }
                );

        },


        /*
        |--------------------------------------------------------------------------
        | Inventory Distribution
        |--------------------------------------------------------------------------
        */

        renderInventoryDistributionChart() {

            this.destroyChart(
                'inventory'
            );


            const canvas =
                document.getElementById(
                    'inventoryDistributionChart'
                );

            if (!canvas) {

                return;

            }


            const inventory =
                this.dashboard.inventory
                ||
                {};


            this.charts.inventory =

                new Chart(
                    canvas,
                    {

                        type: 'doughnut',

                        data: {

                            labels: [

                                'منخفض',

                                'قرب الانتهاء',

                                'سليم'

                            ],

                            datasets: [

                                {

                                    data: [

                                        Number(
                                            inventory.low_stock
                                            ||
                                            0
                                        ),

                                        Number(
                                            inventory.expiring_soon
                                            ||
                                            0
                                        ),

                                        Number(
                                            inventory.health_score
                                            ||
                                            0
                                        )

                                    ]

                                }

                            ]

                        },

                        options: {

                            responsive: true,

                            maintainAspectRatio:
                                true

                        }

                    }
                );

        },


        /*
        |--------------------------------------------------------------------------
        | Growth
        |--------------------------------------------------------------------------
        */

        renderGrowthChart() {

            this.destroyChart(
                'growth'
            );


            const canvas =
                document.getElementById(
                    'growthChart'
                );

            if (!canvas) {

                return;

            }


            const rows =
                Array.isArray(
                    this.dashboard.growth_chart
                )

                    ? this.dashboard.growth_chart

                    : [];


            this.charts.growth =

                new Chart(
                    canvas,
                    {

                        type: 'bar',

                        data: {

                            labels:
                                rows.map(
                                    x =>
                                        x.month
                                ),

                            datasets: [

                                {

                                    label:
                                        'النمو %',

                                    data:
                                        rows.map(
                                            x =>
                                                Number(
                                                    x.growth
                                                    ||
                                                    0
                                                )
                                        )

                                }

                            ]

                        },

                        options: {

                            responsive: true

                        }

                    }
                );

        },


        /*
        |--------------------------------------------------------------------------
        | Suppliers
        |--------------------------------------------------------------------------
        */

        renderSupplierChart() {

            this.destroyChart(
                'supplier'
            );


            const canvas =
                document.getElementById(
                    'supplierChart'
                );

            if (!canvas) {

                return;

            }


            const rows =
                Array.isArray(
                    this.dashboard.suppliers
                )

                    ? this.dashboard.suppliers

                    : [];


            this.charts.supplier =

                new Chart(
                    canvas,
                    {

                        type: 'doughnut',

                        data: {

                            labels:
                                rows.map(
                                    x =>
                                        x.name
                                ),

                            datasets: [

                                {

                                    data:
                                        rows.map(
                                            x =>
                                                Number(
                                                    x.total
                                                    ||
                                                    0
                                                )
                                        )

                                }

                            ]

                        },

                        options: {

                            responsive: true

                        }

                    }
                );

        },


        /*
        |--------------------------------------------------------------------------
        | Peak Hours
        |--------------------------------------------------------------------------
        */

        renderPeakHoursChart() {

            this.destroyChart(
                'peak'
            );


            const canvas =
                document.getElementById(
                    'peakHoursChart'
                );

            if (!canvas) {

                return;

            }


            const rows =
                Array.isArray(
                    this.dashboard.peak_hours
                )

                    ? this.dashboard.peak_hours

                    : [];


            this.charts.peak =

                new Chart(
                    canvas,
                    {

                        type: 'bar',

                        data: {

                            labels:
                                rows.map(
                                    x =>
                                        x.hour
                                ),

                            datasets: [

                                {

                                    label:
                                        'الفواتير',

                                    data:
                                        rows.map(
                                            x =>
                                                Number(
                                                    x.invoices
                                                    ||
                                                    0
                                                )
                                        )

                                }

                            ]

                        },

                        options: {

                            responsive: true

                        }

                    }
                );

        },


        /*
        |--------------------------------------------------------------------------
        | Forecast
        |--------------------------------------------------------------------------
        */

        renderForecastChart() {

            this.destroyChart(
                'forecast'
            );


            const canvas =
                document.getElementById(
                    'forecastChart'
                );

            if (!canvas) {

                return;

            }


            const rows =
                Array.isArray(
                    this.dashboard.forecast
                )

                    ? this.dashboard.forecast

                    : [];


            const topForecast =
                rows.slice(
                    0,
                    10
                );


            this.charts.forecast =

                new Chart(
                    canvas,
                    {

                        type: 'bar',

                        data: {

                            labels:
                                topForecast.map(
                                    x =>
                                        x.name
                                ),

                            datasets: [

                                {

                                    label:
                                        'المخزون الحالي',

                                    data:
                                        topForecast.map(
                                            x =>
                                                Number(
                                                    x.current_stock
                                                    ||
                                                    0
                                                )
                                        )

                                }

                            ]

                        },

                        options: {

                            responsive: true

                        }

                    }
                );

        },


        /*
        |--------------------------------------------------------------------------
        | ABC
        |--------------------------------------------------------------------------
        */

        renderABCChart() {

            this.destroyChart(
                'abc'
            );


            const canvas =
                document.getElementById(
                    'abcChart'
                );

            if (!canvas) {

                return;

            }


            this.charts.abc =

                new Chart(
                    canvas,
                    {

                        type: 'pie',

                        data: {

                            labels: [
                                'A',
                                'B',
                                'C'
                            ],

                            datasets: [

                                {

                                    data: [
                                        70,
                                        20,
                                        10
                                    ]

                                }

                            ]

                        },

                        options: {

                            responsive: true

                        }

                    }
                );

        }

    }

}).mount('#app');