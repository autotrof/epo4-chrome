/**
 * Created by Agung on 6/2/2017.
 */

$("#logout-button").remove();
var urlLocation = window.location.href.split('/');
var chromeId = chrome.runtime.id;
var host = '222.124.212.175';
var port = 8443;


if(urlLocation[3]=='dosen' || urlLocation[3]=='dosen#'){
    $("#main-menu").append('' +
        '<li id="open-bimbingan-button" onclick="chrome.runtime.sendMessage(\''+chromeId+'\', {from:\'dosen\'});">' +
        '<a href="#"><i class="icon-camera"></i><span>Bimbingan Online</span></a>' +
        '</li>' +
        '<li id="logout-button">' +
        '<a href="/logout"><i class="icon-lock"></i><span>Keluar</span></a>' +
        '</li>'
    );
}else{
    var socket = io.connect('http://'+host+':'+port);
    $("#main-menu").append('' +
        '<li class="dropdown">'+
            '<a href="javascript:;" class="dropdown-toggle" data-toggle="dropdown"><i class="icon-camera"></i><span>Bimbingan Online</span></a>'+
            '<ul class="dropdown-menu">'+
                '<li onclick="chrome.runtime.sendMessage(\''+chromeId+'\', {from:\'mahasiswa\',to:1});"><a href="javascript:;">Dosen Pembimbing 1</a></li>'+
                '<li onclick="chrome.runtime.sendMessage(\''+chromeId+'\', {from:\'mahasiswa\',to:2});"><a href="javascript:;">Dosen Pembimbing 2</a></li>'+
            '</ul>'+
        '</li>'+
        '<li id="logout-button">' +
            '<a href="/logout"><i class="icon-lock"></i><span>Keluar</span></a>' +
        '</li>'
    );
}