import axios from 'axios';
 
let axiosApi = axios.create({
    baseURL: `http://localhost:3333`
});

export default axiosApi