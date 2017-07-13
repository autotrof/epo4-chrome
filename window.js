/**
 * Created by Agung on 6/3/2017.
 */
var parameters = getUrlVars();
// const host = '192.168.43.150';
// const port = 8080;
const host = '222.124.212.175';
const port = 8443;
var peer;
var token = parameters['token'];

$(document).ready(function(){
    var dosen_token,mahasiswa_token;
    var source1,source2;
    var stackstream;
    var socket;
    //MAHASISWA
    if(parameters['as']=='mahasiswa'){
        socket = io.connect('http://'+host+':'+port+'/mahasiswa');
        peer = new Peer(token,{host:host,port:port,path:'/peer'});
        peer.on('open',function(id){
            console.log("Peer open with id : "+id);
        });
        peer.on('connection',function(conn){
            console.log("There is connection");
        });
        // socket.emit("request token",parameters['to']);
        $("#activity_pilih_mahasiswa").remove();
        // socket.on("response token",function(data){
        $("#second-step").removeClass('hide');
        var conn = peer.connect(parameters['to']);
        dosen_token = parameters['to'];
        chrome.desktopCapture.chooseDesktopMedia(
            ["screen","window"],
            function(screedID){
                navigator.webkitGetUserMedia({
                    audio:true,
                    video:{
                        mandatory:{
                            chromeMediaSource:"desktop",
                            chromeMediaSourceId:screedID
                        }
                    }
                },function(stream){
                    $("#video2").prop("src", URL.createObjectURL(stream));
                    source2 = URL.createObjectURL(stream);
                    var call = peer.call(dosen_token,stream);
                    call.on('stream',function(s){
                        source1 = URL.createObjectURL(s);
                        $("#video1").prop("src", URL.createObjectURL(s));
                    });
                },function(e){
                    console.log(e);
                    console.log("Some kind of error");
                });
            }
        );
            
        socket.on('message',function(m){
            $("#chat-display").append('' +
                '<div class="message right">'+
                    '<div class="triangle"></div>'+
                    '<div class="message-inner">'+
                        '<div class="header-message">Nama Dosen</div>'+
                        '<div class="message-text">'+
                            m.text+
                        '</div>'+
                        '<div class="message-time">'+
                            '<small>10:00</small>'+
                        '</div>'+
                    '</div>'+
                '</div>'
            );
        });
        socket.on('other message',function(m){
            $("#chat-display").append('' +
                '<div class="message left">'+
                    '<div class="triangle"></div>'+
                    '<div class="message-inner">'+
                        '<div class="header-message">Nama Dosen</div>'+
                        '<div class="message-text">'+
                        m.text+
                        '</div>'+
                        '<div class="message-time">'+
                            '<small>10:00</small>'+
                        '</div>'+
                    '</div>'+
                '</div>'
            );
        });
        /*navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
        if (navigator.getUserMedia) {       
            navigator.getUserMedia({audio:true, video: true}, function(stream){
                $("#video2").prop("src", URL.createObjectURL(stream));
                $("#video2")[0].load();
                call = peer.call(dosen_token,stream);
                call.on('stream',function(s){
                    console.log("IN STREAM");
                    source1 = URL.createObjectURL(s);
                    $("#video1").prop("src", URL.createObjectURL(s));
                });
            }, function(e){
                console.log(e);
            });
        }*/
        $("#chat-input").keydown(function (e) {
            if (e.keyCode === 13 && e.ctrlKey) {
                $(this).val(function(i,val){
                    return val + "\n";
                });
            }
        }).keypress(function(e){
            if (e.keyCode === 13 && !e.ctrlKey) {
                socket.emit("message",{text:$(this).val(),to:dosen_token});
                $(this).val('');
                return false;  
            } 
        });
    }
    //DOSEN
    else if(parameters['as']=='dosen'){
        $("#first-step").removeClass('hide');
        var socket = io.connect('http://'+host+':'+port+'/dosen');
        peer = new Peer(token,{host:host,port:port,path:'/peer'});
        peer.on('open',function(id){
            console.log("Peer open with id : "+id);
        });
        peer.on('connection',function(conn){
            console.log(conn);
            console.log("There is connection");
        });
        peer.on('call',function(call){
            console.log("there is call");
            call.answer(stackstream);
            call.on('stream', function(stream) {
                console.log("there is stream");
                $("#video1").prop("src", URL.createObjectURL(stream));
            });
        });
        socket.on("list mahasiswa",function(list_mahasiswa){
            $.each(list_mahasiswa,function(key,obj){
                $("#list-mahasiswa").append("<li data-token='"+obj.token+"'><a href='#'>"+obj.nama+"</a></li>");
            });
        });
        socket.on('message',function(m){
            $("#chat-display").append('' +
                '<div class="message right">'+
                    '<div class="triangle"></div>'+
                    '<div class="message-inner">'+
                        '<div class="header-message">Nama Dosen</div>'+
                        '<div class="message-text">'+
                            m.text+
                        '</div>'+
                        '<div class="message-time">'+
                            '<small>10:00</small>'+
                        '</div>'+
                    '</div>'+
                '</div>'
            );
        });
        socket.on('other message',function(m){
            $("#chat-display").append('' +
                '<div class="message left">'+
                    '<div class="triangle"></div>'+
                    '<div class="message-inner">'+
                        '<div class="header-message">Nama Dosen</div>'+
                        '<div class="message-text">'+
                        m.text+
                        '</div>'+
                        '<div class="message-time">'+
                            '<small>10:00</small>'+
                        '</div>'+
                    '</div>'+
                '</div>'
            );
        });

        $("#list-mahasiswa").on('click','li',function(){
            $("#first-step").addClass('hide');
            $("#second-step").removeClass('hide');
            mahasiswa_token = $(this).data('token');
            chrome.desktopCapture.chooseDesktopMedia(
                ["screen","window"],
                function(screedID){
                    navigator.webkitGetUserMedia({
                        video:{
                            mandatory:{
                                chromeMediaSource:"desktop",
                                chromeMediaSourceId:screedID
                            }
                        }
                    },function(stream){
                        stackstream = stream;
                        $("#video2").prop("src", URL.createObjectURL(stream));
                    },function(e){
                        console.log(e);
                        console.log("Some kind of error");
                    });
                }
            );
        });

        $("#chat-input").keydown(function (e) {
            if (e.keyCode === 13 && e.ctrlKey) {
                $(this).val(function(i,val){
                    return val + "\n";
                });
            }
        }).keypress(function(e){
            if (e.keyCode === 13 && !e.ctrlKey) {
                socket.emit("message",{text:$(this).val(),to:mahasiswa_token});
                $(this).val('');
                return false;  
            } 
        });
    }
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