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
var peerConnectionHandler = function(conn){
    console.log("There is connection, im the initializer");
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
    appendChat("self","Anda",data.text,data.time,500);
    /*$("#chat-display").append('' +
        '<div class="message right">'+
            '<div class="triangle"></div>'+
            '<div class="message-inner">'+
                '<div class="header-message">Anda</div>'+
                '<div class="message-text">'+
                    data.text.replace(/\n/g, "<br />")+
                '</div>'+
                '<div class="message-time">'+
                    '<small>'+data.time+'</small>'+
                '</div>'+
            '</div>'+
        '</div>'
    );
    $("#chat-display").animate({ scrollTop: $("#chat-display")[0].scrollHeight}, 500);*/
}
var socketOtherMessagehandler = function(data){
    appendChat("other",data.from,data.text,data.time,500);
    /*$("#chat-display").append('' +
        '<div class="message left">'+
            '<div class="triangle"></div>'+
            '<div class="message-inner">'+
                '<div class="header-message">'+data.from+'</div>'+
                '<div class="message-text">'+
                data.text.replace(/\n/g, "<br />")+
                '</div>'+
                '<div class="message-time">'+
                    '<small>'+data.time+'</small>'+
                '</div>'+
            '</div>'+
        '</div>'
    );
    $("#chat-display").animate({ scrollTop: $("#chat-display")[0].scrollHeight}, 500);*/
}
var olderMessageHandler = function (data) {
    $.each(data,function(key,object){
        var from;
        if((parameters['as']=='mahasiswa' && object.by==0) || (parameters['as']=='dosen' && object.by==1)) from = "self";
        else from = "other";
        var nama;
        if(from=="self") nama = "Anda";
        else nama = parameters['as']=='mahasiswa'?object.mahasiswa.nama:object.dosen.nama;
        appendChat(from,nama,object.chat,moment(object.created_at).calendar());
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
var cameraSwitch = function(peer,other_token){
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
            socket.on('message',socketMessageHandler);
            socket.on('other message',socketOtherMessagehandler);
            chatHandler(socket,dosen_token);
            peer = new Peer(token,{host:host,port:port,path:'/peer'});
            var conn = peer.connect(dosen_token);
            peer.on('connection',peerConnectionHandler);
            peer.on('error',peerErrorHandler);
            peer.on('call',peerCallHandler);
            if(conn){
                chromeDesktopShared(dosen_token,false,peer);
            }else{
                chromeDesktopShared(dosen_token,true,peer);
            }
            cameraSwitch(peer,dosen_token);
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
            chatHandler(socket,mahasiswa_token);
            socket.on('message',socketMessageHandler);
            socket.on('other message',socketOtherMessagehandler);
            peer = new Peer(token,{host:host,port:port,path:'/peer'});
            var conn = peer.connect(mahasiswa_token);
            peer.on('connection',peerConnectionHandler);
            peer.on('error',peerErrorHandler);
            peer.on('call',peerCallHandler);
            if(conn){
                chromeDesktopShared(mahasiswa_token,false,peer);
            }else{
                chromeDesktopShared(mahasiswa_token,true,peer);
            }
            cameraSwitch(peer,mahasiswa_token);
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
function appendChat (from,nama,pesan,waktu,durasi) {
    var position = "right";
    if(from!="self") position = "left"; 
    $("#chat-display").append('' +
        '<div class="message '+position+'">'+
            '<div class="triangle"></div>'+
            '<div class="message-inner">'+
                '<div class="header-message">'+nama+'</div>'+
                '<div class="message-text">'+
                    pesan.replace(/\n/g, "<br />")+
                '</div>'+
                '<div class="message-time">'+
                    '<small>'+waktu+'</small>'+
                '</div>'+
            '</div>'+
        '</div>'
    );
    $("#chat-display").animate({ scrollTop: $("#chat-display")[0].scrollHeight}, durasi!=undefined?durasi:50);
}