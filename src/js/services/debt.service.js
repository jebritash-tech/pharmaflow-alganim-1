import axios from 'axios';

const DebtService = {

    async getAll(filters={}){

        return(
        
        await axios.get(
        
            "https://pharmaflow-api-1.1.0-beta-main.test/api"+"/debts",
        
        {
        
        params:filters
        
        }
        
        )
        
        ).data;
        
        },
        
        async show(id){
        
        return(
        
        await axios.get(
        
            "https://pharmaflow-api-1.1.0-beta-main.test/api"+"/debts/"+id
        
        )
        
        ).data;
        
        },
        
        async pay(id,amount){
        
        return(
        
        await axios.post(
        
            "https://pharmaflow-api-1.1.0-beta-main.test/api"+"/debts/"+id+"/payment",
        
        {
        
        amount
        
        }
        
        )
        
        ).data;
        
        },
        async create(data) {
            return await axios.post("https://pharmaflow-api-1.1.0-beta-main.test/api/debts", data);
        }

};

export default DebtService;