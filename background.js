/**
 * Created by Agung on 6/2/2017.
 FILE INI BERFUNGSI UNTUK MENERIMA REQUEST DARI BROWSER DAN MEMBUKA WINDOW.HTML
 */

chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        if(request.from=='dosen'){
            chrome.windows.create({url:"window.html?as=dosen&token="+request.token,type:"popup",state:"maximized"},function(newWindow){});
        }else if(request.from=='mahasiswa'){
            chrome.windows.create({url:"window.html?as=mahasiswa&to="+request.to+"&token="+request.token,type:"popup",state:"maximized"},function(newWindow){});
        }
    }
);