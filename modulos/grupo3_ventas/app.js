const PRODUCTS = [
  {id:'prod-1',name:'Laptop Pro 14"',category:'Tecnología',price:4500000,stock:8},
  {id:'prod-2',name:'Mouse Inalámbrico',category:'Accesorios',price:85000,stock:25},
  {id:'prod-3',name:'Silla Ergonómica',category:'Mobiliario',price:650000,stock:4,badge:'stock_bajo'},
  {id:'prod-4',name:'Monitor 27"',category:'Tecnología',price:1250000,stock:0,badge:'agotado'},
  {id:'prod-5',name:'Teclado Mecánico',category:'Accesorios',price:320000,stock:12},
  {id:'prod-6',name:'Escritorio Ejecutivo',category:'Mobiliario',price:980000,stock:3,badge:'stock_bajo'}
];
const CLIENTS = [
  {id:'cli-1',name:'Carlos Rodríguez',documentType:'CC',documentNumber:'1.098.765.432',email:'carlos.rodriguez@gmail.com',affiliation:'Minorista'},
  {id:'cli-2',name:'María González',documentType:'CC',documentNumber:'52.345.678',email:'maria.gonzalez@gmail.com',affiliation:'Minorista'},
  {id:'cli-3',name:'Universidad Central',documentType:'NIT',documentNumber:'860.024.123-1',email:'compras@ucentral.edu.co',affiliation:'Empresa'},
  {id:'cli-4',name:'Distribuciones Andinas SAS',documentType:'NIT',documentNumber:'900.456.789-2',email:'ventas@disandinas.com',affiliation:'Mayorista'},
  {id:'cli-5',name:'Juan Pérez',documentType:'CC',documentNumber:'79.456.123',email:'juan.perez@gmail.com',affiliation:'Minorista'},
  {id:'cli-6',name:'Comercializadora del Norte',documentType:'NIT',documentNumber:'901.234.567-8',email:'admin@comnorte.com',affiliation:'Mayorista'}
];
const INITIAL_CLIENT=CLIENTS[0];
const INITIAL_CART_ITEMS=[
  {id:'cart-1',productId:'prod-1',name:'Laptop Pro 14"',category:'Tecnología',quantity:1,unitPrice:4500000,subtotal:4500000},
  {id:'cart-2',productId:'prod-2',name:'Mouse Inalámbrico',category:'Accesorios',quantity:1,unitPrice:85000,subtotal:85000},
  {id:'cart-3',productId:'prod-3',name:'Silla Ergonómica',category:'Mobiliario',quantity:2,unitPrice:650000,subtotal:1300000}
];

const state={
  activeView:'pos',clients:[...CLIENTS],client:INITIAL_CLIENT,products:PRODUCTS,selectedProduct:PRODUCTS[0],
  quantity:1,cartItems:[...INITIAL_CART_ITEMS],discountPercentage:0,paymentMethod:'Tarjeta',paymentStatus:'Aprobado',
  clientSearch:'',clientListOpen:false,productFilter:'',showClientError:false,toasts:[]
};

const money=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const icon=(name,size=16)=>`<i data-lucide="${name}" width="${size}" height="${size}"></i>`;

function summary(){
  const subtotal=state.cartItems.reduce((s,i)=>s+i.subtotal,0);
  const discountAmount=Math.round(subtotal*(state.discountPercentage/100));
  const taxableBase=Math.max(0,subtotal-discountAmount);
  const ivaAmount=Math.round(taxableBase*.19);
  return {subtotal,discountPercentage:state.discountPercentage,discountAmount,ivaPercentage:19,ivaAmount,total:taxableBase+ivaAmount};
}
function toast(type,title,description){
  const id='toast-'+Date.now()+Math.random();
  state.toasts=[...state.toasts.slice(-3),{id,type,title,description}]; renderToasts();
  setTimeout(()=>{state.toasts=state.toasts.filter(t=>t.id!==id);renderToasts()},4500);
}
function renderToasts(){
  const root=document.getElementById('toast-container');
  root.innerHTML=`<div class="toast-wrap">${state.toasts.map(t=>{
    const color=t.type==='success'?'#16a34a':t.type==='warning'?'#f59e0b':t.type==='error'?'#dc2626':'#003da6';
    const ic=t.type==='success'?'circle-check':t.type==='warning'?'triangle-alert':t.type==='error'?'circle-alert':'info';
    return `<div class="toast"><div class="toast-bar" style="background:${color}"></div><div class="toast-content"><div class="inline" style="align-items:flex-start;gap:10px">${icon(ic,16)}<div><div class="toast-title">${esc(t.title)}</div><div class="toast-desc">${esc(t.description)}</div></div></div><button class="icon-btn" onclick="removeToast('${t.id}')">${icon('x',14)}</button></div></div>`;
  }).join('')}</div>`;
  lucide.createIcons();
}
window.removeToast=id=>{state.toasts=state.toasts.filter(t=>t.id!==id);renderToasts()};

function render(){
  document.getElementById('app').innerHTML=`
  <div class="page">
    ${renderHeader()}
    ${state.activeView==='pos'?renderPOS():renderStates()}
    <footer>
      <div><strong style="color:#334155">Sistema de Gestión Ventas U Central</strong><span> · </span><span>Sistema POS Empresarial v2.4</span><span> · </span><span class="green">Resolución DIAN No. 18764000123</span></div>
      <div class="inline" style="gap:12px"><span>Resolución de pantalla: 1440x900</span><span class="code">CAJA-03-BOG</span></div>
    </footer>
  </div>`;
  bind();
  lucide.createIcons();
}
function renderHeader(){
 return `<header class="header">
   <div class="header-left"><div class="logo">UC</div><div><h1>Sistema de Gestión Ventas U Central</h1><p>Módulo Operativo de Ventas POS</p></div></div>
   <div class="header-right">
     <div class="meta"><strong>Vendedor: John Doe</strong><span>05/09/2026</span></div>
     <button class="btn primary" id="register-open">${icon('user-plus',14)} Registrar Usuario</button>
     <div class="view-tabs"><button class="${state.activeView==='pos'?'active':''}" id="view-pos">POS</button><button class="${state.activeView==='states'?'active':''}" id="view-states">Estados</button></div>
   </div>
 </header>`;
}
function renderPOS(){
 return `<main class="main-grid"><div>${renderSalesCard()}</div><div>${renderBillingCard()}</div></main>`;
}
function renderSalesCard(){
 const clients=state.clients.length?state.clients:CLIENTS;
 const q=state.clientSearch.trim().toLowerCase();
 const filteredClients=!q?clients:clients.filter(c=>(c.name||'').toLowerCase().includes(q)||(c.documentNumber||'').replace(/\./g,'').includes(q.replace(/\./g,''))||(c.documentType||'').toLowerCase().includes(q)||(c.affiliation||'').toLowerCase().includes(q));
 const pq=state.productFilter.trim().toLowerCase();
 const products=!pq?state.products:state.products.filter(p=>(p.name||'').toLowerCase().includes(pq)||(p.category||'').toLowerCase().includes(pq));
 return `<div class="card">
  <div class="card-head"><div class="step-title"><div class="step">1</div><h2>Datos de la Venta</h2></div><span class="step-tag">Paso 1 de 2</span></div>
  <div class="section">
   <div class="row-between" style="margin-bottom:6px"><label class="label" style="margin:0">Cliente (Selección o Búsqueda)</label><div class="inline" style="gap:6px"><button class="small-action" id="toggle-clients">${icon(state.clientListOpen?'chevron-up':'chevron-down',13)} ${state.clientListOpen?'Ocultar lista':`Ver disponibles (${clients.length})`}</button><button class="small-action gray" id="register-client">${icon('user-plus',12)} + Nuevo</button></div></div>
   ${state.client?`<div class="selected-client"><div class="client-main"><div class="client-info"><div class="avatar">${state.client.documentType==='NIT'?icon('building-2',15):esc((state.client.name||'CL').substring(0,2).toUpperCase())}</div><div class="client-info-text"><div class="inline" style="gap:8px;flex-wrap:wrap"><span class="client-name">${esc(state.client.name)}</span><span class="badge">${esc(state.client.affiliation||'Cliente')}</span></div><div class="client-detail"><strong style="color:#334155">${esc(state.client.documentType)}: ${esc(state.client.documentNumber)}</strong><span>·</span><span>${esc(state.client.email)}</span></div></div></div><div class="client-actions"><button class="icon-btn" id="change-client">${icon('users',13)} <span style="font-size:11px;font-weight:600">Cambiar</span></button><button class="icon-btn" id="remove-client">${icon('x',14)}</button></div></div></div>`:
   `<div class="warn"><span>${icon('circle-alert',15)} Sin cliente seleccionado. Elige uno de los disponibles:</span><button class="small-action" id="open-client-list">Abrir lista (${clients.length})</button></div>`}
   ${(!state.client||state.clientListOpen)?`<div class="client-list"><div class="input-wrap"><input id="client-search" class="search" value="${esc(state.clientSearch)}" placeholder="Filtrar por nombre o documento (opcional)...">${state.clientSearch?`<button class="icon-btn clear-search" id="clear-client-search">${icon('x',12)}</button>`:''}${icon('search',14)}</div><div class="list-title" style="margin-top:8px"><span>Lista de Clientes Disponibles (${filteredClients.length})</span><span>Clic para seleccionar directo</span></div><div class="client-scroll scroll">${filteredClients.length?filteredClients.map(c=>`<div class="client-option ${state.client?.id===c.id?'selected':''}" data-client="${c.id}"><div class="client-info"><div class="avatar">${c.documentType==='NIT'?icon('building-2',13):esc((c.name||'CL').substring(0,2).toUpperCase())}</div><div class="option-text"><div class="option-top"><span class="option-name">${esc(c.name)}</span><span class="badge">${esc(c.affiliation||'')}</span></div><div class="option-detail"><strong>${esc(c.documentType)} ${esc(c.documentNumber)}</strong> · ${esc(c.email)}</div></div></div>${state.client?.id===c.id?`<span class="active-pill">${icon('check',11)} Activo</span>`:'<span style="font-size:11px;font-weight:600;color:#003da6">Seleccionar</span>'}</div>`).join(''):'<div class="empty">No se encontraron clientes coincidentes.</div>'}</div></div>`:''}
   ${state.showClientError?`<div class="warn" style="margin-top:4px;color:#dc2626;background:#fff1f2;border-color:#fecdd3">${icon('circle-alert',14)} <span>Cliente no encontrado. Verifique el documento.</span><button class="btn" id="reset-client-error">Restablecer</button></div>`:''}
  </div>
  <div class="section"><label class="label">Filtrar Productos (Nombre o Categoría)</label><div class="input-wrap"><input id="product-filter" class="search" value="${esc(state.productFilter)}" placeholder="Ej: Tecnología, Mouse, Silla...">${state.productFilter?`<button class="icon-btn clear-search" id="clear-product-filter">${icon('x',12)}</button>`:''}${icon('search',15)}</div></div>
  <div style="flex:1;min-height:0;margin-bottom:16px"><div class="catalog-head"><span>Catálogo de Artículos</span><span>${products.length} productos</span></div><div class="product-scroll scroll">${products.map(p=>{const selected=state.selectedProduct?.id===p.id,out=p.stock===0||p.badge==='agotado',low=p.badge==='stock_bajo';return `<div class="product ${selected?'selected':''} ${out?'disabled':''}" data-product="${p.id}"><div style="min-width:0;flex:1"><div class="inline" style="gap:6px;flex-wrap:wrap"><span class="category">[${esc(p.category)}]</span>${low?`<span class="stock-low">${icon('triangle-alert',11)} Stock bajo</span>`:''}${out?`<span class="out">${icon('ban',11)} Agotado</span>`:''}</div><div class="product-name">${esc(p.name)}</div></div><div><div class="product-price">${money(p.price)}</div><div class="stock">Stock ${p.stock}</div></div>${selected?`<div style="position:absolute"></div>`:''}</div>`}).join('')}</div></div>
  <div class="stepper-row"><div class="row-between"><div><label class="label" style="margin:0">Cantidad</label><span style="font-size:11px;color:#64748b">${state.selectedProduct?`Disponible: ${state.selectedProduct.stock} unidades`:'Seleccione un producto'}</span></div><div class="stepper"><button id="qty-minus" ${!state.selectedProduct||state.quantity<=1?'disabled':''}>${icon('minus',14)}</button><input id="quantity" type="number" min="1" max="${state.selectedProduct?.stock||99}" value="${state.quantity}"><button id="qty-plus" ${!state.selectedProduct||state.selectedProduct.stock<=0||state.quantity>=state.selectedProduct.stock?'disabled':''}>${icon('plus',14)}</button></div></div><button class="add-btn" id="add-cart" style="margin-top:12px" ${!state.selectedProduct||state.selectedProduct.stock===0?'disabled':''}>${icon('shopping-cart',16)} + Agregar al Carrito</button></div>
 </div>`;
}
function renderBillingCard(){
 const s=summary();
 const methods=[['Efectivo','banknote'],['Tarjeta','credit-card'],['Transferencia','arrow-right-left'],['Otro','ellipsis']];
 const statuses=[['Aprobado','circle-check','status-approved'],['Pendiente','clock','status-pending'],['Rechazado','circle-x','status-rejected']];
 return `<div class="card"><div class="card-head"><div class="step-title"><div class="step">2</div><h2>Detalle de Facturación</h2></div><div class="inline" style="gap:8px"><span class="step-tag">${state.cartItems.length} ${state.cartItems.length===1?'artículo':'artículos'}</span>${state.cartItems.length===0?`<button class="small-action" id="reset-items">Restablecer 3 filas ejemplo</button>`:''}</div></div>
 <div class="cart-table-wrap"><table><thead><tr><th>Producto</th><th class="center">Cant.</th><th class="right">Precio Uni.</th><th class="right">Subtotal</th><th class="center">Acción</th></tr></thead><tbody>${state.cartItems.length?state.cartItems.map(i=>`<tr><td><strong>${esc(i.name)}</strong><div style="font-size:10px;color:#94a3b8;text-transform:uppercase">${esc(i.category)}</div></td><td class="center"><div class="inline-stepper"><button data-dec="${i.id}">${icon('minus',10)}</button><span>${i.quantity}</span><button data-inc="${i.id}">${icon('plus',10)}</button></div></td><td class="right">${money(i.unitPrice)}</td><td class="right"><strong>${money(i.subtotal)}</strong></td><td class="center"><button class="icon-btn" data-remove="${i.id}">${icon('trash-2',14)}</button></td></tr>`).join(''):`<tr><td colspan="5"><div class="empty">No hay productos en el detalle de facturación.<button class="btn" id="reset-items">Restablecer 3 filas de ejemplo</button></div></td></tr>`}</tbody></table></div>
 <div class="summary"><div class="summary-row"><span class="summary-label">Subtotal</span><strong>${money(s.subtotal)}</strong></div><div class="summary-row"><div class="inline"><span class="summary-label">Descuento</span><span class="discount-control"><input id="discount" type="number" min="0" max="100" value="${state.discountPercentage}">%</span></div><strong style="color:#b45309">- ${money(s.discountAmount)}</strong></div><div class="summary-row"><span class="summary-label">IVA (19%) <small style="color:#94a3b8">Tarifa general DIAN</small></span><strong>${money(s.ivaAmount)}</strong></div><div class="total-row"><div><strong style="text-transform:uppercase;font-size:12px">Total a Pagar</strong><div style="font-size:10px;color:#64748b">Moneda oficial (COP)</div></div><span class="total">${money(s.total)}</span></div></div>
 <div class="payment-grid"><div><label class="label">Método de Pago</label><div class="payment-buttons">${methods.map(([m,ic])=>`<button class="pay-btn ${state.paymentMethod===m?'active':''}" data-method="${m}">${icon(ic,14)} ${m}</button>`).join('')}</div></div><div><label class="label">Estado de Transacción</label><div class="payment-buttons three">${statuses.map(([m,ic,cl])=>`<button class="pay-btn ${cl} ${state.paymentStatus===m?'active':''}" data-status="${m}">${icon(ic,13)} ${m}</button>`).join('')}</div></div></div>
 <button class="confirm-btn" id="confirm-sale" ${state.cartItems.length===0?'disabled':''}>${icon('file-check-2',19)} Confirmar y Facturar</button></div>`;
}
function renderStates(){
 return `<div class="card" style="min-height:600px"><div class="card-head"><div class="step-title"><div class="step">A</div><h2>Estados y Componentes POS</h2></div><button class="btn primary" id="back-pos">Ir al POS</button></div><div style="padding:20px;color:#64748b;font-size:12px">Vista de estados del proyecto original.</div></div>`;
}

function bind(){
 document.getElementById('view-pos')?.addEventListener('click',()=>{state.activeView='pos';render()});
 document.getElementById('view-states')?.addEventListener('click',()=>{state.activeView='states';render()});
 document.getElementById('back-pos')?.addEventListener('click',()=>{state.activeView='pos';render()});
 document.getElementById('register-open')?.addEventListener('click',openRegister);
 document.getElementById('register-client')?.addEventListener('click',openRegister);
 document.getElementById('toggle-clients')?.addEventListener('click',()=>{state.clientListOpen=!state.clientListOpen;render()});
 document.getElementById('change-client')?.addEventListener('click',()=>{state.clientListOpen=!state.clientListOpen;render()});
 document.getElementById('remove-client')?.addEventListener('click',()=>{state.client=null;state.clientListOpen=true;render()});
 document.getElementById('open-client-list')?.addEventListener('click',()=>{state.clientListOpen=true;render()});
 document.getElementById('client-search')?.addEventListener('input',e=>{state.clientSearch=e.target.value;state.showClientError=state.clientSearch.trim().length>2&&!CLIENTS.some(c=>(c.name||'').toLowerCase().includes(state.clientSearch.toLowerCase())||(c.documentNumber||'').replace(/\./g,'').includes(state.clientSearch.replace(/\./g,'')));render()});
 document.getElementById('clear-client-search')?.addEventListener('click',()=>{state.clientSearch='';state.showClientError=false;render()});
 document.getElementById('reset-client-error')?.addEventListener('click',()=>{state.clientSearch='';state.showClientError=false;render()});
 document.querySelectorAll('[data-client]').forEach(el=>el.addEventListener('click',()=>{state.client=state.clients.find(c=>c.id===el.dataset.client);state.clientListOpen=false;state.showClientError=false;toast('info','Cliente Seleccionado',`${state.client.name} asignado a la venta`);render()}));
 document.getElementById('product-filter')?.addEventListener('input',e=>{state.productFilter=e.target.value;render()});
 document.getElementById('clear-product-filter')?.addEventListener('click',()=>{state.productFilter='';render()});
 document.querySelectorAll('[data-product]').forEach(el=>el.addEventListener('click',()=>{const p=PRODUCTS.find(x=>x.id===el.dataset.product);if(p&&p.stock>0){state.selectedProduct=p;state.quantity=1;render()}}));
 document.getElementById('qty-minus')?.addEventListener('click',()=>{if(state.quantity>1){state.quantity--;render()}});
 document.getElementById('qty-plus')?.addEventListener('click',()=>{if(state.selectedProduct&&state.quantity<state.selectedProduct.stock){state.quantity++;render()}});
 document.getElementById('quantity')?.addEventListener('change',e=>{let v=parseInt(e.target.value,10);if(!isNaN(v)&&v>=1){state.quantity=Math.min(v,state.selectedProduct?.stock||99);render()}});
 document.getElementById('add-cart')?.addEventListener('click',addToCart);
 document.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>removeCart(b.dataset.remove)));
 document.querySelectorAll('[data-dec]').forEach(b=>b.addEventListener('click',()=>updateQty(b.dataset.dec,getItem(b.dataset.dec).quantity-1)));
 document.querySelectorAll('[data-inc]').forEach(b=>b.addEventListener('click',()=>updateQty(b.dataset.inc,getItem(b.dataset.inc).quantity+1)));
 document.getElementById('reset-items')?.addEventListener('click',resetItems);
 document.getElementById('discount')?.addEventListener('change',e=>{let v=parseFloat(e.target.value);state.discountPercentage=isNaN(v)?0:Math.min(100,Math.max(0,v));render()});
 document.querySelectorAll('[data-method]').forEach(b=>b.addEventListener('click',()=>{state.paymentMethod=b.dataset.method;render()}));
 document.querySelectorAll('[data-status]').forEach(b=>b.addEventListener('click',()=>{state.paymentStatus=b.dataset.status;render()}));
 document.getElementById('confirm-sale')?.addEventListener('click',openConfirmation);
}
function getItem(id){return state.cartItems.find(i=>i.id===id)}
function addToCart(){
 if(!state.selectedProduct||state.selectedProduct.stock===0)return;
 const p=state.selectedProduct,i=state.cartItems.findIndex(x=>x.productId===p.id);
 if(i>-1){const item=state.cartItems[i],qty=item.quantity+state.quantity;state.cartItems[i]={...item,quantity:qty,subtotal:qty*item.unitPrice}}
 else state.cartItems.push({id:'cart-'+Date.now(),productId:p.id,name:p.name,category:p.category,quantity:state.quantity,unitPrice:p.price,subtotal:state.quantity*p.price});
 toast('info','Notificación',`"${p.name}" (${state.quantity} ${state.quantity===1?'unidad':'unidades'}) agregada al carrito`);state.quantity=1;render();
}
function removeCart(id){state.cartItems=state.cartItems.filter(i=>i.id!==id);toast('info','Notificación','Artículo eliminado del detalle');render()}
function updateQty(id,q){if(q<=0){removeCart(id);return}state.cartItems=state.cartItems.map(i=>i.id===id?{...i,quantity:q,subtotal:q*i.unitPrice}:i);render()}
function resetItems(){state.cartItems=INITIAL_CART_ITEMS.map(x=>({...x}));state.discountPercentage=0;state.paymentStatus='Aprobado';toast('info','Notificación','3 filas de ejemplo restauradas');render()}

function openRegister(){
 const root=document.getElementById('register-modal');root.classList.remove('hidden');
 root.innerHTML=`<div class="modal"><div class="modal-header"><div class="inline" style="gap:8px">${icon('user-plus',19)}<h3>Registrar Nuevo Usuario / Cliente</h3></div><button class="icon-btn" style="color:#fff" id="reg-close">${icon('x',15)}</button></div><form id="register-form" class="modal-body"><div class="form-group"><label>Nombre Completo *</label><input name="name" required placeholder="Ej: Juan Perez"></div><div class="form-grid"><div class="form-group"><label>Tipo Doc.</label><select name="docType"><option>CC</option><option>TI</option><option>CE</option><option>NIT</option></select></div><div class="form-group"><label>Número de Documento *</label><input name="docNumber" required placeholder="Ej: 1.098.765.432"></div></div><div class="form-group"><label>Correo Electrónico</label><input name="email" type="email" placeholder="Ej: usuario@gmail.com"></div><div class="form-group"><label>Tipo de Cliente</label><select name="affiliation"><option>Minorista</option><option>Mayorista</option><option>Empresa</option></select></div><div class="modal-footer" style="margin:0 -20px -20px"><button type="button" class="btn" id="reg-cancel">Cancelar</button><button class="btn primary" type="submit">${icon('check',14)} Guardar y Asignar</button></div></form></div>`;
 document.getElementById('reg-close').onclick=closeRegister;document.getElementById('reg-cancel').onclick=closeRegister;
 document.getElementById('register-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),name=f.get('name').trim(),doc=f.get('docNumber').trim();if(!name||!doc)return;const email=(f.get('email')||'').trim()||`${name.toLowerCase().replace(/\s+/g,'.')}@gmail.com`;const c={id:'cli-'+Date.now(),name,documentType:f.get('docType'),documentNumber:doc,email,affiliation:f.get('affiliation')};state.clients.unshift(c);state.client=c;toast('success','Cliente Registrado',`Usuario ${c.name} registrado y asignado`);closeRegister();render()};
 lucide.createIcons();
}
function closeRegister(){document.getElementById('register-modal').classList.add('hidden')}

function openConfirmation(){
 if(!state.cartItems.length)return;const root=document.getElementById('confirmation-modal');root.classList.remove('hidden');const s=summary();
 root.innerHTML=`<div class="modal"><div class="modal-header" style="background:#fff;color:#0f172a;border-bottom:1px solid #e2e8f0"><div class="inline" style="gap:8px">${icon('file-check-2',18)}<h3>Confirmar Venta</h3></div><button class="icon-btn" id="confirm-close">${icon('x',15)}</button></div><div class="modal-body"><p style="margin-top:0;font-size:12px;color:#64748b">Revise la información antes de confirmar y facturar.</p><div class="summary"><div class="summary-row"><span>Cliente</span><strong>${esc(state.client?.name||'Consumidor Final')}</strong></div><div class="summary-row"><span>Productos</span><strong>${state.cartItems.length} artículos</strong></div><div class="summary-row"><span>Subtotal</span><strong>${money(s.subtotal)}</strong></div><div class="summary-row"><span>Descuento</span><strong style="color:#b45309">-${money(s.discountAmount)}</strong></div><div class="summary-row"><span>IVA 19%</span><strong>${money(s.ivaAmount)}</strong></div><div class="total-row"><strong>Total a Pagar</strong><span class="total">${money(s.total)}</span></div></div><div style="font-size:12px"><strong>Método de pago:</strong> ${esc(state.paymentMethod)}<br><strong>Estado:</strong> ${esc(state.paymentStatus)}</div></div><div class="modal-footer"><button class="btn" id="confirm-cancel">Cancelar</button><button class="btn" id="confirm-ok" style="background:#16a34a;color:#fff;border-color:#16a34a">${icon('circle-check',14)} Confirmar y Facturar</button></div></div>`;
 document.getElementById('confirm-close').onclick=closeConfirmation;document.getElementById('confirm-cancel').onclick=closeConfirmation;
 document.getElementById('confirm-ok').onclick=()=>{closeConfirmation();openInvoice();toast('success','Venta Confirmada','Transacción liquidada y enviada a facturación DIAN.')};lucide.createIcons();
}
function closeConfirmation(){document.getElementById('confirmation-modal').classList.add('hidden')}

function openInvoice(){
 const root=document.getElementById('invoice-modal');root.classList.remove('hidden');const s=summary(),approved=state.paymentStatus==='Aprobado';
 root.innerHTML=`<div class="modal"><div class="modal-header" style="background:${approved?'#16a34a':state.paymentStatus==='Pendiente'?'#d97706':'#e11d48'}">${icon(approved?'circle-check':state.paymentStatus==='Pendiente'?'clock':'triangle-alert',19)}<h3 style="margin-left:8px;flex:1">${approved?'¡Venta Facturada Exitosamente!':`Transacción en Estado: ${esc(state.paymentStatus)}`}</h3><button class="icon-btn" style="color:#fff" id="invoice-close">${icon('x',15)}</button></div><div class="receipt"><div class="institution"><div class="uc">UC</div><h3>Sistema de Gestión Ventas U Central</h3><p>NIT: 860.024.123-1 · Régimen Común</p><p>Cra. 5 #21-38, Bogotá D.C. · Tel: (601) 323 9868</p><span class="invoice-number">Factura Electrónica N° POS-2026-0892</span></div><div class="meta-grid"><div><span>Cliente:</span><strong>${esc(state.client?state.client.name:'Consumidor Final')}</strong><span>${esc(state.client?`${state.client.documentType}: ${state.client.documentNumber}`:'CC: 222222222222')}</span></div><div class="right"><span>Fecha y Hora:</span><strong>05/09/2026 · 15:42</strong><span>Cajero: John Doe</span></div></div><table><thead><tr><th>Cant/Item</th><th class="right">V. Unit</th><th class="right">Total</th></tr></thead><tbody>${state.cartItems.map(i=>`<tr><td>${i.quantity}x ${esc(i.name)}</td><td class="right">${money(i.unitPrice)}</td><td class="right"><strong>${money(i.subtotal)}</strong></td></tr>`).join('')}</tbody></table><div style="border-top:1px solid #e2e8f0;padding-top:12px;margin-top:12px"><div class="summary-row"><span>Subtotal Gravable</span><span>${money(s.subtotal)}</span></div>${s.discountAmount>0?`<div class="summary-row" style="color:#b45309"><span>Descuento aplicado (${s.discountPercentage}%)</span><span>-${money(s.discountAmount)}</span></div>`:''}<div class="summary-row"><span>IVA General (19%)</span><span>${money(s.ivaAmount)}</span></div><div class="receipt-total"><span>Total Pagado:</span><strong>${money(s.total)}</strong></div></div><div style="margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px"><strong>Forma de Pago:</strong> ${esc(state.paymentMethod)}<br><span style="color:#047857;font-weight:600">Estado: ${esc(state.paymentStatus)}</span></div></div><div class="modal-footer"><button class="btn" id="invoice-print">${icon('printer',14)} Imprimir</button><div class="inline" style="gap:8px;margin-left:auto"><button class="btn" id="invoice-close2">Cerrar</button><button class="btn primary" id="new-sale">Nueva Venta</button></div></div></div>`;
 document.getElementById('invoice-close').onclick=closeInvoice;document.getElementById('invoice-close2').onclick=closeInvoice;document.getElementById('new-sale').onclick=()=>{closeInvoice();state.cartItems=[];state.discountPercentage=0;state.paymentStatus='Aprobado';toast('info','Notificación','Nueva venta iniciada');render()};document.getElementById('invoice-print').onclick=openPrint;lucide.createIcons();
}
function closeInvoice(){document.getElementById('invoice-modal').classList.add('hidden')}

function openPrint(){
 const root=document.getElementById('print-modal');root.classList.remove('hidden');const s=summary();
 root.innerHTML=`<div class="modal print-modal"><div class="print-controls"><strong>Vista de impresión</strong><span>Pág 1 de 1</span></div><div class="paper-area"><div class="paper"><div class="paper-head"><div class="uc" style="width:32px;height:32px;font-size:11px">UC</div><h4>SISTEMA DE GESTIÓN VENTAS U CENTRAL</h4><p>NIT: 860.024.123-1</p><p>Cra. 5 #21-38, Bogotá D.C. · Tel: (601) 323 9868</p><p>Resolución DIAN N° 18764000123 de 2026</p></div><div class="paper-line"><div class="paper-row"><strong>Factura de Venta:</strong><strong style="color:#003da6">FAC-000125</strong></div><div class="paper-row"><span>Fecha y hora:</span><span>05/09/2026 15:42</span></div><div class="paper-row"><span>Cliente:</span><span>${esc(state.client?.name||'Consumidor Final')}</span></div><div class="paper-row"><span>Doc / NIT:</span><span>${esc(state.client?`${state.client.documentType} ${state.client.documentNumber}`:'222222222222')}</span></div></div><div class="paper-line"><strong>Detalle</strong>${state.cartItems.map(i=>`<div class="paper-row"><span>${esc(i.name)} x${i.quantity}</span><strong>${money(i.subtotal)}</strong></div>`).join('')}</div><div class="paper-line"><div class="paper-row"><span>Subtotal Gravable:</span><span>${money(s.subtotal)}</span></div><div class="paper-row"><span>Descuento aplicado:</span><span>-${money(s.discountAmount)}</span></div><div class="paper-row"><span>IVA General (19%):</span><span>${money(s.ivaAmount)}</span></div><div class="paper-row paper-total"><span>Total a Pagar:</span><span style="color:#003da6">${money(s.total)}</span></div></div><div style="text-align:center"><strong>Forma de Pago: ${esc(state.paymentMethod)}</strong><p>CUFE: b91f...982a</p></div></div></div><div class="print-footer"><button class="btn" id="print-cancel">Cerrar</button><button class="btn primary" id="print-now">${icon('printer',14)} Imprimir</button></div></div>`;
 document.getElementById('print-cancel').onclick=closePrint;document.getElementById('print-now').onclick=()=>{window.print();closePrint()};lucide.createIcons();
}
function closePrint(){document.getElementById('print-modal').classList.add('hidden')}

render();
toast('info','Sistema POS Activo','Pantalla 1440x900 · Sistema de Gestión Ventas U Central (Secciones A - E listas).');
