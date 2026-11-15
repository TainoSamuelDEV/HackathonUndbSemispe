const STORE_KEY='conecta_slz_demo_token';
export const getToken=()=>localStorage.getItem(STORE_KEY);
export function setToken(token){if(token)localStorage.setItem(STORE_KEY,token);else localStorage.removeItem(STORE_KEY)}
export async function api(path,options={}){
  const headers={'Content-Type':'application/json',...options.headers};
  if(getToken())headers.Authorization=`Bearer ${getToken()}`;
  let response;
  try{response=await fetch('/api'+path,{...options,headers});}catch{throw new Error('Não foi possível conectar ao servidor. Verifique se a API está em execução.');}
  let payload;
  try{payload=await response.json()}catch{payload={detail:'Resposta inválida do servidor.'}}
  if(!response.ok){throw new Error(typeof payload.detail==='string'?payload.detail:JSON.stringify(payload.detail||'Não foi possível concluir a solicitação.'))}
  return payload;
}
export const get=(p)=>api(p);
export const post=(p,data)=>api(p,{method:'POST',body:JSON.stringify(data)});
export const put=(p,data)=>api(p,{method:'PUT',body:JSON.stringify(data)});
export const patch=(p,data)=>api(p,{method:'PATCH',body:JSON.stringify(data)});
