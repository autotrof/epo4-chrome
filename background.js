/**
 * Created by Agung on 6/2/2017.
 */

chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        if(request.from=='dosen'){
        	console.log(request.token);
            chrome.windows.create({url:"window.html?as=dosen&token="+request.token,state:"maximized"},function(newWindow){});
        }else if(request.from=='mahasiswa'){
            chrome.windows.create({url:"window.html?as=mahasiswa&to="+request.to+"&token="+request.token,state:"maximized"},function(newWindow){});
        }
    }
);