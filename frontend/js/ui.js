export const escapeHTML=(value='')=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const E=escapeHTML;
export const icons={
  arrow:'<path d="m5 12 14 0m-6-6 6 6-6 6"/>',arrowUp:'<path d="m12 19 0-14m-6 6 6-6 6 6"/>',
  arrowLeft:'<path d="M19 12H5m6 6-6-6 6-6"/>', chevron:'<path d="m9 18 6-6-6-6"/>',
  briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', map:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book:'<path d="M12 7c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V6c-4-1-7-1-10 1Zm0 0v14"/>',
  chart:'<path d="M4 19V5m0 14h17M8 15l4-4 3 2 5-7"/>',users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m0 3a5 5 0 0 1 4 5v1"/>',
  building:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h2m3 0h2M9 12h2m3 0h2M10 21v-5h4v5"/>',
  graduation:'<path d="m2 9 10-5 10 5-10 5-10-5Zm4 3v5c4 3 8 3 12 0v-5M22 9v7"/>',
  spark:'<path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3L12 2Z"/>',
  check:'<path d="m5 12 4 4L19 6"/>', close:'<path d="M6 6l12 12M18 6 6 18"/>',
  upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v4h16v-4"/>',
  download:'<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  filter:'<path d="M4 6h16M7 12h10m-7 6h4"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone:'<path d="M7 3h3l1 5-2 1c1.6 3 3 4.5 6 6l1-2 5 1v3a4 4 0 0 1-4 4C9 20 4 15 3 7a4 4 0 0 1 4-4Z"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  shield:'<path d="m12 2 9 4v6c0 5-4 8-9 10-5-2-9-5-9-10V6l9-4Z"/>',
  layers:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  refresh:'<path d="M20 7V3l-4 4h4c-4-5-12-4-15 2M4 17v4l4-4H4c4 5 12 4 15-2"/>',
  flag:'<path d="M5 22V4m0 0c5-3 8 3 14 0v11c-6 3-9-3-14 0"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9 7 7m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  star:'<path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1 3-6Z"/>',
  send:'<path d="m22 2-7 20-4-9-9-4 20-7Zm-11 11 11-11"/>',
  whatsapp:'<path d="M20 11a8 8 0 0 1-11 7l-5 2 2-5a8 8 0 1 1 14-4ZM9 9c1 3 3 5 6 6"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  edit:'<path d="m4 20 5-.5 11-11-4.5-4.5-11 11L4 20Zm9-13 4 4"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  lightbulb:'<path d="M8 16a7 7 0 1 1 8 0l-1 3H9l-1-3ZM9 22h6"/>',
};
export const icon=(name,size=19,extra='')=>`<svg ${extra} aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]||icons.spark}</svg>`;
export const money=(v)=>E(v||'A combinar');
export const date=(s)=>{if(!s)return 'A definir';let d=new Date(s.includes('T')?s:s+'T12:00:00');return Number.isNaN(d.getTime())?'A definir':d.toLocaleDateString('pt-BR')};
export const badge=(label,tone='soft')=>`<span class="badge ${tone}">${E(label)}</span>`;
export const empty=(title,body,action='')=>`<div class="empty-state">${icon('search',28)}<h3>${E(title)}</h3><p>${E(body)}</p>${action}</div>`;
export const loading=()=>'<div class="skeleton" style="min-height:200px"></div>';
export function toast(message,error=false){const el=document.createElement('div');el.className='toast'+(error?' error':'');el.innerHTML=`${icon(error?'info':'check')}<span>${E(message)}</span>`;document.getElementById('toast-region').append(el);setTimeout(()=>el.remove(),4800)}
export function openModal(content){const modal=document.createElement('div');modal.className='modal-backdrop';modal.id='active-modal';modal.innerHTML=`<div class="modal-panel" role="dialog" aria-modal="true"><button type="button" class="icon-button modal-close" data-modal-close aria-label="Fechar">${icon('close')}</button>${content}</div>`;document.getElementById('active-modal')?.remove();document.body.append(modal);modal.addEventListener('click',(e)=>{if(e.target===modal||e.target.closest('[data-modal-close]'))modal.remove()});document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){modal.remove();document.removeEventListener('keydown',esc)}});return modal;}
export const field=(label,name,value='',type='text',attrs='')=>`<label class="field"><span>${E(label)}</span><input type="${type}" name="${name}" value="${E(value)}" ${attrs}></label>`;
export const selectField=(label,name,items,current='')=>`<label class="field"><span>${E(label)}</span><select name="${name}">${items.map(x=>`<option value="${E(x)}" ${x===current?'selected':''}>${E(x)}</option>`).join('')}</select></label>`;
export const textareaField=(label,name,value='',rows=4)=>`<label class="field"><span>${E(label)}</span><textarea name="${name}" rows="${rows}">${E(value)}</textarea></label>`;
export const tags=(xs=[])=>xs.map(x=>`<span class="tag">${E(x)}</span>`).join('');
export const formData=(form)=>Object.fromEntries(new FormData(form).entries());
