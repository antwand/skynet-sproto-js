
//引入 PROTOCAL_CORE 核心类 
var PROTOCAL_CORE = require('PROTOCAL_CORE');


cc.Class({
    extends: cc.Component,

    properties: {
        label: {
            default: null,
            type: cc.Label
        },
    },

    // use this for initialization
    onLoad: function () {
        var self = this
        //加载 js的spb文件 
        this.label.string = "加载js的sproto协议文件... 开始  ";
        var newpath = "SPROTO/sproto";//路径在resource/SPROTO/sproto.spb
        PROTOCAL_CORE.loadSproto(newpath,function(data){
            console.log(" 加载spb文件成功！！ ")
             self.label.string = "加载js的spb协议文件 成功！ ";
        });


        //启动websocket 
        var cla = require('NetWebSocket')
        var currentNet = new cla();
        currentNet.prepareWebSocket("192.168.103.98","8303");
        this._currentNet = currentNet;
    },

    // called every frame
    update: function (dt) {

    },




    //发送数据 
    send:function(){
        var param = {
            platform: 'mocha',
            game: 'test',
            token: '123456',
        }; 
        this._currentNet.send("login",param,function(data){
            console.log(data)
        })
    }
});
