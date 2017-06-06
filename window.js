/**
 * Created by Agung on 6/3/2017.
 */
var parameters = getUrlVars();
const host = '192.168.43.150';
const port = 8080;
var socket = io.connect('http://'+host+':'+port+'/dosen');

$(document).ready(function(){
    if(parameters['as']=='mahasiswa'){
        var peer = new Peer(parameters['my_token'],{host:host,port:port,path:'/peer'});
        var conn = peer.connect(parameters['dosen_token']);
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
                    var call = peer.call(parameters['dosen_token'],stream);
                    stream.onended = function(){
                        console.log("video recording session stoped");
                    }
                },function(){
                    console.log("Some kind of error");
                });
            }
        );
    }else if(parameters['as']=='dosen'){
        var peer;
        socket.on("list mahasiswa",function(list_mahasiswa){
            $.each(list_mahasiswa,function(key,obj){
                $("#list_mahasiswa").append("<option value='"+obj.token+"'>"+obj.nama+"</option>");
            });
            $("#list_mahasiswa").select2({
                placeholder: 'Pilih Mahasiswa',
                allowClear: true
            }).trigger('change');
        });

        $("#btn_start").click(function(){
            socket.emit("open bimbingan",$("#list_mahasiswa").val);
            $("#activity_pilih_mahasiswa").remove();
        });

        socket.on("token peer",function(token){
            console.log(token);
            peer = new Peer(token,{host:host,port:port,path:'/peer'});
            peer.on('open',function(id){
                console.log(id);
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
                        // var call = peer.call(parameters['dosen_token'],stream);
                        // stream.onended = function(){
                        //     console.log("video recording session stoped");
                        // }
                    },function(){
                        console.log("Some kind of error");
                    });
                }
            );
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