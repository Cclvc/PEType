(function(){
  var SK='petype_works', TOK='petype_token', REPO='Cclvc/PEType', BRANCH='main', FILE='works.json';
  var msg=document.getElementById('msg'), fi=document.getElementById('imageInput'), pg=document.getElementById('previewGrid'),
      ti=document.getElementById('titleInput'), di=document.getElementById('descInput'),
      mc=document.getElementById('mainCatSelect'), sc=document.getElementById('subCatSelect'),
      wl=document.getElementById('workList'), eb=document.getElementById('exportBtn'),
      pb=document.getElementById('publishBtn'), tk=document.getElementById('tokenInput'),
      ap=document.getElementById('autoPub');
  var ws=[], MAX_EDGE=1600, QUALITY=0.85, BIG=350000;

  function n(t,c){ msg.textContent=t; msg.className='msg '+c; setTimeout(function(){ msg.className='msg'; },4000); }

  function ps(){
    try{ localStorage.setItem(SK, JSON.stringify(ws)); }
    catch(e){
      if(e && e.name==='QuotaExceededError'){ n('保存失败：照片太大超出浏览器存储上限，请少选几张或换小图','error'); }
      else{ n('保存失败：'+e.message,'error'); }
    }
  }

  function b64(s){
    var bytes=new TextEncoder().encode(s), bin='';
    for(var i=0;i<bytes.length;i++){ bin+=String.fromCharCode(bytes[i]); }
    return btoa(bin);
  }

  function shrink(dataUrl, cb){
    var img=new Image();
    img.onload=function(){
      var w=img.width,h=img.height,s=Math.min(1, MAX_EDGE/Math.max(w,h));
      if(s>=1 && dataUrl.length<BIG){ cb(dataUrl); return; }
      var c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(w*s)); c.height=Math.max(1,Math.round(h*s));
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      var out=c.toDataURL('image/jpeg',QUALITY);
      cb(out.length<dataUrl.length?out:dataUrl);
    };
    img.onerror=function(){ cb(dataUrl); };
    img.src=dataUrl;
  }

  function ld(){
    var s=null; try{ s=localStorage.getItem(SK); }catch(e){}
    if(s){ try{ ws=JSON.parse(s); if(!Array.isArray(ws)) ws=[]; }catch(e){ ws=[]; } }
    if(tk && !tk.value){ try{ tk.value=localStorage.getItem(TOK)||''; }catch(e){} }
    rd();
    var x=new XMLHttpRequest();
    x.open('GET', FILE+'?t='+Date.now(), true);
    x.onload=function(){
      try{
        var d=JSON.parse(x.responseText);
        if(Array.isArray(d)&&d.length){
          var ids={}; ws.forEach(function(w){ if(w&&w.id!=null) ids[w.id]=true; });
          var add=0;
          d.forEach(function(w){ if(w&&w.id!=null&&!ids[w.id]){ ws.push(w); add++; } });
          if(add){ ps(); rd(); }
        }
      }catch(e){}
    };
    x.send();
    compressOld();
  }

  function compressOld(){
    var changed=false, pending=0;
    ws.forEach(function(w){
      if(!w || !Array.isArray(w.images)) return;
      w.images.forEach(function(src,i){
        if(typeof src==='string' && src.length>BIG){
          pending++; changed=true;
          (function(w,i){ shrink(src,function(out){ w.images[i]=out; pending--; if(pending===0&&changed){ ps(); rd(); } }); })(w,i);
        }
      });
    });
  }

  function pv(){
    pg.innerHTML='';
    var f=fi.files; if(!f||!f.length) return;
    if(f.length<2||f.length>5){ n('请选择 2-5 张照片','error'); fi.value=''; return; }
    for(var i=0;i<f.length;i++){ (function(file){
      var r=new FileReader();
      r.onload=function(e){
        var d=document.createElement('div'); d.className='preview-thumb';
        d.innerHTML='<img src="'+e.target.result+'" alt="'+file.name.replace(/"/g,'&quot;')+'">';
        pg.appendChild(d);
      };
      r.onerror=function(){ n('读取 '+file.name+' 失败','error'); };
      r.readAsDataURL(file);
    })(f[i]); }
  }

  function up(){
    var f=fi.files; if(!f||!f.length){ n('请先选择照片','error'); return; }
    var imgs=[], cnt=0, ttl=ti.value.trim(), dsc=di.value.trim(), ma=mc.value, su=sc.value;
    function nxt(){
      if(cnt>=f.length){
        ws.unshift({id:Date.now(), title:ttl, desc:dsc, mainCat:ma, subCat:su, images:imgs});
        ps(); rd();
        ti.value=''; di.value=''; mc.value=''; sc.value=''; fi.value=''; pg.innerHTML='';
        n('上传成功 ('+imgs.length+' 张，已自动压缩)','success');
        if(ap && ap.checked){ publish(); }
        return;
      }
      var r=new FileReader();
      r.onload=function(e){
        shrink(e.target.result, function(out){ imgs.push(out); cnt++; nxt(); });
      };
      r.onerror=function(){ n('第'+(cnt+1)+'张读取失败','error'); cnt++; nxt(); };
      r.readAsDataURL(f[cnt]);
    }
    nxt();
  }

  function publish(){
    if(!ws.length){ n('还没有作品，无法发布','error'); return; }
    var token=(tk&&tk.value?tk.value.trim():'');
    if(!token){ n('请先填写 GitHub Token','error'); if(tk) tk.focus(); return; }
    try{ localStorage.setItem(TOK, token); }catch(e){}
    n('正在发布到 GitHub…','');
    var url='https://api.github.com/repos/'+REPO+'/contents/'+FILE;
    var get=new XMLHttpRequest();
    get.open('GET', url+'?ref='+BRANCH, true);
    get.setRequestHeader('Authorization','Bearer '+token);
    get.setRequestHeader('Accept','application/vnd.github+json');
    get.onload=function(){
      var sha=null;
      if(get.status===200){ try{ sha=JSON.parse(get.responseText).sha; }catch(e){} }
      put(sha);
    };
    get.onerror=function(){ n('发布失败：网络错误，请检查网络/梯子','error'); };
    get.send();

    function put(sha){
      var body={ message:'发布作品 '+new Date().toLocaleString(), content:b64(JSON.stringify(ws,null,2)), branch:BRANCH };
      if(sha){ body.sha=sha; }
      var r=new XMLHttpRequest();
      r.open('PUT', url, true);
      r.setRequestHeader('Authorization','Bearer '+token);
      r.setRequestHeader('Accept','application/vnd.github+json');
      r.setRequestHeader('Content-Type','application/json');
      r.onload=function(){
        if(r.status>=200&&r.status<300){ n('发布成功！主页 1-2 分钟后自动更新','success'); }
        else{
          var em=''; try{ em=JSON.parse(r.responseText).message; }catch(e){}
          n('发布失败 ('+r.status+')：'+em,'error');
        }
      };
      r.onerror=function(){ n('发布失败：网络错误，请检查网络','error'); };
      r.send(JSON.stringify(body));
    }
  }

  function ex(){
    if(!ws.length){ n('还没有作品','error'); return; }
    var b=new Blob([JSON.stringify(ws,null,2)],{type:'application/json'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='works.json'; a.click();
    n('JSON 已导出','success');
  }

  function rd(){
    wl.innerHTML='';
    if(!ws.length){ wl.innerHTML='<li style="color:#889281;padding:20px;text-align:center">还没有作品，快来上传吧 ^^</li>'; return; }
    var h='', mL={'people-pet':'人宠拍摄','pet-only':'只拍毛孩子'}, sL={outdoor:'户外拍摄',studio:'棚拍','home-visit':'上门拍摄'};
    for(var i=0;i<ws.length;i++){
      var w=ws[i], th=Array.isArray(w.images)?w.images[0]:w.src, ct=Array.isArray(w.images)?w.images.length:1;
      h+='<li style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#fff;border-radius:12px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);border:1px solid #d8ddd2">'
        +'<img src="'+th+'" style="width:56px;height:56px;object-fit:cover;border-radius:10px">'
        +'<div style="flex:1"><strong>'+w.title+' <span style="color:#889281;font-weight:400;font-size:.8rem">'+ct+'张</span></strong>'
        +'<br><small style="color:#889281">'+(mL[w.mainCat]||w.mainCat)+' · '+(sL[w.subCat]||w.subCat)+'</small></div>'
        +'<button data-idx="'+i+'" class="del-btn" style="background:#fef2f2;color:#dc2626;border:none;padding:7px 16px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:500">删除</button></li>';
    }
    wl.innerHTML=h;
    var ds=wl.querySelectorAll('.del-btn');
    for(var j=0;j<ds.length;j++){ ds[j].onclick=function(){ ws.splice(parseInt(this.dataset.idx),1); ps(); rd(); }; }
  }

  fi.addEventListener('change',pv);
  document.getElementById('uploadForm').addEventListener('submit',function(e){
    e.preventDefault();
    var f=fi.files;
    if(!f||f.length<2||f.length>5){ n('请选择 2-5 张照片','error'); return; }
    if(!ti.value.trim()){ n('请输入标题','error'); return; }
    if(!mc.value){ n('请选择类型','error'); return; }
    if(!sc.value){ n('请选择场景','error'); return; }
    up();
  });
  if(eb) eb.addEventListener('click',ex);
  if(pb) pb.addEventListener('click',publish);
  ld();
})();