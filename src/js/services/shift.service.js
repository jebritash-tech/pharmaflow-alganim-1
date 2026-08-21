import axios from 'axios';

const ShiftService = {
    
    async getAll(filters = {}) {

        const res = await axios.get(

            "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/shifts",

            {

                params: filters

            }

        );

        return res.data;

    },

    async get(id) {

        const res = await axios.get(

            "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/shifts/" + id

        );

        return res.data;

    },
    async show(id){

        const res = await axios.get(

            "https://pharmaflow-api-1.1.0-beta-main.test/api"  + "/shifts/" + id

        );

        return res.data;

    },

};

export default ShiftService;