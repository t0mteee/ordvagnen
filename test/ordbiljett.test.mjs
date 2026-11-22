import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync, statSync} from "node:fs";

const html = readFileSync(new URL("../index.html",import.meta.url),"utf8");
const kod = html.slice(html.indexOf("const biljettOrd ="),html.indexOf("/* ── Byt värld"));
function prov(){
  const p = {}, spelade = [];
  function element(){
    const delar = new Map();
    return {barn:[], style:{}, focus(){}, showModal(){this.open=true;},close(){this.open=false;this.onclose?.();},setAttribute(){}, append(k){this.barn.push(k);},
      replaceChildren(){this.barn=[];delar.clear();},
      getBoundingClientRect:()=>({left:0,right:50,top:0,bottom:50}),
      setPointerCapture(){},hasPointerCapture:()=>true,
      querySelector(s){if(!delar.has(s)) delar.set(s,element());return delar.get(s);}
    };
  }
  const ruta = element();
  const dialog=element(), tillbaka=element(), start=element();
  const c=vm.createContext({P:()=>p, aktivSkarm:"trip",speak(){},tystna(){},el:id=>({bokrum:dialog,bokyta:ruta,lamnaBok:tillbaka,ordbiljett:start})[id], saveProfiles(){}, shuffle(){},
    document:{createElement:element},Audio:class{
      constructor(src){this.src=src;} pause(){} play(){spelade.push(this.src);return Promise.resolve();}
    }});
  vm.runInContext(kod,c);
  c.visaBiljettknapp(false); start.barn[0].onclick();
  assert.equal(dialog.open,true);
  assert.equal(tillbaka.textContent,"← Till kartan");
  assert.equal(p.ordbiljetter,undefined);
  ruta.querySelector(".bokstavskort").onclick();
  assert.equal(p.bokkort,1);
  ruta.querySelector(".bokval").querySelector(".stava").onclick();
  return {p,ruta,c,spelade};
}
test("ordbiljetten kan dras och tryckas, fel ger en ny chans",()=>{
  const {ruta,p,spelade}=prov();
  const [s,o,l]=ruta.querySelector(".brickor").barn;
  o.onclick({detail:1}); assert.equal(p.ordbiljetter,undefined);
  s.onpointerdown({clientX:75,clientY:0}); s.onpointermove({clientX:20,clientY:20});
  s.onpointerup({clientX:20,clientY:20}); s.onclick({detail:1});
  o.onclick({detail:0}); l.onclick({detail:1});
  assert.equal(p.ordbiljetter,1); assert.match(ruta.barn[0].textContent,/Stämplad/);
  assert.equal(spelade.at(-1),"./ljud/ord/sol.m4a");
});
test("sex skrivna biljetter ger sex ord med ljud och sparar framstegen",()=>{
  const {ruta,p,c,spelade}=prov();
  for(const [i,ord] of ["sol","mus","ros","bil","hus","sko"].entries()){
    c.oppnaOrdbiljett(ruta);
    assert.ok(statSync(new URL("../"+spelade.at(-1),import.meta.url)).size>1000);
    ruta.querySelector("input").value=ord.toUpperCase();
    ruta.querySelector("form").onsubmit({preventDefault(){}});
    assert.equal(p.ordbiljetter,i+1);
  }
});
