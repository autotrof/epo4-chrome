/**
 * Created by Agung on 6/3/2017.
 */
var parameters = getUrlVars();
// const host = '192.168.43.150';
// const port = 8080;
const host = '222.124.212.175';
const port = 8443;

$(document).ready(function(){
    var dosen_token;
    var source1,source2;
    if(parameters['as']=='mahasiswa'){
        var stackstream;
        var socket = io.connect('http://'+host+':'+port+'/mahasiswa');
        console.log("to : "+parameters['to']);
        socket.emit("request token",parameters['to']);
        $("#activity_pilih_mahasiswa").remove();
        socket.on("response token",function(data){
            $("#second-step").removeClass('hide');
            var peer = new Peer(data.own_token,{host:host,port:port,path:'/peer'});
            var conn = peer.connect(data.dosen_token);
            dosen_token = data.dosen_token;
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
                        source2 = URL.createObjectURL(stream);
                        var call = peer.call(dosen_token,stream);
                        call.on('stream',function(s){
                            source1 = URL.createObjectURL(s);
                            $("#video1").prop("src", URL.createObjectURL(s));
                        });
                        stream.onended = function(){
                            console.log("video recording session stoped");
                        }
                    },function(){
                        console.log("Some kind of error");
                    });
                }
            );
        });
    }else if(parameters['as']=='dosen'){
        $("#first-step").removeClass('hide');
        $("#list-mahasiswa").on('click','li',function(){
            socket.emit('open bimbingan',[$(this).data('token')]);
        });
        var socket = io.connect('http://'+host+':'+port+'/dosen');
        var stackstream;
        var peer;
        socket.on("list mahasiswa",function(list_mahasiswa){
            $.each(list_mahasiswa,function(key,obj){
                $("#list-mahasiswa").append("<li data-token='"+obj.token+"'><a href='#'>"+obj.nama+"</a></li>");
            });
        });

        socket.on("token peer",function(token){
            $("#first-step").addClass('hide');
            $("#second-step").removeClass('hide');
            console.log(token);
            peer = new Peer(token,{host:host,port:port,path:'/peer'});
            peer.on('open',function(id){
                console.log("Peer open with id : "+id);
            });
            peer.on('connection',function(conn){
                console.log("There is connection");
            });
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
                        stackstream = stream;
                        $("#video2").prop("src", URL.createObjectURL(stream));
                    },function(){
                        console.log("Some kind of error");
                    });
                }
            );
            peer.on('call', function(call) {
                console.log("There is call");
                call.answer(stackstream);
                call.on('stream', function(stream) {
                    $("#video1").prop("src", URL.createObjectURL(stream));
                });
            });
        });
    }
    $(".btn-switch-source").click(function(){
        var s1 = $("#video1").prop("src");
        var s2 = $("#video2").prop("src");
        $("#video1").prop("src", s2);
        $("#video1")[0].load();
        $("#video2").prop("src", s1);
        $("#video2")[0].load();
    });
    $("#button-switch-camera-1").click(function(){
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
        if (navigator.getUserMedia) {       
            navigator.getUserMedia({video: true}, function(stream){
                $("#video1").prop("src", URL.createObjectURL(stream));
            }, function(e){
                console.log(e);
            });
        }
    });
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