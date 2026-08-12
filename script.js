(function(){
  var mainCat='all', subCat='all';
  var list=[];
  var current=null;

  var gallery=document.getElementById('gallery');
  var empty=document.getElementById('galleryEmpty');
  var lightbox=document.getElementById('lightbox');
  var lbBody=document.getElementById('lightboxBody');

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
      var cover=x.cover||imgs[0]||'';
      var o=document.createElement('div');
      o.className='gallery-card';
      o.style.animationDelay=(idx*.08)+'s';
      var countBadge=imgs.length>1?('<span class="card-count">'+imgs.length+' 张</span>'):'';
      o.innerHTML='<div class="card-img-wrap"><img src="'+esc(cover)+'" alt="'+esc(x.title)+'" loading="lazy"><div class="card-overlay"></div>'+countBadge+'</div>'
        +'<div class="card-info"><div class="card-title">'+esc(x.title)+'</div>'
        +'<div class="card-meta"><span class="card-tag">'+catName(x.mainCat)+'</span><span class="card-tag">'+catName(x.subCat)+'</span></div></div>';
      o.addEventListener('click',function(){ openDetail(idx); });
      gallery.appendChild(o);
    });
  }

  function openDetail(idx){
    if(!list.length || idx<0 || idx>=list.length) return;
    current=list[idx];
    renderDetail();
    document.body.style.overflow='hidden';
    lightbox.classList.add('active');
    lightbox.scrollTop=0;
  }

  function renderDetail(){
    if(!current) return;
    var imgs=imgsOf(current);
    var h='<div class="detail-head">'
      +'<button class="detail-close" id="detailClose">&times;</button>'
      +'<h2 class="detail-title">'+esc(current.title)+'</h2>'
      +'<p class="detail-meta">'+catName(current.mainCat)+' · '+catName(current.subCat)+(current.desc?' — '+esc(current.desc):'')+'</p>'
      +'</div>';
    h+='<div class="detail-imgs">';
    imgs.forEach(function(src,i){
      h+='<figure class="detail-fig"><img src="'+esc(src)+'" alt="'+esc(current.title)+' '+(i+1)+'" loading="lazy"><figcaption>'+(i+1)+' / '+imgs.length+'</figcaption></figure>';
    });
    h+='</div>';
    lbBody.innerHTML=h;
    document.getElementById('detailClose').addEventListener('click',closeDetail);
  }

  function closeDetail(){
    lightbox.classList.remove('active');
    document.body.style.overflow='';
    current=null;
  }

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

  lightbox.addEventListener('click',function(ev){
    if(ev.target===lightbox) closeDetail();
  });
  document.addEventListener('keydown',function(ev){
    if(!lightbox.classList.contains('active')) return;
    if(ev.key==='Escape') closeDetail();
  });

  var CDNS=["works.json?t="+Date.now(),"https://cdn.jsdelivr.net/gh/Cclvc/PEType@main/works.json?t="+Date.now()];
  var ri=0;
  function loadWorks(){
    if(ri>=CDNS.length){ window.worksData=[]; render(); return; }
    var r=new XMLHttpRequest();
    r.open('GET', CDNS[ri], true);
    r.onerror=function(){ ri++; loadWorks(); };
    r.onload=function(){
      if(r.status>=200 && r.status<300){
        try{ window.worksData=JSON.parse(r.responseText); }catch(e){ window.worksData=[]; }
        if(window.worksData && window.worksData.length){ render(); return; }
      }
      ri++; loadWorks();
    };
    r.send();
  }
  loadWorks();
})();