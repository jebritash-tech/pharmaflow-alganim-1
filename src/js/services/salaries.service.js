import axios from 'axios';

import {
    API_BASE
} from '../config.js';

const SalaryService = {

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    async dashboard() {

        const { data } = await axios.get(

            `${API_BASE}`+`/salaries/dashboard`

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

            `${API_BASE}`+`/salaries`,

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

            `${API_BASE}`+`/salaries/generate`,

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

            `${API_BASE}`+`/salaries`,

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

            `${API_BASE}`+`/salaries/${id}`,

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

            `${API_BASE}`+`salaries/${id}`

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

            `${API_BASE}`+`/salaries/${id}/pay`,

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

            `${API_BASE}`+`/salaries/${id}`

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

            `${API_BASE}`+`/employees`

        );

        return data;

    }

};

export default SalaryService;