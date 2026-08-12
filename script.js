(function(){
  var mainCat='all', subCat='all';
  var list=[];        // 当前筛选后的作品数组
  var current=null;   // 当前灯箱中的作品
  var imgIdx=0;       // 当前作品内的图片索引

  var gallery=document.getElementById('gallery');
  var empty=document.getElementById('galleryEmpty');
  var lightbox=document.getElementById('lightbox');
  var lbImg=document.getElementById('lightboxImg');
  var lbCaption=document.getElementById('lightboxCaption');

  var mainBtns=document.querySelectorAll('.filter-btn[data-type=main]');
  var subBtns=document.querySelectorAll('.filter-btn[data-type=sub]');

  function catName(v){
    return {'people-pet':'🐾 人宠拍摄','pet-only':'🐕 只拍毛孩子',outdoor:'🏔️ 户外拍摄',studio:'📸 棚拍','home-visit':'🚪 上门拍摄'}[v]||v;
  }
  function esc(s){
    return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function imgsOf(w){
    if(w && Array.isArray(w.images) && w.images.length) return w.images;
    if(w && w.src) return [w.src];
    return [];
  }

  function render(){
    gallery.querySelectorAll('.gallery-card').forEach(function(x){ x.remove(); });
    var data=window.worksData||[];
    var n=data.filter(function(x){
      if(mainCat!=='all' && x.mainCat!==mainCat) return false;
      if(subCat!=='all' && x.subCat!==subCat) return false;
      return true;
    });
    if(!n.length){ empty.style.display='block'; list=[]; return; }
    empty.style.display='none';
    list=n;
    n.forEach(function(x,idx){
      var imgs=imgsOf(x);
      var cover=imgs[0]||'';
      var o=document.createElement('div');
      o.className='gallery-card';
      o.style.animationDelay=(idx*.08)+'s';
      var countBadge=imgs.length>1?('<span class="card-count">'+imgs.length+' 张</span>'):'';
      o.innerHTML='<div class="card-img-wrap"><img src="'+esc(cover)+'" alt="'+esc(x.title)+'" loading="lazy"><div class="card-overlay"></div>'+countBadge+'</div>'
        +'<div class="card-info"><div class="card-title">'+esc(x.title)+'</div>'
        +'<div class="card-meta"><span class="card-tag">'+catName(x.mainCat)+'</span><span class="card-tag">'+catName(x.subCat)+'</span></div></div>';
      o.addEventListener('click',function(){ openLightbox(idx); });
      gallery.appendChild(o);
    });
  }

  function openLightbox(idx){
    if(!list.length || idx<0 || idx>=list.length) return;
    current=list[idx];
    imgIdx=0;
    updateLightbox();
    lightbox.classList.add('show');
  }

  function updateLightbox(){
    if(!current) return;
    var imgs=imgsOf(current);
    if(!imgs.length){ lbImg.removeAttribute('src'); lbCaption.textContent=current.title; return; }
    lbImg.src=imgs[imgIdx];
    var pos=imgs.length>1?('('+(imgIdx+1)+'/'+imgs.length+') '):'';
    lbCaption.textContent=pos+current.title+(current.desc?' — '+current.desc:'');
  }

  function step(delta){
    if(!current) return;
    var imgs=imgsOf(current);
    if(imgs.length>1){
      imgIdx=(imgIdx+delta+imgs.length)%imgs.length;
      updateLightbox();
      return;
    }
    var i=list.indexOf(current);
    var next=i+delta;
    if(next<0) next=list.length-1;
    if(next>=list.length) next=0;
    openLightbox(next);
  }

  function closeLightbox(){ lightbox.classList.remove('show'); current=null; imgIdx=0; }

  mainBtns.forEach(function(btn){
    btn.addEventListener('click',function(){
      mainBtns.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      mainCat=btn.dataset.cat;
      render();
    });
  });
  subBtns.forEach(function(btn){
    btn.addEventListener('click',function(){
      subBtns.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      subCat=btn.dataset.cat;
      render();
    });
  });

  lightbox.querySelector('.lightbox-close').addEventListener('click',closeLightbox);
  lightbox.addEventListener('click',function(ev){ if(ev.target===lightbox) closeLightbox(); });
  document.getElementById('lightboxPrev').addEventListener('click',function(ev){ ev.stopPropagation(); step(-1); });
  document.getElementById('lightboxNext').addEventListener('click',function(ev){ ev.stopPropagation(); step(1); });
  document.addEventListener('keydown',function(ev){
    if(!lightbox.classList.contains('show')) return;
    if(ev.key==='Escape') closeLightbox();
    if(ev.key==='ArrowLeft') step(-1);
    if(ev.key==='ArrowRight') step(1);
  });

  var r=new XMLHttpRequest();
  r.open('GET','works.json?t='+Date.now(),true);
  r.onload=function(){
    if(r.status>=200&&r.status<300){
      try{ window.worksData=JSON.parse(r.responseText); }catch(e){ window.worksData=[]; }
    }else{ window.worksData=[]; }
    render();
  };
  r.onerror=function(){ window.worksData=[]; render(); };
  r.send();
})();