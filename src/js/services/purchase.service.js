import axios from 'axios';

const PurchaseService = {

    async save(payload) {

        const res = await axios.post(

            "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/purchases",

            payload

        );

        return res.data;

    },

    async getAll(filters = {}) {

        const res = await axios.get(

            "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/purchases",

            {

                params: filters

            }

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

            "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/purchases/" + id

        );

        return res.data;

    }

};

export default PurchaseService;