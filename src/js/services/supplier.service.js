import axios from 'axios';

import {
    API_BASE
} from '../config.js';

const SupplierService = {

    async getAll() {

        const res = await axios.get(

            `${API_BASE}`+ "/suppliers"

        );

        const data = res.data;

        if (Array.isArray(data))
            return data;

        if (Array.isArray(data.data))
            return data.data;

        return [];

    },

    async get(id) {

        const res = await axios.get(

            `${API_BASE}`+ "/suppliers/" + id

        );

        return res.data;

    }

};

export default SupplierService;