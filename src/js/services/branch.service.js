import api from '../api.js';
import axios from 'axios';

const BranchService = {

    async getAll() {

        const res = await axios.get(

            "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/branches"

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

            "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/branches/" + id

        );

        return res.data;

    }

};

export default BranchService;