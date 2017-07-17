/**
 * Created by Agung on 6/3/2017.
 */
moment.locale('id');
var parameters = getUrlVars();
// const host = '192.168.43.150';
// const port = 8080;
const host = '222.124.212.175';
const port = 8443;
var stackstream;
var token = parameters['token'];
var initializer = false;
var uploader;
var peerConnectionHandler = function(conn){
    initializer = true;
}
var peerErrorHandler = function(err){
    switch (err.type){
        case 'browser-incompatible':
            alert("Browser yang anda gunakan tidak mendukung untuk melakukan videocall ataupun sharedesktop");
        break;
        case 'peer-unavailable':
            initializer = true;
        break;
    }
}
var peerCallHandler = function(call){
    call.answer(stackstream);
    call.on('stream', function(stream) {
        $("#video1").prop("src", URL.createObjectURL(stream));
    });
}
var socketMessageHandler = function(data){
    appendChat("self","Anda",data.text,data.time,500,data.type,data.status,data.key,data.progress);
}
var socketOtherMessagehandler = function(data){
    appendChat("other",data.from,data.text,data.time,500,data.type,data.status,data.key,data.progress);
}
var socketStartUploadFileHandler = function(data){
    appendChat(data.from_info,data.from,data.text,data.time,500,data.type,data.status,data.key,data.progress);
}
var socketProgressUploadFileHandler = function(data){
    $("div.message[data-key='"+data.key+"']").data('status',data.status);
    $("div.message[data-key='"+data.key+"'] .progress .progress-bar").attr('style','width : '+data.progress+'%');
    $("div.message[data-key='"+data.key+"'] .progress .progress-bar").attr('aria-valuenow',data.progress);
    $("div.message[data-key='"+data.key+"'] .progress .progress-bar span").text(data.progress+'% Complete');
}
var socketCompleteUploadFileHandler = function(data){
    $("div.message[data-key='"+data.key+"']").data('status',data.status);
    $("div.message[data-key='"+data.key+"']").find('div.progress').remove();
    $("div.message[data-key='"+data.key+"']").find('img').wrap('<a download href="http://'+host+':'+port+'/'+parameters['as']+'/download_file_chat/'+data.file+'"></a>');
}
var olderMessageHandler = function (data) {
    $.each(data,function(key,object){
        var from,type = 'text';
        if((parameters['as']=='mahasiswa' && object.by==0) || (parameters['as']=='dosen' && object.by==1)) from = "self";
        else from = "other";
        var nama;
        if(from=="self") nama = "Anda";
        else nama = parameters['as']=='mahasiswa'?object.mahasiswa.nama:object.dosen.nama;
        if(object.file!=null) type = 'file'; 
        appendChat(from,nama,object.chat,moment(object.created_at).calendar(),null,type,"complete",null,null,object.file);
    });
}
var chatHandler = function(socket,other_token){
    $("#chat-input").prop("disabled",false);
    $("#chat-input").keyup(function (event) {
        if (event.shiftKey && event.keyCode == 13) {
            return true;
        } else if (event.keyCode == 13) {
            socket.emit("message",{text:$(this).val(),to:other_token});
            $(this).val('');
            return false;
        }
    });
}
var chromeDesktopShared = function(other_token, init, peer){
    chrome.desktopCapture.chooseDesktopMedia(
        ["screen","window"],
        function(screedID){
            navigator.webkitGetUserMedia({
                audio:false,
                video:{
                    mandatory:{
                        chromeMediaSource:"desktop",
                        chromeMediaSourceId:screedID
                    }
                }
            },function(stream){
                $("#video2").prop("src", URL.createObjectURL(stream));
                $("#file-transfer-wrapper").css('height',$("#video2").height()+'px');
                if(init==false){
                    stackstream = stream;
                    var call = peer.call(other_token,stream);
                    call.on('stream',function(s){
                        $("#video1").prop("src", URL.createObjectURL(s));
                    });
                }
            },function(e){
                console.log(e);
                console.log("Some kind of error");
            });
        }
    );
}
var setCameraSwitchListener = function(peer,other_token){
    var theStream = null;
    $("#button-switch-camera-2").click(function(){
        if($(this).data('status')=='sharedesktop'){
            if(theStream!=null && theStream!=undefined) theStream.getTracks().forEach(track => track.stop());
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
            if (navigator.getUserMedia) {       
                navigator.getUserMedia({audio:false, video: true}, function(stream){
                    $("#video2").prop("src", URL.createObjectURL(stream));
                    $("#video2")[0].load();
                    var call = peer.call(other_token,stream);
                    call.on('stream',function(s){
                        $("#video1").prop("src", URL.createObjectURL(s));
                    });
                    theStream = stream.getTracks()[0];
                }, function(e){
                    console.log(e);
                });
            }
            $(this).data('status','videocall');
            $("#camera-switch-icon").removeClass("fa-desktop");
            $("#camera-switch-icon").addClass("fa-video-camera");
        }else{
            if(theStream!=null && theStream!=undefined) theStream.stop();
            chrome.desktopCapture.chooseDesktopMedia(
                ["screen","window"],
                function(screedID){
                    navigator.webkitGetUserMedia({
                        audio:false,
                        video:{
                            mandatory:{
                                chromeMediaSource:"desktop",
                                chromeMediaSourceId:screedID
                            }
                        }
                    },function(stream){
                        $("#video2").prop("src", URL.createObjectURL(stream));
                        var call = peer.call(other_token,stream);
                        call.on('stream',function(s){
                            $("#video1").prop("src", URL.createObjectURL(s));
                        });
                        theStream = stream;
                    },function(e){
                        console.log(e);
                        console.log("Some kind of error");
                    });
                }
            );
            $(this).data('status','sharedesktop');
            $("#camera-switch-icon").removeClass("fa-video-camera");
            $("#camera-switch-icon").addClass("fa-desktop");
        }
    });
}
$(document).ready(function(){
    var dosen_token,mahasiswa_token;
    var source1,source2;
    var socket,peer;
    //MAHASISWA
    if(parameters['as']=='mahasiswa'){
        socket = io.connect('http://'+host+':'+port+'/mahasiswa');
        $("#activity_pilih_mahasiswa").remove();
        $("#second-step").removeClass('hide');
        dosen_token = parameters['to'];
        socket.emit("joining room",dosen_token);
        socket.on("joining room response",function(res){
            setJoiningRoomHandler(socket,dosen_token);
        });
    }
    //DOSEN
    else if(parameters['as']=='dosen'){
        $("#first-step").removeClass('hide');
        socket = io.connect('http://'+host+':'+port+'/dosen');
        socket.on("list mahasiswa",function(list_mahasiswa){
            $.each(list_mahasiswa,function(key,obj){
                $("#list-mahasiswa").append("<li data-token='"+obj.token+"'><a href='#'>"+obj.nama+"</a></li>");
            });
        });
        $("#list-mahasiswa").on('click','li',function(){
            $("#first-step").addClass('hide');
            $("#second-step").removeClass('hide');
            mahasiswa_token = $(this).data('token');
            socket.emit('joining room',mahasiswa_token);
        });
        socket.on("joining room response",function(mahasiswa_token){
            setJoiningRoomHandler(socket,mahasiswa_token);
        });
    }
    socket.on("older message",olderMessageHandler);
});

function getUrlVars(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function getCaret(el) {
    if (el.selectionStart) {
        return el.selectionStart;
    } else if (document.selection) {
        el.focus();
        var r = document.selection.createRange();
        if (r == null) {
            return 0;
        }
        var re = el.createTextRange(),
            rc = re.duplicate();
        re.moveToBookmark(r.getBookmark());
        rc.setEndPoint('EndToStart', re);
        return rc.text.length;
    }
    return 0;
}
function appendChat (from,nama,pesan,waktu,durasi,type,status,key,progress,file) {
    var textDisplay;
    var theKey = "";
    var theStatus = "";
    var position = "right";
    var theProgress = "";
    if(from!="self") position = "left";

    if(type!='text'){
        if (file!=undefined && file!=null) {
            textDisplay = '<a download href="http://'+host+':'+port+'/'+parameters['as']+'/download_file_chat/'+file+'"><img src="chat_icon/file.png"></a>';
        }else{
            textDisplay = '<img src="chat_icon/file.png">';
        }
        if(status!="complete"){
            textDisplay+='<div class="progress">'+
                '<div class="progress-bar progress-bar-info progress-bar-striped active" aria-valuenow="0" role="progressbar" aria-valuemin="0" aria-valuemax="100" style="width: 0%">'+
                    '<span class="sr-only">0% Complete</span>'+
                '</div>'+
            '</div>';
        }
        theKey = key;
        theStatus = status;
        theProgress = progress;
    }else{
        textDisplay = pesan.replace(/\n/g, "<br />");
    }

    $("#chat-display").append('' +
        '<div class="message '+position+'" data-key="'+theKey+'" data-status="'+theStatus+'">'+
            '<div class="triangle"></div>'+
            '<div class="message-inner">'+
                '<div class="header-message">'+nama+'</div>'+
                '<div class="message-text">'+
                    textDisplay+
                '</div>'+
                '<div class="message-time">'+
                    '<small>'+waktu+'</small>'+
                '</div>'+
            '</div>'+
        '</div>'
    );
    $("#chat-display").animate({ scrollTop: $("#chat-display")[0].scrollHeight}, durasi!=undefined?durasi:50);
}
function initSocketListener (socket) {
    socket.on('message',socketMessageHandler);
    socket.on('other message',socketOtherMessagehandler);
    socket.on('start upload file chat',socketStartUploadFileHandler);
    socket.on('progress upload file chat',socketProgressUploadFileHandler);
    socket.on('complete upload file chat',socketCompleteUploadFileHandler);
}
function initPeer(token,other_token) {
    peer = new Peer(token,{host:host,port:port,path:'/peer'});
    var conn = peer.connect(other_token);
    peer.on('connection',peerConnectionHandler);
    peer.on('error',peerErrorHandler);
    peer.on('call',peerCallHandler);
    if(conn){
        chromeDesktopShared(other_token,false,peer);
    }else{
        chromeDesktopShared(other_token,true,peer);
    }
    setCameraSwitchListener(peer,other_token);
}
function setJoiningRoomHandler(socket, other_token){
    uploader = new SocketIOFileUpload(socket);
    chatHandler(socket,other_token);
    initSocketListener(socket);
    uploader.listenOnInput(document.getElementById("file-upload"));
    initPeer(token,other_token);
}