moment.locale('id');
var chatState = "hidden";
var myVideoState = "minimize";
var cameraState = "desktop";
var soundState = "sound";
var chatSectionWidth = "400px";
var parameters = getUrlVars();
var totalSuperCount = 0;
const host = '115.85.70.168';
const port = 8443;
var stackstream,audioStream;
var token = parameters['token'];
var initializer = false;
var uploader;
var socket,peer,audioPeer;
var peerErrorHandler = function(err){
    switch (err.type){
        case 'browser-incompatible':
            alert("Browser yang anda gunakan tidak mendukung untuk melakukan videocall ataupun sharedesktop");
        break;
        case 'peer-unavailable':
            console.log("peer-unavailable");
        break;
    }
}
var peerCallHandler = function(call){
    console.log(call.metadata);
    if (call.metadata=="audio") {
        // call.answer(audioStream);
        // console.log('answer call audio');   
        // call.on('stream',function(stream){
        //     initSound(stream);
        // });
    }else{
        console.log('answer call video');
    //     call.answer(stackstream);
    //     call.on('stream', function(stream) {
    //         $("#other-video").prop("poster","");
    //         $("#other-video").prop("src", URL.createObjectURL(stream));
    //     });
    }
}
var socketMessageHandler = function(data){
    appendChat("self","Anda",data.text,data.time,500,data.type,data.status,data.key,data.progress);
}
var socketOtherMessagehandler = function(data){
    appendChat("other",data.from,data.text,data.time,500,data.type,data.status,data.key,data.progress);
}
var socketStartUploadFileHandler = function(data){
    appendChat(data.from_info,data.from,null,moment(data.time).calendar(),null,"file","start",data.key,null,"Loading123456789012345.xyz");
}
var socketProgressUploadFileHandler = function(data){
    // $("div.message[data-key='"+data.key+"']").data('status',data.status);
    // $("div.message[data-key='"+data.key+"'] .progress .progress-bar").attr('style','width : '+data.progress+'%');
    // $("div.message[data-key='"+data.key+"'] .progress .progress-bar").attr('aria-valuenow',data.progress);
    // $("div.message[data-key='"+data.key+"'] .progress .progress-bar span").text(data.progress+'% Complete');
}
var socketCompleteUploadFileHandler = function(data){
    $(".message[data-key='"+data.key+"'] .file-wrapper a").attr('href','http://'+host+':'+port+'/'+parameters['as']+'/download_file_chat/'+data.file);
    $(".message[data-key='"+data.key+"'] .file-wrapper a.a1 strong").text(data.file.substring(0, 16)+"...");
    $(".message[data-key='"+data.key+"'] .file-wrapper a.a1 img").attr('src','chat_icon/'+getIcon(data.file));
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
var socketStopBimbinganHandler = function(data){
    window.close();
}

$(function(){
	$("#chat-section").css('width',chatSectionWidth);
	$("#chat-section").css('right','-'+chatSectionWidth);
});
	
$(document).ready(function(){
    var dosen_token,mahasiswa_token;
    var source1,source2;
    $("#btn-sound-trigger").css("color","gray");
    $("#btn-chat-trigger").click(function(){
		if (chatState=="hidden") {
			$(this).css('color','white');
			$(this).css('right',chatSectionWidth);
			$("#btn-chat-trigger i").removeClass('fa-comment');
			$("#btn-chat-trigger i").addClass('fa-angle-right');
			$(".btn-side").css("right",chatSectionWidth);
			$("#other-video").css('left','-100px');
			$("#chat-section").css('right','0');
			chatState = "show";
		}else{
			$(this).css('right','0');
			$("#btn-chat-trigger i").removeClass('fa-angle-right');
			$("#btn-chat-trigger i").addClass('fa-comment');
			$(".btn-side").css("right",'0');
			$("#other-video").css('left','0');
			$("#chat-section").css('right','-'+chatSectionWidth);
			chatState = "hidden";
		}
	});
	$("#my-video").click(function(){
		if(myVideoState=="minimize"){
			$(this).css({"width":"300px","height":"200px"});
			myVideoState = "maximize";
		}else{
			$(this).css({"width":"30px","height":"30px"});
			myVideoState = "minimize";
		}
	});
	$("#btn-stop-trigger").click(function(){
		var _c = confirm("Anda yakin akan mengakhiri sesi ini ?");
		if(_c===true){
			$(this).css('color','red');
            window.close();
		}
	});
    //MAHASISWA
    if(parameters['as']=='mahasiswa'){
    	$(".shadow").remove();
    	$("#modal-select-mahasiswa").remove();
        socket = io.connect('http://'+host+':'+port+'/mahasiswa');
        dosen_token = parameters['to'];
        socket.emit("joining room",dosen_token);
        socket.on("joining room response",function(res){
            setJoiningRoomHandler(socket,dosen_token);
        });
        socket.on("stop bimbingan",socketStopBimbinganHandler);
    }
    //DOSEN
    else if(parameters['as']=='dosen'){
        socket = io.connect('http://'+host+':'+port+'/dosen');
        socket.on("list mahasiswa",function(list_mahasiswa){
            $.each(list_mahasiswa,function(key,obj){
                $("#list-mahasiswa").append("<option value='"+obj.token+"'>"+obj.nama+"</option>");
            });
        });
        socket.on("stop bimbingan",socketStopBimbinganHandler);
        $("#btn-connect").on('click',function(){
        	mahasiswa_token = $("#list-mahasiswa").val();
        	$(".shadow").remove();
        	$("#modal-select-mahasiswa").remove();
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
            var image = getIcon(file);
            var file_text;
            if(file.length>15){
                file_text = file.substring(0, 16)+"...";
            }
            textDisplay = '<div class="file-wrapper"><a class="a1" download href="http://'+host+':'+port+'/'+parameters['as']+'/download_file_chat/'+file+'"><img class="file-icon" src="chat_icon/'+image+'"> <strong class="file-name">'+file_text+'</strong><a href="http://'+host+':'+port+'/'+parameters['as']+'/download_file_chat/'+file+'" download class="download-button a2"><i class="fa fa-download"></i></a></a></div>'
        }else{
            textDisplay = '<img src="chat_icon/file.png">';
        }
        // if(status!="complete"){
        //     textDisplay+='<div class="progress">'+
        //         '<div class="progress-bar progress-bar-info progress-bar-striped active" aria-valuenow="0" role="progressbar" aria-valuemin="0" aria-valuemax="100" style="width: 0%">'+
        //             '<span class="sr-only">0% Complete</span>'+
        //         '</div>'+
        //     '</div>';
        // }
        theKey = key;
        theStatus = status;
        theProgress = progress;
    }else{
        textDisplay = pesan.replace(/\n/g, "<br />");
    }

    $("#body-chat-section").append('' +
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
    $("#body-chat-section").animate({ scrollTop: $("#body-chat-section")[0].scrollHeight}, durasi!=undefined?durasi:50);
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
    peer.on('connection',function(c){
        if(c.peer==other_token){
            console.log(c.peer);
            chromeDesktopShared(other_token,true,peer);
            c.on('open',function(){
                peer.on('call',function(call){
                    call.answer(audioStream);
                    call.on('stream',function(s){
                        initSound(s);
                    });
                });
                // peer.on('error',peerErrorHandler);
                initializer = true;
            });
        }else{
            return false;
        }
    });
    chromeDesktopShared(other_token,false,peer);
    // setCameraSwitchListener(peer,other_token);
}
function setJoiningRoomHandler(socket, other_token){
    uploader = new SocketIOFileUpload(socket);
    chatHandler(socket,other_token);
    initSocketListener(socket);
    uploader.listenOnInput(document.getElementById("file-upload"));
    peer = new Peer(token,{host:host,port:port,path:'/peer'});
    audioPeer = new Peer(token+"audio",{host:host,port:port,path:'/peer'});
    var conn = peer.connect(other_token);
    var audioConn = audioPeer.connect(other_token+"audio");
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
                $("#my-video").prop("poster","");
                $("#my-video").prop("src", URL.createObjectURL(stream));
                stackstream = stream;
                var call = peer.call(other_token,stream);
                call.on('stream',function(s){
                    $("#other-video").prop("poster","");
                    $("#other-video").prop("src", URL.createObjectURL(s));
                });
            },function(e){
                console.log(e);
                console.log("Some kind of error");
            });
        }
    );
    peer.on('connection',function(c){
        peer.on("call",function(call){
            call.answer(stackstream);
            call.on('stream',function(stream2){
                $("#other-video").prop("poster","");
                $("#other-video").prop("src", URL.createObjectURL(stream2));
            });
        });
    });
    audioPeer.on('connection',function(c){
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
        if (navigator.getUserMedia) {       
            navigator.getUserMedia({audio:true, video: false}, function(stream){
                audioStream = stream;
                console.log("CALLING");
                var call = audioPeer.call(other_token+"audio",stream);
                call.on('stream',function(stream2){
                    console.log("THERE IS ANSWER");
                    initSound(stream2);
                });
            }, function(e){
                console.log(e);
            });
            audioPeer.on("call",function(call){
                console.log("THERE IS CALL");
                navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
                if (navigator.getUserMedia) {       
                    navigator.getUserMedia({audio:true, video: false}, function(stream){
                        audioStream = stream;
                        console.log("ANSWERING CALL");
                        call.answer(stream);
                        call.on('stream',function(stream2){
                            initSound(stream2);
                        })
                    }, function(e){
                        console.log(e);
                    });
                }
            });
        }    
    });
    // initPeer(token,other_token);
}
var chromeDesktopShared = function(other_token, init, peer){
    console.log("DESKTOP SHARED");
    /*chrome.desktopCapture.chooseDesktopMedia(
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
            	$("#my-video").prop("poster","");
                $("#my-video").prop("src", URL.createObjectURL(stream));
                if(init==false){
                    stackstream = stream;
                    var call = peer.call(other_token,stream);
                    call.on('stream',function(s){
                    	$("#other-video").prop("poster","");
                        $("#other-video").prop("src", URL.createObjectURL(s));
                    });
                }
            },function(e){
                console.log(e);
                console.log("Some kind of error");
            });
        }
    );*/
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
    if (navigator.getUserMedia) {       
        navigator.getUserMedia({audio:true, video: false}, function(stream){
            audioStream = stream;
            // if(init==false){
                var call = peer.call(other_token,stream,{metadata:"audio"});
                // peer.on('call',peerCallHandler);
                call.on('stream',function(stream2){
                    console.log("THERE IS AUDIO STREAM");
                    //initSound(stream2);
                });
                // call.on('stream',function(s){
                //     initSound(s);
                // });
            // }
        }, function(e){
            console.log(e);
        });
    }
}
var setCameraSwitchListener = function(peer,other_token){
    // var theStream = null;
    $("#btn-camera-trigger").click(function(){
        if(cameraState=="desktop"){
            $(this).css('color','blue');
            $("#btn-camera-trigger i").removeClass("fa-camera");
            $("#btn-camera-trigger i").addClass("fa-desktop");
            if(stackstream!=null && stackstream!=undefined) stackstream.getTracks().forEach(track => track.stop());
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
            if (navigator.getUserMedia) {       
                navigator.getUserMedia({audio:false, video: true}, function(stream){
                    $("#my-video").prop("src", URL.createObjectURL(stream));
                    $("#my-video")[0].load();
                    var call = peer.call(other_token,stream);
                    peer.on('call',peerCallHandler);
                    stackstream = stream.getTracks()[0];
                }, function(e){
                    console.log(e);
                });
            }
            cameraState="camera";
        }else{
            $(this).css('color','white');
            $("#btn-camera-trigger i").removeClass("fa-desktop");
            $("#btn-camera-trigger i").addClass("fa-camera");
            if(stackstream!=null && stackstream!=undefined) stackstream.stop();
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
                        $("#my-video").prop("src", URL.createObjectURL(stream));
                        var call = peer.call(other_token,stream);
                        peer.on('call',peerCallHandler);
                        stackstream = stream;
                    },function(e){
                        console.log(e);
                        console.log("Some kind of error");
                    });
                }
            );
            cameraState="desktop";
        }
    });
}
function initSound (stream) {
    $("#btn-sound-trigger").css("color","white");
    var audioTag = document.getElementById('audio');
    var audioSource = document.getElementById('audioSource');
    audioSource.src = (URL || webkitURL || mozURL).createObjectURL(stream);
    $("#btn-sound-trigger").click(function(){
        if(soundState=="sound"){
            $(this).css('color','red');
            $("#btn-sound-trigger i").removeClass("fa-microphone");
            $("#btn-sound-trigger i").addClass("fa-microphone-slash");
            audioTag.muted = true;
            soundState="mute";
        }else{
            $(this).css('color','white');
            $("#btn-sound-trigger i").removeClass("fa-microphone-slash");
            $("#btn-sound-trigger i").addClass("fa-microphone");
            audioTag.muted = false;
            soundState="sound";
        }
    });
    audioTag.load();
    audioTag.play();
}
function getIcon (file) {
    var extension = file.split('.').pop();
    var image = 'file.png';
    if(extension=='zip'||extension=='rar'||extension=='iso'||extension=='7zip'||extension=='gz'||extension=='tar'){
        image = 'archive.svg';
    }else if(extension=='mp3'||extension=='ogg'){
        image='audio.png';
    }else if(extension=='csv'){
        image = 'csv.png';
    }else if (extension=='xlsx'||extension=='xls'||extension=='et') {
        image = 'excel.png';
    }else if(extension=='png'||extension=='jpeg'||extension=='jpg'||extension=='gif'||extension=='bmp'||extension=='svg'){
        image = 'image.svg';
    }else if(extension=='pptx'||extension=='ppt'||extension=='dps'){
        image = 'ppt.png';
    }else if(extension=='mp4'||extension=='mov'||extension=='avi'||extension=='3gp'||extension=='f4v'||extension=='wmv'||extension=='mkv'||extension=='webm'||extension=='asf'){
        image = 'video.png';
    }else if(extension=='doc'||extension=='docx'||extension=='wps'){
        image = 'word.png';
    }else if(extension=='pdf'){
        image = 'pdf.png';
    }else if(extension=='exe'||extension=='run'){
        image = 'execute.png';
    }
    return image;
}