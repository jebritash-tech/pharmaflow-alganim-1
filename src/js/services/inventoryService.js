import axios from 'axios';

import {
    API_BASE
} from '../config.js';
const InventoryService = {

    async getAll(filters = {}) {
        return (
            await axios.get(
                `${API_BASE}` + "/inventories",
                {
                    params: filters
                }
            )
        ).data;
    },

    async adjust(payload) {
        return (
            await axios.post(
                `${API_BASE}` + "/inventories/adjust",
                payload
            )
        ).data;
    }

};

export default InventoryService;