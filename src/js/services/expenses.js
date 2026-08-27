
import axios from 'axios';

import {
    API_BASE
} from '../config.js';
const ExpenseService = {

    async getAll(filters = {}) {
        return (
            await axios.get(
                `${API_BASE}` + "/expenses",
                {
                    params: filters
                }
            )
        ).data;
    },

    async show(id) {
        return (
            await axios.get(
                `${API_BASE}` + "/expenses/" + id
            )
        ).data;
    },

    async create(data) {
        return (
            await axios.post(
                `${API_BASE}` + "/expenses",
                data
            )
        ).data;
    }

};

export default ExpenseService;