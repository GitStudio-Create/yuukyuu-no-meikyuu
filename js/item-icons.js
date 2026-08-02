(function(K){
  'use strict';
  function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function draw(ctx,category,x,y,size){var s=size/20;ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.imageSmoothingEnabled=false;
    if(category==='weapon'){rect(ctx,'#6f4c2e',3,15,5,3);rect(ctx,'#e5edf0',6,11,3,5);rect(ctx,'#e5edf0',9,8,3,5);rect(ctx,'#f8ffff',12,5,3,5);rect(ctx,'#f8ffff',15,2,2,5);rect(ctx,'#d7ad55',3,13,7,2);}
    else if(category==='shield'){rect(ctx,'#a7b989',4,3,12,11);rect(ctx,'#71845e',5,14,10,3);rect(ctx,'#293329',6,5,8,8);rect(ctx,'#70d1d0',8,7,4,4);rect(ctx,'#d8ffff',9,7,2,2);}
    else if(category==='herb'){rect(ctx,'#3f7e48',9,8,2,9);rect(ctx,'#72bd62',4,5,6,5);rect(ctx,'#91d875',10,3,6,6);rect(ctx,'#559d55',3,10,7,5);rect(ctx,'#74c16a',11,10,6,5);}
    else if(category==='food'){rect(ctx,'#b97835',3,6,14,9);rect(ctx,'#e1aa58',4,5,12,10);rect(ctx,'#f0c373',5,6,10,8);rect(ctx,'#8f5b2d',7,6,2,5);rect(ctx,'#8f5b2d',11,7,2,5);}
    else if(category==='scroll'){rect(ctx,'#e4d39a',5,4,10,12);rect(ctx,'#9d8253',3,3,12,3);rect(ctx,'#9d8253',5,14,12,3);rect(ctx,'#6e5a3c',7,8,6,2);rect(ctx,'#6e5a3c',7,11,4,1);}
    else if(category==='staff'){rect(ctx,'#8b613e',5,14,3,4);rect(ctx,'#a87a4e',7,7,3,9);rect(ctx,'#a87a4e',9,3,3,7);rect(ctx,'#b98ad1',11,2,5,5);rect(ctx,'#f2d8ff',12,3,2,2);}
    else if(category==='arrow'){rect(ctx,'#d9cda8',4,9,12,2);rect(ctx,'#e8eef0',15,7,3,6);rect(ctx,'#879cb0',2,6,4,3);rect(ctx,'#879cb0',2,11,4,3);rect(ctx,'#52687b',5,8,2,4);}
    else if(category==='ring'){rect(ctx,'#d8b957',5,7,10,9);rect(ctx,'#20251e',8,9,4,5);rect(ctx,'#d8b957',7,4,6,5);rect(ctx,'#66cfda',8,2,4,5);rect(ctx,'#d9ffff',9,2,2,2);}
    else if(category==='treasure'){rect(ctx,'#8c5525',3,7,14,9);rect(ctx,'#d79635',4,5,12,5);rect(ctx,'#f4ca65',5,6,10,3);rect(ctx,'#5b361a',4,13,12,3);rect(ctx,'#fff0a6',9,9,3,4);}
    ctx.restore();
  }
  Object.keys(K.Items.definitions).forEach(function(id){K.Items.definitions[id].glyph='';});
  K.ItemIcons={draw:draw,categories:['weapon','shield','herb','food','scroll','staff','arrow','ring','treasure']};
})(window.Kiri=window.Kiri||{});
