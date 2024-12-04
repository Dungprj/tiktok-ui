import axios from '~/utils/customize-axios';

const fetchAllUser = page => {
    return axios.get(`/api/User/GetUsers?page=${page}`);
};

const postCreateUser = (name, job) => {
    return axios.post(`/api/users`, { name, job });
};

const putUpdateUser = (id, name, job) => {
    return axios.put(`/api/users/${id}`, { name, job });
};

const DeleteUser = id => {
    return axios.delete(`/api/users/${id}`);
};

const LoginApi = (email, password) => {
    return axios.post('/api/Account/SignIn', { email: email, password });
};

const GetVideos = () => {
    return axios.get('/api/Videos');
};

const search = async (q, type = 'less') => {
    return axios.get('/api/User/Search', {
        params: {
            q,
            type
        }
    });
};

const Upload = async formData => {
    // Gửi yêu cầu POST với FormData
    const response = await axios.post('/api/Videos/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data' // Quan trọng để gửi file
        }
    });

    return response; // Trả về kết quả sau khi upload thành công
};

export {
    fetchAllUser,
    postCreateUser,
    putUpdateUser,
    DeleteUser,
    LoginApi,
    search,
    GetVideos,
    Upload
};
