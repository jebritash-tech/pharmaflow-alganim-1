import axios from 'axios';

import {
    API_BASE
} from '../config.js';

const MedicineUnitService={

    async all(id){
        
        const res=
        
        await axios.get(
        
        `${API_BASE}`+
        
        "/medicines/"+
        
        id+
        
        "/units"
        
        );
        
        return res.data;
    
    },
    
    async create(data){
    
        return axios.post(
        
        `${API_BASE}`+
        
        "/medicine-units",
        
        data
        
        );
        
    },
    
    async update(id,data){
    
        return axios.put(
        
        `${API_BASE}`+
        
        "/medicine-units/"+id,
        
        data
        
        );
    
    },
    
    async delete(id){
        
        return axios.delete(
        
        `${API_BASE}`+
        
        "/medicine-units/"+id
        
        );
        
        }
    
    };

    export default MedicineUnitService;