(function(){
  var SK='petype_works', TOK='petype_token', REPO='Cclvc/PEType', BRANCH='main', FILE='works.json', IMGDIR='images';
  var CDNP='';
  var msg=document.getElementById('msg'), fi=document.getElementById('imageInput'), pg=document.getElementById('previewGrid'),
      ti=document.getElementById('titleInput'), di=document.getElementById('descInput'),
      mc=document.getElementById('mainCatSelect'), sc=document.getElementById('subCatSelect'),
      wl=document.getElementById('workList'), eb=document.getElementById('exportBtn'),
      pb=document.getElementById('publishBtn'), tk=document.getElementById('tokenInput'),
      ap=document.getElementById('autoPub');
  var ws=[], MAX_EDGE=1200, QUALITY=0.72, publishing=false;

  function n(t,c){
    msg.textContent=t; msg.className='msg '+c;
    setTimeout(function(){ msg.className='msg'; },4000);
  }

  function ps(){
    try{ localStorage.setItem(SK, JSON.stringify(ws)); }
    catch(e){
      if(e && e.name==='QuotaExceededError'){ n('保存失败：空间不足，请点发布把图片传到 GitHub','error'); }
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
      var c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(w*s)); c.height=Math.max(1,Math.round(h*s));
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      cb(c.toDataURL('image/jpeg',QUALITY));
    };
    img.onerror=function(){ cb(dataUrl); };
    img.src=dataUrl;
  }

  function ld(){
    var s=null; try{ s=localStorage.getItem(SK); }catch(e){}
    if(s){ try{ ws=JSON.parse(s); if(!Array.isArray(ws)) ws=[]; }catch(e){ ws=[]; } }
    if(tk && !tk.value){ try{ tk.value=localStorage.getItem(TOK)||''; }catch(e){} }
    rd();
  }

  function pv(){
    pg.innerHTML='';
    var f=fi.files; if(!f||!f.length) return;
    if(f.length<4||f.length>9){ n('请选择 4-9 张照片','error'); fi.value=''; return; }
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
    var ttl=ti.value.trim(), dsc=di.value.trim(), ma=mc.value, su=sc.value;
    var imgs=[], cnt=0;
    function nxt(){
      if(cnt>=f.length){
        ws.unshift({id:Date.now(), title:ttl, desc:dsc, mainCat:ma, subCat:su, images:imgs});
        ps(); rd();
        ti.value=''; di.value=''; mc.value=''; sc.value=''; fi.value=''; pg.innerHTML='';
        n('上传成功 ('+imgs.length+' 张，已压缩)','success');
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
    if(publishing) return;
    var token=(tk&&tk.value?tk.value.trim():'');
    if(!token){ n('请先填写 GitHub Token','error'); if(tk) tk.focus(); return; }
    try{ localStorage.setItem(TOK, token); }catch(e){}
    publishing=true;
    var pending=[];
    ws.forEach(function(w,wi){
      if(!w || !Array.isArray(w.images)) return;
      w.images.forEach(function(src,ii){
        if(typeof src==='string' && src.indexOf('data:')===0){ pending.push({wi:wi, ii:ii, src:src}); }
      });
    });
    if(!pending.length){ doPublishJson(token,0); return; }
    uploadAll(pending,0,token,function(){ ps(); doPublishJson(token,0); });
  }

  function uploadAll(pending,k,token,done){
    if(k>=pending.length){ done(); return; }
    var item=pending[k];
    n('正在上传图片 '+(k+1)+'/'+pending.length+'…','');
    var ext=item.src.indexOf('image/png')>=0?'png':'jpg';
    var name='p'+Date.now()+'_'+Math.floor(Math.random()*1000)+'_'+(k+1)+'.'+ext;
    var url='https://api.github.com/repos/'+REPO+'/contents/'+IMGDIR+'/'+name;
    putImg(url, token, item.src.split(',')[1], name, item, function(){ uploadAll(pending,k+1,token,done); }, 0);
  }

  function putImg(url, token, raw, name, item, next, attempt){
    var body={ message:'上传图片 '+name, content:raw, branch:BRANCH };
    var r=new XMLHttpRequest();
    r.open('PUT',url,true);
    r.setRequestHeader('Authorization','Bearer '+token);
    r.setRequestHeader('Accept','application/vnd.github+json');
    r.setRequestHeader('Content-Type','application/json');
    r.onload=function(){
      if(r.status>=200 && r.status<300){
        var newUrl=IMGDIR+'/'+name;
        ws[item.wi].images[item.ii]=newUrl;
        if(ws[item.wi].cover===item.src){ ws[item.wi].cover=newUrl; }
        next();
      } else if((r.status===409||r.status===422) && attempt<2){
        setTimeout(function(){ putImg(url, token, raw, name, item, next, attempt+1); }, 1200);
      } else {
        publishing=false;
        var em=''; try{ em=JSON.parse(r.responseText).message; }catch(e){}
        n('图片上传失败 ('+r.status+')：'+em,'error');
      }
    };
    r.onerror=function(){
      if(attempt<2){ setTimeout(function(){ putImg(url, token, raw, name, item, next, attempt+1); }, 1200); }
      else{ publishing=false; n('图片上传失败：网络错误','error'); }
    };
    r.send(JSON.stringify(body));
  }

  function doPublishJson(token, attempt){
    var url='https://api.github.com/repos/'+REPO+'/contents/'+FILE;
    var get=new XMLHttpRequest();
    get.open('GET', url+'?ref='+BRANCH+'&t='+Date.now(), true);
    get.setRequestHeader('Authorization','Bearer '+token);
    get.setRequestHeader('Accept','application/vnd.github+json');
    get.onload=function(){
      if(get.status!==200){
        publishing=false;
        var em=''; try{ em=JSON.parse(get.responseText).message; }catch(e){}
        n('发布失败：无法获取当前版本 ('+get.status+') '+em,'error');
        return;
      }
      var sha=null; try{ sha=JSON.parse(get.responseText).sha; }catch(e){}
      if(!sha){ publishing=false; n('发布失败：GitHub 未返回版本信息','error'); return; }
      putJson(url, token, sha, attempt);
    };
    get.onerror=function(){ publishing=false; n('发布失败：网络错误，请检查网络/梯子','error'); };
    get.send();
  }

  function putJson(url, token, sha, attempt){
    var body={ message:'发布作品 '+new Date().toLocaleString(), content:b64(JSON.stringify(ws,null,2)), branch:BRANCH, sha:sha };
    var r=new XMLHttpRequest();
    r.open('PUT', url, true);
    r.setRequestHeader('Authorization','Bearer '+token);
    r.setRequestHeader('Accept','application/vnd.github+json');
    r.setRequestHeader('Content-Type','application/json');
    r.onload=function(){
      if(r.status>=200 && r.status<300){ publishing=false; n('发布成功！主页 1-2 分钟后自动更新','success'); }
      else if(r.status===409 && attempt<2){ n('检测到版本变化，正在重试…',''); doPublishJson(token, attempt+1); }
      else{
        publishing=false;
        var em=''; try{ em=JSON.parse(r.responseText).message; }catch(e){}
        n('发布失败 ('+r.status+')：'+em,'error');
      }
    };
    r.onerror=function(){ publishing=false; n('发布失败：网络错误，请检查网络','error'); };
    r.send(JSON.stringify(body));
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
      var isLocal=th&&th.indexOf('data:')===0;
      h+='<li style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#fff;border-radius:12px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);border:1px solid #d8ddd2">'
        +'<img src="'+th+'" style="width:56px;height:56px;object-fit:cover;border-radius:10px">'
        +'<div style="flex:1"><strong>'+w.title+' <span style="color:#889281;font-weight:400;font-size:.8rem">'+ct+'张'+(isLocal?' · 待发布':'')+'</span></strong>'
        +'<br><small style="color:#889281">'+(mL[w.mainCat]||w.mainCat)+' · '+(sL[w.subCat]||w.subCat)+'</small></div>'
        +'<button data-idx="'+i+'" class="edit-btn" style="background:#eef4ff;color:#2563eb;border:none;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:500;margin-right:6px">编辑</button>'
        +'<button data-idx="'+i+'" class="del-btn" style="background:#fef2f2;color:#dc2626;border:none;padding:7px 16px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:500">删除</button></li>';
    }
    wl.innerHTML=h;
    var es=wl.querySelectorAll('.edit-btn');
    for(var ei=0;ei<es.length;ei++){ (function(idx){ es[ei].onclick=function(){ editWork(idx); }; })(parseInt(es[ei].dataset.idx)); }
    var ds=wl.querySelectorAll('.del-btn');
    for(var j=0;j<ds.length;j++){ ds[j].onclick=function(){ ws.splice(parseInt(this.dataset.idx),1); ps(); rd(); }; }
  }

  function editWork(idx){
    if(!ws[idx]) return;
    var w=ws[idx];
    var m=document.createElement('div');
    m.style.cssText='position:fixed;inset:0;background:rgba(20,24,18,.45);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px';
    var box=document.createElement('div');
    box.style.cssText='background:#fdfcf9;border-radius:16px;max-width:640px;width:100%;max-height:86vh;overflow-y:auto;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.3)';
    var tIn=document.createElement('input');
    tIn.value=w.title||''; tIn.placeholder='标题';
    tIn.style.cssText='width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #d8ddd2;border-radius:10px;font-size:1rem;font-family:inherit;margin-bottom:14px';
    var p=document.createElement('p');
    p.style.cssText='margin:0 0 8px;font-size:.9rem;color:#5a6352;font-weight:600';
    p.textContent='选择封面（点击任意一张照片）';
    var grid=document.createElement('div');
    grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:10px;margin-bottom:16px';
    var imgs=Array.isArray(w.images)?w.images:(w.src?[w.src]:[]);
    var cur=w.cover||imgs[0]||'';
    imgs.forEach(function(src,ii){
      var cell=document.createElement('div');
      cell.style.cssText='position:relative;cursor:pointer;border:3px solid transparent;border-radius:10px;overflow:hidden;aspect-ratio:3/4;background:#eef0ea';
      cell.innerHTML='<img src="'+src+'" style="width:100%;height:100%;object-fit:cover;display:block">';
      if(src===cur){ cell.style.borderColor='#2563eb'; }
      cell.onclick=function(){
        var cs=grid.querySelectorAll('div');
        for(var k=0;k<cs.length;k++){ cs[k].style.borderColor='transparent'; }
        cell.style.borderColor='#2563eb';
        cur=src;
      };
      grid.appendChild(cell);
    });
    var row=document.createElement('div');
    row.style.cssText='display:flex;gap:10px;justify-content:flex-end';
    var save=document.createElement('button');
    save.textContent='保存';
    save.style.cssText='background:#2563eb;color:#fff;border:none;padding:10px 26px;border-radius:10px;cursor:pointer;font-size:.95rem;font-family:inherit;font-weight:600';
    var cancel=document.createElement('button');
    cancel.textContent='取消';
    cancel.style.cssText='background:#eef0ea;color:#3a4234;border:none;padding:10px 22px;border-radius:10px;cursor:pointer;font-size:.95rem;font-family:inherit';
    cancel.onclick=function(){ m.remove(); };
    save.onclick=function(){
      var t2=tIn.value.trim();
      if(!t2){ n('标题不能为空','error'); return; }
      w.title=t2; w.cover=cur;
      ps(); rd(); m.remove();
      n('已保存，正在自动发布…','');
      publish();
    };
    row.appendChild(cancel); row.appendChild(save);
    box.appendChild(tIn); box.appendChild(p); box.appendChild(grid); box.appendChild(row);
    m.appendChild(box);
    document.body.appendChild(m);
    m.onclick=function(ev){ if(ev.target===m){ m.remove(); } };
  }

  fi.addEventListener('change',pv);
  document.getElementById('uploadForm').addEventListener('submit',function(e){
    e.preventDefault();
    var f=fi.files;
    if(!f||f.length<4||f.length>9){ n('请选择 4-9 张照片','error'); return; }
    if(!ti.value.trim()){ n('请输入标题','error'); return; }
    if(!mc.value){ n('请选择类型','error'); return; }
    if(!sc.value){ n('请选择场景','error'); return; }
    up();
  });
  if(eb) eb.addEventListener('click',ex);
  if(pb) pb.addEventListener('click',publish);
  ld();
})();