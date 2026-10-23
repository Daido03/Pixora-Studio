(() => {
  const $ = (id) => document.getElementById(id);
  const canvas = $("composite-canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  const stage = $("stage");
  const fileInput = $("file-input");
  const layersList = $("layers-list");
  const state = { width: 0, height: 0, layers: [], selectedId: null, zoom: 1, tool: "move", history: [], future: [], drawing: false, lastPoint: null, docName: "Untitled document", adjustments: { brightness:100, contrast:100, saturation:100 } };
  let nextId = 1, toastTimer;

  function toast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
  }
  function selectedLayer() { return state.layers.find(l => l.id === state.selectedId) || null; }
  function snapshot() {
    try {
      const snap = state.layers.map(l => ({...l, canvas: l.canvas.toDataURL("image/png")}));
      state.history.push(JSON.stringify({layers:snap,selectedId:state.selectedId,width:state.width,height:state.height,docName:state.docName,adjustments:{...state.adjustments}}));
      if (state.history.length > 25) state.history.shift();
      state.future = [];
    } catch (e) { /* Large canvas snapshots can exceed browser limits; editing still works. */ }
  }
  function restore(serialized) {
    const s = JSON.parse(serialized); state.layers = []; state.selectedId = s.selectedId;
    state.width=s.width; state.height=s.height; state.docName=s.docName; state.adjustments=s.adjustments || {brightness:100,contrast:100,saturation:100};
    let pending = s.layers.length;
    if (!pending) { renderLayers(); render(); return; }
    s.layers.forEach(item => { const img = new Image(); img.onload=()=>{const c=document.createElement("canvas");c.width=state.width;c.height=state.height;c.getContext("2d").drawImage(img,0,0);state.layers.push({...item,canvas:c});pending--;if(!pending){state.layers.sort((a,b)=>a.order-b.order);renderLayers();render();}};img.src=item.canvas; });
  }
  function markChange() { snapshot(); render(); renderLayers(); }
  function createLayer(name, blank=true) {
    const c = document.createElement("canvas"); c.width=state.width||1200; c.height=state.height||800;
    const layer={id:nextId++,name,canvas:c,visible:true,opacity:1,blend:"source-over",order:state.layers.length};
    state.layers.push(layer); state.selectedId=layer.id;
    if (!blank && !state.width) { state.width=c.width; state.height=c.height; }
    return layer;
  }
  function normalizeOrders() { state.layers.forEach((l,i)=>l.order=i); }
  function render() {
    if (!state.width || !state.height) { canvas.style.display="none"; $("empty-state").style.display="block"; return; }
    canvas.width=state.width; canvas.height=state.height;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const sorted=[...state.layers].sort((a,b)=>a.order-b.order);
    for (const layer of sorted) {
      if (!layer.visible) continue;
      ctx.save(); ctx.globalAlpha=layer.opacity; ctx.globalCompositeOperation=layer.blend;
      if (layer.id===state.selectedId) {
        const a=state.adjustments;
        ctx.filter=`brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturation}%)`;
      } else ctx.filter="none";
      ctx.drawImage(layer.canvas,0,0); ctx.restore();
    }
    canvas.style.display="block"; $("empty-state").style.display="none";
    canvas.style.width=`${Math.round(state.width*state.zoom)}px`; canvas.style.height=`${Math.round(state.height*state.zoom)}px`;
    $("zoom-label").textContent=`${Math.round(state.zoom*100)}%`;
    $("canvas-info").textContent=`${state.width} × ${state.height} px`;
    $("doc-status").textContent=state.layers.length ? "Unsaved project" : "No document";
    $("document-name").textContent=state.docName;
  }
  function renderLayers() {
    layersList.innerHTML="";
    if (!state.layers.length) { layersList.innerHTML='<div class="layers-placeholder">Your layers will appear here.</div>'; return; }
    [...state.layers].sort((a,b)=>b.order-a.order).forEach(layer=>{
      const row=document.createElement("div"); row.className="layer-row"+(layer.id===state.selectedId?" selected":""); row.dataset.id=layer.id;
      const vis=document.createElement("button"); vis.className="layer-visibility"; vis.title=layer.visible?"Hide layer":"Show layer"; vis.textContent=layer.visible?"◉":"○";
      vis.addEventListener("click",e=>{e.stopPropagation();snapshot();layer.visible=!layer.visible;render();renderLayers();});
      const thumb=document.createElement("div");thumb.className="layer-thumb";thumb.textContent=layer.canvas.getContext("2d").getImageData(0,0,1,1).data[3]?"▧":"◇";
      const name=document.createElement("div");name.className="layer-name";name.textContent=layer.name;
      row.append(vis,thumb,name);row.addEventListener("click",()=>{state.selectedId=layer.id;syncControls();render();renderLayers();});layersList.append(row);
    });
    syncControls();
  }
  function syncControls() {
    const l=selectedLayer();
    $("layer-opacity").value=l?Math.round(l.opacity*100):100;$("opacity-value").textContent=`${$("layer-opacity").value}%`;
    $("blend-mode").value=l?l.blend:"source-over";
    $("brightness").value=state.adjustments.brightness;$("brightness-value").textContent=state.adjustments.brightness+"%";
    $("contrast").value=state.adjustments.contrast;$("contrast-value").textContent=state.adjustments.contrast+"%";
    $("saturation").value=state.adjustments.saturation;$("saturation-value").textContent=state.adjustments.saturation+"%";
  }
  function openFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("Please choose an image file."); return; }
    const url=URL.createObjectURL(file), img=new Image();
    img.onload=()=> {
      state.width=img.naturalWidth;state.height=img.naturalHeight;state.layers=[];state.history=[];state.future=[];
      state.docName=file.name.replace(/\.[^.]+$/,"");state.adjustments={brightness:100,contrast:100,saturation:100};
      const l=createLayer(file.name.replace(/\.[^.]+$/,""));l.canvas.getContext("2d").drawImage(img,0,0);
      state.zoom=Math.min(1,(stage.clientWidth-56)/state.width,(stage.clientHeight-56)/state.height);state.zoom=Math.max(.05,state.zoom);
      URL.revokeObjectURL(url);renderLayers();render();toast("Image opened.");
    };
    img.onerror=()=>{URL.revokeObjectURL(url);toast("Could not open this image.");};img.src=url;
  }
  function newDocument() {
    const w=Number(prompt("Canvas width in pixels", "1200")); if(!w||w<1||w>12000)return;
    const h=Number(prompt("Canvas height in pixels", "800")); if(!h||h<1||h>12000)return;
    state.width=Math.round(w);state.height=Math.round(h);state.layers=[];state.history=[];state.future=[];state.docName="Untitled";state.adjustments={brightness:100,contrast:100,saturation:100};
    const bg=createLayer("Background");bg.canvas.getContext("2d").clearRect(0,0,w,h);state.zoom=Math.min(1,(stage.clientWidth-56)/w,(stage.clientHeight-56)/h);state.zoom=Math.max(.05,state.zoom);
    renderLayers();render();toast("Blank document created.");
  }
  function exportImage() {
    if (!state.width) {toast("Open an image first.");return;}
    const out=document.createElement("canvas");out.width=state.width;out.height=state.height;const o=out.getContext("2d");
    [...state.layers].sort((a,b)=>a.order-b.order).forEach(l=>{if(!l.visible)return;o.save();o.globalAlpha=l.opacity;o.globalCompositeOperation=l.blend;o.filter=l.id===state.selectedId?`brightness(${state.adjustments.brightness}%) contrast(${state.adjustments.contrast}%) saturate(${state.adjustments.saturation}%)`:"none";o.drawImage(l.canvas,0,0);o.restore();});
    const a=document.createElement("a");a.download=(state.docName||"pixora-export")+".png";a.href=out.toDataURL("image/png");a.click();toast("PNG export started.");
  }
  $("open-empty").addEventListener("click",()=>fileInput.click());$("file-input").addEventListener("change",e=>openFile(e.target.files[0]));
  $("new-empty").addEventListener("click",newDocument);$("export-btn").addEventListener("click",exportImage);
  $("add-layer").addEventListener("click",()=>{if(!state.width){newDocument();return;}snapshot();createLayer("Layer "+nextId);renderLayers();render();});
  $("duplicate-layer").addEventListener("click",()=>{const l=selectedLayer();if(!l)return toast("Select a layer first.");snapshot();const c=document.createElement("canvas");c.width=state.width;c.height=state.height;c.getContext("2d").drawImage(l.canvas,0,0);const n={...l,id:nextId++,name:l.name+" copy",canvas:c,order:Math.max(...state.layers.map(x=>x.order))+1};state.layers.push(n);state.selectedId=n.id;renderLayers();render();});
  $("delete-layer").addEventListener("click",()=>{const l=selectedLayer();if(!l)return;snapshot();state.layers=state.layers.filter(x=>x.id!==l.id);normalizeOrders();state.selectedId=state.layers.length?state.layers[state.layers.length-1].id:null;renderLayers();render();});
  $("layer-opacity").addEventListener("input",e=>{const l=selectedLayer();if(!l)return;l.opacity=Number(e.target.value)/100;$("opacity-value").textContent=e.target.value+"%";render();});
  $("layer-opacity").addEventListener("change",()=>{snapshot();renderLayers();});
  $("blend-mode").addEventListener("change",e=>{const l=selectedLayer();if(!l)return;snapshot();l.blend=e.target.value;render();renderLayers();});
  ["brightness","contrast","saturation"].forEach(key=>$(key).addEventListener("input",e=>{state.adjustments[key]=Number(e.target.value);$(key+"-value").textContent=e.target.value+"%";render();}));
  ["brightness","contrast","saturation"].forEach(key=>$(key).addEventListener("change",snapshot));
  $("reset-adjustments").addEventListener("click",()=>{snapshot();state.adjustments={brightness:100,contrast:100,saturation:100};syncControls();render();});
  $("zoom-in").addEventListener("click",()=>{state.zoom=Math.min(4,state.zoom*1.2);render();});$("zoom-out").addEventListener("click",()=>{state.zoom=Math.max(.05,state.zoom/1.2);render();});
  $("fit-btn").addEventListener("click",()=>{if(!state.width)return;state.zoom=Math.max(.05,Math.min(1,(stage.clientWidth-56)/state.width,(stage.clientHeight-56)/state.height));render();});
  document.querySelectorAll(".tool").forEach(btn=>btn.addEventListener("click",()=>{state.tool=btn.dataset.tool;document.querySelectorAll(".tool").forEach(b=>b.classList.toggle("active",b===btn));toast(btn.dataset.tool==="move"?"Move tool selected":btn.dataset.tool+" tool selected — tool implementation is coming in a later module.");}));
  document.querySelectorAll(".panel-tabs button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".panel-tabs button").forEach(b=>b.classList.toggle("selected",b===btn));$("layers-panel").classList.toggle("hidden",btn.dataset.panel!=="layers");$("properties-panel").classList.toggle("hidden",btn.dataset.panel!=="properties");}));
  document.querySelectorAll(".main-menu button").forEach(btn=>btn.addEventListener("click",()=>{const menu=btn.dataset.menu;if(menu==="File"){const choice=prompt("File menu: type OPEN, NEW, or EXPORT","OPEN");if(!choice)return;if(choice.toUpperCase()==="OPEN")fileInput.click();else if(choice.toUpperCase()==="NEW")newDocument();else if(choice.toUpperCase()==="EXPORT")exportImage();}else toast(menu+" menu actions will be expanded in later modules.");}));
  document.addEventListener("keydown",e=>{if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName))return;const k=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&k==="o"){e.preventDefault();fileInput.click();}else if((e.ctrlKey||e.metaKey)&&k==="s"){e.preventDefault();toast("Project-file saving is planned for the next foundation update.");}else if(k==="v")document.querySelector('[data-tool="move"]').click();else if(k==="b")document.querySelector('[data-tool="brush"]').click();else if(k==="e")document.querySelector('[data-tool="eraser"]').click();else if(k==="t")document.querySelector('[data-tool="text"]').click();else if(k==="c")document.querySelector('[data-tool="crop"]').click();});
  // Minimal drawing support for the Brush tool; full stroke history and eraser arrive with the tool module.
  function pointFromEvent(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/state.zoom,y:(e.clientY-r.top)/state.zoom};}
  canvas.addEventListener("pointerdown",e=>{if(!state.width||state.tool!=="brush")return;const l=selectedLayer();if(!l)return;snapshot();state.drawing=true;state.lastPoint=pointFromEvent(e);canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener("pointermove",e=>{if(!state.drawing||state.tool!=="brush")return;const p=pointFromEvent(e),l=selectedLayer(),c=l.canvas.getContext("2d");c.strokeStyle=$("brush-color").value;c.lineWidth=8/state.zoom;c.lineCap="round";c.lineJoin="round";c.beginPath();c.moveTo(state.lastPoint.x,state.lastPoint.y);c.lineTo(p.x,p.y);c.stroke();state.lastPoint=p;render();});
  canvas.addEventListener("pointerup",()=>{if(state.drawing){state.drawing=false;state.lastPoint=null;renderLayers();}});
  canvas.addEventListener("pointercancel",()=>{state.drawing=false;state.lastPoint=null;});
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }
  renderLayers();render();
})();