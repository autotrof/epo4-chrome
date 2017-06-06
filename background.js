/**
 * Created by Agung on 6/2/2017.
 */
// var socket = io.connect('http://192.168.43.150:8080/chrome');

// socket.on('mahasiswa request bimbingan',function(data){
//     chrome.windows.create({url:"window.html?as=mahasiswa&dosen_token="+data.dosen_token+"&my_token="+data.my_token,state:"maximized"},function(newWindow){});
// });
// socket.on('dosen open bimbingan',function(data){
//
// });
// socket.on('open bimbingan window',function(data){
//     console.log("SOME THING HAPPEN");
//
// });

chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        if(request.from=='dosen'){
            chrome.windows.create({url:"window.html?as=dosen",state:"maximized"},function(newWindow){});
        }
    });