var queued = 0;
var checked = 0;
var invalid = 0;
var warning = 0;
var redirected = 0;
var passed = 0;
chrome.extension.onMessage.addListener(

  function doStuff(request, sender) {

  if(request.action == "initial"){
    var rpBox;
    var blacklist = request.options.blacklist;
    blacklist = blacklist.split("\n");
    var protocols = request.options.protocols;
    protocols = protocols.split("\n");
    var cacheType = request.options.cache;
    var checkType = request.options.checkType;
    var optURL = request.options.optionsURL;

    // Inject Styles and Elements for feedback report
    createDisplay(optURL,cacheType,checkType);
      // Gather links
    var pageLinks = document.getElementsByTagName('a');
        
    log(pageLinks);
    var totalvalid = pageLinks.length;
    
    for (var i = 0; i < pageLinks.length; i++){
      var link = pageLinks[i];
      var isValidLink = false;
      isValidLink = isLinkValid(link,request,blacklist,protocols);
      if(isValidLink === true){
        queued += 1;
        link.classList.add("CMY_Link");
        checkURL(link, request.options);
      }
      else{
        totalvalid -= 1;
      }
    }
    rbAmt.innerHTML = "Links: " + totalvalid;
    // When close element is clicked, hide UI
    document.getElementById("CMY_RB_Close").onclick = function(){removeDOMElement("CMY_ReportBox");};
    document.getElementById("CMY_RB_Export").onclick = function(){
    var output = "URL,OuterHTML,PageScanned,LinkType\n";
    
    var badLinks = document.getElementsByClassName("CMY_Invalid");
    if(badLinks.length > 0){
      for (i = 0; i < badLinks.length; i++) {
        var outerHTML;
        outerHTML = badLinks[i].outerHTML.replace(/"/g, '""');

        output += "\"" + badLinks[i].href + "\",";
        output += "\"" + outerHTML + "\",";
        output += "\"" + window.location.href + "\",";
        output += "\"CMY_Invalid\"";
        output += "\n";
      }
    }

    var validLinks = document.getElementsByClassName("CMY_Valid");
    if (validLinks.length > 0) {
      for (i = 0; i < validLinks.length; i++) {
        var outerHTML;
        outerHTML = validLinks[i].outerHTML.replace(/"/g, '""');

        output += "\"" + validLinks[i].href + "\",";
        output += "\"" + outerHTML + "\",";
        output += "\"" + window.location.href + "\",";
        output += "\"CMY_Valid\"";
        output += "\n";
      }
    }

    output = output.rtrim(',');
    
    console.log(output);
    };
    // Remove the event listener in the event this is run again without reloading
    chrome.extension.onMessage.removeListener(doStuff);
    }
    return true;

  });
  // Send links to get checked via XHR
  function checkURL(link,options) {
    // For empty href or no attribute href elements
    var checkElement = create("a", {
      href: link.href
    });
    chrome.extension.sendMessage({"action": "check", "url": checkElement.href},
    function (response) {
      // Assess Warnings
      var warnings = [];
      warnings = getTrailingHashWarning(options,link,warnings);
      warnings = getParseDOMWarning(options,link.href,response,warnings);
      // Pass in the outerHTML, the href attributes defaults to the current page if left empty
      warnings = getEmptyLinkWarning(options,link.outerHTML,warnings);
      warnings = getNoHrefLinkWarning(options,link,warnings);      
      updateDisplay(link,warnings,response.status);
    });
  }
