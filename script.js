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
  function isDataUrl(s){
    return typeof s==='string' && s.indexOf('data:')===0;
  }
  function fileOf(url){
    var m=/([^/?#]+.[a-z0-9]+)(?:[?#].*)?$/i.exec(url);
    return m?m[1]:'';
  }
  function stripVariant(name){
    return name.replace(/_t\.jpg$/i,'.jpg').replace(/_l\.jpg$/i,'.jpg');
  }
  function variantOf(name, kind){
    var base=stripVariant(name);
    if((kind==='thumb'||kind==='large') && /\.jpg$/i.test(base)){
      return base.replace(/\.jpg$/i, kind==='thumb'?'_t.jpg':'_l.jpg');
    }
    return base;
  }
  function srcPath(url){
    if(isDataUrl(url)) return url;
    var m=/(images\/[^\/?#]+\.[a-z0-9]+)(?:[?#].*)?$/i.exec(url);
    return m?m[1]:(url||'');
  }
  function imgSrc(url, kind){
    if(isDataUrl(url)) return url;
    var rel=srcPath(url);
    var name=fileOf(rel);
    if(!name) return url;
    var vn=variantOf(name, kind);
    if(kind==='thumb') return 'images/thumbs/'+vn;
    if(kind==='large') return 'images/large/'+vn;
    return 'images/'+name;
  }
  function onImgError(img){
    var kind=img.getAttribute('data-kind');
    var url=img.getAttribute('data-src')||'';
    if(!kind || isDataUrl(url)) return;
    var name=fileOf(srcPath(url));
    if(!name) return;
    var fallback='images/'+stripVariant(name);
    if(img.src.indexOf(fallback)>=0) return;
    img.src=fallback;
  }
  function onImgLoad(img){
    var n=img.naturalWidth||0;
    if(n>0 && n<40){
      var kind=img.getAttribute('data-kind');
      var url=img.getAttribute('data-src')||'';
      img.src=imgSrc(url, kind);
    }
  }
  function makeImg(src, kind, alt){
    var img=document.createElement('img');
    img.src=imgSrc(src, kind);
    img.alt=alt||'';
    img.loading='lazy';
    img.setAttribute('data-kind', kind);
    img.setAttribute('data-src', src);
    img.addEventListener('error', function(){ onImgError(img); });
    img.addEventListener('load', function(){ onImgLoad(img); });
    return img;
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

      var wrap=document.createElement('div');
      wrap.className='card-img-wrap';
      wrap.appendChild(makeImg(cover, 'thumb', x.title));
      if(imgs.length>1){
        var badge=document.createElement('span');
        badge.className='card-count';
        badge.textContent=imgs.length+' 张';
        wrap.appendChild(badge);
      }
      var info=document.createElement('div');
      info.className='card-info';
      var title=document.createElement('div');
      title.className='card-title';
      title.textContent=x.title;
      var meta=document.createElement('div');
      meta.className='card-meta';
      var t1=document.createElement('span');
      t1.className='card-tag';
      t1.textContent=catName(x.mainCat);
      var t2=document.createElement('span');
      t2.className='card-tag';
      t2.textContent=catName(x.subCat);
      meta.appendChild(t1); meta.appendChild(t2);
      info.appendChild(title); info.appendChild(meta);

      o.appendChild(wrap); o.appendChild(info);
      o.addEventListener('click', function(){ openDetail(idx); });
      gallery.appendChild(o);
    });
  }

  function openDetail(idx){
    if(!list.length || idx<0 || idx>=list.length) return;
    var fromData=(window.scrollY||0)+':'+mainCat+':'+subCat;
    current=list[idx];
    renderDetail();
    document.body.style.overflow='hidden';
    lightbox.classList.add('active');
    lightbox.scrollTop=0;
    var back=document.getElementById('detailBack');
    if(back && !back.dataset.from){ back.dataset.from=fromData; }
  }
  function renderDetail(){
    if(!current) return;
    var imgs=imgsOf(current);
    lbBody.innerHTML='';
    var head=document.createElement('div');
    head.className='detail-head';
    var back=document.createElement('button');
    back.className='detail-back';
    back.id='detailBack';
    back.innerHTML='&#8592; 返回作品集';
    var close=document.createElement('button');
    close.className='detail-close';
    close.id='detailClose';
    close.innerHTML='&times;';
    var title=document.createElement('h2');
    title.className='detail-title';
    title.textContent=current.title;
    var meta=document.createElement('p');
    meta.className='detail-meta';
    meta.textContent=catName(current.mainCat)+' · '+catName(current.subCat)+(current.desc?' — '+current.desc:'');
    head.appendChild(back); head.appendChild(close); head.appendChild(title); head.appendChild(meta);

    var wrap=document.createElement('div');
    wrap.className='detail-imgs';
    imgs.forEach(function(src,i){
      var fig=document.createElement('figure');
      fig.className='detail-fig';
      fig.appendChild(makeImg(src, 'large', current.title+' '+(i+1)));
      var cap=document.createElement('figcaption');
      cap.textContent=(i+1)+' / '+imgs.length;
      fig.appendChild(cap);
      wrap.appendChild(fig);
    });

    lbBody.appendChild(head);
    lbBody.appendChild(wrap);
    document.getElementById('detailClose').addEventListener('click', closeDetail);
    document.getElementById('detailBack').addEventListener('click', goBack);
  }

  function closeDetail(){
    lightbox.classList.remove('active');
    document.body.style.overflow='';
    current=null;
    var back=document.getElementById('detailBack');
    if(back) back.removeAttribute('data-from');
  }
  function goBack(){
    var back=document.getElementById('detailBack');
    var from=back?back.getAttribute('data-from'):'';
    closeDetail();
    if(!from) return;
    var parts=from.split(':');
    var y=parseInt(parts[0],10)||0;
    var m=parts[1], s=parts[2];
    if(m && mainCat!==m){
      mainCat=m;
      mainBtns.forEach(function(b){ b.classList.toggle('active',b.dataset.cat===m); });
    }
    if(s && subCat!==s){
      subCat=s;
      subBtns.forEach(function(b){ b.classList.toggle('active',b.dataset.cat===s); });
    }
    render();
    setTimeout(function(){ window.scrollTo(0,y); }, 50);
  }

  mainBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      mainBtns.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      mainCat=btn.dataset.cat;
      render();
    });
  });
  subBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      subBtns.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      subCat=btn.dataset.cat;
      render();
    });
  });

  lightbox.addEventListener('click', function(ev){
    if(ev.target===lightbox) closeDetail();
  });
  document.addEventListener('keydown', function(ev){
    if(!lightbox.classList.contains('active')) return;
    if(ev.key==='Escape') closeDetail();
  });

  var CDNS=["works.json?t="+Date.now(),"https://raw.githubusercontent.com/Cclvc/PEType/main/works.json?t="+Date.now()];
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
