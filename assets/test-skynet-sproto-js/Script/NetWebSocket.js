/**
 * Created by Administrator on 2016/12/2.
 */
const PROTOCAL_CORE = require('PROTOCAL_CORE');

var WebSocket = WebSocket || window.WebSocket || window.MozWebSocket;


//arraybuff 转化成 string
function Utf8ArrayToStr(array) {
    var out, i, len, c;
    var char2, char3,char4;

    out = "";
    len = array.length;
    i = 0;
    while(i < len) {
        c = array[i++];
        var pre = (c >> 3);
        if(pre >=0 && pre <= 15){// 0xxxxxxx
            out += String.fromCharCode(c);
        }else if(pre >=24 && pre <= 27){// 110x xxxx   10xx xxxx
            char2 = array[i++];
            out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        }else if(pre >= 28 && pre <= 29){// 1110 xxxx  10xx xxxx  10xx xxxx
            char2 = array[i++];
            char3 = array[i++];
            out += String.fromCharCode(((c & 0x0F) << 12) |
                ((char2 & 0x3F) << 6) |
                ((char3 & 0x3F) << 0));
        }else if(pre == 30){//1111 0xxx  10xx xxxx  10xx xxxx 10xx xxxx
            char2 = array[i++];
            char3 = array[i++];
            char4 = array[i++];
            out += String.fromCodePoint(
                ((c & 0x07) << 15) |
                ((char2 & 0x3F) << 12) |
                ((char3 & 0x3F) << 6) |
                ((char4 & 0x3F) << 0));
        }
    }

    return out;
};
// proxy 绑定this
function proxy(fun,that){
    return function(){
        fun.apply(that,arguments);
    }
}





var NetWebSocket = cc.Class({
    _webSocket:null,
    _isJson:false,

     _server_ip:null,
    _server_port:null,


    _sessionId:0,//记录当前的sessionid
    _sessionIdHandlers:null, // 服务器消息消息函数

     ctor:function () {
        this._isJson = false
        this._sessionId = 0
        this._sessionIdHandlers = {};
    },
    /**
     *  连接websocket
     *
     * @param serverUrl
     * @returns {*}
     */
    prepareWebSocket : function (ip,port) {
        var self = this;
        if (!window.WebSocket) {
            console.log("您的浏览器不支持websocket");
            return false;
        }

        this._server_ip = ip;
        this._server_port = port;
        var serverUrl = "ws://" + ip + ":" + port + "/ws";

        console.log("请求socket连接：serverUrl=" + serverUrl);
        var _webSocket = this._webSocket;
        if (_webSocket) {//对象存在
            if (_webSocket.readyState === WebSocket.OPEN) {//已连接上服务器
                if (serverUrl != this._serverUrl) {//服务器地址不同
                    _webSocket.close();//断开连接
                    _webSocket = new WebSocket(serverUrl);//重新创建连接
                }
            } else {//还没有连接上服务器
                _webSocket = new WebSocket(serverUrl);
            }
        } else {//对象不存在，创建对象
            _webSocket = new WebSocket(serverUrl);
        }
        _webSocket.binaryType = "arraybuffer";
        this._serverUrl = serverUrl;
        this._webSocket = _webSocket;


        //绑定连接成功的回调方法
        _webSocket.onopen = function (event) {
            console.log("连接成功");
            self.send("login",null)
        };
        //绑定消息接收的回调方法
        _webSocket.onmessage = function (event) {
            //var str = JSON.stringify(event["data"]);
            var data = event.data;
            var msg = null;


            //json格式
            if(this._isJson == true) {
                var uint8Array = new Uint8Array(data);
                var newdata = Utf8ArrayToStr(uint8Array);
                var sz = newdata.length;

                if (typeof(newdata) == "string") {
                    msg = JSON.parse(newdata);
                }
            }else {//sproto格式;
                PROTOCAL_CORE.getRecvPackage(data,proxy(self._handleMessage_req,self),proxy(self._handleMessage_rsp,self));
            }
        };
        //绑定断开连接的回调方法
        _webSocket.onclose = function (event) {
            console.log("断开连接" + event)
        };
        //绑定错误发生的回调方法
        _webSocket.onerror = function (event) {
            console.log("错误发生" + event)
        };

        return _webSocket;
    },






    /**
     *  判断当前是否已经连接
     * @param json
     * @returns {boolean}
     */
    isConnect: function(){
        if (this._webSocket && this._webSocket.readyState === WebSocket.OPEN)
        {
            return true;
        }
        return false;
    },








    // 发送数据
    send: function(cmd,param,callback) {
        if(cmd ==null){
            return;
        }

        if (!this._webSocket) { return; }
        if (this._webSocket.readyState === WebSocket.OPEN) {

            this._sessionId += 1;
            this._sessionIdHandlers[`${this._sessionId}`] = callback;


            cc.log("全部消息发送 start => cmd: " + cmd +",param:" +JSON.stringify(param) );
            if(this._isJson == true) {
                if (param == null) param ={};
                param.cmd = cmd;
                var str = JSON.stringify(param);
                this._webSocket.send(str);
            }else{
                var str = PROTOCAL_CORE.getSendPackage(cmd,param,this._sessionId);
                this._webSocket.send(str);
            }

        }else {
            //this.websocket.string = "xin tiao
            //this.scheduleOnce(function () {
            //    this.sendWebSocketBinary(json);
            //}, 1);
        }
    },


    /**
     *
     * 关闭
     */
    close: function() {
        if (!this._webSocket) { return; }
        this._webSocket.close();
        console.log("断开连接")
    },








    /************ private function ******************************************************************************************/

     /**
     *  收到数据
     * @param name
     * @param message
     * @private
     */
    _handleMessage_req:function (name,message) {
        console.log("服务器主动回调：",name, message)
    },
    _handleMessage_rsp:function (sessionId, message) {
        console.log("客户端请求的回调：",sessionId, message)

        const messageHandler = this._sessionIdHandlers[`${sessionId}`];
        if (messageHandler  &&  typeof messageHandler == 'function') {
            messageHandler(message);
        }
        this._sessionIdHandlers[`${sessionId}`] = null;
    },
});