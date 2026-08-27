import axios from 'axios';

import {
    API_BASE
} from '../config.js';

const ShiftService = {
    
    async getAll(filters = {}) {

        const res = await axios.get(

            `${API_BASE}`+ "/shifts",

            {

                params: filters

            }

        );

        return res.data;

    },

    async get(id) {

        const res = await axios.get(

            `${API_BASE}`+ "/shifts/" + id

        );

        return res.data;

    },
    async show(id){

        const res = await axios.get(

            `${API_BASE}` + "/shifts/" + id

        );

        return res.data;

    },

};

export default ShiftService;