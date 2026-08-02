(function(K){
  'use strict';
  if(!K.State||!K.Themes)return;
  function syncTheme(state){
    if(!state)return state;
    var theme=K.Themes.forFloor(state.floor||1);
    state.floorTheme=theme.name;
    state.bgmThemeName=theme.bgmThemeName;
    return state;
  }
  var oldReset=K.State.reset;
  K.State.reset=function(){
    return syncTheme(oldReset.apply(this,arguments));
  };
  var oldLoad=K.State.load;
  K.State.load=function(){
    var ok=oldLoad.apply(this,arguments);
    if(ok)syncTheme(this.data);
    return ok;
  };
  K.AreaVisuals={syncTheme:syncTheme};
})(window.Kiri=window.Kiri||{});
