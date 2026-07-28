import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_URL } from "../config/apiConfig";

class WebSocketService {
    private client: Client | null = null;
    connect(token:string){
        if(this.client?.active)
            return;
        this.client = new Client({
            webSocketFactory:()=>new SockJS(WS_URL),
            connectHeaders:{
                Authorization:`Bearer ${token}`
            },
            reconnectDelay:5000,
            heartbeatIncoming:4000,
            heartbeatOutgoing:4000
        });
        this.client.activate();
    }

    disconnect(){
        this.client?.deactivate();
    }
    getClient(){
        return this.client;
    }
}
export default new WebSocketService();