var mute_list = {};
var event_timer;

var muteMachineEvent = document.createEvent("CustomEvent");
muteMachineEvent.initCustomEvent("muteMachineEvent");

$(function(){
  $.each($(".favdiv"), function(index, element){
    if($(element).siblings(".mutediv").length === 0) {
      insertMuteButton(element);
    }
  });
  chrome.storage.sync.get("mute_list",function(obj){
    if(obj.hasOwnProperty("mute_list"))
    {
      mute_list = obj.mute_list;
      $.each(mute_list, function(key, value){
        $(".section-track[data-itemid="+key+"] .mute").removeClass("off").addClass("on");
        $(".section-track[data-itemid="+key+"]").addClass("muted");
      });
      console.log(mute_list);
    }
  });
  $("#player-nowplaying").on("DOMSubtreeModified", function(event)
    {
          if (event_timer) clearTimeout(event_timer);
              event_timer = setTimeout(skip_song, 100);
    });
});

var skip_song = function() {
  var song_id = $("#player-nowplaying").find("a[href^='/track/']").attr("href").replace("/track/","");
  if(mute_list.hasOwnProperty(song_id)){
    document.dispatchEvent(muteMachineEvent);
    setTimeout(skip_song, 1000);
  }
}

var insertMuteButton = function(favorite) {
  var song_id = $(favorite).closest(".section-track").attr("data-itemid"); 
  $muteButton = $("<li class='mutediv'><a class='icon-speaker-mute mute' title='Mute' href></a></li>");
  $muteButton.find("a").click(mute_click);
  if(mute_list.hasOwnProperty(song_id)) {
    $muteButton.find("a").addClass("on");
    $(favorite).closest(".section-track").addClass("muted");
  } else {
    $muteButton.find("a").addClass("off");
    $(favorite).closest(".section-track").removeClass("muted");
  }
  $(favorite).after($muteButton);
}

var mute_click = function(event){
  event.preventDefault();
  var song_id = $(event.target).closest(".section-track").attr("data-itemid");
  if($(event.target).hasClass("off")){
    mute_list[song_id] = true;
    $(event.target).removeClass("off").addClass("on");
    $(event.target).closest(".section-track").addClass("muted");
  }
  else if($(event.target).hasClass("on")){
    delete mute_list[song_id];
    $(event.target).removeClass("on").addClass("off");
    $(event.target).closest(".section-track").removeClass("muted");
  }
  chrome.storage.sync.set({"mute_list": mute_list});
}

//Custom css will fire this event everytime a new favorite button is added to the UI
//this allows us to insert a mute button adjacent to this favorite
var insertListener = function(event){
  if(event.animationName == "favoriteInserted") {
    insertMuteButton(event.target);
  }
}
document.addEventListener("webkitAnimationStart", insertListener, false);

//We need to inject a call to hypemachine scripts to actually skip the track
var skip_track_code = "document.addEventListener('muteMachineEvent', function(e){nextTrack();});"
var script = document.createElement('script');
script.textContent = skip_track_code;
(document.head||document.documentElement).appendChild(script);
script.parentNode.removeChild(script);

