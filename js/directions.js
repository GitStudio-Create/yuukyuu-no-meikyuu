(function(K){
  'use strict';
  var vectors={
    N:{dx:0,dy:-1},NE:{dx:1,dy:-1},E:{dx:1,dy:0},SE:{dx:1,dy:1},
    S:{dx:0,dy:1},SW:{dx:-1,dy:1},W:{dx:-1,dy:0},NW:{dx:-1,dy:-1}
  };
  function idFromDelta(dx,dy){
    dx=Math.sign(dx||0);dy=Math.sign(dy||0);
    if(!dx&&!dy)return null;
    if(!dx&&dy<0)return'N';
    if(dx>0&&dy<0)return'NE';
    if(dx>0&&!dy)return'E';
    if(dx>0&&dy>0)return'SE';
    if(!dx&&dy>0)return'S';
    if(dx<0&&dy>0)return'SW';
    if(dx<0&&!dy)return'W';
    return'NW';
  }
  function vector(id){var v=vectors[id]||vectors.S;return{dx:v.dx,dy:v.dy,id:id||'S'};}
  function apply(actor,dx,dy){
    if(!actor)return null;
    var id=idFromDelta(dx,dy);
    if(!id)return actor.facing8||(actor.facingDirection&&actor.facingDirection.id)||'S';
    var v=vector(id);
    actor.facing8=id;
    actor.facingDirection={dx:v.dx,dy:v.dy,id:id};
    return id;
  }
  function fromActor(actor){
    if(!actor)return'S';
    return actor.facing8||(actor.facingDirection&&actor.facingDirection.id)||idFromDelta(actor.facingDirection&&actor.facingDirection.dx,actor.facingDirection&&actor.facingDirection.dy)||'S';
  }
  function side(id){
    return id==='W'||id==='NW'||id==='SW'?'left':(id==='E'||id==='NE'||id==='SE'?'right':'center');
  }
  K.Direction8={ids:Object.freeze(Object.keys(vectors)),vectors:Object.freeze(vectors),fromDelta:idFromDelta,vector:vector,apply:apply,fromActor:fromActor,side:side};
})(window.Kiri=window.Kiri||{});
