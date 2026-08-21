
import axios from 'axios';

const ExpenseService = {

    async getAll(filters = {}) {
        return (
            await axios.get(
                "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/expenses",
                {
                    params: filters
                }
            )
        ).data;
    },

    async show(id) {
        return (
            await axios.get(
                "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/expenses/" + id
            )
        ).data;
    },

    async create(data) {
        return (
            await axios.post(
                "https://pharmaflow-api-1.1.0-beta-main.test/api" + "/expenses",
                data
            )
        ).data;
    }

};

export default ExpenseService;