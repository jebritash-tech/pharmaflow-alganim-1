import axios from 'axios';

import {
    API_BASE
} from '../config.js';

const PricingService = {

    async regenerateCurrent() {

        const { data } = await axios.post(

            `${API_BASE}`+`/price-engine/regenerate-current`

        );

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Rules
    |--------------------------------------------------------------------------
    */

    async loadRules() {

        const { data } = await axios.get(

            `${API_BASE}`+`/price-engine/rules`

        );

        return data.data || data.rules || data;

    },

    async createRule(payload) {

        const { data } = await axios.post(

            `${API_BASE}`+`/price-engine/rules`,

            payload

        );

        return data;

    },

    async updateRule(id, payload) {

        const { data } = await axios.put(

            `${API_BASE}`+`/price-engine/rules/${id}`,

            payload

        );

        return data;

    },

    async deleteRule(id) {

        const { data } = await axios.delete(

            `${API_BASE}`+`/price-engine/rules/${id}`

        );

        return data;

    },

    async toggleRule(id) {

        const { data } = await axios.post(

            `${API_BASE}`+`/price-engine/rules/${id}/toggle`

        );

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Simulation
    |--------------------------------------------------------------------------
    */

    async simulate(payload) {

        const { data } = await axios.post(

            `${API_BASE}`+`/price-engine/simulate`,

            payload

        );

        return data.result || data;

    },

    /*
    |--------------------------------------------------------------------------
    | Medicines
    |--------------------------------------------------------------------------
    */

    async loadMedicines() {

        const { data } = await axios.get(

            `${API_BASE}`+`/medicines`

        );

        return data.data || data;

    },

    async assignRule(
        medicineId,
        pricingRuleId
    ) {

        const { data } = await axios.patch(

            `${API_BASE}`+`/medicines/${medicineId}/pricing-rule`,

            {
                pricing_rule_id:
                    pricingRuleId
                        ? Number(pricingRuleId)
                        : null
            }

        );

        return data;

    }

};

export default PricingService;