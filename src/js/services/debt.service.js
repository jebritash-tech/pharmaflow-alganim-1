import axios from 'axios';

import {
    API_BASE
} from '../config.js';
const DebtService = {

    async getAll(filters = {}) {

        const response = await axios.get(
             `${API_BASE}` +'/debts',
            {
                params: filters
            }
        );

        return response.data;
    },


    async show(id) {

        const response = await axios.get(
             `${API_BASE}` +'/debts/' + id
        );

        return response.data;
    },


    async pay(id, amount) {

        const response = await axios.post(
            `${API_BASE}`+'/debts/' + id + '/payment',
            {
                amount: amount
            }
        );

        return response.data;
    },


    async create(data) {

        const response = await axios.post(
            `${API_BASE}` + '/debts',
            data
        );

        return response.data;
    }

};


export default DebtService;