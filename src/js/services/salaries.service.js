import axios from 'axios';

const SalaryService = {

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    async dashboard() {

        const { data } = await axios.get(

            `https://pharmaflow-api-1.1.0-beta-main.test/api/salaries/dashboard`

        );

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Load
    |--------------------------------------------------------------------------
    */

    async load(filters = {}) {

        const { data } = await axios.get(

            `https://pharmaflow-api-1.1.0-beta-main.test/api/salaries`,

            {

                params: filters

            }

        );

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Generate Monthly Salaries
    |--------------------------------------------------------------------------
    */

    async generate(month, year) {

        const { data } = await axios.post(

            `https://pharmaflow-api-1.1.0-beta-main.test/api/salaries/generate`,

            {

                month,

                year

            }

        );

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    async create(payload) {

        const { data } = await axios.post(

            `https://pharmaflow-api-1.1.0-beta-main.test/api/salaries`,

            payload

        );

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    async update(id, payload) {

        const { data } = await axios.put(

            `https://pharmaflow-api-1.1.0-beta-main.test/api/salaries/${id}`,

            payload

        );

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Find
    |--------------------------------------------------------------------------
    */

    async find(id) {

        const { data } = await axios.get(

            `https://pharmaflow-api-1.1.0-beta-main.test/api/salaries/${id}`

        );

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Pay
    |--------------------------------------------------------------------------
    */

    async pay(id, payload) {

        const { data } = await axios.post(

            `https://pharmaflow-api-1.1.0-beta-main.test/api/salaries/${id}/pay`,

            payload

        );

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    async delete(id) {

        const { data } = await axios.delete(

            `https://pharmaflow-api-1.1.0-beta-main.test/api/salaries/${id}`

        );

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Employees
    |--------------------------------------------------------------------------
    */

    async employees() {

        const { data } = await axios.get(

            `https://pharmaflow-api-1.1.0-beta-main.test/api/employees`

        );

        return data;

    }

};

export default SalaryService;