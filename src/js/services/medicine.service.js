import axios from 'axios';

import MedicineUnitService
    from '../services/medicineUnit.service.js';
const MedicineService = {

    async getAll(filters = {},with_units) {

        const res = await axios.get(

            "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/medicines",

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

            "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/medicines/" + id

        );

        return res.data;

    },

 async save(data) {
        if (data.id) {
            const res = await axios.put(
                "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/medicines/" + data.id,
                data
            );
            return res.data;
        }

        const res = await axios.post(
            "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/medicines",
            data
        );
        return res.data;
    },
    async update(id, data) {

        const res = await axios.put(

            "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/medicines/" + id,

            data

        );

        return res.data;

    },

    async delete(id) {

        return axios.delete(

            "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/medicines/" + id

        );

    },

    async getUnits(medicineId = null) {

        let url = "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/medicine-units";

        if (medicineId) {

            url += "?medicine_id=" + medicineId;

        }

        const res = await axios.get(url);

        const data = res.data;

        if (Array.isArray(data))
            return data;

        if (Array.isArray(data.data))
            return data.data;

        return [];

    }

};

export default MedicineService;