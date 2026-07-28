import { API_URL } from '../config/apiConfig';

export async function uploadMedia(file:File){
    const token=localStorage.getItem("chat_token");
    const formData=new FormData();
    formData.append("file",file);
    const response=await fetch(`${API_URL}/api/media/upload`,{
        method:"POST",
        headers:{
            Authorization:`Bearer ${token}`
        },
        body:formData
    });
    if(!response.ok){
        throw new Error("Upload failed");
    }
    return await response.json();
}