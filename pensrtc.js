/**
 * Created by Agung on 6/2/2017.
 FILE INI BERFUNGSI UNTUK MENERAPKAN PERUBAHAN PADA HALAMAN BIMBINGAN 
 FILE INI AKAN MERUBAH HALAMAN 222.124.212.175 DAN MENAMBAHKAN MENU BIMBINGAN. 
 JIKA DI KLIK MAKA AKAN MELAKUKAN REQUEST KE FILE BACKGROUND.JS UNTUK MEMBUKA FILE WINDOW.HTML
 */

$("#logout-button").remove();
var urlLocation = window.location.href.split('/');
var chromeId = chrome.runtime.id;
var host = '222.124.212.175';
var port = 8443;
var socket = io.connect('http://'+host+':'+port);

if(urlLocation[3]=='dosen' || urlLocation[3]=='dosen#'){
    //melakukan request token untuk mengambil tokenya sendiri sebagai dosen dan dilempar ke window.js
    socket.emit('request token', {as:"dosen"});
    socket.on('token',function(token){
        $("#main-menu").append('' +
            '<li id="open-bimbingan-button" onclick="chrome.runtime.sendMessage(\''+chromeId+'\', {from:\'dosen\',token:\''+token+'\'});">' +
                '<a href="#"><i class="icon-camera"></i><span>Bimbingan Online</span></a>' +
            '</li>' +
            '<li id="logout-button">' +
                '<a href="/logout"><i class="icon-lock"></i><span>Keluar</span></a>' +
            '</li>'
        );
    });
}else if(urlLocation[3]=='mahasiswa' || urlLocation[3]=='mahasiswa#'){
    //melakukan request token untuk mengambil tokenya sendiri sebagai mahasiswa dan mengambil token dosen 1 dan dosen 2 dan dilempar ke window.js
    socket.emit('request token', {as:"mahasiswa"});
    socket.on('token and list dosen',function(data){
        $("#main-menu").append('' +
            '<li class="dropdown">'+
                '<a href="javascript:;" class="dropdown-toggle" data-toggle="dropdown"><i class="icon-camera"></i><span>Bimbingan Online</span></a>'+
                '<ul class="dropdown-menu">'+
                    '<li onclick="chrome.runtime.sendMessage(\''+chromeId+'\', {from:\'mahasiswa\',to:\''+data.dosen1+'\',token:\''+data.token+'\'});"><a href="#">Dosen Pembimbing 1</a></li>'+
                    '<li onclick="chrome.runtime.sendMessage(\''+chromeId+'\', {from:\'mahasiswa\',to:\''+data.dosen2+'\',token:\''+data.token+'\'});"><a href="#">Dosen Pembimbing 2</a></li>'+
                '</ul>'+
            '</li>'+
            '<li id="logout-button">' +
                '<a href="/logout"><i class="icon-lock"></i><span>Keluar</span></a>' +
            '</li>'
        );
    });
}