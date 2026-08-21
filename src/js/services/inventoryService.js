import axios from 'axios';

const InventoryService = {

    async getAll(filters = {}) {
        return (
            await axios.get(
                "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/inventories",
                {
                    params: filters
                }
            )
        ).data;
    },

    async adjust(payload) {
        return (
            await axios.post(
                "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/inventories/adjust",
                payload
            )
        ).data;
    }

};

export default InventoryService;